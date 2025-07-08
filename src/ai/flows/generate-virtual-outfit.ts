
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
      "A photo of the bottom clothing item, as a a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  shoeDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the shoes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  poseReferenceDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of a person in a desired pose, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  modelHeight: z
    .string()
    .optional()
    .describe('The height of the model, e.g., "5\'10\\"".'),
  gender: z
    .enum(['male', 'female'])
    .describe('The gender of the model to be generated.'),
});
export type GenerateVirtualOutfitInput = z.infer<
  typeof GenerateVirtualOutfitInputSchema
>;

const GenerateVirtualOutfitOutputSchema = z.object({
  generatedOutfitDataUri: z
    .string()
    .describe('The generated outfit image, as a data URI.'),
});
export type GenerateVirtualOutfitOutput = z.infer<
  typeof GenerateVirtualOutfitOutputSchema
>;

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
    // This simplified prompt is more direct and less likely to cause internal server errors.
    const textPrompt = `You are a virtual fashion expert. Create one ultra-realistic, 4K, full-body photograph of a model.

**CRITICAL INSTRUCTIONS:**
- **FACE & BODY:** The model's face, hair, and body must be IDENTICAL to the person in the *first image* (the user's photo). This is the most important rule.
- **POSE:** The model must be in the EXACT pose shown in the *second image* (the pose reference). If no pose reference is given, use the pose from the user's photo.
- **CLOTHING:** The model must wear the provided top, bottom, and shoe garments.
- **BACKGROUND:** The background must be a simple, neutral studio setting. There should be nothing else in the image.
- **DETAILS:** The model is ${input.gender}${input.modelHeight ? `, ${input.modelHeight} tall` : ''}.
`;

    const promptParts: (
      | {text: string}
      | {media: {url: string; contentType?: string}}
    )[] = [{text: textPrompt}];

    // The order of images is critical and must match the prompt's references (first image, second image, etc.).
    promptParts.push({media: {url: input.userPhotoDataUri}});

    if (input.poseReferenceDataUri) {
      promptParts.push({media: {url: input.poseReferenceDataUri}});
    }

    promptParts.push({media: {url: input.topClothingDataUri}});
    promptParts.push({media: {url: input.bottomClothingDataUri}});

    if (input.shoeDataUri) {
      promptParts.push({media: {url: input.shoeDataUri}});
    }

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!response.media?.url) {
      throw new Error(
        'Image generation failed. No media was returned from the model. ' + (response.text || '')
      );
    }

    return {generatedOutfitDataUri: response.media.url};
  }
);
