import { AttachmentBuilder } from 'discord.js';

let canvas: any = null;

// Try to load canvas, but don't crash if it fails
try {
  canvas = await import('@napi-rs/canvas');
} catch (error) {
  console.warn('Canvas not available, gradients will be disabled:', error);
}

// In-memory cache for gradient banners
const gradientCache = new Map<string, Buffer>();

export function createGradientBanner(
  width: number = 400,
  height: number = 100,
  startColor: string = '#1e40af', // deep blue
  endColor: string = '#000000'    // black
): AttachmentBuilder | null {
  if (!canvas) {
    return null; // Canvas not available, skip gradient
  }

  const cacheKey = `${width}x${height}_${startColor}_${endColor}`;
  
  // Check cache first
  if (gradientCache.has(cacheKey)) {
    const buffer = gradientCache.get(cacheKey)!;
    return new AttachmentBuilder(buffer, { name: 'gradient.png' });
  }

  try {
    // Create canvas
    const canvasInstance = canvas.createCanvas(width, height);
    const ctx = canvasInstance.getContext('2d');

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);

    // Fill canvas with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Convert to buffer
    const buffer = canvasInstance.toBuffer('image/png');
    
    // Cache the result (limit cache size to prevent memory issues)
    if (gradientCache.size < 10) {
      gradientCache.set(cacheKey, buffer);
    }

    return new AttachmentBuilder(buffer, { name: 'gradient.png' });
  } catch (error) {
    console.warn('Failed to create gradient banner:', error);
    return null;
  }
}

export function getDefaultGradientBanner(): AttachmentBuilder | null {
  return createGradientBanner(); // Uses default deep blue to black gradient
}