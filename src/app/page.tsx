
"use client";

import Image from 'next/image';
import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Footprints,
  History,
  Move,
  Plus,
  Shirt,
  Trash2,
  User,
  X,
  Zap,
  Camera,
  Users,
  Swords,
  FootprintsIcon,
  Sun,
  Moon
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn, resizeImage } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label";
import { useGenerationCount } from '@/hooks/use-generation-count';
import { Badge } from '@/components/ui/badge';
import CountdownTimer from '@/components/CountdownTimer';
import { Onboarding } from '@/components/Onboarding';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface ClothingItem {
  id: string;
  dataUri: string;
}

type PageStatus = 'loading' | 'onboarding' | 'ready';
type GenerationMode = 'stock' | 'custom';
type Race = 'None' | 'Black American' | 'Black' | 'Asian' | 'Indian' | 'White';
type BodyType = 'fat' | 'chubby' | 'slim' | 'fit' | 'muscular' | 'model' | 'bulky' | 'shredded';
type Background = 'Neutral Gray Studio' | 'Black Studio' |'Outdoor City Street' | 'Beach Sunset' | 'Forest Path' | 'Cozy Cafe' | 'Urban Rooftop' | 'Minimalist White Room' | 'Vibrant Graffiti Wall';
type Effect = 'None' | 'Movie-Like' | 'Golden Hour' | 'Dreamy' | 'VHS' | 'Black & White' | 'Sepia Tone' | 'High Contrast' | 'Infrared Glow';
type Framing = 'full-body' | 'half-body' | 'portrait';
type View = 'front' | 'back' | 'three-quarters';
type ViewAngle = 'Eye-Level' | 'Low Angle' | 'High Angle' | "Worm's-Eye View" | 'Overhead Shot' | 'Fisheye Lens';
type Theme = 'light' | 'dark';

interface ModelConfig {
  id: string;
  race: Race;
  gender: 'male' | 'female';
  bodyType: BodyType;
  selectedTop: string | null;
  selectedBottom: string | null;
  selectedDress: string | null;
  selectedShoe: string | null;
  posePhoto: ClothingItem | null;
}

const ONBOARDING_KEY = 'dressx_onboarding_complete_v2'; 
const GENERATION_INPUT_KEY = 'dressx_generation_input_v2';
const WORKSPACE_STATE_KEY = 'dressx_workspace_state_v6'; // Incremented version
const THEME_KEY = 'dressx_theme';

const defaultModelConfig = (): ModelConfig => ({
  id: uuidv4(),
  race: 'None',
  gender: 'male',
  bodyType: 'fit',
  selectedTop: null,
  selectedBottom: null,
  selectedDress: null,
  selectedShoe: null,
  posePhoto: null,
});

interface WorkspaceState {
  generationMode: GenerationMode;
  userPhoto: ClothingItem | null;
  models: ModelConfig[];
  view: View;
  viewAngle: ViewAngle;
  framing: Framing;
  background: Background;
  effect: Effect;
  tops: ClothingItem[];
  bottoms: ClothingItem[];
  dresses: ClothingItem[];
  shoes: ClothingItem[];
  savedAt: number; // Timestamp
}

export default function DressXPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { generationsLeft, resetsAt, error: generationCountError } = useGenerationCount();
  
  const [generationMode, setGenerationMode] = React.useState<GenerationMode>('stock');
  const [userPhoto, setUserPhoto] = React.useState<ClothingItem | null>(null);
  
  const [models, setModels] = React.useState<ModelConfig[]>([defaultModelConfig()]);
  const [activeModelTab, setActiveModelTab] = React.useState<string>(models[0].id);

  const [view, setView] = React.useState<View>('front');
  const [viewAngle, setViewAngle] = React.useState<ViewAngle>('Eye-Level');
  const [framing, setFraming] = React.useState<Framing>('full-body');
  const [background, setBackground] = React.useState<Background>('Neutral Gray Studio');
  const [effect, setEffect] = React.useState<Effect>('None');

  const [tops, setTops] = React.useState<ClothingItem[]>([]);
  const [bottoms, setBottoms] = React.useState<ClothingItem[]>([]);
  const [dresses, setDresses] = React.useState<ClothingItem[]>([]);
  const [shoes, setShoes] = React.useState<ClothingItem[]>([]);
  
  const [theme, setTheme] = React.useState<Theme>('dark');

  const [pageStatus, setPageStatus] = React.useState<PageStatus>('loading');

  const userPhotoInputRef = React.useRef<HTMLInputElement>(null);
  const poseInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const topInputRef = React.useRef<HTMLInputElement>(null);
  const bottomInputRef = React.useRef<HTMLInputElement>(null);
  const dressInputRef = React.useRef<HTMLInputElement>(null);
  const shoeInputRef = React.useRef<HTMLInputElement>(null);
  
  // Theme management
  React.useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
  }, []);

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleHeaderClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ONBOARDING_KEY);
      window.location.reload();
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboardingComplete = sessionStorage.getItem(ONBOARDING_KEY) === 'true';
      if (onboardingComplete) {
        setPageStatus('ready');
      } else {
        setPageStatus('onboarding');
      }
    }
  }, []);
  
  React.useEffect(() => {
    if (viewAngle === "Worm's-Eye View" || viewAngle === 'Overhead Shot') {
        if (framing !== 'full-body') {
            setFraming('full-body');
        }
    }
  }, [viewAngle, framing]);


  const handleOnboardingComplete = () => {
    sessionStorage.setItem(ONBOARDING_KEY, 'true');
    setPageStatus('ready');
  };

  // Restore state from localStorage on mount
  React.useEffect(() => {
    if (pageStatus !== 'ready') return;

    try {
      const savedStateJSON = localStorage.getItem(WORKSPACE_STATE_KEY);
      if (savedStateJSON) {
        const savedState: WorkspaceState = JSON.parse(savedStateJSON);
        
        const now = new Date().getTime();
        const twoDaysInMillis = 48 * 60 * 60 * 1000;
        if (now - savedState.savedAt > twoDaysInMillis) {
            localStorage.removeItem(WORKSPACE_STATE_KEY);
            toast({
                title: "Workspace Expired",
                description: "Your saved wardrobe items have been cleared to start fresh!",
            });
            return;
        }

        setGenerationMode(savedState.generationMode ?? 'stock');
        setUserPhoto(savedState.userPhoto ?? null);
        setModels(savedState.models?.map(m => ({...defaultModelConfig(), ...m})) ?? [defaultModelConfig()]);
        setView(savedState.view ?? 'front');
        setViewAngle(savedState.viewAngle ?? 'Eye-Level');
        setFraming(savedState.framing ?? 'full-body');
        setBackground(savedState.background ?? 'Neutral Gray Studio');
        setEffect(savedState.effect ?? 'None');
        setTops(savedState.tops ?? []);
        setBottoms(savedState.bottoms ?? []);
        setDresses(savedState.dresses ?? []);
        setShoes(savedState.shoes ?? []);
        
        // Ensure active tab is valid
        if (savedState.models && savedState.models.length > 0) {
            setActiveModelTab(savedState.models[0].id);
        } else {
            const newModel = defaultModelConfig();
            setModels([newModel]);
            setActiveModelTab(newModel.id);
        }
      }
    } catch (error) {
      console.error("Failed to restore workspace from localStorage", error);
      toast({
        variant: 'destructive',
        title: 'Could Not Restore Workspace',
        description: 'There was an issue loading your saved items. Starting fresh.',
      });
      localStorage.removeItem(WORKSPACE_STATE_KEY);
    }
  }, [pageStatus, toast]);

  // Save state to localStorage on change
  React.useEffect(() => {
    if (pageStatus !== 'ready') return;

    const workspaceState: WorkspaceState = {
      generationMode,
      userPhoto,
      models,
      view,
      viewAngle,
      framing,
      background,
      effect,
      tops,
      bottoms,
      dresses,
      shoes,
      savedAt: new Date().getTime(),
    };

    try {
      localStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(workspaceState));
    } catch (error) {
      console.error("Failed to save workspace to localStorage", error);
      toast({
        variant: 'destructive',
        title: 'Could Not Save Wardrobe',
        description: 'Your browser storage might be full. Please remove some items to save new ones.',
      });
    }
  }, [
    generationMode, userPhoto, models, view, viewAngle, framing, background, effect,
    tops, bottoms, dresses, shoes, pageStatus, toast
  ]);
  
  // Effect to clear user photo if custom photo is toggled off
  React.useEffect(() => {
    if (generationMode !== 'custom') {
      setUserPhoto(null);
    } else {
    // Only reset models if not already in correct state
    if (models.length !== 1) {
      const newModel = models[0] || defaultModelConfig();
      setModels([newModel]);
      setActiveModelTab(newModel.id);
    }
    }
  }, [generationMode, models]);

  const handleClearWorkspace = () => {
    const newModel = defaultModelConfig();
    setGenerationMode('stock');
    setUserPhoto(null);
    setModels([newModel]);
    setActiveModelTab(newModel.id);
    setView('front');
    setViewAngle('Eye-Level');
    setFraming('full-body');
    setBackground('Neutral Gray Studio');
    setEffect('None');
    setTops([]);
    setBottoms([]);
    setDresses([]);
    setShoes([]);
    
    try {
        localStorage.removeItem(WORKSPACE_STATE_KEY);
    } catch (error) {
        console.error("Could not clear workspace from localStorage", error);
    }

    toast({
        title: "Workspace Cleared",
        description: "You can start fresh now!",
    });
  };

  const handleFileUpload =
    (
      setter: React.Dispatch<React.SetStateAction<any>>,
      isMultiple: boolean = false,
      modelId?: string
    ) =>
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        try {
          const newItems = await Promise.all(
            Array.from(files).map(async file => {
              const resizedDataUri = await resizeImage(file);
              return {
                id: uuidv4(),
                dataUri: resizedDataUri,
              };
            })
          );
          
          if (modelId) { // This is a pose photo for a specific model
            updateModelConfig(modelId, { posePhoto: newItems[0] });
          } else if (isMultiple) {
            setter((prev: any) => [...prev, ...newItems]);
          } else {
            setter(newItems[0]);
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error instanceof Error ? error.message : "There was an error processing the file.",
          });
        } finally {
          event.target.value = '';
        }
      };
      
  const updateModelCount = (count: number) => {
    const newModels = Array.from({ length: count }, (_, i) => {
        return models[i] || defaultModelConfig();
    });
    setModels(newModels);
    if (!newModels.find(m => m.id === activeModelTab)) {
        setActiveModelTab(newModels[0].id);
    }
  };

  const updateModelConfig = (id: string, newConfig: Partial<ModelConfig>) => {
    setModels(currentModels => currentModels.map(m => m.id === id ? {...m, ...newConfig} : m));
  };
  
  const handleGenerateOutfit = () => {
    // Critical check: ensure generation service is connected and has credits.
    if (generationsLeft === null) {
      toast({
          variant: 'destructive',
          title: 'Service Not Ready',
          description: generationCountError || 'Connecting to the generation service. Please try again in a moment.',
      });
      return;
    }

    if (generationsLeft <= 0) {
      toast({
          variant: 'destructive',
          title: 'No Generations Left',
          description: 'Sorry, no generations left for today! Please check back tomorrow.',
      });
      return;
    }

    if (generationMode === 'custom' && !userPhoto) {
      toast({ variant: 'destructive', title: 'Missing Photo', description: 'Please add a photo of yourself for custom mode.' });
      return;
    }
    
    // Validation for each model
    for(const model of models) {
        if (generationMode === 'stock' && model.race === 'None') {
            toast({ variant: 'destructive', title: 'Missing Race', description: `Please select a race for Model ${models.indexOf(model) + 1}.` });
            return;
        }
        if (!model.selectedTop && !model.selectedDress) {
             toast({ variant: 'destructive', title: 'Missing Items', description: `Please select either a top or a dress for Model ${models.indexOf(model) + 1}.` });
             return;
        }
    }

    const generationInput = {
      generationMode,
      userPhotoDataUri: generationMode === 'custom' ? userPhoto?.dataUri : undefined,
      models: models.map(model => {
        const topItem = tops.find(t => t.id === model.selectedTop);
        const bottomItem = bottoms.find(b => b.id === model.selectedBottom);
        const dressItem = dresses.find(d => d.id === model.selectedDress);
        const shoeItem = shoes.find(s => s.id === model.selectedShoe);
        return {
          race: model.race,
          gender: model.gender,
          bodyType: model.bodyType,
          topClothingDataUri: dressItem ? undefined : topItem?.dataUri,
          bottomClothingDataUri: dressItem ? undefined : bottomItem?.dataUri,
          dressDataUri: dressItem?.dataUri,
          shoeDataUri: shoeItem?.dataUri,
          poseReferenceDataUri: model.posePhoto?.dataUri,
        }
      }),
      view,
      viewAngle,
      framing,
      background,
      effect,
    };

    try {
      sessionStorage.setItem(GENERATION_INPUT_KEY, JSON.stringify(generationInput));
      // Force navigation using window.location.href to avoid router issues.
      window.location.href = '/result';
    } catch (e) {
      console.error("Error saving generation input to session storage", e);
      toast({
        variant: 'destructive',
        title: 'Could Not Start Generation',
        description: 'There was an error preparing your outfit. Your browser storage might be full.',
      });
    }
  };

  const removeItem = (
    id: string,
    type: 'top' | 'bottom' | 'dress' | 'shoe' | 'user'
  ) => {
    if (type === 'user') setUserPhoto(null);
    else if (type === 'top') {
      setTops(tops.filter(item => item.id !== id));
      setModels(models.map(m => m.selectedTop === id ? {...m, selectedTop: null} : m));
    } else if (type === 'bottom') {
      setBottoms(bottoms.filter(item => item.id !== id));
      setModels(models.map(m => m.selectedBottom === id ? {...m, selectedBottom: null} : m));
    } else if (type === 'dress') {
      setDresses(dresses.filter(item => item.id !== id));
      setModels(models.map(m => m.selectedDress === id ? {...m, selectedDress: null} : m));
    } else {
      setShoes(shoes.filter(item => item.id !== id));
      setModels(models.map(m => m.selectedShoe === id ? {...m, selectedShoe: null} : m));
    }
  };

  const removePosePhoto = (modelId: string) => {
    updateModelConfig(modelId, { posePhoto: null });
  };
  
  const activeModel = models.find(m => m.id === activeModelTab) || models[0];

  const renderWardrobeItems = (
    items: ClothingItem[],
    selectedId: string | null,
    onSelect: (id: string, modelId: string) => void,
    type: 'top' | 'bottom' | 'dress' | 'shoe'
  ) => (
    <div className="grid grid-cols-3 gap-2">
      {items.map(item => (
        <motion.div key={item.id} className="relative group" layout>
          <button
            onClick={() => onSelect(item.id, activeModel.id)}
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
            onClick={(e) => { e.stopPropagation(); removeItem(item.id, type); }}
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      ))}
    </div>
  );

  const handleSelectTop = (id: string, modelId: string) => {
    updateModelConfig(modelId, { selectedTop: id, selectedDress: null });
  };
  const handleSelectBottom = (id: string, modelId: string) => {
    updateModelConfig(modelId, { selectedBottom: id, selectedDress: null });
  };
  const handleSelectDress = (id: string, modelId: string) => {
    updateModelConfig(modelId, { selectedDress: id, selectedTop: null, selectedBottom: null });
  };
  const handleSelectShoe = (id: string, modelId: string) => {
    updateModelConfig(modelId, { selectedShoe: id });
  }

  const isReadyToGenerate =
    models.length > 0 &&
    ((generationMode === 'custom' && userPhoto) || (generationMode === 'stock' && models.every(m => m.race !== 'None')))
    && models.every(m => m.selectedTop || m.selectedDress);
    
  const isFramingDisabled = viewAngle === "Worm's-Eye View" || viewAngle === 'Overhead Shot';

  const renderGenerateButtonContent = () => {
    if (generationCountError) {
      return 'Generation Service Error';
    }
    if (generationsLeft === null) {
      return 'Connecting...';
    }
    if (generationsLeft <= 0) {
      return 'No Generations Left';
    }
    return (
      <>
        Generate Outfit <ArrowRight className="ml-2 h-5 w-5" />
      </>
    );
  };


  if (pageStatus === 'loading') {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4"><Onboarding onComplete={() => setPageStatus('ready')} introOnly={true} /></div>;
  }
  
  if (pageStatus === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex flex-col md:flex-row md:h-screen bg-background">
      <input type="file" ref={userPhotoInputRef} onChange={handleFileUpload(setUserPhoto)} accept="image/*" className="hidden" />
      {models.map(model => (
          <input 
              key={model.id}
              type="file" 
              ref={el => poseInputRefs.current[model.id] = el} 
              onChange={handleFileUpload(() => {}, false, model.id)} 
              accept="image/*" 
              className="hidden" 
          />
      ))}
      <input type="file" ref={topInputRef} onChange={handleFileUpload(setTops, true)} accept="image/*" className="hidden" multiple />
      <input type="file" ref={bottomInputRef} onChange={handleFileUpload(setBottoms, true)} accept="image/*" className="hidden" multiple />
      <input type="file" ref={dressInputRef} onChange={handleFileUpload(setDresses, true)} accept="image/*" className="hidden" multiple />
      <input type="file" ref={shoeInputRef} onChange={handleFileUpload(setShoes, true)} accept="image/*" className="hidden" multiple />

      <aside className="w-full md:w-96 bg-card/60 border-r flex flex-col">
        <div className="sticky top-0 z-10 p-4 border-b bg-card/80 backdrop-blur-sm">
          <header className="flex justify-between items-center flex-wrap">
            <button onClick={handleHeaderClick} className="text-left group cursor-pointer mb-2 sm:mb-0">
              <h1 className="text-2xl font-bold text-foreground animate-pulse-glow">DRESSX</h1>
              <p className="text-muted-foreground">
                Your AI-powered virtual closet.
              </p>
            </button>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button variant="outline" size="icon" onClick={toggleTheme} title="Toggle Theme">
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
                {generationsLeft !== null && resetsAt ? (
                  <>
                    <Badge variant="outline" className="text-sm py-1 px-3 border-accent/50">
                      <Zap className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-foreground">{generationsLeft}</span>
                      <span className="text-muted-foreground ml-1.5">left</span>
                    </Badge>
                    <CountdownTimer resetsAt={resetsAt} />
                  </>
                ) : (
                  <>
                    <Skeleton className="h-[28px] w-[80px] rounded-full" />
                    <Skeleton className="h-[28px] w-[90px] rounded-full" />
                  </>
                )}
                <Button variant="outline" size="icon" onClick={() => router.push('/history')} title="History">
                  <History className="h-5 w-5" />
                </Button>
                <Button variant="destructive" size="icon" onClick={handleClearWorkspace} title="Clear Workspace">
                  <Trash2 className="h-5 w-5" />
                </Button>
            </div>
          </header>
        </div>

        <div className="p-4 flex flex-col gap-6 overflow-y-auto">
          {/* --- MODEL CONFIGURATION --- */}
          <div className="space-y-4">
            <h2 className="font-semibold">1. Your Model(s)</h2>
            <div className="space-y-2">
                <Label>Generation Mode</Label>
                <RadioGroup value={generationMode} onValueChange={(value: GenerationMode) => setGenerationMode(value)} className="grid grid-cols-2 gap-2">
                    <Label htmlFor="mode-stock" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer", generationMode === 'stock' && "border-primary")}>
                        <RadioGroupItem value="stock" id="mode-stock" className="sr-only" />
                        <Users className="mb-2 h-5 w-5" />
                        Stock
                    </Label>
                    <Label htmlFor="mode-custom" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer", generationMode === 'custom' && "border-primary")}>
                        <RadioGroupItem value="custom" id="mode-custom" className="sr-only" />
                        <Camera className="mb-2 h-5 w-5" />
                        Custom
                    </Label>
                </RadioGroup>
            </div>

            {generationMode === 'custom' && (
                userPhoto ? (
                <div className="relative group w-full aspect-[4/5] rounded-lg overflow-hidden">
                    <Image src={userPhoto.dataUri} alt="User" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="destructive" onClick={() => removeItem(userPhoto.id, 'user')}>
                        <Trash2 className="mr-2 h-4 w-4" /> Change Photo
                    </Button>
                    </div>
                </div>
                ) : (
                <button onClick={() => userPhotoInputRef.current?.click()} className="w-full aspect-[4/5] rounded-lg border-2 border-dashed flex flex-col items-center justify-center hover:border-primary transition-colors">
                    <User className="h-10 w-10 text-muted-foreground" />
                    <span className="mt-2 text-sm font-medium">Add Photo of Yourself</span>
                </button>
                )
            )}
            
            {generationMode === 'stock' && (
                <div className="space-y-2">
                    <Label>Number of Models</Label>
                    <Select value={String(models.length)} onValueChange={(value) => updateModelCount(Number(value))}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 Model</SelectItem>
                            <SelectItem value="2">2 Models</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            <Tabs value={activeModelTab} onValueChange={setActiveModelTab} className="w-full">
              {models.length > 1 && (
                <TabsList className="grid w-full grid-cols-2">
                  {models.map((m, i) => (
                    <TabsTrigger key={m.id} value={m.id}>Model {i + 1}</TabsTrigger>
                  ))}
                </TabsList>
              )}
              {models.map((model, index) => (
                <TabsContent key={model.id} value={model.id} className="space-y-4">
                  {generationMode === 'stock' && (
                    <div className="space-y-2">
                      <Label>Race (Model {index + 1})</Label>
                      <Select value={model.race} onValueChange={(value: Race) => updateModelConfig(model.id, { race: value })}>
                          <SelectTrigger><SelectValue placeholder="Select race" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="Black American">Black American</SelectItem>
                            <SelectItem value="Black">Black</SelectItem>
                            <SelectItem value="Asian">Asian</SelectItem>
                            <SelectItem value="Indian">Indian</SelectItem>
                            <SelectItem value="White">White</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                      <Label>Gender (Model {index + 1})</Label>
                      <RadioGroup value={model.gender} onValueChange={(value: 'male' | 'female') => updateModelConfig(model.id, { gender: value })} className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="male" id={`m${model.id}`} /><Label htmlFor={`m${model.id}`}>Male</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="female" id={`f${model.id}`} /><Label htmlFor={`f${model.id}`}>Female</Label></div>
                      </RadioGroup>
                  </div>
                   <div className="space-y-2">
                    <Label>Body Type (Model {index + 1})</Label>
                    <Select value={model.bodyType} onValueChange={(value: BodyType) => updateModelConfig(model.id, { bodyType: value })}>
                        <SelectTrigger><SelectValue placeholder="Select body type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slim">Slim</SelectItem>
                          <SelectItem value="fit">Fit</SelectItem>
                          <SelectItem value="muscular">Muscular</SelectItem>
                          <SelectItem value="shredded">Shredded</SelectItem>
                          <SelectItem value="model">Model</SelectItem>
                          <SelectItem value="chubby">Chubby</SelectItem>
                          <SelectItem value="fat">Fat</SelectItem>
                          <SelectItem value="bulky">Bulky</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                        <Label>Pose Reference (Model {index + 1})</Label>
                        {model.posePhoto ? (
                          <div className="relative group w-full aspect-square rounded-lg overflow-hidden">
                            <Image src={model.posePhoto.dataUri} alt="Pose Reference" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="destructive" onClick={() => removePosePhoto(model.id)}><Trash2 className="mr-2 h-4 w-4" />Change Pose</Button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => poseInputRefs.current[model.id]?.click()} className="w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center hover:border-primary transition-colors">
                            <Move className="h-10 w-10 text-muted-foreground" />
                            <span className="mt-2 text-sm font-medium">Add Pose</span>
                          </button>
                        )}
                    </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* --- SCENE & STYLE --- */}
          <div className="space-y-4">
              <h2 className="font-semibold">2. Scene &amp; Style</h2>
              
              <div className="space-y-2">
                  <Label>View Direction</Label>
                  <RadioGroup value={view} onValueChange={(value: View) => setView(value)} className="grid grid-cols-3 gap-2">
                      <Label htmlFor="v1" className={cn("flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer", view === 'front' && "border-primary")}>
                          <RadioGroupItem value="front" id="v1" className="sr-only" />Front
                      </Label>
                      <Label htmlFor="v2" className={cn("flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer", view === 'back' && "border-primary")}>
                          <RadioGroupItem value="back" id="v2" className="sr-only" />Back
                      </Label>
                      <Label htmlFor="v3" className={cn("flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer", view === 'three-quarters' && "border-primary")}>
                          <RadioGroupItem value="three-quarters" id="v3" className="sr-only" />3/4 View
                      </Label>
                  </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Framing</Label>
                 <RadioGroup value={framing} onValueChange={(v: Framing) => !isFramingDisabled && setFraming(v)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full-body" id="f1" disabled={isFramingDisabled} />
                        <Label htmlFor="f1" className={cn(isFramingDisabled && "text-muted-foreground/50")}>Full Body</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="half-body" id="f2" disabled={isFramingDisabled} />
                        <Label htmlFor="f2" className={cn(isFramingDisabled && "text-muted-foreground/50")}>Half Body</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="portrait" id="f3" disabled={isFramingDisabled} />
                        <Label htmlFor="f3" className={cn(isFramingDisabled && "text-muted-foreground/50")}>Portrait</Label>
                    </div>
                 </RadioGroup>
              </div>
                  
              <div className="space-y-2">
                  <Label>Background</Label>
                  <Select value={background} onValueChange={(value: Background) => setBackground(value)}>
                      <SelectTrigger><SelectValue placeholder="Select background" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Neutral Gray Studio">Neutral Gray Studio</SelectItem>
                        <SelectItem value="Black Studio">Black Studio</SelectItem>
                        <SelectItem value="Outdoor City Street">Outdoor City Street</SelectItem>
                        <SelectItem value="Beach Sunset">Beach Sunset</SelectItem>
                        <SelectItem value="Forest Path">Forest Path</SelectItem>
                        <SelectItem value="Cozy Cafe">Cozy Cafe</SelectItem>
                        <SelectItem value="Urban Rooftop">Urban Rooftop</SelectItem>
                        <SelectItem value="Minimalist White Room">Minimalist White Room</SelectItem>
                        <SelectItem value="Vibrant Graffiti Wall">Vibrant Graffiti Wall</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              
              <div className="space-y-2">
                  <Label>Camera Angle</Label>
                  <Select value={viewAngle} onValueChange={(value: ViewAngle) => setViewAngle(value)}>
                      <SelectTrigger><SelectValue placeholder="Select view angle" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Eye-Level">Eye-Level</SelectItem>
                        <SelectItem value="Low Angle">Low Angle</SelectItem>
                        <SelectItem value="High Angle">High Angle</SelectItem>
                        <SelectItem value="Worm's-Eye View">Worm's-Eye View</SelectItem>
                        <SelectItem value="Overhead Shot">Overhead Shot</SelectItem>
                        <SelectItem value="Fisheye Lens">Fisheye Lens</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              
               <div className="space-y-2">
                  <Label>Effect</Label>
                  <Select value={effect} onValueChange={(value: Effect) => setEffect(value)}>
                      <SelectTrigger><SelectValue placeholder="Select effect" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Movie-Like">Movie-Like</SelectItem>
                        <SelectItem value="Golden Hour">Golden Hour</SelectItem>
                        <SelectItem value="Dreamy">Dreamy</SelectItem>
                        <SelectItem value="VHS">VHS</SelectItem>
                        <SelectItem value="Black & White">Black & White</SelectItem>
                        <SelectItem value="Sepia Tone">Sepia Tone</SelectItem>
                        <SelectItem value="High Contrast">High Contrast</SelectItem>
                        <SelectItem value="Infrared Glow">Infrared Glow</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </div>

          {/* --- WARDROBE --- */}
          <div className="space-y-4">
            <h2 className="font-semibold">3. Your Wardrobe {models.length > 1 ? `(for Model ${models.indexOf(activeModel) + 1})` : ''}</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center"><h3 className="text-sm font-medium">Tops</h3><Button size="sm" variant="outline" onClick={() => topInputRef.current?.click()}><Plus className="h-4 w-4 mr-2" />Add</Button></div>
              {renderWardrobeItems(tops, activeModel.selectedTop, handleSelectTop, 'top')}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center"><h3 className="text-sm font-medium">Bottoms</h3><Button size="sm" variant="outline" onClick={() => bottomInputRef.current?.click()}><Plus className="h-4 w-4 mr-2" />Add</Button></div>
              {renderWardrobeItems(bottoms, activeModel.selectedBottom, handleSelectBottom, 'bottom')}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center"><h3 className="text-sm font-medium">Dresses</h3><Button size="sm" variant="outline" onClick={() => dressInputRef.current?.click()}><Plus className="h-4 w-4 mr-2" />Add</Button></div>
              {renderWardrobeItems(dresses, activeModel.selectedDress, handleSelectDress, 'dress')}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center"><h3 className="text-sm font-medium">Shoes (Optional)</h3><Button size="sm" variant="outline" onClick={() => shoeInputRef.current?.click()}><Plus className="h-4 w-4 mr-2" />Add</Button></div>
              {renderWardrobeItems(shoes, activeModel.selectedShoe, handleSelectShoe, 'shoe')}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 flex items-center justify-center relative">
        <motion.div
          key="placeholder"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-8 text-center max-w-lg"
        >
           <div className="flex flex-wrap justify-center items-start gap-4 md:gap-6">
             {models.map((model, index) => {
                const top = tops.find(t => t.id === model.selectedTop);
                const bottom = bottoms.find(b => b.id === model.selectedBottom);
                const dress = dresses.find(d => d.id === model.selectedDress);
                const shoe = shoes.find(s => s.id === model.selectedShoe);
                return (
                    <div key={model.id} className="flex flex-col items-center gap-4">
                        <p className="font-bold text-lg">Model {index + 1}</p>
                        <div className="flex gap-2">
                        
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-24 w-24 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                {generationMode === 'custom' && userPhoto ? <Image src={userPhoto.dataUri} alt="User" width={96} height={96} className="rounded-full object-cover h-full w-full" /> : <User className="h-10 w-10 text-muted-foreground" />}
                                </div>
                            </div>
                        
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-24 w-24 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                            {dress ? <Image src={dress.dataUri} alt="Dress" width={96} height={96} className="rounded-full object-cover h-full w-full" /> : (top ? <Image src={top.dataUri} alt="Top" width={96} height={96} className="rounded-full object-cover h-full w-full" /> : <Shirt className="h-10 w-10 text-muted-foreground" />)}
                            </div>
                        </div>
                         { !dress && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-24 w-24 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                    {bottom ? <Image src={bottom.dataUri} alt="Bottom" width={96} height={96} className="rounded-full object-cover h-full w-full" /> : <Swords className="h-10 w-10 text-muted-foreground -rotate-45" />}
                                </div>
                            </div>
                         )}
                         <div className="flex flex-col items-center gap-2">
                            <div className="h-24 w-24 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                            {shoe ? <Image src={shoe.dataUri} alt="Shoes" width={96} height={96} className="rounded-full object-cover h-full w-full" /> : <FootprintsIcon className="h-10 w-10 text-muted-foreground" />}
                            </div>
                        </div>
                        </div>
                    </div>
                );
             })}
           </div>
          <Button
            size="lg"
            onClick={handleGenerateOutfit}
            disabled={!isReadyToGenerate || generationsLeft === null || generationsLeft <= 0 || !!generationCountError}
            variant="accent"
          >
            {renderGenerateButtonContent()}
          </Button>
          {!isReadyToGenerate && (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Please select a generation mode, model details (if applicable), and a top or dress for each model to begin.
            </p>
          )}
          {generationsLeft !== null && generationsLeft <= 0 && (
            <p className="text-sm text-destructive mt-2 font-semibold">
              No generations left for today. Please try again tomorrow.
            </p>
          )}
          {generationCountError && (
            <p className="text-sm text-destructive mt-2 font-semibold">
              {generationCountError}
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}

    