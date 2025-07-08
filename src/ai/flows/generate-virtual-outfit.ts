
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

    promptParts.push({
      text: `You are a world-class expert in photorealistic virtual try-on. Your task is to generate one single, ultra-realistic, 4K, full-body photograph of a person wearing a specific outfit. Follow these instructions with extreme precision. Every detail matters.

**CRITICAL RULE #1: THE FRAME (NON-NEGOTIABLE)**
The final image **MUST** be a full-body shot. The model must be fully visible from head to toe, perfectly centered in the frame. **DO NOT CROP THE HEAD OR FEET. THIS IS THE MOST IMPORTANT RULE.**

**CRITICAL RULE #2: THE FACE (NON-NEGOTIABLE)**
The person in the generated image **MUST BE THE EXACT SAME PERSON** from the provided 'User Photo' below. The face, hair, and body **MUST BE IDENTICAL**. Do not change any features, expressions, or skin tone. This is the second most important rule.`
    });
    promptParts.push({media: {url: input.userPhotoDataUri}});
    
    if (input.poseReferenceDataUri) {
      promptParts.push({
        text: `\n**RULE #3: THE POSE**
The model must be in the **EXACT** pose shown in the 'Pose Reference' image below. Replicate the body position, arm and leg placement, and head angle perfectly.`
      });
      promptParts.push({media: {url: input.poseReferenceDataUri}});
    } else {
      promptParts.push({
        text: `\n**RULE #3: THE POSE**
The model must hold the **EXACT** pose from the 'User Photo' provided earlier.`
      });
    }
    
    promptParts.push({
      text: `\n**RULE #4: THE OUTFIT**
The model must wear the following clothing items exactly as they appear in the images below. Do not change the color, pattern, or style.

**Top:**`
    });
    promptParts.push({media: {url: input.topClothingDataUri}});
    
    promptParts.push({
      text: `
**Bottom:**`
    });
    promptParts.push({media: {url: input.bottomClothingDataUri}});
    
    if (input.shoeDataUri) {
      promptParts.push({
        text: `
**Shoes:**`
      });
      promptParts.push({media: {url: input.shoeDataUri}});
    }
    
    promptParts.push({
      text: `\n**FINAL IMAGE REQUIREMENTS**
- **Model Details:** The model is a ${input.gender}${input.modelHeight ? ` and is ${input.modelHeight} tall` : ''}.
- **Realism:** The final image must be indistinguishable from a real photograph. Pay attention to natural lighting and how the clothes fit on the body.
- **Background:** The background must be a plain, neutral grey studio background. There should be absolutely no other objects, props, or distractions.

Re-confirming the most critical rules:
1. The entire body, from head to toe, MUST be in the frame. No cropping.
2. The face in the output image must be IDENTICAL to the face in the user's photo.`
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
