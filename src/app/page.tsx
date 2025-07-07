"use client";

import Image from 'next/image';
import * as React from 'react';
import {
  ArrowRight,
  Download,
  Loader2,
  Plus,
  Share2,
  Shirt,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { generateOutfitAction } from '@/app/actions';
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
import { cn } from '@/lib/utils';

interface ClothingItem {
  id: string;
  dataUri: string;
}

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function DressMePage() {
  const { toast } = useToast();
  const [userPhoto, setUserPhoto] = React.useState<ClothingItem | null>(null);
  const [tops, setTops] = React.useState<ClothingItem[]>([]);
  const [bottoms, setBottoms] = React.useState<ClothingItem[]>([]);
  const [selectedTop, setSelectedTop] = React.useState<string | null>(null);
  const [selectedBottom, setSelectedBottom] = React.useState<string | null>(
    null
  );
  const [generatedOutfit, setGeneratedOutfit] = React.useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isShareSupported, setIsShareSupported] = React.useState(false);

  const userPhotoInputRef = React.useRef<HTMLInputElement>(null);
  const topInputRef = React.useRef<HTMLInputElement>(null);
  const bottomInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (navigator.share) {
      setIsShareSupported(true);
    }
  }, []);

  const handleFileUpload =
    (
      setter: React.Dispatch<React.SetStateAction<any>>,
      isMultiple: boolean = false
    ) =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      try {
        const newItems = await Promise.all(
          Array.from(files).map(async file => ({
            id: uuidv4(),
            dataUri: await readFileAsDataURL(file),
          }))
        );

        if (isMultiple) {
          setter((prev: any) => [...prev, ...newItems]);
        } else {
          setter(newItems[0]);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'There was an error reading the file.',
        });
      } finally {
        // Reset file input
        event.target.value = '';
      }
    };

  const handleGenerateOutfit = async () => {
    if (!userPhoto || !selectedTop || !selectedBottom) {
      toast({
        variant: 'destructive',
        title: 'Missing Items',
        description: 'Please select a photo of yourself, a top, and a bottom.',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedOutfit(null);

    const topItem = tops.find(t => t.id === selectedTop);
    const bottomItem = bottoms.find(b => b.id === selectedBottom);

    if (!topItem || !bottomItem) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not find selected clothing items.',
        });
        setIsLoading(false);
        return;
    }
    
    try {
      const result = await generateOutfitAction({
        userPhotoDataUri: userPhoto.dataUri,
        topClothingDataUri: topItem.dataUri,
        bottomClothingDataUri: bottomItem.dataUri,
      });

      if (result.error) {
        throw new Error(result.error);
      }
      
      setGeneratedOutfit(result.generatedOutfitDataUri!);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during outfit generation.";
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedOutfit) return;
    const link = document.createElement('a');
    link.href = generatedOutfit;
    link.download = 'dressme-outfit.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleShare = async () => {
    if (!generatedOutfit || !isShareSupported) return;
    
    try {
        const response = await fetch(generatedOutfit);
        const blob = await response.blob();
        const file = new File([blob], "dressme-outfit.png", { type: blob.type });

        await navigator.share({
            title: "My New Outfit from DressMe!",
            text: "Check out this virtual outfit I created with DressMe.",
            files: [file],
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Sharing Failed",
            description: "Could not share the image.",
        });
    }
  };

  const handleStartOver = () => {
    setGeneratedOutfit(null);
  };
  
  const removeItem = (id: string, type: 'top' | 'bottom' | 'user') => {
    if (type === 'user') {
        setUserPhoto(null);
    } else if (type === 'top') {
        setTops(tops.filter(item => item.id !== id));
        if (selectedTop === id) setSelectedTop(null);
    } else {
        setBottoms(bottoms.filter(item => item.id !== id));
        if (selectedBottom === id) setSelectedBottom(null);
    }
  }


  const renderWardrobeItems = (
    items: ClothingItem[],
    selectedId: string | null,
    onSelect: (id: string) => void,
    type: 'top' | 'bottom'
  ) => (
    <div className="grid grid-cols-3 gap-2">
      {items.map(item => (
        <div key={item.id} className="relative group">
            <button
                onClick={() => onSelect(item.id)}
                className={cn(
                    'aspect-square w-full rounded-lg overflow-hidden border-2 transition-all',
                    selectedId === item.id
                    ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'border-transparent hover:border-primary'
                )}
            >
                <Image
                    src={item.dataUri}
                    alt="Clothing item"
                    width={100}
                    height={100}
                    className="object-cover w-full h-full"
                />
            </button>
            <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeItem(item.id, type)}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
      ))}
    </div>
  );

  const isReadyToGenerate = userPhoto && selectedTop && selectedBottom;
  
  return (
    <div className="flex flex-col md:flex-row h-screen bg-secondary/30">
        <input
            type="file"
            ref={userPhotoInputRef}
            onChange={handleFileUpload(setUserPhoto)}
            accept="image/*"
            className="hidden"
        />
        <input
            type="file"
            ref={topInputRef}
            onChange={handleFileUpload(setTops, true)}
            accept="image/*"
            className="hidden"
            multiple
        />
        <input
            type="file"
            ref={bottomInputRef}
            onChange={handleFileUpload(setBottoms, true)}
            accept="image/*"
            className="hidden"
            multiple
        />

        <aside className="w-full md:w-96 bg-background border-r p-4 flex flex-col gap-6 overflow-y-auto">
            <header>
                <h1 className="text-2xl font-bold text-primary">DressMe</h1>
                <p className="text-muted-foreground">Your AI-powered virtual closet.</p>
            </header>

            <div className="space-y-4">
                <h2 className="font-semibold">1. Your Photo</h2>
                {userPhoto ? (
                    <div className="relative group w-full aspect-square rounded-lg overflow-hidden">
                        <Image src={userPhoto.dataUri} alt="User" layout="fill" objectFit="cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="destructive" onClick={() => removeItem(userPhoto.id, 'user')}>
                                <Trash2 className="mr-2 h-4 w-4" /> Change Photo
                            </Button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => userPhotoInputRef.current?.click()} className="w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center hover:border-primary transition-colors">
                        <User className="h-10 w-10 text-muted-foreground" />
                        <span className="mt-2 text-sm font-medium">Add Photo</span>
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <h2 className="font-semibold">2. Your Wardrobe</h2>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Tops</h3>
                        <Button size="sm" variant="outline" onClick={() => topInputRef.current?.click()}>
                            <Plus className="h-4 w-4 mr-2" /> Add
                        </Button>
                    </div>
                    {renderWardrobeItems(tops, selectedTop, setSelectedTop, 'top')}
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Bottoms</h3>
                        <Button size="sm" variant="outline" onClick={() => bottomInputRef.current?.click()}>
                            <Plus className="h-4 w-4 mr-2" /> Add
                        </Button>
                    </div>
                    {renderWardrobeItems(bottoms, selectedBottom, setSelectedBottom, 'bottom')}
                </div>
            </div>
        </aside>

        <main className="flex-1 p-6 flex items-center justify-center">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium text-muted-foreground animate-pulse">Generating your outfit...</p>
                    <p className="text-sm text-muted-foreground">This can take up to a minute.</p>
                </div>
            ) : generatedOutfit ? (
                <Card className="max-w-2xl w-full animate-in fade-in zoom-in-95">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="text-accent" />
                            Here's Your Look!
                        </CardTitle>
                        <CardDescription>Share your new virtual outfit with the world.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-muted">
                            <Image src={generatedOutfit} alt="Generated Outfit" width={600} height={800} className="w-full h-full object-cover" />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="outline" onClick={handleStartOver}>Start Over</Button>
                        <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download</Button>
                        {isShareSupported && (
                            <Button onClick={handleShare}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                        )}
                    </CardFooter>
                </Card>
            ) : (
                <div className="flex flex-col items-center gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-32 w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background">
                                {userPhoto ? <Image src={userPhoto.dataUri} alt="User" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <User className="h-12 w-12 text-muted-foreground" />}
                            </div>
                            <p className="font-medium">Your Photo</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                             <div className="h-32 w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background">
                                {selectedTop ? <Image src={tops.find(t => t.id === selectedTop)!.dataUri} alt="Top" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <Shirt className="h-12 w-12 text-muted-foreground" />}
                            </div>
                            <p className="font-medium">Selected Top</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                             <div className="h-32 w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background">
                                {selectedBottom ? <Image src={bottoms.find(b => b.id === selectedBottom)!.dataUri} alt="Bottom" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M12 2v7.5"/><path d="m10 13-1.5 7.5"/><path d="M14 13l1.5 7.5"/><path d="M6 20.5c0-2 1.5-3.5 3.5-3.5h5c2 0 3.5 1.5 3.5 3.5v0c0 .8-.7 1.5-1.5 1.5h-9c-.8 0-1.5-.7-1.5-1.5v0Z"/></svg>}
                            </div>
                            <p className="font-medium">Selected Bottom</p>
                        </div>
                    </div>
                    <Button 
                        size="lg"
                        style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}
                        onClick={handleGenerateOutfit}
                        disabled={!isReadyToGenerate}
                        className="transition-all hover:scale-105"
                    >
                        Generate Outfit <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    {!isReadyToGenerate && <p className="text-sm text-muted-foreground">Select one of each item to begin.</p>}
                </div>
            )}
        </main>
    </div>
  );
}
