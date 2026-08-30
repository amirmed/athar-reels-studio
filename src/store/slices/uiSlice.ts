import { Page, QuoteCardSettings } from '../../types';
import { AppSlice, Toast, UiSlice, ModalName, ModalDataMap } from '../types';
import { logger } from '../../utils/logger';

function generateUniqueId(prefix = 'id'): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch (err) {
    logger.debug('[UiSlice] crypto.randomUUID fallback:', err);
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

const getInitialPage = (): Page => {
  try {
    const hasOnboarded = typeof localStorage !== 'undefined' ? localStorage.getItem('athar_has_onboarded') : null;
    return hasOnboarded === 'true' ? 'dashboard' : 'welcome';
  } catch (err) {
    logger.debug('[UiSlice] getInitialPage fallback:', err);
    return 'welcome';
  }
};

// Active toast timeout references for leak-free cleanup
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const clearToastTimers = () => {
  toastTimers.forEach((timer) => clearTimeout(timer));
  toastTimers.clear();
};

export const createUiSlice: AppSlice<UiSlice> = (set, get) => ({
  // Navigation
  currentPage: getInitialPage(),
  setCurrentPage: (page: Page) => set({ currentPage: page }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Modals with typed payloads
  activeModal: null as ModalName | null,
  modalData: null as ModalDataMap[ModalName] | null,
  openModal: <K extends ModalName>(name: K, data?: ModalDataMap[K]) =>
    set({ activeModal: name, modalData: data ?? null }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Quotes Draft
  activeQuoteDraft: null,
  setActiveQuoteDraft: (draft: Partial<QuoteCardSettings> | null) =>
    set({ activeQuoteDraft: draft }),

  // Toasts with strict duplicate protection and timer tracking
  toasts: [],
  addToast: (toast: Omit<Toast, 'id'>) => {
    const existing = get().toasts.find((t) => t.message === toast.message);
    if (existing) return;

    const id = generateUniqueId('toast');
    const newToast: Toast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    const dur = toast.duration || 4000;

    // Clear any previous timer for same id
    const prevTimer = toastTimers.get(id);
    if (prevTimer) {
      clearTimeout(prevTimer);
    }

    const timer = setTimeout(() => {
      toastTimers.delete(id);
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, dur);

    toastTimers.set(id, timer);
  },
  removeToast: (id: string) => {
    const timer = toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.delete(id);
    }
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clearAllToasts: () => {
    clearToastTimers();
    set({ toasts: [] });
  },

  // Interactive Tour Guide
  isTourActive: false,
  tourStep: 0,
  startTour: () => set({ isTourActive: true, tourStep: 0, currentPage: 'dashboard' }),
  stopTour: () => set({ isTourActive: false, tourStep: 0 }),
  setTourStep: (step: number) => set({ tourStep: step }),
  nextTourStep: () => set((state) => ({ tourStep: state.tourStep + 1 })),
  prevTourStep: () => set((state) => ({ tourStep: Math.max(0, state.tourStep - 1) })),
});
