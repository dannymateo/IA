import { Button, Input } from "@nextui-org/react";
import { Spinner } from "@nextui-org/react";
import { FileSpreadsheet } from "lucide-react";

interface Question {
  id: number;
  text: string;
}

interface DataInputProps {
  questions: Question[];
  answers: number[];
  setAnswers: (answers: number[]) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function DataInput({ questions, answers, setAnswers, onSubmit, isLoading }: DataInputProps) {
  const handleInputChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = Number(value) || 0;
    setAnswers(newAnswers);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red">
        {questions.map((question, index) => (
          <Input
            key={question.id}
            type="number"
            label={question.text}
            value={answers[index].toString()}
            onChange={(e) => handleInputChange(index, e.target.value)}
            className="w-full"
          />
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <Button
          size="lg"
          className="bg-blue-50 text-blue-600 border border-blue-200 py-4 rounded-xl
                     hover:bg-blue-100 transition-all duration-300 flex items-center justify-center gap-3"
          onPress={onSubmit}
          isDisabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Spinner color="current" size="sm" />
              <span>Procesando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              <span>Analizar Datos</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
} 