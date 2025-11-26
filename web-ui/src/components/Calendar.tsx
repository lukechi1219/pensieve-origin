import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import type { Journal } from '../types';

interface CalendarProps {
  journals: Journal[];
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export default function Calendar({ journals, currentDate, onDateSelect, onMonthChange }: CalendarProps) {
  const [viewDate, setViewDate] = useState(currentDate);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const handlePrevMonth = () => {
    const newDate = subMonths(viewDate, 1);
    setViewDate(newDate);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(viewDate, 1);
    setViewDate(newDate);
    onMonthChange(newDate);
  };

  const getJournalForDate = (date: Date) => {
    return journals.find(j => isSameDay(new Date(j.date), date));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {format(viewDate, 'yyyy年 MMMM', { locale: zhTW })}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const journal = getJournalForDate(day);
          const isSelected = isSameDay(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                relative h-24 p-2 rounded-lg border transition-all text-left group
                ${!isCurrentMonth ? 'bg-gray-50 text-gray-400 border-transparent' : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-sm'}
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                ${isToday ? 'bg-blue-50' : ''}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </span>
                {journal && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>

              {journal && (
                <div className="mt-2 space-y-1">
                  {journal.mood && (
                    <div className="text-xs text-gray-500 truncate">
                      心情: {journal.mood}
                    </div>
                  )}
                  {journal.energyLevel && (
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-400" 
                          style={{ width: `${(journal.energyLevel / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {journal.habitsCompleted && journal.habitsCompleted.length > 0 && (
                    <div className="text-[10px] text-gray-400">
                      {journal.habitsCompleted.length} 個習慣
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
