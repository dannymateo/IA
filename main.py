from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import cv2
from sklearn.neighbors import KNeighborsClassifier
from sklearn.cluster import MiniBatchKMeans
from sklearn.preprocessing import LabelEncoder
from concurrent.futures import ThreadPoolExecutor
import base64
from typing import List
import io
import uuid
from datetime import datetime, timedelta
import asyncio
import threading
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
    def __init__(self, data: bytes, session_type: str):
        self.id = str(uuid.uuid4())
        self.data = data
        self.created_at = datetime.now()
        self.session_type = session_type  # 'excel' o 'image'
        # Para sistema experto
        self.modelo_knn = None
        self.label_encoder = None
        # Para procesamiento de imágenes
        self.processed_images = []

# ... Mantener las funciones de limpieza de sesiones existentes ...
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

# Funciones del sistema experto
def cargar_datos_desde_excel(archivo_excel):
    try:
        if isinstance(archivo_excel, bytes):
            df = pd.read_excel(io.BytesIO(archivo_excel))
        else:
            df = pd.read_excel(archivo_excel)
        
        df.columns = df.columns.str.strip()
        
        if df.empty:
            raise ValueError("El DataFrame está vacío.")
        
        return df
    except Exception as e:
        logger.error(f"Error al cargar el archivo Excel: {e}")
        return None

def entrenar_modelo_knn(df):
    try:
        X = df.iloc[:, :-1]
        y = df.iloc[:, -1]
        
        modelo_knn = KNeighborsClassifier(n_neighbors=3)
        label_encoder = LabelEncoder()
        y_encoded = label_encoder.fit_transform(y)
        
        modelo_knn.fit(X, y_encoded)
        
        return modelo_knn, label_encoder
    except Exception as e:
        logger.error(f"Error al entrenar el modelo: {e}")
        return None, None

# Funciones de procesamiento de imágenes
def process_single_kmeans(args):
    # ... Mantener la función existente ...
    dataset, k, shape = args
    start_time = time.time()
    logger.info(f"Iniciando clustering con k={k}")
    
    try:
        modelo_cluster = MiniBatchKMeans(
            n_clusters=k,
            batch_size=1024,
            random_state=42,
            max_iter=300
        )
        
        etiquetas = modelo_cluster.fit_predict(dataset)
        centroides = modelo_cluster.cluster_centers_
        centroides = np.clip(centroides * 255, 0, 255)
        resultado = centroides[etiquetas].reshape(shape)
        img_resultado = np.clip(resultado, 0, 255).astype(np.uint8)
        img_resultado = cv2.cvtColor(img_resultado, cv2.COLOR_RGB2BGR)
        
        _, buffer = cv2.imencode('.jpg', img_resultado, [cv2.IMWRITE_JPEG_QUALITY, 85])
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        logger.error(f"Error en clustering k={k}: {str(e)}")
        raise

def process_image_with_kmeans(image_array: np.ndarray, n_clusters: int) -> List[str]:
    # ... Mantener la función existente ...
    start_time = time.time()
    logger.info(f"Iniciando procesamiento de imagen con {n_clusters} clusters")
    
    try:
        image_rgb = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
        
        max_dimension = 800
        height, width = image_rgb.shape[:2]
        if max(height, width) > max_dimension:
            scale = max_dimension / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image_rgb = cv2.resize(image_rgb, (new_width, new_height))
        
        height, width, channels = image_rgb.shape
        dataset = image_rgb.astype(np.float32) / 255.0
        dataset = dataset.reshape(-1, channels)
        
        args_list = [(dataset, k, image_rgb.shape) for k in range(2, n_clusters + 1)]
        num_workers = min(n_clusters-1, 4)
        
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            processed_images = list(executor.map(process_single_kmeans, args_list))
        
        return processed_images
    except Exception as e:
        logger.error(f"Error en procesamiento: {str(e)}")
        raise

# Rutas del sistema experto
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        session = SessionData(contents, 'excel')
        
        df = cargar_datos_desde_excel(contents)
        if df is None:
            raise HTTPException(status_code=400, detail="Error al cargar el archivo")
            
        preguntas = df.columns[:-1].tolist()
        
        with session_lock:
            session_data[session.id] = session
        
        return {
            "message": "Archivo cargado correctamente",
            "session_id": session.id,
            "questions": preguntas
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/predict/{session_id}")
async def predict(session_id: str, respuestas: List[int]):
    try:
        with session_lock:
            session = session_data.get(session_id)
            if not session or session.session_type != 'excel':
                raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        df = cargar_datos_desde_excel(session.data)
        if df is None:
            raise HTTPException(status_code=400, detail="Error al cargar los datos")
            
        if session.modelo_knn is None or session.label_encoder is None:
            modelo_knn, label_encoder = entrenar_modelo_knn(df)
            if modelo_knn is None:
                raise HTTPException(status_code=500, detail="Error al entrenar el modelo")
            session.modelo_knn = modelo_knn
            session.label_encoder = label_encoder
        
        prediccion_encoded = session.modelo_knn.predict([respuestas])
        prediccion = session.label_encoder.inverse_transform(prediccion_encoded)
        
        return {"decision": prediccion[0]}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Rutas de procesamiento de imágenes
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        session = SessionData(contents, 'image')
        
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="No se pudo procesar la imagen")
        
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
    steps: int = Query(..., description="Número de clusters para K-means", ge=2, le=100)
):
    try:
        with session_lock:
            session = session_data.get(session_id)
            if not session or session.session_type != 'image':
                raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        def process():
            nparr = np.frombuffer(session.data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("No se pudo procesar la imagen")
            return process_image_with_kmeans(img, steps)
        
        with ThreadPoolExecutor() as executor:
            processed_images = await asyncio.get_event_loop().run_in_executor(
                executor, process
            )
        
        session.processed_images = processed_images
        
        return {"images": processed_images}
        
    except Exception as e:
        logger.error(f"Error en endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 