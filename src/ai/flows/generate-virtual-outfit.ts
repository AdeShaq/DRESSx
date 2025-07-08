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

    promptParts.push({
      text: `You are an advanced image generation AI. Your SOLE function is to create a single photorealistic image based on a set of strict, non-negotiable directives.

**RULE 1: ABSOLUTE FACE REPLICATION (MANDATORY)**
The generated person's face MUST be an IDENTICAL, PIXEL-PERFECT replica of the face in the provided **USER_PHOTO**. There is ZERO tolerance for any alteration of facial features, structure, skin tone, or hairstyle. This is the most important rule. Failure to replicate the face exactly is a complete failure of the task.

**RULE 2: FULL-BODY COMPOSITION (MANDATORY)**
The generated image MUST be a full-body portrait, showing the person from the top of their head to the soles of their feet. NO PART of the body, especially the head, hair, or feet, may be cropped or touch the edge of the image frame. The subject must be centered with adequate space around them.

**SOURCE IMAGES:**
You will be provided with the following source images to construct the final output.
`,
    });

    promptParts.push({
      text: `\n\n**USER_PHOTO:** This is the reference for the person's face, hair, and body. The face MUST be replicated exactly.`,
    });
    promptParts.push({media: {url: input.userPhotoDataUri}});

    if (input.poseReferenceDataUri) {
      promptParts.push({
        text: `\n\n**POSE_REFERENCE:** The generated person MUST adopt this exact pose. This overrides the pose from USER_PHOTO.`,
      });
      promptParts.push({media: {url: input.poseReferenceDataUri}});
    }

    promptParts.push({
      text: `\n\n**OUTFIT_TOP:** The person must wear this exact top.`,
    });
    promptParts.push({media: {url: input.topClothingDataUri}});

    promptParts.push({
      text: `\n\n**OUTFIT_BOTTOM:** The person must wear these exact bottoms.`,
    });
    promptParts.push({media: {url: input.bottomClothingDataUri}});

    if (input.shoeDataUri) {
      promptParts.push({
        text: `\n\n**OUTFIT_SHOES:** The person must wear these exact shoes.`,
      });
      promptParts.push({media: {url: input.shoeDataUri}});
    }

    promptParts.push({
      text: `\n\n**FINAL EXECUTION COMMANDS & CRITICAL REMINDER:**
- **Model Identity:** Generate a ${input.gender}${input.modelHeight ? ` of ${input.modelHeight} height` : ''}.
- **Background:** Use a plain, solid, neutral grey studio background. No props, scenery, or other objects.
- **Image Quality:** The output must be a 4K, ultra-realistic photograph.

**REITERATING THE NON-NEGOTIABLE RULES:**
1.  **FACE IS IDENTICAL:** The generated face must be an exact match to the USER_PHOTO. NO CHANGES.
2.  **FULL BODY IN FRAME:** The entire body, from head to toe, MUST be visible and not cropped. NO EXCEPTIONS.

Generate the image now, strictly adhering to all rules.
`,
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
