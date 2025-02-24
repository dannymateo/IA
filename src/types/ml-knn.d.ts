declare module 'ml-knn' {
  export default class KNN {
    constructor(features: number[][], labels: number[], options?: { k: number });
    predict(features: number[][]): number[];
  }
} 