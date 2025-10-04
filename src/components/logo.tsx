import Link from 'next/link';
import { PuzzleIcon } from './icons';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <PuzzleIcon className="h-6 w-6 text-primary" />
      <span className="font-semibold font-headline text-lg">Puzzle Fusion</span>
    </div>
  );
}
