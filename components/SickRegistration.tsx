import React, { useState } from 'react';
import { SickEntry } from '../types';
import { WEEK_DAYS, formatDateNL, LESSON_HOURS, isValidLessonHour } from '../constants';
import { Trash2, Plus, X, Calendar, Clock, User, Save, AlertCircle } from 'lucide-react';
import { generateId } from '../App';

interface SickRegistrationProps {
  entries: SickEntry[];
  onChange: (entries: SickEntry[]) => void;
  onDelete: (id: string) => void;
  selectedWeek: string;
  readOnly?: boolean;
}

const getDatesForWeek = (weekStr: string): Date[] => {
  const [yearStr, weekNumStr] = weekStr.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekNumStr);
  
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
      
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(ISOweekStart);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const getISOWeek = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export const SickRegistration: React.FC<SickRegistrationProps> = ({ 
  entries, 
  onChange, 
  onDelete,
  selectedWeek, 
  readOnly = false 
}) => {
  const dates = getDatesForWeek(selectedWeek);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); 
  const [isPeriod, setIsPeriod] = useState(false);
  
  const [startDate, setStartDate] = useState(dates[0].toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(dates[0].toISOString().split('T')[0]);
  
  const [selectedDate, setSelectedDate] = useState<string>(formatDateNL(dates[0]));
  const [teacherName, setTeacherName] = useState('');
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [note, setNote] = useState('');
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openNewModal = (dateStr: string) => {
    setEditingId(null);
    setIsPeriod(false);
    setSelectedDate(dateStr);
    
    const parts = dateStr.split('/');
    const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
    setStartDate(iso);
    setEndDate(iso);
    
    setTeacherName('');
    
    // Default valid hours for that specific day
    const dayName = WEEK_DAYS[dates.findIndex(d => formatDateNL(d) === dateStr)];
    const validHours = LESSON_HOURS.filter(h => isValidLessonHour(dayName, h.number)).map(h => h.number);
    setSelectedHours(validHours);
    
    setNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (entry: SickEntry) => {
    setEditingId(String(entry.id));
    setIsPeriod(false);
    setSelectedDate(entry.date);
    setTeacherName(entry.teacherAbbr);
    setSelectedHours(entry.absentHours || []);
    setNote(entry.note || '');
    setIsModalOpen(true);
  };

  const toggleHour = (hour: number) => {
    if (selectedHours.includes(hour)) {
      setSelectedHours(selectedHours.filter(h => h !== hour));
    } else {
      setSelectedHours([...selectedHours, hour].sort((a, b) => a - b));
    }
  };

  const handleSave = () => {
    if (!teacherName || selectedHours.length === 0) {
      alert("Vul een naam in en selecteer minstens één uur.");
      return;
    }

    if (isPeriod && !editingId) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            alert("Einddatum kan niet voor startdatum liggen.");
            return;
        }
        const newEntries: SickEntry[] = [];
        let current = new Date(start);
        while (current <= end) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) {
                const dateStr = formatDateNL(current);
                const weekStr = getISOWeek(current);
                const dayName = WEEK_DAYS[day - 1];
                // Filter selected hours to only those valid for this specific day
                const dailyValidHours = selectedHours.filter(h => isValidLessonHour(dayName, h));
                
                if (dailyValidHours.length > 0) {
                  newEntries.push({
                      id: generateId('SICK'),
                      week: weekStr,
                      date: dateStr,
                      teacherAbbr: teacherName.toUpperCase(),
                      absentHours: dailyValidHours,
                      note: note
                  });
                }
            }
            current.setDate(current.getDate() + 1);
        }
        if (newEntries.length === 0) {
            alert("Geen geldige schooldagen in deze periode.");
            return;
        }
        onChange([...entries, ...newEntries]);
    } else if (editingId) {
        const cleanEditingId = String(editingId).trim();
        onChange(entries.map(e => String(e.id).trim() === cleanEditingId ? {
            ...e,
            teacherAbbr: teacherName.toUpperCase(),
            absentHours: selectedHours,
            note: note
        } : e));
    } else {
        const newEntry: SickEntry = {
            id: generateId('SICK'),
            week: selectedWeek,
            date: selectedDate,
            teacherAbbr: teacherName.toUpperCase(),
            absentHours: selectedHours,
            note: note
        };
        onChange([...entries, newEntry]);
    }
    setIsModalOpen(false);
  };

  const handleTriggerDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanId = String(id).trim();
    if (confirmDeleteId === cleanId) {
        onDelete(cleanId);
        setConfirmDeleteId(null);
    } else {
        setConfirmDeleteId(cleanId);
        setTimeout(() => setConfirmDeleteId(null), 5000);
    }
  };

  const currentDayIndex = dates.findIndex(d => formatDateNL(d) === selectedDate);
  const currentDayName = WEEK_DAYS[currentDayIndex === -1 ? 0 : dates[currentDayIndex].getDay() - 1];

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Afwezigheden</h2>
            <p className="text-sm font-bold text-slate-400">Weekoverzicht {selectedWeek}</p>
        </div>
        {readOnly && <span className="text-xs font-black bg-blue-600 text-white px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-100">Status Bord</span>}
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full">
            {dates.map((date) => {
            const dateStr = formatDateNL(date);
            const dayName = WEEK_DAYS[date.getDay() - 1];
            const dailyEntries = entries.filter(e => e.date === dateStr);

            return (
                <div key={dateStr} className="flex flex-col bg-white rounded-2xl border border-slate-200 h-full shadow-sm overflow-hidden min-h-[400px]">
                    <div className="p-4 bg-slate-800 text-white text-center">
                        <div className="font-black text-xs uppercase tracking-widest">{dayName}</div>
                        <div className="text-[10px] font-bold text-slate-400 font-mono mt-0.5 opacity-80">{dateStr}</div>
                    </div>

                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                        {dailyEntries.map(entry => (
                            <div 
                                key={entry.id} 
                                className={`flex flex-col rounded-xl border transition-all overflow-hidden group/card ${confirmDeleteId === String(entry.id) ? 'border-red-500 ring-2 ring-red-100 bg-red-50/20' : 'border-slate-200 bg-white hover:border-blue-400'}`}
                            >
                                <div className={`flex items-center justify-between px-3 py-2 border-b border-slate-100 ${confirmDeleteId === String(entry.id) ? 'bg-red-50' : 'bg-slate-50'}`}>
                                    <span className={`font-black uppercase tracking-tight ${readOnly ? 'text-lg text-blue-700' : 'text-xs text-slate-800'} ${confirmDeleteId === String(entry.id) ? 'text-red-700' : ''}`}>
                                        {entry.teacherAbbr}
                                    </span>
                                    {!readOnly && (
                                        <button 
                                            type="button"
                                            onClick={(e) => handleTriggerDelete(e, entry.id)}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all text-[10px] font-black uppercase tracking-tighter shadow-sm ${confirmDeleteId === String(entry.id) ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                                        >
                                            {confirmDeleteId === String(entry.id) ? <>WIS?</> : <Trash2 size={14} />}
                                        </button>
                                    )}
                                </div>

                                {!readOnly && (
                                    <div 
                                        onClick={() => openEditModal(entry)}
                                        className="p-3 cursor-pointer hover:bg-blue-50/30 transition-colors flex flex-col gap-2"
                                    >
                                        <div className="flex flex-wrap gap-1">
                                            {(entry.absentHours || []).map(h => (
                                                <span key={h} className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                    {h}e
                                                </span>
                                            ))}
                                        </div>
                                        {entry.note && (
                                            <div className="text-[9px] text-slate-400 italic bg-slate-50/50 p-1 rounded border border-slate-100 truncate">
                                                {entry.note}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {!readOnly && (
                            <button 
                                type="button"
                                onClick={() => openNewModal(dateStr)}
                                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-tight"
                            >
                                <Plus size={16} /> Toevoegen
                            </button>
                        )}

                        {readOnly && dailyEntries.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                                <AlertCircle className="text-slate-400 mb-2" size={24} />
                                <span className="text-[10px] font-black uppercase text-slate-400">Geen zieken</span>
                            </div>
                        )}
                    </div>
                </div>
            );
            })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[100] p-4 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                    <h3 className="font-black text-xl tracking-tight flex items-center gap-3">
                        {editingId ? <AlertCircle size={24} className="text-orange-400"/> : <User size={24} className="text-blue-400"/>} 
                        {editingId ? 'Bewerken' : 'Nieuwe Melding'}
                    </h3>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:text-white hover:bg-white/20 transition-all">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    {!editingId && (
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => setIsPeriod(false)}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${!isPeriod ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                EÉN DAG
                            </button>
                            <button 
                                onClick={() => setIsPeriod(true)}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${isPeriod ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                PERIODE
                            </button>
                        </div>
                    )}

                    {isPeriod && !editingId ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Van</label>
                                <input 
                                    type="date" 
                                    className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold bg-slate-50 transition-all"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tot</label>
                                <input 
                                    type="date" 
                                    className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold bg-slate-50 transition-all"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <Calendar size={20} className="text-blue-500" />
                            <span className="font-black text-xs uppercase tracking-widest">Datum: {selectedDate}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Afkorting Leerkracht</label>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full text-2xl p-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none uppercase font-black bg-slate-50/50 transition-all"
                            placeholder="bv. JANS"
                            value={teacherName}
                            onChange={e => setTeacherName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Clock size={14} /> Te vervangen uren
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {LESSON_HOURS.map(h => {
                                const isValid = isPeriod ? (h.number !== 5) : isValidLessonHour(currentDayName, h.number);
                                if (!isValid) return null;
                                const isSelected = selectedHours.includes(h.number);
                                return (
                                    <button
                                        type="button"
                                        key={h.number}
                                        onClick={() => toggleHour(h.number)}
                                        className={`
                                            h-12 rounded-xl font-black text-sm transition-all border-2
                                            ${isSelected 
                                                ? 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-200 scale-105' 
                                                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        {h.number}
                                    </button>
                                );
                            })}
                        </div>
                        {isPeriod && <p className="text-[9px] text-slate-400 mt-2 italic font-bold uppercase tracking-tighter">Let op: Bij een periode worden enkel de uren geregistreerd die voor de specifieke dag geldig zijn.</p>}
                    </div>

                    <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Opmerking</label>
                         <input 
                            type="text" 
                            className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-bold bg-slate-50/50 focus:border-blue-500 outline-none transition-all"
                            placeholder="Optioneel..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                         />
                    </div>

                    <button 
                        type="button"
                        onClick={handleSave}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-widest"
                    >
                        <Save size={22} />
                        {isPeriod ? 'Periode Registreren' : 'Bevestigen'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};