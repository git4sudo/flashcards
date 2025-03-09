import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Database } from '../types/supabase';

type RoRCard = Database['public']['Tables']['ror_cards']['Row'];

interface RoRCardProps {
  card: RoRCard;
  isRevealed: boolean;
  onToggleReveal: () => void;
}

export const RoRCard: React.FC<RoRCardProps> = ({ card, isRevealed, onToggleReveal }) => {
  return (
    <div className="relative">
      <motion.div
        className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-lg"
        initial={false}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isRevealed ? 'back' : 'front'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <img
              src={isRevealed ? card.back_image_url : card.front_image_url}
              alt={`${card.name} - ${isRevealed ? 'back' : 'front'}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <button
        onClick={onToggleReveal}
        className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label={isRevealed ? 'Hide description' : 'Show description'}
      >
        {isRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
};