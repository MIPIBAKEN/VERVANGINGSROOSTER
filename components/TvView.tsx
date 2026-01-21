import React, { useEffect, useState, useMemo } from 'react';
import { ReplacementEntry, SickEntry } from '../types';
import { LESSON_HOURS, formatDateNL } from '../constants';
import { Clock, AlertTriangle, BookOpen, User } from 'lucide-react';

interface TvViewProps {
  sickEntries: SickEntry[];
  replacements: ReplacementEntry[];
}

export const TvView: React.FC<TvViewProps> = ({ sickEntries, replacements }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Basic clock timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); 
    
    // Kiosk safety: Force a full browser reload every 30 minutes to keep Chromium fresh on Raspberry Pi
    const reloadTimer = setInterval(() => {
        window.location.reload();
    }, 30 * 60 * 1000);

    return () => {
        clearInterval(timer);
        clearInterval(reloadTimer);
    };
  }, []);

  const todayDateStr = useMemo(() => formatDateNL(currentTime), [currentTime]);

  // Logic to hide past hours
  const activeHours = useMemo(() => {
    return LESSON_HOURS.filter(hour => {
      const [endH, endM] = hour.end.split(':').map(Number);
      const hourEnd = new Date(currentTime);
      hourEnd.setHours(endH, endM, 0, 0);
      return currentTime < hourEnd;
    });
  }, [currentTime]);

  // Data
  const todaySick = useMemo(() => sickEntries.filter(s => s.date === todayDateStr), [sickEntries, todayDateStr]);
  const todayReplacements = useMemo(() => replacements.filter(r => r.date === todayDateStr), [replacements, todayDateStr]);

  // Group by Hour
  const groupedReplacements = useMemo(() => {
    const groups: Record<number, ReplacementEntry[]> = {};
    LESSON_HOURS.forEach(h => groups[h.number] = []);
    todayReplacements.forEach(r => {
      if (groups[r.lessonHour]) groups[r.lessonHour].push(r);
    });
    return groups;
  }, [todayReplacements]);

  // Grid dynamic columns
  const gridCols = activeHours.length > 0 ? `grid-cols-${activeHours.length}` : 'grid-cols-1';

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 tv-mode flex flex-col font-sans overflow-hidden select-none cursor-none">
      
      {/* 1. Header & Absences Bar */}
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 mb-4 flex flex-col shrink-0">
        <div className="flex justify-between items-center px-6 py-3 border-b border-slate-700">
           <h1 className="text-2xl font-bold text-blue-400 capitalize">
             {currentTime.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
           </h1>
           <div className="flex items-center gap-2 text-xl font-mono text-slate-300">
             <Clock size={20} className="text-blue-500" />
             {currentTime.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
           </div>
        </div>

        <div className="px-6 py-3 bg-red-500/10 flex items-center gap-4 overflow-hidden whitespace-nowrap">
            <div className="flex items-center gap-2 text-red-400 font-bold mr-2">
                <AlertTriangle size={20} />
                <span>AFWEZIG:</span>
            </div>
            {todaySick.length === 0 ? (
                <span className="text-slate-500 italic text-sm">Geen zieken gemeld.</span>
            ) : (
                <div className="flex gap-4 overflow-x-auto no-scrollbar">
                    {todaySick.map(s => (
                        <div key={s.id} className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-red-500/20 shadow-sm">
                            <span className="font-bold text-red-200">{s.teacherAbbr}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* 2. Main Grid */}
      {activeHours.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-700">
            <h2 className="text-4xl font-black text-slate-600 uppercase tracking-widest">Lessen voor vandaag beëindigd</h2>
            <p className="text-slate-500 mt-2 font-bold">Tot morgen!</p>
        </div>
      ) : (
        <div className={`flex-1 grid ${gridCols} gap-2 overflow-hidden h-full`}>
            {activeHours.map((hour) => {
                const items = groupedReplacements[hour.number] || [];
                
                return (
                    <div key={hour.number} className="flex flex-col h-full bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden transition-all duration-500">
                        {/* Column Header */}
                        <div className="bg-slate-800 text-center py-2 border-b border-slate-700">
                            <div className="text-2xl font-bold text-white leading-none">{hour.number}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">{hour.start} - {hour.end}</div>
                        </div>

                        {/* Cards Container */}
                        <div className="p-1 flex-1 overflow-y-auto space-y-2 custom-scrollbar no-scrollbar">
                            {items.length === 0 ? (
                                <div className="h-full flex items-center justify-center opacity-5">
                                    <span className="text-4xl font-bold text-white">{hour.number}</span>
                                </div>
                            ) : (
                                items.map(r => (
                                    <div key={r.id} className="bg-slate-700 rounded p-2 shadow border-l-4 border-blue-500 flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="font-bold text-white">{r.classGroup}</span>
                                            <span className="font-mono text-yellow-400 bg-yellow-400/10 px-1 rounded">{r.room}</span>
                                        </div>
                                        
                                        <div className="flex flex-col text-sm">
                                            <div className="flex items-center gap-1 text-slate-400 text-xs line-through">
                                               <User size={10} /> {r.absentTeacher}
                                            </div>
                                            <div className="flex items-center gap-1 text-green-300 font-bold mt-0.5">
                                               <User size={12} /> {r.replacementTeacher}
                                            </div>
                                        </div>

                                        {r.hasTask && (
                                            <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-300 bg-blue-500/20 px-1 py-0.5 rounded self-start">
                                                <BookOpen size={10} /> Taak
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};