'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createDeck } from '@/lib/db';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function CreateDeck() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Deck name is required');
      return;
    }

    setLoading(true);
    try {
      const deck = await createDeck(name, description);
      router.push(`/deck/${deck.id}`);
    } catch (err) {
      console.error('Failed to create deck:', err);
      setError('Failed to create deck. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
      <div className="max-w-md mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Decks
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create New Deck</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Deck Name</label>
                <Input
                  placeholder="e.g., Spanish Vocabulary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  placeholder="What will you study in this deck?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-blue-700"
              >
                {loading ? 'Creating...' : 'Create Deck'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
