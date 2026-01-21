import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ViewMode, UserSession, SickEntry, ReplacementEntry, SubstituteDefinition } from './types';
import { SHARED_SECRET, formatDateNL } from './constants';
import { StorageService } from './services/storageService';
import { SickRegistration } from './components/SickRegistration';
import { ReplacementProcessing } from './components/ReplacementProcessing';
import { SubstituteManagement } from './components/SubstituteManagement';
import { AdminPanel } from './components/AdminPanel';
import { TvView } from './components/TvView';
import { LayoutDashboard, Stethoscope, Monitor, LogOut, Lock, Filter, Users, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';

export const generateId = (prefix: string = 'ID') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`.toUpperCase();
};

const getISOWeek = (d: Date = new Date()) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

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
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'tv') setViewMode('TV');
  }, []);

  const loadData = useCallback(async () => {
    const [s, r, subs] = await Promise.all([
      StorageService.getSickEntries(),
      StorageService.getReplacements(),
      StorageService.getSubstitutes()
    ]);
    setSickEntries(s);
    setReplacements(r);
    setSubstitutes(subs);
    setIsLoaded(true);
    initialLoadDone.current = true;
  }, []);

  useEffect(() => {
    loadData();
    const handleStorage = (e: StorageEvent) => e.key?.startsWith('school_') && loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadData]);

  useEffect(() => { if (initialLoadDone.current) StorageService.saveSickEntries(sickEntries); }, [sickEntries]);
  useEffect(() => { if (initialLoadDone.current) StorageService.saveReplacements(replacements); }, [replacements]);
  useEffect(() => { if (initialLoadDone.current) StorageService.saveSubstitutes(substitutes); }, [substitutes]);

  const handleDeleteSick = useCallback((id: string) => {
    const entry = sickEntries.find(e => e.id === id);
    setSickEntries(prev => prev.filter(e => e.id !== id));
    if (entry) setReplacements(prev => prev.filter(r => !(r.date === entry.date && r.absentTeacher === entry.teacherAbbr)));
  }, [sickEntries]);

  const handleLogin = (secret: string) => {
    if (secret === SHARED_SECRET) {
      setSession({ role: 'SECRETARIAAT', isAuthenticated: true });
      setViewMode('DASHBOARD');
    } else alert('Onjuist wachtwoord');
  };

  const todayDateStr = useMemo(() => formatDateNL(new Date()), []);
  const todaySick = sickEntries.filter(s => s.date === todayDateStr);

  if (viewMode === 'TV') return <TvView sickEntries={sickEntries} replacements={replacements} />;

  if (!session.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
          <h1 className="text-3xl font-black mb-8 text-slate-800 text-center uppercase tracking-tight">School<span className="text-blue-600">Rooster</span></h1>
          <button onClick={() => { const u = new URL(window.location.href); u.searchParams.set('view', 'tv'); window.location.href = u.toString(); }} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-3 mb-8"><Monitor size={22} /> TV Weergave</button>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin((e.target as any).secret.value); }} className="space-y-3">
            <input name="secret" type="password" placeholder="Wachtwoord..." className="w-full border-2 border-slate-200 rounded-xl py-4 px-6 focus:border-blue-500 outline-none font-medium text-lg bg-slate-50"/>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">Aanmelden</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <nav className="bg-slate-900 text-white shadow-2xl sticky top-0 z-50 no-print">
        <div className="w-full px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-10">
            <span className="text-2xl font-black uppercase tracking-tighter">School<span className="text-blue-500">Rooster</span></span>
            <div className="flex gap-1">
              {[
                { m: 'DASHBOARD', i: LayoutDashboard, l: 'Overzicht' },
                { m: 'SICK', i: Stethoscope, l: 'Ziekte' },
                { m: 'SUBSTITUTES', i: Users, l: 'Vervangers' },
                { m: 'PROCESSING', i: Filter, l: 'Verwerking' },
                { m: 'ADMIN', i: ShieldCheck, l: 'Admin' },
              ].map(x => (
                <button key={x.m} onClick={() => setViewMode(x.m as any)} className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${viewMode === x.m ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <x.i size={18} /> {x.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input type="week" value={currentWeek} onChange={e => setCurrentWeek(e.target.value)} className="bg-slate-800 text-white text-sm font-bold rounded-xl px-4 py-2 border-none" />
            <button onClick={() => setSession({ role: null, isAuthenticated: false })} className="p-3 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>
      <main className="flex-1 p-8 no-print">
        {viewMode === 'DASHBOARD' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-white p-8 rounded-3xl shadow-xl border border-slate-200 h-fit">
              <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><AlertCircle className="text-red-500"/>Vandaag</h3>
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-4">
                <div className="text-xs font-black text-red-900 uppercase mb-1">Afwezigen</div>
                <div className="text-5xl font-black text-red-600">{todaySick.length}</div>
              </div>
            </div>
            <div className="lg:col-span-8">
              <SickRegistration entries={sickEntries} onChange={setSickEntries} onDelete={handleDeleteSick} selectedWeek={currentWeek} readOnly />
            </div>
          </div>
        )}
        {viewMode === 'SICK' && <SickRegistration entries={sickEntries} onChange={setSickEntries} onDelete={handleDeleteSick} selectedWeek={currentWeek} />}
        {viewMode === 'SUBSTITUTES' && <SubstituteManagement substitutes={substitutes} onChange={setSubstitutes} selectedWeek={currentWeek} />}
        {viewMode === 'PROCESSING' && <ReplacementProcessing sickEntries={sickEntries} replacements={replacements} substitutes={substitutes} onChange={setReplacements} onDelete={id => setReplacements(p => p.filter(r => r.id !== id))} selectedWeek={currentWeek} />}
        {viewMode === 'ADMIN' && <AdminPanel sickEntries={sickEntries} replacements={replacements} selectedWeek={currentWeek} onDeleteSick={handleDeleteSick} />}
      </main>
    </div>
  );
};

export default App;