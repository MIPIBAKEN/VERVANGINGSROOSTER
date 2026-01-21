import React, { useEffect, useState, useMemo } from 'react';
import { ReplacementEntry, SickEntry } from '../types';
import { LESSON_HOURS, formatDateNL } from '../constants';
import { Clock, AlertTriangle, BookOpen, User } from 'lucide-react';

export const TvView: React.FC<{ sickEntries: SickEntry[], replacements: ReplacementEntry[] }> = ({ sickEntries, replacements }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    const r = setInterval(() => window.location.reload(), 30 * 60 * 1000);
    return () => { clearInterval(t); clearInterval(r); };
  }, []);

  const today = formatDateNL(currentTime);
  const activeHours = LESSON_HOURS.filter(h => {
    const [eh, em] = h.end.split(':').map(Number);
    const end = new Date(currentTime); end.setHours(eh, em, 0, 0);
    return currentTime < end;
  });

  const todaySick = sickEntries.filter(s => s.date === today);
  const reps = replacements.filter(r => r.date === today);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col select-none cursor-none overflow-hidden">
      <div className="bg-slate-800 rounded-xl border border-slate-700 mb-4 shrink-0 shadow-2xl">
        <div className="flex justify-between items-center px-8 py-4 border-b border-slate-700">
           <h1 className="text-3xl font-black text-blue-400 uppercase tracking-tighter">
             {currentTime.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
           </h1>
           <div className="text-3xl font-mono text-white bg-slate-900 px-6 py-2 rounded-xl border border-slate-700">
             {currentTime.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
           </div>
        </div>
        <div className="px-8 py-3 bg-red-500/10 flex items-center gap-6 overflow-hidden">
            <div className="flex items-center gap-2 text-red-500 font-black shrink-0"><AlertTriangle size={24} /> AFWEZIG:</div>
            <div className="flex gap-4 overflow-hidden">
                {todaySick.map(s => <span key={s.id} className="bg-red-600 text-white px-4 py-1 rounded-full font-black text-xl">{s.teacherAbbr}</span>)}
                {todaySick.length === 0 && <span className="text-slate-500 italic">Geen afwezigen gemeld.</span>}
            </div>
        </div>
      </div>

      <div className={`flex-1 grid grid-cols-${activeHours.length || 1} gap-3 h-full`}>
        {activeHours.map(h => {
          const items = reps.filter(r => r.lessonHour === h.number);
          return (
            <div key={h.number} className="flex flex-col bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="bg-slate-800 p-4 text-center border-b border-slate-700">
                <div className="text-4xl font-black text-white">{h.number}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{h.start} - {h.end}</div>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto no-scrollbar">
                {items.map(r => (
                  <div key={r.id} className="bg-slate-700 p-3 rounded-xl border-l-8 border-blue-500 shadow-xl">
                    <div className="flex justify-between font-black text-sm mb-1">
                      <span className="text-white text-lg">{r.classGroup}</span>
                      <span className="text-yellow-400">{r.room}</span>
                    </div>
                    <div className="text-slate-400 text-xs line-through mb-1">{r.absentTeacher}</div>
                    <div className="text-green-400 font-black text-lg flex items-center gap-2"><User size={16}/>{r.replacementTeacher}</div>
                    {r.hasTask && <div className="mt-2 text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit"><BookOpen size={10}/> TAAK</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};