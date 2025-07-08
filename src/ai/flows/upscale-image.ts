'use server';
/**
 * @fileOverview Upscales an image using a Replicate model.
 *
 * - upscaleImage - A function that handles the image upscaling process.
 * - UpscaleImageInput - The input type for the upscaleImage function.
 * - UpscaleImageOutput - The return type for the upscaleImage function.
 */

import {ai} from '@/ai/genkit';
import {runReplicate} from '@/ai/tools/replicate';
import {z} from 'zod';

const UpscaleImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of the image to upscale, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type UpscaleImageInput = z.infer<typeof UpscaleImageInputSchema>;

const UpscaleImageOutputSchema = z.object({
  upscaledImageDataUri: z
    .string()
    .describe('The upscaled image, as a data URI.'),
});
export type UpscaleImageOutput = z.infer<typeof UpscaleImageOutputSchema>;

export async function upscaleImage(
  input: UpscaleImageInput
): Promise<UpscaleImageOutput> {
  return upscaleImageFlow(input);
}

const upscaleImageFlow = ai.defineFlow(
  {
    name: 'upscaleImageFlow',
    inputSchema: UpscaleImageInputSchema,
    outputSchema: UpscaleImageOutputSchema,
  },
  async input => {
    // The Replicate `run` function can accept a data URI directly.
    const upscaledImageUrl = (await runReplicate({
      model:
        'xinntao/realesrgan:b0515207399fb183b639e4a3c1f6a1529124a87ec1f02c611754cc2401830132',
      input: {
        img: input.imageDataUri,
        scale: 2,
      },
    })) as string;

    if (!upscaledImageUrl) {
      throw new Error('Upscaling failed to return an image URL.');
    }

    // The result from replicate is a URL. We need to fetch it and convert it to a data URI
    // so it can be sent back to the client and displayed.
    try {
      const response = await fetch(upscaledImageUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch upscaled image from URL: ${upscaledImageUrl}`
        );
      }
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/png';
      const base64String = Buffer.from(buffer).toString('base64');
      const dataUri = `data:${contentType};base64,${base64String}`;

      return {upscaledImageDataUri: dataUri};
    } catch (error) {
      console.error('Error converting upscaled image URL to data URI:', error);
      throw new Error('Failed to process the upscaled image from Replicate.');
    }
  }
);
