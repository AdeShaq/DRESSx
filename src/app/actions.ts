"use server";

import {
  generateVirtualOutfit,
  type GenerateVirtualOutfitInput,
  type GenerateVirtualOutfitOutput,
} from '@/ai/flows/generate-virtual-outfit';
import {
    upscaleImage,
    type UpscaleImageInput,
    type UpscaleImageOutput,
} from '@/ai/flows/upscale-image';

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

interface UpscaleActionResult {
    upscaledImageDataUri?: string;
    error?: string;
}

export async function upscaleImageAction(
  input: UpscaleImageInput
): Promise<UpscaleActionResult> {
  try {
    const output: UpscaleImageOutput = await upscaleImage(input);
    return { upscaledImageDataUri: output.upscaledImageDataUri };
  } catch (error) {
    console.error("Error upscaling image:", error);
     if (error instanceof Error) {
        return { error: `An error occurred during upscaling: ${error.message}` };
    }
    return { error: "An unknown error occurred while upscaling the image." };
  }
}
