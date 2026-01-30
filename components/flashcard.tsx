'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Card as CardType } from '@/lib/db';

interface Props {
  card: CardType;
  onFlip?: (isFlipped: boolean) => void;
}

export default function Flashcard({ card, onFlip }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    const newState = !isFlipped;
    setIsFlipped(newState);
    onFlip?.(newState);
  };

  return (
    <div className="h-80 cursor-pointer perspective" onClick={handleFlip}>
      <Card
        className={`
          h-full w-full flex items-center justify-center p-8 
          transition-all duration-500 transform
          bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-primary
          hover:shadow-lg
          relative
        `}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="text-center"
          style={{
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <p className="text-sm font-medium text-neutral-500 mb-4">
            {isFlipped ? 'Answer' : 'Question'}
          </p>
          <p className="text-2xl font-semibold text-foreground break-words">
            {isFlipped ? card.back : card.front}
          </p>
          <p className="text-xs text-neutral-400 mt-8">Click to flip</p>
        </div>
      </Card>
    </div>
  );
}
