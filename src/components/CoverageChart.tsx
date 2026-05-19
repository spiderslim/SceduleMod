import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Shift, DAY_START, DAY_END, DAY_SPAN } from '../types/index';
import { formatTime, intervalOverlap } from '../lib/utils';

interface CoverageChartProps {
  shifts: Shift[];
  targets: number[];
  isDarkMode?: boolean;
}

export default function CoverageChart({ shifts, targets, isDarkMode = false }: CoverageChartProps) {
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 0; i < DAY_SPAN; i++) {
      const h = DAY_START + i;
      let sum = 0;
      shifts.forEach((shift) => {
        const s0 = shift.start;
        const s1 = shift.start + shift.duration;
        let work = intervalOverlap(s0, s1, h, h + 1);
        
        if (shift.meal && work > 0) {
          // Clamp meal within the shift
          const ms = Math.max(shift.start, Math.min(shift.meal.start, shift.start + shift.duration - shift.meal.duration));
          const mealOverlap = intervalOverlap(ms, ms + shift.meal.duration, h, h + 1);
          work = Math.max(0, work - mealOverlap);
        }
        sum += work;
      });

      const target = targets[i] || 0;
      const scheduled = Number(sum.toFixed(2));
      
      data.push({
        hourStr: `${formatTime(h)} - ${formatTime(h + 1)}`,
        scheduled,
        target,
        delta: Number((scheduled - target).toFixed(2))
      });
    }
    return data;
  }, [shifts, targets]);

  const getBarColor = (scheduled: number, target: number) => {
    if (target <= 0) return '#4f46e5'; // indigo-600 / ok
    const delta = scheduled - target;
    if (delta <= -0.5) return '#ef4444'; // red-500 / under
    if (delta < 0) return '#f59e0b'; // amber-500 / warn
    return '#4f46e5'; // indigo-600 / ok
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      const verb = p.delta >= 0 ? 'surplus' : 'deficit';
      return (
        <div className="bg-slate-900 border border-slate-800 text-slate-100 p-3 rounded-lg shadow-xl text-sm max-w-[200px]">
          <p className="font-semibold text-slate-300 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Scheduled:</span>
              <span className="font-mono">{p.scheduled.toFixed(2)}h</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Target:</span>
              <span className="font-mono">{p.target}h</span>
            </p>
            <div className="w-full h-[1px] bg-slate-700 my-1 pb-0.5"></div>
            <p className={`flex justify-between gap-4 ${p.delta < 0 ? 'text-red-400' : 'text-indigo-400'}`}>
              <span>{verb}:</span>
              <span className="font-bold font-mono">{Math.abs(p.delta).toFixed(2)}h</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
          <XAxis 
            dataKey="hourStr" 
            tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
            tickFormatter={(val) => val.split(' - ')[0]} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc' }} />
          
          <Bar dataKey="scheduled" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.scheduled, entry.target)} />
            ))}
          </Bar>
          
          <Line 
            type="step" 
            dataKey="target" 
            stroke={isDarkMode ? '#e2e8f0' : '#0f172a'} 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4, fill: isDarkMode ? '#e2e8f0' : '#0f172a' }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
