import KNN from 'ml-knn';

import { TrainingData } from './types';

/**
 * Clase que implementa un modelo de clasificación K-Nearest Neighbors (KNN)
 * con capacidad de codificación/decodificación de etiquetas.
 */
export class KNNModel {
  private model: KNN | null;
  private labelEncoder: Map<string, number>;
  private labelDecoder: Map<number, string>;
  private k: number;

  /**
   * Inicializa una nueva instancia del modelo KNN
   * @param k - Número de vecinos a considerar (por defecto: 3)
   */
  constructor(k: number = 3) {
    this.model = null;
    this.labelEncoder = new Map();
    this.labelDecoder = new Map();
    this.k = k;
  }

  /**
   * Convierte las etiquetas de texto a valores numéricos
   * @param labels - Array de etiquetas de texto
   * @returns Array de etiquetas numéricas
   * @private
   */
  private preprocessLabels(labels: string[]): number[] {
    // Limpiamos los mapeos anteriores
    this.labelEncoder.clear();
    this.labelDecoder.clear();
    
    // Creamos nuevos mapeos con etiquetas únicas
    const uniqueLabels = [...new Set(labels)];
    uniqueLabels.forEach((label, index) => {
      this.labelEncoder.set(label, index);
      this.labelDecoder.set(index, label);
    });

    return labels.map(label => {
      const encoded = this.labelEncoder.get(label);
      if (encoded === undefined) {
        throw new Error(`Etiqueta no encontrada en el codificador: ${label}`);
      }
      return encoded;
    });
  }

  /**
   * Entrena el modelo con los datos proporcionados
   * @param trainingData - Objeto con características y etiquetas de entrenamiento
   * @throws Error si los datos de entrenamiento son inválidos
   */
  train(trainingData: TrainingData): void {
    const { features, labels } = trainingData;

    // Validaciones
    if (!features?.length || !labels?.length) {
      throw new Error('Los datos de entrenamiento no pueden estar vacíos');
    }
    if (features.length !== labels.length) {
      throw new Error('El número de características y etiquetas debe ser igual');
    }

    try {
      const numericLabels = this.preprocessLabels(labels);
      this.model = new KNN(features, numericLabels, { k: this.k });
    } catch (error) {
      throw new Error(`Error al entrenar el modelo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Realiza una predicción basada en las características proporcionadas
   * @param features - Array de características numéricas
   * @returns Etiqueta predicha
   * @throws Error si el modelo no está entrenado
   */
  predict(features: number[]): string {
    if (!this.model) {
      throw new Error('El modelo debe ser entrenado antes de hacer predicciones');
    }

    try {
      const prediction = this.model.predict([features]);
      const result = this.labelDecoder.get(prediction[0]);
      
      if (result === undefined) {
        throw new Error('No se pudo decodificar la predicción');
      }

      return result;
    } catch (error) {
      throw new Error(`Error al realizar la predicción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtiene el número actual de vecinos (k) utilizados en el modelo
   * @returns Valor de k
   */
  getK(): number {
    return this.k;
  }

  /**
   * Actualiza el número de vecinos (k) para el modelo
   * @param newK - Nuevo valor de k
   * @throws Error si el valor es inválido
   */
  setK(newK: number): void {
    if (newK < 1) {
      throw new Error('El valor de k debe ser mayor que 0');
    }
    this.k = newK;
  }
} 