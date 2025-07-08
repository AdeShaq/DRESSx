'use server';
/**
 * @fileOverview Upscales an image using a Replicate model.
 *
 * - upscaleImage - A function that handles the image upscaling process.
 * - UpscaleImageInput - The input type for the upscaleImage function.
 * - UpscaleImageOutput - The return type for the upscaleImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {runReplicate} from '../tools/replicate';

const UpscaleImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image to upscale, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type UpscaleImageInput = z.infer<typeof UpscaleImageInputSchema>;

const UpscaleImageOutputSchema = z.object({
  upscaledImageDataUri: z
    .string()
    .describe('The upscaled image, as a data URI.'),
});
export type UpscaleImageOutput = z.infer<typeof UpscaleImageOutputSchema>;

export async function upscaleImage(input: UpscaleImageInput): Promise<UpscaleImageOutput> {
  return upscaleImageFlow(input);
}

const upscaleImageFlow = ai.defineFlow(
  {
    name: 'upscaleImageFlow',
    inputSchema: UpscaleImageInputSchema,
    outputSchema: UpscaleImageOutputSchema,
    tools: [runReplicate],
  },
  async ({imageDataUri}) => {
    const upscaleResult = await runReplicate({
      model:
        'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5236e7a8c6300', // Switched to a more stable model
      input: {
        image: imageDataUri, // This model uses 'image' as the input parameter
        scale: 4, // upscale 4x
      },
    });

    if (!upscaleResult || typeof upscaleResult !== 'string') {
      throw new Error('Image upscaling failed or returned an invalid format.');
    }

    // The result from Replicate is a URL, so we need to fetch it and convert to a data URI.
    try {
      const response = await fetch(upscaleResult);
      if (!response.ok) {
        throw new Error(`Failed to fetch upscaled image from URL: ${response.statusText}`);
      }
      const imageBuffer = await response.arrayBuffer();
      const mimeType = response.headers.get('content-type') || 'image/png';
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      return {upscaledImageDataUri: dataUri};
    } catch (error) {
      console.error("Error converting upscaled image URL to data URI:", error);
      throw new Error('Failed to process the upscaled image.');
    }
  }
);
