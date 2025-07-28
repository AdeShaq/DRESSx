
'use server';
/**
 * @fileOverview Generates a photorealistic image of one or more models wearing specified outfits.
 *
 * - generatePhotorealisticOutfit - A function that handles the outfit generation.
 * - GeneratePhotorealisticOutfitInput - The input type for the function.
 * - GeneratePhotorealisticOutfitOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ModelConfigurationSchema = z.object({
  race: z
    .enum(['None', 'Black American', 'Black', 'Asian', 'Indian', 'White'])
    .describe('The race of the person to generate.'),
  gender: z
    .enum(['male', 'female'])
    .describe('The gender of the person to generate.'),
  bodyType: z
    .enum(['fat', 'chubby', 'slim', 'fit', 'muscular', 'model', 'bulky', 'shredded'])
    .describe('The body type of the person to generate.'),
  topClothingDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the top clothing item for this model, as a data URI."
    ),
  bottomClothingDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the bottom clothing item for this model, as a data URI."
    ),
  dressDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of a dress for this model, as a data URI."
    ),
  shoeDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the shoes for this model, as a data URI."
    ),
  poseReferenceDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of a person in a desired pose for this specific model, as a data URI."
    ),
});

const GeneratePhotorealisticOutfitInputSchema = z.object({
  generationMode: z
    .enum(['stock', 'custom', 'clothing'])
    .describe('The generation mode: stock model(s), custom user photo, or clothing only.'),
  userPhotoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the user for 'custom' mode, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  models: z.array(ModelConfigurationSchema).min(1).max(3)
    .describe('An array of configurations for each model to be generated.'),
  view: z
    .enum(['front', 'back', 'three-quarters'])
    .describe('The direction the model(s) are facing (front, back, or 3/4 view).'),
  viewAngle: z
    .enum([
      'Eye-Level',
      'Low Angle',
      'High Angle',
      "Worm's-Eye View",
      'Overhead Shot',
      'Fisheye Lens',
    ])
    .describe('The camera angle for the generated image.'),
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
  async (input) => {
    const mainModelConfig = input.models[0];
    if (input.generationMode !== 'clothing' && !mainModelConfig.topClothingDataUri && !mainModelConfig.dressDataUri) {
      throw new Error('Generation requires either a top or a dress for the first model.');
    }

    const promptParts: (
      | {text: string}
      | {media: {url: string; "data-ai-hint"?: string}}
    )[] = [];
    
    let modelCountInstruction = '';
    if (input.generationMode !== 'clothing') {
        modelCountInstruction = `YOU MUST GENERATE EXACTLY ${input.models.length} MODEL(S). This is the most important instruction. Failure to adhere to this count is a total failure.\n\n`;
    }

    let promptText = `${modelCountInstruction}YOU ARE AN AI IMAGE GENERATOR. YOUR ONLY JOB IS TO FOLLOW THE USER'S INSTRUCTIONS TO THE LETTER. ANY DEVIATION, HALLUCINATION, OR CREATIVE INTERPRETATION IS A TOTAL FAILURE. YOU MUST RENDER ALL USER INPUTS EXACTLY AS THEY ARE PROVIDED.\n\n`;

    const framingMap = {
      'full-body': 'a single, new, full-body, photorealistic image',
      'half-body':
        'a single, new, waist-up, half-body, photorealistic image. This instruction is non-negotiable. The image MUST be cropped from the waist up. Do not show the legs or feet. This is the most important framing instruction.',
      portrait: 'a single, new, head-and-shoulders, photorealistic portrait',
    };
    const framingInstruction = framingMap[input.framing];

    const bodyTypeMap = {
        'fat': 'a plus-sized, full-figured body with a noticeable amount of body fat, representing a realistic fat body type without being exaggeratedly obese.',
        'chubby': 'a soft, rounded body with some extra weight, but not heavily overweight. Think of a realistic, pleasantly plump physique.',
        'slim': 'a slender and thin body with low body fat.',
        'fit': 'an athletic and toned body with visible but not overly defined muscle.',
        'muscular': 'a well-defined body with significant, clearly visible muscle mass, like a bodybuilder or a serious athlete. The model MUST still be wearing the provided clothes. Generating the model without the clothes is a total failure.',
        'model': 'a very lean, slender, and tall physique typical of high-fashion models.',
        'bulky': 'a large, heavy-set body with a combination of muscle and fat.',
        'shredded': 'an extremely low body fat physique where muscles are highly defined, separated, and vascular. This is a very lean, athletic look. The model MUST still be wearing the provided clothes. Generating the model without the clothes is a total failure.',
    };
    
    const viewAngleMap = {
        'Eye-Level': 'The photo must be taken from a standard, neutral eye-level camera angle. This is a non-negotiable instruction.',
        'Low Angle': 'The photo must be taken from a dramatic low angle, looking up at the subject(s) to make them appear powerful and tall. This is a non-negotiable instruction.',
        'High Angle': 'The photo must be taken from a high angle, looking down at the subject(s), making them appear smaller. This is a non-negotiable instruction.',
        "Worm's-Eye View": "The photo must be taken from an extreme low angle, as if the camera is on the ground looking straight up. This is a highly dramatic, perspective-distorting shot. This is a non-negotiable instruction.",
        'Overhead Shot': 'The photo must be taken from directly above the subject(s), looking straight down, as if from the ceiling. They should be looking up towards the camera. This is a non-negotiable instruction.',
        'Fisheye Lens': 'The photo must be shot with an ultra-wide, fisheye lens, creating a signature convex, non-rectilinear distortion. The center of the image should bulge outwards. This is a non-negotiable instruction.',
    };
    const viewAngleInstruction = viewAngleMap[input.viewAngle];

    const viewDirectionMap = {
        'front': 'The model(s) must be facing the camera, showing their front.',
        'back': 'The model(s) must be turned away from the camera, showing their back. No faces should be visible.',
        'three-quarters': 'The model(s) must be angled at a three-quarters view, halfway between a front-on shot and a profile shot. This is a classic portrait angle.',
    };
    const viewDirectionInstruction = viewDirectionMap[input.view];

    if (input.generationMode === 'clothing') {
        promptText += `Generate a single, new, photorealistic image of clothing items for a fashion catalog. DO NOT include any humans, models, or mannequins. The clothing should be the only focus.
- The image must feature a photorealistic recreation of the provided CLOTHING_ITEM images. This is the most important instruction. Do not alter the style, color, or texture.
- The clothing should be arranged in a visually appealing "flat lay" composition, as if neatly laid out on a surface for a product photograph.
- The lighting should be professional and even, highlighting the texture and details of the fabric.`;
        promptParts.push({ text: promptText });
        const firstModel = input.models[0];
        // For clothing mode, we just use the first model's clothes
        if (firstModel.dressDataUri) {
          promptParts.push({text: '\nCLOTHING_ITEM:'});
          promptParts.push({media: {url: firstModel.dressDataUri}});
        } else {
          if (firstModel.topClothingDataUri) {
            promptParts.push({text: '\nCLOTHING_ITEM (TOP):'});
            promptParts.push({media: {url: firstModel.topClothingDataUri}});
          }
          if (firstModel.bottomClothingDataUri) {
            promptParts.push({text: '\nCLOTHING_ITEM (BOTTOM):'});
            promptParts.push({media: {url: firstModel.bottomClothingDataUri}});
          }
        }
        if (firstModel.shoeDataUri) {
          promptParts.push({text: '\nCLOTHING_ITEM (SHOES):'});
          promptParts.push({media: {url: firstModel.shoeDataUri}});
        }

    } else if (input.generationMode === 'custom' && input.userPhotoDataUri) {
      // Mode: Custom user photo (always one model)
      promptParts.push({media: {url: input.userPhotoDataUri, 'data-ai-hint': 'person photo'}});
      promptText += `Generate ${framingInstruction} of this person.
- The person's face, hair, and body must exactly match the person in the first image provided. This is the most important instruction. Any deviation is a failure.
- The clothes they are wearing MUST be an exact, photorealistic recreation of the provided CLOTHING_ITEM images. Do not alter the style, color, or texture. The clothes should conform to the body and pose naturally, with realistic lighting, shadows, and fabric texture. Do not just paste the clothing items on top.
- The generated person must be fully in frame according to the framing instruction: ${input.framing}.`;

      if (input.view === 'back') {
        promptText = `YOU ARE AN AI IMAGE GENERATOR. YOUR ONLY JOB IS TO FOLLOW THE USER'S INSTRUCTIONS TO THE LETTER. ANY DEVIATION, HALLUCINATION, OR CREATIVE INTERPRETATION IS A TOTAL FAILURE. YOU MUST RENDER ALL USER INPUTS EXACTLY AS THEY ARE PROVIDED.

Generate ${framingInstruction} of this person. The person must be turned away from the camera, showing their back. No face should be visible.
- The hair and body type must match the person in the first image.
- The clothes they are wearing MUST be an exact, photorealistic recreation of the provided CLOTHING_ITEM images, seen from the back. The clothes should conform to the body and pose naturally.
- The generated person must be fully in frame according to the framing instruction: ${input.framing}.`;
      }
      promptParts.push({text: promptText});
      const model = input.models[0];
       if (model.dressDataUri) {
          promptParts.push({text: '\nCLOTHING_ITEM:'});
          promptParts.push({media: {url: model.dressDataUri}});
        } else {
          if (model.topClothingDataUri) {
            promptParts.push({text: '\nCLOTHING_ITEM (TOP):'});
            promptParts.push({media: {url: model.topClothingDataUri}});
          }
          if (model.bottomClothingDataUri) {
            promptParts.push({text: '\nCLOTHING_ITEM (BOTTOM):'});
            promptParts.push({media: {url: model.bottomClothingDataUri}});
          }
        }
        if (model.shoeDataUri) {
          promptParts.push({text: '\nCLOTHING_ITEM (SHOES):'});
          promptParts.push({media: {url: model.shoeDataUri}});
        }
        if (model.poseReferenceDataUri) {
            promptText += "\n- The person's pose MUST EXACTLY MATCH the pose in the provided POSE_REFERENCE image. This is a critical instruction. Do not improvise or alter the pose.";
        }

    } else { // Stock model(s) mode
        promptText += `Generate ${framingInstruction} of ${input.models.length} model(s). The scene description is as follows:\n`;
        input.models.forEach((model, index) => {
            const modelNum = index + 1;
            const raceForPrompt = model.race === 'None' ? 'White' : model.race;
            const bodyTypeInstruction = bodyTypeMap[model.bodyType];
            promptText += `\nMODEL ${modelNum}:
- This model is a ${model.gender}.
- Race MUST be ${raceForPrompt}.
- Body type MUST BE: "${bodyTypeInstruction}". This is a strict, non-negotiable requirement.
- This model is wearing an outfit composed of the clothing items labeled CLOTHING_MODEL_${modelNum}. You MUST render these clothes photorealistically on this model. Generating the model without the clothes is a total failure. The clothes must be an exact, photorealistic recreation of the provided images.`;
            if (model.poseReferenceDataUri) {
                promptText += `\n- The pose for Model ${modelNum} MUST EXACTLY MATCH the pose in the provided POSE_MODEL_${modelNum} image. This is a critical instruction. Do not improvise or alter the pose for this model.`;
            }
        });

        if(input.models.length > 1) {
            promptText += `\n\nGROUP INSTRUCTIONS:\n- The models should be interacting or posing together naturally as a group, but ALL models must be clearly visible and distinct.`
        }

        promptParts.push({text: promptText});

        // Add clothing and pose items for each model
        input.models.forEach((model, index) => {
            const modelNum = index + 1;
            if (model.dressDataUri) {
                promptParts.push({text: `\nCLOTHING_MODEL_${modelNum} (DRESS):`});
                promptParts.push({media: {url: model.dressDataUri}});
            } else {
                if (model.topClothingDataUri) {
                    promptParts.push({text: `\nCLOTHING_MODEL_${modelNum} (TOP):`});
                    promptParts.push({media: {url: model.topClothingDataUri}});
                }
                if (model.bottomClothingDataUri) {
                    promptParts.push({text: `\nCLOTHING_MODEL_${modelNum} (BOTTOM):`});
                    promptParts.push({media: {url: model.bottomClothingDataUri}});
                }
            }
            if (model.shoeDataUri) {
                promptParts.push({text: `\nCLOTHING_MODEL_${modelNum} (SHOES):`});
                promptParts.push({media: {url: model.shoeDataUri}});
            }
            if (model.poseReferenceDataUri) {
                promptParts.push({text: `\nPOSE_MODEL_${modelNum}:`});
                promptParts.push({media: {url: model.poseReferenceDataUri, 'data-ai-hint': 'person pose'}});
            }
        });
    }

    // Common instructions for model-based generation
    if (input.generationMode !== 'clothing') {
        let commonInstructions = `\n\nSCENE INSTRUCTIONS:
- ${viewDirectionInstruction}
- ${viewAngleInstruction}
- ALL generated people must be fully in frame according to the framing instruction: ${input.framing}.`;
        promptParts.push({text: commonInstructions});
    }
    
    let sceneInstructions = `\n- The background MUST be: ${input.background}.`;
    if (input.background === 'Black Studio' && input.generationMode !== 'clothing') {
      sceneInstructions += ' Use superb, dramatic, high-contrast facial portrait lighting.'
    }
    sceneInstructions += `\n- The lighting on the subject and clothing MUST be extraordinary, dramatic, and photorealistic, appropriate for the scene.`;
    
    if (input.effect !== 'None') {
        let effectDescription = '';
        switch (input.effect) {
            case 'Movie-Like':
                effectDescription = 'Apply a cinematic, film-grade color treatment. The final image must have a slightly desaturated color palette with teal and orange tones, high contrast, and a subtle grain to emulate a modern movie still.';
                break;
            case 'Golden Hour':
                effectDescription = 'Apply a powerful golden hour lighting effect. The final image must be bathed in warm, low-angled sunlight, creating long, soft shadows, and a bright, ethereal glow on the subject.';
                break;
            case 'Dreamy':
                effectDescription = 'Apply a dreamy, ethereal, and soft-focus effect. The final image must feature a gentle bloom, halation around light sources, and a slightly hazy, magical atmosphere.';
                break;
            case 'VHS':
                effectDescription = 'Apply a realistic, retro VHS tape effect. The final image must include authentic-looking analog video artifacts like subtle scan lines, minor color bleeding (chromatic aberration), and a soft, slightly degraded analog feel.';
                break;
            case 'Black & White':
                effectDescription = 'Apply a dramatic, high-contrast black and white conversion. The final image must have deep, rich blacks and clean, bright whites. This is a classic monochrome filter, not a simple desaturation.';
                break;
            case 'Sepia Tone':
                effectDescription = 'Apply a warm, brownish sepia tone across the entire image to create a convincing vintage, old-photograph look from the early 20th century. The effect must be strong and noticeable.';
                break;
            case 'High Contrast':
                effectDescription = 'Apply a high-contrast, vivid filter that makes colors pop and deepens shadows significantly. The final result must be punchy and vibrant, not washed out.';
                break;
            case 'Infrared Glow':
                effectDescription = 'Apply a surreal and artistic infrared photography effect. In the final image, green foliage must appear white or glowing, skies must be dark and dramatic, and skin tones should have a smooth, porcelain-like quality.';
                break;
        }
        sceneInstructions += `\n- The final image MUST have a post-processing effect applied. The effect is: ${effectDescription}`;
    }
    
    promptParts.push({text: sceneInstructions});

    // Handle single pose reference for custom mode.
    const customModel = input.models[0];
    if (input.generationMode === 'custom' && customModel.poseReferenceDataUri) {
      promptParts.push({text: '\nPOSE_REFERENCE:'});
      promptParts.push({media: {url: customModel.poseReferenceDataUri, 'data-ai-hint': 'person pose'}});
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
