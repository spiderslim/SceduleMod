import React, { useRef, useState, useEffect } from 'react';
import { Shift, DAY_START, DAY_SPAN } from '../types/index';
import { formatTime, cn, roundHalf } from '../lib/utils';
import { GripVertical } from 'lucide-react';

interface ShiftBlockProps {
  shift: Shift;
  colorClass: string;
  onUpdate: (updatedShift: Shift) => void;
  onContextMenu: (e: React.MouseEvent, shift: Shift) => void;
  onSwapStart: () => void;
  onSwapEnd: (targetRowId: string | null) => void;
  onSwapEnter: (targetRowId: string) => void;
}

export default function ShiftBlock({
  shift,
  colorClass,
  onUpdate,
  onContextMenu,
  onSwapStart,
  onSwapEnd,
  onSwapEnter
}: ShiftBlockProps) {
  const [localShift, setLocalShift] = useState<Shift>(shift);
  const [isDragging, setIsDragging] = useState(false);
  
  // Sync to prop
  useEffect(() => {
    if (!isDragging) {
      setLocalShift(shift);
    }
  }, [shift, isDragging]);

  const blockRef = useRef<HTMLDivElement>(null);

  const getLeftPct = (start: number) => ((start - DAY_START) / DAY_SPAN) * 100;
  const getWidthPct = (duration: number) => (duration / DAY_SPAN) * 100;

  const leftPct = getLeftPct(localShift.start);
  const widthPct = getWidthPct(localShift.duration);

  let mealLeftPct = 0;
  let mealWidthPct = 0;
  if (localShift.meal) {
    const mealStartClamped = Math.max(localShift.start, Math.min(localShift.meal.start, localShift.start + localShift.duration - localShift.meal.duration));
    mealLeftPct = ((mealStartClamped - localShift.start) / localShift.duration) * 100;
    mealWidthPct = (localShift.meal.duration / localShift.duration) * 100;
  }

  const handlePointerDown = (e: React.PointerEvent, type: 'shift' | 'resize' | 'meal') => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    
    // Prevent starting drag on context menu clicks
    if (type === 'shift' && (e.ctrlKey || e.button === 2)) return;

    setIsDragging(true);
    if (type === 'shift') onSwapStart();

    const startX = e.clientX;
    const initialStart = localShift.start;
    const initialDuration = localShift.duration;
    const initialMealStart = localShift.meal ? localShift.meal.start : 0;
    
    const parentWidth = blockRef.current?.parentElement?.getBoundingClientRect().width || 1;

    let currentShift = localShift;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPct = (deltaX / parentWidth) * 100;
      const deltaHours = (deltaPct / 100) * DAY_SPAN;

      if (type === 'shift') {
        const stack = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY);
        for (const el of stack) {
          const row = el.closest('[data-row-id]') as HTMLElement;
          if (row && row.dataset.rowId) {
             onSwapEnter(row.dataset.rowId);
             break;
          }
        }
      }

      setLocalShift(prev => {
        const next = { ...prev };
        
        if (type === 'shift') {
          let newStart = initialStart + deltaHours;
          newStart = roundHalf(newStart);
          if (newStart < DAY_START) newStart = DAY_START;
          if (newStart + next.duration > DAY_START + DAY_SPAN) {
            newStart = DAY_START + DAY_SPAN - next.duration;
          }
          next.start = newStart;
          if (next.meal) {
            next.meal = { ...next.meal, start: initialMealStart + (newStart - initialStart) };
          }
        } 
        else if (type === 'resize') {
          let newDuration = initialDuration + deltaHours;
          newDuration = roundHalf(newDuration);
          if (newDuration < 1) newDuration = 1;
          if (next.start + newDuration > DAY_START + DAY_SPAN) {
            newDuration = DAY_START + DAY_SPAN - next.start;
          }
          next.duration = newDuration;
        } 
        else if (type === 'meal' && next.meal) {
          let newMealStart = initialMealStart + deltaHours;
          newMealStart = roundHalf(newMealStart);
          const shiftEnd = next.start + next.duration;
          if (newMealStart < next.start) newMealStart = next.start;
          if (newMealStart + next.meal.duration > shiftEnd) {
            newMealStart = shiftEnd - next.meal.duration;
          }
          next.meal = { ...next.meal, start: newMealStart };
        }
        
        currentShift = next;
        return next;
      });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      
      let targetRowId: string | null = null;
      let didSwap = false;
      if (type === 'shift') {
        const stack = document.elementsFromPoint(upEvent.clientX, upEvent.clientY);
        for (const el of stack) {
          const row = el.closest('[data-row-id]') as HTMLElement;
          if (row && row.dataset.rowId) {
             targetRowId = row.dataset.rowId;
             break;
          }
        }
        if (targetRowId && targetRowId !== shift.id) {
          didSwap = true;
        }
        onSwapEnd(targetRowId);
      }

      setIsDragging(false);
      if (!didSwap) {
        onUpdate(currentShift);
      }
    };

    const handlePointerCancel = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      setIsDragging(false);
      setLocalShift(shift); // Revert to original on cancel
      if (type === 'shift') onSwapEnd(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
  };

  return (
    <div
      ref={blockRef}
      role="button"
      tabIndex={0}
      data-id={localShift.id}
      className={cn(
        "absolute top-[10%] h-[80%] rounded border cursor-grab active:cursor-grabbing select-none overflow-hidden transition-shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        colorClass,
        isDragging ? "shadow-md z-50 opacity-95 scale-[1.01]" : "z-30 hover:shadow-md"
      )}
      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      onPointerDown={(e) => handlePointerDown(e, 'shift')}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, shift);
      }}
    >
      <div className="absolute inset-0 px-2 sm:px-3 py-1 flex flex-col justify-center pointer-events-none z-10 text-[9px] sm:text-[10px] leading-tight font-medium">
        <div className="truncate opacity-90">{formatTime(localShift.start)} - {formatTime(localShift.start + localShift.duration)}</div>
        <div className="truncate opacity-60 uppercase font-bold tracking-widest">{localShift.duration}h</div>
      </div>

      {localShift.meal && (
        <div
          role="separator"
          onPointerDown={(e) => handlePointerDown(e, 'meal')}
          className="absolute top-0 bottom-0 border-x border-slate-200/50 dark:border-slate-700/50 cursor-grab active:cursor-grabbing z-20 group hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
          style={{
            left: `${mealLeftPct}%`,
            width: `${mealWidthPct}%`,
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.2) 4px, transparent 4px, transparent 8px)'
          }}
          title="Drag to move meal"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md text-[10px]">
            <span>🍽️</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onPointerDown={(e) => handlePointerDown(e, 'resize')}
        className="absolute right-0 top-0 bottom-0 w-3 md:w-4 cursor-ew-resize bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 z-30 flex items-center justify-center rounded-r border-l border-slate-200/50 dark:border-slate-700/50 group focus-visible:outline-none focus-visible:bg-slate-200"
        aria-label="Resize shift duration"
      >
        <GripVertical className="w-2 md:w-3 opacity-40 group-hover:opacity-70" />
      </button>
    </div>
  );
}
