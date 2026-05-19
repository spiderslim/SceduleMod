import React, { useState, useMemo } from 'react';
import { Shift, DAY_START, DAY_END, DAY_SPAN } from '../types/index';
import { formatTime, formatHoursShort, cn, intervalOverlap } from '../lib/utils';
import ShiftBlock from './ShiftBlock';

interface SchedulerProps {
  shifts: Shift[];
  targets: number[];
  selectedShiftIds: string[];
  onToggleSelectResult: (id: string) => void;
  onSelectAll: (selectAll: boolean) => void;
  onUpdateShift: (shift: Shift) => void;
  onSwapShifts: (id1: string, id2: string) => void;
  onContextMenu: (e: React.MouseEvent, shift: Shift) => void;
  zoomLevel: number;
  onZoomChange?: (newZoom: number) => void;
}

export default function Scheduler({ shifts, targets, selectedShiftIds, onToggleSelectResult, onSelectAll, onUpdateShift, onSwapShifts, onContextMenu, zoomLevel, onZoomChange }: SchedulerProps) {
  const [candidateRowId, setCandidateRowId] = useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const pinchStartDist = React.useRef<number | null>(null);
  const pinchStartZoom = React.useRef<number>(1);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        pinchStartDist.current = dist;
        pinchStartZoom.current = zoomLevel;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDist.current !== null && onZoomChange) {
        if (e.cancelable) e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const scale = dist / pinchStartDist.current;
        const newZoom = Math.min(4, Math.max(0.5, pinchStartZoom.current * scale));
        onZoomChange(newZoom);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartDist.current = null;
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [zoomLevel, onZoomChange]);

  const getShiftHours = (shift: Shift) => {
    const mealH = shift.meal ? shift.meal.duration : 0;
    return Math.max(0, shift.duration - mealH);
  };

  const handleSwapEnd = (sourceId: string, targetId: string | null) => {
    setCandidateRowId(null);
    if (targetId && sourceId !== targetId) {
      onSwapShifts(sourceId, targetId);
    }
  };

  const getRoleColor = (role: string) => {
    if (!role) return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm transition-colors';
    
    // Distinct color palettes (with dark mode support built-in via tailwind config normally, but here we can define explicitly or let them remain tinted in both modes)
    // Actually, let's just make the text readable in dark mode by adjusting border and text
    const palettes = [
      'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700/50 text-indigo-900 dark:text-indigo-200',
      'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200',
      'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-200',
      'bg-sky-100 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700/50 text-sky-900 dark:text-sky-200',
      'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700/50 text-rose-900 dark:text-rose-200',
      'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700/50 text-purple-900 dark:text-purple-200',
      'bg-fuchsia-100 dark:bg-fuchsia-900/40 border-fuchsia-300 dark:border-fuchsia-700/50 text-fuchsia-900 dark:text-fuchsia-200',
      'bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-700/50 text-cyan-900 dark:text-cyan-200',
      'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700/50 text-teal-900 dark:text-teal-200',
      'bg-lime-100 dark:bg-lime-900/40 border-lime-300 dark:border-lime-700/50 text-lime-900 dark:text-lime-200',
      'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700/50 text-orange-900 dark:text-orange-200',
      'bg-pink-100 dark:bg-pink-900/40 border-pink-300 dark:border-pink-700/50 text-pink-900 dark:text-pink-200',
      'bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700/50 text-violet-900 dark:text-violet-200',
    ];

    const norm = role.trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < norm.length; i++) {
      hash = norm.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % palettes.length;
    return `${palettes[index]} shadow-sm`;
  };

  const coverages = useMemo(() => {
    return Array.from({ length: DAY_SPAN }).map((_, i) => {
      const h = DAY_START + i;
      let sum = 0;
      shifts.forEach((shift) => {
        const s0 = shift.start;
        const s1 = shift.start + shift.duration;
        let work = intervalOverlap(s0, s1, h, h + 1);
        
        if (shift.meal && work > 0) {
          const ms = Math.max(shift.start, Math.min(shift.meal.start, shift.start + shift.duration - shift.meal.duration));
          const mealOverlap = intervalOverlap(ms, ms + shift.meal.duration, h, h + 1);
          work = Math.max(0, work - mealOverlap);
        }
        sum += work;
      });
      return {
        scheduled: sum,
        target: targets[i] || 0,
        delta: sum - (targets[i] || 0)
      };
    });
  }, [shifts, targets]);

  const timeHeaders = [];
  for (let h = DAY_START; h <= DAY_END; h += 2) {
    let display = h === DAY_END ? formatTime(DAY_END) : formatTime(h);
    if (h === 12) display = '12pm';
    timeHeaders.push(
      <div key={h} className="w-8 text-center -ml-4 flex-shrink-0 text-[10px] md:text-xs">
        {display}
      </div>
    );
  }

  const baseWidth = 900;
  const minWidthStr = `${Math.round(baseWidth * zoomLevel)}px`;

  return (
    <div ref={scrollContainerRef} className="flex-grow overflow-x-auto bg-slate-50 dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 transition-colors duration-200" style={{ touchAction: 'pan-x pan-y' }}>
      <div className="min-w-fit" style={{ minWidth: minWidthStr }}>
        {/* Headers */}
        <div className="sticky top-0 z-30 flex flex-col shadow-sm">
          {/* Time Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide transition-colors">
            <div className="w-28 sm:w-48 md:w-64 flex-shrink-0 p-3 sm:p-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky left-0 z-30 flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={shifts.length > 0 && selectedShiftIds.length === shifts.length}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 focus:ring-indigo-600 shrink-0 cursor-pointer"
              />
              <span className="hidden sm:inline">Roster / Role</span>
              <span className="sm:hidden">Roster</span>
            </div>
            <div className="flex-grow flex relative">
              <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none">
                {timeHeaders}
              </div>
            </div>
          </div>
          {/* Coverage Heatmap Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px] transition-colors">
            <div className="w-28 sm:w-48 md:w-64 flex-shrink-0 p-2 sm:px-4 sm:py-2 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky left-0 z-30 flex items-center justify-between">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Net Cov.</span>
            </div>
            <div className="flex-grow flex relative">
               {coverages.map((cov, i) => {
                 let bgColor = 'bg-slate-50/50 dark:bg-slate-800/30';
                 let textColor = 'text-slate-400 dark:text-slate-500';
                 if (cov.delta <= -0.5) { bgColor = 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'; }
                 else if (cov.delta < 0) { bgColor = 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'; }
                 else if (cov.target > 0 && cov.delta >= 0) { bgColor = 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'; }
                 
                 const displayDelta = cov.delta > 0 ? `+${cov.delta.toFixed(1)}` : cov.delta.toFixed(1);
                 
                 return (
                   <div key={i} className={`flex-1 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center ${bgColor} py-1 transition-colors`} title={`Scheduled: ${cov.scheduled.toFixed(2)}h vs Target: ${cov.target}h`}>
                     <span className="font-mono font-bold">{displayDelta}</span>
                     <span className="text-[8px] uppercase tracking-tighter opacity-70">tgt {cov.target}</span>
                   </div>
                 )
               })}
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="flex flex-col relative pb-4 text-sm z-0 ">
          {/* Background Heatmap Columns */}
          <div className="absolute top-0 bottom-0 left-28 sm:left-48 md:left-64 right-0 flex pointer-events-none z-0">
            {coverages.map((cov, i) => {
               let bgColor = 'bg-transparent';
               if (cov.delta <= -0.5) bgColor = 'bg-red-500/10 dark:bg-red-500/5';
               else if (cov.delta < 0) bgColor = 'bg-amber-500/10 dark:bg-amber-500/5';
               else if (cov.target > 0 && cov.delta >= 0) bgColor = 'bg-indigo-500/5 dark:bg-indigo-500/5';
               
               return <div key={i} className={`flex-1 border-r border-slate-200/30 dark:border-slate-700/30 ${bgColor}`} />
            })}
          </div>

          {shifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500 z-10 w-full min-h-[300px]">
              <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <p className="font-semibold text-lg text-slate-500 dark:text-slate-400">No shifts scheduled</p>
              <p className="text-sm mt-1 text-center">Use the "Add Shift" button to start building your roster.</p>
            </div>
          ) : (
            shifts.map((shift) => (
              <div
                key={shift.id}
                data-row-id={shift.id}
                className={cn(
                  "flex border-b border-slate-100 dark:border-slate-800/50 transition-colors h-16 sm:h-20 group relative z-10",
                  candidateRowId === shift.id && "bg-indigo-500/10 dark:bg-indigo-500/20"
                )}
              >
                {candidateRowId === shift.id && (
                  <div className="absolute inset-0 ring-2 ring-inset ring-indigo-400 z-10 pointer-events-none rounded-sm"></div>
                )}
                
                <div className="w-28 sm:w-48 md:w-64 flex-shrink-0 p-2 sm:p-3 border-r border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-center sm:justify-between gap-1 sm:gap-2 overflow-hidden bg-white dark:bg-slate-950 sticky left-0 z-20 group-hover:bg-slate-50 dark:group-hover:bg-slate-900 shadow-[2px_0_4px_rgba(0,0,0,0.01)] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <input 
                      type="checkbox" 
                      checked={selectedShiftIds.includes(shift.id)}
                      onChange={() => onToggleSelectResult(shift.id)}
                      className="hidden sm:block w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 focus:ring-indigo-600 shrink-0 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <input
                        type="text"
                        value={shift.name}
                        onChange={(e) => onUpdateShift({ ...shift, name: e.target.value })}
                        className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm truncate w-full sm:w-[100px] md:w-[130px] pr-2 bg-transparent border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded outline-none transition-colors cursor-text -ml-1 pl-1 py-0.5"
                        title="Click to edit name"
                        placeholder="Name"
                      />
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate mt-0.5 ml-0.5 sm:ml-0" title={shift.role}>
                        {shift.role}
                      </div>
                    </div>
                  </div>
                  <span 
                    className="shrink-0 font-mono text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hidden sm:inline-block"
                    title="Scheduled hours (meal excluded)"
                  >
                    {formatHoursShort(getShiftHours(shift))}
                  </span>
                </div>
                
                <div 
                  className="flex-grow relative hover:bg-slate-900/5 transition-colors"
                >
                  <ShiftBlock
                    shift={shift}
                    colorClass={getRoleColor(shift.role)}
                    onUpdate={onUpdateShift}
                    onContextMenu={onContextMenu}
                    onSwapStart={() => setCandidateRowId(null)}
                    onSwapEnter={(id) => setCandidateRowId(id)}
                    onSwapEnd={(targetId) => handleSwapEnd(shift.id, targetId)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
