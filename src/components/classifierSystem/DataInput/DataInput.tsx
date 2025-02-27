import { Button, Slider, Input } from "@nextui-org/react";
import { Spinner } from "@nextui-org/react";
import { FileSpreadsheet, AlertCircle, Activity, Info } from "lucide-react";
import { useState, useEffect } from "react";

import { DataInputProps, ValidationError, FieldConfig } from "./types";

export function DataInput({ 
  questions, 
  answers, 
  setAnswers, 
  onSubmit, 
  isLoading,
  title = "Sistema de Clasificación",
  subtitle = "Parámetros de Entrada",
  description = "Ajusta los valores de cada parámetro usando los controles deslizantes",
  fieldConfigs 
}: DataInputProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<boolean[]>(new Array(questions.length).fill(false));

  // Configuración por defecto para campos
  const defaultFieldConfig: FieldConfig = {
    min: 0,
    max: 100,
    defaultValue: 0,
    label: "Valor",
    step: 0.1
  };

  // Combinar configuraciones proporcionadas con valores por defecto
  const getFieldConfig = (index: number): FieldConfig => {
    return {
      ...defaultFieldConfig,
      ...fieldConfigs?.[index]
    };
  };

  useEffect(() => {
    // Reiniciar estados cuando cambian las preguntas
    setTouched(new Array(questions.length).fill(false));
    setErrors([]);
  }, [questions]);

  const handleSliderChange = (index: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    
    const newTouched = [...touched];
    newTouched[index] = true;
    setTouched(newTouched);
    
    validateField(index, value);
  };

  const validateField = (index: number, value: number) => {
    const config = getFieldConfig(index);
    const newErrors = errors.filter(error => error.index !== index);
    
    if (value < config.min || value > config.max) {
      newErrors.push({
        index,
        message: `El valor debe estar entre ${config.min} y ${config.max}`
      });
    }
    
    setErrors(newErrors);
  };

  const isFormValid = () => {
    return answers.every((answer, index) => {
      const config = getFieldConfig(index);
      return answer !== null && 
             !isNaN(answer) && 
             answer >= config.min && 
             answer <= config.max;
    });
  };

  const getProgressColor = (value: number, min: number, max: number) => {
    const percentage = ((value - min) / (max - min)) * 100;
    
    if (percentage <= 25) {
      return "bg-green-500";
    } else if (percentage <= 50) {
      return "bg-blue-500";
    } else if (percentage <= 75) {
      return "bg-yellow-500";
    } else {
      return "bg-red-500";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-3 bg-blue-50 px-4 py-2 rounded-full">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">{title}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent 
                        bg-gradient-to-r from-indigo-600 to-purple-600">
            {subtitle}
          </h2>
          <p className="text-sm text-slate-600/90 max-w-md mx-auto">
            {description}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isFormValid()) {
              onSubmit();
            }
          }}
          className="space-y-8 p-8 bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {questions.map((question, index) => {
              const config = getFieldConfig(index);
              const error = errors.find(e => e.index === index);
              
              return (
                <div key={question.id} 
                     className={`p-6 rounded-xl transition-all duration-300
                                ${error && touched[index] 
                                  ? 'bg-red-50/50 border border-red-200' 
                                  : 'bg-slate-50/50 border border-slate-200/60 hover:border-blue-200/60'}`}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-slate-700">
                          {question.text}
                        </label>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors">
                          <Input
                            type="number"
                            value={answers[index]?.toString() || '0'}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value)) {
                                handleSliderChange(index, value);
                              }
                            }}
                            className="w-24"
                            classNames={{
                              input: "text-center font-medium text-indigo-600 text-lg",
                              inputWrapper: "bg-transparent shadow-none hover:bg-indigo-50/30 transition-colors"
                            }}
                            size="sm"
                            min={config.min}
                            max={config.max}
                            step={config.step}
                          />
                          {config.unit && (
                            <span className="text-sm font-medium text-slate-500">{config.unit}</span>
                          )}
                        </div>
                      </div>
                      {config.description && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Info className="w-4 h-4" />
                          <span>{config.description}</span>
                        </div>
                      )}
                    </div>
                    
                    <Slider
                      aria-label={config.label}
                      size="lg"
                      step={config.step}
                      minValue={config.min}
                      maxValue={config.max}
                      defaultValue={config.defaultValue}
                      value={answers[index] || config.defaultValue}
                      onChange={(value) => handleSliderChange(index, Number(value))}
                      showSteps={false}
                      startContent={
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-medium text-indigo-600">{config.min}</span>
                          <span className="text-[10px] text-slate-500">Min</span>
                        </div>
                      }
                      endContent={
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-medium text-indigo-600">{config.max}</span>
                          <span className="text-[10px] text-slate-500">Max</span>
                        </div>
                      }
                      classNames={{
                        base: "max-w-full py-4",
                        filler: "bg-gradient-to-r from-indigo-500 to-purple-500",
                        thumb: [
                          "transition-all duration-200",
                          "before:bg-gradient-to-r before:from-indigo-500 before:to-purple-500",
                          "after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500",
                          "shadow-lg hover:shadow-xl scale-125",
                          "group-data-[focused=true]:shadow-lg",
                        ].join(" "),
                        track: "bg-slate-200/60 h-3 rounded-full",
                        mark: "hidden",
                        label: "font-medium text-slate-600"
                      }}
                    />

                    {error && touched[index] && (
                      <div className="flex items-center gap-2 text-red-600 text-xs">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              className="w-full max-w-md bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                        hover:from-blue-600 hover:to-indigo-600 
                        transition-all duration-300 flex items-center justify-center gap-3 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-lg hover:shadow-xl
                        py-6 rounded-xl"
              onPress={onSubmit}
              isDisabled={!isFormValid() || isLoading || errors.length > 0}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner color="white" size="sm" />
                  <span>Procesando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Determinar</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 