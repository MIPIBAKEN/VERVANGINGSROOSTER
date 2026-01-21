import React, { useMemo, useState } from 'react';
import { SickEntry, ReplacementEntry } from '../types';
import { LESSON_HOURS } from '../constants';
import { BarChart3, TrendingUp, Users, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

interface ReportsProps {
  sickEntries: SickEntry[];
  replacements: ReplacementEntry[];
  selectedWeek: string;
}

export const Reports: React.FC<ReportsProps> = ({ sickEntries, replacements, selectedWeek }) => {
  const [reportType, setReportType] = useState<'WEEK' | 'MONTH'>('WEEK');

  const filteredData = useMemo(() => {
    if (reportType === 'WEEK') {
      return {
        sick: sickEntries.filter(s => s.week === selectedWeek),
        reps: replacements.filter(r => r.week === selectedWeek)
      };
    } else {
      const monthPrefix = selectedWeek.substring(0, 7); // "YYYY-MM"
      return {
        sick: sickEntries.filter(s => s.date.includes(monthPrefix.split('-')[1] + '/' + monthPrefix.split('-')[0])),
        reps: replacements.filter(r => r.date.includes(monthPrefix.split('-')[1] + '/' + monthPrefix.split('-')[0]))
      };
    }
  }, [sickEntries, replacements, selectedWeek, reportType]);

  const stats = useMemo(() => {
    const totalAbsentHours = filteredData.sick.reduce((acc, s) => acc + (s.absentHours?.length || 0), 0);
    const completedReps = filteredData.reps.filter(r => r.replacementTeacher && r.classGroup).length;
    const completionRate = totalAbsentHours > 0 ? Math.round((completedReps / totalAbsentHours) * 100) : 0;

    // Hourly distribution
    const hourCounts: Record<number, number> = {};
    LESSON_HOURS.forEach(h => hourCounts[h.number] = 0);
    filteredData.sick.forEach(s => {
      s.absentHours?.forEach(h => {
        // Fix: Use a safer check for existing key to avoid ignoring 0 values (falsy)
        if (hourCounts[h] !== undefined) hourCounts[h]++;
      });
    });

    // Top replacements
    const helperCounts: Record<string, number> = {};
    filteredData.reps.forEach(r => {
      if (r.replacementTeacher && r.replacementTeacher !== 'STUDIE' && r.replacementTeacher !== 'NAAR HUIS') {
        helperCounts[r.replacementTeacher] = (helperCounts[r.replacementTeacher] || 0) + 1;
      }
    });

    const topHelpers = Object.entries(helperCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalAbsentHours,
      completedReps,
      completionRate,
      hourCounts,
      topHelpers
    };
  }, [filteredData]);

  // Fix: Explicitly cast Object.values to number[] to resolve "unknown" spread error in Math.max
  const maxHourValue = Math.max(...(Object.values(stats.hourCounts) as number[]), 1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Rapportage & Analyse</h2>
          <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest">Inzicht in roosterverloop</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
           <button 
            onClick={() => setReportType('WEEK')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${reportType === 'WEEK' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
           >
            Weekoverzicht
           </button>
           <button 
            onClick={() => setReportType('MONTH')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${reportType === 'MONTH' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
           >
            Maandoverzicht
           </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
             <AlertCircle size={32} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Totaal Absent (Uren)</div>
            <div className="text-4xl font-black text-slate-800">{stats.totalAbsentHours}</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${stats.completionRate > 80 ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
             <CheckCircle2 size={32} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Vervangingsgraad</div>
            <div className="text-4xl font-black text-slate-800">{stats.completionRate}%</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
             <TrendingUp size={32} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Uren Opgevangen</div>
            <div className="text-4xl font-black text-slate-800">{stats.completedReps}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hourly Distribution Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
            <BarChart3 className="text-blue-600" />
            Drukste Lesuren
          </h3>
          <div className="flex items-end justify-between h-64 gap-2 pt-4">
            {LESSON_HOURS.map(h => {
              const value = stats.hourCounts[h.number];
              const height = (value / maxHourValue) * 100;
              return (
                <div key={h.number} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex items-end justify-center h-full">
                    {value > 0 && (
                      <div className="absolute -top-6 text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {value}
                      </div>
                    )}
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-700 ease-out ${value > 0 ? 'bg-blue-500 group-hover:bg-blue-600' : 'bg-slate-100'}`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    ></div>
                  </div>
                  <div className="mt-4 text-xs font-black text-slate-500">{h.number}e</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Helpers List */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
            <Users className="text-purple-600" />
            Top Vervangers (Helpers)
          </h3>
          <div className="space-y-4">
            {stats.topHelpers.length === 0 ? (
              <div className="text-center py-20 text-slate-400 italic text-sm">Nog geen data beschikbaar voor deze periode.</div>
            ) : (
              stats.topHelpers.map(([name, count], index) => (
                <div key={name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-purple-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-sm">
                      {index + 1}
                    </div>
                    <span className="font-black text-slate-700 text-lg uppercase">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-purple-600">{count}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">uur</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Telt alleen handmatige vervangingen door collega's</p>
        </div>
      </div>
      
      {/* Month context info */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex items-center justify-between overflow-hidden relative">
          <Calendar className="absolute -right-8 -top-8 text-white/5" size={160} />
          <div>
              <h4 className="text-lg font-black uppercase tracking-tighter text-blue-400">Periode Focus</h4>
              <p className="text-slate-400 text-sm font-medium">
                Deze cijfers zijn gebaseerd op {reportType === 'WEEK' ? `Week ${selectedWeek.split('-W')[1]}` : `de geselecteerde maand`}. 
                Zorg ervoor dat alle vervangingen in het 'Verwerking' scherm correct zijn afgerond voor accurate data.
              </p>
          </div>
      </div>
    </div>
  );
};