import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Flashcard as FlashcardType } from '../types';

interface FlashcardProps {
  card: FlashcardType;
  onRate: (confidenceLevel: number) => void;
  onFlip?: (isFlipped: boolean) => void;
  isFlipped?: boolean;
}

export const Flashcard: React.FC<FlashcardProps> = ({ 
  card, 
  onRate, 
  onFlip,
  isFlipped: controlledIsFlipped 
}) => {
  const [internalIsFlipped, setInternalIsFlipped] = useState(false);
  const isFlipped = controlledIsFlipped ?? internalIsFlipped;

  const handleFlip = () => {
    const newFlipped = !isFlipped;
    setInternalIsFlipped(newFlipped);
    onFlip?.(newFlipped);
  };

  return (
    <div className="w-full max-w-lg mx-auto perspective">
      <motion.div
        className="relative w-full h-96 cursor-pointer"
        onClick={handleFlip}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className={`absolute w-full h-full rounded-xl shadow-lg backface-hidden
            ${isFlipped ? 'hidden' : 'block'}`}
        >
          <img
            src={card.frontImageUrl}
            alt="Flashcard front"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>

        <div
          className={`absolute w-full h-full rounded-xl shadow-lg backface-hidden
            ${isFlipped ? 'block' : 'hidden'}`}
          style={{ transform: 'rotateY(180deg)' }}
        >
          <img
            src={card.backImageUrl}
            alt="Flashcard back"
            className="w-full h-full object-cover rounded-xl"
          />
          <div className="absolute inset-0 bg-black/50 p-6 text-white">
            <div className="h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">{card.category}</h3>
                <p className="text-gray-200">{card.description}</p>
                <p className="text-gray-400 text-sm mt-2">File: {card.fileName}</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-gray-300">
                  Times reviewed: {card.timesReviewed} | 
                  Correct: {card.correctAnswers} | 
                  Incorrect: {card.incorrectAnswers}
                </p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRate(level);
                      }}
                      className={`p-2 rounded-full transition-colors
                        ${level <= card.confidenceLevel
                          ? 'text-yellow-500'
                          : 'text-gray-300'}`}
                    >
                      <Star size={24} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};