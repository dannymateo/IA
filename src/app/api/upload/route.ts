import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Leer hoja de preguntas
    const questionsSheet = workbook.Sheets['Preguntas'];
    const questionsData = XLSX.utils.sheet_to_json(questionsSheet);
    
    // Leer hoja de conocimiento
    const knowledgeSheet = workbook.Sheets['Conocimiento'];
    const knowledgeData = XLSX.utils.sheet_to_json(knowledgeSheet);

    const questions = questionsData.map((row: any) => ({
      id: row.id,
      text: row.pregunta
    }));

    const features: number[][] = [];
    const labels: string[] = [];

    // Obtener las columnas dinámicamente (excluyendo 'respuesta')
    const featureColumns = Object.keys(knowledgeData[0] as Record<string, unknown>).filter(key => key !== 'respuesta');

    knowledgeData.forEach((row: any) => {
      features.push(featureColumns.map(col => Number(row[col])));
      labels.push(row.respuesta);
    });

    return NextResponse.json({ 
      questions,
      trainingData: { features, labels }
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json({ error: 'Error processing file' }, { status: 500 });
  }
} 