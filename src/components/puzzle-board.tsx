
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RotateCcw, TimerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PuzzlePiece {
  id: number;
  img: string;
  correctX: number;
  correctY: number;
}

interface BoardSlot {
  x: number;
  y: number;
  piece: PuzzlePiece | null;
}

interface PuzzleBoardProps {
  imageUrl: string;
  difficulty: number;
}

export function PuzzleBoard({ imageUrl, difficulty: initialDifficulty }: PuzzleBoardProps) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [board, setBoard] = useState<BoardSlot[]>([]);
  const [shuffledPieces, setShuffledPieces] = useState<PuzzlePiece[]>([]);
  
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [pieceSize, setPieceSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [isComplete, setIsComplete] = useState(false);
  const [dragOver, setDragOver] = useState<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(new window.Image());

  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [showNewDifficultyDialog, setShowNewDifficultyDialog] = useState(false);
  const [nextDifficulty, setNextDifficulty] = useState(difficulty.toString());

  const [selectedPiece, setSelectedPiece] = useState<{ piece: PuzzlePiece; origin: 'bank' | 'board'; fromX?: number; fromY?: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const sliceAndShuffleImage = useCallback(() => {
    if (!imageRef.current || !imageRef.current.complete || !imageRef.current.src) return;
    setIsLoading(true);
    setIsTimerRunning(false);
    setTime(0);

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const aspectRatio = naturalWidth / naturalHeight;
    
    let containerWidth;
    if (isMobile) {
        containerWidth = window.innerWidth * 0.9;
    } else {
        containerWidth = Math.min(window.innerWidth * 0.5, 800);
    }
    const containerHeight = containerWidth / aspectRatio;

    setBoardSize({ width: containerWidth, height: containerHeight });

    const pWidth = containerWidth / difficulty;
    const pHeight = containerHeight / difficulty;
    setPieceSize({ width: pWidth, height: pHeight });

    const generatedPieces: PuzzlePiece[] = [];
    const initialBoard: BoardSlot[] = [];
    for (let y = 0; y < difficulty; y++) {
      for (let x = 0; x < difficulty; x++) {
        canvas.width = pWidth;
        canvas.height = pHeight;
        
        ctx.drawImage(
          img,
          x * (naturalWidth / difficulty),
          y * (naturalHeight / difficulty),
          naturalWidth / difficulty,
          naturalHeight / difficulty,
          0,
          0,
          pWidth,
          pHeight
        );
        generatedPieces.push({
          id: y * difficulty + x,
          img: canvas.toDataURL(),
          correctX: x,
          correctY: y,
        });
        initialBoard.push({ x, y, piece: null });
      }
    }
    setPieces(generatedPieces);
    setBoard(initialBoard);
    setShuffledPieces([...generatedPieces].sort(() => Math.random() - 0.5));
    setIsLoading(false);
    setIsTimerRunning(true);
    setIsComplete(false);
    setSelectedPiece(null);
  }, [difficulty, isMobile]);
  
  useEffect(() => {
    const imgElement = imageRef.current;
    imgElement.crossOrigin = "anonymous";
    
    const handleLoad = () => {
      setTimeout(() => sliceAndShuffleImage(), 0);
    };

    imgElement.addEventListener('load', handleLoad);
    imgElement.src = imageUrl;

    return () => {
      imgElement.removeEventListener('load', handleLoad);
    };
  }, [imageUrl, sliceAndShuffleImage]);


  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isComplete) {
      timerInterval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (timerInterval) {
      clearInterval(timerInterval);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isTimerRunning, isComplete]);
  
  useEffect(() => {
    if (!isLoading && pieces.length > 0 && shuffledPieces.length === 0) {
      const isBoardFull = board.every(slot => slot.piece !== null);
      if (isBoardFull) {
        const isPuzzleCorrect = board.every(slot => 
            slot.piece !== null && slot.piece.correctX === slot.x && slot.piece.correctY === slot.y
        );
        if (isPuzzleCorrect) {
          setIsComplete(true);
          setIsTimerRunning(false);
          setFinalTime(time);
        }
      }
    }
  }, [board, pieces, isLoading, time, shuffledPieces.length]);

  const movePiece = (piece: PuzzlePiece, origin: 'bank' | 'board', targetX: number, targetY: number, fromX?: number, fromY?: number) => {
    const newBoard = [...board];
    const targetSlotIndex = newBoard.findIndex(s => s.x === targetX && s.y === targetY);
    if (targetSlotIndex === -1) return;

    const pieceInTargetSlot = newBoard[targetSlotIndex].piece;

    // Place the new piece in the target slot
    newBoard[targetSlotIndex] = { ...newBoard[targetSlotIndex], piece };
    let newShuffledPieces = [...shuffledPieces];

    if (origin === 'bank') {
        newShuffledPieces = newShuffledPieces.filter(p => p.id !== piece.id);
        if (pieceInTargetSlot) {
            newShuffledPieces.push(pieceInTargetSlot);
        }
    } else { // Origin is 'board'
        const originSlotIndex = newBoard.findIndex(s => s.x === fromX && s.y === fromY);
        if (originSlotIndex !== -1) {
            newBoard[originSlotIndex] = { ...newBoard[originSlotIndex], piece: pieceInTargetSlot };
        }
    }
    
    setBoard(newBoard);
    setShuffledPieces(newShuffledPieces.sort(() => Math.random() - 0.5));
    setSelectedPiece(null);
  };


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, piece: PuzzlePiece, origin: 'bank' | 'board', fromX?: number, fromY?: number) => {
    if(isMobile) return;
    e.dataTransfer.setData('pieceId', piece.id.toString());
    e.dataTransfer.setData('origin', origin);
    if(origin === 'board') {
      e.dataTransfer.setData('fromX', fromX!.toString());
      e.dataTransfer.setData('fromY', fromY!.toString());
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetX: number, targetY: number) => {
    e.preventDefault();
    if(isMobile) return;
    setDragOver(null);
  
    const pieceId = parseInt(e.dataTransfer.getData('pieceId'), 10);
    const origin = e.dataTransfer.getData('origin') as 'bank' | 'board';
    
    const pieceToMove = (origin === 'bank') 
      ? shuffledPieces.find(p => p.id === pieceId)
      : board.find(s => s.piece?.id === pieceId)?.piece;
  
    if (!pieceToMove) return;

    const fromX = origin === 'board' ? parseInt(e.dataTransfer.getData('fromX'), 10) : undefined;
    const fromY = origin === 'board' ? parseInt(e.dataTransfer.getData('fromY'), 10) : undefined;

    movePiece(pieceToMove, origin, targetX, targetY, fromX, fromY);
  };
  
  const handlePieceBankDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if(isMobile) return;
    const origin = e.dataTransfer.getData('origin');
    if(origin !== 'board') return;

    const pieceId = parseInt(e.dataTransfer.getData('pieceId'), 10);
    const fromX = parseInt(e.dataTransfer.getData('fromX'), 10);
    const fromY = parseInt(e.dataTransfer.getData('fromY'), 10);

    const pieceToReturn = board.find(s => s.piece?.id === pieceId)?.piece;
    if(!pieceToReturn) return;

    const newBoard = [...board];
    const originSlotIndex = board.findIndex(s => s.x === fromX && s.y === fromY);
    if (originSlotIndex !== -1) {
        newBoard[originSlotIndex] = { ...newBoard[originSlotIndex], piece: null };
    }
    
    setBoard(newBoard);
    setShuffledPieces(prev => [...prev, pieceToReturn].sort(() => Math.random() - 0.5));
    setSelectedPiece(null);
  };
  
  const handlePieceClick = (piece: PuzzlePiece, origin: 'bank' | 'board', fromX?: number, fromY?: number) => {
    if (!isMobile) return;

    // If this piece is already selected, deselect it
    if (selectedPiece && selectedPiece.piece.id === piece.id) {
      setSelectedPiece(null);
      return;
    }
    
    setSelectedPiece({ piece, origin, fromX, fromY });
  };
  
  const handleSlotClick = (slotX: number, slotY: number) => {
    if (!isMobile || !selectedPiece) return;
    movePiece(selectedPiece.piece, selectedPiece.origin, slotX, slotY, selectedPiece.fromX, selectedPiece.fromY);
  };

  const resetPuzzle = () => {
    sliceAndShuffleImage();
  }

  const handlePlayAgain = () => {
    setIsComplete(false);
    setShowNewDifficultyDialog(false);
    setDifficulty(parseInt(nextDifficulty, 10));
    // sliceAndShuffleImage will be called automatically by the difficulty state change
  }
  
  useEffect(() => {
    if (!isLoading) { // only run when not initially loading
        sliceAndShuffleImage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full">
      <div className="w-full md:w-2/3 flex flex-col justify-center items-center gap-4">
        <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2 text-lg md:text-xl font-headline font-semibold text-primary">
                <TimerIcon />
                <span>{formatTime(time)}</span>
            </div>
            <Button asChild variant="outline" size="sm"><Link href="/">Volver al inicio</Link></Button>
        </div>
        <div className="relative shadow-2xl rounded-lg overflow-hidden" style={{ width: boardSize.width, height: boardSize.height }}>
          {isLoading && (
            <div className="absolute inset-0 bg-secondary flex justify-center items-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary"/>
            </div>
          )}
          <div className="grid gap-0.5 bg-border" style={{
            gridTemplateColumns: `repeat(${difficulty}, 1fr)`,
            width: boardSize.width,
            height: boardSize.height,
            display: isLoading ? 'none' : 'grid'
          }}>
            {board.map((slot, i) => (
              <div
                key={i}
                onClick={() => handleSlotClick(slot.x, slot.y)}
                onDrop={(e) => handleDrop(e, slot.x, slot.y)}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver({x: slot.x, y: slot.y});
                }}
                onDragLeave={() => setDragOver(null)}
                draggable={!isMobile && !!slot.piece}
                onDragStart={(e) => slot.piece && handleDragStart(e, slot.piece, 'board', slot.x, slot.y)}
                className={cn(
                    "transition-colors duration-200 bg-secondary",
                    dragOver?.x === slot.x && dragOver?.y === slot.y ? 'bg-primary/20' : '',
                    isMobile && !!selectedPiece && 'cursor-pointer',
                    isMobile && selectedPiece?.origin === 'board' && selectedPiece?.piece.id === slot.piece?.id && 'ring-2 ring-offset-2 ring-primary'
                )}
                style={{
                  width: pieceSize.width,
                  height: pieceSize.height,
                }}
              >
                {slot.piece && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePieceClick(slot.piece!, 'board', slot.x, slot.y);
                    }}
                    className={cn(
                        'w-full h-full',
                        isMobile && 'cursor-pointer',
                        isMobile && selectedPiece?.piece.id === slot.piece.id ? 'ring-2 ring-primary ring-inset' : ''
                    )}
                  >
                    <Image src={slot.piece.img} alt={`piece ${slot.piece.id}`} width={Math.floor(pieceSize.width)} height={Math.floor(pieceSize.height)} style={{width: '100%', height: '100%'}}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div 
        className="w-full md:w-1/3 bg-secondary/50 p-2 md:p-4 rounded-lg shadow-inner"
        onDrop={handlePieceBankDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg md:text-xl font-headline">Piezas</h2>
          <Button variant="outline" size="sm" onClick={resetPuzzle}>
            <RotateCcw className="mr-2 h-4 w-4"/>
            Reiniciar
          </Button>
        </div>
        <div
          className={cn(
            "gap-2 overflow-y-auto md:grid md:grid-cols-3",
            isMobile
              ? "flex overflow-x-auto py-2" // Horizontal scroll on mobile
              : "grid" // Vertical grid on desktop
          )}
          style={{
            maxHeight: isMobile ? "auto" : "70vh", // No max height for horizontal scroll
          }}
        >
          {shuffledPieces.map(p => (
             <div
              key={p.id}
              draggable={!isMobile}
              onClick={() => handlePieceClick(p, 'bank')}
              onDragStart={(e) => handleDragStart(e, p, 'bank')}
              className={cn(
                "border-2 rounded-md transition-all duration-200",
                !isMobile && "cursor-move hover:border-primary aspect-square",
                isMobile && "cursor-pointer flex-shrink-0 w-20 h-20", // Specific size for mobile
                selectedPiece?.piece.id === p.id ? "border-primary ring-2 ring-primary" : "border-transparent"
              )}
            >
              <Image src={p.img} alt={`piece ${p.id}`} width={100} height={100} className="rounded-sm w-full h-full object-cover"/>
            </div>
          ))}
        </div>
      </div>
      
       <AlertDialog open={isComplete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡Felicidades!</AlertDialogTitle>
            <AlertDialogDescription>
              Has completado el rompecabezas en <span className="font-bold text-foreground">{formatTime(finalTime)}</span>.
              ¿Quieres jugar de nuevo o crear uno nuevo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <Button variant="outline" asChild>
                <Link href="/">Crear nuevo rompecabezas</Link>
              </Button>
              <AlertDialogAction asChild>
                <Button onClick={() => {
                  setIsComplete(false); // Close this dialog
                  setShowNewDifficultyDialog(true); // Open the other one
                }}>
                  Jugar con otra dificultad
                </Button>
              </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showNewDifficultyDialog} onOpenChange={setShowNewDifficultyDialog}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Elige la Nueva Dificultad</DialogTitle>
                <DialogDescription>Selecciona cuántas piezas tendrá tu próximo rompecabezas.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Select onValueChange={setNextDifficulty} defaultValue={nextDifficulty}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3">Fácil (3x3)</SelectItem>
                        <SelectItem value="4">Medio (4x4)</SelectItem>
                        <SelectItem value="5">Difícil (5x5)</SelectItem>
                        <SelectItem value="8">Experto (8x8)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDifficultyDialog(false)}>Cancelar</Button>
                <Button onClick={handlePlayAgain}>¡A Jugar de Nuevo!</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}

    

    