import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../../types';
import { getStatusLabel, getStatusColor, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import {
  Play,
  Edit3,
  Copy,
  Trash2,
  Download,
  Film,
  Clock,
  User,
  Check,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  index?: number;
  variant?: 'grid' | 'compact';
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = React.memo(
  ({
    project,
    index = 0,
    variant = 'grid',
    isSelectionMode = false,
    isSelected = false,
    onToggleSelect,
  }) => {
    const setCurrentPage = useAppStore((s) => s.setCurrentPage);
    const setCurrentProject = useAppStore((s) => s.setCurrentProject);
    const duplicateProject = useAppStore((s) => s.duplicateProject);
    const openModal = useAppStore((s) => s.openModal);

    const handleOpen = () => {
      setCurrentProject(project);
      setCurrentPage('editor');
    };

    const handleEdit = () => {
      setCurrentProject(project);
      setCurrentPage('editor');
    };

    const handleDuplicate = () => duplicateProject(project.id);

    const handleDelete = () => {
      openModal('confirm-delete', { projectId: project.id, projectName: project.name });
    };

    const handleCardClick = () => {
      if (isSelectionMode) {
        onToggleSelect?.(project.id);
      } else {
        handleOpen();
      }
    };

    if (variant === 'compact') {
      return (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`glass-card p-4 flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 group ${
            isSelected
              ? 'border-accent-500 bg-accent-500/10 shadow-lg shadow-accent-500/10 ring-1 ring-accent-500'
              : 'hover:bg-surface-800/70'
          }`}
          onClick={handleCardClick}
        >
          <div className="flex items-center gap-4 min-w-0">
            {/* Checkbox button */}
            {(isSelectionMode || isSelected) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(project.id);
                }}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-accent-500 text-surface-950 shadow-md'
                    : 'border border-white/30 bg-black/40 text-transparent hover:border-accent-400'
                }`}
              >
                <Check size={14} className={isSelected ? 'stroke-[3]' : 'opacity-0'} />
              </button>
            )}

            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-800 border border-surface-700/40 flex items-center justify-center shrink-0">
              {project.thumbnail ? (
                <img
                  src={project.thumbnail}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : project.backgroundUrl && project.backgroundUrl !== 'none' ? (
                <img
                  src={project.backgroundUrl}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Film size={20} className="text-gold-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-surface-50 truncate">{project.name}</h3>
              <p className="text-xs text-surface-400 mt-0.5">
                {project.reciter} • سورة {project.surah}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span
              className={`text-xs px-2.5 py-1 rounded-lg font-medium ${getStatusColor(project.status)}`}
            >
              {getStatusLabel(project.status)}
            </span>
            {!isSelectionMode && (
              <>
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-lg bg-surface-800/60 text-surface-400 hover:bg-accent-500/20 hover:text-accent-400 transition-all cursor-pointer"
                  title="تعديل في المحرر"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-lg bg-surface-800/60 text-surface-400 hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer"
                  title="حذف المشروع"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        className={`glass-card overflow-hidden transition-all duration-300 group relative ${
          isSelected
            ? 'border-accent-500 ring-2 ring-accent-500/60 bg-accent-500/5 shadow-xl shadow-accent-500/10'
            : 'hover:border-white/[0.1]'
        } ${isSelectionMode ? 'cursor-pointer' : ''}`}
        onClick={isSelectionMode ? handleCardClick : undefined}
      >
        {/* Selection Checkbox (always visible when selected or in selection mode, visible on hover otherwise) */}
        <div className="absolute top-3 end-3 z-30">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(project.id);
            }}
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
              isSelected
                ? 'bg-gradient-to-r from-accent-400 to-accent-500 text-surface-950 shadow-lg ring-2 ring-white/50'
                : isSelectionMode
                  ? 'bg-black/60 border border-white/40 text-transparent hover:border-accent-400'
                  : 'opacity-0 group-hover:opacity-100 bg-black/60 border border-white/30 text-transparent hover:border-accent-400'
            }`}
            title={isSelected ? 'إلغاء التحديد' : 'تحديد المشروع'}
          >
            <Check size={15} className={isSelected ? 'stroke-[3]' : 'opacity-0'} />
          </button>
        </div>

        {/* Thumbnail area (CapCut visual preview) */}
        <div className="relative h-44 bg-surface-950 overflow-hidden">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : project.backgroundUrl && project.backgroundUrl !== 'none' ? (
            <div className="w-full h-full relative">
              <img
                src={project.backgroundUrl}
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-3 text-center">
                <span className="text-xs font-bold text-white font-arabic drop-shadow-md">
                  سورة {project.surah}
                </span>
                <span className="text-[10px] text-gold-300 font-mono mt-0.5">
                  ﴿ الآيات {project.fromAyah}-{project.toAyah} ﴾
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-900 via-surface-950 to-black p-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mb-2">
                <Film size={18} />
              </div>
              <span className="font-arabic text-xs font-bold text-white/80">
                سورة {project.surah}
              </span>
              <span className="text-[10px] text-white/40 mt-0.5">
                الآيات {project.fromAyah} إلى {project.toAyah}
              </span>
            </div>
          )}

          {/* Decorative pattern & subtle gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900/90 via-transparent to-transparent pointer-events-none" />

          {/* Status badge */}
          <div className="absolute top-3 start-3 z-10">
            <span
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium backdrop-blur-sm shadow-sm ${getStatusColor(project.status)}`}
            >
              {getStatusLabel(project.status)}
            </span>
          </div>

          {/* Center play button */}
          {!isSelectionMode && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <button
                onClick={handleOpen}
                className="w-12 h-12 rounded-full bg-accent-500/95 flex items-center justify-center shadow-xl shadow-accent-500/30 hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="فتح في المحرر"
              >
                <Play size={20} className="text-white -scale-x-100 ms-0.5" fill="white" />
              </button>
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="p-4">
          <h3 className="text-sm sm:text-base font-bold text-surface-50 mb-1 truncate">
            {project.name}
          </h3>

          <div className="flex items-center gap-3 text-xs sm:text-[13px] text-surface-300 mb-3.5 font-medium">
            <span className="flex items-center gap-1">
              <User size={13} className="text-gold-400/80" />
              <span>{project.reciter}</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock size={13} className="text-surface-400" />
              <span>{formatDate(project.createdAt)}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-accent-500/15 text-accent-300 text-xs sm:text-[13px] font-bold hover:bg-accent-500/25 transition-all cursor-pointer"
            >
              <Edit3 size={14} />
              <span>تعديل</span>
            </button>
            <button
              onClick={handleDuplicate}
              className="w-9 h-9 rounded-xl bg-surface-800/80 text-surface-400 flex items-center justify-center hover:bg-surface-700 hover:text-surface-50 transition-all cursor-pointer"
              title="تكرار"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => {
                setCurrentProject(project);
                setCurrentPage('export');
              }}
              className="w-9 h-9 rounded-xl bg-surface-800/80 text-surface-400 flex items-center justify-center hover:bg-gold-500/20 hover:text-gold-300 transition-all cursor-pointer"
              title="تصدير"
            >
              <Download size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="w-9 h-9 rounded-xl bg-surface-800/80 text-surface-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer"
              title="حذف"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }
);
