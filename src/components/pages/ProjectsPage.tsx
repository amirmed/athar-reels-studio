import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppLayout } from '../layout/AppLayout';
import { ProjectCard } from '../ui/ProjectCard';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/Modal';
import {
  LayoutGrid,
  List,
  Search,
  PlusCircle,
  FolderOpen,
  Trash2,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const projects = useAppStore((s) => s.projects);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addProject = useAppStore((s) => s.addProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const deleteProjects = useAppStore((s) => s.deleteProjects);
  const deleteAllProjects = useAppStore((s) => s.deleteAllProjects);
  const activeModal = useAppStore((s) => s.activeModal);
  const modalData = useAppStore((s) => s.modalData);
  const closeModal = useAppStore((s) => s.closeModal);
  const addToast = useAppStore((s) => s.addToast);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkConfirmType, setBulkConfirmType] = useState<'selected' | 'all' | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.includes(searchQuery) ||
      p.reciter.includes(searchQuery) ||
      p.surah.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map((p) => p.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleDeleteSingleConfirm = () => {
    const data = modalData as { projectId?: string; projectName?: string } | undefined;
    if (data?.projectId) {
      const projectToDelete = projects.find((p) => p.id === data.projectId);
      deleteProject(data.projectId);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (data.projectId) next.delete(data.projectId);
        return next;
      });

      if (projectToDelete) {
        addToast({
          message: `تم حذف «${projectToDelete.name}» 🗑️`,
          type: 'info',
          duration: 6000,
          action: {
            label: 'تراجع (Undo) ↩️',
            onClick: () => {
              addProject(projectToDelete);
              addToast({
                message: `تمت استعادة «${projectToDelete.name}» بنجاح ✓`,
                type: 'success',
              });
            },
          },
        });
      } else {
        addToast({ message: 'تم حذف المشروع بنجاح', type: 'success' });
      }

      closeModal();
    }
  };

  const handleExecuteBulkDelete = () => {
    if (bulkConfirmType === 'selected') {
      const idsToDelete = Array.from(selectedIds);
      deleteProjects(idsToDelete);
      addToast({
        message: `تم حذف ${idsToDelete.length} مشاريع محددة بنجاح 🗑️`,
        type: 'success',
      });
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else if (bulkConfirmType === 'all') {
      const count = projects.length;
      deleteAllProjects();
      addToast({
        message: `تم حذف كافة المشاريع (${count}) بالكامل 🗑️`,
        type: 'success',
      });
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
    setBulkConfirmType(null);
  };

  const isAllSelected = filteredProjects.length > 0 && selectedIds.size === filteredProjects.length;

  return (
    <AppLayout
      title="مشاريعي"
      subtitle={`${projects.length} مشروع`}
      topbarActions={
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <>
              <button
                onClick={() => {
                  if (isSelectionMode) {
                    handleClearSelection();
                  } else {
                    setIsSelectionMode(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelectionMode
                    ? 'bg-accent-500 text-surface-950 shadow-md'
                    : 'bg-surface-800/80 hover:bg-surface-700 text-white/70 hover:text-white border border-white/[0.08]'
                }`}
              >
                <CheckSquare size={14} />
                <span>{isSelectionMode ? 'إلغاء التحديد' : 'تحديد المشاريع'}</span>
              </button>

              <button
                onClick={() => setBulkConfirmType('all')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                title="حذف جميع المشاريع نهائياً"
              >
                <Trash2 size={14} />
                <span>حذف الكل ⚠️</span>
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentPage('create')}
            className="btn-primary-sm flex items-center gap-1.5 text-xs cursor-pointer shadow-md"
          >
            <PlusCircle size={14} />
            مشروع جديد
          </button>
        </div>
      }
    >
      <div className="p-6 animate-in pb-28">
        {/* Filters bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search
                size={15}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في المشاريع..."
                className="glass-input ps-9 w-64 text-sm"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-select text-sm cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="editing">قيد التعديل</option>
              <option value="exported">مُصدّر</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Selection Controls in Selection Mode */}
            {isSelectionMode && filteredProjects.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isAllSelected ? <Square size={14} /> : <CheckSquare size={14} />}
                <span>
                  {isAllSelected ? 'إلغاء تحديد الكل' : `تحديد الكل (${filteredProjects.length})`}
                </span>
              </button>
            )}

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-surface-800/40 border border-white/[0.06] rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-accent-500/15 text-accent-400'
                    : 'text-white/30 hover:text-white/60'
                }`}
                title="عرض شبكي"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-accent-500/15 text-accent-400'
                    : 'text-white/30 hover:text-white/60'
                }`}
                title="عرض قائمة"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Projects List / Grid */}
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="لا توجد مشاريع"
            description="لم يتم العثور على مشاريع تطابق معايير البحث. أنشئ مشروعاً جديداً للبدء."
            actionLabel="إنشاء مشروع جديد"
            onAction={() => setCurrentPage('create')}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
            {filteredProjects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(project.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {filteredProjects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                variant="compact"
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(project.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface-900/95 backdrop-blur-xl border border-gold-400/30 rounded-2xl p-3 sm:px-6 sm:py-3.5 shadow-2xl shadow-black/80 flex items-center gap-3 sm:gap-6 flex-wrap"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent-500/20 text-accent-400 flex items-center justify-center font-bold text-xs">
                {selectedIds.size}
              </div>
              <span className="text-xs font-bold text-white">
                تم تحديد <strong className="text-accent-400">{selectedIds.size}</strong> من{' '}
                {projects.length}
              </span>
            </div>

            <div className="h-6 w-[1px] bg-white/[0.1] hidden sm:block" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white/80 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isAllSelected ? <Square size={13} /> : <CheckSquare size={13} />}
                <span>{isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkConfirmType('selected')}
                className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-lg shadow-rose-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 size={14} />
                <span>حذف المحدد ({selectedIds.size})</span>
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                className="p-1.5 rounded-xl hover:bg-surface-800 text-white/40 hover:text-white transition-all cursor-pointer"
                title="إلغاء"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Single Project Delete Confirmation */}
      <ConfirmDialog
        isOpen={activeModal === 'confirm-delete'}
        onClose={closeModal}
        onConfirm={handleDeleteSingleConfirm}
        title="حذف المشروع"
        message={`هل أنت متأكد من حذف المشروع "${(modalData as { projectName?: string })?.projectName || ''}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
      />

      {/* 2. Bulk Selected / All Delete Confirmation */}
      <ConfirmDialog
        isOpen={bulkConfirmType !== null}
        onClose={() => setBulkConfirmType(null)}
        onConfirm={handleExecuteBulkDelete}
        title={bulkConfirmType === 'all' ? '⚠️ تحذير: حذف كافة المشاريع' : 'حذف المشاريع المحددة'}
        message={
          bulkConfirmType === 'all'
            ? `هل أنت متأكد من حذف جميع المشاريع (${projects.length} مشروع) نهائياً من الذاكرة؟ سيتم مسح كافة التصاميم ولا يمكن التراجع عن هذا الإجراء.`
            : `هل أنت متأكد من حذف ${selectedIds.size} مشاريع محددة نهائياً؟`
        }
        confirmLabel={
          bulkConfirmType === 'all'
            ? 'حذف كافة المشاريع نهائياً ⚠️'
            : `حذف (${selectedIds.size}) مشاريع`
        }
        cancelLabel="إلغاء"
        variant="danger"
      />
    </AppLayout>
  );
};
