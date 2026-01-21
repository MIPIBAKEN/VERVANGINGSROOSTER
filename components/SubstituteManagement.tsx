import React, { useState, useEffect, useRef } from 'react';
import { SubstituteDefinition } from '../types';
import { WEEK_DAYS, LESSON_HOURS, isValidLessonHour } from '../constants';
import { X } from 'lucide-react';
import { generateId } from '../App';

interface SubstituteManagementProps {
  substitutes: SubstituteDefinition[];
  onChange: (entries: SubstituteDefinition[]) => void;
  selectedWeek: string; 
}

const CellInput: React.FC<{
  initialValue: string;
  onSave: (val: string) => void;
  disabled?: boolean;
}> = ({ initialValue, onSave, disabled }) => {
  const [val, setVal] = useState(initialValue);
  const isDeletingRef = useRef(false);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (isDeletingRef.current) return;
    if (val !== initialValue) {
      onSave(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
      isDeletingRef.current = true;
      setVal('');
      onSave(''); 
      setTimeout(() => {
          isDeletingRef.current = false;
      }, 200);
  };

  return (
    <div className={`relative w-full h-full group ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}>
        <input 
        disabled={disabled}
        type="text" 
        className={`w-full h-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 uppercase placeholder:normal-case bg-transparent pr-6 ${disabled ? 'opacity-0' : ''}`}
        value={val}
        placeholder="..."
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        />
        {val && !disabled && (
            <button 
                onMouseDown={handleClear}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                tabIndex={-1}
                title="Wissen"
            >
                <X size={14} strokeWidth={3} />
            </button>
        )}
    </div>
  );
};

export const SubstituteManagement: React.FC<SubstituteManagementProps> = ({ substitutes, onChange }) => {
  
  const getSubForSlot = (day: string, hour: number) => {
    return substitutes.find(s => s.day === day && s.lessonHour === hour);
  };

  const handleUpdate = (day: string, hour: number, value: string) => {
    const teachers = value.split(/[ ,]+/).map(t => t.trim().toUpperCase()).filter(t => t.length > 0);
    const existingIndex = substitutes.findIndex(s => s.day === day && s.lessonHour === hour);
    
    let newSubstitutes = [...substitutes];
    if (existingIndex >= 0) {
      if (teachers.length === 0) {
        newSubstitutes.splice(existingIndex, 1);
      } else {
        newSubstitutes[existingIndex] = { ...newSubstitutes[existingIndex], availableTeachers: teachers };
      }
    } else if (teachers.length > 0) {
      newSubstitutes.push({
        id: generateId('SUB'),
        day,
        lessonHour: hour,
        availableTeachers: teachers
      });
    }
    onChange(newSubstitutes);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-8 border-b border-slate-200 bg-slate-50">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vaste Vervangingspoule</h2>
        <p className="text-sm font-bold text-slate-400 mt-1">Configureer hier de vaste beschikbare leerkrachten per uur.</p>
        <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></div> Geen Les
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-3 rounded bg-white border border-slate-200"></div> Beschikbaar
            </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full border-collapse text-sm table-fixed">
          <thead>
            <tr>
              <th className="p-4 border border-slate-200 bg-slate-100 w-24 text-center sticky top-0 z-20 font-black uppercase text-[10px] text-slate-500 tracking-widest">Uur</th>
              {WEEK_DAYS.map(day => (
                <th key={day} className="p-4 border border-slate-200 bg-slate-100 text-left sticky top-0 z-20 font-black uppercase text-[10px] text-slate-500 tracking-widest">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {LESSON_HOURS.map((hour) => (
              <tr key={hour.number} className="h-16">
                <td className="p-2 border border-slate-200 text-center font-black bg-slate-50 text-slate-600">
                  <span className="text-lg">{hour.number}e</span>
                  <div className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">{hour.start}</div>
                </td>
                {WEEK_DAYS.map(day => {
                  const isValid = isValidLessonHour(day, hour.number);
                  const entry = getSubForSlot(day, hour.number);
                  const val = entry ? entry.availableTeachers.join(', ') : '';

                  return (
                    <td key={`${day}-${hour.number}`} className={`p-0 border border-slate-200 relative group transition-colors ${isValid ? 'bg-white hover:bg-blue-50/30' : 'bg-slate-100'}`}>
                      <CellInput 
                        disabled={!isValid}
                        initialValue={val} 
                        onSave={(newValue) => handleUpdate(day, hour.number, newValue)} 
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};