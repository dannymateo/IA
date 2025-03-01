"use client";

import { Button, CardHeader, Spinner } from "@nextui-org/react";
import { Card, CardBody } from "@nextui-org/react";
import { useCallback } from "react";
import { useState } from "react";
import { useRef } from "react";
import { Layers, RotateCw } from "lucide-react";

import { VideoResult } from "./VideoResult";
import { ResultsGrid } from "./ResultsGrid";
import { FileUpload } from "@/components/fileUpload";
import { StepsControl } from "./StepsControl";

/**
 * @interface ProcessvideoProps
 * @description Propiedades del componente Processvideo (actualmente vacío ya que no recibe props)
 */

/**
 * @component Processvideo
 * @description Componente principal para procesar imágenes y convertirlas en secuencias de video.
 * Permite cargar imágenes, procesarlas en pasos y generar una animación de video.
 * 
 * @example
 * ```tsx
 * <Processvideo />
 * ```
 */
export function Processvideo() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [processedImages, setProcessedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [stepsCount, setStepsCount] = useState(11);
    const [imageToProcess, setImageToProcess] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const API_BASE_URL = 'https://dasscoin.zapto.org';
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;
  
    /**
     * @function handleFileUpload
     * @description Maneja la carga de archivos, procesa la imagen y configura el ID de sesión
     * @param {File} file - Archivo de imagen a procesar
     */
    const handleFileUpload = useCallback(async (file: File) => {
      setError("");
      setIsLoading(true);
      setSessionId(null);
      setOriginalFile(file);
      setProcessedImages([]);
      
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
  
      let retryCount = 0;
      while (retryCount < MAX_RETRIES) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`${API_BASE_URL}/upload-image/`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al cargar la imagen');
          }

          const data = await response.json();
          if (!data.session_id || data.status !== 'ready') {
            throw new Error('Error en el servidor. Por favor, intenta de nuevo.');
          }
          
          setSessionId(data.session_id);
          const imageUrl = await readFileAsDataURL(file);
          setSelectedImage(imageUrl);
          setImageToProcess(imageUrl);
          break;
          
        } catch (e) {
          retryCount++;
          if (retryCount >= MAX_RETRIES) {
            console.error('Error al cargar la imagen:', e);
            setError('Error al cargar la imagen. Por favor, intenta de nuevo.');
            break;
          }
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
      
      setIsLoading(false);
    }, [videoUrl]);
  
    /**
     * @function readFileAsDataURL
     * @description Convierte un archivo en una URL de datos
     * @param {File} file - Archivo a convertir
     * @returns {Promise<string>} URL de datos del archivo
     */
    const readFileAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    /**
     * @function createVideo
     * @description Crea un video a partir de una secuencia de imágenes
     * @param {string[]} images - Array de URLs de imágenes
     */
    const createVideo = useCallback(async (images: string[]) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const firstImage = await loadImage(images[0]);
      canvas.width = firstImage.width;
      canvas.height = firstImage.height;
  
      const stream = canvas.captureStream(30);
      
      // Configurar opciones de codificación más compatibles
      const options = {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=h264') 
          ? 'video/webm;codecs=h264'
          : MediaRecorder.isTypeSupported('video/webm') 
            ? 'video/webm'
            : 'video/mp4',
        videoBitsPerSecond: 2500000
      };
  
      try {
        const mediaRecorder = new MediaRecorder(stream, options);
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: options.mimeType });
          if (videoUrl) URL.revokeObjectURL(videoUrl);
          setVideoUrl(URL.createObjectURL(blob));
        };
  
        mediaRecorder.start();
  
        // Ajustar el frameDelay para dispositivos más lentos
        const frameDelay = 100; // 10 FPS para mejor compatibilidad
        let lastDrawTime = 0;
  
        const processFrame = async (index: number) => {
          if (index >= images.length) {
            mediaRecorder.stop();
            return;
          }
  
          const now = performance.now();
          const timeSinceLastDraw = now - lastDrawTime;
  
          if (timeSinceLastDraw >= frameDelay) {
            const img = await loadImage(images[index]);
            ctx.drawImage(img, 0, 0);
            lastDrawTime = now;
            requestAnimationFrame(() => processFrame(index + 1));
          } else {
            setTimeout(() => processFrame(index), frameDelay - timeSinceLastDraw);
          }
        };
  
        processFrame(0);
      } catch (error) {
        console.error('Error al crear el video:', error);
        setError('No se pudo crear el video. Intente con una imagen más pequeña.');
      }
    }, [videoUrl]);
  
    /**
     * @function loadImage
     * @description Carga una imagen desde una URL
     * @param {string} src - URL de la imagen
     * @returns {Promise<HTMLImageElement>} Elemento de imagen cargado
     */
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    };
  
    /**
     * @function resetProcess
     * @description Reinicia el proceso de procesamiento de imágenes
     */
    const resetProcess = useCallback(() => {
      setProcessedImages([]);
      setVideoUrl(null);
      setIsComplete(false);
      setError("");
    }, []);
  
    const triggerFileSelection = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };
  
    /**
     * @function processImage
     * @description Procesa la imagen utilizando la API
     * @param {string} imageUrl - URL de la imagen a procesar
     */
    const processImage = async (imageUrl: string) => {
      if (!sessionId) {
        setError('Por favor, vuelva a subir la imagen para procesarla.');
        return;
      }

      setIsLoading(true);
      setProcessedImages([]);
      setIsComplete(false);
      setRetryCount(0);

      let currentRetry = 0;

      while (currentRetry < MAX_RETRIES) {
        try {
          const response = await fetch(`${API_BASE_URL}/process-image/${sessionId}?steps=${stepsCount}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (response.status === 404 || response.status === 410) {
            if (originalFile && currentRetry < MAX_RETRIES - 1) {
              console.log(`Reintentando carga de imagen (${currentRetry + 1}/${MAX_RETRIES})`);
              await handleFileUpload(originalFile);
              currentRetry++;
              setRetryCount(currentRetry);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              continue;
            }
          }

          if (response.status === 409) {
            console.log(`Sesión ocupada, reintentando (${currentRetry + 1}/${MAX_RETRIES})`);
            currentRetry++;
            setRetryCount(currentRetry);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            continue;
          }

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al procesar la imagen');
          }

          const responseData = await response.json();
          
          if (!responseData.images || responseData.images.length === 0) {
            throw new Error('No se obtuvieron resultados del procesamiento');
          }

          setProcessedImages(responseData.images);
          await createVideo(responseData.images);
          setIsComplete(true);
          break;

        } catch (error) {
          currentRetry++;
          setRetryCount(currentRetry);
          
          if (currentRetry >= MAX_RETRIES) {
            console.error('Error en el procesamiento:', error);
            setError(error instanceof Error ? error.message : 'Error al procesar la imagen');
            break;
          }

          console.log(`Reintentando después de error (${currentRetry}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }

      setIsLoading(false);
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
     * @description Maneja el evento de soltar en la zona de carga
     * @param {React.DragEvent<HTMLDivElement>} e - Evento de soltar
     */
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = e.dataTransfer.files;
      if (files?.length) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const event = {
            target: {
              files: files
            }
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          handleFileUpload(file);
        } else {
          setError("Por favor, sube solo archivos de imagen");
        }
      }
    };
  
    return (
      <div className="min-h-screen w-full bg-[#fafafa]">
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-grid-slate-200/[0.03] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#ffffff]" style={{ mixBlendMode: 'overlay' }} />
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-r from-indigo-500/5 via-blue-500/5 to-sky-500/5 blur-[120px]" />

        {/* Contenedor principal con padding responsive */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <Card className="border border-slate-200/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
            <CardHeader className="flex flex-col gap-4 pt-6 md:pt-8">
              <div className="flex items-center gap-2 w-full justify-between px-4 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse delay-100" />
                  <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse delay-200" />
                </div>
                <Layers className="text-indigo-600 w-8 h-8" />
              </div>
              <div className="text-center space-y-3 pb-2">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent">
                  Procesador de Imagen por Niveles
                </h1>
              </div>
            </CardHeader>
            <CardBody className="gap-6 px-4 sm:px-6 lg:px-8">
              {/* Zona de carga de archivos */}
              <div className="w-full max-w-3xl mx-auto">
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold 
                                  bg-clip-text text-transparent 
                                  bg-gradient-to-r from-indigo-600 to-purple-600
                                  dark:from-indigo-400 dark:to-purple-400">
                      Comienza tu proceso creativo
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600/90 dark:text-slate-400/90 
                                  max-w-md mx-auto">
                      Sube una imagen para transformarla en una secuencia de colores única
                    </p>
                  </div>
                  <FileUpload
                    title="Sube una imagen para transformarla en una secuencia de colores única"
                    formats={["image/png", "image/jpeg", "image/jpg", "image/webp"]}
                    formatsName={["PNG", "JPEG", "JPG", "WEBP"]}
                    onFileUpload={handleFileUpload}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                </div>
              </div>

              {/* Control de pasos con diseño mejorado */}
              <div className="w-full max-w-xl mx-auto">
                <StepsControl 
                  stepsCount={stepsCount}
                  setStepsCount={setStepsCount}
                  description="Número de pasos para el procesamiento de colores. 
                             Más pasos = mejor precisión, pero más tiempo de proceso."
                />
              </div>

              {/* Botón de procesamiento */}
              {imageToProcess && !isComplete && (
                <div className="flex justify-center mt-4 max-w-xl mx-auto">
                  <Button
                    size="lg"
                    className="w-full mt-8 bg-blue-50 text-blue-600 border border-blue-200 py-4 rounded-xl
                    hover:bg-blue-100 transition-all duration-300 flex items-center justify-center gap-3 
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
                    onPress={() => processImage(imageToProcess)}
                    isDisabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Spinner color="white" size="sm" />
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5" />
                        <span>Procesar Imagen</span>
                      </div>
                    )}
                  </Button>
                </div>
              )}

              {isComplete && !isLoading && (
                <div className="flex justify-center mt-4 max-w-xl mx-auto">
                  <Button
                    size="lg"
                    className="w-full mt-8 bg-green-50 text-green-600 border border-green-200 py-4 rounded-xl
                    hover:bg-green-100 transition-all duration-300 flex items-center justify-center gap-3"
                    onPress={resetProcess}
                  >
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-5 h-5" />
                      <span>Procesar Nueva Imagen</span>
                    </div>
                  </Button>
                </div>
              )}

              {/* Indicador de progreso */}
              {isLoading && (
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-600 text-center">
                    {retryCount > 0 ? `Reintentando proceso... (Intento ${retryCount}/${MAX_RETRIES})` : 'Procesando imagen...'}
                  </p>
                </div>
              )}

              {/* Mensaje de error simplificado */}
              {error && (
                <div className="w-full max-w-2xl mx-auto">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3">
                    <p className="text-red-600 text-sm">{error}</p>
                    <Button
                      size="sm"
                      className="bg-red-100 text-red-600 hover:bg-red-200"
                      onPress={() => {
                        setError("");
                        if (originalFile) {
                          handleFileUpload(originalFile);
                        } else if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              )}

              {/* Cuadrícula de resultados */}
              {processedImages.length > 0 && (
                <div className="w-full">
                  <ResultsGrid processedImages={processedImages} />
                </div>
              )}

              {/* Resultado del video */}
              {videoUrl && (
                <div className="w-full max-w-4xl mx-auto">
                  <VideoResult videoUrl={videoUrl} />
                </div>
              )}
            </CardBody>
          </Card>
        </div>
        <input 
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileUpload(file);
            }
          }}
        />
      </div>
    );
}
