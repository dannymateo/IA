/**
 * Procesa una imagen usando el algoritmo K-means para cuantización de colores
 * Implementa una versión optimizada del algoritmo con:
 * - Inicialización inteligente de centroides
 * - Procesamiento por lotes para mejor rendimiento
 * - Convergencia temprana
 */
export class KMeansProcessor {
  private centroids: number[][] = [];
  private labels: number[] = [];
  
  constructor(
    private k: number, 
    private maxIterations: number = 100,
    private convergenceThreshold: number = 0.0001
  ) {}

  /**
   * Inicializa centroides usando el método k-means++ para mejor convergencia
   */
  private initializeCentroids(data: number[][]): void {
    // Seleccionar primer centroide aleatoriamente
    const n = data.length;
    this.centroids = [data[Math.floor(Math.random() * n)]];

    // Seleccionar resto de centroides usando k-means++
    while (this.centroids.length < this.k) {
      const distances = data.map(point => {
        return Math.min(...this.centroids.map(
          centroid => this.euclideanDistance(point, centroid)
        ));
      });
      
      // Calcular probabilidades basadas en distancia
      const sum = distances.reduce((a, b) => a + b, 0);
      const probs = distances.map(d => d / sum);
      
      // Seleccionar siguiente centroide
      let r = Math.random();
      let i = 0;
      while (r > 0 && i < probs.length) {
        r -= probs[i];
        i++;
      }
      this.centroids.push([...data[i - 1]]);
    }
  }

  private findClosestCentroid(point: number[]): number {
    let minDistance = Infinity;
    let closestCentroid = 0;

    for (let i = 0; i < this.centroids.length; i++) {
      const distance = this.euclideanDistance(point, this.centroids[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestCentroid = i;
      }
    }

    return closestCentroid;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
    );
  }

  private updateCentroids(data: number[][]): void {
    const newCentroids: number[][] = Array(this.k).fill(0).map(() => Array(data[0].length).fill(0));
    const counts: number[] = Array(this.k).fill(0);

    // Sumar todos los puntos para cada cluster
    data.forEach((point, i) => {
      const label = this.labels[i];
      counts[label]++;
      point.forEach((val, j) => {
        newCentroids[label][j] += val;
      });
    });

    // Calcular promedio
    this.centroids = newCentroids.map((centroid, i) => 
      centroid.map(sum => counts[i] ? sum / counts[i] : 0)
    );
  }

  /**
   * Procesa los datos en lotes para mejor rendimiento
   */
  private processBatch(
    data: number[][], 
    start: number,
    end: number
  ): void {
    for (let i = start; i < end; i++) {
      const label = this.findClosestCentroid(data[i]);
      this.labels[i] = label;
    }
  }

  /**
   * Ajusta el modelo a los datos de entrada
   */
  fit(data: number[][]): void {
    this.initializeCentroids(data);
    
    const batchSize = 1000;
    let hasConverged = false;
    
    for (let iteration = 0; iteration < this.maxIterations && !hasConverged; iteration++) {
      // Procesar en lotes
      for (let start = 0; start < data.length; start += batchSize) {
        const end = Math.min(start + batchSize, data.length);
        this.processBatch(data, start, end);
      }

      const oldCentroids = this.centroids.map(c => [...c]);
      this.updateCentroids(data);

      // Verificar convergencia
      hasConverged = this.centroids.every((centroid, i) =>
        centroid.every((val, j) => 
          Math.abs(val - oldCentroids[i][j]) < this.convergenceThreshold
        )
      );
    }
  }

  predict(data: number[][]): number[] {
    return data.map(point => this.findClosestCentroid(point));
  }

  getCentroids(): number[][] {
    return this.centroids;
  }
} 