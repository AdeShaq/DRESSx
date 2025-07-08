
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
    const promptParts: (
      | {text: string}
      | {media: {url: string}}
    )[] = [];

    // Main Instruction Block
    promptParts.push({ text: `You are an expert photorealistic virtual try-on AI. Your only job is to generate a single, ultra-realistic, 4K, full-body photograph of a person wearing a specific outfit. Follow these instructions perfectly.

**CRITICAL RULE #1: THE FRAME (NON-NEGOTIABLE)**
- The final image **MUST** be a full-body shot.
- The model must be fully visible from head to toe.
- **DO NOT CROP THE HEAD OR FEET. THIS IS THE MOST IMPORTANT RULE.**

**CRITICAL RULE #2: THE FACE (NON-NEGOTIABLE)**
- The person in the generated image **MUST BE THE EXACT SAME PERSON** from the 'User Photo' provided below.
- The face, hair, and all features **MUST BE IDENTICAL.** Do not change anything. This is the second most important rule.

**INSTRUCTIONS:**
You will now be given the source images. Use them to construct the final photograph.` });

    // 1. The Person (Face)
    promptParts.push({ text: `\n\n**1. User Photo (Source for Face and Body):** The face and body in your final image MUST be identical to this person.` });
    promptParts.push({ media: {url: input.userPhotoDataUri} });

    // 2. The Pose
    if (input.poseReferenceDataUri) {
      promptParts.push({ text: `\n\n**2. Pose Reference:** The model must hold the **EXACT** pose from this image.` });
      promptParts.push({ media: {url: input.poseReferenceDataUri} });
    } else {
      promptParts.push({ text: `\n\n**2. Pose Reference:** The model must hold the **EXACT** pose from the 'User Photo' provided above.` });
    }

    // 3. The Outfit
    promptParts.push({ text: `\n\n**3. The Outfit:** The model must wear these exact items.` });
    promptParts.push({ text: `\n**Top:**` });
    promptParts.push({ media: {url: input.topClothingDataUri} });
    promptParts.push({ text: `\n**Bottom:**` });
    promptParts.push({ media: {url: input.bottomClothingDataUri} });
    if (input.shoeDataUri) {
        promptParts.push({ text: `\n**Shoes:**` });
        promptParts.push({ media: {url: input.shoeDataUri} });
    }
    
    // 4. Final Details & Confirmation
    promptParts.push({ text: `\n\n**4. Final Image Requirements:**
- **Model Details:** The model is a ${input.gender}${input.modelHeight ? ` and is ${input.modelHeight} tall` : ''}.
- **Background:** The background **MUST** be a plain, neutral grey studio background. No other objects or distractions.
- **Realism:** The final image must be indistinguishable from a real photograph.

**CONFIRMATION OF CRITICAL RULES:**
1. Is the final image a **full-body shot** with head and feet fully visible? YES.
2. Is the face **identical** to the face in the 'User Photo'? YES.`
    });

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!response.media?.url) {
      throw new Error(
        'Image generation failed. No media was returned from the model. ' +
          (response.text || '')
      );
    }

    return {generatedOutfitDataUri: response.media.url};
  }
);
