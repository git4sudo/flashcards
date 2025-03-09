import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface StorageImage {
  name: string;
  url: string;
}

interface MatchedCard {
  name: string;
  frontUrl: string;
  backUrl: string;
}

export const ImageGallery: React.FC = () => {
  const [matchedCards, setMatchedCards] = useState<MatchedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());

  const toggleReveal = (name: string) => {
    setRevealedCards(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchAndMatchImages = async () => {
      try {
        const frontResult = await supabase.storage
          .from('ror-cards')
          .list('fronts');

        const backResult = await supabase.storage
          .from('ror-cards')
          .list('backs');

        if (frontResult.error) throw frontResult.error;
        if (backResult.error) throw backResult.error;

        const frontImages = frontResult.data.map(file => ({
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          url: supabase.storage
            .from('ror-cards')
            .getPublicUrl(`fronts/${file.name}`).data.publicUrl
        }));

        const backImages = backResult.data.map(file => ({
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          url: supabase.storage
            .from('ror-cards')
            .getPublicUrl(`backs/${file.name}`).data.publicUrl
        }));

        // Match front and back images
        const matched = frontImages.reduce<MatchedCard[]>((acc, front) => {
          const back = backImages.find(b => b.name === front.name);
          if (back) {
            acc.push({
              name: front.name,
              frontUrl: front.url,
              backUrl: back.url
            });
          }
          return acc;
        }, []);

        // Sort by name
        matched.sort((a, b) => a.name.localeCompare(b.name));
        setMatchedCards(matched);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch images');
      } finally {
        setLoading(false);
      }
    };

    fetchAndMatchImages();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500 gap-2">
        <AlertCircle className="w-6 h-6" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Matched Cards ({matchedCards.length})</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {matchedCards.map((card) => (
          <div key={card.name} className="space-y-2">
            <div className="relative">
              <img
                src={revealedCards.has(card.name) ? card.backUrl : card.frontUrl}
                alt={`${card.name} - ${revealedCards.has(card.name) ? 'back' : 'front'}`}
                className="w-full aspect-[3/4] object-cover rounded-lg shadow-md transition-all duration-300"
              />
              <button
                onClick={() => toggleReveal(card.name)}
                className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                aria-label={revealedCards.has(card.name) ? 'Show front' : 'Show back'}
              >
                {revealedCards.has(card.name) ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-sm text-gray-600 text-center truncate" title={card.name}>
              {card.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};