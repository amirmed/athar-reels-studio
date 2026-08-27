/**
 * Athar Studio - 8D Binaural Spatial Audio Engine
 * Real-time 360° orbital spatial audio processor and offline 8D audio buffer renderer.
 */

import { Spatial8DStyle } from '../types';

export interface Spatial8DState {
  x: number; // -1 (Left) to +1 (Right)
  y: number; // -1 (Bottom) to +1 (Top/Elevation)
  z: number; // -1 (Back) to +1 (Front)
  angleDeg: number; // 0 to 360 degrees
  activeStyle: Spatial8DStyle;
}

export class Spatial8DAudioProcessor {
  private ctx: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private pannerNode: StereoPannerNode | null = null;
  private leftDelayNode: DelayNode;
  private rightDelayNode: DelayNode;
  private leftFilterNode: BiquadFilterNode;
  private rightFilterNode: BiquadFilterNode;
  private mergerNode: ChannelMergerNode;
  private splitterNode: ChannelSplitterNode;
  private isEnabled: boolean = false;
  private speedHz: number = 0.12;
  private depth: number = 0.85;
  private style: Spatial8DStyle = 'orbit360';
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private currentState: Spatial8DState = {
    x: 0,
    y: 0,
    z: 1,
    angleDeg: 0,
    activeStyle: 'orbit360',
  };

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();

    // Create Stereo Splitter & Merger
    this.splitterNode = ctx.createChannelSplitter(2);
    this.mergerNode = ctx.createChannelMerger(2);

    // Psychoacoustic Interaural Time Difference (ITD) Delays (up to 1.2ms)
    this.leftDelayNode = ctx.createDelay(0.01);
    this.rightDelayNode = ctx.createDelay(0.01);
    this.leftDelayNode.delayTime.value = 0.0002;
    this.rightDelayNode.delayTime.value = 0.0002;

    // Pinna Head-Shadowing Filters (HF attenuation when sound is on opposite side)
    this.leftFilterNode = ctx.createBiquadFilter();
    this.leftFilterNode.type = 'lowpass';
    this.leftFilterNode.frequency.value = 18000;

    this.rightFilterNode = ctx.createBiquadFilter();
    this.rightFilterNode.type = 'lowpass';
    this.rightFilterNode.frequency.value = 18000;

    // Stereo Panner Node if supported
    if (typeof ctx.createStereoPanner === 'function') {
      this.pannerNode = ctx.createStereoPanner();
    }

    // Connect DSP Chain
    if (this.pannerNode) {
      this.inputNode.connect(this.pannerNode);
      this.pannerNode.connect(this.splitterNode);
    } else {
      this.inputNode.connect(this.splitterNode);
    }

    // Left Channel Processing
    this.splitterNode.connect(this.leftDelayNode, 0);
    this.leftDelayNode.connect(this.leftFilterNode);
    this.leftFilterNode.connect(this.mergerNode, 0, 0);

    // Right Channel Processing
    this.splitterNode.connect(this.rightDelayNode, 1);
    this.rightDelayNode.connect(this.rightFilterNode);
    this.rightFilterNode.connect(this.mergerNode, 0, 1);

    this.mergerNode.connect(this.outputNode);

    this.startTime = performance.now() / 1000;
    this.startModulation();
  }

  public getInput(): GainNode {
    return this.inputNode;
  }

  public getOutput(): GainNode {
    return this.outputNode;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      if (this.pannerNode) {
        this.pannerNode.pan.setValueAtTime(0, this.ctx.currentTime);
      }
      this.leftDelayNode.delayTime.setValueAtTime(0, this.ctx.currentTime);
      this.rightDelayNode.delayTime.setValueAtTime(0, this.ctx.currentTime);
      this.leftFilterNode.frequency.setValueAtTime(20000, this.ctx.currentTime);
      this.rightFilterNode.frequency.setValueAtTime(20000, this.ctx.currentTime);
    }
  }

  public configure(options: { speedHz?: number; depth?: number; style?: Spatial8DStyle }): void {
    if (options.speedHz !== undefined)
      this.speedHz = Math.max(0.04, Math.min(0.4, options.speedHz));
    if (options.depth !== undefined) this.depth = Math.max(0.2, Math.min(1.0, options.depth));
    if (options.style !== undefined) this.style = options.style;
  }

  public getCurrentState(): Spatial8DState {
    return this.currentState;
  }

  private startModulation(): void {
    const updateLoop = () => {
      if (this.isEnabled && this.ctx.state === 'running') {
        const now = performance.now() / 1000;
        const elapsed = now - this.startTime;
        const phase = elapsed * this.speedHz * Math.PI * 2;

        let panX = 0;
        let elevY = 0;
        let depthZ = 1;

        switch (this.style) {
          case 'orbit360':
            // Full 360-degree continuous celestial orbit
            panX = Math.cos(phase) * this.depth;
            depthZ = Math.sin(phase) * this.depth;
            elevY = Math.sin(phase * 0.5) * 0.3 * this.depth;
            break;

          case 'makkahDome':
            // Infinity figure-8 ascension towards the Grand Mosque Dome
            panX = Math.sin(phase) * this.depth;
            elevY = Math.abs(Math.sin(phase * 2)) * 0.7 * this.depth;
            depthZ = Math.cos(phase) * this.depth;
            break;

          case 'pendulum':
            // Smooth horizontal pendulum sway with gentle depth
            panX = Math.sin(phase) * this.depth;
            depthZ = Math.abs(Math.cos(phase)) * this.depth * 0.6;
            elevY = 0;
            break;

          case 'floatingClouds':
            // 3D spiral vortex rotating slowly
            panX = Math.cos(phase) * Math.sin(phase * 0.3) * this.depth;
            elevY = Math.sin(phase * 0.7) * 0.5 * this.depth;
            depthZ = Math.sin(phase) * this.depth;
            break;
        }

        // Clamp panX to [-1, 1]
        const clampedPan = Math.max(-0.98, Math.min(0.98, panX));

        if (this.pannerNode) {
          this.pannerNode.pan.setTargetAtTime(clampedPan, this.ctx.currentTime, 0.03);
        }

        // ITD: Interaural Time Delay modulation (ear closest to sound receives it ~0.65ms earlier)
        const maxDelay = 0.00065 * this.depth;
        if (clampedPan > 0) {
          // Sound on Right -> Left ear delayed
          this.leftDelayNode.delayTime.setTargetAtTime(
            clampedPan * maxDelay,
            this.ctx.currentTime,
            0.03
          );
          this.rightDelayNode.delayTime.setTargetAtTime(0, this.ctx.currentTime, 0.03);
          // Head-shadowing: dampen higher frequencies in Left ear
          const cutoff = 18000 - clampedPan * 6000;
          this.leftFilterNode.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.03);
          this.rightFilterNode.frequency.setTargetAtTime(18000, this.ctx.currentTime, 0.03);
        } else {
          // Sound on Left -> Right ear delayed
          const absPan = Math.abs(clampedPan);
          this.rightDelayNode.delayTime.setTargetAtTime(
            absPan * maxDelay,
            this.ctx.currentTime,
            0.03
          );
          this.leftDelayNode.delayTime.setTargetAtTime(0, this.ctx.currentTime, 0.03);
          // Head-shadowing: dampen higher frequencies in Right ear
          const cutoff = 18000 - absPan * 6000;
          this.rightFilterNode.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.03);
          this.leftFilterNode.frequency.setTargetAtTime(18000, this.ctx.currentTime, 0.03);
        }

        // Calculate Angle in Degrees (0 - 360)
        let angle = Math.atan2(panX, depthZ) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        this.currentState = {
          x: clampedPan,
          y: elevY,
          z: depthZ,
          angleDeg: Math.round(angle),
          activeStyle: this.style,
        };
      }

      this.animationFrameId = requestAnimationFrame(updateLoop);
    };

    this.animationFrameId = requestAnimationFrame(updateLoop);
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

/**
 * Offline Renderer: Renders an AudioBuffer into true 8D Binaural Spatial Audio
 * Used during video export to guarantee sample-accurate 8D audio in MP4 files.
 */
export async function render8DSpatialBuffer(
  _audioCtx: AudioContext,
  sourceBuffer: AudioBuffer,
  options: {
    speedHz?: number;
    depth?: number;
    style?: Spatial8DStyle;
    makkahReverb?: boolean;
  }
): Promise<AudioBuffer> {
  const speedHz = options.speedHz ?? 0.12;
  const depth = options.depth ?? 0.85;
  const style = options.style ?? 'orbit360';
  const sampleRate = sourceBuffer.sampleRate;
  const length = sourceBuffer.length;

  const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

  // Buffer source
  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = sourceBuffer;

  // Split source to stereo channels
  const splitter = offlineCtx.createChannelSplitter(2);
  const merger = offlineCtx.createChannelMerger(2);

  // Left and Right Gain envelopes
  const leftGain = offlineCtx.createGain();
  const rightGain = offlineCtx.createGain();

  // Lowpass filters for head shadowing
  const leftFilter = offlineCtx.createBiquadFilter();
  leftFilter.type = 'lowpass';
  const rightFilter = offlineCtx.createBiquadFilter();
  rightFilter.type = 'lowpass';

  // Delays for Interaural Time Difference
  const leftDelay = offlineCtx.createDelay(0.01);
  const rightDelay = offlineCtx.createDelay(0.01);

  bufferSource.connect(splitter);

  // Left chain
  splitter.connect(leftGain, 0);
  leftGain.connect(leftDelay);
  leftDelay.connect(leftFilter);
  leftFilter.connect(merger, 0, 0);

  // Right chain
  splitter.connect(rightGain, sourceBuffer.numberOfChannels > 1 ? 1 : 0);
  rightGain.connect(rightDelay);
  rightDelay.connect(rightFilter);
  rightFilter.connect(merger, 0, 1);

  // Connect merger to destination
  merger.connect(offlineCtx.destination);

  // Schedule 8D automation curves across the entire duration
  const totalDuration = sourceBuffer.duration;
  const stepInterval = 0.05; // Update every 50ms
  const steps = Math.ceil(totalDuration / stepInterval);

  for (let s = 0; s <= steps; s++) {
    const time = s * stepInterval;
    const phase = time * speedHz * Math.PI * 2;

    let panX = 0;

    switch (style) {
      case 'orbit360':
        panX = Math.cos(phase) * depth;
        break;
      case 'makkahDome':
        panX = Math.sin(phase) * depth;
        break;
      case 'pendulum':
        panX = Math.sin(phase) * depth;
        break;
      case 'floatingClouds':
        panX = Math.cos(phase) * Math.sin(phase * 0.3) * depth;
        break;
    }

    const clampedPan = Math.max(-0.95, Math.min(0.95, panX));

    // Equal-power stereo panning curves
    const angleRad = (clampedPan + 1) * (Math.PI / 4);
    const lGainVal = Math.cos(angleRad);
    const rGainVal = Math.sin(angleRad);

    leftGain.gain.setValueAtTime(lGainVal, time);
    rightGain.gain.setValueAtTime(rGainVal, time);

    // ITD Delay automation
    const maxDelay = 0.00065 * depth;
    if (clampedPan > 0) {
      leftDelay.delayTime.setValueAtTime(clampedPan * maxDelay, time);
      rightDelay.delayTime.setValueAtTime(0, time);
      leftFilter.frequency.setValueAtTime(18000 - clampedPan * 6000, time);
      rightFilter.frequency.setValueAtTime(18000, time);
    } else {
      const absPan = Math.abs(clampedPan);
      rightDelay.delayTime.setValueAtTime(absPan * maxDelay, time);
      leftDelay.delayTime.setValueAtTime(0, time);
      rightFilter.frequency.setValueAtTime(18000 - absPan * 6000, time);
      leftFilter.frequency.setValueAtTime(18000, time);
    }
  }

  bufferSource.start(0);
  return offlineCtx.startRendering();
}
