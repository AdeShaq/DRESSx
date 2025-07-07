"use server";

import {
  generateVirtualOutfit,
  type GenerateVirtualOutfitInput,
  type GenerateVirtualOutfitOutput,
} from '@/ai/flows/generate-virtual-outfit';

interface ActionResult {
    generatedOutfitDataUri?: string;
    error?: string;
}

export async function generateOutfitAction(
  input: GenerateVirtualOutfitInput
): Promise<ActionResult> {
  try {
    const output: GenerateVirtualOutfitOutput = await generateVirtualOutfit(input);
    return { generatedOutfitDataUri: output.generatedOutfitDataUri };
  } catch (error) {
    console.error("Error generating outfit:", error);
    // It's better to return a generic error message to the client
    // for security reasons, unless you want to expose specific error details.
    if (error instanceof Error) {
        return { error: `An error occurred: ${error.message}` };
    }
    return { error: "An unknown error occurred while generating the outfit." };
  }
}
