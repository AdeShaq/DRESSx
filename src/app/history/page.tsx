
"use client";

import Image from 'next/image';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Frown, Share2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface HistoryItem {
  id: string;
  dataUri: string;
  timestamp: number;
}

// LazyImage component for better performance
const LazyImage = ({ dataUri }: { dataUri: string }) => {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);

  return (
    <motion.div
      className="aspect-[3/4] w-full h-full bg-muted/20"
      onViewportEnter={() => {
        if (!imageSrc) {
          setImageSrc(dataUri);
        }
      }}
      viewport={{ once: true, amount: 0.1 }} // Load when 10% of the item is visible
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt="Generated outfit"
          width={400}
          height={533}
          className="object-cover w-full h-full"
          unoptimized
        />
      ) : (
        <Skeleton className="w-full h-full" />
      )}
    </motion.div>
  );
};

export default function HistoryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isShareSupported, setIsShareSupported] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        setIsShareSupported(true);
      }
      try {
        const storedHistory = localStorage.getItem('dressx_history');
        if (storedHistory) {
          const parsedHistory: HistoryItem[] = JSON.parse(storedHistory);
          
          // Filter out items older than 24 hours
          const twentyFourHoursAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
          const filteredHistory = parsedHistory.filter(item => item.timestamp && item.timestamp > twentyFourHoursAgo);
          
          setHistory(filteredHistory);
          // Save the filtered history back to localStorage
          localStorage.setItem('dressx_history', JSON.stringify(filteredHistory));
        }
      } catch (error) {
        console.error("Failed to parse or filter history from localStorage", error);
      }
    }
  }, []);

  const handleDelete = (idToDelete: string) => {
    const updatedHistory = history.filter(item => item.id !== idToDelete);
    setHistory(updatedHistory);
    localStorage.setItem('dressx_history', JSON.stringify(updatedHistory));
  };
  
  const handleGoBack = () => {
    router.push('/');
  };

  const handleDownload = (dataUri: string) => {
    if (!dataUri) return;
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = 'dressx-outfit-history.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Download Started",
      description: "Your image has been saved to your device.",
    });
  };

  const handleShare = async (dataUri: string) => {
    if (typeof window === 'undefined' || !navigator.share) return;
    if (!dataUri) return;

    try {
      const response = await fetch(dataUri);
      const blob = await response.blob();
      const file = new File([blob], 'dressx-outfit-history.png', { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My DRESSX Creation!',
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
  
  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Generation History</CardTitle>
              <CardDescription>
                Your saved images from the last 24 hours. Click an image to preview.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
            {isMounted && history.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((item) => (
                  <Dialog key={item.id}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="relative group"
                    >
                      <DialogTrigger asChild>
                        <button className="aspect-[3/4] w-full rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-background">
                          <LazyImage dataUri={item.dataUri} />
                        </button>
                      </DialogTrigger>
                      <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isShareSupported && (
                          <Button
                            size="icon"
                            variant="default"
                            className="h-7 w-7 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                            onClick={(e) => { e.stopPropagation(); handleShare(item.dataUri); }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-7 w-7 rounded-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this image from your history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </motion.div>
                    <DialogContent className="max-w-xl p-4 sm:p-6">
                      <DialogHeader>
                        <DialogTitle>Outfit Preview</DialogTitle>
                        <DialogDescription>
                            Here is a larger view of your generated outfit.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="aspect-[3/4] w-full rounded-lg overflow-hidden my-4 bg-muted/20">
                        <Image
                          src={item.dataUri}
                          alt="Generated outfit preview"
                          width={800}
                          height={1067}
                          className="object-contain w-full h-full"
                          unoptimized
                        />
                      </div>
                      <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="default"
                          onClick={() => handleDownload(item.dataUri)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            ) : (
              isMounted && (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <Frown className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold">No Recent History</h3>
                  <p className="text-muted-foreground">Generate some amazing outfits to see them here!</p>
                </div>
              )
            )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
