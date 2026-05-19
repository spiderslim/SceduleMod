import React from 'react';
import { formatTime } from '../lib/utils';
import { DAY_START, DAY_SPAN } from '../types/index';

interface TargetEditorProps {
  targets: number[];
  onChangeTarget: (index: number, value: number) => void;
  onResetTargets: () => void;
}

export default function TargetEditor({ targets, onChangeTarget, onResetTargets }: TargetEditorProps) {
  return (
    <div className="mb-6 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 shadow-sm transition-colors duration-200 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Per-hour staffing targets</h3>
        <button
          type="button"
          onClick={onResetTargets}
          className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          Reset defaults
        </button>
      </div>
      <div 
        className="grid gap-1 md:gap-2 min-w-[600px]" 
        style={{ gridTemplateColumns: `repeat(${DAY_SPAN}, minmax(0, 1fr))` }}
      >
        {targets.map((target, i) => {
          const hour = DAY_START + i;
          return (
            <div key={i} className="flex flex-col items-center">
              <label 
                htmlFor={`target-input-${i}`} 
                className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wider"
              >
                {formatTime(hour).replace(/am|pm/g, (m) => m[0])}
              </label>
              <input
                id={`target-input-${i}`}
                type="number"
                min="0"
                max="20"
                step="1"
                value={target}
                onChange={(e) => {
                  let val = parseInt(e.target.value, 10);
                  if (isNaN(val)) val = 0;
                  onChangeTarget(i, Math.max(0, Math.min(20, val)));
                }}
                className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-0.5 py-1.5 text-center text-sm font-mono text-slate-700 dark:text-slate-300 shadow-sm transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none hover:border-slate-300 dark:hover:border-slate-600"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
