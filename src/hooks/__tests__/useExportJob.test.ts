import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportJobStatus, ExportJobState } from '../useExportJob';
import * as exportOrchestrator from '../../services/exportOrchestrator';

vi.mock('../../services/exportOrchestrator', () => ({
  exportProject: vi.fn(),
  PLATFORM_PRESETS: [],
  ASPECT_RATIO_DIMENSIONS: {},
  QUALITY_BITRATES: {},
}));

// State machine transition model mirroring useExportJob
class ExportJobStateMachine {
  public state: ExportJobState = {
    status: 'idle',
    isExporting: false,
    progress: 0,
    phase: '',
    error: null,
    result: null,
    downloadBlobUrl: null,
  };

  public mapProgressToStatus(percent: number, phaseStr: string): ExportJobStatus {
    const phase = phaseStr.toLowerCase();
    if (percent >= 95 || phase.includes('دمج') || phase.includes('finalizing') || phase.includes('حفظ')) {
      return 'finalizing';
    }
    if (percent > 8 || phase.includes('تصيير') || phase.includes('encoding') || phase.includes('إطار')) {
      return 'encoding';
    }
    return 'preparing';
  }

  public async startExport(options: exportOrchestrator.ExportProjectOptions): Promise<exportOrchestrator.ExportResult> {
    this.state = {
      status: 'preparing',
      isExporting: true,
      progress: 0,
      phase: 'جاري تهيئة منصة التصيير والموارد...',
      error: null,
      result: null,
      downloadBlobUrl: null,
    };

    try {
      const result = await exportOrchestrator.exportProject({
        ...options,
        onProgress: (evt) => {
          this.state.status = this.mapProgressToStatus(evt.percent, evt.phase);
          this.state.progress = evt.percent;
          this.state.phase = evt.phase;
          this.state.currentFrame = evt.currentFrame;
          this.state.totalFrames = evt.totalFrames;
          this.state.fps = evt.fps;
        },
      });

      if (result.success) {
        this.state = {
          ...this.state,
          status: 'done',
          isExporting: false,
          progress: 100,
          phase: 'اكتمل التصدير بنجاح! 🚀',
          result,
        };
        return result;
      } else {
        this.state = {
          ...this.state,
          status: 'error',
          isExporting: false,
          error: result.error || 'فشلت عملية التصدير',
          result,
        };
        return result;
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Export error';
      this.state = {
        ...this.state,
        status: 'error',
        isExporting: false,
        error: msg,
      };
      return { success: false, error: msg };
    }
  }

  public cancelExport() {
    this.state.status = 'cancelled';
    this.state.isExporting = false;
    this.state.phase = 'تم إلغاء التصدير';
  }

  public reset() {
    this.state = {
      status: 'idle',
      isExporting: false,
      progress: 0,
      phase: '',
      error: null,
      result: null,
      downloadBlobUrl: null,
    };
  }
}

describe('useExportJob state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with idle state', () => {
    const job = new ExportJobStateMachine();
    expect(job.state.status).toBe('idle');
    expect(job.state.isExporting).toBe(false);
    expect(job.state.progress).toBe(0);
    expect(job.state.error).toBeNull();
  });

  it('transitions from preparing -> encoding -> finalizing -> done upon success', async () => {
    const job = new ExportJobStateMachine();
    const mockExportProject = vi.mocked(exportOrchestrator.exportProject);

    mockExportProject.mockImplementation(async (opts) => {
      opts.onProgress?.({ phase: 'تحضير الصوتيات والمصادر...', percent: 5 });
      expect(job.state.status).toBe('preparing');

      opts.onProgress?.({ phase: 'تصيير الإطارات (50/100)...', percent: 50, currentFrame: 50, totalFrames: 100, fps: 60 });
      expect(job.state.status).toBe('encoding');
      expect(job.state.currentFrame).toBe(50);
      expect(job.state.fps).toBe(60);

      opts.onProgress?.({ phase: 'دمج الصوت وحفظ الفيديو...', percent: 98 });
      expect(job.state.status).toBe('finalizing');

      return {
        success: true,
        engine: 'webcodecs',
        durationSec: 15,
        fileSizeBytes: 4096000,
      };
    });

    const result = await job.startExport({
      projectName: 'Viral Surah Reel',
      ayahs: [],
    });

    expect(result.success).toBe(true);
    expect(job.state.status).toBe('done');
    expect(job.state.isExporting).toBe(false);
    expect(job.state.progress).toBe(100);
    expect(job.state.result?.engine).toBe('webcodecs');
  });

  it('transitions to error state upon export failure', async () => {
    const job = new ExportJobStateMachine();
    const mockExportProject = vi.mocked(exportOrchestrator.exportProject);

    mockExportProject.mockResolvedValueOnce({
      success: false,
      error: 'فشل في تشغيل محرك WebCodecs',
    });

    const result = await job.startExport({
      projectName: 'Failing Project',
      ayahs: [],
    });

    expect(result.success).toBe(false);
    expect(job.state.status).toBe('error');
    expect(job.state.isExporting).toBe(false);
    expect(job.state.error).toBe('فشل في تشغيل محرك WebCodecs');
  });

  it('handles cancellation and reset correctly', () => {
    const job = new ExportJobStateMachine();
    job.cancelExport();
    expect(job.state.status).toBe('cancelled');
    expect(job.state.isExporting).toBe(false);

    job.reset();
    expect(job.state.status).toBe('idle');
    expect(job.state.progress).toBe(0);
  });
});
