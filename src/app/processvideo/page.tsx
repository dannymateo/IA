"use client";
import { useState, useRef, useCallback } from "react";
import {
  Image as ImageIcon,
  Download,
  Layers
} from "lucide-react";
import { Card, CardHeader, CardBody, Button, Input, Spinner, Slider } from "@nextui-org/react";
import { ImageProcessor } from '@/utils/imageProcessor';

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");
    // Limpiar el video anterior
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
        await processImage(imageUrl);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error('Error al procesar la imagen:', e);
      setError('Error al procesar la imagen: ' + (e instanceof Error ? e.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  const createVideo = useCallback(async (images: string[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const firstImage = new Image();
    
    await new Promise((resolve) => {
      firstImage.onload = resolve;
      firstImage.src = images[0];
    });

    canvas.width = firstImage.width;
    canvas.height = firstImage.height;

    const stream = canvas.captureStream(24);
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

    const frameDelay = 150;
    for (const imageUrl of images) {
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imageUrl;
      });
      
      ctx.drawImage(img, 0, 0);
      await new Promise(resolve => setTimeout(resolve, frameDelay));
    }

    mediaRecorder.stop();
  }, []);

  const processImage = async (imageUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Error: No se pudo inicializar el canvas');
      return;
    }

    setIsLoading(true);
    setProcessedImages([]);
    
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
        handleFileUpload(event);
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

          <CardBody className="space-y-10">
            <Card className="bg-white border border-slate-200">
              <CardHeader className="flex items-center gap-4 p-6 border-b border-slate-100">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-slate-800">Cargar Imagen</h2>
                  <p className="text-sm text-slate-500">Sube una imagen para procesar</p>
                </div>
              </CardHeader>

              <CardBody className="p-6">
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="w-full"
                >
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    description="Arrastra y suelta tu imagen o haz clic para seleccionar"
                    className="border border-dashed border-slate-200 hover:border-indigo-400 transition-all duration-200"
                    classNames={{
                      description: "text-slate-500 text-sm",
                      input: "text-slate-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100",
                      inputWrapper: "h-24 flex items-center justify-center bg-slate-50/50 cursor-pointer"
                    }}
                  />
                </div>

                <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100/50 shadow-inner">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          Control de Pasos
                        </h3>
                        <p className="text-sm text-slate-600">
                          Ajusta la cantidad de niveles de color para el procesamiento
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200">
                        <Input
                          type="number"
                          value={stepsCount.toString()}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              setStepsCount(Math.min(Math.max(value, 2), 50));
                            }
                          }}
                          className="w-20"
                          classNames={{
                            input: "text-center font-medium text-indigo-600",
                            inputWrapper: "bg-transparent shadow-none"
                          }}
                          size="sm"
                          min={2}
                          max={50}
                        />
                        <span className="text-sm text-slate-500">pasos</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Slider 
                        size="lg"
                        step={1}
                        minValue={2}
                        maxValue={50}
                        value={stepsCount}
                        onChange={(value) => setStepsCount(value as number)}
                        className="max-w-full"
                        color="secondary"
                        showSteps={false}
                        marks={[
                          {
                            value: 2,
                            label: "Mínimo"
                          },
                          {
                            value: 25,
                            label: "Medio"
                          },
                          {
                            value: 50,
                            label: "Máximo"
                          }
                        ]}
                        startContent={
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-medium text-indigo-600">2</span>
                            <span className="text-[10px] text-slate-500">Min</span>
                          </div>
                        }
                        endContent={
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-medium text-indigo-600">50</span>
                            <span className="text-[10px] text-slate-500">Max</span>
                          </div>
                        }
                        classNames={{
                          base: "max-w-full py-2",
                          filler: "bg-gradient-to-r from-indigo-500 to-purple-500",
                          thumb: [
                            "transition-all duration-200",
                            "before:bg-gradient-to-r before:from-indigo-500 before:to-purple-500",
                            "after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500",
                            "shadow-lg hover:shadow-xl",
                            "group-data-[focused=true]:shadow-lg",
                          ].join(" "),
                          track: "bg-slate-200",
                          mark: "hidden",
                          label: "font-medium text-slate-600"
                        }}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <Button
                          size="sm"
                          className="bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
                          onClick={() => setStepsCount(10)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-medium text-slate-700">Rápido</span>
                            <span className="text-xs text-slate-500">10 pasos</span>
                          </div>
                        </Button>
                        <Button
                          size="sm"
                          className="bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
                          onClick={() => setStepsCount(25)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-medium text-slate-700">Balanceado</span>
                            <span className="text-xs text-slate-500">25 pasos</span>
                          </div>
                        </Button>
                        <Button
                          size="sm"
                          className="bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
                          onClick={() => setStepsCount(50)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-medium text-slate-700">Detallado</span>
                            <span className="text-xs text-slate-500">50 pasos</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {isLoading && (
                  <Card className="mt-4 border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-blue-400/5">
                    <CardBody className="flex flex-col gap-4 items-center p-6">
                      <div className="flex items-center gap-4">
                        <Spinner color="primary" />
                        <div className="flex flex-col">
                          <p className="text-indigo-600 font-medium">
                            Procesando imagen...
                          </p>
                          <p className="text-sm text-slate-600">
                            Paso {progress.step} de {progress.total}
                          </p>
                          {currentCluster && (
                            <p className="text-sm text-slate-600">
                              Aplicando K-means con {currentCluster} clusters
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-300"
                          style={{ 
                            width: `${(progress.step / progress.total) * 100}%`
                          }}
                        />
                      </div>
                    </CardBody>
                  </Card>
                )}
              </CardBody>
            </Card>

            {error && (
              <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-pink-400/5">
                <CardBody className="flex gap-4 items-center p-6">
                  <p className="text-red-400 font-medium">{error}</p>
                </CardBody>
              </Card>
            )}

            {processedImages.length > 0 && (
              <Card className="bg-white/95 backdrop-blur-xl border border-slate-200/60">
                <CardHeader className="flex gap-4 px-6 pt-6">
                  <h2 className="text-2xl font-medium text-slate-800">Resultados</h2>
                </CardHeader>
                <CardBody className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {processedImages.map((img, index) => {
                    // Calcular el número de clusters para este paso
                    const progress = index / (processedImages.length - 1);
                    const minLog = Math.log(2);
                    const maxLog = Math.log(64);
                    const clusters = Math.round(Math.exp(minLog + (maxLog - minLog) * progress));

                    return (
                      <Card key={index} className="border border-slate-200 hover:border-indigo-400 transition-all duration-300">
                        <CardHeader className="flex justify-between items-center p-4">
                          <span className="text-slate-700 font-medium">
                            Clusters: {clusters}
                          </span>
                          <Button
                            size="sm"
                            className="bg-indigo-50 text-indigo-600"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = img;
                              link.download = `processed_${clusters}_clusters.png`;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </CardHeader>
                        <CardBody className="p-4">
                          <img 
                            src={img} 
                            alt={`Processed ${clusters} clusters`} 
                            className="w-full rounded-lg" 
                          />
                        </CardBody>
                      </Card>
                    );
                  })}
                </CardBody>
              </Card>
            )}

            {videoUrl && (
              <Card className="bg-white/95 backdrop-blur-xl border border-slate-200/60">
                <CardHeader className="flex justify-between items-center px-6 pt-6">
                  <h2 className="text-2xl font-medium text-slate-800">Video Resultante</h2>
                  <Button
                    size="sm"
                    className="bg-indigo-50 text-indigo-600"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = videoUrl;
                      a.download = 'color-levels.webm';
                      a.click();
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Descargar Video
                  </Button>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="aspect-video w-full relative rounded-lg overflow-hidden bg-slate-100">
                    <video 
                      src={videoUrl} 
                      controls 
                      className="w-full h-full"
                      style={{ backgroundColor: 'black' }}
                    >
                      Tu navegador no soporta la reproducción de video.
                    </video>
                  </div>
                </CardBody>
              </Card>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
