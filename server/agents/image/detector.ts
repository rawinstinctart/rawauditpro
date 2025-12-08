import probe from "probe-image-size";
import { createHash } from "crypto";
import type { ImageAsset, ImageIssueType } from "../types";

const MAX_FILE_SIZE = 150 * 1024;
const MAX_WIDTH = 1200;
const COMPRESSION_THRESHOLD = 0.5;

export async function detectImageDetails(
  imageUrl: string,
  alt?: string,
  pageHtml?: string
): Promise<ImageAsset> {
  const startTime = Date.now();
  const issues: ImageIssueType[] = [];
  let width: number | undefined;
  let height: number | undefined;
  let fileSize: number | undefined;
  let format: string | undefined;
  let hash: string | undefined;
  let hasLazyLoading = false;

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "SiteScout-SEO-Bot/1.0",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return createErrorAsset(imageUrl, alt, "Failed to fetch image");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fileSize = buffer.length;
    hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);

    try {
      const probeResult = probe.sync(buffer);
      if (probeResult) {
        width = probeResult.width;
        height = probeResult.height;
        format = probeResult.type;
      }
    } catch {
      format = detectFormatFromUrl(imageUrl);
    }

    if (pageHtml) {
      const imgTagMatch = new RegExp(`<img[^>]*src=["']${escapeRegex(imageUrl)}["'][^>]*>`, "i").exec(pageHtml);
      if (imgTagMatch) {
        hasLazyLoading = /loading=["']lazy["']/i.test(imgTagMatch[0]) || 
                          /data-src/i.test(imgTagMatch[0]) ||
                          /lazy/i.test(imgTagMatch[0]);
      }
    }

    if (fileSize > MAX_FILE_SIZE) {
      issues.push("oversized_file");
    }

    if (format === "png" && !hasTransparency(buffer)) {
      issues.push("png_should_be_webp");
    }

    if (width && width > MAX_WIDTH) {
      issues.push("oversized_dimensions");
    }

    if (!alt || alt.trim() === "") {
      issues.push("missing_alt");
    }

    if (!hasLazyLoading) {
      issues.push("no_lazy_loading");
    }

    if (fileSize && width && height) {
      const bytesPerPixel = fileSize / (width * height);
      if (bytesPerPixel > COMPRESSION_THRESHOLD) {
        issues.push("poor_compression");
      }
    }

    const loadTime = Date.now() - startTime;

    return {
      src: imageUrl,
      absoluteSrc: imageUrl,
      alt,
      width,
      height,
      fileSize,
      format,
      hasLazyLoading,
      loadTime,
      hash,
      issues,
      recommendedAction: generateRecommendation(issues, format, fileSize, width),
    };
  } catch (error) {
    return createErrorAsset(imageUrl, alt, String(error));
  }
}

export function detectDuplicates(images: ImageAsset[]): ImageAsset[] {
  const hashMap = new Map<string, number>();
  
  for (const img of images) {
    if (img.hash) {
      const count = hashMap.get(img.hash) || 0;
      hashMap.set(img.hash, count + 1);
    }
  }

  return images.map(img => {
    if (img.hash && (hashMap.get(img.hash) || 0) > 1) {
      if (!img.issues.includes("duplicate_image")) {
        return {
          ...img,
          issues: [...img.issues, "duplicate_image"] as ImageIssueType[],
          recommendedAction: img.recommendedAction 
            ? `${img.recommendedAction}. Remove duplicate images.`
            : "Remove duplicate images to reduce page weight.",
        };
      }
    }
    return img;
  });
}

function createErrorAsset(url: string, alt?: string, error?: string): ImageAsset {
  return {
    src: url,
    absoluteSrc: url,
    alt,
    issues: [],
    recommendedAction: error ? `Could not analyze: ${error}` : undefined,
  };
}

function detectFormatFromUrl(url: string): string | undefined {
  const extension = url.split("?")[0].split(".").pop()?.toLowerCase();
  const formatMap: Record<string, string> = {
    jpg: "jpeg",
    jpeg: "jpeg",
    png: "png",
    gif: "gif",
    webp: "webp",
    svg: "svg",
    avif: "avif",
  };
  return extension ? formatMap[extension] : undefined;
}

function hasTransparency(buffer: Buffer): boolean {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    for (let i = 8; i < buffer.length - 8; i++) {
      if (
        buffer[i] === 0x74 &&
        buffer[i + 1] === 0x52 &&
        buffer[i + 2] === 0x4e &&
        buffer[i + 3] === 0x53
      ) {
        return true;
      }
    }
    const ihdrPos = buffer.indexOf("IHDR");
    if (ihdrPos > 0 && ihdrPos + 17 < buffer.length) {
      const colorType = buffer[ihdrPos + 13];
      return colorType === 4 || colorType === 6;
    }
  }
  return false;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateRecommendation(
  issues: ImageIssueType[],
  format?: string,
  fileSize?: number,
  width?: number
): string {
  const recommendations: string[] = [];

  if (issues.includes("oversized_file")) {
    recommendations.push(`Compress image (currently ${Math.round((fileSize || 0) / 1024)}KB)`);
  }

  if (issues.includes("png_should_be_webp")) {
    recommendations.push("Convert PNG to WebP for better compression");
  }

  if (issues.includes("oversized_dimensions")) {
    recommendations.push(`Resize image from ${width}px to max ${MAX_WIDTH}px`);
  }

  if (issues.includes("missing_alt")) {
    recommendations.push("Add descriptive alt text for accessibility and SEO");
  }

  if (issues.includes("no_lazy_loading")) {
    recommendations.push("Add loading='lazy' attribute");
  }

  if (issues.includes("poor_compression")) {
    recommendations.push("Re-compress with better quality settings");
  }

  if (issues.includes("duplicate_image")) {
    recommendations.push("Remove duplicate image");
  }

  return recommendations.join(". ") || "Image is optimized";
}
