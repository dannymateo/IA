import * as tf from '@tensorflow/tfjs';
import { KMeansResult, ProgressCallback } from './types';

/**
 * Clase para procesar imágenes usando algoritmos de clustering K-means
 */
export class ImageProcessor {
  /**
   * Procesa una imagen aplicando K-means con diferentes niveles de clusters
   * @param imageData - Datos de la imagen a procesar
   * @param width - Ancho de la imagen
   * @param height - Alto de la imagen
   * @param onProgress - Callback para reportar el progreso
   * @param steps - Número de pasos/niveles a generar
   * @returns Promise con array de URLs de imágenes procesadas
   */
  static async processImageWithKMeans(
    imageData: ImageData, 
    width: number, 
    height: number,
    onProgress?: ProgressCallback,
    steps: number = 11
  ): Promise<string[]> {
    // Optimización: Pre-calcular longitud para evitar cálculos repetidos
    const pixelCount = imageData.data.length / 4;
    const pixels = new Float32Array(pixelCount * 3);
    
    // Convertir a RGB normalizado (0-1)
    for (let i = 0; i < pixelCount; i++) {
      const j = i * 4;
      const k = i * 3;
      pixels[k] = imageData.data[j] / 255;
      pixels[k + 1] = imageData.data[j + 1] / 255;
      pixels[k + 2] = imageData.data[j + 2] / 255;
    }

    // Configurar canvas una sola vez
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    canvas.width = width;
    canvas.height = height;

    // Calcular niveles de clusters usando distribución logarítmica
    const clusterLevels = ImageProcessor.calculateClusterLevels(steps);
    const results: string[] = [];
    
    const tensorPixels = tf.tensor2d(pixels, [pixelCount, 3]);
    
    try {
      for (let step = 0; step < clusterLevels.length; step++) {
        // Permitir actualizaciones del UI
        await ImageProcessor.yieldToMain();
        
        const k = clusterLevels[step];
        onProgress?.(k, step + 1);
        
        const processedImage = await ImageProcessor.processStep(
          tensorPixels,
          k,
          width,
          height,
          ctx
        );
        
        results.push(processedImage);
      }
    } finally {
      // Limpieza de memoria
      tensorPixels.dispose();
    }

    return results;
  }

  /**
   * Calcula los niveles de clusters usando una distribución logarítmica
   */
  private static calculateClusterLevels(steps: number): number[] {
    return Array.from({ length: steps }, (_, i) => {
      const progress = i / (steps - 1);
      const minLog = Math.log(2);
      const maxLog = Math.log(64);
      const value = Math.exp(minLog + (maxLog - minLog) * progress);
      return Math.max(2, Math.round(value));
    }).filter((value, index, self) => self.indexOf(value) === index);
  }

  /**
   * Procesa un paso individual del algoritmo K-means
   */
  private static async processStep(
    tensorPixels: tf.Tensor2D,
    k: number,
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D
  ): Promise<string> {
    const { centroids, assignments } = await ImageProcessor.runKMeans(tensorPixels, k, 3);
    const newImageData = new ImageData(width, height);
    
    // Procesar en chunks para mejor rendimiento
    const chunkSize = 100000;
    for (let i = 0; i < assignments.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, assignments.length);
      ImageProcessor.applyColors(newImageData, assignments, centroids, i, end);
      await ImageProcessor.yieldToMain();
    }

    ctx.putImageData(newImageData, 0, 0);
    return ctx.canvas.toDataURL();
  }

  /**
   * Aplica los colores a un chunk de la imagen
   */
  private static applyColors(
    imageData: ImageData,
    assignments: number[],
    centroids: number[][],
    start: number,
    end: number
  ): void {
    for (let i = start; i < end; i++) {
      const cluster = assignments[i];
      const idx = i * 4;
      imageData.data[idx] = centroids[cluster][0] * 255;
      imageData.data[idx + 1] = centroids[cluster][1] * 255;
      imageData.data[idx + 2] = centroids[cluster][2] * 255;
      imageData.data[idx + 3] = 255;
    }
  }

  /**
   * Cede el control al hilo principal para evitar bloqueos
   */
  private static yieldToMain(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  private static async runKMeans(data: tf.Tensor2D, k: number, iterations: number): Promise<KMeansResult> {
    const n = data.shape[0];
    
    // Tomar una muestra más pequeña para la inicialización
    const sampleSize = Math.min(n, 10000);
    const sampleIndices = new Set<number>();
    while (sampleIndices.size < sampleSize) {
      sampleIndices.add(Math.floor(Math.random() * n));
    }
    
    // Inicializar centroides con la muestra
    const centroids = await ImageProcessor.initializeCentroids(data, k, Array.from(sampleIndices));
    const dataArray = await data.array();
    
    // Procesar en chunks más pequeños
    const assignments = new Array(n).fill(0);
    const chunkSize = 5000;
    
    for (let iter = 0; iter < iterations; iter++) {
      for (let start = 0; start < n; start += chunkSize) {
        const end = Math.min(start + chunkSize, n);
        for (let i = start; i < end; i++) {
          let minDist = Infinity;
          let bestCluster = 0;
          
          for (let j = 0; j < k; j++) {
            const dist = ImageProcessor.euclideanDistance(dataArray[i], centroids[j]);
            if (dist < minDist) {
              minDist = dist;
              bestCluster = j;
            }
          }
          assignments[i] = bestCluster;
        }
      }

      // Actualizar centroides
      const sums = Array(k).fill(0).map(() => [0, 0, 0]);
      const counts = Array(k).fill(0);
      
      for (let i = 0; i < n; i++) {
        const cluster = assignments[i];
        counts[cluster]++;
        for (let j = 0; j < 3; j++) {
          sums[cluster][j] += dataArray[i][j];
        }
      }

      for (let i = 0; i < k; i++) {
        if (counts[i] > 0) {
          for (let j = 0; j < 3; j++) {
            centroids[i][j] = sums[i][j] / counts[i];
          }
        }
      }
    }

    return { centroids, assignments };
  }

  private static async initializeCentroids(data: tf.Tensor2D, k: number, sample: number[]) {
    const dataArray = await data.array();
    const centroids: number[][] = [];
    
    // Inicializar centroides con la muestra
    for (const index of sample) {
      centroids.push([...dataArray[index]]);
    }

    return centroids;
  }

  private static euclideanDistance(a: number[], b: number[]) {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
    );
  }
} 