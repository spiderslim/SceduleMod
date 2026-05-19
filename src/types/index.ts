export const DAY_START = 5;
export const DAY_END = 22;
export const DAY_SPAN = DAY_END - DAY_START;

export interface Meal {
  start: number;
  duration: number;
}

export interface Shift {
  id: string;
  name: string;
  role: string;
  type: 'FT' | 'PT';
  start: number;
  duration: number;
  meal?: Meal;
}

export interface Template {
  id: string;
  name: string;
  shifts: Shift[];
  targets: number[];
}

export const INITIAL_SHIFTS: Shift[] = [];

export const DEFAULT_TARGETS = Array(DAY_SPAN).fill(0);
