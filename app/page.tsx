'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DeckList from '@/components/deck-list';
import { Plus, Zap } from 'lucide-react';
import Link from 'next/link';
import { initDB } from '@/lib/db';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Initialize DB on client mount
  useState(() => {
    initDB();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8" />
            <h1 className="text-4xl font-bold">FlashLearn</h1>
          </div>
          <p className="text-blue-100 mb-6 text-lg">
            Master any subject with scientifically-proven spaced repetition learning.
          </p>
          <Link href="/create-deck">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              <Plus className="w-5 h-5 mr-2" />
              Create New Deck
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Your Decks</h2>
          <p className="text-neutral-600">
            Review cards due today and manage your learning journey.
          </p>
        </div>

        <DeckList key={refreshKey} onRefresh={refreshKey > 0} />
      </div>

      {/* Features Section */}
      <div className="bg-white py-12 px-4 mt-12 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Why FlashLearn?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📚 Unlimited Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Create as many flashcards as you want with no limits or subscriptions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🧠 Smart Algorithm</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Uses the SM-2 spaced repetition algorithm to optimize your learning.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💾 Local Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  All your data stays on your device. No cloud required, no tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
