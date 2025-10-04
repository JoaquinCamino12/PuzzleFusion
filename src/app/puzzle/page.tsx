
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { PuzzleBoard } from "@/components/puzzle-board";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

function PuzzleGamePage() {
  const searchParams = useSearchParams();
  const difficulty = parseInt(searchParams.get("difficulty") || "3", 10);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This check ensures sessionStorage is only accessed on the client-side.
    if (typeof window !== 'undefined') {
      const storedImage = sessionStorage.getItem("puzzleImage");
      if (storedImage) {
        setImageUrl(storedImage);
      } else {
        setError("No se encontró la imagen para el rompecabezas. Por favor, vuelve a empezar.");
      }
    }
  }, []);

  if (error) {
    return <div className="text-center text-red-500 py-10">
      <p>{error}</p>
      <Button asChild className="mt-4"><Link href="/">Volver al inicio</Link></Button>
    </div>;
  }

  if (!imageUrl) {
    return (
        <div className="flex flex-col md:flex-row gap-8 w-full p-4 md:p-8">
            <div className="w-full md:w-2/3 flex justify-center items-center">
                 <Skeleton className="aspect-square w-full" />
            </div>
            <div className="w-full md:w-1/3">
                 <Skeleton className="w-full h-[200px] md:h-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="w-full py-4 md:p-8">
      <PuzzleBoard imageUrl={imageUrl} difficulty={difficulty} />
    </div>
  );
}

export default function PuzzlePageSuspenseWrapper() {
  return (
    <Suspense fallback={
        <div className="flex flex-col md:flex-row gap-8 w-full p-4 md:p-8">
            <div className="w-full md:w-2/3 flex justify-center items-center">
                 <Skeleton className="aspect-square w-full" />
            </div>
            <div className="w-full md:w-1/3">
                 <Skeleton className="w-full h-[200px] md:h-full" />
            </div>
        </div>
    }>
      <PuzzleGamePage />
    </Suspense>
  )
}
