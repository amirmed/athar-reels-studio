import React from 'react';
import { motion } from 'framer-motion';
import { ExportJob } from '../../types';
import { getStatusLabel, getStatusColor, formatDate } from '../../data/mockData';
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  Download,
  FolderOpen,
  Monitor,
  Smartphone,
  Square,
  RotateCcw,
  Play,
  Share2,
} from 'lucide-react';

interface ExportProgressProps {
  job: ExportJob;
  index?: number;
  onRetry?: (jobId: string) => void;
  onOpenPublishKit?: (job: ExportJob) => void;
}

const statusIcons = {
  pending: <Clock size={16} className="text-yellow-400" />,
  processing: <Loader2 size={16} className="text-blue-400 animate-spin" />,
  completed: <CheckCircle2 size={16} className="text-green-400" />,
  failed: <XCircle size={16} className="text-red-400" />,
};

const ratioIcons = {
  '9:16': <Smartphone size={14} />,
  '16:9': <Monitor size={14} />,
  '1:1': <Square size={14} />,
};

const ratioLabels = {
  '9:16': 'ريلز',
  '16:9': 'يوتيوب',
  '1:1': 'مربع',
};

export const ExportProgress: React.FC<ExportProgressProps> = ({
  job,
  index = 0,
  onRetry,
  onOpenPublishKit,
}) => {
  const handleOpenFolder = async () => {
    if (job.outputPath) {
      try {
        await window.electronAPI?.shell.showItemInFolder(job.outputPath);
      } catch {
        // Dev fallback
      }
    }
  };

  const handleOpenFile = async () => {
    if (job.outputPath) {
      try {
        await window.electronAPI?.shell.openPath(job.outputPath);
      } catch {
        // Dev fallback
      }
    }
  };

  const handleDownload = () => {
    if (job.downloadUrl) {
      const a = document.createElement('a');
      a.href = job.downloadUrl;
      a.download = `${job.projectName}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card p-4 hover:border-white/[0.1] transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        {/* Status icon */}
        <div className="mt-0.5">{statusIcons[job.status]}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-white/90 truncate">{job.projectName}</h3>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${getStatusColor(job.status)}`}
            >
              {getStatusLabel(job.status)}
            </span>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
            <span className="flex items-center gap-1">
              {ratioIcons[job.aspectRatio]}
              {ratioLabels[job.aspectRatio]}
            </span>
            <span>جودة: {getStatusLabel(job.quality)}</span>
            {job.estimatedSize && <span>{job.estimatedSize}</span>}
            <span>{formatDate(job.createdAt)}</span>
          </div>

          {/* Progress bar */}
          {(job.status === 'processing' || job.status === 'pending') && (
            <div className="mb-2">
              <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    job.status === 'processing'
                      ? 'bg-gradient-to-l from-blue-500 to-blue-400'
                      : 'bg-surface-600'
                  }`}
                />
              </div>
              <p className="text-[11px] text-white/30 mt-1 text-left font-mono">{job.progress}%</p>
            </div>
          )}

          {/* Actions when completed */}
          {job.status === 'completed' && (
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Publish Kit button (Direct Launch to TikTok, YouTube, Instagram) */}
              {onOpenPublishKit && (
                <button
                  type="button"
                  onClick={() => onOpenPublishKit(job)}
                  className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-gold-500/25 via-amber-500/20 to-gold-400/20 text-gold-300 hover:text-gold-200 border border-gold-400/40 hover:border-gold-300 px-3 py-1.5 rounded-xl transition-all font-extrabold shadow-sm hover:scale-105 cursor-pointer"
                  title="عدة النشر المباشر في TikTok و YouTube و Instagram مع الكابشن والهاشتاجات"
                >
                  <Share2 size={13} className="text-gold-400" />
                  <span>عدة النشر 🚀</span>
                </button>
              )}

              {/* Download button (always available) */}
              {job.downloadUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-xs bg-accent-500/15 text-accent-400 hover:bg-accent-500/25 px-3 py-1.5 rounded-xl transition-colors font-bold cursor-pointer"
                >
                  <Download size={13} />
                  تحميل الفيديو
                </button>
              )}

              {/* Open file (Electron only) */}
              {job.outputPath && (
                <button
                  type="button"
                  onClick={handleOpenFile}
                  className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors font-bold cursor-pointer bg-green-500/10 px-2.5 py-1.5 rounded-xl border border-green-500/20"
                >
                  <Play size={13} />
                  تشغيل
                </button>
              )}

              {/* Open folder (Electron only) */}
              {job.outputPath && (
                <button
                  type="button"
                  onClick={handleOpenFolder}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors font-medium cursor-pointer"
                >
                  <FolderOpen size={13} />
                  فتح المجلد
                </button>
              )}

              {/* If neither download nor output path available */}
              {!job.downloadUrl && !job.outputPath && (
                <span className="text-xs text-white/30 italic">
                  تم التصدير — أعد التصدير للتحميل
                </span>
              )}
            </div>
          )}

          {job.status === 'failed' && onRetry && (
            <button
              onClick={() => onRetry(job.id)}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
            >
              <RotateCcw size={13} />
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
