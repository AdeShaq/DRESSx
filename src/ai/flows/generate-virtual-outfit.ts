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

const prompt = ai.definePrompt({
  name: 'generateVirtualOutfitPrompt',
  input: {schema: GenerateVirtualOutfitInputSchema},
  output: {schema: GenerateVirtualOutfitOutputSchema},
  prompt: `You are a world-class virtual stylist and digital fashion expert. Your task is to generate a single, ultra-high-quality, 4K resolution, photorealistic image.

**Objective:**
Create a full-body image of the person from the "User Photo" wearing a complete outfit. The final image must be incredibly detailed, with cinematic lighting, and look like a professional fashion photograph.

**Source Images:**
1.  **User Photo:** {{{media url=userPhotoDataUri}}} (This is the person to be dressed. Preserve their face, body shape, and skin tone exactly as in this photo).
{{#if poseReferenceDataUri}}
2.  **Pose Reference:** {{{media url=poseReferenceDataUri}}} (The person in the final image must adopt this exact pose).
{{/if}}
3.  **Top:** {{{media url=topClothingDataUri}}} (The person must wear this top).
4.  **Bottom:** {{{media url=bottomClothingDataUri}}} (The person must wear these bottoms).
{{#if shoeDataUri}}
5.  **Shoes:** {{{media url=shoeDataUri}}} (The person must wear these shoes).
{{/if}}

**Instructions:**
1.  **Person:** The person in the generated image must be the same person from the "User Photo". Maintain all their physical characteristics: facial features, hair, body type, pose (unless a "Pose Reference" is provided), and skin tone.
{{#if modelHeight}}
2.  **Height:** The person should appear to be {{modelHeight}} tall.
{{/if}}
3.  **Outfit:** The person must be dressed in the provided top, bottoms, and shoes (if provided). The clothes should fit naturally on the person's body.
4.  **Pose:** If a "Pose Reference" image is provided, replicate the pose from that image precisely. If not, maintain the original pose from the "User Photo".
5.  **Quality & Style:**
    *   **Resolution & Detail:** The output must be of ultra-high quality (4K resolution). Every detail, from fabric texture to skin pores, should be visible and sharp.
    *   **Photorealism:** The image must be indistinguishable from a real photograph. Avoid any "AI" or "digital" look.
    *   **Lighting:** Use cinematic, dramatic, or professional studio lighting that enhances the details and creates a high-fashion mood.
    *   **Background:** Place the person in a simple, neutral, minimalist studio background (like a clean grey or white wall) to ensure the focus remains on the person and their outfit.
    *   **Consistency:** The generated person's face and body should be consistent with the input user photo. Do NOT generate random AI slop.

Generate only the single, final image.
`,
});

const generateVirtualOutfitFlow = ai.defineFlow(
  {
    name: 'generateVirtualOutfitFlow',
    inputSchema: GenerateVirtualOutfitInputSchema,
    outputSchema: GenerateVirtualOutfitOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output?.generatedOutfitDataUri) {
       const response = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: [
            {media: {url: input.userPhotoDataUri}},
            {media: {url: input.topClothingDataUri}},
            {media: {url: input.bottomClothingDataUri}},
            {
              text: `Generate a photorealistic image of the person from the first image, making them wear the top from the second image and the bottoms from the third image. It is crucial to preserve the person's original pose, body shape, and facial features. The background should be a simple, neutral studio setting to focus on the outfit.`,
            },
          ],
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
    return output;
  }
);
