
"use server";

import {
  generatePhotorealisticOutfit,
  type GeneratePhotorealisticOutfitInput,
  type GeneratePhotorealisticOutfitOutput,
} from '@/ai/flows/generate-photorealistic-outfit';
import { decrementGenerationsLeft } from '@/lib/generation-service';

interface GenerateActionResult {
    generatedOutfitDataUri?: string;
    error?: string;
}

export async function generateOutfitAction({ 
    input, 
}: { 
    input: GeneratePhotorealisticOutfitInput,
}): Promise<GenerateActionResult> {
  try {
    const decrementResult = await decrementGenerationsLeft();
    if (!decrementResult.success) {
      return { error: decrementResult.error };
    }

    const output: GeneratePhotorealisticOutfitOutput = await generatePhotorealisticOutfit(input);
    
    return { 
        generatedOutfitDataUri: output.generatedOutfitDataUri,
    };

  } catch (error) {
    console.error("Error during generation:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
          return { error: 'Your Google API key is not valid. Please ensure the key in your .env file is correct and the "Generative Language API" or "Vertex AI API" is enabled in your Google Cloud project.' };
        }
        if (error.message.includes('permission-denied') || error.message.includes('PERMISSION_DENIED')) {
          return { error: 'Database permission denied. Please check your Firestore security rules to ensure they allow writes to the generation counter.' };
        }
        if (error.message.toLowerCase().includes('rate limit') || error.message.includes('429')) {
          return { error: 'The generation service is currently busy due to high traffic. Please try again in a moment.' };
        }
        return { error: `An error occurred during generation: ${error.message}` };
    }
    return { error: "An unknown error occurred while generating the outfit." };
  }
}
