import sharp from "sharp";
import type { ImageAsset, ImageOptimizationResult } from "../types";

interface OptimizationOptions {
  maxWidth?: number;
  quality?: number;
  convertToWebP?: boolean;
  upscale?: boolean;
}

const DEFAULT_OPTIONS: OptimizationOptions = {
  maxWidth: 1200,
  quality: 80,
  convertToWebP: true,
  upscale: false,
};

export async function optimizeImage(
  buffer: Buffer,
  originalUrl: string,
  options: OptimizationOptions = {}
): Promise<ImageOptimizationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = buffer.length;

  try {
    let sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    const originalFormat = metadata.format || "unknown";

    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (opts.maxWidth && originalWidth > opts.maxWidth) {
      const ratio = opts.maxWidth / originalWidth;
      newWidth = opts.maxWidth;
      newHeight = Math.round(originalHeight * ratio);
      sharpInstance = sharpInstance.resize(newWidth, newHeight, {
        fit: "inside",
        withoutEnlargement: !opts.upscale,
      });
    }

    let optimizedBuffer: Buffer;
    let newFormat: string;

    if (opts.convertToWebP) {
      optimizedBuffer = await sharpInstance
        .webp({ quality: opts.quality })
        .toBuffer();
      newFormat = "webp";
    } else {
      switch (originalFormat) {
        case "jpeg":
          optimizedBuffer = await sharpInstance
            .jpeg({ quality: opts.quality, mozjpeg: true })
            .toBuffer();
          newFormat = "jpeg";
          break;
        case "png":
          optimizedBuffer = await sharpInstance
            .png({ compressionLevel: 9, adaptiveFiltering: true })
            .toBuffer();
          newFormat = "png";
          break;
        default:
          optimizedBuffer = await sharpInstance
            .webp({ quality: opts.quality })
            .toBuffer();
          newFormat = "webp";
      }
    }

    const optimizedSize = optimizedBuffer.length;
    const savedBytes = originalSize - optimizedSize;
    const savedPercent = Math.round((savedBytes / originalSize) * 100);

    return {
      originalUrl,
      originalSize,
      optimizedSize,
      savedBytes,
      savedPercent,
      newFormat,
      newWidth,
      newHeight,
      optimizedBuffer,
      recommendation: generateOptimizationSummary(
        originalSize,
        optimizedSize,
        originalFormat,
        newFormat,
        originalWidth,
        newWidth
      ),
    };
  } catch (error) {
    console.error("Image optimization failed:", error);
    return {
      originalUrl,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      savedPercent: 0,
      newFormat: "unknown",
      recommendation: `Optimization failed: ${error}`,
    };
  }
}

export async function fetchAndOptimize(
  imageUrl: string,
  options: OptimizationOptions = {}
): Promise<ImageOptimizationResult | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "SiteScout-SEO-Bot/1.0",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return optimizeImage(buffer, imageUrl, options);
  } catch (error) {
    console.error("Failed to fetch image for optimization:", error);
    return null;
  }
}

export async function analyzeOptimizationPotential(
  images: ImageAsset[]
): Promise<{
  totalPotentialSavings: number;
  imagesNeedingOptimization: number;
  estimatedSavingsPercent: number;
}> {
  let totalSize = 0;
  let estimatedOptimizedSize = 0;
  let imagesNeedingOptimization = 0;

  for (const img of images) {
    if (!img.fileSize) continue;
    
    totalSize += img.fileSize;
    
    if (img.issues.length > 0) {
      imagesNeedingOptimization++;
      
      let estimatedSaving = 0;
      
      if (img.issues.includes("oversized_file")) {
        estimatedSaving += 0.3;
      }
      if (img.issues.includes("png_should_be_webp")) {
        estimatedSaving += 0.4;
      }
      if (img.issues.includes("oversized_dimensions")) {
        estimatedSaving += 0.5;
      }
      if (img.issues.includes("poor_compression")) {
        estimatedSaving += 0.2;
      }
      
      estimatedSaving = Math.min(estimatedSaving, 0.7);
      estimatedOptimizedSize += img.fileSize * (1 - estimatedSaving);
    } else {
      estimatedOptimizedSize += img.fileSize;
    }
  }

  const totalPotentialSavings = totalSize - estimatedOptimizedSize;
  const estimatedSavingsPercent = totalSize > 0 
    ? Math.round((totalPotentialSavings / totalSize) * 100)
    : 0;

  return {
    totalPotentialSavings,
    imagesNeedingOptimization,
    estimatedSavingsPercent,
  };
}

function generateOptimizationSummary(
  originalSize: number,
  optimizedSize: number,
  originalFormat: string,
  newFormat: string,
  originalWidth: number,
  newWidth: number
): string {
  const parts: string[] = [];
  
  const savedKB = Math.round((originalSize - optimizedSize) / 1024);
  const savedPercent = Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  
  if (savedKB > 0) {
    parts.push(`Saved ${savedKB}KB (${savedPercent}%)`);
  }
  
  if (originalFormat !== newFormat) {
    parts.push(`Converted ${originalFormat.toUpperCase()} to ${newFormat.toUpperCase()}`);
  }
  
  if (originalWidth !== newWidth) {
    parts.push(`Resized from ${originalWidth}px to ${newWidth}px`);
  }
  
  return parts.join(". ") || "Image already optimal";
}

export async function generateOptimizationPreview(
  imageUrl: string
): Promise<{
  safe: ImageOptimizationResult | null;
  recommended: ImageOptimizationResult | null;
  aggressive: ImageOptimizationResult | null;
}> {
  try {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "SiteScout-SEO-Bot/1.0" },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return { safe: null, recommended: null, aggressive: null };

    const buffer = Buffer.from(await response.arrayBuffer());

    const [safe, recommended, aggressive] = await Promise.all([
      optimizeImage(buffer, imageUrl, {
        maxWidth: 1920,
        quality: 90,
        convertToWebP: false,
      }),
      optimizeImage(buffer, imageUrl, {
        maxWidth: 1200,
        quality: 80,
        convertToWebP: true,
      }),
      optimizeImage(buffer, imageUrl, {
        maxWidth: 800,
        quality: 70,
        convertToWebP: true,
      }),
    ]);

    return { safe, recommended, aggressive };
  } catch (error) {
    console.error("Failed to generate optimization preview:", error);
    return { safe: null, recommended: null, aggressive: null };
  }
}
