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
    const promptParts: ({text: string} | {media: {url: string}})[] = [];

    // Main Instruction Block
    promptParts.push({
      text: `You are a state-of-the-art virtual try-on system. Your task is to create a single, photorealistic, full-body image of a person wearing a specific outfit. Adherence to the following rules is mandatory and non-negotiable.

**PRIMARY DIRECTIVE: FACE IDENTITY**
The face in the generated image must be an EXACT replica of the face in the "USER_PHOTO". No changes to facial features, structure, skin tone, or hairstyle are permitted. This is the most critical instruction.

**SECONDARY DIRECTIVE: IMAGE COMPOSITION**
The generated image must be a FULL-BODY shot, from head to toe. No part of the model's head, hair, or feet may be cropped or cut off by the image frame. The subject must be centered.

You will be provided with the following source images.
`,
    });

    // SOURCE IMAGE 1: USER_PHOTO
    promptParts.push({
      text: `\n\n**SOURCE IMAGE 1: USER_PHOTO**\nThis image provides the person's face, body, and (unless overridden by a pose reference) the pose.`,
    });
    promptParts.push({media: {url: input.userPhotoDataUri}});

    // SOURCE IMAGE 2: POSE_REFERENCE (if provided)
    if (input.poseReferenceDataUri) {
      promptParts.push({
        text: `\n\n**SOURCE IMAGE 2: POSE_REFERENCE**\nThe person in the final image must adopt this exact pose.`,
      });
      promptParts.push({media: {url: input.poseReferenceDataUri}});
    }

    // SOURCE IMAGE 3: OUTFIT_TOP
    promptParts.push({
      text: `\n\n**SOURCE IMAGE 3: OUTFIT_TOP**\nThe person must wear this exact top.`,
    });
    promptParts.push({media: {url: input.topClothingDataUri}});

    // SOURCE IMAGE 4: OUTFIT_BOTTOM
    promptParts.push({
      text: `\n\n**SOURCE IMAGE 4: OUTFIT_BOTTOM**\nThe person must wear these exact bottoms.`,
    });
    promptParts.push({media: {url: input.bottomClothingDataUri}});

    // SOURCE IMAGE 5: OUTFIT_SHOES (if provided)
    if (input.shoeDataUri) {
      promptParts.push({
        text: `\n\n**SOURCE IMAGE 5: OUTFIT_SHOES**\nThe person must wear these exact shoes.`,
      });
      promptParts.push({media: {url: input.shoeDataUri}});
    }

    // Final Execution Parameters & Confirmation
    promptParts.push({
      text: `\n\n**FINAL EXECUTION PARAMETERS:**
- **Model Identity:** A ${input.gender}${input.modelHeight ? ` who is ${input.modelHeight} tall` : ''}.
- **Background:** Solid, neutral grey studio background. No other objects or scenery.
- **Quality:** 4K, ultra-realistic photograph.
- **AVOID:** Do not change the face. Do not crop the image. Do not generate a different person.

**PRE-GENERATION CHECKLIST (Confirm YES):**
1. Is the face identical to USER_PHOTO? YES.
2. Is the pose identical to the pose reference (or USER_PHOTO if no reference is given)? YES.
3. Is it a full-body shot with no cropping of head or feet? YES.

Generate the image now.`,
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
