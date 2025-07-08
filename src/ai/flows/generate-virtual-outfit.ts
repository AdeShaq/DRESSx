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
    // This consolidated prompt structure is more robust and less likely to cause internal server errors
    // with the image generation API, while still providing clear instructions.
    const textPrompt = `
      You are an expert virtual stylist. Your task is to generate a single, ultra-high-quality, 4K photorealistic image of a person wearing a new outfit.
      Follow these instructions precisely. The images are provided after this text.

      **1. Identity (Most Important):**
      - The generated person's face, hair, body type, and skin tone MUST be IDENTICAL to the person in the **first image (User Photo)**.
      - DO NOT change the person. This is a virtual try-on, not a new character. The likeness must be 99-100% accurate. This is the highest priority.

      **2. Pose:**
      - The person must adopt the **exact pose** from the **second image (Pose Reference)**.
      - If a pose reference image is not provided, use the original pose from the **first image (User Photo)**.

      **3. Clothing:**
      - The person must wear the **top** from the clothing image provided.
      - The person must wear the **bottoms** from the clothing image provided.
      - If **shoes** are provided, the person must wear them.

      **4. Model Details:**
      - Gender: ${input.gender}.
      - Height: ${input.modelHeight || 'not specified'}.

      **5. Final Image Quality & Composition:**
      - **Quality:** 4K resolution, photorealistic, sharp focus, cinematic lighting. It must look like a real, professional fashion photograph.
      - **Framing:** The image MUST be a full-body shot. The person must fit entirely in the frame from head to toe. Do not crop any part of the body.
      - **Background:** Use a simple, neutral, minimalist studio background (e.g., a clean grey or white wall). There must be NO other items, props, or distractions.
    `;

    const promptParts: (
      | {text: string}
      | {media: {url: string; contentType?: string}}
    )[] = [{text: textPrompt}];

    // Add images in the order specified in the prompt
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
