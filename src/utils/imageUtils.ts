/**
 * Centralized Image & Media Loader Utilities for Athar Reels Studio
 */

export function isVideoMedia(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    /\.(mp4|webm|mov|ogg|mkv|m4v)$/i.test(cleanUrl) ||
    url.includes('.mp4') ||
    url.includes('.webm') ||
    url.includes('.mov') ||
    url.includes('/video/') ||
    url.includes('player.vimeo.com') ||
    url.includes('pexels.com/video') ||
    url.includes('mixkit.co/videos') ||
    url.startsWith('data:video/') ||
    (url.startsWith('blob:') && url.includes('video'))
  );
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('Image URL is empty'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry once without anonymous crossOrigin for local data URLs or blob URLs
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () =>
          reject(new Error(`Failed to load image: ${url.slice(0, 50)}...`));
        fallbackImg.src = url;
      } else {
        reject(new Error(`Failed to load image: ${url}`));
      }
    };
    img.src = url;
  });
}
