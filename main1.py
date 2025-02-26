from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import LabelEncoder
from typing import List
import io
from pydantic import BaseModel
import uuid
from datetime import datetime, timedelta
import asyncio
import threading

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diccionario para almacenar los datos de cada sesión
session_data = {}

# Lock para acceso seguro al diccionario de sesiones
session_lock = threading.Lock()

# Modelo para la sesión
class SessionData:
    def __init__(self, excel_data: bytes):
        self.id = str(uuid.uuid4())
        self.excel_data = excel_data
        self.created_at = datetime.now()
        self.modelo_knn = None
        self.label_encoder = None

def limpiar_sesiones_antiguas():
    """Elimina sesiones más antiguas que 1 hora"""
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
        await asyncio.sleep(3600)  # Ejecutar cada hora

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(limpiar_sesiones_periodicamente())

def cargar_datos_desde_excel(archivo_excel):
    try:
        # Si el archivo viene como bytes, convertirlo a DataFrame
        if isinstance(archivo_excel, bytes):
            df = pd.read_excel(io.BytesIO(archivo_excel))
        else:
            df = pd.read_excel(archivo_excel)
            
        df.columns = df.columns.str.strip()
        
        if df.empty:
            raise ValueError("El DataFrame está vacío.")
        
        return df
    except Exception as e:
        print(f"Error al cargar el archivo Excel: {e}")
        return None

def entrenar_modelo_knn(df):
    try:
        X = df.iloc[:, :-1]  # Todas las columnas excepto la última
        y = df.iloc[:, -1]   # Última columna (decisiones)
        
        # Entrenar el modelo KNN
        modelo_knn = KNeighborsClassifier(n_neighbors=3)
        
        # Codificar las etiquetas
        label_encoder = LabelEncoder()
        y_encoded = label_encoder.fit_transform(y)
        
        # Entrenar el modelo
        modelo_knn.fit(X, y_encoded)
        
        return modelo_knn, label_encoder
    except Exception as e:
        print(f"Error al entrenar el modelo: {e}")
        return None, None

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Leer el contenido del archivo
        contents = await file.read()
        
        # Crear nueva sesión
        session = SessionData(contents)
        
        # Cargar datos
        df = cargar_datos_desde_excel(contents)
        if df is None:
            raise HTTPException(status_code=400, detail="Error al cargar el archivo")
            
        # Obtener las preguntas (nombres de las columnas excepto la última)
        preguntas = df.columns[:-1].tolist()
        
        # Guardar sesión
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
        # Obtener sesión
        with session_lock:
            session = session_data.get(session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        # Cargar datos y entrenar modelo si es necesario
        df = cargar_datos_desde_excel(session.excel_data)
        if df is None:
            raise HTTPException(status_code=400, detail="Error al cargar los datos")
            
        if session.modelo_knn is None or session.label_encoder is None:
            modelo_knn, label_encoder = entrenar_modelo_knn(df)
            if modelo_knn is None:
                raise HTTPException(status_code=500, detail="Error al entrenar el modelo")
            session.modelo_knn = modelo_knn
            session.label_encoder = label_encoder
        
        # Realizar predicción
        prediccion_encoded = session.modelo_knn.predict([respuestas])
        prediccion = session.label_encoder.inverse_transform(prediccion_encoded)
        
        return {"decision": prediccion[0]}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 