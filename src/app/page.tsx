
"use client";

import Image from 'next/image';
import * as React from 'react';
import {
  ArrowRight,
  Download,
  Footprints,
  Loader2,
  Move,
  Plus,
  RefreshCw,
  Share2,
  Shirt,
  Sparkles,
  Trash2,
  User,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
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
  const [posePhoto, setPosePhoto] = React.useState<ClothingItem | null>(null);
  const [tops, setTops] = React.useState<ClothingItem[]>([]);
  const [bottoms, setBottoms] = React.useState<ClothingItem[]>([]);
  const [shoes, setShoes] = React.useState<ClothingItem[]>([]);
  const [selectedTop, setSelectedTop] = React.useState<string | null>(null);
  const [selectedBottom, setSelectedBottom] = React.useState<string | null>(
    null
  );
  const [selectedShoe, setSelectedShoe] = React.useState<string | null>(null);
  const [modelHeight, setModelHeight] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female'>('female');

  const [generatedOutfit, setGeneratedOutfit] = React.useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isShareSupported, setIsShareSupported] = React.useState(false);

  // Pan and Zoom state
  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  const [transform, setTransform] = React.useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });

  const userPhotoInputRef = React.useRef<HTMLInputElement>(null);
  const poseInputRef = React.useRef<HTMLInputElement>(null);
  const topInputRef = React.useRef<HTMLInputElement>(null);
  const bottomInputRef = React.useRef<HTMLInputElement>(null);
  const shoeInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Use `navigator.canShare` to check for file sharing support specifically
    if (navigator.canShare && navigator.canShare({ files: [new File([], '')] })) {
      setIsShareSupported(true);
    }
  }, []);

  const resetTransform = () => {
    setTransform({ scale: 1, x: 0, y: 0 });
  };

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
    resetTransform();

    const topItem = tops.find(t => t.id === selectedTop);
    const bottomItem = bottoms.find(b => b.id === selectedBottom);
    const shoeItem = shoes.find(s => s.id === selectedShoe);

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
        shoeDataUri: shoeItem?.dataUri,
        poseReferenceDataUri: posePhoto?.dataUri,
        modelHeight: modelHeight,
        gender: gender,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setGeneratedOutfit(result.generatedOutfitDataUri!);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during outfit generation.';
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
    if (!generatedOutfit || !isShareSupported) {
       toast({
        variant: 'destructive',
        title: 'Sharing Not Supported',
        description: 'Your browser does not support sharing files.',
      });
      return;
    }

    try {
      const response = await fetch(generatedOutfit);
      const blob = await response.blob();
      const file = new File([blob], 'dressme-outfit.png', {
        type: blob.type,
      });

      await navigator.share({
        title: 'My New Outfit from DressMe!',
        text: 'Check out this virtual outfit I created with DressMe.',
        files: [file],
      });
    } catch (error) {
       console.error("Share error:", error);
      toast({
        variant: 'destructive',
        title: 'Sharing Failed',
        description: 'Could not share the image.',
      });
    }
  };

  const handleStartOver = () => {
    setGeneratedOutfit(null);
    resetTransform();
  };

  const removeItem = (
    id: string,
    type: 'top' | 'bottom' | 'shoe' | 'user' | 'pose'
  ) => {
    if (type === 'user') {
      setUserPhoto(null);
    } else if (type === 'pose') {
      setPosePhoto(null);
    } else if (type === 'top') {
      setTops(tops.filter(item => item.id !== id));
      if (selectedTop === id) setSelectedTop(null);
    } else if (type === 'bottom') {
      setBottoms(bottoms.filter(item => item.id !== id));
      if (selectedBottom === id) setSelectedBottom(null);
    } else {
      setShoes(shoes.filter(item => item.id !== id));
      if (selectedShoe === id) setSelectedShoe(null);
    }
  };

  // Pan and Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? transform.scale * zoomFactor : transform.scale / zoomFactor;
    const clampedScale = Math.max(0.5, Math.min(newScale, 5));

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
    const clampedScale = Math.max(0.5, Math.min(newScale, 5));
    
    const newX = centerX - (centerX - transform.x) * (clampedScale / transform.scale);
    const newY = centerY - (centerY - transform.y) * (clampedScale / transform.scale);

    setTransform({ scale: clampedScale, x: newX, y: newY });
  }

  const renderWardrobeItems = (
    items: ClothingItem[],
    selectedId: string | null,
    onSelect: (id: string) => void,
    type: 'top' | 'bottom' | 'shoe'
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
                : 'border-transparent hover:border-primary/50'
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
    <>
      <div className="flex flex-col md:flex-row md:h-screen bg-transparent">
        <input
          type="file"
          ref={userPhotoInputRef}
          onChange={handleFileUpload(setUserPhoto)}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={poseInputRef}
          onChange={handleFileUpload(setPosePhoto)}
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
        <input
          type="file"
          ref={shoeInputRef}
          onChange={handleFileUpload(setShoes, true)}
          accept="image/*"
          className="hidden"
          multiple
        />

        <aside className="w-full md:w-96 bg-background/80 backdrop-blur-xl border-r p-4 flex flex-col gap-6 overflow-y-auto">
          <header className="animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-2xl font-bold text-primary">DressMe</h1>
            <p className="text-muted-foreground">
              Your AI-powered virtual closet.
            </p>
          </header>

          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500" style={{animationDelay: '100ms'}}>
            <h2 className="font-semibold">1. Your Photo</h2>
            {userPhoto ? (
              <div className="relative group w-full aspect-square rounded-lg overflow-hidden">
                <Image
                  src={userPhoto.dataUri}
                  alt="User"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    onClick={() => removeItem(userPhoto.id, 'user')}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Change Photo
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => userPhotoInputRef.current?.click()}
                className="w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center hover:border-primary transition-colors"
              >
                <User className="h-10 w-10 text-muted-foreground" />
                <span className="mt-2 text-sm font-medium">Add Photo</span>
              </button>
            )}
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500" style={{animationDelay: '200ms'}}>
            <h2 className="font-semibold">2. Pose Reference (Optional)</h2>
            {posePhoto ? (
              <div className="relative group w-full aspect-square rounded-lg overflow-hidden">
                <Image
                  src={posePhoto.dataUri}
                  alt="Pose Reference"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    onClick={() => removeItem(posePhoto.id, 'pose')}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Change Pose
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => poseInputRef.current?.click()}
                className="w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center hover:border-primary transition-colors"
              >
                <Move className="h-10 w-10 text-muted-foreground" />
                <span className="mt-2 text-sm font-medium">
                  Add Pose Photo
                </span>
              </button>
            )}
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500" style={{animationDelay: '300ms'}}>
            <h2 className="font-semibold">3. Your Wardrobe</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Tops</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => topInputRef.current?.click()}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              {renderWardrobeItems(tops, selectedTop, setSelectedTop, 'top')}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Bottoms</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bottomInputRef.current?.click()}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              {renderWardrobeItems(
                bottoms,
                selectedBottom,
                setSelectedBottom,
                'bottom'
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Shoes (Optional)</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => shoeInputRef.current?.click()}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              {renderWardrobeItems(
                shoes,
                selectedShoe,
                setSelectedShoe,
                'shoe'
              )}
            </div>
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500" style={{animationDelay: '400ms'}}>
            <h2 className="font-semibold">4. Details</h2>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gender</Label>
              <RadioGroup
                value={gender}
                onValueChange={(value: 'male' | 'female') => setGender(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="r-female" />
                  <Label htmlFor="r-female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="r-male" />
                  <Label htmlFor="r-male">Male</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Model Height (Optional)
              </Label>
              <Input
                placeholder="e.g., 5ft 10in or 178cm"
                value={modelHeight}
                onChange={e => setModelHeight(e.target.value)}
              />
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-foreground/80 animate-pulse">
                Generating your masterpiece...
              </p>
              <p className="text-sm text-muted-foreground">
                This can take up to a minute. Please be patient.
              </p>
            </div>
          ) : generatedOutfit ? (
            <Card className="max-w-2xl w-full animate-in fade-in zoom-in-95 bg-card/60 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="text-accent" />
                  Here's Your Look!
                </CardTitle>
                <CardDescription>
                  Pan and zoom, share, or download your new virtual outfit.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
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
                    src={generatedOutfit}
                    alt="Generated Outfit"
                    width={800}
                    height={1067}
                    className="w-full h-full object-contain transition-transform duration-200 pointer-events-none"
                    style={{
                      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                      transformOrigin: '0 0',
                    }}
                    draggable={false}
                  />
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-lg shadow-md">
                   <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleZoomButtonClick('out')}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium w-12 text-center select-none">
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
              <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={handleStartOver}>
                  Start Over
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                {isShareSupported && (
                  <Button onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <div className="flex flex-col items-center gap-8 text-center max-w-lg animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    {userPhoto ? <Image src={userPhoto.dataUri} alt="User" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <User className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />}
                  </div>
                  <p className="font-medium text-sm md:text-base">Your Photo</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    {selectedTop ? <Image src={tops.find(t => t.id === selectedTop)!.dataUri} alt="Top" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <Shirt className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />}
                  </div>
                  <p className="font-medium text-sm md:text-base">Selected Top</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    {selectedBottom ? <Image src={bottoms.find(b => b.id === selectedBottom)!.dataUri} alt="Bottom" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground h-10 w-10 md:h-12 md:w-12">
                        <path d="M12 2v7.5"/>
                        <path d="m10 13-1.5 7.5"/>
                        <path d="M14 13l1.5 7.5"/>
                        <path d="M6 20.5c0-2 1.5-3.5 3.5-3.5h5c2 0 3.5 1.5 3.5 3.5v0c0 .8-.7 1.5-1.5 1.5h-9c-.8 0-1.5-.7-1.5-1.5v0Z"/>
                      </svg>
                    )}
                  </div>
                  <p className="font-medium text-sm md:text-base">Selected Bottom</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    {selectedShoe ? <Image src={shoes.find(s => s.id === selectedShoe)!.dataUri} alt="Shoes" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <Footprints className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />}
                  </div>
                  <p className="font-medium text-sm md:text-base">Shoes</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    {posePhoto ? <Image src={posePhoto.dataUri} alt="Pose" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <Move className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />}
                  </div>
                  <p className="font-medium text-sm md:text-base">Pose</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    {gender === 'female' ? <UserRound className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" /> : <User className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />}
                  </div>
                  <p className="font-medium text-sm md:text-base">Gender</p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleGenerateOutfit}
                disabled={!isReadyToGenerate || isLoading}
                className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all hover:scale-105"
              >
                Generate Outfit <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {!isReadyToGenerate && (
                <p className="text-sm text-muted-foreground">
                  Select a photo, top, and bottom to begin.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
