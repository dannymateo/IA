import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import { CheckCircle2, Check, X, Send } from "lucide-react";
import React from 'react';
import { Question } from '../types';

interface QuestionnaireProps {
    questions: Question[];
    answers: Record<number, boolean>;
    setAnswers: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    onSubmit: (e: React.FormEvent) => void;
}

export function Questionnaire({
    questions,
    answers,
    setAnswers,
    onSubmit
}: QuestionnaireProps) {
    return (
        <Card className="max-w-3xl mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-lg">
            <CardHeader className="flex gap-6 px-8 pt-8">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-100">
                    <CheckCircle2 className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold text-slate-800">Cuestionario</h2>
                    <p className="text-slate-500 text-sm mt-1.5" role="status">
                        {Object.keys(answers).length} de {questions.length} preguntas respondidas
                    </p>
                </div>
            </CardHeader>

            <CardBody className="px-8 pb-8">
                <form onSubmit={onSubmit} className="space-y-5">
                    {questions.map((question) => (
                        <div 
                            key={question.id}
                            className="p-5 rounded-2xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                                <p className="text-slate-700 text-lg flex-1">{question.text}</p>
                                <div className="flex justify-end items-center gap-3">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className={`${
                                            answers[question.id] === true
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                        } min-w-[90px] px-4 py-2.5 rounded-xl flex items-center gap-2 justify-center transition-all duration-200`}
                                        onClick={() => setAnswers({ ...answers, [question.id]: true })}
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>Sí</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className={`${
                                            answers[question.id] === false
                                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                        } min-w-[90px] px-4 py-2.5 rounded-xl flex items-center gap-2 justify-center transition-all duration-200`}
                                        onClick={() => setAnswers({ ...answers, [question.id]: false })}
                                    >
                                        <X className="w-4 h-4" />
                                        <span>No</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-center mt-4 max-w-xl mx-auto">
                        <Button
                            type="submit"
                            className="w-full mt-8 bg-blue-50 text-blue-600 border border-blue-200 py-4 rounded-xl
                            hover:bg-blue-100 transition-all duration-300 flex items-center justify-center gap-3 
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
                            disabled={Object.keys(answers).length !== questions.length}
                        >
                            <Send className="w-5 h-5" />
                            <span className="text-lg font-medium">Obtener Recomendación</span>
                        </Button>
                    </div>
                </form>
            </CardBody>
        </Card>
    );
} 