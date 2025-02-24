"use client";
import { useState, useRef, useCallback } from "react";
import {
  Layers
} from "lucide-react";
import { Card, CardBody, Button, Spinner } from "@nextui-org/react";
import { ImageProcessor } from '@/utils/imageProcessor';
import { Header } from "@/components/processvideo/Header";
import { StepsControl } from "@/components/processvideo";
import { ProgressIndicator } from "@/components/processvideo";
import { ResultsGrid } from "@/components/processvideo";
import { FileUpload } from "@/components/processvideo/FileUpload";
import { VideoResult } from "@/components/processvideo/VideoResult";
import { ErrorMessage } from "@/components/processvideo/ErrorMessage";

/**
 * Componente principal para el procesamiento de video
 * Permite cargar imágenes, procesarlas con K-means y generar videos
 */
export default function ProcessVideo() {
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
    
    // Configurar dimensiones del canvas
    const firstImage = await loadImage(images[0]);
    canvas.width = firstImage.width;
    canvas.height = firstImage.height;

    // Configurar grabación
    const stream = canvas.captureStream(30); // Aumentado a 30fps
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm',
      videoBitsPerSecond: 2500000
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    };

    mediaRecorder.start();

    // Generar frames
    const frameDelay = 100; // Reducido para animación más fluida
    for (const imageUrl of images) {
      const img = await loadImage(imageUrl);
      ctx.drawImage(img, 0, 0);
      await new Promise(resolve => setTimeout(resolve, frameDelay));
    }

    mediaRecorder.stop();
  }, []);

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

    // Limpiar estados previos
    setIsLoading(true);
    setProcessedImages([]);
    setVideoUrl(null);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    
    try {
      const img = new Image();
      img.src = imageUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError('Error: No se pudo obtener el contexto del canvas');
        return;
      }

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const results = await ImageProcessor.processImageWithKMeans(
        imageData, 
        canvas.width, 
        canvas.height,
        (cluster, step) => {
          setCurrentCluster(cluster);
          setProgress({ step, total: stepsCount });
        },
        stepsCount
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
