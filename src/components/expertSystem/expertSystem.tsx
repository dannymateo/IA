"use client";
import { CardBody, Divider } from "@nextui-org/react";
import { CardHeader } from "@nextui-org/react";
import { useRef, useState } from "react";
import { Brain, Lightbulb } from "lucide-react";
import { Card } from "@nextui-org/react";

import { Question } from "./types";
import { Questionnaire } from "./Questionnaire";
import { KnowledgeBaseUpload } from "./KnowledgeBaseUpload";
import { ErrorDisplay } from "./ErrorDisplay";

/**
 * @component ExpertSystem
 * @description Componente principal del sistema experto que permite cargar una base de conocimiento,
 * responder preguntas y obtener recomendaciones basadas en las respuestas.
 * @returns {JSX.Element} Renderiza la interfaz del sistema experto
 */
export function ExpertSystem() {
    /**
     * @type {Record<number, boolean>} Estado para almacenar las respuestas del usuario
     */
    const [answers, setAnswers] = useState<Record<number, boolean>>({});
    
    /**
     * @type {Question[]} Estado para almacenar las preguntas cargadas
     */
    const [questions, setQuestions] = useState<Question[]>([]);
    
    /**
     * @type {string} Estado para almacenar la recomendación generada
     */
    const [recommendation, setRecommendation] = useState<string>("");
    
    /**
     * @type {string} Estado para almacenar mensajes de error
     */
    const [error, setError] = useState<string>("");
    
    /**
     * @type {boolean} Estado para controlar estados de carga
     */
    const [isLoading, setIsLoading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const API_BASE_URL = 'https://dasscoin.zapto.org';
    
    /**
     * @type {string | null} Estado para almacenar el ID de sesión actual
     */
    const [sessionId, setSessionId] = useState<string | null>(null);
  
    /**
     * @function handleFileUpload
     * @param {File} file - Archivo Excel con la base de conocimiento
     * @description Maneja la carga del archivo de la base de conocimiento al servidor
     */
    const handleFileUpload = async (file: File) => {
      setIsLoading(true);
      
      // Validar el tipo de archivo - Solo Excel para sistema experto
      const validTypes = [
        "application/vnd.ms-excel", // .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      ];

      if (!validTypes.includes(file.type)) {
        setError("Por favor, sube solo archivos Excel (.xlsx, .xls)");
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
  
      try {
        // Cambiar endpoint para sistema experto
        const response = await fetch(`${API_BASE_URL}/expert-system/upload/`, {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al cargar el archivo');
        }
  
        const data = await response.json();
        
        if (!data.questions || !data.session_id) {
          throw new Error('Formato de datos inválido');
        }

        // Convertir las preguntas al formato correcto
        const formattedQuestions: Question[] = data.questions.map((text: string, index: number) => ({
          id: index,
          text: text
        }));
  
        setSessionId(data.session_id);
        setQuestions(formattedQuestions);
        setAnswers({});
        setError("");
      } catch (e) {
        console.error('Error al cargar el archivo:', e);
        setError('Error al cargar la base de conocimiento: ' + (e instanceof Error ? e.message : 'Error desconocido'));
      } finally {
        setIsLoading(false);
      }
    };
  
    /**
     * @function handleDragOver
     * @param {React.DragEvent<HTMLDivElement>} e - Evento de arrastre
     * @description Maneja el evento cuando se arrastra un archivo sobre la zona de carga
     */
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    };
  
    /**
     * @function handleDrop
     * @param {React.DragEvent<HTMLDivElement>} e - Evento de soltar
     * @description Maneja el evento cuando se suelta un archivo en la zona de carga
     */
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = e.dataTransfer.files;
      if (files?.length) {
        const file = files[0];
        if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
            file.type === "application/vnd.ms-excel") {
          handleFileUpload(file);
        } else {
          setError("Por favor, sube solo archivos Excel (.xlsx, .xls)");
        }
      }
    };
  
    /**
     * @function handleSubmit
     * @param {React.FormEvent} e - Evento del formulario
     * @description Envía las respuestas al servidor y obtiene la recomendación
     */
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!sessionId) {
        setError('No hay una sesión activa');
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Convertir las respuestas al formato que espera el backend
        const answersArray = questions.map(q => answers[q.id] ? 1 : 0);
        
        // Cambiar endpoint para sistema experto
        const response = await fetch(`${API_BASE_URL}/expert-system/predict/${sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(answersArray),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al obtener la predicción');
        }

        const result = await response.json();
        if (result.decision) {
          setRecommendation(result.decision);
          setError("");
        } else {
          throw new Error('No se recibió una decisión válida');
        }
      } catch (e) {
        setError('Error al obtener la recomendación: ' + (e instanceof Error ? e.message : 'Error desconocido'));
      } finally {
        setIsLoading(false);
      }
    };
  
    /**
     * @function handleDownloadTemplate
     * @description Maneja la descarga de la plantilla Excel para la base de conocimiento
     */
    const handleDownloadTemplate = () => {
      // Ruta al archivo de plantilla
      const templateUrl = '/template.xlsx';
      
      // Crear un elemento <a> temporal
      const link = document.createElement('a');
      link.href = templateUrl;
      link.download = 'plantilla_sistema_experto.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  
    return (
      <div className="min-h-screen w-full bg-[#fafafa]">
        <div className="absolute inset-0 bg-grid-slate-200/[0.03] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#ffffff]" style={{ mixBlendMode: 'overlay' }} />
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-r from-indigo-500/5 via-blue-500/5 to-sky-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-r from-slate-100/10 via-gray-100/10 to-zinc-100/10 blur-[120px]" />
  
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
                  Sistema Experto
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
  
              {error ? (
                <ErrorDisplay error={error} />
              ) : (
                <>
                  {questions.length > 0 && (
                    <Questionnaire
                      questions={questions}
                      answers={answers}
                      setAnswers={setAnswers}
                      onSubmit={handleSubmit}
                    />
                  )}
  
                  {recommendation && (
                    <Card className="bg-white/95 backdrop-blur-3xl border border-slate-200/60 shadow-xl">
                      <CardHeader className="flex gap-5 px-6 md:px-8 pt-6 md:pt-8">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-sky-500/10 
                          border border-slate-200/60">
                          <Lightbulb className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-slate-800">Recomendación</h2>
                          <p className="text-slate-500 text-sm mt-1.5">Basada en tus respuestas</p>
                        </div>
                      </CardHeader>
                      
                      <Divider className="bg-slate-200/60 my-4 md:my-6" />
                      
                      <CardBody className="px-6 md:px-8 pb-8 md:pb-10">
                        <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-sky-500/5 
                          border border-slate-200/60 hover:border-indigo-500/30 transition-all duration-300 shadow-inner">
                          <p className="text-xl md:text-2xl text-slate-700 leading-relaxed text-center">{recommendation}</p>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }