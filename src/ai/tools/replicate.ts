'use server';
/**
 * @fileOverview A tool for running models on Replicate.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import Replicate from 'replicate';

if (!process.env.REPLICATE_API_TOKEN) {
  console.warn(
    'REPLICATE_API_TOKEN not found in environment variables. The Replicate tool will not work. Please add it to your .env file.'
  );
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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
    try {
      console.log(`Running Replicate model: ${model}`);
      const output = await replicate.run(model as any, { input });
      return output;
    } catch (error) {
      console.error('Error running Replicate model:', error);
      throw new Error('Failed to run Replicate model.');
    }
  }
);
