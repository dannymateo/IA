import * as tf from '@tensorflow/tfjs';

export class ImageProcessor {
  static async processImageWithKMeans(
    imageData: ImageData, 
    width: number, 
    height: number,
    onProgress?: (cluster: number, step: number) => void,
    steps: number = 11
  ): Promise<string[]> {
    const pixels = new Float32Array(imageData.data.length / 4 * 3);
    
    // Convertir pixels a formato RGB
    for (let i = 0; i < imageData.data.length / 4; i++) {
      pixels[i * 3] = imageData.data[i * 4] / 255;     // R
      pixels[i * 3 + 1] = imageData.data[i * 4 + 1] / 255; // G
      pixels[i * 3 + 2] = imageData.data[i * 4 + 2] / 255; // B
    }

    const results: string[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Modificar la generación de clusters para que sea más dinámica
    const clusterLevels = Array.from({ length: steps }, (_, i) => {
      const progress = i / (steps - 1);
      const minLog = Math.log(2); // Comenzamos con 2 clusters
      const maxLog = Math.log(64); // Aumentamos el máximo a 64 para más variedad
      const value = Math.exp(minLog + (maxLog - minLog) * progress);
      return Math.max(2, Math.round(value)); // Aseguramos mínimo 2 clusters
    }).filter((value, index, self) => self.indexOf(value) === index);
    
    const tensorPixels = tf.tensor2d(pixels, [pixels.length / 3, 3]);
    
    // Procesar en chunks para no bloquear el UI
    for (let step = 0; step < clusterLevels.length; step++) {
      // Permitir que el UI se actualice
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const k = clusterLevels[step];
      onProgress?.(k, step + 1);
      
      // Reducir iteraciones y tamaño de muestra para k-means
      const { centroids, assignments } = await ImageProcessor.runKMeans(tensorPixels, k, 3);
      
      // Procesar la imagen en chunks
      const chunkSize = 100000;
      const newImageData = new ImageData(width, height);
      
      for (let i = 0; i < assignments.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, assignments.length);
        for (let j = i; j < end; j++) {
          const cluster = assignments[j];
          newImageData.data[j * 4] = centroids[cluster][0] * 255;
          newImageData.data[j * 4 + 1] = centroids[cluster][1] * 255;
          newImageData.data[j * 4 + 2] = centroids[cluster][2] * 255;
          newImageData.data[j * 4 + 3] = 255;
        }
        // Permitir actualizaciones del UI entre chunks
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      ctx.putImageData(newImageData, 0, 0);
      results.push(canvas.toDataURL());
    }

    // Liberar memoria
    tensorPixels.dispose();
    return results;
  }

  private static async runKMeans(data: tf.Tensor2D, k: number, iterations: number) {
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