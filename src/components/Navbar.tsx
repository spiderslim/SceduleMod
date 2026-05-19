import React from 'react';
import { Settings, Plus, RotateCcw, Bookmark, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  onAddShift: () => void;
  onResetData: () => void;
  onOpenTemplates: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function Navbar({ onAddShift, onResetData, onOpenTemplates, isDarkMode, onToggleDarkMode }: NavbarProps) {
  return (
    <nav className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white uppercase flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white shrink-0">V</div>
              <span className="hidden sm:inline">Shift<span className="text-indigo-600 italic underline decoration-2 underline-offset-4">Sync</span></span>
            </span>
            <span className="hidden md:inline-block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-4 border-l pl-4 border-slate-200 dark:border-slate-700">
              Operations Prototype
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleDarkMode}
              className="p-2 sm:px-3 sm:py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
              title="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={onOpenTemplates}
              className="flex items-center gap-1.5 p-2 sm:px-4 sm:py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </button>
            <button
              onClick={onResetData}
              className="group hidden md:flex items-center gap-1.5 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <RotateCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform duration-300" />
              Reset Data
            </button>
            <button
              onClick={onAddShift}
              className="flex items-center gap-1.5 p-2 sm:px-4 sm:py-2 bg-indigo-600 rounded-md text-sm font-semibold text-white shadow-md transition-all active:scale-95 hover:bg-indigo-700 ml-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
