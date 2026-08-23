// 100% Free AI Image Generation Service powered by Pollinations.ai (Flux & SDXL)
// No API Key, No Registration, Unlimited Generation

export interface AiPromptPreset {
  id: string;
  name: string;
  englishPrompt: string;
  icon: string;
  category: 'mosque' | 'nature' | 'night' | 'heritage';
}

export const aiPromptPresets: AiPromptPreset[] = [
  {
    id: 'mihrab_dawn',
    name: 'محراب مسجد مع أشعة شمس الصباح',
    englishPrompt:
      'Breathtaking ancient ornate mosque mihrab interior, intricate marble arabesque carvings, warm volumetric morning sunlight rays streaming through arched windows, spiritual and peaceful, photorealistic 8k, cinematic lighting, masterpiece',
    icon: '🕌',
    category: 'mosque',
  },
  {
    id: 'night_crescent',
    name: 'سماء ليلية ونجوم مع هلال مشع',
    englishPrompt:
      'Majestic mosque minarets and dome silhouette under vast starry galaxy night sky, glowing golden crescent moon, deep blue and amber tones, tranquil misty atmosphere, 8k cinematic wallpaper, highly detailed',
    icon: '🌌',
    category: 'night',
  },
  {
    id: 'golden_desert',
    name: 'كثبان رملية ذهبية عند الغروب مع نخيل',
    englishPrompt:
      'Serene Arabian desert golden sand dunes during warm sunset, glowing orange and violet horizon, soft wind ripples, silhouette of palm trees in distant oasis, cinematic photorealistic lighting',
    icon: '🏜️',
    category: 'nature',
  },
  {
    id: 'rainy_mosque',
    name: 'مطر على نافذة مسجد في الغسق',
    englishPrompt:
      'Gentle raindrops running down glass window overlooking an illuminated quiet mosque courtyard at twilight, soft glowing lanterns bokeh, moody and deeply serene, ultra-realistic aesthetic',
    icon: '🌧️',
    category: 'nature',
  },
  {
    id: 'andalusian_arch',
    name: 'أقواس أندلسية وزخارف إسلامية ملكية',
    englishPrompt:
      'Grand Andalusian Moorish architectural palace hallway with horseshoe arches, exquisite Moroccan zellij mosaic tiles, carved wooden ceiling, warm sunlight rays, royal Islamic heritage',
    icon: '🏰',
    category: 'heritage',
  },
  {
    id: 'paradise_stream',
    name: 'شلالات وأنهار في طبيعة خضراء خلابة',
    englishPrompt:
      'Crystal clear mountain river stream flowing through lush green trees and blossoming meadow, peaceful morning fog, sunbeams filtering through leaves, spiritual reflection nature scene, 8k',
    icon: '🌿',
    category: 'nature',
  },
  {
    id: 'misty_mountains',
    name: 'جبال فجرية ضبابية مع سحاب ونور ساطع',
    englishPrompt:
      'Majestic misty mountain peaks rising above sea of clouds during sunrise, radiant god rays illumination, epic cinematic wide atmosphere, hyper-detailed photorealistic',
    icon: '🏔️',
    category: 'nature',
  },
  {
    id: 'sacred_mecca',
    name: 'الكعبة المشرفة وأجواء روحانية مهيبة',
    englishPrompt:
      'Respectful artistic cinematic depiction of the Holy Kaaba in Mecca, illuminated with soft divine golden hour light, majestic clouds, serene and profound spiritual aura, masterpiece',
    icon: '🕋',
    category: 'mosque',
  },
];

// Map Arabic keywords to English visual enhancement terms
const arabicToEnglishMap: Record<string, string> = {
  مسجد: 'majestic mosque architecture',
  مساجد: 'grand mosques architecture',
  محراب: 'ornate mosque mihrab niche',
  قبة: 'mosque dome',
  مئذنة: 'tall mosque minaret',
  هلال: 'glowing crescent moon',
  نجوم: 'starry galaxy night sky',
  سماء: 'atmospheric cinematic sky',
  مطر: 'gentle rain falling, moody ambiance',
  غروب: 'golden hour sunset',
  شروق: 'peaceful morning sunrise with god rays',
  فجر: 'early dawn with soft light and mist',
  صحراء: 'golden Arabian desert sand dunes',
  نخل: 'palm trees oasis',
  طبيعة: 'lush tranquil nature landscape',
  جبال: 'majestic misty mountain peaks',
  شلال: 'crystal clear waterfall',
  بحر: 'calm ocean waves at sunset',
  أقواس: 'Andalusian arches and arabesque carvings',
  زخرفة: 'intricate Islamic geometric tiles and patterns',
  نور: 'volumetric light rays, divine glow',
  كعبة: 'Holy Kaaba in Mecca, spiritual atmosphere',
};

export function enhancePrompt(userPrompt: string): string {
  if (!userPrompt || !userPrompt.trim()) {
    return aiPromptPresets[0].englishPrompt;
  }

  const clean = userPrompt.trim();

  // Check if user input is primarily Arabic
  const isArabic = /[\u0600-\u06FF]/.test(clean);

  let enriched = clean;
  if (isArabic) {
    // Translate keywords found
    const keywords: string[] = [];
    for (const [ar, en] of Object.entries(arabicToEnglishMap)) {
      if (clean.includes(ar)) {
        keywords.push(en);
      }
    }

    if (keywords.length > 0) {
      enriched = keywords.join(', ') + `, spiritual mood, cinematic composition`;
    } else {
      enriched = `${clean}, peaceful Islamic spiritual theme, majestic atmosphere`;
    }
  }

  // Add ultimate quality booster tags with high contrast and vivid rich HDR colors
  return `${enriched}, hyper-realistic photography, ultra high contrast, deep rich vibrant colors, high dynamic range HDR, volumetric cinematic lighting, razor sharp 8k uhd, masterpiece, crystal clear focus, studio quality, no haze, no washed out colors`;
}

export function buildAiImageUrl(
  prompt: string,
  aspectRatio: '9:16' | '16:9' | '1:1' = '9:16',
  seed?: number,
  model: 'turbo' | 'flux' = 'flux' // Default to FLUX for maximum 8K quality
): string {
  const enhanced = enhancePrompt(prompt);
  const encodedPrompt = encodeURIComponent(enhanced);

  const dimensions = {
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
    '1:1': { width: 1080, height: 1080 },
  }[aspectRatio];

  const actualSeed = seed ?? Math.floor(Math.random() * 9999999) + (Date.now() % 10000);

  // Pollinations.ai URL with model parameter (flux for ultra-sharp 8k, turbo for fast)
  const selectedModel = model === 'flux' ? 'flux' : 'turbo';
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&model=${selectedModel}&seed=${actualSeed}&nologo=true`;
}
