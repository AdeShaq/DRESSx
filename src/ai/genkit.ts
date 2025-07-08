import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const googleApiKey = process.env.GOOGLE_API_KEY;

if (!googleApiKey) {
  console.warn(
    'GOOGLE_API_KEY not found in environment variables. Google AI features may not work. Please add it to your .env file.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: googleApiKey,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
