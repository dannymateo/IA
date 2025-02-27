interface Question {
    id: number;
    text: string;
  }
  
  interface FieldConfig {
    min: number;
    max: number;
    defaultValue: number;
    label: string;
    unit?: string;
    description?: string;
    step?: number;
  }
  
  interface DataInputProps {
    questions: Question[];
    answers: number[];
    setAnswers: (answers: number[]) => void;
    onSubmit: () => void;
    isLoading: boolean;
    title?: string;
    subtitle?: string;
    description?: string;
    fieldConfigs?: Record<number, FieldConfig>;
  }
  
  interface ValidationError {
    index: number;
    message: string;
  }

  export type { Question, FieldConfig, DataInputProps, ValidationError };