// 'use client';

// import { useState } from 'react';
// import { DiabetesData } from '@/utils/models';

// export default function DiabetesPage() {
//   const [modelsTrained, setModelsTrained] = useState(false);
//   const [results, setResults] = useState<string[]>([]);
//   const [finalAccuracy, setFinalAccuracy] = useState<number | null>(null);
//   const [file, setFile] = useState<File | null>(null);
//   const [error, setError] = useState<string>('');
//   const [loading, setLoading] = useState(false);

//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = event.target.files;
//     if (files && files[0]) {
//       setFile(files[0]);
//       setError('');
//     }
//   };

//   const parseCSV = async (text: string): Promise<DiabetesData[]> => {
//     const lines = text.split('\n');
//     lines.shift(); // Eliminar encabezado
    
//     return lines
//       .filter(line => line.trim() !== '')
//       .map(line => {
//         const values = line.split(',').map(val => Number(val) || 0);
//         return {
//           Pregnancies: values[0],
//           Glucose: values[1],
//           BloodPressure: values[2],
//           SkinThickness: values[3],
//           Insulin: values[4],
//           BMI: values[5],
//           DiabetesPedigreeFunction: values[6],
//           Age: values[7],
//           Outcome: values[8]
//         };
//       });
//   };

//   const processFile = async () => {
//     if (!file) return;
    
//     try {
//       setLoading(true);
//       setError('');
      
//       const text = await file.text();
//       const data = await parseCSV(text);
      
//       const response = await fetch('/api/train', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data)
//       });

//       if (!response.ok) {
//         throw new Error('Error en el servidor');
//       }

//       const result = await response.json();
//       setResults(result.modelAccuracies);
//       setFinalAccuracy(result.finalAccuracy);
//       setModelsTrained(true);
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Error al procesar los datos');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-8">
//       <h1 className="text-3xl font-bold mb-6">Sistema de Predicción de Diabetes</h1>
      
//       <div className="mb-6">
//         <input
//           type="file"
//           accept=".csv"
//           onChange={handleFileUpload}
//           className="mb-4 block w-full text-sm text-gray-500
//             file:mr-4 file:py-2 file:px-4
//             file:rounded-full file:border-0
//             file:text-sm file:font-semibold
//             file:bg-blue-50 file:text-blue-700
//             hover:file:bg-blue-100"
//         />
//         <button
//           onClick={processFile}
//           disabled={!file || loading}
//           className={`px-4 py-2 rounded ${
//             !file || loading
//               ? 'bg-gray-300 cursor-not-allowed' 
//               : 'bg-blue-500 hover:bg-blue-600 text-white'
//           }`}
//         >
//           {loading ? 'Procesando...' : 'Procesar Archivo'}
//         </button>
//       </div>

//       {error && (
//         <p className="text-red-500 mb-4">{error}</p>
//       )}
      
//       {modelsTrained && !error && (
//         <div>
//           <h2 className="text-xl font-semibold mb-4">Resultados del Entrenamiento:</h2>
//           <ul className="space-y-2">
//             {results.map((result, index) => (
//               <li key={index} className="text-lg">{result}</li>
//             ))}
//           </ul>
          
//           {finalAccuracy !== null && (
//             <p className="mt-4 text-lg font-semibold">
//               Precisión Final: {(finalAccuracy * 100).toFixed(2)}%
//             </p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
