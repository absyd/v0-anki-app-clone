'use client';

import { useParams } from 'next/navigation';
import StudySession from '@/components/study-session';

export default function StudyPage() {
  const params = useParams();
  const deckId = params.id as string;

  return <StudySession deckId={deckId} />;
}
