'use client';

import { useEffect } from 'react';
import { useForgeStore } from '@/lib/store';
import HomePage from '@/components/HomePage';
import WorkspacePage from '@/components/WorkspacePage';
import ProjectsPage from '@/components/ProjectsPage';
import SettingsPage from '@/components/SettingsPage';
import CommandPalette from '@/components/CommandPalette';

export default function Page() {
  const { currentView, commandPaletteOpen, setCommandPaletteOpen } = useForgeStore();

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  return (
    <>
      {currentView === 'home' && <HomePage />}
      {currentView === 'workspace' && <WorkspacePage />}
      {currentView === 'projects' && <ProjectsPage />}
      {currentView === 'settings' && <SettingsPage />}
      {commandPaletteOpen && <CommandPalette />}
    </>
  );
}
