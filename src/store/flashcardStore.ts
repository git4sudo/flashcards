import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Flashcard, FlashcardStore } from '../types';
import { supabase } from '../lib/supabase';

const calculateNextReviewDate = (confidenceLevel: number, lastReviewed: Date) => {
  const baseInterval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
  const multiplier = Math.pow(2, 3 - confidenceLevel); // 1-3 confidence levels
  return new Date(lastReviewed.getTime() + (baseInterval * multiplier));
};

const getWeightedRandomIndex = (flashcards: Flashcard[]): number => {
  const now = new Date();
  const eligibleCards = flashcards.filter(card => !card.nextReviewDate || card.nextReviewDate <= now);
  
  if (eligibleCards.length === 0) return Math.floor(Math.random() * flashcards.length);

  // Weight distribution: 50% for 1-star, 30% for 2-star, 20% for 3-star
  const weights = eligibleCards.map(card => {
    if (card.confidenceLevel === 1) return 0.5;
    if (card.confidenceLevel === 2) return 0.3;
    return 0.2;
  });

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return flashcards.indexOf(eligibleCards[i]);
    }
  }

  return 0;
};

export const useFlashcardStore = create(
  persist<FlashcardStore>(
    (set, get) => ({
      flashcards: [],
      currentIndex: 0,
      isTestMode: false,
      sessionStats: {
        cardsReviewed: 0,
        correctAnswers: 0,
        currentStreak: 0,
        bestStreak: 0,
      },
      
      fetchFlashcards: async () => {
        try {
          console.log('Fetching flashcards...');
          
          // Get the list of front images
          const { data: frontFiles, error: frontError } = await supabase.storage
            .from('flashcards')
            .list('front', {
              limit: 1000, // Increase limit to ensure all files are loaded
              sortBy: { column: 'name', order: 'asc' }
            });

          if (frontError) {
            console.error('Error listing front files:', frontError);
            throw frontError;
          }

          // Get the list of back images
          const { data: backFiles, error: backError } = await supabase.storage
            .from('flashcards')
            .list('back', {
              limit: 1000, // Increase limit to ensure all files are loaded
              sortBy: { column: 'name', order: 'asc' }
            });

          if (backError) {
            console.error('Error listing back files:', backError);
            throw backError;
          }

          if (!frontFiles || !backFiles) {
            console.error('No files found in the storage buckets');
            return;
          }

          console.log('Found files:', { 
            frontFiles: frontFiles.length, 
            backFiles: backFiles.length 
          });

          // Get stored confidence levels
          const storedConfidence = JSON.parse(localStorage.getItem('flashcard-confidence') || '{}');

          // Match front and back images by name
          const matchedCards = frontFiles.reduce<Flashcard[]>((acc, frontFile) => {
            const backFile = backFiles.find(b => b.name === frontFile.name);

            if (backFile) {
              // Get the public URLs for the images
              const { data: { publicUrl: frontUrl } } = supabase.storage
                .from('flashcards')
                .getPublicUrl(`front/${frontFile.name}`);

              const { data: { publicUrl: backUrl } } = supabase.storage
                .from('flashcards')
                .getPublicUrl(`back/${backFile.name}`);

              acc.push({
                id: frontFile.name.replace('.png', ''),
                frontImageUrl: frontUrl,
                backImageUrl: backUrl,
                fileName: frontFile.name,
                timesReviewed: storedConfidence[frontFile.name]?.timesReviewed || 0,
                confidenceLevel: storedConfidence[frontFile.name]?.confidenceLevel || 1,
                correctAnswers: storedConfidence[frontFile.name]?.correctAnswers || 0,
                incorrectAnswers: storedConfidence[frontFile.name]?.incorrectAnswers || 0,
                lastReviewed: storedConfidence[frontFile.name]?.lastReviewed ? new Date(storedConfidence[frontFile.name].lastReviewed) : undefined,
                nextReviewDate: storedConfidence[frontFile.name]?.nextReviewDate ? new Date(storedConfidence[frontFile.name].nextReviewDate) : undefined,
              });
            }
            return acc;
          }, []);

          console.log('Matched cards:', matchedCards.length);

          // Sort cards by numeric order
          matchedCards.sort((a, b) => {
            const aNum = parseInt(a.fileName.replace('.png', ''));
            const bNum = parseInt(b.fileName.replace('.png', ''));
            return aNum - bNum;
          });

          set({ flashcards: matchedCards });
        } catch (error) {
          console.error('Error fetching flashcards:', error);
        }
      },

      setCurrentIndex: (index) => set({ currentIndex: index }),

      updateProgress: (id, confidenceLevel, isCorrect) => {
        const now = new Date();
        set((state) => {
          const updatedFlashcards = state.flashcards.map((card) =>
            card.id === id
              ? {
                  ...card,
                  confidenceLevel,
                  timesReviewed: card.timesReviewed + 1,
                  lastReviewed: now,
                  nextReviewDate: calculateNextReviewDate(confidenceLevel, now),
                  correctAnswers: isCorrect !== undefined
                    ? card.correctAnswers + (isCorrect ? 1 : 0)
                    : card.correctAnswers,
                  incorrectAnswers: isCorrect !== undefined
                    ? card.incorrectAnswers + (isCorrect ? 0 : 1)
                    : card.incorrectAnswers,
                }
              : card
          );

          // Update local storage with confidence levels
          const confidenceData = updatedFlashcards.reduce((acc, card) => {
            acc[card.fileName] = {
              confidenceLevel: card.confidenceLevel,
              timesReviewed: card.timesReviewed,
              correctAnswers: card.correctAnswers,
              incorrectAnswers: card.incorrectAnswers,
              lastReviewed: card.lastReviewed,
              nextReviewDate: card.nextReviewDate,
            };
            return acc;
          }, {} as Record<string, any>);
          
          localStorage.setItem('flashcard-confidence', JSON.stringify(confidenceData));

          return { flashcards: updatedFlashcards };
        });
      },

      resetConfidence: () => {
        localStorage.removeItem('flashcard-confidence');
        set((state) => ({
          flashcards: state.flashcards.map(card => ({
            ...card,
            confidenceLevel: 1,
            timesReviewed: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            lastReviewed: undefined,
            nextReviewDate: undefined,
          }))
        }));
      },

      setTestMode: (enabled) => set({ isTestMode: enabled }),

      resetSessionStats: () => set({
        sessionStats: {
          cardsReviewed: 0,
          correctAnswers: 0,
          currentStreak: 0,
          bestStreak: 0,
        },
      }),

      updateSessionStats: (isCorrect) => set((state) => {
        const newStreak = isCorrect ? state.sessionStats.currentStreak + 1 : 0;
        return {
          sessionStats: {
            cardsReviewed: state.sessionStats.cardsReviewed + 1,
            correctAnswers: state.sessionStats.correctAnswers + (isCorrect ? 1 : 0),
            currentStreak: newStreak,
            bestStreak: Math.max(state.sessionStats.bestStreak, newStreak),
          },
        };
      }),

      getNextCardIndex: () => {
        const state = get();
        return state.isTestMode
          ? getWeightedRandomIndex(state.flashcards)
          : (state.currentIndex + 1) % state.flashcards.length;
      },
    }),
    {
      name: 'flashcard-storage',
      partialize: (state) => ({
        flashcards: state.flashcards.map(card => ({
          id: card.id,
          confidenceLevel: card.confidenceLevel,
          timesReviewed: card.timesReviewed,
          correctAnswers: card.correctAnswers,
          incorrectAnswers: card.incorrectAnswers,
          lastReviewed: card.lastReviewed,
          nextReviewDate: card.nextReviewDate,
        })),
      }),
    }
  )
);