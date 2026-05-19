import React, { useState, useEffect } from 'react';
import { Shift, DAY_START, DAY_END } from '../types/index';
import { timeInputFromDecimal, decimalFromTimeInput, roundHalf } from '../lib/utils';
import { Trash2, Copy, Check, X } from 'lucide-react';

/* =========================================
   Edit Shift Popover
   ========================================= */

interface EditShiftPopoverProps {
  shift: Shift | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onApply: (shiftId: string, updates: Partial<Shift>) => void;
  onDelete: (shiftId: string) => void;
  onDuplicate: (shift: Shift) => void;
}

export function EditShiftPopover({ shift, position, onClose, onApply, onDelete, onDuplicate }: EditShiftPopoverProps) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [lunch, setLunch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (shift) {
      setStart(timeInputFromDecimal(shift.start));
      setEnd(timeInputFromDecimal(shift.start + shift.duration));
      if (shift.meal) {
        setLunch(timeInputFromDecimal(shift.meal.start));
      } else {
        setLunch('');
      }
      setError('');
    }
  }, [shift]);

  // Handle escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!shift || !position) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let s = roundHalf(decimalFromTimeInput(start));
    let eTime = roundHalf(decimalFromTimeInput(end));

    if (Number.isNaN(s) || Number.isNaN(eTime)) return setError('Invalid times.');
    if (s < DAY_START) s = DAY_START;
    if (eTime > DAY_END) eTime = DAY_END;
    if (eTime <= s) return setError('End must be after start.');

    const duration = roundHalf(eTime - s);
    if (duration < 1) return setError('Shift must be min 1 hour.');

    let updates: Partial<Shift> = { start: s, duration };

    if (shift.meal) {
      const mealDur = shift.meal.duration;
      if (duration < mealDur) return setError('Shift shorter than lunch duration.');
      
      let l = roundHalf(decimalFromTimeInput(lunch));
      if (Number.isNaN(l)) return setError('Invalid lunch time.');
      
      if (l < s || l + mealDur > eTime) {
        return setError('Lunch break must fit entirely within the shift.');
      }
      
      updates.meal = { start: l, duration: mealDur };
    }

    onApply(shift.id, updates);
  };

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 300),
    top: Math.min(position.y, window.innerHeight - 350),
    zIndex: 60,
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/20 dark:bg-slate-900/50 backdrop-blur-sm transition-colors duration-200" onClick={onClose} />
      <div style={style} className="w-72 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white leading-tight">Edit Shift</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pb-4">{shift.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-widest">Start</label>
              <input type="time" step="1800" required className="w-full text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-widest">End</label>
              <input type="time" step="1800" required className="w-full text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
          <div className={!shift.meal ? "opacity-50 pointer-events-none" : ""}>
            <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-widest">Lunch</label>
            <input type="time" step="1800" required={!!shift.meal} className="w-full text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={lunch} onChange={e => setLunch(e.target.value)} />
          </div>

          {error && <p className="text-[10px] uppercase text-red-600 dark:text-red-400 font-bold tracking-wide">{error}</p>}

          <div className="pt-3 flex justify-between gap-1 border-t border-slate-100 dark:border-slate-800 mt-2">
             <div className="flex gap-1">
               <button type="button" onClick={() => onDelete(shift.id)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded" title="Delete">
                 <Trash2 className="w-4 h-4" />
               </button>
               <button type="button" onClick={() => onDuplicate(shift)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded" title="Duplicate">
                 <Copy className="w-4 h-4" />
               </button>
             </div>
             <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-3 py-1.5 text-[10px] uppercase tracking-wide font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-[10px] uppercase tracking-wide font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-1 shadow-sm"><Check className="w-3 h-3" /> Save</button>
             </div>
          </div>
        </form>
      </div>
    </>
  );
}

/* =========================================
   Add Shift Modal
   ========================================= */

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (shift: Partial<Shift>, lunchProps: { isEnabled: boolean; start: string; duration: number }) => void;
  initialData?: Shift | null;
}

export function AddShiftModal({ isOpen, onClose, onAdd, initialData }: AddShiftModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Digital Personal Shopper');
  const [type, setType] = useState<'FT' | 'PT'>('FT');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [lunchDur, setLunchDur] = useState(1);
  const [lunch, setLunch] = useState('13:00');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(''); // Intentionally blank for duplicate
        setRole(initialData.role);
        setType(initialData.type);
        setStart(timeInputFromDecimal(initialData.start));
        setEnd(timeInputFromDecimal(initialData.start + initialData.duration));
        if (initialData.meal) {
           setLunchDur(initialData.meal.duration);
           setLunch(timeInputFromDecimal(initialData.meal.start));
        } else {
           setLunchDur(0);
        }
      } else {
        setName('');
        setRole('Digital Personal Shopper');
        setType('FT');
        setStart('09:00');
        setEnd('17:00');
        setLunchDur(1);
        setLunch('13:00');
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let s = roundHalf(decimalFromTimeInput(start));
    let eTime = roundHalf(decimalFromTimeInput(end));

    if (Number.isNaN(s) || Number.isNaN(eTime)) return setError('Invalid times.');
    if (s < DAY_START || eTime > DAY_END) return setError('Shift out of bounds.');
    if (eTime <= s) return setError('End must be after start.');
    if (eTime - s < 1) return setError('Shift must be min 1 hour.');

    if (lunchDur > 0) {
      let l = roundHalf(decimalFromTimeInput(lunch));
      if (Number.isNaN(l)) return setError('Invalid lunch.');
      if (l < s || l + lunchDur > eTime) {
        return setError('Lunch break must fit entirely within the shift.');
      }
    }

    onAdd(
      { name, role, type, start: s, duration: eTime - s },
      { isEnabled: lunchDur > 0, start: lunch, duration: lunchDur }
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/20 dark:bg-slate-900/50 backdrop-blur-sm transition-colors duration-200" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 pointer-events-auto animate-in zoom-in-95 duration-200 transition-colors">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-sm uppercase tracking-wider font-bold text-slate-800 dark:text-white">{initialData ? 'Duplicate Shift' : 'Add New Shift'}</h2>
            <button onClick={onClose} className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"><X className="w-4 h-4" /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
               <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Associate Name</label>
               <input autoFocus required className="w-full text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={name} onChange={e=>setName(e.target.value)} placeholder="Associate Name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Role</label>
                 <input required className="w-full text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={role} onChange={e=>setRole(e.target.value)} />
              </div>
              <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Type</label>
                 <select className="w-full text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={type} onChange={e=>setType(e.target.value as 'FT'|'PT')}>
                   <option value="FT">Full-time (FT)</option>
                   <option value="PT">Part-time (PT)</option>
                 </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Shift Start</label>
                  <input type="time" step="1800" required className="w-full font-mono text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={start} onChange={e=>setStart(e.target.value)} />
               </div>
               <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Shift End</label>
                  <input type="time" step="1800" required className="w-full font-mono text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={end} onChange={e=>setEnd(e.target.value)} />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded border border-slate-100 dark:border-slate-800 transition-colors">
               <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Lunch Duration</label>
                  <select className="w-full text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={lunchDur} onChange={e=>setLunchDur(Number(e.target.value))}>
                    <option value={0}>None</option>
                    <option value={0.5}>30 minutes</option>
                    <option value={1}>1 hour</option>
                  </select>
               </div>
               <div className={lunchDur === 0 ? "opacity-50 pointer-events-none" : ""}>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Lunch Start</label>
                  <input type="time" step="1800" required={lunchDur > 0} className="w-full font-mono text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={lunch} onChange={e=>setLunch(e.target.value)} />
               </div>
            </div>

            {error && <p className="text-[10px] uppercase font-bold tracking-wide text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">{error}</p>}

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-4">
               <button type="button" onClick={onClose} className="px-4 py-2 font-bold tracking-wide uppercase text-[10px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors">Cancel</button>
               <button type="submit" className="px-4 py-2 font-bold tracking-wide uppercase text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded transition-colors">
                 {initialData ? 'Create Duplicate' : 'Add Shift'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
