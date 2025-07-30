
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Shirt, Zap, AlertTriangle, History, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface OnboardingProps {
  onComplete: () => void;
  introOnly?: boolean;
}

type OnboardingStep = 'intro' | 'welcome' | 'how' | 'history' | 'warning';

const SplitText = ({ children }: { children: string }) => {
  const letters = Array.from(children);
  return (
    <>
      {letters.map((letter, index) => (
        <motion.span
          key={`${letter}-${index}`}
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.05 }}
          className="inline-block"
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </>
  );
};

export function Onboarding({ onComplete, introOnly = false }: OnboardingProps) {
  const [step, setStep] = React.useState<OnboardingStep>('intro');

  React.useEffect(() => {
    if (step === 'intro') {
      const timer = setTimeout(() => {
        if (introOnly) {
          onComplete();
        } else {
          setStep('welcome');
        }
      }, 2500); // Duration for the intro screen
      return () => clearTimeout(timer);
    }
  }, [step, introOnly, onComplete]);

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -50, scale: 0.95, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="flex flex-col items-center justify-center text-center text-white"
          >
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter overflow-hidden mb-4">
              <SplitText>DRESSX</SplitText>
            </h1>
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 1.0, duration: 0.8 }}
              className="text-lg md:text-xl text-muted-foreground"
            >
              Your AI-powered virtual closet.
            </motion.p>
          </motion.div>
        );

      case 'welcome':
        return (
          <motion.div key="welcome" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="glassmorphic w-full max-w-md text-center">
              <CardHeader>
                <CardTitle className="text-3xl">Welcome to DRESSX</CardTitle>
                <CardDescription>The future of fashion is here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Instantly try on any clothing item from your wardrobe or a store's catalog on a photorealistic version of yourself. No more guesswork, just perfect fits.
                </p>
                <Button onClick={() => setStep('how')} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  How It Works <ArrowRight className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'how':
        return (
          <motion.div key="how" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="glassmorphic w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-3xl text-center">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 text-primary p-3 rounded-lg"><User className="h-6 w-6" /></div>
                  <div>
                    <h4 className="font-semibold">1. Choose Your Model</h4>
                    <p className="text-muted-foreground text-sm">Use our stock models, or upload your own photo.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 text-primary p-3 rounded-lg"><Shirt className="h-6 w-6" /></div>
                  <div>
                    <h4 className="font-semibold">2. Add Your Clothes</h4>
                    <p className="text-muted-foreground text-sm">Upload images of tops, bottoms, dresses, and shoes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 text-primary p-3 rounded-lg"><Zap className="h-6 w-6" /></div>
                  <div>
                    <h4 className="font-semibold">3. Generate Your Look</h4>
                    <p className="text-muted-foreground text-sm">Select an outfit and let our AI create your virtual try-on!</p>
                  </div>
                </div>
                <Button onClick={() => setStep('history')} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Next <ArrowRight className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'history':
        return (
          <motion.div key="history" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="glassmorphic w-full max-w-md text-center">
              <CardHeader>
                 <div className="mx-auto bg-blue-500/20 p-3 rounded-full mb-2">
                    <History className="h-8 w-8 text-blue-400" />
                 </div>
                <CardTitle className="text-3xl">Your 24-Hour History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground/90">
                  To keep things fresh and fast, your generated images will be stored in your history for <strong>24 hours</strong>. After that, they will be automatically cleared.
                </p>
                <p className="text-sm text-muted-foreground">
                  Be sure to download any creations you want to keep permanently!
                </p>
                <Button onClick={() => setStep('warning')} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Got It <ArrowRight className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'warning':
        return (
          <motion.div key="warning" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="glassmorphic w-full max-w-md text-center">
              <CardHeader>
                 <div className="mx-auto bg-amber-500/20 p-3 rounded-full mb-2">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                 </div>
                <CardTitle className="text-3xl">Tips & Tricks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 mt-0.5 text-amber-500 flex-shrink-0" />
                    <p className="text-foreground/90 text-sm">
                      This AI is powerful, but not perfect. It may not capture every detail of a face or pose with 100% accuracy, especially with custom photos.
                    </p>
                  </div>
                   <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 mt-0.5 text-amber-500 flex-shrink-0" />
                    <p className="text-foreground/90 text-sm">
                      If you don't love the result, try regenerating! Sometimes a second try is all it takes for the perfect look.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 mt-0.5 text-amber-500 flex-shrink-0" />
                    <p className="text-foreground/90 text-sm">
                      Multi-model generation works best when both models are wearing the same or very similar clothing items.
                    </p>
                  </div>
                <Button onClick={onComplete} size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 !mt-6">
                  Let's Go!
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
}

    