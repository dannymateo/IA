from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Body, Form
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
from sklearn.naive_bayes import GaussianNB
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis, QuadraticDiscriminantAnalysis
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
import json

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
    """
    Clase para manejar los datos de sesión de cada usuario
    Almacena datos temporales y mantiene el estado de la sesión
    """
    def __init__(self, data: bytes, session_type: str):
        self.id = str(uuid.uuid4())
        self.data = data
        self.created_at = datetime.now()
        self.session_type = session_type
        self.last_accessed = datetime.now()
        self.is_processing = False
        self.processed_images = []
        self.active = True

    def update_access(self):
        """Actualiza el timestamp de último acceso"""
        self.last_accessed = datetime.now()

    def is_valid(self) -> bool:
        """Verifica si la sesión es válida"""
        return self.active and datetime.now() - self.last_accessed < timedelta(hours=1)

async def get_session(session_id: str, session_type: str = None) -> SessionData:
    """Obtiene y valida una sesión"""
    session = session_data.get(session_id)
    
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Sesión no encontrada"
        )

    if not session.is_valid():
        del session_data[session_id]
        raise HTTPException(
            status_code=404,
            detail="Sesión expirada"
        )

    if session_type and session.session_type != session_type:
        raise HTTPException(
            status_code=400,
            detail="Tipo de sesión incorrecto"
        )

    session.update_access()
    return session

@app.post("/cleanup-session/{session_id}")
async def cleanup_session(session_id: str):
    try:
        session = session_data.get(session_id)
        if session:
            session.active = False
            if session.is_processing:
                session.is_processing = False
            logger.info(f"Sesión {session_id} marcada para limpieza")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error al limpiar sesión: {e}")
        return {"status": "error"}

async def limpiar_sesiones_antiguas():
    """Limpia sesiones inactivas o expiradas"""
    while True:
        try:
            tiempo_actual = datetime.now()
            for session_id, session in list(session_data.items()):
                if (not session.active and tiempo_actual - session.last_accessed > timedelta(minutes=5)) or \
                   (tiempo_actual - session.last_accessed > timedelta(hours=1)):
                    del session_data[session_id]
                    logger.info(f"Sesión {session_id} eliminada")
            await asyncio.sleep(300)  # Revisar cada 5 minutos
        except Exception as e:
            logger.error(f"Error en limpieza de sesiones: {e}")
            await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(limpiar_sesiones_antiguas())

# Funciones del sistema experto
def cargar_datos_desde_excel(archivo_excel):
    """
    Carga y preprocesa datos desde un archivo Excel/CSV
    
    Args:
        archivo_excel: Archivo en formato bytes o path
    Returns:
        DataFrame procesado o None si hay error
    """
    try:
        if isinstance(archivo_excel, bytes):
            df = pd.read_csv(io.BytesIO(archivo_excel))
        else:
            df = pd.read_csv(archivo_excel)
        
        df.columns = df.columns.str.strip()
        
        if df.empty:
            raise ValueError("El DataFrame está vacío.")
        
        return df
    except Exception as e:
        logger.error(f"Error al cargar el archivo: {e}")
        return None

def entrenar_modelo_knn(df):
    """
    Entrena múltiples modelos de clasificación y evalúa su precisión
    
    Args:
        df: DataFrame con datos de entrenamiento
    Returns:
        tuple: (modelos entrenados, precisión de cada modelo, scaler)
    """
    try:
        X = df.iloc[:, :-1]
        y = df.iloc[:, -1]
        
        # División de datos en entrenamiento y prueba
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=751)
        
        # Para mejorar la escala de los datos
        scaler = MinMaxScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)
        
        modelos = {
            'knn': KNeighborsClassifier(n_neighbors=3),
            'bayes': GaussianNB(),
            'lda': LinearDiscriminantAnalysis(),
            'qda': QuadraticDiscriminantAnalysis(),
            'tree': DecisionTreeClassifier(),
            'svm': SVC()
        }
        
        accuracies = {}
        for nombre, modelo in modelos.items():
            modelo.fit(X_train, y_train)
            accuracies[nombre] = float(modelo.score(X_test, y_test))
        
        return modelos, accuracies, scaler
    except Exception as e:
        logger.error(f"Error al entrenar los modelos: {e}")
        return None, None, None

# Funciones de procesamiento de imágenes
def process_single_kmeans(args):
    """
    Procesa una imagen con K-means para un valor específico de k
    
    Args:
        args: tupla (dataset, k, shape)
    Returns:
        str: imagen procesada en formato base64
    """
    dataset, k, shape = args
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

# Rutas del sistema clasificador
@app.post("/classifier/upload/")
async def upload_classifier_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        session = SessionData(contents, 'classifier')
        
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

@app.post("/classifier/predict/{session_id}")
async def predict_classifier(session_id: str, respuestas: List[float]):
    """
    Endpoint para realizar predicciones usando los modelos entrenados
    """
    try:
        with session_lock:
            session = session_data.get(session_id)
            if not session or session.session_type != 'classifier':
                raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        df = cargar_datos_desde_excel(session.data)
        if df is None:
            raise HTTPException(status_code=400, detail="Error al cargar los datos")
        
        if not hasattr(session, 'modelos') or session.modelos is None:
            modelos, accuracies, scaler = entrenar_modelo_knn(df)
            if modelos is None:
                raise HTTPException(status_code=500, detail="Error al entrenar los modelos")
            session.modelos = modelos
            session.accuracies = accuracies
            session.scaler = scaler
        
        respuestas_norm = session.scaler.transform([respuestas])
        
        predicciones = {}
        for nombre, modelo in session.modelos.items():
            pred_valor = int(modelo.predict(respuestas_norm)[0])
            predicciones[nombre] = {
                "mensaje": "Posible caso de diabetes" if pred_valor == 1 else "No se detecta diabetes",
                "valor": pred_valor,
                "accuracy": session.accuracies[nombre]
            }
        
        votos_positivos = sum(1 for pred in predicciones.values() if pred["valor"] == 1)
        prediccion_final = "Posible caso de diabetes" if votos_positivos > len(predicciones)/2 else "No se detecta diabetes"
        
        return {
            "decision": prediccion_final,
            "predicciones_por_modelo": predicciones
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Rutas del sistema experto
@app.post("/expert-system/upload/")
async def upload_expert_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        session = SessionData(contents, 'expert')
        
        # Aquí asumimos que el archivo es Excel y tiene el formato correcto para el sistema experto
        df = pd.read_excel(io.BytesIO(contents))
        if df.empty:
            raise HTTPException(status_code=400, detail="El archivo está vacío")
            
        preguntas = df.columns[:-1].tolist()
        
        with session_lock:
            session_data[session.id] = session
        
        return {
            "message": "Base de conocimiento cargada correctamente",
            "session_id": session.id,
            "questions": preguntas
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/expert-system/get-questions/")
async def get_questions(file: UploadFile = File(...)):
    """Endpoint para obtener las preguntas del archivo"""
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="El archivo está vacío")
            
        preguntas = df.columns[:-1].tolist()
        
        return {
            "questions": preguntas
        }
    except Exception as e:
        logger.error(f"Error al procesar archivo: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/expert-system/predict/")
async def predict_expert(
    file: UploadFile = File(...),
    answers: str = Form(...)
):
    """Endpoint para procesar respuestas y obtener predicción"""
    try:
        # Leer el archivo y las respuestas
        contents = await file.read()
        answers_array = json.loads(answers)
        
        # Validar el archivo
        df = pd.read_excel(io.BytesIO(contents))
        if df.empty:
            raise HTTPException(status_code=400, detail="Error al cargar la base de conocimiento")

        # Validar que el número de respuestas coincida con las columnas
        if len(answers_array) != len(df.columns) - 1:
            raise HTTPException(
                status_code=400, 
                detail="El número de respuestas no coincide con las preguntas del archivo"
            )

        # Preprocesar los datos
        df_procesado = df.copy()
        label_encoder = LabelEncoder()
        df_procesado['Decisión'] = label_encoder.fit_transform(df['Decisión'])

        # Separar características y etiquetas
        X = df_procesado.iloc[:, :-1]
        y = df_procesado.iloc[:, -1]

        # Entrenar y predecir
        knn = KNeighborsClassifier(n_neighbors=3)
        knn.fit(X, y)
        
        respuestas_array = np.array(answers_array).reshape(1, -1)
        decision_codificada = knn.predict(respuestas_array)
        decision = label_encoder.inverse_transform(decision_codificada)

        # Calcular confianza
        probabilidades = knn.predict_proba(respuestas_array)[0]
        max_prob = max(probabilidades)
        nivel_confianza = "alta" if max_prob > 0.8 else "media" if max_prob > 0.6 else "baja"
        
        return {
            "decision": decision[0],
            "confianza": {
                "nivel": nivel_confianza,
                "valor": float(max_prob)
            }
        }
        
    except Exception as e:
        logger.error(f"Error en predicción: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Rutas de procesamiento de imágenes
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        if not contents:
            raise HTTPException(status_code=400, detail="Archivo vacío")
            
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Formato de imagen no válido")
            
        session = SessionData(contents, 'image')
        logger.info(f"Nueva sesión creada: {session.id}")
        
        with session_lock:
            session_data[session.id] = session
            
        return {
            "message": "Imagen cargada correctamente",
            "session_id": session.id,
            "status": "ready"
        }
    except Exception as e:
        logger.error(f"Error en upload-image: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))

class ImageProcessor:
    def __init__(self):
        self.processing_lock = asyncio.Lock()

    async def process_image(self, image_data: bytes, steps: int) -> dict:
        """Procesa una imagen sin depender de sesiones"""
        async with self.processing_lock:
            try:
                nparr = np.frombuffer(image_data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is None:
                    raise ValueError("No se pudo procesar la imagen")
                
                processed_images = process_image_with_kmeans(img, steps)
                
                return {
                    "images": processed_images,
                    "status": "success"
                }
                
            except Exception as e:
                logger.error(f"Error procesando imagen: {e}")
                raise HTTPException(status_code=500, detail=str(e))

# Instancia global del procesador
image_processor = ImageProcessor()

@app.post("/process-image/")
async def process_image(
    file: UploadFile = File(...),
    steps: int = Query(..., description="Número de clusters para K-means", ge=2, le=100)
):
    """Endpoint unificado para subir y procesar imagen"""
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Archivo vacío")
            
        result = await image_processor.process_image(contents, steps)
        return result
        
    except Exception as e:
        logger.error(f"Error en process-image: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classifier/get-parameters/")
async def get_classifier_parameters(file: UploadFile = File(...)):
    """Endpoint para obtener los parámetros a analizar del archivo"""
    try:
        contents = await file.read()
        df = cargar_datos_desde_excel(contents)
        
        if df is None:
            raise HTTPException(status_code=400, detail="Error al cargar el archivo")
            
        parametros = df.columns[:-1].tolist()
        
        return {
            "message": "Parámetros obtenidos correctamente",
            "parameters": parametros
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/classifier/analyze/")
async def analyze_classifier(
    file: UploadFile = File(...),
    answers: str = Form(...)
):
    """Endpoint para analizar las respuestas y obtener predicciones"""
    try:
        contents = await file.read()
        respuestas = json.loads(answers)
        
        df = cargar_datos_desde_excel(contents)
        if df is None:
            raise HTTPException(status_code=400, detail="Error al cargar el archivo")

        # Entrenar modelos
        modelos, accuracies, scaler = entrenar_modelo_knn(df)
        if modelos is None:
            raise HTTPException(status_code=500, detail="Error al entrenar los modelos")

        # Procesar respuestas
        respuestas_norm = scaler.transform([respuestas])
        
        predicciones = {}
        for nombre, modelo in modelos.items():
            pred_valor = int(modelo.predict(respuestas_norm)[0])
            predicciones[nombre] = {
                "mensaje": "Posible caso de diabetes" if pred_valor == 1 else "No se detecta diabetes",
                "valor": pred_valor,
                "accuracy": accuracies[nombre]
            }
        
        votos_positivos = sum(1 for pred in predicciones.values() if pred["valor"] == 1)
        prediccion_final = "Posible caso de diabetes" if votos_positivos > len(predicciones)/2 else "No se detecta diabetes"
        
        return {
            "decision": prediccion_final,
            "predicciones_por_modelo": predicciones
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 