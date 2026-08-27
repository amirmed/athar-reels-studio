import React, { useEffect, Suspense, lazy } from 'react';
import { useAppStore } from './store/useAppStore';
import { ToastContainer } from './components/ui/Toast';
import { MotionConfig } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Dynamic Lazy Imports for Code Splitting
const WelcomePage = lazy(() =>
  import('./components/pages/WelcomePage').then((m) => ({ default: m.WelcomePage }))
);
const DashboardPage = lazy(() =>
  import('./components/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const CreateProjectPage = lazy(() =>
  import('./components/pages/CreateProjectPage').then((m) => ({ default: m.CreateProjectPage }))
);
const EditorPage = lazy(() =>
  import('./components/pages/EditorPage').then((m) => ({ default: m.EditorPage }))
);
const ProjectsPage = lazy(() =>
  import('./components/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const ExportPage = lazy(() =>
  import('./components/pages/ExportPage').then((m) => ({ default: m.ExportPage }))
);
const SettingsPage = lazy(() =>
  import('./components/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const AzkarStudioPage = lazy(() =>
  import('./components/pages/AzkarStudioPage').then((m) => ({ default: m.AzkarStudioPage }))
);
const ImageQuotesStudioPage = lazy(() =>
  import('./components/pages/ImageQuotesStudioPage').then((m) => ({
    default: m.ImageQuotesStudioPage,
  }))
);
const VoiceStudioPage = lazy(() =>
  import('./components/pages/VoiceStudioPage').then((m) => ({ default: m.VoiceStudioPage }))
);

// Sleek Luxury Page Loading Fallback
const PageLoadingSkeleton: React.FC = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface-950 text-white space-y-4 select-none">
    <div className="relative flex items-center justify-center">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-gold-500/20 to-amber-500/30 border border-gold-400/40 flex items-center justify-center shadow-2xl shadow-gold-500/20 animate-pulse">
        <Sparkles size={28} className="text-gold-400" />
      </div>
      <div className="absolute -inset-1 rounded-3xl border border-gold-400/20 animate-ping opacity-30 pointer-events-none" />
    </div>
    <div className="flex items-center gap-2 text-sm font-bold text-gold-300 font-arabic">
      <Loader2 size={16} className="animate-spin text-gold-400" />
      <span>جاري تجهيز الاستوديو...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const currentPage = useAppStore((s) => s.currentPage);
  const initializeApp = useAppStore((s) => s.initializeApp);
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.settings.language || 'ar');

  useEffect(() => {
    // Initialize app — load settings, projects, export jobs from disk
    initializeApp();

    // Remove loading screen safely
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => {
        try {
          loader.remove();
        } catch (err) {
          console.debug('[App] Loader removal error:', err);
        }
      }, 400);
    }
  }, [initializeApp]);

  // Synchronize documentElement theme classes
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  // Synchronize documentElement language and direction (RTL / LTR)
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const renderPage = () => {
    switch (currentPage) {
      case 'welcome':
        return <WelcomePage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'azkar':
        return <AzkarStudioPage />;
      case 'quotes':
        return <ImageQuotesStudioPage />;
      case 'voice-studio':
        return <VoiceStudioPage />;
      case 'create':
        return <CreateProjectPage />;
      case 'editor':
        return <EditorPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'export':
        return <ExportPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <WelcomePage />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <div className="h-screen w-screen bg-surface-950">
          <Suspense fallback={<PageLoadingSkeleton />}>{renderPage()}</Suspense>
          <ToastContainer />
        </div>
      </ErrorBoundary>
    </MotionConfig>
  );
};

export default App;
