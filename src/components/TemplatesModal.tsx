import React, { useState } from 'react';
import { X, Save, Play, Trash2, Bookmark } from 'lucide-react';
import { Template } from '../types/index';
import { cn } from '../lib/utils';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  onSave: (name: string) => void;
  onLoad: (template: Template) => void;
  onDelete: (id: string) => void;
}

export default function TemplatesModal({ isOpen, onClose, templates, onSave, onLoad, onDelete }: TemplatesModalProps) {
  const [newName, setNewName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!newName.trim()) return;
    onSave(newName.trim());
    setNewName('');
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 transition-colors">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Schedule Templates</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-400 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Save Current as Template
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Template Name..."
                className="flex-grow border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
              />
              <button 
                onClick={handleSave}
                disabled={!newName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-semibold transition flex items-center gap-2 disabled:bg-indigo-400 dark:disabled:bg-indigo-800/50"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Saved Templates
            </label>
            {templates.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-800 border-dashed text-sm transition-colors">
                No templates saved yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition group">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.shifts.length} shifts</div>
                    </div>
                    <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => onLoad(t)}
                        className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded tooltip"
                        title="Load Template"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded tooltip"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
