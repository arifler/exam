export type OptionLetter = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Exam {
  id: string;
  title: string;
  subject: string;
  gradeClass: string;
  date: string;
  questionCount: number;
  optionsCount: 4 | 5;
  answerKey: Record<number, string>;
  pointsPerQuestion: number;
  penaltyRatio: number; // e.g. 0 (none), 3 (3 wrongs = 1 correct penalty), 4 (4 wrongs = 1 correct penalty)
  createdAt: string;
}

export interface Student {
  id: string;
  studentNumber: string;
  fullName: string;
  gradeClass: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentNumber: string;
  studentName: string;
  studentClass?: string;
  answers: Record<number, string>; // questionNumber -> marked option 'A'-'E' or ''
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  netScore: number;
  totalScore: number;
  scannedAt: string;
  opticalConfidence?: number;
  notes?: string;
}

export interface QuestionAnalysis {
  questionNumber: number;
  correctAnswer: string;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  successRate: number; // 0 - 100
  optionDistribution: Record<string, number>; // 'A': 5, 'B': 2, etc.
}

export interface ScanEvaluationResponse {
  success: boolean;
  studentNumber?: string;
  studentName?: string;
  answers: Record<number, string>;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  netScore: number;
  totalScore: number;
  confidence?: number;
  message?: string;
  details?: {
    questionNumber: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    isEmpty: boolean;
  }[];
}
