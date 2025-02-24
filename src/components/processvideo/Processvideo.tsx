"use client";

import { Button, Spinner } from "@nextui-org/react";
import { Card, CardBody } from "@nextui-org/react";
import { useCallback } from "react";
import { useState } from "react";
import { useRef } from "react";
import { Layers } from "lucide-react";

import { ProgressIndicator } from "./ProgressIndicator";
import { ErrorMessage } from "./ErrorMessage";
import { VideoResult } from "./VideoResult";
import { ResultsGrid } from "./ResultsGrid";
import { Header } from "./Header";
import { FileUpload } from "./FileUpload";
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
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2000000
      });
  
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(URL.createObjectURL(blob));
      };
  
      mediaRecorder.start();
  
      const frameDelay = 66;
      const processFrame = async (index: number) => {
        if (index >= images.length) {
          mediaRecorder.stop();
          return;
        }
        const img = await loadImage(images[index]);
        ctx.drawImage(img, 0, 0);
        setTimeout(() => processFrame(index + 1), frameDelay);
      };
  
      processFrame(0);
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
        
        const maxDimension = 1200;
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext('2d', { 
          alpha: false,
          willReadFrequently: true
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
        <div className="absolute inset-0 bg-grid-slate-200/[0.03] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#ffffff]" style={{ mixBlendMode: 'overlay' }} />
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-r from-indigo-500/5 via-blue-500/5 to-sky-500/5 blur-[120px]" />
  
        <div className="relative max-w-7xl mx-auto p-4 md:p-8 lg:p-12 space-y-8">
          <Card className="border border-slate-200/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
            <Header />
  
            <CardBody className="space-y-10">
              <FileUpload
                onFileUpload={handleFileUpload}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
  
              <StepsControl 
                stepsCount={stepsCount}
                setStepsCount={setStepsCount}
                description="Número de pasos para el procesamiento de colores. 
                             Más pasos = mejor precisión, pero más tiempo de proceso."
              />
  
              {imageToProcess && (
                <div className="mt-6 flex justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-md"
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
  
              {isLoading && (
                <ProgressIndicator 
                  progress={progress}
                  currentCluster={currentCluster}
                />
              )}
  
              {error && <ErrorMessage message={error} />}
  
              {processedImages.length > 0 && (
                <ResultsGrid processedImages={processedImages} />
              )}
  
              {videoUrl && <VideoResult videoUrl={videoUrl} />}
            </CardBody>
          </Card>
        </div>
      </div>
    );
}
