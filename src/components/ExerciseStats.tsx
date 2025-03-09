import React from 'react';
import { Trophy, Zap, CheckCircle, XCircle } from 'lucide-react';
import { useFlashcardStore } from '../store/flashcardStore';

export const ExerciseStats: React.FC = () => {
  const stats = useFlashcardStore((state) => state.sessionStats);
  const successRate = stats.cardsReviewed > 0
    ? Math.round((stats.correctAnswers / stats.cardsReviewed) * 100)
    : 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-500" size={20} />
          <div>
            <p className="text-sm text-gray-600">Cards Reviewed</p>
            <p className="text-lg font-semibold">{stats.cardsReviewed}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={20} />
          <div>
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-lg font-semibold">{successRate}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="text-blue-500" size={20} />
          <div>
            <p className="text-sm text-gray-600">Current Streak</p>
            <p className="text-lg font-semibold">{stats.currentStreak}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="text-purple-500" size={20} />
          <div>
            <p className="text-sm text-gray-600">Best Streak</p>
            <p className="text-lg font-semibold">{stats.bestStreak}</p>
          </div>
        </div>
      </div>
    </div>
  );
};