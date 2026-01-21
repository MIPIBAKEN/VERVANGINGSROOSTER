import React, { useState, useMemo, useEffect } from 'react';
import { ReplacementEntry, SickEntry, SubstituteDefinition } from '../types';
import { LESSON_HOURS, WEEK_DAYS, formatDateNL } from '../constants';
import { CheckSquare, Square, UserCheck, School, Briefcase, Trash2, AlertCircle, CheckCircle2, UserX, UserPlus } from 'lucide-react';
import { generateId } from '../App';

interface ReplacementProcessingProps {
  sickEntries: SickEntry[];
  replacements: ReplacementEntry[];
  substitutes: SubstituteDefinition[];
  onChange: (entries: ReplacementEntry[]) => void;
  onDelete: (id: string) => void;
  selectedWeek: string;
}

const getDayNameFromDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    if(parts.length !== 3) return '';
    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    return WEEK_DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
};

export const ReplacementProcessing: React.FC<ReplacementProcessingProps> = ({ 
  sickEntries, 
  replacements, 
  substitutes,
  onChange, 
  onDelete,
  selectedWeek 
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
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
            label: WEEK_DAYS[i],
            fullLabel: `${WEEK_DAYS[i]} ${d.getDate()}/${d.getMonth()+1}`
        });
    }
    return days;
  }, [selectedWeek]);

  useEffect(() => {
    if (weekDates.length > 0 && !selectedDate) {
        setSelectedDate(weekDates[0].str);
    }
  }, [weekDates, selectedDate]);

  const tableRows = useMemo(() => {
    if (!selectedDate) return [];

    const rows: {
        key: string; 
        sickEntryId: string;
        absentTeacher: string;
        lessonHour: number;
        existingReplacement?: ReplacementEntry; 
    }[] = [];

    const dailySick = sickEntries.filter(s => s.date === selectedDate);

    dailySick.forEach(sick => {
        const hours = sick.absentHours || [];
        hours.sort((a,b) => a - b).forEach(hour => {
            const existing = replacements.find(r => 
                r.date === selectedDate && 
                r.lessonHour === hour && 
                r.absentTeacher === sick.teacherAbbr
            );

            rows.push({
                key: `${sick.id}-${hour}`,
                sickEntryId: sick.id,
                absentTeacher: sick.teacherAbbr,
                lessonHour: hour,
                existingReplacement: existing
            });
        });
    });

    return rows.sort((a,b) => a.lessonHour - b.lessonHour || a.absentTeacher.localeCompare(b.absentTeacher));
  }, [sickEntries, replacements, selectedDate]);

  // Conflict Logic: Is the teacher sick on this specific date?
  const isTeacherSickOnDate = (teacherAbbr: string, date: string) => {
    if (!teacherAbbr) return false;
    const code = teacherAbbr.trim().toUpperCase();
    return sickEntries.some(s => s.date === date && s.teacherAbbr === code);
  };

  // Logic: Is the teacher already assigned as a replacement at this hour?
  const isTeacherAssignedAtHour = (teacherAbbr: string, hour: number, date: string) => {
    if (!teacherAbbr) return false;
    const code = teacherAbbr.trim().toUpperCase();
    // Exclude special categories
    if (['STUDIE', 'ZELFSTUDIE', 'NAAR HUIS', 'DIRECTIE'].includes(code)) return false;
    
    return replacements.some(r => 
        r.date === date && 
        r.lessonHour === hour && 
        r.replacementTeacher.toUpperCase().trim() === code
    );
  };

  const handleUpsertReplacement = (
    baseData: { absentTeacher: string, lessonHour: number }, 
    updates: Partial<ReplacementEntry>
  ) => {
    // PRE-CHECK: If user is trying to set a replacement teacher, check if they are sick
    if (updates.replacementTeacher) {
        const targetTeacher = updates.replacementTeacher.toUpperCase().trim();
        // Allow special keywords like STUDIE
        const isSpecial = ['STUDIE', 'ZELFSTUDIE', 'NAAR HUIS', 'DIRECTIE'].includes(targetTeacher);
        
        if (!isSpecial && isTeacherSickOnDate(targetTeacher, selectedDate)) {
            alert(`FOUT: Leerkracht ${targetTeacher} is vandaag zelf ziek gemeld en kan niet vervangen!`);
            return; // Block update
        }
    }

    const dayName = getDayNameFromDate(selectedDate);
    const existingIndex = replacements.findIndex(r => 
        r.date === selectedDate && 
        r.lessonHour === baseData.lessonHour && 
        r.absentTeacher === baseData.absentTeacher
    );

    let newList = [...replacements];

    if (existingIndex >= 0) {
        newList[existingIndex] = { ...newList[existingIndex], ...updates };
    } else {
        newList.push({
            id: generateId('REP'),
            week: selectedWeek,
            date: selectedDate,
            day: dayName,
            lessonHour: baseData.lessonHour,
            absentTeacher: baseData.absentTeacher,
            classGroup: '',
            room: '',
            replacementTeacher: '',
            hasTask: false,
            note: '',
            ...updates
        });
    }

    onChange(newList);
  };

  const handleManualDelete = (e: React.MouseEvent, row: typeof tableRows[0]) => {
      e.preventDefault();
      e.stopPropagation();

      if (!row.existingReplacement) return;
      const targetId = String(row.existingReplacement.id).trim();

      if (confirmDeleteId === targetId) {
          onDelete(targetId);
          setConfirmDeleteId(null);
      } else {
          setConfirmDeleteId(targetId);
          setTimeout(() => setConfirmDeleteId(null), 3000);
      }
  };

  const [activeRowKey, setActiveRowKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, text: string) => {
    e.dataTransfer.setData('text/plain', text);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent, row: typeof tableRows[0]) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
        handleUpsertReplacement(row, { replacementTeacher: text });
    }
    setDragOverKey(null);
  };

  // Conflict Check Logic: Double assignment
  const getDoubleConflict = (row: typeof tableRows[0]) => {
    if (!row.existingReplacement?.replacementTeacher) return null;
    const teacher = row.existingReplacement.replacementTeacher.toUpperCase().trim();
    if (!teacher || ['STUDIE', 'ZELFSTUDIE', 'NAAR HUIS', 'DIRECTIE'].includes(teacher)) return null;

    const others = replacements.filter(r => 
        r.date === selectedDate && 
        r.lessonHour === row.lessonHour && 
        r.replacementTeacher.toUpperCase().trim() === teacher &&
        r.id !== row.existingReplacement?.id
    );

    if (others.length > 0) {
        return `Conflicten: ${others.map(o => o.absentTeacher).join(', ')}`;
    }
    return null;
  };

  const activeRow = useMemo(() => tableRows.find(r => r.key === activeRowKey), [activeRowKey, tableRows]);
  
  const activeSubstitutes = useMemo(() => {
    if (!activeRow || !selectedDate) return [];
    const dayName = getDayNameFromDate(selectedDate);
    const def = substitutes.find(s => s.day === dayName && s.lessonHour === activeRow.lessonHour);
    return def ? def.availableTeachers : [];
  }, [activeRow, substitutes, selectedDate]);

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm z-20">
         <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="text-blue-600" />
                Verwerking
            </h2>
            <div className="h-8 w-px bg-slate-300 mx-4"></div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
                {weekDates.map(d => (
                    <button
                        key={d.str}
                        onClick={() => setSelectedDate(d.str)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            selectedDate === d.str 
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {d.label}
                    </button>
                ))}
            </div>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto bg-slate-100 p-6">
            <div className="bg-white rounded-lg shadow border border-slate-200 min-h-[500px]">
                {tableRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                        <CheckSquare size={48} className="mb-4 text-slate-200" />
                        <p className="text-lg">Geen vervangingen nodig.</p>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                <th className="p-4 w-16 text-center">Status</th>
                                <th className="p-4 w-16 text-center">Uur</th>
                                <th className="p-4 w-48 text-left">Afwezig</th>
                                <th className="p-4 w-32 text-left">Klas</th>
                                <th className="p-4 w-32 text-left">Lokaal</th>
                                <th className="p-4 w-24 text-center">Taak</th>
                                <th className="p-4 text-left border-x border-slate-200">Vervanger</th>
                                <th className="p-4 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tableRows.map(row => {
                                const data = row.existingReplacement || { id: '', classGroup: '', room: '', hasTask: false, replacementTeacher: '' };
                                const rowId = data.id ? String(data.id).trim() : null;
                                const isConfirming = rowId && confirmDeleteId === rowId;
                                
                                const doubleConflict = getDoubleConflict(row);
                                const isReplacementSick = isTeacherSickOnDate(data.replacementTeacher, selectedDate);
                                
                                const isComplete = !!(data.classGroup?.trim() && data.replacementTeacher?.trim()) && !isReplacementSick;
                                const statusColor = isReplacementSick ? 'bg-red-50' : isComplete ? 'bg-emerald-50/40' : 'bg-rose-50/40';
                                const activeColor = activeRowKey === row.key ? 'bg-blue-50 !opacity-100' : '';
                                const dragColor = dragOverKey === row.key ? '!bg-blue-100' : '';

                                return (
                                    <tr 
                                        key={row.key}
                                        onClick={() => setActiveRowKey(row.key)}
                                        onDragOver={(e) => { e.preventDefault(); setDragOverKey(row.key); }}
                                        onDragLeave={() => setDragOverKey(null)}
                                        onDrop={(e) => handleDrop(e, row)}
                                        className={`transition-colors cursor-pointer group ${statusColor} ${activeColor} ${dragColor}`}
                                    >
                                        <td className="p-3 text-center">
                                            {isReplacementSick ? (
                                                <UserX size={18} className="text-red-600 mx-auto animate-pulse" title="Vervanger is zelf ziek!" />
                                            ) : isComplete ? (
                                                <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />
                                            ) : (
                                                <AlertCircle size={18} className="text-rose-300 mx-auto" />
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="inline-block w-8 h-8 leading-8 rounded-full bg-white/60 border border-slate-200 font-bold text-slate-700">{row.lessonHour}</span>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-bold text-slate-700">{row.absentTeacher}</div>
                                        </td>
                                        <td className="p-3">
                                            <input 
                                                className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 uppercase text-sm font-bold bg-white/70 ${!data.classGroup?.trim() ? 'border-rose-200 ring-rose-50' : ''}`}
                                                placeholder="Klas..."
                                                value={data.classGroup}
                                                onChange={(e) => handleUpsertReplacement(row, { classGroup: e.target.value })}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input 
                                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 uppercase text-sm bg-white/70"
                                                placeholder="Lokaal..."
                                                value={data.room}
                                                onChange={(e) => handleUpsertReplacement(row, { room: e.target.value })}
                                            />
                                        </td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => handleUpsertReplacement(row, { hasTask: !data.hasTask })} className={`p-1 transition-transform active:scale-95 ${data.hasTask ? 'text-blue-600' : 'text-slate-300'}`}>
                                                {data.hasTask ? <CheckSquare size={24} /> : <Square size={24} />}
                                            </button>
                                        </td>
                                        <td className={`p-3 relative border-x border-slate-100 ${doubleConflict || isReplacementSick ? 'bg-red-100/50' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    className={`w-full p-2 font-black uppercase bg-white/70 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${doubleConflict || isReplacementSick ? 'text-red-600 border-red-300 bg-red-50/50' : 'text-blue-900'} ${!data.replacementTeacher?.trim() ? 'border-rose-200 ring-rose-50' : ''}`}
                                                    placeholder="Vervanger..."
                                                    value={data.replacementTeacher}
                                                    onChange={(e) => handleUpsertReplacement(row, { replacementTeacher: e.target.value.toUpperCase() })}
                                                />
                                                {(doubleConflict || isReplacementSick) && (
                                                    <div className="text-red-600 animate-bounce shrink-0" title={isReplacementSick ? "Vervanger is ZIEK" : doubleConflict}>
                                                        <AlertCircle size={18} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            {data.replacementTeacher && (
                                                <button 
                                                    type="button"
                                                    onClick={(e) => handleManualDelete(e, row)}
                                                    className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all flex items-center gap-1 mx-auto ${isConfirming ? 'bg-red-600 text-white animate-pulse' : 'text-slate-300 hover:text-red-600 hover:bg-red-50'}`}
                                                >
                                                    {isConfirming ? <>WIS?</> : <Trash2 size={14} />}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20 shrink-0">
             <div className="p-5 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <Briefcase size={20} className="text-blue-600" />
                    Opties
                </h3>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex flex-col gap-1">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Voltooid</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Onvolledig</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Conflict (Ziek)</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Reeds ingezet</div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="bg-white p-4 rounded-lg border border-slate-200 min-h-[150px]">
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Vervangers:</h4>
                    {activeRow ? (
                        <div className="space-y-2">
                            {activeSubstitutes.map(sub => {
                                const sick = isTeacherSickOnDate(sub, selectedDate);
                                const assigned = isTeacherAssignedAtHour(sub, activeRow.lessonHour, selectedDate);
                                
                                return (
                                    <div 
                                        key={sub} 
                                        draggable={!sick}
                                        onDragStart={(e) => !sick && handleDragStart(e, sub)} 
                                        onClick={() => sick && alert(`FOUT: ${sub} is vandaag zelf ziek!`)}
                                        className={`
                                            p-2.5 rounded font-bold shadow-sm transition flex items-center justify-between gap-2
                                            ${sick 
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through' 
                                                : assigned
                                                    ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500 cursor-grab opacity-80'
                                                    : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-800 cursor-grab active:scale-95'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            {sick ? <UserX size={16} /> : <UserCheck size={16} />} {sub}
                                        </div>
                                        {assigned && !sick && (
                                            <div className="bg-blue-500 text-white text-[8px] px-1 rounded animate-pulse uppercase">Bezig</div>
                                        )}
                                    </div>
                                );
                            })}
                            {activeSubstitutes.length === 0 && <div className="text-xs text-slate-400 italic">Geen poule vervangers.</div>}
                        </div>
                    ) : <div className="text-xs text-slate-400">Selecteer een uur...</div>}
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Snelkeuze:</h4>
                    {['STUDIE', 'DIRECTIE', 'ZELFSTUDIE', 'NAAR HUIS'].map(opt => (
                        <div key={opt} draggable onDragStart={(e) => handleDragStart(e, opt)} className="bg-slate-50 hover:bg-slate-600 hover:text-white p-2 rounded cursor-grab flex items-center gap-2 font-medium text-sm transition active:scale-95">
                            <School size={14} /> {opt}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};