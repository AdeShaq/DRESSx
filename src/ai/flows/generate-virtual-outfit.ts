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
      | {media: {url: string; contentType?: string}}
    )[] = [];
    const textParts: string[] = [];

    // Main objective
    textParts.push(
      'You are a world-class virtual stylist and digital fashion expert. Your task is to generate a single, ultra-high-quality, 4K resolution, photorealistic image.'
    );
    textParts.push(
      '**Objective:** Create a full-body image of the person from the "User Photo" wearing a complete outfit. The final image must be incredibly detailed, with cinematic lighting, and look like a professional fashion photograph.'
    );

    // Source Images & Instructions
    textParts.push('**Source Images & Instructions:**');

    // 1. User Photo
    promptParts.push({media: {url: input.userPhotoDataUri}});
    textParts.push(
      `1. **Person:** The person in the generated image must be the same person from the provided "User Photo" (the first image), presented as a ${input.gender}. Maintain all their physical characteristics: facial features, hair, body type, and skin tone.`
    );

    // 2. Pose Reference
    if (input.poseReferenceDataUri) {
      promptParts.push({media: {url: input.poseReferenceDataUri}});
      textParts.push(
        '2. **Pose:** The person in the final image must adopt the exact pose from the "Pose Reference" image.'
      );
    } else {
      textParts.push(
        '2. **Pose:** Maintain the original pose from the "User Photo".'
      );
    }

    // 3. Top
    promptParts.push({media: {url: input.topClothingDataUri}});
    textParts.push('3. **Top:** The person must wear the provided top.');

    // 4. Bottom
    promptParts.push({media: {url: input.bottomClothingDataUri}});
    textParts.push('4. **Bottoms:** The person must wear the provided bottoms.');

    // 5. Shoes
    if (input.shoeDataUri) {
      promptParts.push({media: {url: input.shoeDataUri}});
      textParts.push('5. **Shoes:** The person must wear the provided shoes.');
    }

    // Additional Details
    if (input.modelHeight) {
      textParts.push(
        `**Height:** The person should appear to be ${input.modelHeight} tall.`
      );
    }

    // Quality requirements
    textParts.push('**Quality & Style:**');
    textParts.push(
      '- **Resolution & Detail:** The output must be of ultra-high quality (4K resolution). Every detail, from fabric texture to skin pores, should be visible and sharp. The image must be crisp with sharp focus and intricate details.'
    );
    textParts.push(
      '- **Photorealism:** The image must be indistinguishable from a real photograph. Avoid any "AI" or "digital" look. It must be highly realistic.'
    );
    textParts.push(
      '- **Lighting:** Use cinematic, dramatic, or professional studio lighting that enhances the details and creates a high-fashion mood.'
    );
    textParts.push(
      '- **Background:** Place the person in a simple, neutral, minimalist studio background (like a clean grey or white wall). There must be NO other items, props, furniture, or distractions in the background. The background should be completely plain.'
    );
    textParts.push(
      '- **Framing:** The image must be a full-body shot. The person must always fit entirely in the frame, from head to toe, regardless of their height or pose. Do not crop any part of the body.'
    );
    textParts.push(
      "- **Consistency:** The generated person's face and body should be consistent with the input user photo. Do NOT generate random AI slop."
    );

    // Final instruction
    textParts.push(
      'Generate only the single, final image based on all these instructions.'
    );

    promptParts.push({text: textParts.join('\n\n')});

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!response.media?.url) {
      throw new Error(
        'Image generation failed. No media was returned from the model.'
      );
    }

    return {generatedOutfitDataUri: response.media.url};
  }
);
