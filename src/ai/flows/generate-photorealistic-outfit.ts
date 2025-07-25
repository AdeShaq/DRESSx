
'use server';
/**
 * @fileOverview Generates a photorealistic image of a user wearing a specified outfit.
 *
 * - generatePhotorealisticOutfit - A function that handles the outfit generation.
 * - GeneratePhotorealisticOutfitInput - The input type for the function.
 * - GeneratePhotorealisticOutfitOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GeneratePhotorealisticOutfitInputSchema = z.object({
  userPhotoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is optional."
    ),
  race: z
    .enum(['None', 'Black American', 'Black', 'Asian', 'Indian', 'White'])
    .describe(
      'The race of the person to generate, used if no user photo is provided.'
    ),
  gender: z
    .enum(['male', 'female'])
    .describe('The gender of the person to generate.'),
  bodyType: z
    .enum(['fat', 'chubby', 'slim', 'fit', 'muscular', 'model', 'bulky', 'shredded'])
    .describe(
      'The body type of the person to generate, used if no user photo is provided.'
    ),
  view: z
    .enum(['front', 'back'])
    .describe('The view of the person to generate (front or back).'),
  framing: z
    .enum(['full-body', 'half-body', 'portrait'])
    .describe('The framing of the generated image.'),
  background: z
    .enum([
      'Neutral Gray Studio',
      'Black Studio',
      'Outdoor City Street',
      'Beach Sunset',
      'Forest Path',
      'Cozy Cafe',
      'Urban Rooftop',
      'Minimalist White Room',
      'Vibrant Graffiti Wall',
    ])
    .describe('The background scene for the generated image.'),
  effect: z
    .enum([
      'None',
      'Movie-Like',
      'Golden Hour',
      'Dreamy',
      'VHS',
      'Black & White',
      'Sepia Tone',
      'High Contrast',
      'Infrared Glow',
    ])
    .describe('The photographic effect to apply to the final image.'),
  topClothingDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the top clothing item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  bottomClothingDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the bottom clothing item, as a a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  dressDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of a dress, as a a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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
});
export type GeneratePhotorealisticOutfitInput = z.infer<
  typeof GeneratePhotorealisticOutfitInputSchema
>;

const GeneratePhotorealisticOutfitOutputSchema = z.object({
  generatedOutfitDataUri: z
    .string()
    .describe('The generated outfit image, as a data URI.'),
});
export type GeneratePhotorealisticOutfitOutput = z.infer<
  typeof GeneratePhotorealisticOutfitOutputSchema
>;

export async function generatePhotorealisticOutfit(
  input: GeneratePhotorealisticOutfitInput
): Promise<GeneratePhotorealisticOutfitOutput> {
  return generatePhotorealisticOutfitFlow(input);
}

const generatePhotorealisticOutfitFlow = ai.defineFlow(
  {
    name: 'generatePhotorealisticOutfitFlow',
    inputSchema: GeneratePhotorealisticOutfitInputSchema,
    outputSchema: GeneratePhotorealisticOutfitOutputSchema,
  },
  async input => {
    if (!input.topClothingDataUri && !input.dressDataUri) {
      throw new Error('Generation requires either a top or a dress.');
    }

    const promptParts: ({text: string} | {media: {url: string}})[] = [];
    let promptText = `You are a photorealistic image generation AI. Your only job is to follow the user's instructions to the letter without failure or hallucination. Do not invent, add, or change any detail that is not explicitly requested. You must render all user inputs exactly as they are provided.

`;

    const framingMap = {
      'full-body': 'a single, new, full-body, photorealistic image',
      'half-body':
        'a single, new, waist-up, half-body, photorealistic image. The image must be cropped from the waist up. Do not show the legs or feet.',
      portrait: 'a single, new, head-and-shoulders, photorealistic portrait',
    };
    const framingInstruction = framingMap[input.framing];

    // Conditional prompt based on whether a user photo is provided
    if (input.userPhotoDataUri) {
      // Mode 1: Custom user photo
      promptParts.push({media: {url: input.userPhotoDataUri}});
      promptText += `Generate ${framingInstruction} of this person.
- The person's face, hair, and body must exactly match the person in the first image provided. This is the most important instruction.
- The clothes they are wearing MUST be an exact, photorealistic recreation of the provided CLOTHING_ITEM images. Do not alter the style, color, or texture. The clothes should conform to the body and pose naturally, with realistic lighting, shadows, and fabric texture. Do not just paste the clothing items on top.
- The generated person must be fully in frame according to the framing instruction: ${input.framing}.`;

      if (input.view === 'back') {
        promptText = `You are a photorealistic image generation AI. Your only job is to follow the user's instructions to the letter without failure or hallucination. Do not invent, add, or change any detail that is not explicitly requested. You must render all user inputs exactly as they are provided.

Generate ${framingInstruction} of the BACK VIEW of this person.
- The person's face must not be visible. The hair and body type must match the person in the first image.
- The clothes they are wearing MUST be an exact, photorealistic recreation of the provided CLOTHING_ITEM images, seen from the back. The clothes should conform to the body and pose naturally.
- The generated person must be fully in frame according to the framing instruction: ${input.framing}.`;
      }
    } else {
      // Mode 2: Stock model based on descriptors
      const raceForPrompt = input.race === 'None' ? 'White' : input.race;
      promptText += `The most important instruction is to generate a model with a ${input.bodyType} body. If the generated model does not have a ${input.bodyType} body, the entire generation is a failure.
Generate ${framingInstruction} of a ${input.gender} model.
- The model MUST be of ${raceForPrompt} descent.
- The model's body type MUST BE: ${input.bodyType}. This is a strict requirement.
- The clothes they are wearing MUST be an exact, photorealistic recreation of the provided CLOTHING_ITEM images. Do not alter the style, color, or texture. If a 2D mockup is provided, convert it to a photorealistic garment on the model, conforming to the body shape and pose with realistic lighting, shadows, and fabric texture.
- The generated person must be fully in frame according to the framing instruction: ${input.framing}.`;

      if (input.view === 'back') {
        promptText = `You are a photorealistic image generation AI. Your only job is to follow the user's instructions to the letter without failure or hallucination. Do not invent, add, or change any detail that is not explicitly requested. You must render all user inputs exactly as they are provided.

The most important instruction is to generate a model with a ${input.bodyType} body. If the generated model does not have a ${input.bodyType} body, the entire generation is a failure.
Generate ${framingInstruction} of the BACK VIEW of a ${input.gender} model.
- The model MUST be of ${raceForPrompt} descent.
- The model's body type MUST BE: ${input.bodyType}. This is a strict requirement.
- The face must not be visible.
- The clothes they are wearing MUST be an exact, photorealistic recreation of the provided CLOTHING_ITEM images, seen from the back. The clothes must be rendered as real garments on the model, conforming to the body shape and pose naturally.
- The generated person must be fully in frame according to the framing instruction: ${input.framing}.`;
      }
    }

    if (input.poseReferenceDataUri) {
      promptText +=
        "\n- The person's pose MUST EXACTLY MATCH the pose in the provided POSE_REFERENCE image. This is a critical instruction. Do not improvise or alter the pose.";
    }

    let backgroundInstruction = `The background MUST be: ${input.background}.`;
    if (input.background === 'Black Studio') {
      backgroundInstruction += ' Use superb, dramatic, high-contrast facial portrait lighting.'
    }
    promptText += `\n- ${backgroundInstruction}`;
    promptText += `\n- The lighting on the model and clothing MUST be extraordinary, dramatic, and photorealistic, appropriate for the scene.`;

    if (input.effect !== 'None') {
        let effectDescription = '';
        switch (input.effect) {
            case 'Movie-Like':
                effectDescription = 'Apply a cinematic, movie-like color grade with slightly desaturated tones and high contrast, similar to a modern film still.';
                break;
            case 'Golden Hour':
                effectDescription = 'Apply a warm, golden hour lighting effect, with long soft shadows and a bright, ethereal glow.';
                break;
            case 'Dreamy':
                effectDescription = 'Apply a dreamy, soft-focus effect with a gentle bloom and slightly hazy, magical atmosphere.';
                break;
            case 'VHS':
                effectDescription = 'Apply a retro VHS effect, including subtle scan lines, slight color bleeding, and a soft, analog feel.';
                break;
            case 'Black & White':
                effectDescription = 'Apply a classic, high-contrast black and white filter. Ensure deep blacks and bright whites.';
                break;
            case 'Sepia Tone':
                effectDescription = 'Apply a warm, brownish sepia tone for a vintage, old-photograph look.';
                break;
            case 'High Contrast':
                effectDescription = 'Apply a high-contrast, vivid effect that makes colors pop and deepens shadows, almost like a "vibrant" filter.';
                break;
            case 'Infrared Glow':
                effectDescription = 'Apply a surreal, ethereal infrared photography effect, where foliage might look white and skies are dramatic.';
                break;
        }
        promptText += `\n- The final image MUST have a post-processing effect applied. The effect is: ${effectDescription}`;
    }


    promptParts.push({text: promptText});

    // Clothing and Pose assets
    if (input.dressDataUri) {
      promptParts.push({text: '\nCLOTHING_ITEM:'});
      promptParts.push({media: {url: input.dressDataUri}});
    } else {
      if (input.topClothingDataUri) {
        promptParts.push({text: '\nCLOTHING_ITEM (TOP):'});
        promptParts.push({media: {url: input.topClothingDataUri}});
      }
      if (input.bottomClothingDataUri) {
        promptParts.push({text: '\nCLOTHING_ITEM (BOTTOM):'});
        promptParts.push({media: {url: input.bottomClothingDataUri}});
      }
    }

    if (input.shoeDataUri) {
      promptParts.push({text: '\nCLOTHING_ITEM (SHOES):'});
      promptParts.push({media: {url: input.shoeDataUri}});
    }

    if (input.poseReferenceDataUri) {
      promptParts.push({text: '\nPOSE_REFERENCE:'});
      promptParts.push({media: {url: input.poseReferenceDataUri}});
    }

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
