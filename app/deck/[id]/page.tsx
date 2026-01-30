'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDeck, createCard, getCardsByDeckId, getCardsDueForReview } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import CardBrowser from '@/components/card-browser';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import type { Deck } from '@/lib/db';

export default function DeckPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardCount, setCardCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadDeck = async () => {
      try {
        const deckData = await getDeck(deckId);
        if (!deckData) {
          router.push('/');
          return;
        }
        setDeck(deckData);

        const cards = await getCardsByDeckId(deckId);
        setCardCount(cards.length);

        const due = await getCardsDueForReview(deckId);
        setDueCount(due.length);
      } catch (error) {
        console.error('Failed to load deck:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadDeck();
  }, [deckId, router]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!front.trim() || !back.trim()) {
      setError('Both question and answer are required');
      return;
    }

    setIsAddingCard(true);
    try {
      await createCard(deckId, front, back);
      setFront('');
      setBack('');
      setIsDialogOpen(false);
      setRefreshKey((prev) => prev + 1);

      // Update counts
      const cards = await getCardsByDeckId(deckId);
      setCardCount(cards.length);
    } catch (err) {
      console.error('Failed to add card:', err);
      setError('Failed to add card. Please try again.');
    } finally {
      setIsAddingCard(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!deck) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Decks
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{deck.name}</h1>
              {deck.description && (
                <p className="text-neutral-600 mt-1">{deck.description}</p>
              )}
            </div>
            {dueCount > 0 && (
              <Link href={`/study/${deckId}`}>
                <Button className="bg-accent hover:bg-cyan-600 text-white">
                  Study Now ({dueCount})
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-neutral-600 text-sm">Total Cards</p>
              <p className="text-4xl font-bold text-primary">{cardCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-neutral-600 text-sm">Due for Review</p>
              <p className="text-4xl font-bold text-accent">{dueCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-neutral-600 text-sm">Progress</p>
              <p className="text-4xl font-bold text-green-600">
                {cardCount > 0 ? Math.round(((cardCount - dueCount) / cardCount) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Card Dialog */}
        <div className="mb-8">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Card</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCard} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Question</label>
                  <Textarea
                    placeholder="What should the student learn?"
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    disabled={isAddingCard}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Answer</label>
                  <Textarea
                    placeholder="The correct answer or explanation"
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    disabled={isAddingCard}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isAddingCard}
                    className="bg-primary hover:bg-blue-700"
                  >
                    {isAddingCard ? 'Adding...' : 'Add Card'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    variant="outline"
                    disabled={isAddingCard}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Card Browser */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Cards in Deck</h2>
          <CardBrowser key={refreshKey} deckId={deckId} onCardUpdated={() => setRefreshKey((prev) => prev + 1)} />
        </div>
      </div>
    </div>
  );
}
