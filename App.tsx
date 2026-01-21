import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ViewMode, UserSession, SickEntry, ReplacementEntry, SubstituteDefinition } from './types';
import { SHARED_SECRET, formatDateNL, getISOWeek, generateId } from './constants';
import { StorageService } from './services/storageService';
import { SickRegistration } from './components/SickRegistration';
import { ReplacementProcessing } from './components/ReplacementProcessing';
import { SubstituteManagement } from './components/SubstituteManagement';
import { AdminPanel } from './components/AdminPanel';
import { TvView } from './components/TvView';
import { LayoutDashboard, Stethoscope, Monitor, LogOut, Lock, Filter, Users, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession>({ role: null, isAuthenticated: false });
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [currentWeek, setCurrentWeek] = useState<string>(getISOWeek());
  
  const [sickEntries, setSickEntries] = useState<SickEntry[]>([]);
  const [replacements, setReplacements] = useState<ReplacementEntry[]>([]);
  const [substitutes, setSubstitutes] = useState<SubstituteDefinition[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const initApp = async () => {
      try {
          const [s, r, subs] = await Promise.all([
            StorageService.getSickEntries(),
            StorageService.getReplacements(),
            StorageService.getSubstitutes()
          ]);

          const normalize = (list: any[], prefix: string) => list.map(item => ({
              ...item,
              id: (item.id && typeof item.id === 'string') ? item.id.trim() : generateId(prefix)
          }));

          setSickEntries(normalize(s, 'SICK'));
          setReplacements(normalize(r, 'REP'));
          setSubstitutes(normalize(subs, 'SUB'));
          
          setIsLoaded(true);
          initialLoadDone.current = true;
      } catch (e) {
          console.error("App: Load error", e);
          setIsLoaded(true);
          initialLoadDone.current = true;
      }
    };
    initApp();
  }, []); 

  useEffect(() => {
    if (initialLoadDone.current) StorageService.saveSickEntries(sickEntries);
  }, [sickEntries]);

  useEffect(() => {
    if (initialLoadDone.current) StorageService.saveReplacements(replacements);
  }, [replacements]);

  useEffect(() => {
    if (initialLoadDone.current) StorageService.saveSubstitutes(substitutes);
  }, [substitutes]);

  const handleUpdateSick = useCallback((newEntries: SickEntry[]) => {
    setSickEntries(newEntries);
  }, []);

  const handleDeleteSick = useCallback((idToDelete: string) => {
    const cleanId = String(idToDelete).trim();
    const targetEntry = sickEntries.find(e => String(e.id).trim() === cleanId);
    
    setSickEntries(prev => {
        const filtered = prev.filter(e => String(e.id).trim() !== cleanId);
        return filtered;
    });

    if (targetEntry) {
        setReplacements(prev => {
            const filtered = prev.filter(r => !(r.date === targetEntry.date && r.absentTeacher === targetEntry.teacherAbbr));
            return filtered;
        });
    }
  }, [sickEntries]);

  const handleUpdateReplacements = useCallback((newEntries: ReplacementEntry[]) => {
    setReplacements(newEntries);
  }, []);

  const handleDeleteReplacement = useCallback((idToDelete: string) => {
    const cleanId = String(idToDelete).trim();
    setReplacements(prev => {
        const filtered = prev.filter(r => String(r.id).trim() !== cleanId);
        return filtered;
    });
  }, []);

  const handleUpdateSubstitutes = useCallback((newEntries: SubstituteDefinition[]) => {
    setSubstitutes(newEntries);
  }, []);

  const handleLogin = (secret: string) => {
    if (secret === SHARED_SECRET) {
      setSession({ role: 'SECRETARIAAT', isAuthenticated: true });
      setViewMode('DASHBOARD');
    } else {
      alert('Fout wachtwoord');
    }
  };

  const todayDateStr = useMemo(() => formatDateNL(new Date()), []);
  const todaySick = useMemo(() => sickEntries.filter(s => s.date === todayDateStr), [sickEntries, todayDateStr]);
  const weekSick = useMemo(() => sickEntries.filter(s => s.week === currentWeek), [sickEntries, currentWeek]);

  if (viewMode === 'TV') {
    return (
      <div className="relative">
        <TvView sickEntries={sickEntries} replacements={replacements} />
        <button onClick={() => setViewMode('DASHBOARD')} className="fixed bottom-0 right-0 opacity-0 hover:opacity-50 p-4 text-white bg-red-600 rounded-tl-xl transition z-[9999]">Exit</button>
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
          <h1 className="text-3xl font-black mb-8 text-slate-800 text-center tracking-tight uppercase">School<span className="text-blue-600">Rooster</span></h1>
          <div className="space-y-6">
            <button onClick={() => setViewMode('TV')} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-lg">
              <Monitor size={22} /> Open TV Weergave
            </button>
            <div className="relative border-t border-slate-200 my-8">
                <span className="absolute bg-white px-4 text-xs font-black text-slate-400 -top-2.5 left-1/2 -translate-x-1/2 uppercase tracking-widest">Beheer</span>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin((e.target as any).secret.value); }} className="space-y-3">
              <div className="relative">
                  <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                  <input name="secret" type="password" placeholder="Wachtwoord..." className="w-full border-2 border-slate-200 rounded-xl py-4 pl-12 pr-4 focus:border-blue-500 outline-none transition-all font-medium text-lg bg-slate-50"/>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">Aanmelden</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <nav className="bg-slate-900 text-white shadow-2xl sticky top-0 z-50 border-b border-white/10">
        <div className="w-full px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-10">
              <span className="text-2xl font-black tracking-tighter uppercase">School<span className="text-blue-500">Rooster</span></span>
              <div className="flex space-x-1">
                {[
                  { mode: 'DASHBOARD', icon: LayoutDashboard, label: 'Overzicht' },
                  { mode: 'SICK', icon: Stethoscope, label: 'Ziekte' },
                  { mode: 'SUBSTITUTES', icon: Users, label: 'Vervangers' },
                  { mode: 'PROCESSING', icon: Filter, label: 'Verwerking' },
                  { mode: 'ADMIN', icon: ShieldCheck, label: 'Admin' },
                ].map((item) => (
                  <button 
                    key={item.mode}
                    onClick={() => setViewMode(item.mode as ViewMode)} 
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === item.mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <item.icon size={18} /> {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 shadow-inner">
                 <span className="text-xs font-black text-slate-500 mr-3 uppercase tracking-tighter">Week</span>
                 <input type="week" value={currentWeek} onChange={(e) => setCurrentWeek(e.target.value)} className="bg-transparent border-none text-white text-sm font-bold focus:ring-0 w-36 cursor-pointer" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('TV')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all" title="TV Modus"><Monitor size={20} /></button>
                <button onClick={() => setSession({ role: null, isAuthenticated: false })} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white transition-all" title="Uitloggen"><LogOut size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className={`flex-1 w-full mx-auto p-8 ${viewMode === 'PROCESSING' || viewMode === 'ADMIN' || viewMode === 'DASHBOARD' ? 'max-w-full' : 'max-w-7xl'}`}>
        {!isLoaded ? (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">Bestanden laden...</div>
            </div>
        ) : (
            <div className="animate-in fade-in duration-500">
                {viewMode === 'DASHBOARD' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                                <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-2">
                                    <AlertCircle className="text-red-500" /> Vandaag
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                                        <div className="text-xs font-black text-red-900 uppercase tracking-widest mb-1">Afwezigen Vandaag</div>
                                        <div className="text-5xl font-black text-red-600">{todaySick.length}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Week Totaal</div>
                                            <div className="text-xl font-black text-slate-700">{weekSick.length}</div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                                            <div className="text-xl font-black text-blue-600 flex items-center gap-1"><Calendar size={16}/> OK</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Systeem</h4>
                                <div className="flex items-center gap-2 text-green-400 font-bold">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                    Online
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-8">
                            <SickRegistration entries={sickEntries} onChange={handleUpdateSick} onDelete={handleDeleteSick} selectedWeek={currentWeek} readOnly={true} />
                        </div>
                    </div>
                )}
                {viewMode === 'SICK' && <SickRegistration entries={sickEntries} onChange={handleUpdateSick} onDelete={handleDeleteSick} selectedWeek={currentWeek} />}
                {viewMode === 'SUBSTITUTES' && <SubstituteManagement substitutes={substitutes} onChange={handleUpdateSubstitutes} selectedWeek={currentWeek} />}
                {viewMode === 'PROCESSING' && <ReplacementProcessing sickEntries={sickEntries} replacements={replacements} substitutes={substitutes} onChange={handleUpdateReplacements} onDelete={handleDeleteReplacement} selectedWeek={currentWeek} />}
                {viewMode === 'ADMIN' && <AdminPanel sickEntries={sickEntries} replacements={replacements} selectedWeek={currentWeek} onDeleteSick={handleDeleteSick} />}
            </div>
        )}
      </main>
    </div>
  );
};

export default App;