import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type RoRCard = Database['public']['Tables']['ror_cards']['Row'];

interface RoRCardStore {
  cards: RoRCard[];
  loading: boolean;
  error: string | null;
  revealedCards: Set<string>;
  fetchCards: () => Promise<void>;
  addCard: (card: Omit<RoRCard, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  toggleReveal: (id: string) => void;
}

export const useRoRCardStore = create<RoRCardStore>((set, get) => ({
  cards: [],
  loading: false,
  error: null,
  revealedCards: new Set(),

  fetchCards: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('ror_cards')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ cards: data || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch cards',
        loading: false 
      });
    }
  },

  addCard: async (card) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('ror_cards')
        .insert([card]);

      if (error) throw error;
      get().fetchCards();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add card',
        loading: false 
      });
    }
  },

  deleteCard: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('ror_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      get().fetchCards();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete card',
        loading: false 
      });
    }
  },

  toggleReveal: (id) => {
    set((state) => {
      const newRevealedCards = new Set(state.revealedCards);
      if (newRevealedCards.has(id)) {
        newRevealedCards.delete(id);
      } else {
        newRevealedCards.add(id);
      }
      return { revealedCards: newRevealedCards };
    });
  },
}));