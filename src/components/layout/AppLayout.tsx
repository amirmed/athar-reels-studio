import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CharityRibbonFooter } from './CharityRibbonFooter';
import { GlobalSearchModal } from '../ui/GlobalSearchModal';
import { MotherDuaModal } from '../ui/MotherDuaModal';
import { ToastContainer } from '../ui/Toast';
import { InteractiveTourGuide } from '../ui/InteractiveTourGuide';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  topbarActions?: React.ReactNode;
  hideTopbar?: boolean;
  hideSidebar?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  topbarActions,
  hideTopbar = false,
  hideSidebar = false,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMotherDuaOpen, setIsMotherDuaOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-950 overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {!hideSidebar && <Sidebar />}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {!hideTopbar && (
            <Topbar
              title={title}
              subtitle={subtitle}
              actions={topbarActions}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenMotherDua={() => setIsMotherDuaOpen(true)}
            />
          )}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>

      {/* Persistent Golden Ribbon Footer */}
      <CharityRibbonFooter onOpenMotherDua={() => setIsMotherDuaOpen(true)} />

      {/* Global Command Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenMotherDua={() => setIsMotherDuaOpen(true)}
      />

      {/* Mother Dua & Ongoing Charity Modal */}
      <MotherDuaModal isOpen={isMotherDuaOpen} onClose={() => setIsMotherDuaOpen(false)} />

      <ToastContainer />
      <InteractiveTourGuide />
    </div>
  );
};
