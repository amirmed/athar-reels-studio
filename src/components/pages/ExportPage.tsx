import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n';
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
import { useExportJob } from '../../hooks/useExportJob';
import { synthesizeArabicSpeech } from '../../services/arabicTtsService';
import { resolveValidAudioUrl } from '../../services/persistentAudioStorage';
import { applyCustomVoiceWithSilenceDetection } from '../../utils/customVoiceDistribution';
import { logger } from '../../utils/logger';

// ==================== Export Page Component ====================
export const ExportPage: React.FC = () => {
  const exportJobs = useAppStore((s) => s.exportJobs);
  const currentProject = useAppStore((s) => s.currentProject);
  const updateProject = useAppStore((s) => s.updateProject);
  const addExportJob = useAppStore((s) => s.addExportJob);
  const updateExportJob = useAppStore((s) => s.updateExportJob);
  const addToast = useAppStore((s) => s.addToast);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const settings = useAppStore((s) => s.settings);
  const { t } = useTranslation();

  const exportJob = useExportJob();
  const {
    isExporting,
    startExport: runExportJob,
    cancelExport: cancelExportJob,
  } = exportJob;

  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>(
    currentProject?.aspectRatio || '9:16'
  );
  const [quality, setQuality] = useState<'standard' | 'high' | 'premium'>('high');
  const [activePublishJob, setActivePublishJob] = useState<ExportJob | null>(null);
  const [hwEncoderInfo, setHwEncoderInfo] = useState<{ encoder: string; isHardwareAccelerated: boolean } | null>(null);

  useEffect(() => {
    if (window.electronAPI?.videoExport?.getHardwareEncoder) {
      window.electronAPI.videoExport.getHardwareEncoder().then((res) => {
        if (res) setHwEncoderInfo(res);
      }).catch(() => {});
    }
  }, []);

  // Real export: delegates to unified useExportJob hook
  const performRealExport = useCallback(
    async (jobId: string) => {
      if (!currentProject) return;

      try {
        updateExportJob(jobId, { status: 'processing', progress: 5 });

        let ayahs: AyahData[] = [];
        let resolvedCustomVoice: string | undefined = undefined;

        if (
          currentProject.customText ||
          currentProject.contentType === 'hadith' ||
          currentProject.contentType === 'azkar'
        ) {
          const text = currentProject.customText || currentProject.name;
          let audioUrl =
            currentProject.audioSettings?.customRecordedAudioUrl || currentProject.customAudioUrl;
          let estimatedTotalSec = 10;

          if (audioUrl) {
            const customKey =
              currentProject.audioSettings?.customAudioKey ||
              currentProject.customAudioKey ||
              currentProject.id;
            const valid = await resolveValidAudioUrl(audioUrl, currentProject.id, customKey);
            if (valid) {
              audioUrl = valid;
              resolvedCustomVoice = valid;
              if (valid !== currentProject.customAudioUrl) {
                updateProject(currentProject.id, {
                  customAudioUrl: valid,
                  audioSettings: {
                    ...currentProject.audioSettings,
                    customRecordedAudioUrl: valid,
                  },
                });
              }
            }
          }

          if (!audioUrl && text) {
            try {
              const ttsResult = await synthesizeArabicSpeech(text, 'ar-SA-HamedNeural');
              audioUrl = ttsResult.audioUrl;
              if (ttsResult.duration > 0) {
                estimatedTotalSec = ttsResult.duration;
              }
            } catch (ttsErr) {
              logger.warn('[ExportPage] synthesizeArabicSpeech error:', ttsErr);
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
              text,
              numberInSurah: 1,
              surahNumber: 0,
              juz: 1,
              page: 1,
              audioUrl: audioUrl || '',
              duration: estimatedTotalSec,
              surahName: currentProject.surah || currentProject.name,
              words,
            },
          ];
        } else if (currentProject.surahNumber > 0) {
          const customVoice =
            currentProject.audioSettings?.customRecordedAudioUrl || currentProject.customAudioUrl;

          if (customVoice) {
            const customKey =
              currentProject.audioSettings?.customAudioKey ||
              currentProject.customAudioKey ||
              currentProject.id;
            const valid = await resolveValidAudioUrl(customVoice, currentProject.id, customKey);
            if (valid) {
              resolvedCustomVoice = valid;
              if (valid !== currentProject.customAudioUrl) {
                updateProject(currentProject.id, {
                  customAudioUrl: valid,
                  audioSettings: {
                    ...currentProject.audioSettings,
                    customRecordedAudioUrl: valid,
                  },
                });
              }
            }
          }

          ayahs = await fetchAyahsWithAudio(
            currentProject.surahNumber,
            currentProject.fromAyah,
            currentProject.toAyah,
            currentProject.reciterId
          );

          if (resolvedCustomVoice && ayahs.length > 0) {
            try {
              await applyCustomVoiceWithSilenceDetection(
                ayahs,
                resolvedCustomVoice,
                currentProject.audioSettings?.customAudioDuration || 0
              );
            } catch (distErr) {
              logger.warn(
                '[ExportPage] applyCustomVoiceWithSilenceDetection error, fallback:',
                distErr
              );
              const totalDur = currentProject.audioSettings?.customAudioDuration || 15;
              const portion = totalDur / Math.max(ayahs.length, 1);
              ayahs = ayahs.map((a) => ({
                ...a,
                audioUrl: resolvedCustomVoice!,
                duration: portion,
              }));
            }

            if (ayahs.length > 1) {
              addToast({
                message: t(
                  'exportModal.multiAyahCustomVoice',
                  '🎙️ تنبيه: سيتم استخدام تسجيلك الصوتي المخصص كمسار موحد لكافة آيات الفيديو.'
                ),
                type: 'info',
              });
            }
          }
        }

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

        const customVoiceUrl =
          resolvedCustomVoice ||
          currentProject.audioSettings?.customRecordedAudioUrl ||
          currentProject.customAudioUrl;
        const isCustomReciter =
          currentProject.reciterId === 'custom_voice' ||
          Boolean(currentProject.audioSettings?.customRecordedAudioUrl || currentProject.customAudioUrl);

        const result = await runExportJob({
          projectName: currentProject.name,
          surahName: currentProject.surah || '',
          reciterName: currentProject.reciter,
          aspectRatio,
          quality,
          backgroundPath: currentProject.backgroundUrl,
          backgroundOpacity: currentProject.backgroundOpacity ?? 0.6,
          audioUrls: isCustomReciter && customVoiceUrl ? [customVoiceUrl] : (enrichedAyahs.map((a) => a.audioUrl).filter(Boolean) as string[]),
          totalDuration: currentProject.audioSettings?.customAudioDuration || undefined,
          ayahs: enrichedAyahs,
          textSettings: currentProject.textSettings,
          audioSettings: currentProject.audioSettings,
          watermark: currentProject.watermark,
          showTranslation: currentProject.translationEnabled,
          savePathPref: settings?.projectsPath
            ? `${settings.projectsPath}/${currentProject.name}.mp4`
            : undefined,
          onProgress: (evt) => {
            updateExportJob(jobId, { progress: evt.percent });
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
            outputPath: savedPath || result.outputPath || undefined,
            downloadUrl: result.blobUrl,
            createdAt: new Date().toISOString(),
          };

          updateExportJob(jobId, completedJob);

          addToast({
            message: t(
              'export.exportSuccessToast',
              'تم التصدير بنجاح! 🚀 اضغط لفتح عدة النشر والكابشن والهاشتاجات'
            ),
            type: 'success',
            duration: 8000,
            action: {
              label: t('export.publishKitBtn', 'عدة النشر 🚀'),
              onClick: () => {
                setActivePublishJob(completedJob);
              },
            },
          });
        } else {
          if (result.error === 'تم إلغاء التصدير') {
            updateExportJob(jobId, { status: 'failed', progress: 0 });
            return;
          }
          throw new Error(result.error || t('export.exportFailedError', 'فشلت عملية تصدير الفيديو'));
        }
      } catch (error: unknown) {
        logger.error('Export failed:', error);
        updateExportJob(jobId, { status: 'failed', progress: 0 });
        const errMsg = error instanceof Error ? error.message : t('common.error', 'خطأ غير معروف');
        addToast({
          message: t('export.exportFailedPrefix', 'فشل التصدير: {error}').replace('{error}', errMsg),
          type: 'error',
        });
      }
    },
    [currentProject, aspectRatio, quality, updateExportJob, addToast, settings?.projectsPath, t, updateProject, runExportJob]
  );

  const handleExport = async () => {
    if (!currentProject) {
      addToast({
        message: t('export.selectProjectWarning', 'يرجى اختيار مشروع أولاً'),
        type: 'warning',
      });
      return;
    }

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
    addToast({ message: t('export.exportStartedToast', 'تم بدء عملية التصدير'), type: 'info' });

    await performRealExport(newJob.id);
  };

  const handleCancel = () => {
    cancelExportJob();
    if (window.electronAPI?.videoExport?.cancel) {
      try {
        window.electronAPI.videoExport.cancel();
      } catch (err) {
        logger.debug('[ExportPage] Cancel error:', err);
      }
    }
    addToast({ message: t('export.exportCancelledToast', 'تم إلغاء التصدير'), type: 'warning' });
  };

  const handleRetry = (jobId: string) => {
    const job = exportJobs.find((j) => j.id === jobId);
    if (job) {
      updateExportJob(jobId, { status: 'processing', progress: 0 });
      performRealExport(jobId);
    }
  };

  const aspectOptions = [
    {
      value: '9:16' as const,
      label: t('export.ratioReels', 'ريلز'),
      sublabel: t('export.ratioReelsSub', '1080×1920'),
      icon: <Smartphone size={20} />,
    },
    {
      value: '16:9' as const,
      label: t('export.ratioYoutube', 'يوتيوب'),
      sublabel: t('export.ratioYoutubeSub', '1920×1080'),
      icon: <Monitor size={20} />,
    },
    {
      value: '1:1' as const,
      label: t('export.ratioSquare', 'مربع'),
      sublabel: t('export.ratioSquareSub', '1080×1080'),
      icon: <Square size={20} />,
    },
  ];

  const qualityOptions = [
    {
      value: 'standard' as const,
      label: t('export.qualityStandard', 'عادي'),
      sublabel: t('export.qualityStandardSub', '720p'),
      icon: <Zap size={18} />,
      desc: t('export.qualityStandardDesc', 'حجم صغير، مناسب للمشاركة السريعة'),
    },
    {
      value: 'high' as const,
      label: t('export.qualityHigh', 'عالي'),
      sublabel: t('export.qualityHighSub', '1080p'),
      icon: <Star size={18} />,
      desc: t('export.qualityHighDesc', 'جودة ممتازة للنشر على المنصات'),
    },
    {
      value: 'premium' as const,
      label: t('export.qualityPremium', 'ممتاز'),
      sublabel: t('export.qualityPremiumSub', '1080p Pro'),
      icon: <Crown size={18} />,
      desc: t('export.qualityPremiumDesc', 'أعلى معدل بت سينمائي فائق النقاء (16 Mbps)'),
    },
  ];

  const statusCounts = {
    pending: exportJobs.filter((j) => j.status === 'pending').length,
    processing: exportJobs.filter((j) => j.status === 'processing').length,
    completed: exportJobs.filter((j) => j.status === 'completed').length,
    failed: exportJobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <AppLayout
      title={t('export.title', 'تصدير ونشر الفيديو 🎬')}
      subtitle={t('export.subtitle', 'اختر المنصة والجودة المناسبة لتصدير الريلز بأعلى سرعة وبصيغة MP4')}
    >
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
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-surface-50">
                      {t('export.newExport', 'تصدير جديد')}
                    </h3>
                    {hwEncoderInfo?.isHardwareAccelerated && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                        <Zap size={11} className="text-emerald-400" />
                        <span>تسريع العتاد ({hwEncoderInfo.encoder.replace('h264_', '').toUpperCase()})</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-surface-400">
                    {currentProject ? currentProject.name : t('export.noProjectSelected', 'لم يتم اختيار مشروع')}
                  </p>
                </div>
              </div>

              <div className="divider"></div>

              {/* Aspect ratio */}
              <div>
                <label className="label">{t('export.aspectRatio', 'المقاس')}</label>
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
                <label className="label">{t('export.quality', 'الجودة')}</label>
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
                    ? t(
                        'export.willExportInfo',
                        'سيتم تصدير "{name}" — سورة {surah} (آية {fromAyah} إلى {toAyah}) بالفيديو مع صوت القارئ بدقة فائقة.'
                      )
                        .replace('{name}', currentProject.name)
                        .replace('{surah}', currentProject.surah || '')
                        .replace('{fromAyah}', String(currentProject.fromAyah))
                        .replace('{toAyah}', String(currentProject.toAyah))
                    : t(
                        'export.selectProjectFromProjects',
                        'يرجى اختيار مشروع من صفحة المشاريع لبدء التصدير.'
                      )}
                </p>
              </div>

              {/* Export / Cancel buttons */}
              {isExporting ? (
                <button
                  onClick={handleCancel}
                  className="btn-danger w-full flex items-center justify-center gap-2 py-3.5"
                >
                  <X size={18} />
                  {t('export.cancelExportBtn', 'إلغاء التصدير')}
                </button>
              ) : (
                <button
                  onClick={handleExport}
                  disabled={!currentProject}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={18} />
                  {t('export.startExportBtn', 'بدء التصدير')}
                </button>
              )}

              {/* No project? Link to create */}
              {!currentProject && (
                <button
                  onClick={() => setCurrentPage('create')}
                  className="w-full text-center text-xs font-bold text-accent-400 hover:text-accent-300 transition-colors"
                >
                  {t('export.createProjectFirst', 'إنشاء مشروع جديد →')}
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
                  label: t('export.statusPending', 'قيد الانتظار'),
                  count: statusCounts.pending,
                  color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/10',
                },
                {
                  label: t('export.statusProcessing', 'جاري المعالجة'),
                  count: statusCounts.processing,
                  color: 'text-blue-400 bg-blue-500/10 border-blue-500/10',
                },
                {
                  label: t('export.statusCompleted', 'مكتمل'),
                  count: statusCounts.completed,
                  color: 'text-green-400 bg-green-500/10 border-green-500/10',
                },
                {
                  label: t('export.statusFailed', 'فشل'),
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
              {t('export.historyTitle', 'سجل التصدير')}
            </h3>

            {exportJobs.length === 0 ? (
              <EmptyState
                variant="default"
                title={t('export.noExportsTitle', 'لا توجد عمليات تصدير')}
                description={t('export.noExportsDesc', 'لم تقم بأي عملية تصدير بعد. صدّر مشروعك الحالي لتشاهد تقدم المعالجة هنا.')}
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
        const writeRes = await window.electronAPI.fs.writeBinaryFile(savePath, bytes);
        if (!writeRes?.success) {
          throw new Error(writeRes?.error || 'فشل حفظ الملف في المسار المختار');
        }

        // Open the folder containing the file
        window.electronAPI.shell?.showItemInFolder(savePath);
        return savePath;
      }
    }
  } catch (e) {
    logger.warn('Electron save failed, falling back to download:', e);
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
