import { MosqueReverbPreset, Spatial8DStyle } from '../types';
import { Spatial8DAudioProcessor, Spatial8DState } from './spatial8DAudioEngine';

export interface MasteringOptions {
  reverbPreset: MosqueReverbPreset;
  reverbLevel: number; // 0 - 100
  enableNoiseGate: boolean;
  enableClarity: boolean;
  enableWarmth: boolean;
  recitationVolume: number; // 0 - 100
  enablePitchPolish?: boolean;
  pitchPolishLevel?: number; // 0 - 100
  // 8D Binaural Spatial Audio
  enable8DAudio?: boolean;
  eightDSpeed?: number;
  eightDDepth?: number;
  eightDStyle?: Spatial8DStyle;
}

export class VoiceStudioEngine {
  private static instance: VoiceStudioEngine;
  private audioCtx: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private previewSource: AudioBufferSourceNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private isPlayingPreview: boolean = false;
  private spatial8DProcessor: Spatial8DAudioProcessor | null = null;
  private impulseCache = new Map<string, AudioBuffer>();

  private constructor() {}

  public static getInstance(): VoiceStudioEngine {
    if (!VoiceStudioEngine.instance) {
      VoiceStudioEngine.instance = new VoiceStudioEngine();
    }
    return VoiceStudioEngine.instance;
  }

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
   * Start Live Microphone Recording
   */
  public async startRecording(onVolumeLevel?: (vol: number) => void): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
    this.recordedChunks = [];

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false, // We use our own high-fidelity DSP
        autoGainControl: true,
      },
    });

    const source = ctx.createMediaStreamSource(this.stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    // Audio level meter loop
    if (onVolumeLevel) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') return;
        this.analyser!.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        onVolumeLevel(normalized);
        requestAnimationFrame(checkLevel);
      };
      requestAnimationFrame(checkLevel);
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };
    this.mediaRecorder.start(100);
  }

  /**
   * Stop Live Recording and return Audio Blob & URL
   */
  public async stopRecording(): Promise<{ blob: Blob; url: string; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recorder'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm',
        });
        const url = URL.createObjectURL(blob);

        try {
          const ctx = this.getAudioContext();
          const arrayBuffer = await blob.arrayBuffer();
          this.currentBuffer = await ctx.decodeAudioData(arrayBuffer);
          const duration = this.currentBuffer.duration;
          resolve({ blob, url, duration });
        } catch {
          // Fallback if decode fails
          resolve({ blob, url, duration: 10 });
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Load External Audio File (MP3, WAV, M4A) into Studio Buffer
   */
  public async loadAudioFile(file: File): Promise<{ blob: Blob; url: string; duration: number }> {
    const ctx = this.getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    this.currentBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const url = URL.createObjectURL(file);
    return { blob: file, url, duration: this.currentBuffer.duration };
  }

  /**
   * Load Audio Blob into Studio Buffer
   */
  public async loadAudioBlob(blob: Blob): Promise<{ blob: Blob; url: string; duration: number }> {
    const ctx = this.getAudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    this.currentBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const url = URL.createObjectURL(blob);
    return { blob, url, duration: this.currentBuffer.duration };
  }

  /**
   * Generate Algorithmic Spatial Impulse Response for Mosque Acoustics (Cached in memory)
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
      // Multi-exponential decay curve simulating vast stone dome reflections
      const envelope = Math.exp(-decayRate * t);
      // Diffuse noise with randomized early reflections
      const earlyRefl = i < rate * 0.08 ? (Math.random() * 2 - 1) * 1.5 : Math.random() * 2 - 1;
      left[i] = earlyRefl * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    this.impulseCache.set(key, impulse);
    return impulse;
  }

  /**
   * Play Processed Audio with Real-Time Mosque Reverb & Mastering Filters
   */
  public playPreview(options: MasteringOptions, onEnded?: () => void): void {
    if (!this.currentBuffer) return;
    this.stopPreview();

    const ctx = this.getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = this.currentBuffer;

    // 1. High-Pass Noise Gate (Cuts mic rumbles < 85Hz)
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = options.enableNoiseGate ? 85 : 20;

    // 2. Clarity Tajweed Peaking Filter (Boosts articulation at 3.5kHz)
    const clarity = ctx.createBiquadFilter();
    clarity.type = 'peaking';
    clarity.frequency.value = 3500;
    clarity.Q.value = 1.2;
    clarity.gain.value = options.enableClarity ? 4.5 : 0;

    // 3. Vocal Warmth Low-Shelf (Adds majestic body at 200Hz)
    const warmth = ctx.createBiquadFilter();
    warmth.type = 'lowshelf';
    warmth.frequency.value = 220;
    warmth.gain.value = options.enableWarmth ? 3.5 : 0;

    // 4. Studio Dynamic Compressor
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-22, ctx.currentTime);
    compressor.knee.setValueAtTime(25, ctx.currentTime);
    compressor.ratio.setValueAtTime(8, ctx.currentTime);
    compressor.attack.setValueAtTime(0.004, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    // 5. Auto-Pitch Harmonic Polisher & Sheen (3-Band Air & Formant Exciter)
    const pitchSheen = ctx.createBiquadFilter();
    pitchSheen.type = 'highshelf';
    pitchSheen.frequency.value = 8000;
    const pitchLevel = options.pitchPolishLevel ?? 50;
    pitchSheen.gain.value = options.enablePitchPolish ? 2.5 + (pitchLevel / 100) * 4.5 : 0;

    const formantSweetener = ctx.createBiquadFilter();
    formantSweetener.type = 'peaking';
    formantSweetener.frequency.value = 2400;
    formantSweetener.Q.value = 1.2;
    formantSweetener.gain.value = options.enablePitchPolish ? 2.0 + (pitchLevel / 100) * 3.0 : 0;

    // 6. Mosque Spatial Reverb Setup
    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const subMasterGain = ctx.createGain();
    const masterGain = ctx.createGain();
    masterGain.gain.value = options.recitationVolume / 100;

    let convolver: ConvolverNode | null = null;

    if (options.reverbPreset !== 'none') {
      convolver = ctx.createConvolver();
      let durationSec = 2.5;
      let decayRate = 3.0;

      if (options.reverbPreset === 'smallRoom') {
        durationSec = 1.2;
        decayRate = 5.0;
      } else if (options.reverbPreset === 'grandMosque') {
        durationSec = 3.2;
        decayRate = 2.2;
      } else if (options.reverbPreset === 'makkahHaram') {
        durationSec = 4.8;
        decayRate = 1.5;
      } else if (options.reverbPreset === 'celestialEcho') {
        durationSec = 6.5;
        decayRate = 1.1;
      }

      convolver.buffer = this.generateMosqueImpulse(ctx, durationSec, decayRate);

      const wetFraction = (options.reverbLevel / 100) * 0.75;
      wetGain.gain.value = wetFraction;
      dryGain.gain.value = 1.0 - wetFraction * 0.3;
    } else {
      dryGain.gain.value = 1.0;
      wetGain.gain.value = 0.0;
    }

    // Connect Primary DSP Chain
    source.connect(highpass);
    highpass.connect(clarity);
    clarity.connect(warmth);
    warmth.connect(pitchSheen);
    pitchSheen.connect(formantSweetener);
    formantSweetener.connect(compressor);

    // Dry & Reverb Mix path into SubMaster
    compressor.connect(dryGain);
    dryGain.connect(subMasterGain);

    if (convolver) {
      compressor.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(subMasterGain);
    }

    // Connect SubMaster to Master
    subMasterGain.connect(masterGain);

    // 7. 8D Binaural Spatial Audio Processor (360-Degree Orbital Panning)
    if (options.enable8DAudio) {
      if (!this.spatial8DProcessor) {
        this.spatial8DProcessor = new Spatial8DAudioProcessor(ctx);
      }
      this.spatial8DProcessor.configure({
        speedHz: options.eightDSpeed ?? 0.12,
        depth: (options.eightDDepth ?? 85) / 100,
        style: options.eightDStyle ?? 'orbit360',
      });
      this.spatial8DProcessor.setEnabled(true);

      masterGain.connect(this.spatial8DProcessor.getInput());
      this.spatial8DProcessor.getOutput().connect(ctx.destination);
    } else {
      if (this.spatial8DProcessor) {
        this.spatial8DProcessor.setEnabled(false);
      }
      masterGain.connect(ctx.destination);
    }

    source.onended = () => {
      this.isPlayingPreview = false;
      if (onEnded) onEnded();
    };

    source.start(0);
    this.previewSource = source;
    this.isPlayingPreview = true;
  }

  /**
   * Stop Active Audio Preview
   */
  public stopPreview(): void {
    if (this.previewSource) {
      try {
        this.previewSource.stop();
        this.previewSource.disconnect();
      } catch {
        // Source already stopped
      }
      this.previewSource = null;
    }
    if (this.spatial8DProcessor) {
      this.spatial8DProcessor.setEnabled(false);
    }
    this.isPlayingPreview = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlayingPreview;
  }

  public get8DState(): Spatial8DState | null {
    return this.spatial8DProcessor ? this.spatial8DProcessor.getCurrentState() : null;
  }
}

export const voiceStudioEngine = VoiceStudioEngine.getInstance();
