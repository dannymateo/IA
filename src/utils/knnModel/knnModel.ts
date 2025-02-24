import KNN from 'ml-knn';

import { TrainingData } from './types';

export class KNNModel {
  private model: KNN | null;
  private labelEncoder: Map<string, number>;
  private labelDecoder: Map<number, string>;

  constructor() {
    this.model = null;
    this.labelEncoder = new Map();
    this.labelDecoder = new Map();
  }

  // Preprocesa las etiquetas convirtiéndolas en valores numéricos
  private preprocessLabels(labels: string[]): number[] {
    const uniqueLabels = Array.from(new Set(labels));
    
    uniqueLabels.forEach((label, index) => {
      this.labelEncoder.set(label, index);
      this.labelDecoder.set(index, label);
    });

    return labels.map(label => this.labelEncoder.get(label)!);
  }

  // Entrena el modelo con los datos proporcionados
  train(trainingData: TrainingData) {
    if (!trainingData.features.length || !trainingData.labels.length) {
      throw new Error('Los datos de entrenamiento no pueden estar vacíos');
    }
    if (trainingData.features.length !== trainingData.labels.length) {
      throw new Error('El número de características y etiquetas debe ser igual');
    }
    const numericLabels = this.preprocessLabels(trainingData.labels);
    this.model = new KNN(trainingData.features, numericLabels, { k: 3 });
  }

  // Predice la respuesta basada en las características proporcionadas
  predict(features: number[]): string {
    if (!this.model) {
      throw new Error('El modelo debe ser entrenado antes de hacer predicciones');
    }
    const prediction = this.model.predict([features]);
    return this.labelDecoder.get(prediction[0])!;
  }
} 