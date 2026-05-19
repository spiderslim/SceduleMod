import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Scheduler from './components/Scheduler';
import TargetEditor from './components/TargetEditor';
import CoverageChart from './components/CoverageChart';
import TemplatesModal from './components/TemplatesModal';
import { EditShiftPopover, AddShiftModal } from './components/Modals';
import { Shift, Template, INITIAL_SHIFTS, DEFAULT_TARGETS } from './types/index';
import { decimalFromTimeInput, roundHalf } from './lib/utils';
import { ZoomIn, ZoomOut, Maximize, Trash2, Copy } from 'lucide-react';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [targets, setTargets] = useState<number[]>(DEFAULT_TARGETS);
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>(() => {
    try {
      const stored = localStorage.getItem('shiftsync.opus.templates.v2');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return [];
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('shiftsync.opus.templates.v2', JSON.stringify(templates));
    } catch (e) {}
  }, [templates]);
  
  // Local storage persistence for targets
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shiftsync.opus.targets.v2');
      if (stored) {
        const p = JSON.parse(stored);
        if (Array.isArray(p) && p.length === DEFAULT_TARGETS.length) {
          setTargets(p);
        }
      }
    } catch (e) {}
  }, []);

  const updateTargets = (newTargets: number[]) => {
    setTargets(newTargets);
    try { localStorage.setItem('shiftsync.opus.targets.v2', JSON.stringify(newTargets)); } catch(e) {}
  };

  // Zoom control
  const [zoomLevel, setZoomLevel] = useState(1);
  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(4, Math.max(0.5, prev + delta)));
  };

  // Popover state
  const [popoverState, setPopoverState] = useState<{ shift: Shift | null; position: { x: number; y: number } | null }>({ shift: null, position: null });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [duplicateData, setDuplicateData] = useState<Shift | null>(null);

  // Shift operations
  const handleUpdateShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
  };

  const handleSwapShifts = (id1: string, id2: string) => {
    setShifts(prev => {
      const next = [...prev];
      const i1 = next.findIndex(s => s.id === id1);
      const i2 = next.findIndex(s => s.id === id2);
      if (i1 === -1 || i2 === -1) return prev;
      
      const s1 = next[i1];
      const s2 = next[i2];
      
      next[i1] = { ...s1, start: s2.start, duration: s2.duration, meal: s2.meal };
      next[i2] = { ...s2, start: s1.start, duration: s1.duration, meal: s1.meal };
      return next;
    });
  };

  const handleDeleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
    setSelectedShiftIds(prev => prev.filter(selectedId => selectedId !== id));
    setPopoverState({ shift: null, position: null });
  };

  const handleDuplicate = (shift: Shift) => {
    setPopoverState({ shift: null, position: null });
    setDuplicateData(shift);
    setIsAddModalOpen(true);
  };

  const handleToggleSelectResult = (id: string) => {
    setSelectedShiftIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (selectAll: boolean) => {
    setSelectedShiftIds(selectAll ? shifts.map(s => s.id) : []);
  };

  const handleBulkDelete = () => {
    setShifts(prev => prev.filter(s => !selectedShiftIds.includes(s.id)));
    setSelectedShiftIds([]);
  };

  const handleBulkDuplicate = () => {
    setShifts(prev => {
       const newShifts = [...prev];
       let maxId = Math.max(0, ...prev.map(s => parseInt(s.id.replace('e', '') || '0')));
       
       const shiftsToDuplicate = prev.filter(s => selectedShiftIds.includes(s.id));
       for (const shift of shiftsToDuplicate) {
         maxId++;
         newShifts.push({ ...shift, id: `e${maxId}` });
       }
       return newShifts;
    });
    setSelectedShiftIds([]);
  };

  const handleAddShift = (shiftPartial: Partial<Shift>, lunchProps: { isEnabled: boolean; start: string; duration: number }) => {
    const newId = `e${Math.max(0, ...shifts.map(s => parseInt(s.id.replace('e', '') || '0'))) + 1}`;
    
    const newShift: Shift = {
      id: newId,
      name: shiftPartial.name || '',
      role: shiftPartial.role || '',
      type: shiftPartial.type as 'FT' | 'PT',
      start: shiftPartial.start || 9,
      duration: shiftPartial.duration || 8,
    };

    if (lunchProps.isEnabled) {
      newShift.meal = {
        start: roundHalf(decimalFromTimeInput(lunchProps.start)),
        duration: lunchProps.duration
      };
    }

    setShifts(prev => [...prev, newShift]);
    setIsAddModalOpen(false);
  };

  const handleSaveTemplate = (name: string) => {
    const newTemplate: Template = {
      id: Date.now().toString(),
      name,
      shifts,
      targets
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const handleLoadTemplate = (template: Template) => {
    setShifts(template.shifts);
    updateTargets(template.targets);
    setIsTemplatesModalOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 relative pb-16 transition-colors duration-200">
      <Navbar 
        onAddShift={() => { setDuplicateData(null); setIsAddModalOpen(true); }} 
        onResetData={() => { setShifts(INITIAL_SHIFTS); updateTargets(DEFAULT_TARGETS); }} 
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Interactive Master Schedule</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-3xl leading-relaxed">
              Timeline covers <strong className="text-slate-700 dark:text-slate-300">5 a.m. to 10 p.m.</strong> Drag blocks horizontally to change start times. Resize using the right edge grabber. Drag the striped meal segment to reposition lunch. Drop a shift over another row to quickly swap allocations. <strong className="text-slate-700 dark:text-slate-300">Right-click</strong> any shift block for explicit time editing or to duplicate/delete.
            </p>
          </div>
          
          {/* Zoom Toolbar */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 shrink-0 items-center">
            <button onClick={() => handleZoom(-0.25)} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" disabled={zoomLevel <= 0.5}>
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="px-3 flex flex-col items-center min-w-[70px]">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{Math.round(zoomLevel * 100)}%</span>
            </div>
            <button onClick={() => handleZoom(0.25)} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" disabled={zoomLevel >= 4}>
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1.5 ml-2"></div>
            <button onClick={() => setZoomLevel(1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white tooltip">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scheduler Board */}
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors duration-200">
          <Scheduler 
            shifts={shifts}
            targets={targets}
            selectedShiftIds={selectedShiftIds}
            onToggleSelectResult={handleToggleSelectResult}
            onSelectAll={handleSelectAll}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            onUpdateShift={handleUpdateShift}
            onSwapShifts={handleSwapShifts}
            onContextMenu={(e, shift) => {
              setPopoverState({ shift, position: { x: e.clientX, y: e.clientY } });
            }}
          />
          <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 p-4 text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-8 gap-y-2">
            <span>TOTAL SHIFTS: <strong className="text-slate-900 dark:text-white">{shifts.length}</strong></span>
            <span>SCHEDULED HOURS: <strong className="text-slate-900 dark:text-white">{shifts.reduce((acc, s) => acc + (s.duration - (s.meal?.duration || 0)), 0).toFixed(1)}h</strong></span>
          </div>
        </section>

        {/* Coverage Analytics */}
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 transition-colors duration-200">
          <div className="mb-8 mt-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Coverage Analytics</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-3xl leading-relaxed">
              Compare actual scheduled <strong className="text-indigo-600 dark:text-indigo-400">associate-hours</strong> (bars) against your <strong className="text-slate-900 dark:text-white">baseline targets</strong> (line). Red bars indicate a deficit, yellow indicates a warning. Edits strictly persist in your local browser storage.
            </p>
          </div>
          
          <TargetEditor 
            targets={targets}
            onChangeTarget={(idx, val) => {
              const nt = [...targets];
              nt[idx] = val;
              updateTargets(nt);
            }}
            onResetTargets={() => updateTargets(DEFAULT_TARGETS)}
          />

          <CoverageChart shifts={shifts} targets={targets} isDarkMode={isDarkMode} />
        </section>
      </main>

      <EditShiftPopover 
        shift={popoverState.shift}
        position={popoverState.position}
        onClose={() => setPopoverState({ shift: null, position: null })}
        onDelete={handleDeleteShift}
        onDuplicate={handleDuplicate}
        onApply={(id, updates) => {
          setShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
          setPopoverState({ shift: null, position: null });
        }}
      />

      <AddShiftModal 
        isOpen={isAddModalOpen}
        initialData={duplicateData}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddShift}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        templates={templates}
        onSave={handleSaveTemplate}
        onLoad={handleLoadTemplate}
        onDelete={handleDeleteTemplate}
      />

      {selectedShiftIds.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[90%] sm:w-auto bg-slate-900 dark:bg-slate-800 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 z-50 animate-in slide-in-from-bottom-8 border border-transparent dark:border-slate-700">
          <div className="flex items-center gap-3 text-sm font-semibold w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="bg-slate-700 dark:bg-slate-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs">
                {selectedShiftIds.length}
              </div>
              <span>shifts selected</span>
            </div>
            <button 
              onClick={() => setSelectedShiftIds([])} 
              className="sm:hidden ml-1 px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start gap-2 sm:border-l sm:border-slate-700 sm:dark:border-slate-600 sm:pl-6 pt-2 sm:pt-0 border-t border-slate-800 sm:border-t-0">
             <button 
               onClick={handleBulkDuplicate} 
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
             >
               <Copy className="w-4 h-4"/> Duplicate
             </button>
             <button 
               onClick={handleBulkDelete} 
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-400 dark:text-red-300 hover:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
             >
               <Trash2 className="w-4 h-4"/> Delete
             </button>
             <div className="hidden sm:block w-px h-4 bg-slate-700 dark:bg-slate-600 mx-1"></div>
             <button 
               onClick={() => setSelectedShiftIds([])} 
               className="hidden sm:block ml-1 px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
             >
               Cancel
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
