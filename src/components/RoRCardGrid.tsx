import React, { useEffect } from 'react';
import { useRoRCardStore } from '../store/rorCardStore';
import { RoRCard } from './RoRCard';
import { Loader2 } from 'lucide-react';

export const RoRCardGrid: React.FC = () => {
  const { cards, loading, error, revealedCards, fetchCards, toggleReveal } = useRoRCardStore();

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Error: {error}
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="text-gray-500 text-center py-8">
        No cards available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
      {cards.map((card) => (
        <RoRCard
          key={card.id}
          card={card}
          isRevealed={revealedCards.has(card.id)}
          onToggleReveal={() => toggleReveal(card.id)}
        />
      ))}
    </div>
  );
};