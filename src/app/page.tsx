"use client";

import Image from 'next/image';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Info
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- Onboarding Components ---

const IntroScreen = ({ onFinished }: { onFinished: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onFinished(), 3500);
    return () => clearTimeout(timer);
  }, [onFinished]);

  const title = "DRESSX";
  const sentence = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.5,
        staggerChildren: 0.08,
      },
    },
  };
  const letter = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-black">
      <motion.h1
        className="text-7xl md:text-9xl font-black text-white text-shadow tracking-tighter"
        variants={sentence}
        initial="hidden"
        animate="visible"
      >
        {title.split("").map((char, index) => (
          <motion.span key={char + "-" + index} variants={letter}>
            {char}
          </motion.span>
        ))}
      </motion.h1>
      <motion.p 
        className="text-xl text-muted-foreground mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        Your virtual AI closet.
      </motion.p>
    </div>
  );
};


const OnboardingFlow = ({ onFinished }: { onFinished: () => void }) => {
  const [step, setStep] = React.useState(1);

  const steps = [
    {
      icon: <Sparkles className="h-16 w-16 text-primary" />,
      title: "Welcome to DRESSX",
      description: "See yourself in any outfit from your digital closet instantly. Discover new styles, save time, and have fun with your wardrobe, all powered by AI.",
      buttonText: "Next"
    },
    {
      icon: <Info className="h-16 w-16 text-primary" />,
      title: "How It Works",
      description: "Simply upload a clear photo of yourself, add items to your virtual wardrobe, and select an outfit. Our AI will generate a realistic image of you wearing it.",
      buttonText: "Get Started"
    }
  ];

  const currentStep = steps[step - 1];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(s => s + 1);
    } else {
      onFinished();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen p-4 bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="glassmorphic text-center">
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                {currentStep.icon}
              </div>
              <CardTitle className="text-3xl">{currentStep.title}</CardTitle>
              <CardDescription className="text-base text-foreground/80 pt-2">
                {currentStep.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 2 && (
                 <Alert variant="default" className="text-left bg-muted/50 border-accent/50">
                  <Info className="h-4 w-4 text-accent" />
                  <AlertTitle className="text-accent">A Friendly Note on AI</AlertTitle>
                  <AlertDescription>
                    Our AI is powerful, but not always perfect. Face and pose replication is usually accurate, but occasional quirks can happen. We appreciate your understanding as we continue to improve!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-4">
               <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleNext}>
                 {currentStep.buttonText} <ArrowRight className="ml-2"/>
              </Button>
              <div className="flex justify-center gap-2">
                  {steps.map((_, i) => (
                      <div key={i} className={cn("h-2 w-2 rounded-full transition-all", i + 1 === step ? "bg-primary w-4" : "bg-muted")}></div>
                  ))}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


// --- Main App ---

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

const resizeImage = (
  dataUri: string,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): Promise<string> => {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } else {
        resolve(dataUri);
      }
    };
    img.src = dataUri;
  });
};

function MainApp() {
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
  const [gender, setGender] = React.useState<'male' | 'female'>('male');

  const [generatedOutfit, setGeneratedOutfit] = React.useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingStep, setLoadingStep] = React.useState('');
  const [isShareSupported, setIsShareSupported] = React.useState(false);

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
          Array.from(files).map(async file => {
            const dataUri = await readFileAsDataURL(file);
            const resizedDataUri = await resizeImage(dataUri);
            return {
              id: uuidv4(),
              dataUri: resizedDataUri,
            };
          })
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
    setLoadingStep('Generating your masterpiece...');
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
      
      if (result.generatedOutfitDataUri) {
        setGeneratedOutfit(result.generatedOutfitDataUri);
      } else {
        throw new Error('Image generation failed to return an image.');
      }
      
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
      setLoadingStep('');
    }
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
      const file = new File([blob], 'dressx-outfit.png', {
        type: blob.type,
      });

      await navigator.share({
        title: 'My New Outfit from DRESSX!',
        text: 'Check out this virtual outfit I created with DRESSX.',
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

  const MotionButton = motion(Button);

  const renderWardrobeItems = (
    items: ClothingItem[],
    selectedId: string | null,
    onSelect: (id: string) => void,
    type: 'top' | 'bottom' | 'shoe'
  ) => (
    <div className="grid grid-cols-3 gap-2">
      {items.map(item => (
        <motion.div key={item.id} className="relative group" layout>
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
          <MotionButton
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeItem(item.id, type)}
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            exit={{scale: 0, opacity: 0}}
          >
            <X className="h-4 w-4" />
          </MotionButton>
        </motion.div>
      ))}
    </div>
  );

  const isReadyToGenerate = userPhoto && selectedTop && selectedBottom;

  return (
    <div className="flex flex-col md:flex-row md:h-screen bg-transparent bg-grid-zinc-700/[0.2]">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
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

      <motion.aside 
        initial={{ x: -384 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        className="w-full md:w-96 glassmorphic border-r p-4 flex flex-col gap-6 overflow-y-auto"
      >
        <header>
          <h1 className="text-2xl font-bold text-primary">DRESSX</h1>
          <p className="text-muted-foreground">
            Your AI-powered virtual closet.
          </p>
        </header>

        <div className="space-y-4">
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

        <div className="space-y-4">
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

        <div className="space-y-4">
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

        <div className="space-y-4">
          <h2 className="font-semibold">4. Details</h2>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Gender</Label>
            <RadioGroup
              value={gender}
              onValueChange={(value: 'male' | 'female') => setGender(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="r-male" />
                <Label htmlFor="r-male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="r-female" />
                <Label htmlFor="r-female">Female</Label>
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
      </motion.aside>

      <main className="flex-1 p-4 md:p-6 flex items-center justify-center relative">
        <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center gap-4 text-center"
          >
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground/80 animate-pulse">
              {loadingStep}
            </p>
            <p className="text-sm text-muted-foreground">
              This can take a few moments. Please be patient.
            </p>
          </motion.div>
        ) : generatedOutfit ? (
          <motion.div
            key="outfit-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
          <Card className="w-full glassmorphic">
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
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-8 text-center max-w-lg"
          >
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
                      <path d="M12 2v7.5"/><path d="m10 13-1.5 7.5"/><path d="M14 13l1.5 7.5"/><path d="M6 20.5c0-2 1.5-3.5 3.5-3.5h5c2 0 3.5 1.5 3.5 3.5v0c0 .8-.7 1.5-1.5 1.5h-9c-.8 0-1.5-.7-1.5-1.5v0Z"/>
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
            <MotionButton
              size="lg"
              onClick={handleGenerateOutfit}
              disabled={!isReadyToGenerate || isLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Generate Outfit <ArrowRight className="ml-2 h-5 w-5" />
            </MotionButton>
            {!isReadyToGenerate && (
              <p className="text-sm text-muted-foreground">
                Select a photo, top, and bottom to begin.
              </p>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
}


export default function DressXPage() {
  const [appState, setAppState] = React.useState<'loading' | 'onboarding' | 'main'>('loading');

  React.useEffect(() => {
    const hasOnboarded = localStorage.getItem('dressx_onboarded');
    if (hasOnboarded) {
      setAppState('main');
    } else {
      // stay in loading state, IntroScreen will transition it
    }
  }, []);

  const handleIntroFinish = () => {
    setAppState('onboarding');
  };

  const handleOnboardingFinish = () => {
    localStorage.setItem('dressx_onboarded', 'true');
    setAppState('main');
  };

  if (appState === 'loading') {
    return <IntroScreen onFinished={handleIntroFinish} />;
  }

  if (appState === 'onboarding') {
    return <OnboardingFlow onFinished={handleOnboardingFinish} />;
  }

  return <MainApp />;
}
