export type MistakeAnalysis = {
  knowledgePoints: string[];
  errorType: string;
  explanation: string;
  reviewAdvice: string;
  confidence: number;
};

export type GeneratedQuestion = {
  questionText: string;
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  knowledgePoints: string[];
};

export type AIProvider = {
  analyzeMistake(input: { questionText: string; userAnswer?: string; correctAnswer?: string; grade: string; subject: string }): Promise<MistakeAnalysis>;
  generateQuestion(input: { questionText: string; grade: string; subject: string; difficulty?: GeneratedQuestion["difficulty"] }): Promise<GeneratedQuestion>;
};
