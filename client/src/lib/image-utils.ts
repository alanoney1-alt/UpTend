/**
 * Image processing utilities for mobile optimization
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * Compress and resize image before upload
 * @param file - Original image file
 * @param options - Compression options
 * @returns Compressed image as File
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    mimeType = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // Create new file with original name
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Fix image orientation based on EXIF data
 * Mobile cameras often save images with rotation metadata
 */
export async function fixImageOrientation(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Get EXIF orientation
        const orientation = getOrientation(e.target?.result as ArrayBuffer);

        // If no rotation needed, return original
        if (orientation <= 1) {
          resolve(file);
          return;
        }

        // Create canvas with proper dimensions
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Set canvas dimensions based on rotation
        if (orientation > 4 && orientation < 9) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        // Apply rotation transform
        switch (orientation) {
          case 2:
            ctx.transform(-1, 0, 0, 1, img.width, 0);
            break;
          case 3:
            ctx.transform(-1, 0, 0, -1, img.width, img.height);
            break;
          case 4:
            ctx.transform(1, 0, 0, -1, 0, img.height);
            break;
          case 5:
            ctx.transform(0, 1, 1, 0, 0, 0);
            break;
          case 6:
            ctx.transform(0, 1, -1, 0, img.height, 0);
            break;
          case 7:
            ctx.transform(0, -1, -1, 0, img.height, img.width);
            break;
          case 8:
            ctx.transform(0, -1, 1, 0, 0, img.width);
            break;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to fix orientation"));
              return;
            }

            const rotatedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(rotatedFile);
          },
          file.type,
          0.95
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));

      // Create object URL for image
      const blob = new Blob([e.target?.result as ArrayBuffer], { type: file.type });
      img.src = URL.createObjectURL(blob);
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get EXIF orientation from image ArrayBuffer
 */
function getOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);

  if (view.getUint16(0, false) !== 0xffd8) {
    return -2; // Not a JPEG
  }

  const length = view.byteLength;
  let offset = 2;

  while (offset < length) {
    if (view.getUint16(offset + 2, false) <= 8) return -1;
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffe1) {
      // EXIF marker
      if (view.getUint32((offset += 2), false) !== 0x45786966) {
        return -1;
      }

      const little = view.getUint16((offset += 6), false) === 0x4949;
      offset += view.getUint32(offset + 4, little);
      const tags = view.getUint16(offset, little);
      offset += 2;

      for (let i = 0; i < tags; i++) {
        if (view.getUint16(offset + i * 12, little) === 0x0112) {
          return view.getUint16(offset + i * 12 + 8, little);
        }
      }
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      offset += view.getUint16(offset, false);
    }
  }

  return -1;
}

/**
 * Process image for upload: fix orientation and compress
 */
export async function processImageForUpload(file: File): Promise<File> {
  try {
    // Fix orientation first
    const orientedFile = await fixImageOrientation(file);

    // Then compress
    const compressedFile = await compressImage(orientedFile, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      mimeType: "image/jpeg",
    });

    // Log compression results
    const originalSize = (file.size / 1024 / 1024).toFixed(2);
    const newSize = (compressedFile.size / 1024 / 1024).toFixed(2);
    console.log(
      `Image optimized: ${originalSize}MB → ${newSize}MB (${(
        (1 - compressedFile.size / file.size) *
        100
      ).toFixed(1)}% reduction)`
    );

    return compressedFile;
  } catch (error) {
    console.error("Image processing failed, using original:", error);
    return file; // Fallback to original if processing fails
  }
}
