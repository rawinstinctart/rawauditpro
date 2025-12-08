import type { CrawlResult, ImageAsset } from "./types";
import { detectImageDetails, detectDuplicates } from "./image";

export interface CrawlOptions {
  maxPages?: number;
  analyzeImages?: boolean;
  maxImagesPerPage?: number;
}

const defaultOptions: CrawlOptions = {
  maxPages: 5,
  analyzeImages: true,
  maxImagesPerPage: 10,
};

export async function crawlWebsite(
  url: string, 
  options: CrawlOptions | number = 5
): Promise<CrawlResult[]> {
  const opts = typeof options === "number" 
    ? { ...defaultOptions, maxPages: options }
    : { ...defaultOptions, ...options };
  const results: CrawlResult[] = [];
  const visited = new Set<string>();
  const toVisit = [url];
  const allImageHashes = new Map<string, string[]>();
  
  while (toVisit.length > 0 && results.length < (opts.maxPages || 5)) {
    const currentUrl = toVisit.shift()!;
    
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);
    
    try {
      const result = await crawlPage(currentUrl, opts);
      
      if (result.imagesDetailed) {
        for (const img of result.imagesDetailed) {
          if (img.hash) {
            const urls = allImageHashes.get(img.hash) || [];
            urls.push(img.absoluteSrc);
            allImageHashes.set(img.hash, urls);
          }
        }
      }
      
      results.push(result);
      
      if (result.links) {
        const baseUrl = new URL(url);
        for (const link of result.links) {
          try {
            const linkUrl = new URL(link.href, url);
            if (linkUrl.hostname === baseUrl.hostname && !visited.has(linkUrl.href)) {
              toVisit.push(linkUrl.href);
            }
          } catch {
          }
        }
      }
    } catch (error) {
      console.error(`Failed to crawl ${currentUrl}:`, error);
      results.push({
        url: currentUrl,
        statusCode: 500,
      });
    }
  }
  
  if (opts.analyzeImages) {
    for (const result of results) {
      if (result.imagesDetailed) {
        result.imagesDetailed = detectDuplicates(result.imagesDetailed);
      }
    }
  }
  
  return results;
}

async function crawlPage(url: string, opts: CrawlOptions): Promise<CrawlResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SiteScout-SEO-Bot/1.0",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });
    
    const loadTime = Date.now() - startTime;
    const html = await response.text();
    
    const parsed = parseHTML(html, url);
    
    let imagesDetailed: ImageAsset[] | undefined;
    if (opts.analyzeImages && parsed.images && parsed.images.length > 0) {
      const imagesToAnalyze = parsed.images.slice(0, opts.maxImagesPerPage || 10);
      imagesDetailed = await Promise.all(
        imagesToAnalyze.map(img => 
          detectImageDetails(img.src, img.alt, html)
        )
      );
    }
    
    return {
      url,
      statusCode: response.status,
      loadTime,
      ...parsed,
      imagesDetailed,
    };
  } catch (error) {
    return {
      url,
      statusCode: 0,
      loadTime: Date.now() - startTime,
    };
  }
}

function parseHTML(html: string, baseUrl: string): Partial<CrawlResult> {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim();
  
  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const metaDescription = metaDescMatch?.[1]?.trim();
  
  // Extract H1s
  const h1Matches = html.matchAll(/<h1[^>]*>([^<]*(?:<[^/][^>]*>[^<]*)*)<\/h1>/gi);
  const h1 = [...h1Matches].map(m => stripTags(m[1]).trim()).filter(Boolean);
  
  // Extract H2s
  const h2Matches = html.matchAll(/<h2[^>]*>([^<]*(?:<[^/][^>]*>[^<]*)*)<\/h2>/gi);
  const h2 = [...h2Matches].map(m => stripTags(m[1]).trim()).filter(Boolean);
  
  // Extract images
  const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
  const images: { src: string; alt?: string }[] = [];
  for (const match of imgMatches) {
    const src = match[1];
    const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
    images.push({
      src: resolveUrl(src, baseUrl),
      alt: altMatch?.[1] || undefined,
    });
  }
  
  // Extract links
  const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*(?:<[^/][^>]*>[^<]*)*)<\/a>/gi);
  const links: { href: string; text: string }[] = [];
  for (const match of linkMatches) {
    links.push({
      href: resolveUrl(match[1], baseUrl),
      text: stripTags(match[2]).trim(),
    });
  }
  
  // Extract body text (simplified)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch?.[1] || html;
  const bodyText = stripTags(bodyHtml)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
  
  return {
    title,
    metaDescription,
    h1,
    h2,
    images,
    links,
    bodyText,
  };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

function resolveUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}
