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

    // Start with the main objective
    promptParts.push({
      text: `You are a world-class virtual stylist and digital fashion expert. Your task is to generate a single, ultra-high-quality, 4K resolution, photorealistic image.

**Objective:** Create a full-body image of the person from the "User Photo" wearing a complete outfit. The final image must be incredibly detailed, with cinematic lighting, and look like a professional fashion photograph. The generated person's face and body MUST be consistent with the input user photo. Do NOT generate a random AI person. This is critical.

---
**Source Images & Instructions:**
---
`,
    });

    // User Photo & Face Identity - this is the MOST critical part
    promptParts.push({
      text: `**1. User Photo & Face Identity (CRITICAL INSTRUCTION):**
The person in the generated image **MUST BE THE EXACT SAME PERSON** from the provided "User Photo" below. This is the most important instruction. You **MUST** preserve their exact facial features, expression, hair style and color, body type, and skin tone. **The generated face must be IDENTICAL to the user's photo. Do NOT change the person.** This is a virtual try-on, not a new character creation. The likeness must be 99-100% accurate.
- The person should be presented as a ${input.gender}.
${
  input.modelHeight
    ? `- Their height should appear to be ${input.modelHeight}.`
    : ''
}`,
    });
    promptParts.push({media: {url: input.userPhotoDataUri}});

    // Pose Reference
    if (input.poseReferenceDataUri) {
      promptParts.push({
        text: `
**2. Pose Reference:**
The person in the final image must adopt the **exact pose** from the following "Pose Reference" image.`,
      });
      promptParts.push({media: {url: input.poseReferenceDataUri}});
    } else {
      promptParts.push({
        text: `
**2. Pose:**
Maintain the original pose from the "User Photo" provided above.`,
      });
    }

    // Clothing
    promptParts.push({
      text: `
---
**Clothing to Wear:**
---
`,
    });

    promptParts.push({
      text: `**3. Top:** The person must wear the provided top.`,
    });
    promptParts.push({media: {url: input.topClothingDataUri}});

    promptParts.push({
      text: `**4. Bottoms:** The person must wear the provided bottoms.`,
    });
    promptParts.push({media: {url: input.bottomClothingDataUri}});

    if (input.shoeDataUri) {
      promptParts.push({
        text: `**5. Shoes:** The person must wear the provided shoes.`,
      });
      promptParts.push({media: {url: input.shoeDataUri}});
    }

    // Final Quality requirements
    promptParts.push({
      text: `
---
**Final Image Requirements:**
---
- **Resolution & Detail:** The output must be of **ultra-high quality (4K resolution)**. Every detail, from fabric texture to skin pores, should be visible and sharp. The image must be crisp with sharp focus and intricate details.
- **Photorealism:** The image must be **indistinguishable from a real photograph**. Avoid any "AI" or "digital" look. It must be hyper-realistic.
- **Lighting:** Use cinematic, dramatic, or professional studio lighting that enhances the details and creates a high-fashion mood.
- **Background:** Place the person in a simple, neutral, minimalist studio background (like a clean grey or white wall). **There must be NO other items, props, furniture, or distractions in the background.** The background should be completely plain.
- **Framing:** The image **MUST be a full-body shot**. The person must always fit entirely in the frame, from head to toe, regardless of their height or pose. **Do not crop any part of the body.**

Generate only the single, final, photorealistic image based on all these instructions.`,
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
        'Image generation failed. No media was returned from the model.'
      );
    }

    return {generatedOutfitDataUri: response.media.url};
  }
);
