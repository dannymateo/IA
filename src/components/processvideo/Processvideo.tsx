"use client";

import { Button, CardHeader, Spinner } from "@nextui-org/react";
import { Card, CardBody } from "@nextui-org/react";
import { useCallback } from "react";
import { useState } from "react";
import { useRef } from "react";
import { Layers } from "lucide-react";

import { ProgressIndicator } from "./ProgressIndicator";
import { ErrorMessage } from "./ErrorMessage";
import { VideoResult } from "./VideoResult";
import { ResultsGrid } from "./ResultsGrid";
import { FileUpload } from "@/components/fileUpload";
import { StepsControl } from "./StepsControl";
import { ImageProcessor } from "./utils";

/**
 * Componente principal para el procesamiento de video
 * Permite cargar imágenes, procesarlas con K-means y generar videos
 */
export function Processvideo() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [processedImages, setProcessedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentCluster, setCurrentCluster] = useState<number | null>(null);
    const [error, setError] = useState<string>("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [progress, setProgress] = useState({ step: 0, total: 50 });
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [stepsCount, setStepsCount] = useState(11);
    const [imageToProcess, setImageToProcess] = useState<string | null>(null);
  
    /**
     * Maneja la carga de archivos, ya sea por input o drag & drop
     */
    const handleFileUpload = useCallback(async (file: File) => {
      setError("");
      
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
  
      try {
        const imageUrl = await readFileAsDataURL(file);
        setSelectedImage(imageUrl);
        setImageToProcess(imageUrl);
      } catch (e) {
        console.error('Error al cargar la imagen:', e);
        setError('Error al cargar la imagen: ' + (e instanceof Error ? e.message : 'Error desconocido'));
      }
    }, [videoUrl]);
  
    /**
     * Convierte un archivo a Data URL
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
     * Crea un video a partir de una secuencia de imágenes
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
     * Carga una imagen y espera a que esté lista
     */
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    };
  
    const processImage = async (imageUrl: string) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setError('Error: No se pudo inicializar el canvas');
        return;
      }
  
      setIsLoading(true);
      setProcessedImages([]);
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
      
      try {
        const img = await loadImage(imageUrl);
        
        // Reducir el tamaño máximo para dispositivos móviles
        const maxDimension = window.innerWidth <= 768 ? 800 : 1200;
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        
        const ctx = canvas.getContext('2d', { 
          alpha: false,
          willReadFrequently: true,
          desynchronized: true // Mejor rendimiento en dispositivos móviles
        })!;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const results = await ImageProcessor.processImageWithKMeans(
          imageData, 
          canvas.width, 
          canvas.height,
          (cluster, step) => {
            setCurrentCluster(cluster);
            setProgress({ step, total: stepsCount });
          },
          Math.min(stepsCount, 20)
        );
        
        setProcessedImages(results);
        await createVideo(results);
        
      } catch (error) {
        setError('Error al procesar la imagen: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      } finally {
        setIsLoading(false);
        setCurrentCluster(null);
      }
    };
  
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    };
  
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
              {imageToProcess && (
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

              {/* Indicador de progreso */}
              {isLoading && (
                <div className="w-full max-w-2xl mx-auto">
                  <ProgressIndicator 
                    progress={progress}
                    currentCluster={currentCluster}
                  />
                </div>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className="w-full max-w-2xl mx-auto">
                  <ErrorMessage message={error} />
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
      </div>
    );
}
