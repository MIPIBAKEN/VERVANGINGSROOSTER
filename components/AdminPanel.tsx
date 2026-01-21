import React, { useState } from 'react';
import { SickEntry, ReplacementEntry } from '../types';
import { Reports } from './Reports';
import { Lock, FileText, BarChart3, ShieldCheck, Trash2, RefreshCw } from 'lucide-react';
import { formatDateNL } from '../constants';

interface AdminPanelProps {
  sickEntries: SickEntry[];
  replacements: ReplacementEntry[];
  selectedWeek: string;
  onDeleteSick: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ sickEntries, replacements, selectedWeek, onDeleteSick }) => {
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'HISTORY'>('REPORTS');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthorized(true);
    } else {
      alert('Onjuiste pincode');
      setPin('');
    }
  };

  const handleReset = () => {
    if(confirm("LET OP: Dit wist ALLE gegevens permanent uit de browser. Doorgaan?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Admin Toegang</h2>
          <p className="text-slate-500 text-sm font-bold mb-8 uppercase tracking-widest">Voer pincode in voor systeemfuncties</p>
          
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
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
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
        </div>
        <div className="flex items-center gap-4">
            <button onClick={handleReset} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-red-600 transition-colors uppercase tracking-tighter">
                <RefreshCw size={14} /> Systeem Reset
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <ShieldCheck size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Geautoriseerd</span>
            </div>
        </div>
      </div>

      {activeTab === 'REPORTS' && <Reports sickEntries={sickEntries} replacements={replacements} selectedWeek={selectedWeek} />}
      
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Volledig Overzicht</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <th className="p-6">Datum</th>
                  <th className="p-6">Leerkracht</th>
                  <th className="p-6">Uren</th>
                  <th className="p-6 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...sickEntries].sort((a,b) => b.date.localeCompare(a.date)).map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6 font-bold text-slate-700">{entry.date}</td>
                    <td className="p-6"><span className="font-black text-blue-600 uppercase tracking-tight bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{entry.teacherAbbr}</span></td>
                    <td className="p-6">
                        <div className="flex flex-wrap gap-1">
                            {entry.absentHours.map(h => <span key={h} className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">{h}e</span>)}
                        </div>
                    </td>
                    <td className="p-6 text-right">
                        <button onClick={() => onDeleteSick(entry.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {sickEntries.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-slate-400 italic">Geen gegevens gevonden.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};