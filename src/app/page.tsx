
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
import { Switch } from '@/components/ui/switch';
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
type Race = 'None' | 'Black American' | 'Black' | 'Asian' | 'Indian' | 'White';
type BodyType = 'fat' | 'chubby' | 'slim' | 'fit' | 'muscular' | 'model' | 'bulky' | 'shredded';
type Background = 'Neutral Gray Studio' | 'Black Studio' |'Outdoor City Street' | 'Beach Sunset' | 'Forest Path' | 'Cozy Cafe' | 'Urban Rooftop' | 'Minimalist White Room' | 'Vibrant Graffiti Wall';
type Effect = 'None' | 'Movie-Like' | 'Golden Hour' | 'Dreamy' | 'VHS' | 'Black & White' | 'Sepia Tone' | 'High Contrast' | 'Infrared Glow';
type Framing = 'full-body' | 'half-body' | 'portrait';

const ONBOARDING_KEY = 'dressx_onboarding_complete_v1';
const GENERATION_INPUT_KEY = 'dressx_generation_input';
const WORKSPACE_STATE_KEY = 'dressx_workspace_state_v4'; // Incremented version

export default function DressXPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { generationsLeft, resetsAt, error: generationCountError } = useGenerationCount();
  
  const [useCustomPhoto, setUseCustomPhoto] = React.useState<boolean>(false);
  const [userPhoto, setUserPhoto] = React.useState<ClothingItem | null>(null);
  const [posePhoto, setPosePhoto] = React.useState<ClothingItem | null>(null);
  const [race, setRace] = React.useState<Race>('None');
  const [gender, setGender] = React.useState<'male' | 'female'>('male');
  const [bodyType, setBodyType] = React.useState<BodyType>('fit');
  const [view, setView] = React.useState<'front' | 'back'>('front');
  const [framing, setFraming] = React.useState<Framing>('full-body');
  const [background, setBackground] = React.useState<Background>('Neutral Gray Studio');
  const [effect, setEffect] = React.useState<Effect>('None');

  const [tops, setTops] = React.useState<ClothingItem[]>([]);
  const [bottoms, setBottoms] = React.useState<ClothingItem[]>([]);
  const [dresses, setDresses] = React.useState<ClothingItem[]>([]);
  const [shoes, setShoes] = React.useState<ClothingItem[]>([]);

  const [selectedTop, setSelectedTop] = React.useState<string | null>(null);
  const [selectedBottom, setSelectedBottom] = React.useState<string | null>(null);
  const [selectedDress, setSelectedDress] = React.useState<string | null>(null);
  const [selectedShoe, setSelectedShoe] = React.useState<string | null>(null);
  
  const [pageStatus, setPageStatus] = React.useState<PageStatus>('loading');

  const userPhotoInputRef = React.useRef<HTMLInputElement>(null);
  const poseInputRef = React.useRef<HTMLInputElement>(null);
  const topInputRef = React.useRef<HTMLInputElement>(null);
  const bottomInputRef = React.useRef<HTMLInputElement>(null);
  const dressInputRef = React.useRef<HTMLInputElement>(null);
  const shoeInputRef = React.useRef<HTMLInputElement>(null);

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
        setPageStatus('loading');
      } else {
        setPageStatus('onboarding');
      }
    }
  }, []);

  const handleOnboardingComplete = () => {
    sessionStorage.setItem(ONBOARDING_KEY, 'true');
    setPageStatus('ready');
  };

  const handleRestoreComplete = () => {
    setPageStatus('ready');
  };

  // Restore state from localStorage on mount
  React.useEffect(() => {
    if (pageStatus !== 'ready') return;

    try {
      const savedStateJSON = localStorage.getItem(WORKSPACE_STATE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState.useCustomPhoto) setUseCustomPhoto(savedState.useCustomPhoto);
        if (savedState.userPhoto) setUserPhoto(savedState.userPhoto);
        if (savedState.posePhoto) setPosePhoto(savedState.posePhoto);
        if (savedState.race) setRace(savedState.race);
        if (savedState.gender) setGender(savedState.gender);
        if (savedState.bodyType) setBodyType(savedState.bodyType);
        if (savedState.view) setView(savedState.view);
        if (savedState.framing) setFraming(savedState.framing);
        if (savedState.background) setBackground(savedState.background);
        if (savedState.effect) setEffect(savedState.effect);
        if (savedState.tops) setTops(savedState.tops);
        if (savedState.bottoms) setBottoms(savedState.bottoms);
        if (savedState.dresses) setDresses(savedState.dresses);
        if (savedState.shoes) setShoes(savedState.shoes);
        if (savedState.selectedTop) setSelectedTop(savedState.selectedTop);
        if (savedState.selectedBottom) setSelectedBottom(savedState.selectedBottom);
        if (savedState.selectedDress) setSelectedDress(savedState.selectedDress);
        if (savedState.selectedShoe) setSelectedShoe(savedState.selectedShoe);
      }
    } catch (error) {
      console.error("Failed to restore workspace from localStorage", error);
      toast({
        variant: 'destructive',
        title: 'Could Not Restore Workspace',
        description: 'There was an issue loading your saved items. Your browser storage might be full or corrupted.',
      });
      localStorage.removeItem(WORKSPACE_STATE_KEY);
    }
  }, [pageStatus, toast]);

  // Save state to localStorage on change
  React.useEffect(() => {
    if (pageStatus !== 'ready') return;

    const workspaceState = {
      useCustomPhoto,
      userPhoto,
      posePhoto,
      race,
      gender,
      bodyType,
      view,
      framing,
      background,
      effect,
      tops,
      bottoms,
      dresses,
      shoes,
      selectedTop,
      selectedBottom,
      selectedDress,
      selectedShoe,
    };

    try {
      localStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(workspaceState));
    } catch (error) {
      console.error("Failed to save workspace to localStorage", error);
      toast({
        variant: 'destructive',
        title: 'Could Not Save Wardrobe',
        description: 'Your browser storage is full. Please remove some items to save new ones.',
        duration: 5000,
      });
    }
  }, [
    useCustomPhoto,
    userPhoto,
    posePhoto,
    race,
    gender,
    bodyType,
    view,
    framing,
    background,
    effect,
    tops,
    bottoms,
    dresses,
    shoes,
    selectedTop,
    selectedBottom,
    selectedDress,
    selectedShoe,
    pageStatus,
    toast,
  ]);
  
  // Effect to clear user photo if custom photo is toggled off
  React.useEffect(() => {
    if (!useCustomPhoto) {
      setUserPhoto(null);
    }
  }, [useCustomPhoto]);

  const handleClearWorkspace = () => {
    setUseCustomPhoto(false);
    setUserPhoto(null);
    setPosePhoto(null);
    setRace('None');
    setGender('male');
    setBodyType('fit');
    setView('front');
    setFraming('full-body');
    setBackground('Neutral Gray Studio');
    setEffect('None');
    setTops([]);
    setBottoms([]);
    setDresses([]);
    setShoes([]);
    setSelectedTop(null);
    setSelectedBottom(null);
    setSelectedDress(null);
    setSelectedShoe(null);
    
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
      isMultiple: boolean = false
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

          if (isMultiple) {
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

  const handleGenerateOutfit = () => {
    if (generationsLeft !== null && generationsLeft <= 0) {
      toast({
          variant: 'destructive',
          title: 'No Generations Left',
          description: 'Sorry, no generations left for today! Please check back tomorrow.',
      });
      return;
    }

    if (useCustomPhoto && !userPhoto) {
      toast({
        variant: 'destructive',
        title: 'Missing Photo',
        description: 'Please select a photo of yourself to use the custom model feature.',
      });
      return;
    }

    if (!useCustomPhoto && race === 'None') {
      toast({
        variant: 'destructive',
        title: 'Missing Race',
        description: 'Please select a race for the stock model.',
      });
      return;
    }
    
    if (!selectedTop && !selectedDress) {
      toast({
        variant: 'destructive',
        title: 'Missing Items',
        description: 'Please select either a top or a dress.',
      });
      return;
    }


    const topItem = tops.find(t => t.id === selectedTop);
    const bottomItem = bottoms.find(b => b.id === selectedBottom);
    const dressItem = dresses.find(d => d.id === selectedDress);
    const shoeItem = shoes.find(s => s.id === selectedShoe);

    const generationInput = {
      userPhotoDataUri: useCustomPhoto ? userPhoto?.dataUri : undefined,
      race: race,
      gender: gender,
      bodyType: bodyType,
      view: view,
      framing: framing,
      background: background,
      effect: effect,
      topClothingDataUri: dressItem ? undefined : topItem?.dataUri,
      bottomClothingDataUri: dressItem ? undefined : bottomItem?.dataUri,
      dressDataUri: dressItem?.dataUri,
      shoeDataUri: shoeItem?.dataUri,
      poseReferenceDataUri: posePhoto?.dataUri,
    };

    try {
      sessionStorage.setItem(GENERATION_INPUT_KEY, JSON.stringify(generationInput));
      router.push('/result');
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
    type: 'top' | 'bottom' | 'dress' | 'shoe' | 'user' | 'pose'
  ) => {
    if (type === 'user') setUserPhoto(null);
    else if (type === 'pose') setPosePhoto(null);
    else if (type === 'top') {
      setTops(tops.filter(item => item.id !== id));
      if (selectedTop === id) setSelectedTop(null);
    } else if (type === 'bottom') {
      setBottoms(bottoms.filter(item => item.id !== id));
      if (selectedBottom === id) setSelectedBottom(null);
    } else if (type === 'dress') {
      setDresses(dresses.filter(item => item.id !== id));
      if (selectedDress === id) setSelectedDress(null);
    } else {
      setShoes(shoes.filter(item => item.id !== id));
      if (selectedShoe === id) setSelectedShoe(null);
    }
  };

  const renderWardrobeItems = (
    items: ClothingItem[],
    selectedId: string | null,
    onSelect: (id: string) => void,
    type: 'top' | 'bottom' | 'dress' | 'shoe'
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

  const handleSelectTop = (id: string) => {
    setSelectedTop(id);
    setSelectedDress(null);
  };
  const handleSelectBottom = (id: string) => {
    setSelectedBottom(id);
    setSelectedDress(null);
  };
  const handleSelectDress = (id: string) => {
    setSelectedDress(id);
    setSelectedTop(null);
    setSelectedBottom(null);
  };

  const isReadyToGenerate = (!useCustomPhoto || userPhoto) && (selectedTop || selectedDress) && (!useCustomPhoto ? race !== 'None' : true);

  if (pageStatus === 'loading') {
    return <Onboarding onComplete={handleRestoreComplete} introOnly={true} />;
  }
  
  if (pageStatus === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex flex-col md:flex-row md:h-screen bg-background">
      <input type="file" ref={userPhotoInputRef} onChange={handleFileUpload(setUserPhoto)} accept="image/*" className="hidden" />
      <input type="file" ref={poseInputRef} onChange={handleFileUpload(setPosePhoto)} accept="image/*" className="hidden" />
      <input type="file" ref={topInputRef} onChange={handleFileUpload(setTops, true)} accept="image/*" className="hidden" multiple />
      <input type="file" ref={bottomInputRef} onChange={handleFileUpload(setBottoms, true)} accept="image/*" className="hidden" multiple />
      <input type="file" ref={dressInputRef} onChange={handleFileUpload(setDresses, true)} accept="image/*" className="hidden" multiple />
      <input type="file" ref={shoeInputRef} onChange={handleFileUpload(setShoes, true)} accept="image/*" className="hidden" multiple />

      <aside
        className="w-full md:w-96 bg-card/60 border-r flex flex-col"
      >
        <div className="sticky top-0 z-10 p-4 border-b bg-card/80 backdrop-blur-sm">
          <header className="flex justify-between items-center flex-wrap">
            <button onClick={handleHeaderClick} className="text-left group cursor-pointer mb-2 sm:mb-0">
              <h1 className="text-2xl font-bold text-foreground animate-pulse-glow">DRESSX</h1>
              <p className="text-muted-foreground">
                Your AI-powered virtual closet.
              </p>
            </button>
            <div className="flex items-center gap-2 flex-wrap justify-end">
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
          <div className="space-y-4">
            <h2 className="font-semibold">1. Your Model</h2>
            
            <div className="flex items-center space-x-2">
              <Switch id="custom-photo-switch" checked={useCustomPhoto} onCheckedChange={setUseCustomPhoto} />
              <Label htmlFor="custom-photo-switch">Use Custom Photo</Label>
            </div>

            {useCustomPhoto ? (
              userPhoto ? (
                <div className="relative group w-full aspect-[4/5] rounded-lg overflow-hidden">
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
                  className="w-full aspect-[4/5] rounded-lg border-2 border-dashed flex flex-col items-center justify-center hover:border-primary transition-colors"
                >
                  <User className="h-10 w-10 text-muted-foreground" />
                  <span className="mt-2 text-sm font-medium">Add Photo</span>
                </button>
              )
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Race</Label>
                    <Select value={race} onValueChange={(value: Race) => setRace(value)}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select race" />
                        </SelectTrigger>
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
                <div className="space-y-2">
                    <Label>Body Type</Label>
                    <Select value={bodyType} onValueChange={(value: BodyType) => setBodyType(value)}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select body type" />
                        </SelectTrigger>
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
              </div>
            )}

            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup
                value={gender}
                onValueChange={(value: 'male' | 'female') => setGender(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="r1" />
                  <Label htmlFor="r1">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="r2" />
                  <Label htmlFor="r2">Female</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>View</Label>
              <RadioGroup
                value={view}
                onValueChange={(value: 'front' | 'back') => setView(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="front" id="v1" />
                  <Label htmlFor="v1">Front View</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="back" id="v2" />
                  <Label htmlFor="v2">Back View</Label>
                </div>
              </RadioGroup>
            </div>
             <div className="space-y-2">
              <Label>Framing</Label>
              <RadioGroup
                value={framing}
                onValueChange={(value: Framing) => setFraming(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full-body" id="f1" />
                  <Label htmlFor="f1">Full Body</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="half-body" id="f2" />
                  <Label htmlFor="f2">Half Body</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="portrait" id="f3" />
                  <Label htmlFor="f3">Portrait</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-4">
              <h2 className="font-semibold">2. Scene &amp; Style</h2>
              <div className="space-y-2">
                  <Label>Background</Label>
                  <Select value={background} onValueChange={(value: Background) => setBackground(value)}>
                      <SelectTrigger>
                      <SelectValue placeholder="Select background" />
                      </SelectTrigger>
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
                  <Label>Effect</Label>
                  <Select value={effect} onValueChange={(value: Effect) => setEffect(value)}>
                      <SelectTrigger>
                      <SelectValue placeholder="Select effect" />
                      </SelectTrigger>
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


          <div className="space-y-4">
            <h2 className="font-semibold">3. Your Wardrobe</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Tops</h3>
                <Button size="sm" variant="outline" onClick={() => topInputRef.current?.click()}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              {renderWardrobeItems(tops, selectedTop, handleSelectTop, 'top')}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Bottoms</h3>
                <Button size="sm" variant="outline" onClick={() => bottomInputRef.current?.click()}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              {renderWardrobeItems(bottoms, selectedBottom, handleSelectBottom, 'bottom')}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Dresses</h3>
                <Button size="sm" variant="outline" onClick={() => dressInputRef.current?.click()}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              {renderWardrobeItems(dresses, selectedDress, handleSelectDress, 'dress')}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Shoes (Optional)</h3>
                <Button size="sm" variant="outline" onClick={() => shoeInputRef.current?.click()}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              {renderWardrobeItems(shoes, selectedShoe, setSelectedShoe, 'shoe')}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold">4. Pose Reference (Optional)</h2>
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
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 flex items-center justify-center relative">
        <motion.div
          key="placeholder"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-8 text-center max-w-lg"
        >
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
             <div className="flex flex-col items-center gap-2">
               <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                {useCustomPhoto && userPhoto ? <Image src={userPhoto.dataUri} alt="User" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <User className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />}
               </div>
               <p className="font-medium text-sm md:text-base">{useCustomPhoto ? "Your Photo" : "Model"}</p>
             </div>
             
             <div className="flex flex-col items-center gap-2">
               <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                {selectedDress ? <Image src={dresses.find(d => d.id === selectedDress)!.dataUri} alt="Dress" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : (selectedTop ? <Image src={tops.find(t => t.id === selectedTop)!.dataUri} alt="Top" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <Shirt className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />)}
               </div>
               <p className="font-medium text-sm md:text-base">{selectedDress ? 'Selected Dress' : 'Selected Top'}</p>
             </div>

             <div className="flex flex-col items-center gap-2">
               <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                 {selectedBottom ? <Image src={bottoms.find(b => b.id === selectedBottom)!.dataUri} alt="Bottom" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <div className="text-muted-foreground h-10 w-10 md:h-12 md:w-12" />}
               </div>
               <p className="font-medium text-sm md:text-base">Selected Bottom</p>
             </div>
             <div className="flex flex-col items-center gap-2 md:col-start-2">
               <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-dashed flex items-center justify-center bg-background/50 backdrop-blur-sm">
                {selectedShoe ? <Image src={shoes.find(s => s.id === selectedShoe)!.dataUri} alt="Shoes" width={128} height={128} className="rounded-full object-cover h-full w-full" /> : <Footprints className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />}
               </div>
               <p className="font-medium text-sm md:text-base">Shoes</p>
             </div>
           </div>
          <Button
            size="lg"
            onClick={handleGenerateOutfit}
            disabled={!isReadyToGenerate || generationsLeft === null || generationsLeft <= 0}
            variant="accent"
          >
            Generate Outfit <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          {!isReadyToGenerate && (
            <p className="text-sm text-muted-foreground">
              {useCustomPhoto && !userPhoto ? "Select your photo to begin." : ""}
              {!useCustomPhoto && race === 'None' ? "Please select a race to begin." : ""}
              {!selectedTop && !selectedDress ? " Select a top or dress to begin." : ""}
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

    