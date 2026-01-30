'use client';

import { useEffect, useState } from 'react';
import { Card as CardUI, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllDecks, getCardsByDeckId, getCardsDueForReview, deleteDeck, type Deck } from '@/lib/db';
import Link from 'next/link';
import { BarChart3, Plus, Trash2 } from 'lucide-react';

interface DeckWithStats extends Deck {
  cardCount: number;
  dueCount: number;
}

interface Props {
  onRefresh?: boolean;
}

export default function DeckList({ onRefresh }: Props) {
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDecks = async () => {
    try {
      const allDecks = await getAllDecks();
      const decksWithStats = await Promise.all(
        allDecks.map(async (deck) => {
          const cards = await getCardsByDeckId(deck.id);
          const dueCards = await getCardsDueForReview(deck.id);
          return {
            ...deck,
            cardCount: cards.length,
            dueCount: dueCards.length,
          };
        })
      );
      setDecks(decksWithStats.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (error) {
      console.error('Failed to load decks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, [onRefresh]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this deck? All cards will be deleted.')) {
      try {
        await deleteDeck(id);
        await loadDecks();
      } catch (error) {
        console.error('Failed to delete deck:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-neutral-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
        <p className="text-neutral-600 mb-4">No decks yet. Create your first deck to get started!</p>
        <Link href="/create-deck">
          <Button className="bg-primary hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Deck
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {decks.map((deck) => (
        <CardUI key={deck.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link href={`/deck/${deck.id}`}>
                  <CardTitle className="hover:text-primary transition-colors cursor-pointer">
                    {deck.name}
                  </CardTitle>
                </Link>
                {deck.description && <CardDescription>{deck.description}</CardDescription>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(deck.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-neutral-600">Total Cards</p>
                <p className="text-2xl font-bold">{deck.cardCount}</p>
              </div>
              {deck.dueCount > 0 && (
                <div>
                  <p className="text-sm text-neutral-600">Due for Review</p>
                  <Badge className="bg-accent text-accent-foreground">{deck.dueCount}</Badge>
                </div>
              )}
              <Link href={`/study/${deck.id}`} className="ml-auto">
                <Button
                  disabled={deck.cardCount === 0}
                  className="bg-primary hover:bg-blue-700"
                >
                  {deck.dueCount > 0 ? 'Study Now' : 'Review'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </CardUI>
      ))}
    </div>
  );
}
