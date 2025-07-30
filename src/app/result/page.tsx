
"use client"

import Image from 'next/image';
import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Share2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { GeneratePhotorealisticOutfitInput } from '@/ai/flows/generate-photorealistic-outfit';
import { generateOutfitAction } from '@/app/actions';

const GENERATION_INPUT_KEY = 'dressx_generation_input_v2';

interface HistoryItem {
  id: string;
  dataUri: string;
  timestamp: number;
}

type PageStatus = 'initializing' | 'loading' | 'success' | 'error' | 'idle';

export default function ResultPage() {
  const router = useRouter();
  const { toast } = useToast();
  const generationInitiated = React.useRef(false);
  const THEME_KEY = 'dressx_theme';
  const [generationInput, setGenerationInput] = React.useState<GeneratePhotorealisticOutfitInput | null>(null);

  const [status, setStatus] = React.useState<PageStatus>('initializing');

  const [generatedOutfit, setGeneratedOutfit] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isShareSupported, setIsShareSupported] = React.useState(false);

  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  const [transform, setTransform] = React.useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });

  const resetTransform = React.useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  const saveToHistory = React.useCallback(async (outfitDataUri: string) => {
    try {
      // Save the original, full-quality data URI with a timestamp
      const newHistoryItem: HistoryItem = { 
        id: uuidv4(), 
        dataUri: outfitDataUri,
        timestamp: new Date().getTime()
      };
      
      const storedHistory = localStorage.getItem('dressx_history');
      const history = storedHistory ? JSON.parse(storedHistory) : [];
      
      const updatedHistory = [newHistoryItem, ...history];

      localStorage.setItem('dressx_history', JSON.stringify(updatedHistory));
    } catch (historyError) {
      console.error("Failed to save to history:", historyError);
      toast({
        variant: "destructive",
        title: "Could not save to history",
        description: "Your browser storage might be full."
      })
    }
  }, [toast]);

  React.useEffect(() => {
    if (status === 'success' && generatedOutfit) {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => saveToHistory(generatedOutfit));
        } else {
            setTimeout(() => saveToHistory(generatedOutfit), 0);
        }
    }
  }, [status, generatedOutfit, saveToHistory]);

    React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem(THEME_KEY) || 'dark';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const runGeneration = React.useCallback(async (input: GeneratePhotorealisticOutfitInput) => {
    setStatus('loading');
    setError(null);
    setGeneratedOutfit(null);
    resetTransform();

    try {
        const result = await generateOutfitAction({ input });

        if (result.error) {
            throw new Error(result.error);
        }

        if (result.generatedOutfitDataUri) {
            const newOutfit = result.generatedOutfitDataUri;
            setGeneratedOutfit(newOutfit);
            setStatus('success');
        } else {
            throw new Error('Image generation failed to return an image.');
        }
    } catch (err) {
        console.error("Caught generation error on result page:", err);
        const errorMessage =
            err instanceof Error
            ? err.message
            : 'An unknown error occurred during generation.';
        setError(errorMessage);
        setStatus('error');
    }
  }, [resetTransform]);

  React.useEffect(() => {
    if (generationInitiated.current) {
        return;
    }

    if (typeof window !== 'undefined') {
        const storedInputJSON = sessionStorage.getItem(GENERATION_INPUT_KEY);
        if (storedInputJSON) {
            generationInitiated.current = true;
            try {
                const parsedInput = JSON.parse(storedInputJSON);
                setGenerationInput(parsedInput);
                runGeneration(parsedInput);
                sessionStorage.removeItem(GENERATION_INPUT_KEY);
            } catch (e) {
                console.error("Failed to parse generation input:", e);
                setStatus('error');
                setError("Could not load generation data. Please go back and try again.");
            }
        } else {
            setStatus('idle');
        }

        if (navigator.share !== undefined) {
            setIsShareSupported(true);
        }
    }
  }, [runGeneration]);


  const handleRegenerate = async () => {
    if (!generationInput || status === 'loading') return;
    runGeneration(generationInput);
  };
  
  const handleDownload = () => {
    if (!generatedOutfit) return;
    const link = document.createElement('a');
    link.href = generatedOutfit;
    link.download = 'dressx-outfit.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!generatedOutfit) return;

    try {
      const response = await fetch(generatedOutfit);
      const blob = await response.blob();
      const file = new File([blob], 'dressx-outfit.png', { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My New Outfit from DRESSX!',
          text: 'Check out this virtual outfit I created with DRESSX.',
          files: [file],
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sharing Not Supported',
          description: "Your browser doesn't support sharing files.",
        });
      }
    } catch (error) {
       if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Share error:", error);
          toast({
            variant: 'destructive',
            title: 'Sharing Failed',
            description: 'Could not share the image.',
          });
       }
    }
  };

  const handleBackToEdit = () => {
    router.push('/');
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? transform.scale * zoomFactor : transform.scale / zoomFactor;
    const clampedScale = Math.max(0.5, Math.min(5, newScale));

    const newX = mouseX - (mouseX - transform.x) * (clampedScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (clampedScale / transform.scale);
    
    setTransform({ scale: clampedScale, x: newX, y: newY });
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    setTransform(t => ({...t, x: e.clientX - panStart.x, y: e.clientY - panStart.y}));
  };
  
  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  const handleZoomButtonClick = (direction: 'in' | 'out') => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const zoomFactor = 1.2;
    const newScale = direction === 'in' ? transform.scale * zoomFactor : transform.scale / zoomFactor;
    const clampedScale = Math.max(0.5, Math.min(5, newScale));
    
    const newX = centerX - (centerX - transform.x) * (clampedScale / transform.scale);
    const newY = centerY - (centerY - transform.y) * (clampedScale / transform.scale);

    setTransform({ scale: clampedScale, x: newX, y: newY });
  }

  const renderContent = () => {
    switch (status) {
      case 'initializing':
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground/80 animate-pulse">
              Generating your masterpiece...
            </p>
            <p className="text-sm text-muted-foreground">
              This can take a few moments. Please be patient.
            </p>
          </div>
        );

      case 'error':
        return (
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-destructive/10 p-4 rounded-full mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle>Generation Failed</CardTitle>
              <CardDescription className="text-destructive-foreground/80">
                {error}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex-col sm:flex-row justify-center gap-2">
              <Button variant="outline" onClick={handleBackToEdit}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Edit
              </Button>
              <Button onClick={handleRegenerate} disabled={!generationInput} variant="accent">
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Button>
            </CardFooter>
          </Card>
        );

      case 'success':
        return (
          <Card className="w-full">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-accent" />
                Here's Your Look!
              </CardTitle>
              <CardDescription>
                Pan and zoom, share, or download your new virtual outfit.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative p-4 pt-0 sm:p-6 sm:pt-0">
              <div
                ref={imageContainerRef}
                className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-muted/50 cursor-grab active:cursor-grabbing"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
              >
                <Image
                  src={generatedOutfit!}
                  alt="Generated Outfit"
                  width={800}
                  height={1067}
                  className="w-full h-full object-contain transition-transform duration-200 pointer-events-none"
                  style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: '0 0',
                  }}
                  draggable={false}
                  unoptimized
                />
              </div>
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-lg shadow-md">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleZoomButtonClick('out')}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-10 sm:w-12 text-center select-none">
                  {(transform.scale * 100).toFixed(0)}%
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleZoomButtonClick('in')}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={resetTransform}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2 p-4 pt-4 sm:flex sm:flex-wrap sm:justify-end sm:p-6 sm:pt-4">
              <Button variant="outline" onClick={handleBackToEdit}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Edit
              </Button>
            <Button onClick={handleRegenerate} disabled={!generationInput} variant="accent">
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button onClick={handleDownload} variant="primary">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              {isShareSupported && (
                <Button onClick={handleShare} variant="primary">
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              )}
            </CardFooter>
          </Card>
        );

      case 'idle':
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>No Image Found</CardTitle>
              <CardDescription>
                It looks like you came here directly. Let's get you back to creating an outfit.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={handleBackToEdit} variant="primary">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Creation
              </Button>
            </CardFooter>
          </Card>
        );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <motion.div
            key="outfit-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
          {renderContent()}
        </motion.div>
    </div>
  );
}
