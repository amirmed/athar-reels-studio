import { useState, useCallback, useRef, useEffect } from 'react';
import {
  exportProject,
  ExportProjectOptions,
  ExportProgressEvent,
  ExportResult,
} from '../services/exportOrchestrator';
import { logger } from '../utils/logger';

export type ExportJobStatus =
  | 'idle'
  | 'preparing'
  | 'encoding'
  | 'finalizing'
  | 'done'
  | 'error'
  | 'cancelled';

export interface ExportJobState {
  status: ExportJobStatus;
  isExporting: boolean;
  progress: number;
  phase: string;
  error: string | null;
  result: ExportResult | null;
  downloadBlobUrl: string | null;
  currentFrame?: number;
  totalFrames?: number;
  fps?: number;
  currentAyah?: number;
  totalAyahs?: number;
  elapsedSeconds?: number;
  estimatedSecondsRemaining?: number;
  engine?: 'ffmpeg' | 'webcodecs' | 'mediarecorder';
}

export interface UseExportJobReturn extends ExportJobState {
  startExport: (options: ExportProjectOptions) => Promise<ExportResult>;
  cancelExport: () => void;
  reset: () => void;
}

/**
 * Custom hook encapsulating the unified export state machine:
 * idle ➔ preparing ➔ encoding ➔ finalizing ➔ done (or error / cancelled)
 */
export function useExportJob(): UseExportJobReturn {
  const [state, setState] = useState<ExportJobState>({
    status: 'idle',
    isExporting: false,
    progress: 0,
    phase: '',
    error: null,
    result: null,
    downloadBlobUrl: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Clean up any generated blob URLs upon unmount or replacement
  const cleanupBlobUrl = useCallback(() => {
    if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(blobUrlRef.current);
      } catch (err) {
        logger.debug('[useExportJob] URL revoke error:', err);
      }
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupBlobUrl();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cleanupBlobUrl]);

  const mapProgressToStatus = (event: ExportProgressEvent): ExportJobStatus => {
    const p = event.percent;
    const phase = event.phase.toLowerCase();

    if (p >= 95 || phase.includes('دمج') || phase.includes('finalizing') || phase.includes('حفظ')) {
      return 'finalizing';
    }
    if (p > 8 || phase.includes('تصيير') || phase.includes('encoding') || phase.includes('إطار')) {
      return 'encoding';
    }
    return 'preparing';
  };

  const handleProgress = useCallback((event: ExportProgressEvent) => {
    const nextStatus = mapProgressToStatus(event);
    setState((prev) => ({
      ...prev,
      status: nextStatus,
      progress: Math.min(100, Math.max(0, Math.round(event.percent))),
      phase: event.phase || prev.phase,
      currentFrame: event.currentFrame,
      totalFrames: event.totalFrames,
      fps: event.fps,
      currentAyah: event.currentAyah,
      totalAyahs: event.totalAyahs,
      elapsedSeconds: event.elapsedSeconds,
      estimatedSecondsRemaining: event.estimatedSecondsRemaining,
      engine: event.engine || prev.engine,
    }));
  }, []);

  const startExport = useCallback(
    async (options: ExportProjectOptions): Promise<ExportResult> => {
      cleanupBlobUrl();
      abortControllerRef.current = new AbortController();

      setState({
        status: 'preparing',
        isExporting: true,
        progress: 0,
        phase: 'جاري تهيئة منصة التصيير والموارد...',
        error: null,
        result: null,
        downloadBlobUrl: null,
        engine: options.preferEngine !== 'auto' ? options.preferEngine : undefined,
      });

      try {
        const result = await exportProject({
          ...options,
          signal: abortControllerRef.current.signal,
          onProgress: (evt) => {
            handleProgress(evt);
            options.onProgress?.(evt);
          },
        });

        if (result.success) {
          let blobUrl: string | null = null;
          if (result.blob) {
            blobUrl = URL.createObjectURL(result.blob);
            blobUrlRef.current = blobUrl;
          }

          setState((prev) => ({
            ...prev,
            status: 'done',
            isExporting: false,
            progress: 100,
            phase: 'اكتمل التصدير بنجاح! 🚀',
            error: null,
            result,
            downloadBlobUrl: blobUrl,
            engine: result.engine || prev.engine,
          }));
          return result;
        } else {
          const errorMsg = result.error || 'فشلت عملية التصدير';
          setState((prev) => ({
            ...prev,
            status: 'error',
            isExporting: false,
            error: errorMsg,
            phase: 'تعذر إتمام التصدير',
            result,
          }));
          return result;
        }
      } catch (err: unknown) {
        if (
          (err instanceof DOMException && err.name === 'AbortError') ||
          (err as Error)?.message?.includes('aborted')
        ) {
          setState((prev) => ({
            ...prev,
            status: 'cancelled',
            isExporting: false,
            phase: 'تم إلغاء التصدير',
            error: null,
          }));
          return { success: false, error: 'تم إلغاء التصدير' };
        }

        const errorMsg = (err as Error)?.message || 'حدث خطأ غير متوقع أثناء معالجة وتصدير الفيديو';
        logger.error('[useExportJob] Export error:', err);

        setState((prev) => ({
          ...prev,
          status: 'error',
          isExporting: false,
          error: errorMsg,
          phase: 'خطأ في معالجة الفيديو',
          result: { success: false, error: errorMsg },
        }));

        return { success: false, error: errorMsg };
      }
    },
    [cleanupBlobUrl, handleProgress]
  );

  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      status: 'cancelled',
      isExporting: false,
      phase: 'تم إلغاء التصدير',
    }));
  }, []);

  const reset = useCallback(() => {
    cleanupBlobUrl();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({
      status: 'idle',
      isExporting: false,
      progress: 0,
      phase: '',
      error: null,
      result: null,
      downloadBlobUrl: null,
    });
  }, [cleanupBlobUrl]);

  return {
    ...state,
    startExport,
    cancelExport,
    reset,
  };
}

export default useExportJob;
