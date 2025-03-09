export interface Flashcard {
  id: string;
  frontImageUrl: string;
  backImageUrl: string;
  fileName: string;
  timesReviewed: number;
  confidenceLevel: number; // 1-3: 1=incorrect, 2=not sure, 3=correct
  correctAnswers: number;
  incorrectAnswers: number;
  lastReviewed?: Date;
  nextReviewDate?: Date;
}

export interface SessionStats {
  cardsReviewed: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
}

export interface FlashcardStore {
  flashcards: Flashcard[];
  currentIndex: number;
  isTestMode: boolean;
  sessionStats: SessionStats;
  fetchFlashcards: () => Promise<void>;
  setCurrentIndex: (index: number) => void;
  updateProgress: (id: string, confidenceLevel: number, isCorrect?: boolean) => void;
  resetConfidence: () => void;
  setTestMode: (enabled: boolean) => void;
  resetSessionStats: () => void;
  updateSessionStats: (isCorrect: boolean) => void;
  getNextCardIndex: () => number;
}