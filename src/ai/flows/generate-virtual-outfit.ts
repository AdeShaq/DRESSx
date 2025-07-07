'use server';
/**
 * @fileOverview Generates a photorealistic image of the user wearing the selected outfit.
 *
 * - generateVirtualOutfit - A function that generates the virtual outfit.
 * - GenerateVirtualOutfitInput - The input type for the generateVirtualOutfit function.
 * - GenerateVirtualOutfitOutput - The return type for the generateVirtualOutfit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVirtualOutfitInputSchema = z.object({
  userPhotoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  topClothingDataUri: z
    .string()
    .describe(
      "A photo of the top clothing item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  bottomClothingDataUri: z
    .string()
    .describe(
      "A photo of the bottom clothing item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateVirtualOutfitInput = z.infer<typeof GenerateVirtualOutfitInputSchema>;

const GenerateVirtualOutfitOutputSchema = z.object({
  generatedOutfitDataUri: z
    .string()
    .describe("The generated outfit image, as a data URI."),
});
export type GenerateVirtualOutfitOutput = z.infer<typeof GenerateVirtualOutfitOutputSchema>;

export async function generateVirtualOutfit(
  input: GenerateVirtualOutfitInput
): Promise<GenerateVirtualOutfitOutput> {
  return generateVirtualOutfitFlow(input);
}

const generateVirtualOutfitFlow = ai.defineFlow(
  {
    name: 'generateVirtualOutfitFlow',
    inputSchema: GenerateVirtualOutfitInputSchema,
    outputSchema: GenerateVirtualOutfitOutputSchema,
  },
  async input => {
    // Call replicate to generate the virtual outfit
    const replicateResponse = await ai.generate({
      model: 'cuuupid/idm-vton',
      prompt: [
        {media: {url: input.userPhotoDataUri}},
        {
          text: ' wearing the following outfit. Top: ',
        },
        {media: {url: input.topClothingDataUri}},
        {
          text: 'Bottom: ',
        },
        {media: {url: input.bottomClothingDataUri}},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    return {generatedOutfitDataUri: replicateResponse.media.url!};
  }
);
