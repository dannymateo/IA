interface Question {
    id: string;
    text: string;
  } 

  interface QuestionnaireProps {
    questions: Question[];
    answers: Record<string, boolean>;
    setAnswers: (answers: Record<string, boolean>) => void;
    onSubmit: (e: React.FormEvent) => void;
  }

  export type { Question, QuestionnaireProps };