'use client';

import { useEffect, useState } from 'react';
import { Card as CardType, getCardsByDeckId, deleteCard, updateCard } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface Props {
  deckId: string;
  onCardAdded?: () => void;
  onCardUpdated?: () => void;
}

interface EditingCard {
  id: string;
  front: string;
  back: string;
}

export default function CardBrowser({ deckId, onCardAdded, onCardUpdated }: Props) {
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<EditingCard | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadCards = async () => {
    try {
      const loadedCards = await getCardsByDeckId(deckId);
      setCards(loadedCards.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [deckId]);

  const handleDeleteCard = async (id: string) => {
    if (confirm('Delete this card?')) {
      try {
        await deleteCard(id);
        await loadCards();
      } catch (error) {
        console.error('Failed to delete card:', error);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;

    try {
      await updateCard(editingCard.id, {
        front: editingCard.front,
        back: editingCard.back,
      });
      setEditingCard(null);
      setIsDialogOpen(false);
      await loadCards();
      onCardUpdated?.();
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-neutral-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600 mb-4">No cards in this deck yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const daysUntilReview = Math.ceil((card.nextReview - Date.now()) / (1000 * 60 * 60 * 24));
        const isDue = card.nextReview <= Date.now();

        return (
          <Card key={card.id} className="p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{card.front}</p>
                  <p className="text-sm text-neutral-600 mt-1">{card.back}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Dialog open={isDialogOpen && editingCard?.id === card.id} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCard({ id: card.id, front: card.front, back: card.back })}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Card</DialogTitle>
                      </DialogHeader>
                      {editingCard?.id === card.id && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Question</label>
                            <Textarea
                              value={editingCard.front}
                              onChange={(e) =>
                                setEditingCard({ ...editingCard, front: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Answer</label>
                            <Textarea
                              value={editingCard.back}
                              onChange={(e) =>
                                setEditingCard({ ...editingCard, back: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSaveEdit} className="bg-primary hover:bg-blue-700">
                              Save
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingCard(null);
                                setIsDialogOpen(false);
                              }}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCard(card.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {card.repetitions > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {card.repetitions} reps
                  </Badge>
                )}
                {isDue ? (
                  <Badge className="bg-red-500 text-white text-xs">Due now</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Due in {daysUntilReview} days
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  EF: {card.easeFactor.toFixed(2)}
                </Badge>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
