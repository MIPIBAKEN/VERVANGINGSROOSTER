import React, { useState } from 'react';
import { SickEntry, ReplacementEntry } from '../types';
import { Reports } from './Reports';
import { WeeklyExport } from './WeeklyExport';
import { Lock, FileText, BarChart3, ShieldCheck, Trash2, Calendar, Monitor, Copy, Check, FileDown } from 'lucide-react';

interface AdminPanelProps {
  sickEntries: SickEntry[];
  replacements: ReplacementEntry[];
  selectedWeek: string;
  onDeleteSick: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ sickEntries, replacements, selectedWeek, onDeleteSick }) => {
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'HISTORY' | 'TV_CONFIG' | 'EXPORT'>('REPORTS');
  const [copied, setCopied] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthorized(true);
    } else {
      alert('Onjuiste pincode');
      setPin('');
    }
  };

  const getTvUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'tv');
    return url.toString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iframeCode = `<iframe src="${getTvUrl()}" style="border:none; width:100%; height:100vh;" allow="fullscreen"></iframe>`;

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Admin Toegang</h2>
          <p className="text-slate-500 text-sm font-bold mb-8 uppercase tracking-widest">Voer pincode in voor rapportage</p>
          
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input 
              autoFocus
              type="password" 
              maxLength={4}
              placeholder="••••"
              className="w-full text-center text-4xl tracking-[1em] p-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black bg-slate-50 transition-all"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-black transition-all shadow-lg">
              VERIFIËREN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between no-print">
        <div className="flex gap-2">
           <button 
            onClick={() => setActiveTab('REPORTS')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${activeTab === 'REPORTS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
           >
            <BarChart3 size={18} /> Analyse
           </button>
           <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${activeTab === 'HISTORY' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
           >
            <FileText size={18} /> Historiek
           </button>
           <button 
            onClick={() => setActiveTab('EXPORT')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${activeTab === 'EXPORT' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
           >
            <FileDown size={18} /> Weekoverzicht/PDF
           </button>
           <button 
            onClick={() => setActiveTab('TV_CONFIG')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${activeTab === 'TV_CONFIG' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
           >
            <Monitor size={18} /> TV Weergave
           </button>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
            <ShieldCheck size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Geautoriseerd</span>
        </div>
      </div>

      {activeTab === 'REPORTS' && (
        <Reports sickEntries={sickEntries} replacements={replacements} selectedWeek={selectedWeek} />
      )}

      {activeTab === 'EXPORT' && (
        <WeeklyExport sickEntries={sickEntries} replacements={replacements} selectedWeek={selectedWeek} />
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Volledig Overzicht Afwezigen</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Alle historische data</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <th className="p-6">Datum</th>
                  <th className="p-6">Leerkracht</th>
                  <th className="p-6">Uren</th>
                  <th className="p-6">Opmerking</th>
                  <th className="p-6 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...sickEntries].sort((a,b) => {
                    const dateA = a.date.split('/').reverse().join('');
                    const dateB = b.date.split('/').reverse().join('');
                    return dateB.localeCompare(dateA);
                }).map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6">
                        <div className="flex items-center gap-3">
                            <Calendar size={16} className="text-slate-300" />
                            <span className="font-bold text-slate-700">{entry.date}</span>
                        </div>
                    </td>
                    <td className="p-6">
                        <span className="font-black text-blue-600 uppercase tracking-tight bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{entry.teacherAbbr}</span>
                    </td>
                    <td className="p-6">
                        <div className="flex flex-wrap gap-1">
                            {entry.absentHours.map(h => (
                                <span key={h} className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">{h}e</span>
                            ))}
                        </div>
                    </td>
                    <td className="p-6 text-slate-500 italic text-sm">
                        {entry.note || '-'}
                    </td>
                    <td className="p-6 text-right">
                        <button 
                            onClick={() => onDeleteSick(entry.id)}
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>
                    </td>
                  </tr>
                ))}
                {sickEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-slate-400 italic">Geen gegevens gevonden.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'TV_CONFIG' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Narrowcasting / TV Koppeling</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configuratie voor Raspberry Pi of externe software</p>
          </div>
          
          <div className="p-8 space-y-10">
            {/* Direct Link Section */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-700 uppercase text-xs tracking-widest">Directe Browser Link</h4>
                  <button 
                    onClick={() => copyToClipboard(getTvUrl())}
                    className="flex items-center gap-2 text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Gekopieerd' : 'Kopieer Link'}
                  </button>
               </div>
               <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-600 break-all">
                  {getTvUrl()}
               </div>
               <p className="text-xs text-slate-400 leading-relaxed italic">
                 Gebruik deze link op de Raspberry Pi. De app start automatisch op in de volledige TV-weergave modus zonder te vragen om een wachtwoord.
               </p>
            </div>

            <hr className="border-slate-100" />

            {/* Iframe Section */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-700 uppercase text-xs tracking-widest">Iframe Insluitcode</h4>
                  <button 
                    onClick={() => copyToClipboard(iframeCode)}
                    className="flex items-center gap-2 text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Gekopieerd' : 'Kopieer Code'}
                  </button>
               </div>
               <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-sm text-blue-300 overflow-x-auto whitespace-pre">
                  {iframeCode}
               </div>
               <p className="text-xs text-slate-400 leading-relaxed italic">
                 Kopieer deze code om de TV-weergave in te sluiten in een bestaande website of narrowcasting dashboard.
               </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
                <Monitor className="text-blue-600 shrink-0" size={24} />
                <div>
                    <h5 className="font-black text-blue-800 text-sm uppercase tracking-tight">Raspberry Pi Tip</h5>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        Stel de browser van de Pi in op "Kiosk Mode" met de bovenstaande link. 
                        Zo wordt de weergave bij het opstarten direct op het volledige scherm getoond zonder muiscursor of adresbalk.
                    </p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};