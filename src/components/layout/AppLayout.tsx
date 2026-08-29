import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CharityRibbonFooter } from './CharityRibbonFooter';
import { GlobalSearchModal } from '../ui/GlobalSearchModal';
import { MotherDuaModal } from '../ui/MotherDuaModal';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal';
import { InteractiveTourGuide } from '../ui/InteractiveTourGuide';

import { useHotkeys } from '../../hooks/useHotkeys';

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
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useHotkeys('ctrl+k', () => {
    setIsSearchOpen((prev) => !prev);
  });

  // Global Shift+? / ? listener
  useHotkeys('shift+?', () => {
    setIsShortcutsOpen((prev) => !prev);
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-950 text-surface-50 overflow-hidden">
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
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
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

      {/* Global Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <InteractiveTourGuide />
    </div>
  );
};
