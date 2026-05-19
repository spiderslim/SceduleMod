import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(decimalHours: number): string {
  let hrs = Math.floor(decimalHours);
  let mins = Math.round((decimalHours - hrs) * 60);
  if (mins === 60) {
    hrs += 1;
    mins = 0;
  }
  const ampm = hrs >= 12 && hrs < 24 ? 'pm' : 'am';
  hrs = hrs % 12;
  hrs = hrs ? hrs : 12;
  const minsStr = mins === 0 ? '' : `:${mins.toString().padStart(2, '0')}`;
  return `${hrs}${minsStr}${ampm}`;
}

export function formatHoursShort(h: number): string {
  if (Math.abs(h - Math.round(h)) < 1e-6) return `${Math.round(h)}h`;
  return `${h.toFixed(1)}h`;
}

export function decimalFromTimeInput(value: string | null): number {
  if (!value) return NaN;
  const parts = value.split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h)) return NaN;
  return h + (Number.isNaN(m) ? 0 : m) / 60;
}

export function timeInputFromDecimal(d: number): string {
  let h = Math.floor(d);
  let mins = Math.round((d - h) * 60);
  if (mins >= 60) {
    h += 1;
    mins -= 60;
  }
  if (h >= 24) {
    h = 23;
    mins = 59;
  }
  return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function roundHalf(x: number) {
  return Math.round(x * 2) / 2;
}

export function intervalOverlap(a0: number, a1: number, b0: number, b1: number) {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}
