"use client";

import { CardBody, Divider } from "@nextui-org/react";
import { CardHeader } from "@nextui-org/react";
import { useState } from "react";
import { Brain, FileSpreadsheet } from "lucide-react";
import { Card } from "@nextui-org/react";

import { DataInput } from "./DataInput";
import { ErrorDisplay } from "../expertSystem/ErrorDisplay";
import { KnowledgeBaseUpload } from "../expertSystem/KnowledgeBaseUpload";

/**
 * @fileoverview Sistema de clasificación que utiliza múltiples modelos de machine learning
 * para predecir la posibilidad de diabetes basado en respuestas del usuario.
 */

/**
 * @interface Question
 * @description Representa una pregunta en el sistema
 * @property {number} id - Identificador único de la pregunta
 * @property {string} text - Texto de la pregunta
 */
interface Question {
  id: number;
  text: string;
}

/**
 * @interface ModelPrediction
 * @description Representa la predicción de un modelo individual
 * @property {string} mensaje - Mensaje descriptivo del resultado
 * @property {number} valor - Valor numérico de la predicción (0 o 1)
 * @property {number} accuracy - Precisión del modelo (0-1)
 */
interface ModelPrediction {
  mensaje: string;
  valor: number;
  accuracy: number;
}

/**
 * @interface ModelPredictions
 * @description Mapa de predicciones por modelo
 * @property {ModelPrediction} [key: string] - Predicción para cada modelo
 */
interface ModelPredictions {
  [key: string]: ModelPrediction;
}

/**
 * @interface PredictionResponse
 * @description Respuesta completa de predicción del servidor
 * @property {string} decision - Decisión final basada en todos los modelos
 * @property {ModelPredictions} predicciones_por_modelo - Predicciones individuales por modelo
 */
interface PredictionResponse {
  decision: string;
  predicciones_por_modelo: ModelPredictions;
}

/**
 * @function ClassifierSystem
 * @description Componente principal del sistema de clasificación
 * @returns {JSX.Element} Interfaz del sistema de clasificación
 */
export function ClassifierSystem() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [prediction, setPrediction] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [modelPredictions, setModelPredictions] = useState<ModelPredictions | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const API_BASE_URL = 'https://dasscoin.zapto.org';

  /**
   * @function handleFileUpload
   * @description Maneja la carga de archivos CSV o Excel
   * @param {File} file - Archivo a procesar
   * @returns {Promise<void>}
   * @throws {Error} Si hay un error en la carga o procesamiento del archivo
   */
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError("");
    setPrediction("");
    
    // Validar el tipo de archivo
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/csv"
    ];

    if (!validTypes.includes(file.type)) {
      setError("Por favor, sube solo archivos CSV o Excel (.csv, .xlsx, .xls)");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/classifier/get-parameters/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar el archivo');
      }

      const data = await response.json();
      
      if (!data.parameters) {
        throw new Error('Formato de datos inválido');
      }

      const formattedQuestions: Question[] = data.parameters.map((text: string, index: number) => ({
        id: index,
        text: text
      }));

      setSelectedFile(file);
      setQuestions(formattedQuestions);
      setAnswers(new Array(formattedQuestions.length).fill(null));
      
    } catch (e) {
      console.error('Error al cargar el archivo:', e);
      setError('Error al cargar el archivo: ' + (e instanceof Error ? e.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function handleSubmit
   * @description Envía las respuestas al servidor y obtiene predicciones
   * @returns {Promise<void>}
   * @throws {Error} Si hay un error en el proceso de predicción
   */
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('No hay un archivo seleccionado');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('answers', JSON.stringify(answers));

      const response = await fetch(`${API_BASE_URL}/classifier/analyze/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener la predicción');
      }

      const result = await response.json() as PredictionResponse;
      if (result.decision) {
        setPrediction(result.decision);
        setModelPredictions(result.predicciones_por_modelo);
        setError("");
      } else {
        throw new Error('No se recibió una predicción válida');
      }
    } catch (e) {
      setError('Error al obtener la predicción: ' + (e instanceof Error ? e.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function handleDragOver
   * @description Maneja el evento de arrastrar sobre la zona de carga
   * @param {React.DragEvent<HTMLDivElement>} e - Evento de arrastre
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * @function handleDrop
   * @description Procesa el archivo soltado en la zona de carga
   * @param {React.DragEvent<HTMLDivElement>} e - Evento de soltar
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files?.length) {
      const file = files[0];
      handleFileUpload(file);
    }
  };

  /**
   * @function handleDownloadTemplate
   * @description Descarga la plantilla para el formato de datos correcto
   */
  const handleDownloadTemplate = () => {
    // Actualizar la URL al archivo de plantilla en el servidor
    const templateUrl = 'https://dasscoin.zapto.org/files/classifierSystem.csv';
    
    // Crear un elemento <a> temporal
    const link = document.createElement('a');
    link.href = templateUrl;
    link.download = 'plantilla_sistema_clasificador.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="min-h-screen w-full bg-[#fafafa]">
      <div className="absolute inset-0 bg-grid-slate-200/[0.03] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#ffffff]" 
           style={{ mixBlendMode: 'overlay' }} />
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-r from-indigo-500/5 via-blue-500/5 to-sky-500/5 blur-[120px]" />
      <div className="relative max-w-7xl mx-auto p-4 md:p-8 lg:p-12 space-y-8">
        <Card className="border border-slate-200/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="flex flex-col gap-4 pt-6 md:pt-8">
            <div className="flex items-center gap-2 w-full justify-between px-4 md:px-8">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse delay-100" />
                <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse delay-200" />
              </div>
              <Brain className="text-indigo-600 w-8 h-8" />
            </div>
            <div className="text-center space-y-3 pb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent">
                Sistema de Experto con varios modelos
              </h1>
            </div>
          </CardHeader>

          <CardBody className="space-y-10">
          <KnowledgeBaseUpload 
                isLoading={isLoading}
                onFileUpload={handleFileUpload}
                handleDownloadTemplate={handleDownloadTemplate}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
              />

            {error && <ErrorDisplay error={error} />}

            {questions.length > 0 && (
              <DataInput
                questions={questions}
                answers={answers}
                setAnswers={setAnswers}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            )}

            {prediction && (
              <Card className="bg-white/95 backdrop-blur-3xl border border-slate-200/60 shadow-xl">
                <CardHeader className="flex gap-5 px-6 md:px-8 pt-6 md:pt-8">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-sky-500/10 
                    border border-slate-200/60">
                    <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-800">Resultado Final</h2>
                    <p className="text-slate-500 text-sm mt-1.5">Basado en la mayoría de los modelos</p>
                  </div>
                </CardHeader>
                
                <Divider className="bg-slate-200/60 my-4 md:my-6" />
                
                <CardBody className="px-6 md:px-8 pb-8 md:pb-10 space-y-6">
                  <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-sky-500/5 
                    border border-slate-200/60 hover:border-indigo-500/30 transition-all duration-300 shadow-inner">
                    <p className="text-xl md:text-2xl text-slate-700 leading-relaxed text-center">
                      {prediction}
                    </p>
                  </div>

                  {modelPredictions && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-700">Predicciones por Modelo</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(modelPredictions).map(([modelo, prediccion]) => (
                          <div key={modelo} 
                               className="p-4 rounded-xl bg-white border border-slate-200 
                                         hover:border-blue-200 transition-all duration-300">
                            <h4 className="font-medium text-slate-600 mb-2">
                              {modelo.toUpperCase()}
                            </h4>
                            <div className="space-y-2">
                              <p className={`text-sm ${
                                prediccion.mensaje.includes("Posible") ? "text-red-600" : "text-green-600"
                              }`}>
                                {prediccion.mensaje}
                              </p>
                              <div className="flex flex-col gap-1">
                                <p className="text-xs text-slate-500">
                                  Valor predicho: <span className="font-mono">{prediccion.valor}</span>
                                </p>
                                <p className="text-xs text-slate-500">
                                  Precisión del modelo: <span className="font-mono">{(prediccion.accuracy * 100).toFixed(2)}%</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Interpretación:</span> 0 = No diabetes, 1 = Posible diabetes
                          </p>
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Precisión:</span> Porcentaje de predicciones correctas del modelo en datos de prueba
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 