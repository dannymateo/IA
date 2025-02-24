/**
 * Interfaz para los resultados del algoritmo K-means
 */
export interface KMeansResult {
  centroids: number[][];
  assignments: number[];
}

/**
 * Tipo para la función callback de progreso
 */
export type ProgressCallback = (cluster: number, step: number) => void; 