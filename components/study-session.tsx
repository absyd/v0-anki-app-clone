'use client';

import { useEffect, useState } from 'react';
import { Card as CardType, getCardsDueForReview, reviewCard, getDeck } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Flashcard from './flashcard';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  deckId: string;
}

type SessionState = 'loading' | 'studying' | 'finished';

interface StudyStats {
  correct: number;
  incorrect: number;
  skipped: number;
}

export default function StudySession({ deckId }: Props) {
  const [state, setState] = useState<SessionState>('loading');
  const [cards, setCards] = useState<CardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<StudyStats>({ correct: 0, incorrect: 0, skipped: 0 });
  const [deckName, setDeckName] = useState('');

  useEffect(() => {
    const loadCards = async () => {
      try {
        const deck = await getDeck(deckId);
        if (deck) setDeckName(deck.name);

        const dueCards = await getCardsDueForReview(deckId);
        if (dueCards.length === 0) {
          setState('finished');
          setCards([]);
        } else {
          setCards(dueCards);
          setState('studying');
        }
      } catch (error) {
        console.error('Failed to load cards:', error);
        setState('finished');
      }
    };

    loadCards();
  }, [deckId]);

  const currentCard = cards[currentIndex];

  const handleReview = async (quality: number) => {
    if (!currentCard) return;

    try {
      await reviewCard(currentCard.id, quality);

      if (quality >= 3) {
        setStats((s) => ({ ...s, correct: s.correct + 1 }));
      } else {
        setStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex < cards.length) {
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
      } else {
        setState('finished');
      }
    } catch (error) {
      console.error('Failed to review card:', error);
    }
  };

  const handleSkip = () => {
    setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
    const nextIndex = currentIndex + 1;
    if (nextIndex < cards.length) {
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
    } else {
      setState('finished');
    }
  };

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (state === 'finished' || cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
        <div className="max-w-md mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Decks
            </Button>
          </Link>

          <Card className="text-center p-8">
            <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              {cards.length === 0 ? 'No Cards Due' : 'Session Complete!'}
            </h1>
            <p className="text-neutral-600 mb-6">
              {cards.length === 0
                ? 'Great job! All cards are up to date.'
                : 'You have completed your study session.'}
            </p>

            {stats.correct > 0 && (
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-neutral-700">Correct</span>
                  <Badge className="bg-green-600">{stats.correct}</Badge>
                </div>
                {stats.incorrect > 0 && (
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-neutral-700">Incorrect</span>
                    <Badge className="bg-red-600">{stats.incorrect}</Badge>
                  </div>
                )}
                {stats.skipped > 0 && (
                  <div className="flex justify-between items-center p-3 bg-neutral-100 rounded-lg">
                    <span className="text-neutral-700">Skipped</span>
                    <Badge className="bg-neutral-400">{stats.skipped}</Badge>
                  </div>
                )}
              </div>
            )}

            <Link href={`/deck/${deckId}`}>
              <Button className="w-full bg-primary hover:bg-blue-700">
                Manage Deck
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Decks
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{deckName}</h1>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-neutral-700">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="p-4 text-center">
            <p className="text-xs text-neutral-600 mb-1">Correct</p>
            <p className="text-2xl font-bold text-green-600">{stats.correct}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-neutral-600 mb-1">Incorrect</p>
            <p className="text-2xl font-bold text-red-600">{stats.incorrect}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-neutral-600 mb-1">Skipped</p>
            <p className="text-2xl font-bold text-neutral-600">{stats.skipped}</p>
          </Card>
        </div>

        {/* Flashcard */}
        <div className="mb-8">
          <Flashcard card={currentCard} onFlip={setIsFlipped} />
        </div>

        {/* Response Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => handleReview(1)}
              className="bg-red-500 hover:bg-red-600"
              disabled={!isFlipped}
            >
              Again
            </Button>
            <Button
              onClick={() => handleReview(3)}
              className="bg-yellow-500 hover:bg-yellow-600"
              disabled={!isFlipped}
            >
              Okay
            </Button>
            <Button
              onClick={() => handleReview(5)}
              className="bg-green-500 hover:bg-green-600"
              disabled={!isFlipped}
            >
              Easy
            </Button>
          </div>

          <Button
            onClick={handleSkip}
            variant="outline"
            className="w-full bg-transparent"
          >
            <Clock className="w-4 h-4 mr-2" />
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
