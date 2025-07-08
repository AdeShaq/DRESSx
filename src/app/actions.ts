"use server";

import {
  generateVirtualOutfit,
  type GenerateVirtualOutfitInput,
  type GenerateVirtualOutfitOutput,
} from '@/ai/flows/generate-virtual-outfit';

interface GenerateActionResult {
    generatedOutfitDataUri?: string;
    error?: string;
}

export async function generateOutfitAction(
  input: GenerateVirtualOutfitInput
): Promise<GenerateActionResult> {
  try {
    const output: GenerateVirtualOutfitOutput = await generateVirtualOutfit(input);
    return { generatedOutfitDataUri: output.generatedOutfitDataUri };
  } catch (error) {
    console.error("Error generating outfit:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
          return { error: 'Your Google API key is not valid. Please ensure the key in your .env file is correct and the "Generative Language API" or "Vertex AI API" is enabled in your Google Cloud project.' };
        }
        return { error: `An error occurred during generation: ${error.message}` };
    }
    return { error: "An unknown error occurred while generating the outfit." };
  }
}
