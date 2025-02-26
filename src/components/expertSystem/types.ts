export interface Question {
    id: number;
    text: string;
}

export interface Answer {
    questionId: number;
    value: boolean;
}