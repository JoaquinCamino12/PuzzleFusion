
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [difficulty, setDifficulty] = useState("3");
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage({ url: event.target.result as string, file });
        }
      };
      reader.readAsDataURL(file);
    } else {
        toast({
            title: "Archivo no válido",
            description: "Por favor, sube un archivo de imagen.",
            variant: "destructive"
        });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleCreatePuzzle = () => {
    if (image) {
      sessionStorage.setItem("puzzleImage", image.url);
      router.push(`/puzzle?difficulty=${difficulty}`);
    } else {
      toast({
        title: "No hay imagen",
        description: "Por favor, sube una imagen primero.",
        variant: "destructive",
      });
    }
  };

  const resetImage = () => {
    setImage(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Logo />
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <a
              href="https://github.com/Firebase/studio-apps/tree/main/puzzle-fusion"
              target="_blank"
            >
              Ver en GitHub
            </a>
          </Button>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="space-y-4 max-w-md w-full">
          <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Crea tu Propio Rompecabezas
          </h1>
          <p className="text-muted-foreground md:text-xl">
            Sube cualquier imagen y conviértela en un rompecabezas interactivo
            al instante.
          </p>
          {!image ? (
            <div
              className={cn(
                "p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center space-y-4 transition-colors w-full aspect-video",
                isDragging ? "border-primary bg-primary/10" : ""
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Arrastra y suelta o haz clic para subir
              </p>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="max-w-xs"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                <Image
                  src={image.url}
                  alt="Uploaded preview"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={resetImage}>
                  Elegir otra imagen
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Crear Rompecabezas</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Elige la Dificultad</DialogTitle>
                      <DialogDescription>
                        Selecciona cuántas piezas tendrá tu rompecabezas.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Select
                        onValueChange={setDifficulty}
                        defaultValue={difficulty}
                      >
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
                      <Button onClick={handleCreatePuzzle} className="w-full">
                        ¡A Jugar!
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Creado por{' '}
          <a
            href="https://joaquincamino.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Joaquin Camino
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
