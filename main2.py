from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
from sklearn.cluster import MiniBatchKMeans
from concurrent.futures import ThreadPoolExecutor
import base64
from io import BytesIO
import uuid
from datetime import datetime, timedelta
import threading
import asyncio
from typing import List
import io
import logging
import time

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diccionario para almacenar los datos de cada sesión
session_data = {}
session_lock = threading.Lock()

class SessionData:
    def __init__(self, image_data: bytes):
        self.id = str(uuid.uuid4())
        self.image_data = image_data
        self.created_at = datetime.now()
        self.processed_images = []

def limpiar_sesiones_antiguas():
    with session_lock:
        tiempo_actual = datetime.now()
        sesiones_a_eliminar = []
        for session_id, data in session_data.items():
            if tiempo_actual - data.created_at > timedelta(hours=1):
                sesiones_a_eliminar.append(session_id)
        for session_id in sesiones_a_eliminar:
            del session_data[session_id]

async def limpiar_sesiones_periodicamente():
    while True:
        limpiar_sesiones_antiguas()
        await asyncio.sleep(3600)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(limpiar_sesiones_periodicamente())

def process_single_kmeans(args):
    """Procesa un solo clustering - para paralelización"""
    dataset, k, shape = args
    start_time = time.time()
    logger.info(f"Iniciando clustering con k={k}")
    
    try:
        # Usar MiniBatchKMeans para mejor rendimiento
        modelo_cluster = MiniBatchKMeans(
            n_clusters=k,
            batch_size=1024,
            random_state=42,
            max_iter=300  # Aumentar iteraciones para mejor convergencia
        )
        
        # Fit y predict en una sola operación
        etiquetas = modelo_cluster.fit_predict(dataset)
        logger.info(f"K-means completado para k={k}")
        
        centroides = modelo_cluster.cluster_centers_
        
        # Asegurarnos que los valores estén en el rango correcto
        centroides = np.clip(centroides * 255, 0, 255)
        
        # Crear imagen resultante
        resultado = centroides[etiquetas].reshape(shape)
        
        # Asegurar que la imagen esté en el rango correcto
        img_resultado = np.clip(resultado, 0, 255).astype(np.uint8)
        
        # Convertir a BGR para cv2
        img_resultado = cv2.cvtColor(img_resultado, cv2.COLOR_RGB2BGR)
        
        # Convertir a base64
        _, buffer = cv2.imencode('.jpg', img_resultado, [cv2.IMWRITE_JPEG_QUALITY, 85])
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        process_time = time.time() - start_time
        logger.info(f"Clustering k={k} completado en {process_time:.2f} segundos")
        
        return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        logger.error(f"Error en clustering k={k}: {str(e)}")
        raise

def process_image_with_kmeans(image_array: np.ndarray, n_clusters: int) -> List[str]:
    """Procesa la imagen usando K-means de forma optimizada"""
    start_time = time.time()
    logger.info(f"Iniciando procesamiento de imagen con {n_clusters} clusters")
    
    try:
        # Convertir BGR a RGB
        image_rgb = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
        logger.info(f"Dimensiones originales: {image_rgb.shape}")
        
        # Reducir tamaño de imagen si es muy grande
        max_dimension = 800
        height, width = image_rgb.shape[:2]
        if max(height, width) > max_dimension:
            scale = max_dimension / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image_rgb = cv2.resize(image_rgb, (new_width, new_height))
            logger.info(f"Imagen redimensionada a: {image_rgb.shape}")
        
        # Obtener dimensiones finales y preparar datos
        height, width, channels = image_rgb.shape
        
        # Normalizar la imagen a float32 entre 0 y 1
        dataset = image_rgb.astype(np.float32) / 255.0
        dataset = dataset.reshape(-1, channels)
        logger.info(f"Dataset preparado con forma: {dataset.shape}")
        
        # Preparar argumentos para procesamiento paralelo
        args_list = [(dataset, k, image_rgb.shape) for k in range(2, n_clusters + 1)]
        num_workers = min(n_clusters-1, 4)
        logger.info(f"Iniciando procesamiento paralelo con {num_workers} workers")
        
        # Procesar en paralelo
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            processed_images = list(executor.map(process_single_kmeans, args_list))
        
        total_time = time.time() - start_time
        logger.info(f"Procesamiento completo en {total_time:.2f} segundos")
        
        return processed_images
    except Exception as e:
        logger.error(f"Error en procesamiento: {str(e)}")
        raise

@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        # Crear nueva sesión
        session = SessionData(contents)
        
        # Convertir imagen a array de numpy
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="No se pudo procesar la imagen")
        
        # Guardar sesión
        with session_lock:
            session_data[session.id] = session
        
        return {
            "message": "Imagen cargada correctamente",
            "session_id": session.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process-image/{session_id}")
async def process_image(
    session_id: str, 
    steps: int = Query(..., description="Número de clusters para K-means", ge=2, le=100)  # Aumentado a 100
):
    try:
        logger.info(f"Recibida solicitud de procesamiento para sesión {session_id}")
        start_time = time.time()
        
        with session_lock:
            session = session_data.get(session_id)
            if not session:
                logger.error(f"Sesión {session_id} no encontrada")
                raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        logger.info(f"Iniciando procesamiento con {steps} steps")
        
        # Procesar imagen en un thread separado
        def process():
            nparr = np.frombuffer(session.image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                logger.error("No se pudo decodificar la imagen")
                raise ValueError("No se pudo procesar la imagen")
            logger.info(f"Imagen decodificada con forma: {img.shape}")
            return process_image_with_kmeans(img, steps)
        
        # Ejecutar procesamiento
        with ThreadPoolExecutor() as executor:
            processed_images = await asyncio.get_event_loop().run_in_executor(
                executor, process
            )
        
        # Guardar resultados
        session.processed_images = processed_images
        
        total_time = time.time() - start_time
        logger.info(f"Procesamiento completo en {total_time:.2f} segundos")
        
        return {"images": processed_images}
        
    except Exception as e:
        logger.error(f"Error en endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 