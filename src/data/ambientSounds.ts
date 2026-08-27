// Ambient Nature & Rain Sounds Service
// 100% Local, Dependable HTML5 Audio Loop Player for Background Nature Sounds

export interface AmbientSound {
  id: string;
  name: string;
  englishName: string;
  icon: string;
  description: string;
  category: 'rain' | 'nature' | 'wind' | 'water';
  fileUrl: string;
  defaultVolume: number; // 0 - 100
}

export const ambientSounds: AmbientSound[] = [
  {
    id: 'none',
    name: 'بدون صوت خلفي',
    englishName: 'None',
    icon: '🔇',
    description: 'صوت التلاوة فقط بدون أي مؤثرات',
    category: 'nature',
    fileUrl: '',
    defaultVolume: 0,
  },
  {
    id: 'gentle_rain',
    name: 'مطر خفيف هادئ',
    englishName: 'Gentle Rain',
    icon: '🌧️',
    description: 'صوت قطرات المطر الناعمة يبعث السكينة والخشوع في القلب',
    category: 'rain',
    fileUrl: '/audio/ambient/gentle_rain.mp3',
    defaultVolume: 35,
  },
  {
    id: 'ocean_waves',
    name: 'أمواج البحر الهادئة',
    englishName: 'Ocean Waves',
    icon: '🌊',
    description: 'حركة أمواج شاطئية إيقاعية ولطيفة ومريحة للنفس',
    category: 'water',
    fileUrl: '/audio/ambient/ocean_waves.mp3',
    defaultVolume: 30,
  },
  {
    id: 'dawn_birds',
    name: 'تغريد طيور الفجر والنسيم',
    englishName: 'Dawn Birds',
    icon: '🕊️',
    description: 'تغريد طيور هادئ مع نسيم الصباح الباكر وطاقة إيجابية',
    category: 'nature',
    fileUrl: '/audio/ambient/dawn_birds.mp3',
    defaultVolume: 28,
  },
  {
    id: 'desert_wind',
    name: 'سكون ورياح الصحراء',
    englishName: 'Desert Wind',
    icon: '🏜️',
    description: 'هدوء الليل وأصوات الرياح العذبة في الفضاء المفتوح',
    category: 'wind',
    fileUrl: '/audio/ambient/desert_wind.mp3',
    defaultVolume: 30,
  },
  {
    id: 'forest_stream',
    name: 'خرير مياه النهر',
    englishName: 'Forest Stream',
    icon: '🏞️',
    description: 'مياه جارية عذبة تتدفق بين الأشجار والوديان',
    category: 'water',
    fileUrl: '/audio/ambient/forest_stream.mp3',
    defaultVolume: 32,
  },
];

/**
 * Robust HTML5 Audio Ambient Player
 * Uses direct local audio files with seamless looping and smooth volume control.
 */
class RobustAmbientAudioPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private currentSoundId: string = 'none';
  private currentVolume: number = 30; // 0 - 100
  private isPlaying: boolean = false;

  public play(soundId: string, volume: number = 30): void {
    if (!soundId || soundId === 'none' || volume <= 0) {
      this.stop();
      return;
    }

    const sound = ambientSounds.find((s) => s.id === soundId);
    if (!sound || !sound.fileUrl) {
      this.stop();
      return;
    }

    const normalizedVol = Math.max(0.01, Math.min(1.0, volume / 100));
    this.currentSoundId = soundId;
    this.currentVolume = volume;

    // If already playing the same sound, just adjust volume
    if (this.audioElement && this.currentSoundId === soundId && !this.audioElement.paused) {
      this.audioElement.volume = normalizedVol;
      return;
    }

    this.stop();

    try {
      const audio = new Audio();
      audio.src = sound.fileUrl;
      audio.loop = true;
      audio.volume = normalizedVol;
      audio.preload = 'auto';

      audio
        .play()
        .then(() => {
          this.isPlaying = true;
        })
        .catch((err) => {
          console.warn('[AmbientPlayer] Autoplay prevented or failed:', err);
        });

      this.audioElement = audio;
    } catch (err) {
      console.error('[AmbientPlayer] Failed to instantiate audio:', err);
    }
  }

  public setVolume(volume: number): void {
    this.currentVolume = volume;
    if (this.audioElement) {
      const normalizedVol = Math.max(0, Math.min(1.0, volume / 100));
      this.audioElement.volume = normalizedVol;
    }
  }

  public stop(): void {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.src = '';
        this.audioElement.load();
      } catch (err) {
        console.debug('[AmbientSoundPlayer] stop error:', err);
      }
      this.audioElement = null;
    }
    this.isPlaying = false;
    this.currentSoundId = 'none';
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentSoundId(): string {
    return this.currentSoundId;
  }

  public getVolume(): number {
    return this.currentVolume;
  }
}

export const proceduralAmbientEngine = new RobustAmbientAudioPlayer();
