'use server';
/**
 * @fileOverview A tool for running models on Replicate.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import Replicate from 'replicate';

export const runReplicate = ai.defineTool(
  {
    name: 'runReplicate',
    description: 'Runs a model on Replicate.',
    inputSchema: z.object({
      model: z.string().describe('The Replicate model version identifier, e.g., "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5236e7a8c6300"'),
      input: z.any().describe('The input for the model.'),
    }),
    outputSchema: z.any(),
  },
  async ({model, input}) => {
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error(
        'REPLICATE_API_TOKEN not found in environment variables. The Replicate tool will not work.'
      );
      throw new Error('The Replicate API key is missing. Please add it to your .env file to enable upscaling.');
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    try {
      console.log(`Running Replicate model: ${model}`);
      const output = await replicate.run(model as any, { input });
      return output;
    } catch (error) {
      console.error('Error running Replicate model:', error);
       if (error instanceof Error) {
        if (error.message.includes('HTTPError: 401')) {
          throw new Error('The Replicate API key is not valid. Please check the key in your .env file.');
        }
        // Re-throw a more specific error message to the client.
        throw new Error(`Replicate model failed: ${error.message}`);
      }
      throw new Error('Failed to run the Replicate upscaling model due to an unknown error.');
    }
  }
);
