import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppLayout } from '../layout/AppLayout';
import { ExportProgress } from '../ui/ExportProgress';
import { EmptyState } from '../ui/EmptyState';
import { ExportJob, QuranWord } from '../../types';
import {
  fetchAyahsWithAudio,
  fetchTranslation,
  AyahData,
  TranslationData,
} from '../../services/quranApi';
import {
  Download,
  Smartphone,
  Monitor,
  Square,
  Check,
  Zap,
  Star,
  Crown,
  Play,
  Info,
  X,
} from 'lucide-react';

import { ViralCaptionGenerator } from '../ui/ViralCaptionGenerator';
import { PublishKitModal } from '../ui/PublishKitModal';
import { exportProject } from '../../services/exportOrchestrator';
import { synthesizeArabicSpeech } from '../../services/arabicTtsService';

// ==================== Export Page Component ====================
export const ExportPage: React.FC = () => {
  const exportJobs = useAppStore((s) => s.exportJobs);
  const currentProject = useAppStore((s) => s.currentProject);
  const addExportJob = useAppStore((s) => s.addExportJob);
  const updateExportJob = useAppStore((s) => s.updateExportJob);
  const addToast = useAppStore((s) => s.addToast);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const settings = useAppStore((s) => s.settings);

  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>(
    currentProject?.aspectRatio || '9:16'
  );
  const [quality, setQuality] = useState<'standard' | 'high' | 'premium'>('high');
  const [isExporting, setIsExporting] = useState(false);
  const [_exportProgress, setExportProgress] = useState(0);
  const [activePublishJob, setActivePublishJob] = useState<ExportJob | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Real export: delegates to unified ExportOrchestrator
  const performRealExport = useCallback(
    async (jobId: string) => {
      if (!currentProject) return;

      abortControllerRef.current = new AbortController();

      try {
        updateExportJob(jobId, { status: 'processing', progress: 5 });

        let ayahs: AyahData[] = [];
        if (
          currentProject.customText ||
          currentProject.contentType === 'hadith' ||
          currentProject.contentType === 'azkar'
        ) {
          const text = currentProject.customText || currentProject.name;
          let audioUrl = currentProject.customAudioUrl;
          let estimatedTotalSec = 10;

          if (!audioUrl && text) {
            try {
              const ttsResult = await synthesizeArabicSpeech(text, 'ar-SA-HamedNeural');
              audioUrl = ttsResult.audioUrl;
              if (ttsResult.duration > 0) {
                estimatedTotalSec = ttsResult.duration;
              }
            } catch (ttsErr) {
              console.warn('[ExportPage] synthesizeArabicSpeech error:', ttsErr);
            }
          }

          const rawWords = text.split(/\s+/).filter(Boolean);
          const totalWords = Math.max(rawWords.length, 1);
          const secPerWord = estimatedTotalSec / totalWords;

          const words: QuranWord[] = rawWords.map((w, idx) => ({
            id: idx + 1,
            position: idx + 1,
            text: w,
            startTime: idx * secPerWord,
            endTime: (idx + 1) * secPerWord,
            charTypeName: 'word',
          }));

          ayahs = [
            {
              number: 1,
              numberInSurah: 1,
              surahNumber: 0,
              surahName: currentProject.customTitle || currentProject.name,
              text: text,
              audioUrl: audioUrl || '',
              juz: 1,
              page: 1,
              words,
            },
          ];
        } else {
          const activeReciter =
            currentProject.reciterId === 'custom_voice' ||
            currentProject.audioSettings?.customRecordedAudioUrl
              ? 'alafasy_128'
              : currentProject.reciterId;
          ayahs = await fetchAyahsWithAudio(
            currentProject.surahNumber,
            currentProject.fromAyah,
            currentProject.toAyah,
            activeReciter
          );
          const customVoice =
            currentProject.audioSettings?.customRecordedAudioUrl || currentProject.customAudioUrl;
          if (
            customVoice &&
            (currentProject.reciterId === 'custom_voice' ||
              currentProject.audioSettings?.customRecordedAudioUrl ||
              currentProject.customAudioUrl)
          ) {
            ayahs.forEach((a, idx) => {
              if (idx === 0 || ayahs.length === 1) {
                a.audioUrl = customVoice;
              }
            });
          }
        }

        if (abortControllerRef.current?.signal.aborted) return;

        let translations: TranslationData[] = [];
        if (currentProject.translationEnabled && currentProject.surahNumber > 0) {
          translations = await fetchTranslation(
            currentProject.surahNumber,
            currentProject.fromAyah,
            currentProject.toAyah
          );
        }

        const enrichedAyahs = ayahs.map((a, idx) => ({
          ...a,
          translationText: translations[idx]?.text,
        }));

        const result = await exportProject({
          projectName: currentProject.name,
          surahName: currentProject.surah || '',
          reciterName: currentProject.reciter,
          aspectRatio,
          quality,
          backgroundPath: currentProject.backgroundUrl,
          backgroundOpacity: currentProject.backgroundOpacity ?? 0.6,
          ayahs: enrichedAyahs,
          textSettings: currentProject.textSettings,
          audioSettings: currentProject.audioSettings,
          watermark: currentProject.watermark,
          showTranslation: currentProject.translationEnabled,
          savePathPref: settings?.projectsPath
            ? `${settings.projectsPath}/${currentProject.name}.mp4`
            : undefined,
          signal: abortControllerRef.current?.signal,
          onProgress: (evt) => {
            updateExportJob(jobId, { progress: evt.percent });
            setExportProgress(evt.percent);
          },
        });

        if (result.success) {
          let savedPath: string | null = result.outputPath || null;
          if (result.blob && (!savedPath || (!savedPath.includes('/') && !savedPath.includes('\\')))) {
            const preferredPath = settings?.projectsPath
              ? `${settings.projectsPath.replace(/[/\\]+$/, '')}/${currentProject.name}.mp4`
              : undefined;
            savedPath = await saveVideoBlob(result.blob, currentProject.name, preferredPath);
          }

          const completedJob: ExportJob = {
            id: jobId,
            projectId: currentProject.id,
            projectName: currentProject.name,
            aspectRatio,
            quality,
            status: 'completed',
            progress: 100,
            outputPath: savedPath || undefined,
            downloadUrl: result.blobUrl,
            createdAt: new Date().toISOString(),
          };

          updateExportJob(jobId, completedJob);
          setIsExporting(false);
          setExportProgress(100);

          addToast({
            message: 'تم التصدير بنجاح! 🚀 اضغط لفتح عدة النشر والكابشن والهاشتاجات',
            type: 'success',
            duration: 8000,
            action: {
              label: 'عدة النشر 🚀',
              onClick: () => {
                setActivePublishJob(completedJob);
              },
            },
          });
        } else {
          throw new Error(result.error || 'فشلت عملية تصدير الفيديو');
        }
      } catch (error: unknown) {
        if (abortControllerRef.current?.signal.aborted) {
          updateExportJob(jobId, { status: 'failed', progress: 0 });
          return;
        }
        console.error('Export failed:', error);
        updateExportJob(jobId, { status: 'failed', progress: 0 });
        const errMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
        addToast({ message: `فشل التصدير: ${errMsg}`, type: 'error' });
      } finally {
        setIsExporting(false);
      }
    },
    [currentProject, aspectRatio, quality, updateExportJob, addToast, settings?.projectsPath]
  );

  const handleExport = async () => {
    if (!currentProject) {
      addToast({ message: 'يرجى اختيار مشروع أولاً', type: 'warning' });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    const newJob: ExportJob = {
      id: `exp-${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      aspectRatio,
      quality,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
      estimatedSize: quality === 'premium' ? '~45 MB' : quality === 'high' ? '~25 MB' : '~12 MB',
      estimatedDuration: `~${currentProject.toAyah - currentProject.fromAyah + 1} دقيقة`,
    };

    addExportJob(newJob);
    addToast({ message: 'تم بدء عملية التصدير', type: 'info' });

    await performRealExport(newJob.id);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (window.electronAPI?.videoExport?.cancel) {
      try {
        window.electronAPI.videoExport.cancel();
      } catch (err) {
        console.debug('[ExportPage] Cancel error:', err);
      }
    }
    setIsExporting(false);
    addToast({ message: 'تم إلغاء التصدير', type: 'warning' });
  };

  const handleRetry = (jobId: string) => {
    const job = exportJobs.find((j) => j.id === jobId);
    if (job) {
      updateExportJob(jobId, { status: 'processing', progress: 0 });
      setIsExporting(true);
      performRealExport(jobId);
    }
  };

  const aspectOptions = [
    {
      value: '9:16' as const,
      label: 'ريلز',
      sublabel: '1080×1920',
      icon: <Smartphone size={20} />,
    },
    { value: '16:9' as const, label: 'يوتيوب', sublabel: '1920×1080', icon: <Monitor size={20} /> },
    { value: '1:1' as const, label: 'مربع', sublabel: '1080×1080', icon: <Square size={20} /> },
  ];

  const qualityOptions = [
    {
      value: 'standard' as const,
      label: 'عادي',
      sublabel: '720p',
      icon: <Zap size={18} />,
      desc: 'حجم صغير، مناسب للمشاركة السريعة',
    },
    {
      value: 'high' as const,
      label: 'عالي',
      sublabel: '1080p',
      icon: <Star size={18} />,
      desc: 'جودة ممتازة للنشر على المنصات',
    },
    {
      value: 'premium' as const,
      label: 'ممتاز',
      sublabel: '1080p Pro',
      icon: <Crown size={18} />,
      desc: 'أعلى معدل بت سينمائي فائق النقاء (16 Mbps)',
    },
  ];

  const statusCounts = {
    pending: exportJobs.filter((j) => j.status === 'pending').length,
    processing: exportJobs.filter((j) => j.status === 'processing').length,
    completed: exportJobs.filter((j) => j.status === 'completed').length,
    failed: exportJobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <AppLayout title="التصدير" subtitle="تصدير وإدارة المخرجات">
      <div className="p-6 animate-in max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Export settings */}
          <div className="col-span-1 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center">
                  <Download size={20} className="text-accent-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-surface-50">تصدير جديد</h3>
                  <p className="text-xs text-surface-400">
                    {currentProject ? currentProject.name : 'لم يتم اختيار مشروع'}
                  </p>
                </div>
              </div>

              <div className="divider"></div>

              {/* Aspect ratio */}
              <div>
                <label className="label">المقاس</label>
                <div className="grid grid-cols-3 gap-3">
                  {aspectOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAspectRatio(opt.value)}
                      disabled={isExporting}
                      className={`
                        relative p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer
                        ${
                          aspectRatio === opt.value
                            ? 'bg-accent-500/10 border-accent-500/30'
                            : 'bg-surface-800/40 border-surface-700/40 hover:bg-surface-800/60 hover:border-surface-600'
                        }
                        disabled:opacity-50
                      `}
                    >
                      {aspectRatio === opt.value && (
                        <div className="absolute top-2 start-2 w-4 h-4 bg-accent-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                      <div
                        className={`mb-1.5 mx-auto w-fit ${aspectRatio === opt.value ? 'text-accent-400' : 'text-surface-400'}`}
                      >
                        {opt.icon}
                      </div>
                      <span
                        className={`text-xs font-bold block ${aspectRatio === opt.value ? 'text-accent-400' : 'text-surface-300'}`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-xs text-surface-400 block mt-0.5">{opt.sublabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="label">الجودة</label>
                <div className="space-y-2">
                  {qualityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setQuality(opt.value)}
                      disabled={isExporting}
                      className={`
                        w-full flex items-center gap-3 p-3.5 rounded-xl border text-start transition-all duration-200 cursor-pointer
                        ${
                          quality === opt.value
                            ? 'bg-accent-500/10 border-accent-500/30'
                            : 'bg-surface-800/40 border-surface-700/40 hover:bg-surface-800/60 hover:border-surface-600'
                        }
                        disabled:opacity-50
                      `}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          quality === opt.value
                            ? 'bg-accent-500/15 text-accent-400'
                            : 'bg-surface-700/50 text-surface-400'
                        }`}
                      >
                        {opt.icon}
                      </div>
                      <div className="flex-1">
                        <span
                          className={`text-sm font-bold block ${quality === opt.value ? 'text-accent-400' : 'text-surface-200'}`}
                        >
                          {opt.label}
                          <span className="text-xs text-surface-400 me-2">{opt.sublabel}</span>
                        </span>
                        <span className="text-xs text-surface-400 block mt-0.5">{opt.desc}</span>
                      </div>
                      {quality === opt.value && (
                        <div className="w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center shrink-0">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-accent-500/5 border border-accent-500/10">
                <Info size={16} className="text-accent-400 mt-0.5 shrink-0" />
                <p className="text-xs text-accent-300/80 leading-relaxed font-arabic">
                  {currentProject
                    ? `سيتم تصدير "${currentProject.name}" — سورة ${currentProject.surah} (آية ${currentProject.fromAyah} إلى ${currentProject.toAyah}) بالفيديو مع صوت القارئ بدقة فائقة.`
                    : 'يرجى اختيار مشروع من صفحة المشاريع لبدء التصدير.'}
                </p>
              </div>

              {/* Export / Cancel buttons */}
              {isExporting ? (
                <button
                  onClick={handleCancel}
                  className="btn-danger w-full flex items-center justify-center gap-2 py-3.5"
                >
                  <X size={18} />
                  إلغاء التصدير
                </button>
              ) : (
                <button
                  onClick={handleExport}
                  disabled={!currentProject}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={18} />
                  بدء التصدير
                </button>
              )}

              {/* No project? Link to create */}
              {!currentProject && (
                <button
                  onClick={() => setCurrentPage('create')}
                  className="w-full text-center text-xs font-bold text-accent-400 hover:text-accent-300 transition-colors"
                >
                  إنشاء مشروع جديد →
                </button>
              )}
            </motion.div>

            {/* Viral Caption & Hashtags Generator Card */}
            {currentProject && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6"
              >
                <ViralCaptionGenerator
                  surahName={currentProject.surah}
                  ayahRange={`${currentProject.fromAyah} - ${currentProject.toAyah}`}
                  ayahText={`سورة ${currentProject.surah} [الآيات ${currentProject.fromAyah} إلى ${currentProject.toAyah}]`}
                  customTitle={currentProject.name}
                />
              </motion.div>
            )}
          </div>

          {/* Right: Export history */}
          <div className="col-span-1 lg:col-span-7">
            {/* Status summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                {
                  label: 'قيد الانتظار',
                  count: statusCounts.pending,
                  color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/10',
                },
                {
                  label: 'جاري المعالجة',
                  count: statusCounts.processing,
                  color: 'text-blue-400 bg-blue-500/10 border-blue-500/10',
                },
                {
                  label: 'مكتمل',
                  count: statusCounts.completed,
                  color: 'text-green-400 bg-green-500/10 border-green-500/10',
                },
                {
                  label: 'فشل',
                  count: statusCounts.failed,
                  color: 'text-red-400 bg-red-500/10 border-red-500/10',
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3.5 rounded-2xl border text-center ${s.color}`}
                >
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs font-semibold opacity-80 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Export jobs list */}
            <h3 className="section-title flex items-center gap-2">
              <Download size={16} className="text-accent-400" />
              سجل التصدير
            </h3>

            {exportJobs.length === 0 ? (
              <EmptyState
                icon={Download}
                title="لا توجد عمليات تصدير"
                description="ابدأ بتصدير مشروعك الأول"
              />
            ) : (
              <div className="space-y-3 stagger-children">
                {exportJobs.map((job, i) => (
                  <ExportProgress
                    key={job.id}
                    job={job}
                    index={i}
                    onRetry={handleRetry}
                    onOpenPublishKit={(j) => setActivePublishJob(j)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Kit Modal (Direct Platform Launchers & Channel Log) */}
      {activePublishJob && (
        <PublishKitModal
          isOpen={Boolean(activePublishJob)}
          onClose={() => setActivePublishJob(null)}
          project={currentProject}
          videoPath={activePublishJob.outputPath}
          surahName={activePublishJob.projectName}
        />
      )}
    </AppLayout>
  );
};

// ==================== Helper Functions ====================

async function saveVideoBlob(
  blob: Blob,
  projectName: string,
  defaultPath?: string
): Promise<string | null> {
  const isMp4 = blob.type.includes('mp4');
  const ext = isMp4 ? 'mp4' : 'webm';
  const cleanName = projectName.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'ayah_video';
  const resolvedDefaultPath = defaultPath || `${cleanName}.${ext}`;

  try {
    // If Electron fs is available and defaultPath is an absolute path, write directly or prompt
    if (window.electronAPI?.dialog?.saveFile) {
      const savePath = await window.electronAPI.dialog.saveFile({
        defaultPath: resolvedDefaultPath,
        filters: isMp4
          ? [
              { name: 'فيديو MP4', extensions: ['mp4'] },
              { name: 'فيديو WebM', extensions: ['webm'] },
            ]
          : [
              { name: 'فيديو WebM', extensions: ['webm'] },
              { name: 'فيديو MP4', extensions: ['mp4'] },
            ],
      });
      if (savePath) {
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        await window.electronAPI.fs.writeBinaryFile(savePath, bytes);

        // Open the folder containing the file
        window.electronAPI.shell.showItemInFolder(savePath);
        return savePath;
      }
    }
  } catch (e) {
    console.warn('Electron save failed, falling back to download:', e);
  }

  // Fallback: browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return null;
}
