
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
    .enum(['stock', 'custom'])
    .describe('The generation mode: stock model(s) or custom user photo.'),
  userPhotoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the user for 'custom' mode, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  models: z.array(ModelConfigurationSchema).min(1).max(2)
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
    if (!mainModelConfig.topClothingDataUri && !mainModelConfig.dressDataUri) {
      throw new Error('Generation requires either a top or a dress for the first model.');
    }

    const promptParts: (
      | {text: string}
      | {media: {url: string; "data-ai-hint"?: string}}
    )[] = [];
    
    // --- MASTER PROMPT ---
    // This sets a high-quality baseline for all image generations.
    let masterPrompt = `Task: Generate a single, new, ultra-photorealistic image based on the detailed instructions and reference photos provided.
    Quality baseline: 8K resolution, shot on a DSLR camera, sharp focus, high detail, professional photography, hyper-realistic skin texture, natural lighting. Adhere strictly to all provided details.`;

    const modelCountInstruction = `The final image must feature exactly ${input.models.length} model(s). This is a primary requirement.`;
    masterPrompt += `\n${modelCountInstruction}`;

    const framingMap = {
      'full-body': 'a full-body photograph, capturing the subject from head to toe',
      'half-body': 'a waist-up, half-body photograph. The framing must crop the image at the model\'s waist, clearly showing the upper body and clothing',
      'portrait': 'a head-and-shoulders portrait, focusing on the face and upper torso',
    };
    const framingInstruction = framingMap[input.framing];

    const bodyTypeMap = {
        'fat': 'a plus-sized, full-figured body with a realistic amount of body fat. The physique should appear natural and well-proportioned for a fat person, not exaggerated.',
        'chubby': 'a soft, rounded body with some extra weight, representing a pleasantly plump and realistic physique.',
        'slim': 'a slender, lean body with low body fat and a graceful build.',
        'fit': 'an athletic and toned body with visible, defined musculature suitable for a fit and active individual.',
        'muscular': 'a well-defined, muscular body with significant and clearly visible muscle mass, similar to a bodybuilder or physique athlete. It is critical that the model wears the provided clothes correctly over this physique.',
        'model': 'a very lean, slender, and tall physique typical of high-fashion models.',
        'bulky': 'a large, heavy-set frame with a combination of significant muscle mass and body fat, creating a powerful, bulky build.',
        'shredded': 'an extremely lean physique with very low body fat, where muscles are highly defined, separated, and vascular. It is critical that the model wears the provided clothes correctly over this physique.',
    };
    
    const viewAngleMap = {
        'Eye-Level': 'The camera angle is at a standard eye-level, creating a neutral and direct perspective.',
        'Low Angle': 'The camera angle is significantly low, looking up at the subject(s) to create a sense of power and scale.',
        'High Angle': 'The camera angle is high, looking down on the subject(s), which can create a feeling of vulnerability or offer a unique overview.',
        "Worm's-Eye View": "An extreme low-angle shot from ground level, looking straight up. This creates dramatic, perspective-distorting lines. The entire subject must be visible in a full-body shot.",
        'Overhead Shot': 'A shot taken from directly above the subject(s) (a top-down or bird\'s-eye view). The subjects might be looking up towards the camera. The entire subject must be visible in a full-body shot.',
        'Fisheye Lens': 'The image is captured with a fisheye lens, creating a distinct, convex, and distorted look with bulging center lines.',
    };
    const viewAngleInstruction = viewAngleMap[input.viewAngle];

    const viewDirectionMap = {
        'front': 'The model(s) are facing forward, directly towards the camera.',
        'back': 'The model(s) are turned away from the camera, with their backs facing the viewer. No faces should be visible.',
        'three-quarters': 'The model(s) are posed at a three-quarters angle to the camera, creating a sense of depth. It is a classic angle between a front and profile view.',
    };
    const viewDirectionInstruction = viewDirectionMap[input.view];
    
    let promptText = masterPrompt;

    if (input.generationMode === 'custom' && input.userPhotoDataUri) {
      // Mode: Custom user photo
      promptParts.push({media: {url: input.userPhotoDataUri, 'data-ai-hint': 'The primary reference photo of the person.'}});
      let customModePrompt = `\n\n//--- MODEL DESCRIPTION ---//\nGenerate ${framingInstruction} of the person from the primary reference photo.
- **Face and Body Matching:** The person's face, hair, and physical characteristics must be an identical match to the person in the reference photo. This is the most important instruction.
- **Clothing Integration:** The person must be dressed in an outfit created from the CLOTHING_ITEM images. It is crucial to render these clothes with photorealistic draping, folds, and shadows that conform naturally to the person's body and pose. Do not make it look like a sticker. The style, color, and texture must be an exact recreation.
- **Framing:** Ensure the generated person is fully visible and correctly framed according to the instruction: ${input.framing}.`

      if (input.view === 'back') {
        customModePrompt = `\n\n//--- MODEL DESCRIPTION ---//\nGenerate ${framingInstruction} of the person from the reference photo, but viewed from the back. The person must be turned away from the camera, showing their back. No face should be visible.
- **Hair and Body Matching:** The hair style, color, and body type must still match the person in the reference photo.
- **Clothing Integration:** Dress the model in the CLOTHING_ITEM images, realistically showing the back view of the clothes. The clothes should drape and conform naturally to the body.
- **Framing:** Ensure the generated person is fully visible and correctly framed according to the instruction: ${input.framing}.`;
      }
      
      const model = input.models[0];
       if (model.dressDataUri) {
          promptParts.push({text: '\nCLOTHING_ITEM (DRESS):'});
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
            customModePrompt += "\n- **Pose Matching:** The person's pose must precisely match the pose shown in the POSE_REFERENCE image. Replicate the posture and limb positions exactly.";
        }
      promptText += customModePrompt;
      promptParts.push({text: promptText});
      // Add pose reference at the end, after text.
      if (model.poseReferenceDataUri) {
        promptParts.push({text: '\nPOSE_REFERENCE:'});
        promptParts.push({media: {url: model.poseReferenceDataUri, 'data-ai-hint': 'A reference image for the desired pose.'}});
      }
    } else { // Stock model(s) mode
        promptText += `\n\n//--- SCENE & MODEL DESCRIPTION ---//\nGenerate ${framingInstruction} containing ${input.models.length} model(s). The scene is described below:\n`;
        input.models.forEach((model, index) => {
            const modelNum = index + 1;
            const raceForPrompt = model.race === 'None' ? 'a person' : model.race; // Soften 'White' default
            const bodyTypeInstruction = bodyTypeMap[model.bodyType];
            promptText += `\n**MODEL ${modelNum}:**
- **Identity:** A ${model.gender} model of ${raceForPrompt} ethnicity.
- **Body Type:** The model must have a specific body type: "${bodyTypeInstruction}". This physical trait is a key requirement.
- **Clothing:** This model is dressed in the outfit provided in the CLOTHING_MODEL_${modelNum} references. The clothes must be rendered with extreme photorealism, fitting the model's body naturally. It is essential to replicate the clothing items exactly.`;
            if (model.poseReferenceDataUri) {
                promptText += `\n- **Pose:** The pose for Model ${modelNum} must be an exact replica of the pose in the POSE_MODEL_${modelNum} image. This is a critical directive.`;
            }
        });

        if(input.models.length > 1) {
            promptText += `\n\n**GROUP INSTRUCTIONS:**\n- The models should be positioned together in a natural composition. They can be interacting or posing as a group, but every model must be clearly visible and well-lit.`
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
                promptParts.push({media: {url: model.poseReferenceDataUri, 'data-ai-hint': 'Reference for this model\'s pose.'}});
            }
        });
    }

    // --- COMMON INSTRUCTIONS ---
    let commonInstructions = `\n\n//--- PHOTOGRAPHY & SCENE INSTRUCTIONS ---//`;
    
    commonInstructions += `
- **Viewpoint:** ${viewDirectionInstruction}
- **Camera Angle:** ${viewAngleInstruction}
- **Framing:** All models must be fully visible within the specified framing: ${input.framing}.`;
    
    commonInstructions += `\n- **Background:** The background is a ${input.background}. It should be rendered realistically with appropriate depth of field.`;
    if (input.background === 'Black Studio') {
      commonInstructions += ' Employ professional, dramatic, high-contrast studio lighting to sculpt the model\'s features.'
    }
    commonInstructions += `\n- **Lighting:** The overall lighting on the subjects and clothing must be photorealistic, high-quality, and consistent with the chosen background and effects.`;
    
    if (input.effect !== 'None') {
        let effectDescription = '';
        switch (input.effect) {
            case 'Movie-Like':
                effectDescription = 'A cinematic, film-grade color treatment with a slightly desaturated palette, emphasizing teal and orange tones, and subtle film grain for a modern movie still aesthetic.';
                break;
            case 'Golden Hour':
                effectDescription = 'A powerful golden hour lighting effect, bathing the scene in warm, low-angled sunlight. This should create long, soft shadows and a bright, ethereal glow on the subjects.';
                break;
            case 'Dreamy':
                effectDescription = 'A dreamy, ethereal, soft-focus effect, featuring a gentle bloom, halation around light sources, and a hazy, magical atmosphere.';
                break;
            case 'VHS':
                effectDescription = 'A realistic, retro VHS tape effect, including authentic analog artifacts like subtle scan lines, minor color bleeding (chromatic aberration), and a soft, slightly degraded quality.';
                break;
            case 'Black & White':
                effectDescription = 'A dramatic, high-contrast black and white conversion with deep, rich blacks and clean, bright whites. This should be a classic monochrome style, not a simple desaturation.';
                break;
            case 'Sepia Tone':
                effectDescription = 'A warm, brownish sepia tone applied across the entire image to create a convincing vintage, early 20th-century photograph look.';
                break;
            case 'High Contrast':
                effectDescription = 'A high-contrast, vivid filter that makes colors pop and deepens shadows significantly, resulting in a punchy and vibrant image.';
                break;
            case 'Infrared Glow':
                effectDescription = 'A surreal and artistic infrared photography effect, where green foliage appears white or glowing, skies are dark and dramatic, and skin tones have a smooth, porcelain quality.';
                break;
        }
        commonInstructions += `\n- **Post-Processing Effect:** The final image must feature the following creative effect: ${effectDescription}`;
    }
    
    promptParts.push({text: commonInstructions});
    
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
