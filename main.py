from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import LabelEncoder
from typing import List
import io

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variables globales para almacenar el archivo Excel
excel_data = None
modelo_knn = None
label_encoder = None

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
    global modelo_knn, label_encoder
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
        
        return True
    except Exception as e:
        print(f"Error al entrenar el modelo: {e}")
        return False

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    global excel_data
    try:
        # Leer el contenido del archivo
        contents = await file.read()
        excel_data = contents  # Guardar para uso posterior
        
        # Cargar datos
        df = cargar_datos_desde_excel(contents)
        if df is None:
            return {"error": "Error al cargar el archivo"}
            
        # Obtener las preguntas (nombres de las columnas excepto la última)
        preguntas = df.columns[:-1].tolist()
        
        return {
            "message": "Archivo cargado correctamente",
            "questions": preguntas
        }
    except Exception as e:
        return {"error": f"Error al procesar el archivo: {str(e)}"}

@app.post("/predict/")
async def predict(respuestas: List[int]):
    global excel_data, modelo_knn, label_encoder
    
    try:
        if excel_data is None:
            return {"error": "No se ha cargado ningún archivo de entrenamiento"}
            
        # Cargar y entrenar el modelo con los datos guardados
        df = cargar_datos_desde_excel(excel_data)
        if not entrenar_modelo_knn(df):
            return {"error": "Error al entrenar el modelo"}
        
        # Convertir respuestas a formato numpy
        respuestas_array = [respuestas]
        
        # Realizar predicción
        prediccion_encoded = modelo_knn.predict(respuestas_array)
        prediccion = label_encoder.inverse_transform(prediccion_encoded)
        
        return {"decision": prediccion[0]}
    except Exception as e:
        return {"error": f"Error al realizar la predicción: {str(e)}"} 