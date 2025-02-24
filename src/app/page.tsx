"use client";
import { useState, useRef } from "react";
import { KNNModel } from '@/utils/knnModel';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Send,
  FileSpreadsheet,
  Lightbulb,
  Check,
  X,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardBody, Button, Select, SelectItem, Spinner, Input, Divider} from "@nextui-org/react";

interface Question {
  id: string;
  text: string;
}

export default function Home() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [recommendation, setRecommendation] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [knnModel, setKnnModel] = useState<KNNModel>(new KNNModel());
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setIsLoading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar el archivo');
      }

      const data = await response.json();
      
      if (!data.questions || !data.trainingData) {
        throw new Error('Formato de datos inválido');
      }

      setQuestions(data.questions);
      
      const model = new KNNModel();
      model.train(data.trainingData);
      setKnnModel(model);
      setError("");
      setAnswers({});
    } catch (e) {
      console.error('Error al cargar el archivo:', e);
      setError('Error al cargar la base de conocimiento: ' + (e instanceof Error ? e.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
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
      if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
          file.type === "application/vnd.ms-excel") {
        const event = {
          target: {
            files: files
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileUpload(event);
      } else {
        setError("Por favor, sube solo archivos Excel (.xlsx, .xls)");
      }
    }
  };

  const determineArchitecture = (answers: Record<string, boolean>) => {
    try {
      if (questions.length === 0) {
        throw new Error('No hay preguntas cargadas');
      }

      const unansweredQuestions = questions.filter(q => answers[q.id] === undefined);
      if (unansweredQuestions.length > 0) {
        throw new Error('Por favor responda todas las preguntas');
      }

      const features = questions.map(q => answers[q.id] ? 1 : 0);
      const result = knnModel.predict(features);
      
      if (!result) {
        throw new Error('No se pudo determinar una recomendación');
      }

      return result;
    } catch (e) {
      console.error('Error al predecir:', e);
      setError(e instanceof Error ? e.message : 'Error al determinar la respuesta');
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = determineArchitecture(answers);
    if (result) {
      setRecommendation(result);
      setError("");
    }
  };

  const handleDownloadTemplate = () => {
    // Ruta al archivo de plantilla
    const templateUrl = '/template.xlsx';
    
    // Crear un elemento <a> temporal
    const link = document.createElement('a');
    link.href = templateUrl;
    link.download = 'plantilla_sistema_experto.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen w-full bg-[#fafafa]">
      <div className="absolute inset-0 bg-grid-slate-200/[0.03] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#ffffff]" style={{ mixBlendMode: 'overlay' }} />
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-r from-indigo-500/5 via-blue-500/5 to-sky-500/5 blur-[120px]" />
      <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-r from-slate-100/10 via-gray-100/10 to-zinc-100/10 blur-[120px]" />

      <div className="relative max-w-7xl mx-auto p-4 md:p-8 lg:p-12 space-y-8">
        <Card className="border border-slate-200/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="flex flex-col gap-4 pt-6 md:pt-8">
            <div className="flex items-center gap-2 w-full justify-between px-4 md:px-8">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse delay-100" />
                <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse delay-200" />
              </div>
              <Brain className="text-indigo-600 w-8 h-8" />
            </div>
            <div className="text-center space-y-3 pb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent">
                Sistema Experto
              </h1>
            </div>
          </CardHeader>
          <CardBody className="space-y-10">
            <Card className="bg-white border border-slate-200">
              <CardHeader className="flex items-center gap-4 p-6 border-b border-slate-100">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-slate-800">Base de Conocimiento</h2>
                  <p className="text-sm text-slate-500">Carga tu archivo Excel</p>
                </div>
                <Button
                  onClick={handleDownloadTemplate}
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-4 py-2 rounded-xl
                    hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 
                    shadow-lg hover:shadow-indigo-500/30 group flex items-center gap-2"
                  size="sm"
                >
                  <span className="text-sm font-medium">Descargar Plantilla</span>
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-300" />
                </Button>
              </CardHeader>
              <CardBody className="p-6 flex flex-col gap-4 justify-center items-center rounded-lg">
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="w-full"
                >
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    description="Arrastra y suelta tu archivo o haz clic para seleccionar"
                    className="border border-dashed border-slate-200 hover:border-indigo-400 transition-all duration-200 justify-center items-center"
                    classNames={{
                      description: "text-slate-500 text-sm",
                      input: "text-slate-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100",
                      inputWrapper: "h-24 flex items-center justify-center bg-slate-50/50 cursor-pointer"
                    }}
                  />
                </div>
                    
                    {isLoading && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                        <Spinner size="sm" color="primary" />
                        <span className="text-sm text-indigo-600">Procesando archivo...</span>
                      </div>
                    )}
              </CardBody>
            </Card>

            {error ? (
              <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-pink-400/5 backdrop-blur-2xl 
                shadow-lg overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
                <CardBody className="flex gap-4 items-center p-6 md:p-8">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-red-400 font-medium">{error}</p>
                </CardBody>
              </Card>
            ) : (
              <>
                {questions.length > 0 && (
                  <Card className="bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-lg">
                    <CardHeader className="flex gap-4 px-6 md:px-8 pt-6 md:pt-8">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-[#60a5fa]/10 to-[#93c5fd]/10 border border-slate-200">
                        <CheckCircle2 className="w-7 h-7 text-[#60a5fa]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-medium text-slate-800">Cuestionario</h2>
                        <p className="text-slate-500 text-sm mt-1" role="status">
                          {Object.keys(answers).length} de {questions.length} preguntas respondidas
                        </p>
                      </div>
                    </CardHeader>
                    <CardBody className="px-4 md:px-8 py-8 md:py-10">
                      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
                        <div className="flex flex-col gap-4 md:gap-6">
                          {questions.map((question, index) => (
                            <div 
                              key={question.id}
                              className="relative group bg-gradient-to-br from-slate-50 to-white 
                                rounded-2xl p-6 md:p-8 border border-slate-200/60 hover:border-[#60a5fa]/40 
                                transition-all duration-300 hover:shadow-lg hover:shadow-[#60a5fa]/5"
                            >
                              <div className="flex items-start gap-6">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#60a5fa]/10 to-[#93c5fd]/10 text-[#60a5fa] font-semibold text-lg">
                                  {index++}
                                </span>
                                <div className="flex-1 space-y-6">
                                  <label className="block text-xl text-slate-800 font-medium">
                                    {question.text}
                                  </label>
                                  <div className="flex gap-6">
                                    <Button
                                      type="button"
                                      onPress={() => setAnswers({...answers, [question.id]: false})}
                                      className={`flex-1 p-6 rounded-xl transition-all duration-300 text-lg font-medium flex justify-center items-center ${
                                        answers[question.id] === false 
                                          ? "bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-400/30 text-red-600 shadow-lg"
                                          : "bg-white border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                                      }`}
                                    >
                                      <X className={`w-6 h-6 mr-3 ${
                                        answers[question.id] === false ? "text-red-500" : "text-slate-400"
                                      }`} />
                                      No
                                    </Button>
                                    <Button
                                      type="button"
                                      onPress={() => setAnswers({...answers, [question.id]: true})}
                                      className={`flex-1 p-6 rounded-xl transition-all duration-300 text-lg font-medium flex justify-center items-center${
                                        answers[question.id] === true
                                          ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-400/30 text-emerald-600 shadow-lg"
                                          : "bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-500"
                                      }`}
                                    >
                                      <Check className={`w-6 h-6 mr-3 ${
                                        answers[question.id] === true ? "text-emerald-500" : "text-slate-400"
                                      }`} />
                                      Sí
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-center pt-6 md:pt-8">
                          <Button
                            type="submit"
                            size="lg"
                            disabled={Object.keys(answers).length !== questions.length}
                            className="bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-500 hover:from-indigo-600 hover:via-blue-600 hover:to-sky-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 text-center flex justify-center items-center rounded-full gap-2"
                            endContent={<Send className="w-6 h-6 md:w-7 md:h-7" />}
                          >
                            Obtener Recomendación
                          </Button>
                        </div>
                      </form>
                    </CardBody>
                  </Card>
                )}

                {recommendation && (
                  <Card className="bg-white/95 backdrop-blur-3xl border border-slate-200/60 shadow-xl">
                    <CardHeader className="flex gap-5 px-6 md:px-8 pt-6 md:pt-8">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-sky-500/10 
                        border border-slate-200/60">
                        <Lightbulb className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-800">Recomendación</h2>
                        <p className="text-slate-500 text-sm mt-1.5">Basada en tus respuestas</p>
                      </div>
                    </CardHeader>
                    
                    <Divider className="bg-slate-200/60 my-4 md:my-6" />
                    
                    <CardBody className="px-6 md:px-8 pb-8 md:pb-10">
                      <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-sky-500/5 
                        border border-slate-200/60 hover:border-indigo-500/30 transition-all duration-300 shadow-inner">
                        <p className="text-xl md:text-2xl text-slate-700 leading-relaxed text-center">{recommendation}</p>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
