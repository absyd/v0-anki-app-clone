// IndexedDB database for spaced repetition
interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  createdAt: number;
  easeFactor: number; // SM-2 algorithm
  interval: number; // days
  nextReview: number; // timestamp
  repetitions: number;
  lastReviewedAt: number | null;
}

interface Deck {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  quality: number; // 0-5, rating of how well you remembered
  timestamp: number;
  newEaseFactor: number;
  newInterval: number;
}

const DB_NAME = 'SpacedRepetitionDB';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export const initDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create Decks store
      if (!database.objectStoreNames.contains('decks')) {
        database.createObjectStore('decks', { keyPath: 'id' });
      }

      // Create Cards store
      if (!database.objectStoreNames.contains('cards')) {
        const cardStore = database.createObjectStore('cards', { keyPath: 'id' });
        cardStore.createIndex('deckId', 'deckId', { unique: false });
        cardStore.createIndex('nextReview', 'nextReview', { unique: false });
      }

      // Create ReviewLog store
      if (!database.objectStoreNames.contains('reviewLogs')) {
        const reviewStore = database.createObjectStore('reviewLogs', { keyPath: 'id' });
        reviewStore.createIndex('cardId', 'cardId', { unique: false });
        reviewStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

const getDB = async (): Promise<IDBDatabase> => {
  if (!db) {
    db = await initDB();
  }
  return db;
};

// Deck operations
export const createDeck = async (name: string, description?: string): Promise<Deck> => {
  const database = await getDB();
  const deck: Deck = {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['decks'], 'readwrite');
    const request = transaction.objectStore('decks').add(deck);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(deck);
  });
};

export const getAllDecks = async (): Promise<Deck[]> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['decks'], 'readonly');
    const request = transaction.objectStore('decks').getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const getDeck = async (id: string): Promise<Deck | undefined> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['decks'], 'readonly');
    const request = transaction.objectStore('decks').get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const updateDeck = async (id: string, updates: Partial<Deck>): Promise<Deck> => {
  const database = await getDB();
  const deck = await getDeck(id);
  if (!deck) throw new Error('Deck not found');

  const updated = { ...deck, ...updates, updatedAt: Date.now() };
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['decks'], 'readwrite');
    const request = transaction.objectStore('decks').put(updated);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(updated);
  });
};

export const deleteDeck = async (id: string): Promise<void> => {
  const database = await getDB();
  return new Promise(async (resolve, reject) => {
    // Delete all cards in deck
    const cards = await getCardsByDeckId(id);
    for (const card of cards) {
      await deleteCard(card.id);
    }

    const transaction = database.transaction(['decks'], 'readwrite');
    const request = transaction.objectStore('decks').delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Card operations
export const createCard = async (
  deckId: string,
  front: string,
  back: string
): Promise<Card> => {
  const database = await getDB();
  const card: Card = {
    id: crypto.randomUUID(),
    deckId,
    front,
    back,
    createdAt: Date.now(),
    easeFactor: 2.5,
    interval: 0,
    nextReview: Date.now(),
    repetitions: 0,
    lastReviewedAt: null,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cards'], 'readwrite');
    const request = transaction.objectStore('cards').add(card);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(card);
  });
};

export const getCardsByDeckId = async (deckId: string): Promise<Card[]> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cards'], 'readonly');
    const index = transaction.objectStore('cards').index('deckId');
    const request = index.getAll(deckId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const getCard = async (id: string): Promise<Card | undefined> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cards'], 'readonly');
    const request = transaction.objectStore('cards').get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const updateCard = async (id: string, updates: Partial<Card>): Promise<Card> => {
  const database = await getDB();
  const card = await getCard(id);
  if (!card) throw new Error('Card not found');

  const updated = { ...card, ...updates };
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cards'], 'readwrite');
    const request = transaction.objectStore('cards').put(updated);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(updated);
  });
};

export const deleteCard = async (id: string): Promise<void> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cards'], 'readwrite');
    const request = transaction.objectStore('cards').delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Get cards due for review
export const getCardsDueForReview = async (deckId: string): Promise<Card[]> => {
  const cards = await getCardsByDeckId(deckId);
  const now = Date.now();
  return cards.filter((card) => card.nextReview <= now).sort((a, b) => a.nextReview - b.nextReview);
};

// SM-2 Algorithm implementation
const calculateSM2 = (
  currentEaseFactor: number,
  quality: number,
  interval: number,
  repetitions: number
) => {
  // quality: 0-5 where 5 is perfect recall
  const newEaseFactor = Math.max(
    1.3,
    currentEaseFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  let newInterval: number;
  let newRepetitions = repetitions;

  if (quality < 3) {
    newInterval = 0;
    newRepetitions = 0;
  } else {
    newRepetitions = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  return { newEaseFactor, newInterval, newRepetitions };
};

export const reviewCard = async (
  cardId: string,
  quality: number
): Promise<{ card: Card; log: ReviewLog }> => {
  const database = await getDB();
  const card = await getCard(cardId);
  if (!card) throw new Error('Card not found');

  const { newEaseFactor, newInterval, newRepetitions } = calculateSM2(
    card.easeFactor,
    quality,
    card.interval,
    card.repetitions
  );

  const nextReview = Date.now() + newInterval * 24 * 60 * 60 * 1000;

  const updatedCard = await updateCard(cardId, {
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReview,
    repetitions: newRepetitions,
    lastReviewedAt: Date.now(),
  });

  const log: ReviewLog = {
    id: crypto.randomUUID(),
    cardId,
    deckId: card.deckId,
    quality,
    timestamp: Date.now(),
    newEaseFactor,
    newInterval,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['reviewLogs'], 'readwrite');
    const request = transaction.objectStore('reviewLogs').add(log);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve({ card: updatedCard, log });
  });
};

export const getReviewLogsForCard = async (cardId: string): Promise<ReviewLog[]> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['reviewLogs'], 'readonly');
    const index = transaction.objectStore('reviewLogs').index('cardId');
    const request = index.getAll(cardId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export type { Card, Deck, ReviewLog };
