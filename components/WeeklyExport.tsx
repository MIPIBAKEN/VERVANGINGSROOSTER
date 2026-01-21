import React, { useMemo } from 'react';
import { ReplacementEntry, SickEntry } from '../types';
import { WEEK_DAYS, formatDateNL } from '../constants';
import { Printer, FileDown } from 'lucide-react';

interface WeeklyExportProps {
  replacements: ReplacementEntry[];
  sickEntries: SickEntry[];
  selectedWeek: string;
}

export const WeeklyExport: React.FC<WeeklyExportProps> = ({ replacements, sickEntries, selectedWeek }) => {
  const weekDates = useMemo(() => {
    const [yearStr, weekNumStr] = selectedWeek.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekNumStr);
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

    const days = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(ISOweekStart);
        d.setDate(d.getDate() + i);
        days.push({
            str: formatDateNL(d),
            label: WEEK_DAYS[i]
        });
    }
    return days;
  }, [selectedWeek]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex items-center justify-between no-print">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">PDF Export / Weekoverzicht</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Geselecteerd: Week {selectedWeek.split('-W')[1]}</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center gap-3 text-sm uppercase tracking-widest"
        >
          <Printer size={20} /> Genereer PDF (Print)
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden main-content">
        <div className="p-10">
          <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-100">
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">School<span className="text-blue-600">Rooster</span></h1>
              <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Wekelijks Vervangingsoverzicht</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-slate-500 uppercase">Week {selectedWeek.split('-W')[1]}</div>
              <div className="text-xs font-bold text-slate-400">{weekDates[0].str} - {weekDates[4].str}</div>
            </div>
          </div>

          <div className="space-y-12">
            {weekDates.map(day => {
              const dayReps = replacements.filter(r => r.date === day.str);
              if (dayReps.length === 0) return null;

              return (
                <div key={day.str} className="break-inside-avoid">
                  <h4 className="text-lg font-black text-slate-800 border-l-4 border-blue-600 pl-4 mb-4 uppercase tracking-tight bg-slate-50 py-2 rounded-r-lg">
                    {day.label} <span className="text-slate-400 font-bold text-sm ml-2">({day.str})</span>
                  </h4>
                  <div className="overflow-hidden border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <th className="p-4 border-b border-slate-200 w-16">Uur</th>
                          <th className="p-4 border-b border-slate-200">Afwezig</th>
                          <th className="p-4 border-b border-slate-200">Klas</th>
                          <th className="p-4 border-b border-slate-200">Lokaal</th>
                          <th className="p-4 border-b border-slate-200">Vervanger</th>
                          <th className="p-4 border-b border-slate-200">Taak</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dayReps.sort((a,b) => a.lessonHour - b.lessonHour).map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/50">
                            <td className="p-4 font-black text-slate-700">{r.lessonHour}e</td>
                            <td className="p-4 font-bold text-red-600 uppercase">{r.absentTeacher}</td>
                            <td className="p-4 font-bold uppercase">{r.classGroup}</td>
                            <td className="p-4 font-mono text-slate-500">{r.room || '-'}</td>
                            <td className="p-4 font-black text-blue-600 uppercase">{r.replacementTeacher}</td>
                            <td className="p-4">
                              {r.hasTask ? <span className="text-[10px] bg-blue-50 text-blue-600 font-black px-2 py-1 rounded uppercase">Ja</span> : <span className="text-[10px] text-slate-300">Nee</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            
            {!weekDates.some(d => replacements.some(r => r.date === d.str)) && (
              <div className="text-center py-20 text-slate-400 italic">Geen vervangingen geregistreerd voor deze week.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};