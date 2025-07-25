import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const resizeImage = (
  imageSource: File | string,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error("resizeImage can only be run on the client."));
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous'; // This can help with tainted canvas errors

    const objectUrl = imageSource instanceof File ? URL.createObjectURL(imageSource) : null;
    img.src = objectUrl || (imageSource as string);
    
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Use createImageBitmap for better performance if available
        if (typeof window !== 'undefined' && window.createImageBitmap) {
            const imageBitmap = await window.createImageBitmap(img, {
                resizeWidth: width,
                resizeHeight: height,
                resizeQuality: 'high',
            });
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(imageBitmap, 0, 0);
                imageBitmap.close(); // Free memory
            }
        } else {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
            }
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);

      } catch (e) {
        reject(e);
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    };
    img.onerror = (err) => {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
        console.error("Image loading error for resizing:", err);
        reject(new Error("Could not load image for resizing. It might be an unsupported format or a network issue."));
    }
  });
};
