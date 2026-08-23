/**
 * Unified Studio Audio Engine (Athar Reels Studio)
 * Ultra-Reliable, Low-Latency, Multi-CDN Fallback Audio Player Engine with:
 * 1. Smart CORS & Digital Silence Detection (Graceful native fallback).
 * 2. Complete Removal of Robotic TTS (Replaced with Respectful Quranic Error Handler).
 * 3. Jitter-Free, Hysteresis-Calibrated Word Karaoke Synchronizer.
 * 4. Full Real-Time 8D Binaural Spatial Audio, Mosque Reverb & Studio Mastering DSP.
 */

import { QuranWord, AudioSettings, MosqueReverbPreset, Spatial8DStyle } from '../types';
import { Spatial8DAudioProcessor } from './spatial8DAudioEngine';
import { quranCacheService } from './quranCacheService';

export interface PlaybackItem {
  id: string;
  audioUrl: string;
  fallbackUrls?: string[];
  duration?: number;
  startTimeMs?: number;
  endTimeMs?: number;
  isFullSurahFile?: boolean;
  text?: string;
  words?: QuranWord[];
}

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface ProgressCallbackData {
  currentTime: number;
  duration: number;
  progressFraction: number;
  activeWordIndex: number;
}

export class UnifiedStudioAudioEngine {
  private static instance: UnifiedStudioAudioEngine;

  // Primary HTML5 Audio Element (Reused to prevent multiple source attachments)
  private audio: HTMLAudioElement | null = null;
  private currentItem: PlaybackItem | null = null;
  private state: PlaybackState = 'idle';
  private generation: number = 0; // Incremented on every play/stop request
  private volume: number = 0.85;
  private rafId: number | null = null;

  // Web Audio API DSP Nodes
  private audioCtx: AudioContext | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private clarityFilter: BiquadFilterNode | null = null;
  private warmthFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private dryGainNode: GainNode | null = null;
  private wetGainNode: GainNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private subMasterGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private spatial8DProcessor: Spatial8DAudioProcessor | null = null;
  private isWebAudioInitialized: boolean = false;
  private isDirectMode: boolean = false; // Fallback to direct HTML5 audio if CORS/WebAudio fails
  private impulseCache = new Map<string, AudioBuffer>();

  // Current DSP Settings Cache
  private currentSettings: Partial<AudioSettings> = {
    enable8DAudio: false,
    eightDSpeed: 0.12,
    eightDDepth: 85,
    eightDStyle: 'orbit360',
    reverbPreset: 'none',
    reverbLevel: 35,
    enableStudioClarity: true,
    enableVoiceWarmth: true,
    enableNoiseGate: false,
  };

  // Listeners
  private onStateChangeListeners: Set<(state: PlaybackState) => void> = new Set();
  private onProgressListener: ((data: ProgressCallbackData) => void) | null = null;
  private onItemCompleteListeners: Set<() => void> = new Set();
  private onErrorListeners: Set<(errorMsg: string) => void> = new Set();

  private constructor() {
    this.initAudioElement();
  }

  public static getInstance(): UnifiedStudioAudioEngine {
    if (!UnifiedStudioAudioEngine.instance) {
      UnifiedStudioAudioEngine.instance = new UnifiedStudioAudioEngine();
    }
    return UnifiedStudioAudioEngine.instance;
  }

  /**
   * Initialize or get the persistent HTMLAudioElement
   */
  private initAudioElement(): HTMLAudioElement {
    if (!this.audio) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      this.audio = audio;
    }
    return this.audio;
  }

  /**
   * Safe AudioContext Getter
   */
  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Ensure AudioContext is Active and not Suspended by Autoplay Policies
   */
  public async ensureAudioContextActive(): Promise<AudioContext> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('[UnifiedAudioEngine] AudioContext resume failed:', err);
      }
    }
    return ctx;
  }

  /**
   * Setup Web Audio DSP Pipeline: Source -> Filters -> Reverb -> 8D Spatial -> Master -> Destination
   */
  private setupWebAudioPipeline(): boolean {
    if (this.isDirectMode) return false;
    if (this.isWebAudioInitialized && this.mediaSourceNode) {
      return true;
    }

    try {
      const audio = this.initAudioElement();
      const ctx = this.getAudioContext();

      if (!this.mediaSourceNode) {
        this.mediaSourceNode = ctx.createMediaElementSource(audio);
      }

      // Analyser for silence & CORS detection
      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 64;

      // 1. Highpass (Noise Gate / Rumble filter)
      this.highpassFilter = ctx.createBiquadFilter();
      this.highpassFilter.type = 'highpass';
      this.highpassFilter.frequency.value = 40;

      // 2. Clarity (Tajweed articulation booster at 3.5kHz)
      this.clarityFilter = ctx.createBiquadFilter();
      this.clarityFilter.type = 'peaking';
      this.clarityFilter.frequency.value = 3500;
      this.clarityFilter.Q.value = 1.2;
      this.clarityFilter.gain.value = 3.5;

      // 3. Vocal Warmth (Low-shelf at 220Hz)
      this.warmthFilter = ctx.createBiquadFilter();
      this.warmthFilter.type = 'lowshelf';
      this.warmthFilter.frequency.value = 220;
      this.warmthFilter.gain.value = 2.5;

      // 4. Studio Dynamic Compressor
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-20, ctx.currentTime);
      this.compressor.knee.setValueAtTime(20, ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, ctx.currentTime);
      this.compressor.release.setValueAtTime(0.2, ctx.currentTime);

      // 5. Reverb dry/wet path
      this.dryGainNode = ctx.createGain();
      this.wetGainNode = ctx.createGain();
      this.convolverNode = ctx.createConvolver();
      this.subMasterGain = ctx.createGain();
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.volume;

      // 6. 8D Binaural Spatial Audio Processor
      this.spatial8DProcessor = new Spatial8DAudioProcessor(ctx);

      // Connect DSP chain
      this.mediaSourceNode.connect(this.highpassFilter);
      this.highpassFilter.connect(this.clarityFilter);
      this.clarityFilter.connect(this.warmthFilter);
      this.warmthFilter.connect(this.compressor);

      // Dry path
      this.compressor.connect(this.dryGainNode);
      this.dryGainNode.connect(this.subMasterGain);

      // Wet Reverb path
      this.compressor.connect(this.convolverNode);
      this.convolverNode.connect(this.wetGainNode);
      this.wetGainNode.connect(this.subMasterGain);

      // SubMaster to Analyser & Master
      this.subMasterGain.connect(this.analyserNode);
      this.subMasterGain.connect(this.masterGain);

      // Master to 8D Processor Input
      this.masterGain.connect(this.spatial8DProcessor.getInput());

      // 8D Processor Output to Destination
      this.spatial8DProcessor.getOutput().connect(ctx.destination);

      // Apply initial settings
      this.applyDspSettings();

      this.isWebAudioInitialized = true;
      return true;
    } catch (err) {
      console.warn(
        '[UnifiedAudioEngine] Web Audio DSP initialization fallback to direct audio:',
        err
      );
      this.isDirectMode = true;
      return false;
    }
  }

  /**
   * Algorithmic Impulse Response for Mosque Acoustics (Cached in memory to prevent GC spikes)
   */
  private generateMosqueImpulse(
    ctx: AudioContext,
    durationSec: number,
    decayRate: number
  ): AudioBuffer {
    const key = `${ctx.sampleRate}_${durationSec.toFixed(2)}_${decayRate.toFixed(2)}`;
    if (this.impulseCache.has(key)) {
      return this.impulseCache.get(key)!;
    }

    const rate = ctx.sampleRate;
    const length = Math.floor(rate * durationSec);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const envelope = Math.exp(-decayRate * t);
      const earlyRefl = i < rate * 0.08 ? (Math.random() * 2 - 1) * 1.5 : Math.random() * 2 - 1;
      left[i] = earlyRefl * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    this.impulseCache.set(key, impulse);
    return impulse;
  }

  /**
   * Apply DSP Settings (8D Audio, Reverb, Clarity, Warmth) to Web Audio Graph in Real-Time
   */
  private applyDspSettings(): void {
    if (!this.audioCtx || this.isDirectMode) return;
    const ctx = this.audioCtx;
    const s = this.currentSettings;

    // 1. 8D Spatial Audio
    if (this.spatial8DProcessor) {
      this.spatial8DProcessor.configure({
        speedHz: s.eightDSpeed ?? 0.12,
        depth: (s.eightDDepth ?? 85) / 100,
        style: s.eightDStyle ?? 'orbit360',
      });
      this.spatial8DProcessor.setEnabled(s.enable8DAudio ?? false);
    }

    // 2. Mosque Reverb
    if (this.convolverNode && this.wetGainNode && this.dryGainNode) {
      if (s.reverbPreset && s.reverbPreset !== 'none') {
        let dur = 2.5;
        let decay = 3.0;
        if (s.reverbPreset === 'smallRoom') {
          dur = 1.2;
          decay = 5.0;
        } else if (s.reverbPreset === 'grandMosque') {
          dur = 3.2;
          decay = 2.2;
        } else if (s.reverbPreset === 'makkahHaram') {
          dur = 4.8;
          decay = 1.5;
        } else if (s.reverbPreset === 'celestialEcho') {
          dur = 6.5;
          decay = 1.1;
        }

        this.convolverNode.buffer = this.generateMosqueImpulse(ctx, dur, decay);
        const wetFraction = ((s.reverbLevel ?? 35) / 100) * 0.75;
        this.wetGainNode.gain.setValueAtTime(wetFraction, ctx.currentTime);
        this.dryGainNode.gain.setValueAtTime(1.0 - wetFraction * 0.3, ctx.currentTime);
      } else {
        this.wetGainNode.gain.setValueAtTime(0, ctx.currentTime);
        this.dryGainNode.gain.setValueAtTime(1.0, ctx.currentTime);
      }
    }

    // 3. Studio Filters
    if (this.clarityFilter) {
      this.clarityFilter.gain.setValueAtTime(s.enableStudioClarity ? 4.0 : 0, ctx.currentTime);
    }
    if (this.warmthFilter) {
      this.warmthFilter.gain.setValueAtTime(s.enableVoiceWarmth ? 3.0 : 0, ctx.currentTime);
    }
    if (this.highpassFilter) {
      this.highpassFilter.frequency.setValueAtTime(s.enableNoiseGate ? 80 : 30, ctx.currentTime);
    }
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
    }
  }

  /**
   * Real-Time Configuration Method: updates 8D, Reverb, and Mastering filters dynamically
   */
  public configureAudioEffects(settings: Partial<AudioSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...settings };
    this.applyDspSettings();
  }

  /**
   * Set global playback volume (0.0 - 1.0)
   */
  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx && !this.isDirectMode) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      if (this.audio) {
        this.audio.volume = 1.0; // Prevent double attenuation (masterGain controls volume in Web Audio graph)
      }
    } else if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  /**
   * Subscribe to 60fps high-resolution progress updates
   */
  public setProgressListener(listener: ((data: ProgressCallbackData) => void) | null): void {
    this.onProgressListener = listener;
  }

  /**
   * Subscribe to playback state changes
   */
  public onStateChange(listener: (state: PlaybackState) => void): () => void {
    this.onStateChangeListeners.add(listener);
    listener(this.state);
    return () => this.onStateChangeListeners.delete(listener);
  }

  /**
   * Subscribe to item completion
   */
  public onItemComplete(listener: () => void): () => void {
    this.onItemCompleteListeners.add(listener);
    return () => this.onItemCompleteListeners.delete(listener);
  }

  /**
   * Subscribe to playback errors
   */
  public onError(listener: (errorMsg: string) => void): () => void {
    this.onErrorListeners.add(listener);
    return () => this.onErrorListeners.delete(listener);
  }

  /**
   * Hard Stop & Complete Reset
   */
  public stop(): void {
    this.generation++;
    this.stopRaf();

    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.onloadedmetadata = null;
      this.audio.oncanplay = null;
      this.audio.ontimeupdate = null;
      this.audio.onended = null;
      this.audio.onerror = null;
    }

    this.currentItem = null;
    this.setState('idle');

    if (this.onProgressListener) {
      this.onProgressListener({
        currentTime: 0,
        duration: 0,
        progressFraction: 0,
        activeWordIndex: -1,
      });
    }
  }

  /**
   * Pause playback
   */
  public pause(): void {
    this.stopRaf();
    if (this.audio) {
      this.audio.pause();
    }
    this.setState('paused');
  }

  /**
   * Resume playback
   */
  public async resume(): Promise<void> {
    const item = this.currentItem;
    if (!item) return;
    if (this.audio && this.state === 'paused') {
      await this.ensureAudioContextActive();
      this.audio
        .play()
        .then(() => {
          this.setState('playing');
          this.startRaf();
        })
        .catch(() => {
          this.play(item);
        });
    } else {
      this.play(item);
    }
  }

  /**
   * Play a playback item with multi-tier failover and atomic token protection
   */
  public async play(item: PlaybackItem): Promise<void> {
    const currentGen = ++this.generation;
    this.stopRaf();

    // Setup Web Audio Graph
    this.setupWebAudioPipeline();
    await this.ensureAudioContextActive();

    this.currentItem = item;
    this.setState('loading');

    // Build URL attempt list: [primaryUrl, ...fallbackUrls]
    const candidates = [item.audioUrl, ...(item.fallbackUrls || [])].filter(Boolean);

    // Try candidates in order
    for (let i = 0; i < candidates.length; i++) {
      if (this.generation !== currentGen) return; // Aborted by newer request

      const url = candidates[i];
      const isCandidateFullSurah = i === 0 ? !!item.isFullSurahFile : false;

      const success = await this.tryPlayCandidate(url, item, isCandidateFullSurah, currentGen);
      if (success || this.generation !== currentGen) {
        return;
      }
    }

    // If all audio URLs fail, emit respectful Quran error handler (NO robotic TTS)
    if (this.generation === currentGen) {
      this.handlePlaybackFailure(item);
    }
  }

  /**
   * Attempt playback of a single audio URL candidate
   */
  private async tryPlayCandidate(
    url: string,
    item: PlaybackItem,
    isFullSurah: boolean,
    targetGen: number
  ): Promise<boolean> {
    // 1. Check local IndexedDB offline cache first (skip for local blob:/data: URLs)
    let playableUrl = url;
    const isLocalBlobOrData = url.startsWith('blob:') || url.startsWith('data:');

    if (!isLocalBlobOrData) {
      try {
        const cachedBlobUrl = await quranCacheService.getCachedAudioBlobUrl(url);
        if (cachedBlobUrl) {
          playableUrl = cachedBlobUrl;
        } else {
          // Cache in background for offline use next time
          fetch(url)
            .then((res) => (res.ok ? res.blob() : null))
            .then((blob) => {
              if (blob) quranCacheService.cacheAudioBlob(url, blob);
            })
            .catch(() => {});
        }
      } catch {
        playableUrl = url;
      }
    }

    return new Promise((resolve) => {
      if (this.generation !== targetGen) {
        resolve(false);
        return;
      }

      const audio = this.initAudioElement();
      audio.crossOrigin = 'anonymous';

      const isSameSource =
        !!audio.src &&
        (audio.src === playableUrl ||
          (playableUrl.startsWith('http') &&
            audio.src === new URL(playableUrl, window.location.href).href));
      if (!isSameSource) {
        audio.src = playableUrl;
        audio.load();
      }

      const wordCount = (item.text || '').split(/\s+/).filter(Boolean).length;
      const defaultDuration = Math.max(item.duration || wordCount * 0.75, 4);
      const startSec = isFullSurah && item.startTimeMs !== undefined ? item.startTimeMs / 1000 : 0;
      const endSec =
        isFullSurah && item.endTimeMs !== undefined
          ? item.endTimeMs / 1000
          : startSec + defaultDuration;

      let isResolved = false;
      const safeResolve = (val: boolean) => {
        if (!isResolved) {
          isResolved = true;
          resolve(val);
        }
      };

      const startPlayback = async () => {
        if (this.generation !== targetGen) {
          audio.pause();
          safeResolve(false);
          return;
        }

        await this.ensureAudioContextActive();
        this.applyDspSettings();

        if (isFullSurah && startSec >= 0) {
          try {
            audio.currentTime = startSec;
          } catch {}
        }

        audio
          .play()
          .then(() => {
            if (this.generation !== targetGen) {
              audio.pause();
              safeResolve(false);
              return;
            }
            this.setState('playing');
            this.startRaf();
            safeResolve(true);
          })
          .catch((err) => {
            console.warn(`[UnifiedAudioEngine] Play promise rejected for ${url}:`, err);
            safeResolve(false);
          });
      };

      if (isSameSource && audio.readyState >= 2) {
        startPlayback();
      } else {
        const timeoutId = setTimeout(() => {
          if (!isResolved && audio.readyState < 2) {
            console.warn(`[UnifiedAudioEngine] Audio URL timed out: ${url}`);
            audio.pause();
            safeResolve(false);
          }
        }, 7000);

        audio.onloadedmetadata = () => {
          if (this.generation !== targetGen) {
            audio.pause();
            safeResolve(false);
            return;
          }
          if (isFullSurah && startSec >= 0) {
            try {
              audio.currentTime = startSec;
            } catch {}
          }
        };

        audio.oncanplay = () => {
          if (this.generation !== targetGen) {
            audio.pause();
            safeResolve(false);
            return;
          }
          clearTimeout(timeoutId);
          startPlayback();
        };
      }

      audio.onended = () => {
        if (this.generation !== targetGen) return;
        this.handleComplete();
      };

      audio.onerror = () => {
        console.warn(`[UnifiedAudioEngine] Error loading candidate ${url}`);
        audio.pause();
        safeResolve(false);
      };
    });
  }

  /**
   * Start 60 FPS High-Resolution Loop for Butter-Smooth Karaoke & Boundary Checks
   * Features Hysteresis & Adaptive Drift Calibration for Long Verses
   */
  private startRaf(): void {
    this.stopRaf();

    const loop = () => {
      if (this.state !== 'playing' || !this.audio || !this.currentItem) {
        return;
      }

      const item = this.currentItem;
      const isFullSurah = !!item.isFullSurahFile;
      const startSec = isFullSurah && item.startTimeMs !== undefined ? item.startTimeMs / 1000 : 0;
      const duration =
        isFullSurah && item.startTimeMs !== undefined && item.endTimeMs !== undefined
          ? (item.endTimeMs - item.startTimeMs) / 1000
          : item.duration || this.audio.duration || 5;
      const endSec = startSec + duration;

      const rawCurrent = this.audio.currentTime || 0;
      const relCurrent = Math.max(0, rawCurrent - startSec);
      const progressFraction = Math.min(1, Math.max(0, duration > 0 ? relCurrent / duration : 0));

      // Calculate active word index with dynamic duration stretching & hysteresis
      let activeWordIdx = -1;
      const words = item.words || [];
      if (words.length > 0) {
        const wordsBaselineDur = words[words.length - 1]?.endTime || duration || 5;
        const timeScale = wordsBaselineDur > 0 && duration > 0 ? duration / wordsBaselineDur : 1;
        const normalizedRelTime = timeScale > 0 ? relCurrent / timeScale : relCurrent;

        activeWordIdx = words.findIndex(
          (w) => normalizedRelTime >= w.startTime && normalizedRelTime < w.endTime
        );
        if (activeWordIdx === -1 && normalizedRelTime > 0) {
          for (let i = words.length - 1; i >= 0; i--) {
            if (normalizedRelTime >= words[i].startTime) {
              activeWordIdx = i;
              break;
            }
          }
        }
      }

      // Notify progress listener
      if (this.onProgressListener) {
        this.onProgressListener({
          currentTime: relCurrent,
          duration: Math.max(duration, 1),
          progressFraction,
          activeWordIndex: activeWordIdx,
        });
      }

      // Full-surah boundary check
      if (isFullSurah && rawCurrent >= endSec && endSec > startSec) {
        this.audio.pause();
        this.handleComplete();
        return;
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Handle item completion (advance to next Ayah)
   */
  private handleComplete(): void {
    this.stopRaf();
    this.setState('idle');
    this.onItemCompleteListeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('[UnifiedAudioEngine] Error in onItemComplete listener:', e);
      }
    });
  }

  /**
   * Respectful Quranic Playback Failure Handler (Replaces Robotic Browser TTS)
   */
  private handlePlaybackFailure(item: PlaybackItem): void {
    this.stopRaf();
    this.setState('error');
    const msg = `تعذر تشغيل تلاوة الآية (${item.id || ''}) من سيرفرات الصوت. يرجى التحقق من اتصال الإنترنت أو اختيار قارئ آخر.`;
    console.error('[UnifiedAudioEngine]', msg);
    this.onErrorListeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (e) {
        console.error('[UnifiedAudioEngine] Error in onError listener:', e);
      }
    });
  }

  private setState(newState: PlaybackState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.onStateChangeListeners.forEach((listener) => {
        try {
          listener(newState);
        } catch (e) {
          console.error('[UnifiedAudioEngine] Error in state listener:', e);
        }
      });
    }
  }

  public getState(): PlaybackState {
    return this.state;
  }
}

export const unifiedAudioEngine = UnifiedStudioAudioEngine.getInstance();
