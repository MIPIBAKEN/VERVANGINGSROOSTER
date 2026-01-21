import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ReplacementEntry, SickEntry } from '../types';
import { LESSON_HOURS, formatDateNL } from '../constants';
import { Clock, AlertTriangle, User, MapPin, Users, Calendar } from 'lucide-react';

interface TvViewProps {
  sickEntries: SickEntry[];
  replacements: ReplacementEntry[];
}

export const TvView: React.FC<TvViewProps> = ({ sickEntries, replacements }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => formatDateNL(now), [now]);

  const visibleHours = useMemo(() => {
    return LESSON_HOURS.filter(h => {
      const [endH, endM] = h.end.split(':').map(Number);
      const endTime = new Date(now);
      endTime.setHours(endH, endM, 0, 0);
      return now < endTime;
    }).slice(0, 5); 
  }, [now]);

  const todayReps = useMemo(() => replacements.filter(r => r.date === todayStr), [replacements, todayStr]);
  const todaySick = useMemo(() => sickEntries.filter(s => s.date === todayStr), [sickEntries, todayStr]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col p-6 overflow-hidden select-none">
      
      {/* HEADER SECTIE MET MARQUEE */}
      <div className="flex gap-6 mb-8 items-stretch shrink-0">
        <div className="bg-slate-900/80 border border-slate-800 rounded-[2rem] p-6 shadow-2xl flex items-center gap-6 min-w-[380px]">
          <div className="bg-blue-500/10 p-4 rounded-2xl">
            <Clock size={40} className="text-blue-400" />
          </div>
          <div>
            <div className="text-6xl font-black font-mono tracking-tighter tabular-nums leading-none">
              {now.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-blue-400 font-bold uppercase tracking-widest text-[10px] mt-2">
              {now.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-[2rem] shadow-2xl flex items-center overflow-hidden relative">
          {todaySick.length > 0 ? (
            <div className="flex items-center w-full h-full">
              <div className="bg-red-600 self-stretch px-8 flex items-center gap-3 z-10 shadow-xl">
                <AlertTriangle size={32} className="text-white" />
                <span className="font-black text-2xl uppercase tracking-tighter">AFWEZIG</span>
              </div>
              
              {/* Marquee Container */}
              <div className="flex-1 overflow-hidden relative">
                <div className={`${todaySick.length > 8 ? 'animate-marquee' : 'flex px-8 gap-4'}`}>
                  {/* We verdubbelen de lijst voor de marquee loop als het er veel zijn */}
                  {[...todaySick, ...(todaySick.length > 8 ? todaySick : [])].map((s, idx) => (
                    <div key={`${s.id}-${idx}`} className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl shrink-0">
                      <span className="text-3xl font-black text-slate-100 uppercase tracking-tight">{s.teacherAbbr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-10 flex items-center gap-4 text-slate-500">
              <Calendar size={28} />
              <span className="text-xl font-bold uppercase tracking-[0.3em] italic opacity-50">Geen afwezigen gemeld</span>
            </div>
          )}
        </div>
      </div>

      {/* ROOSTER GRID MET AUTO-SCROLLING KOLOMMEN */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {visibleHours.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 rounded-[3rem] border-4 border-dashed border-slate-800 animate-slide-in">
            <Calendar size={120} className="text-slate-800 mb-6" />
            <h2 className="text-7xl font-black text-slate-700 uppercase tracking-widest">Einde Lessen</h2>
            <p className="text-3xl text-slate-600 mt-2 font-bold uppercase tracking-widest">Tot morgen vroeg!</p>
          </div>
        ) : (
          visibleHours.map((h, idx) => {
            const hourReps = todayReps.filter(r => r.lessonHour === h.number);
            
            const isNow = (() => {
                const [sH, sM] = h.start.split(':').map(Number);
                const [eH, eM] = h.end.split(':').map(Number);
                const start = new Date(now); start.setHours(sH, sM, 0, 0);
                const end = new Date(now); end.setHours(eH, eM, 0, 0);
                return now >= start && now <= end;
            })();

            return (
              <div 
                key={h.number} 
                className={`flex-1 flex flex-col rounded-[2.5rem] border transition-all duration-500 animate-slide-in shadow-2xl overflow-hidden ${
                  isNow 
                  ? 'bg-blue-600/10 border-blue-500/40 ring-4 ring-blue-500/10 scale-[1.02] z-10' 
                  : 'bg-slate-900/40 border-slate-800/50'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`p-6 text-center border-b ${isNow ? 'bg-blue-600/20 border-blue-500/30 shadow-lg' : 'bg-slate-900/60 border-slate-800'}`}>
                  <div className={`text-8xl font-black leading-none tracking-tighter ${isNow ? 'text-blue-400' : 'text-white'}`}>{h.number}</div>
                  <div className={`text-[10px] font-black uppercase tracking-[0.4em] mt-2 ${isNow ? 'text-blue-300' : 'text-slate-500'}`}>
                    {h.start} - {h.end}
                  </div>
                </div>

                <div className="flex-1 relative overflow-hidden">
                  <div className={`p-4 space-y-4 no-scrollbar h-full overflow-y-auto ${hourReps.length > 3 ? 'auto-scroll-content' : ''}`}>
                    {hourReps.length === 0 ? (
                      <div className="h-full flex items-center justify-center opacity-5">
                        <span className="text-[12rem] font-black">{h.number}</span>
                      </div>
                    ) : (
                      hourReps.map(rep => (
                        <div key={rep.id} className="bg-slate-800/90 rounded-[2rem] p-5 border-l-[10px] border-blue-500 shadow-xl space-y-4 transform transition-transform hover:scale-[1.02]">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl">
                              <Users size={20} className="text-blue-400" />
                              <span className="text-3xl font-black tracking-tighter text-white">{rep.classGroup}</span>
                            </div>
                            <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20">
                              <MapPin size={18} />
                              <span className="text-xl font-bold font-mono tracking-tighter">{rep.room || '--'}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 text-sm font-bold line-through decoration-red-500/50 decoration-2 uppercase tracking-tighter truncate">
                              {rep.absentTeacher}
                            </span>
                            <div className="flex items-center gap-3 text-emerald-400">
                              <User size={24} className="shrink-0" />
                              <span className="text-4xl font-black uppercase tracking-tighter truncate leading-none">
                                {rep.replacementTeacher}
                              </span>
                            </div>
                          </div>

                          {rep.hasTask && (
                            <div className="bg-blue-500/20 text-blue-400 text-center py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.5em] border border-blue-500/30 shadow-sm">
                              Taak Voorzien
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {/* Placeholder voor kolommen met veel content om scrollruimte te geven */}
                    {hourReps.length > 3 && <div className="h-40"></div>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 flex justify-between items-center px-10 text-slate-700 font-black text-[10px] uppercase tracking-[0.8em] shrink-0 border-t border-slate-900 pt-4">
        <div className="flex items-center gap-4">
            <span className="text-blue-500/50">SchoolRooster Pro 2024</span>
            <div className="h-1 w-1 rounded-full bg-slate-800"></div>
            <span>v2.1 High Performance Display</span>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 px-6 py-2 rounded-full border border-slate-800/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-400">Sync: Real-time</span>
        </div>
      </div>
    </div>
  );
};