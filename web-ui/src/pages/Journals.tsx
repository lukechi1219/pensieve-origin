import toast from 'react-hot-toast';
import { useEffect, useState, useRef } from 'react';
import {journalsApi, type UpdateJournalData} from '../api';
import type { Journal, JournalStats } from '../types';
import { Calendar as CalendarIcon, TrendingUp, Edit2, Save, X, Loader2, Eye, EyeOff, FileText, SplitSquareHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import Calendar from '../components/Calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export default function Journals() {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Calendar visibility toggle
  const [showCalendar, setShowCalendar] = useState(true);
  // Stats Grid visibility toggle
  const [showStatsGrid, setShowStatsGrid] = useState(true);

  // Preview toggle
  const [showPreview, setShowPreview] = useState(false);

  // Ref for click-outside detection
  const journalCardRef = useRef<HTMLDivElement>(null);

  // Load stats on mount
  useEffect(() => {
    loadJournalStats();
  }, []);

  // Load journals when month changes
  useEffect(() => {
    loadJournalsByMonth(currentMonth);
  }, [currentMonth]);

  // Update selected journal when journals list or selected date changes
  useEffect(() => {
    // Only update if not currently loading (prevents flashing during month change)
    if (!loadingMonth) {
      const journal = journals.find(j => isSameDay(parseISO(j.date), selectedDate));
      setSelectedJournal(journal || null);
      setIsEditing(false);
    }
  }, [journals, selectedDate, loadingMonth]);

  const loadJournalStats = async () => {
    try {
      const journalStats = await journalsApi.getStats();
      setStats(journalStats);
    } catch (error) {
      console.error('Failed to load journal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJournalsByMonth = async (date: Date) => {
    setLoadingMonth(true);
    try {
      const monthStr = format(date, 'yyyy-MM');
      const response = await journalsApi.list({ month: monthStr });
      setJournals(response.items);
    } catch (error) {
      console.error('Failed to load journals:', error);
    } finally {
      setLoadingMonth(false);
    }
  };

  const handleEdit = () => {
    if (selectedJournal) {
      setEditContent(selectedJournal.content || '');
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const parseCompletedHabits = (content: string): string[] => {
    // Extract completed habits from Markdown checkboxes
    const habitMatches = content.match(/- \[x\] (.+)/gi);
    if (!habitMatches) return [];

    return habitMatches.map(match => {
      const habitName = match.replace(/- \[x\] /i, '').trim();
      return habitName;
    });
  };

  const parseMoodAndEnergy = (content: string) => {
    // Parse mood - support both single line and multiple lines
    // Matches: **Mood:** followed by text (with or without blank lines)
    const moodMatch = content.match(/\*\*Mood[:\s]*\*\*[:\s]*\n+\s*([^\n]+)/i);
    const mood = moodMatch ? moodMatch[1].trim() : '';

    // Parse energy level - support both formats
    // Matches: **Energy Level:** followed by N/10 (with or without blank lines)
    const energyMatch = content.match(/\*\*Energy Level[:\s]*\*\*[:\s]*\n+\s*(\d+)\s*\/\s*10/i);
    const energyLevel = energyMatch ? parseInt(energyMatch[1], 10) : 0;

    // Parse sleep quality - support both formats
    // Matches: **Sleep Quality:** followed by N/10 (with or without blank lines)
    const sleepMatch = content.match(/\*\*Sleep Quality[:\s]*\*\*[:\s]*\n+\s*(\d+)\s*\/\s*10/i);
    const sleepQuality = sleepMatch ? parseInt(sleepMatch[1], 10) : undefined;

    return { mood, energyLevel, sleepQuality };
  };

  const handleSave = async () => {
    if (!selectedJournal) return;

    // Skip save if content hasn't changed
    if (editContent === (selectedJournal.content || '')) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Parse completed habits from content
      const habitsCompleted = parseCompletedHabits(editContent);

      // Parse mood and energy levels
      const { mood, energyLevel, sleepQuality } = parseMoodAndEnergy(editContent);

      // Build update payload
      const updatePayload: UpdateJournalData = {
        content: editContent,
        habitsCompleted,
        mood,
        energyLevel,
        sleepQuality,
      };

      // Update with parsed data and wait for server response
      const updatedJournal = await journalsApi.update(dateStr, updatePayload);

      // Use server response instead of optimistic update
      // This ensures we have the correct timestamps and any server-side modifications
      setSelectedJournal(updatedJournal);

      // Update in list as well with server response
      setJournals(prev => prev.map(j => j.id === updatedJournal.id ? updatedJournal : j));

      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save journal:', err);
      toast.error(t.journal.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateJournal = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Get/create the journal
      const newJournal = await journalsApi.getByDate(dateStr);

      // Update the local state immediately
      setSelectedJournal(newJournal);

      // Add to journals list if not already present
      setJournals(prev => {
        const exists = prev.some(j => j.id === newJournal.id);
        if (exists) {
          return prev.map(j => j.id === newJournal.id ? newJournal : j);
        }
        return [...prev, newJournal];
      });

      // Reload in background to ensure consistency
      loadJournalsByMonth(currentMonth);
      loadJournalStats();
    } catch (error) {
      console.error('Failed to create journal:', error);
      toast.error(t.journal.createFailed);
    }
  };

  const handlePreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);

    // Load month if different
    if (previousDay.getMonth() !== currentMonth.getMonth() ||
        previousDay.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(previousDay);
    }
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);

    // Load month if different
    if (nextDay.getMonth() !== currentMonth.getMonth() ||
        nextDay.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(nextDay);
    }
  };

  // Click-outside detection for auto-save
  useEffect(() => {
    if (!isEditing || isSaving) return;

    const handleClickOutside = async (event: MouseEvent) => {
      // Check if click is outside the journal card
      if (journalCardRef.current && !journalCardRef.current.contains(event.target as Node)) {
        // Auto-save and exit edit mode
        await handleSave();
      }
    };

    // Add listener with slight delay to avoid immediate trigger
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, isSaving, editContent, selectedJournal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t.journal.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.journal.title}</h1>
          <p className="mt-2 text-gray-600">{t.journal.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {/* Toggle Stats Grid button */}
          <button
            onClick={() => setShowStatsGrid(!showStatsGrid)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title={showStatsGrid ? t.journal.hideStats : t.journal.showStats}
          >
            {showStatsGrid ? (
              <>
                <EyeOff className="h-4 w-4" />
                {t.journal.hideStats}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                {t.journal.showStats}
              </>
            )}
          </button>
          {/* Toggle Calendar button */}
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title={showCalendar ? t.journal.hideCalendar : t.journal.showCalendar}
          >
            {showCalendar ? (
              <>
                <EyeOff className="h-4 w-4" />
                {t.journal.hideCalendar}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                {t.journal.showCalendar}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {showStatsGrid && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title={t.journal.totalEntries}
            value={stats?.totalEntries || 0}
            icon={CalendarIcon}
          />
          <StatCard
            title={t.journal.currentStreak}
            value={stats?.currentStreak || 0}
            icon={TrendingUp}
          />
          <StatCard
            title={t.journal.longestStreak}
            value={stats?.longestStreak || 0}
            icon={TrendingUp}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        {showCalendar && (
          <div className="lg:col-span-2 relative">
            <Calendar
              journals={journals}
              currentDate={selectedDate}
              onDateSelect={setSelectedDate}
              onMonthChange={setCurrentMonth}
            />
            {loadingMonth && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex justify-center items-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Journal Entry Detail */}
        <div className={showCalendar ? 'lg:col-span-1' : 'lg:col-span-3'}>
          <div className="bg-white rounded-lg shadow flex flex-col" style={{ height: 'calc(100vh - 14rem)' }} ref={journalCardRef}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg flex-shrink-0">
              <div className="flex items-center gap-2">
                {!showCalendar && (
                  <button
                    onClick={handlePreviousDay}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded-full transition-colors"
                    title={t.journal.previousDay}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <h3 className="font-semibold text-gray-900">
                  {format(selectedDate, locale === 'zh_Hant' ? 'yyyy年 MMMM d日 EEEE' : 'MMMM d, yyyy EEEE', { locale: locale === 'zh_Hant' ? zhTW : undefined })}
                </h3>
                {!showCalendar && (
                  <button
                    onClick={handleNextDay}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded-full transition-colors"
                    title={t.journal.nextDay}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
              {selectedJournal && !isEditing && (
                <button
                  onClick={handleEdit}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-full transition-colors"
                  title={t.journal.editEntry}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              {selectedJournal ? (
                isEditing ? (
                  <div className="h-full flex flex-col gap-4">
                    {/* Preview Toggle Buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setShowPreview(false)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          !showPreview
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                        編輯
                      </button>
                      <button
                        onClick={() => setShowPreview(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          showPreview
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <SplitSquareHorizontal className="h-4 w-4" />
                        預覽
                      </button>
                    </div>

                    {/* Editor/Preview Area */}
                    <div className="flex-1 overflow-hidden flex gap-4">
                      {/* Markdown Editor */}
                      <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-full flex flex-col`}>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm overflow-y-auto"
                          placeholder={t.journal.placeholder}
                        />
                      </div>

                      {/* Preview Panel */}
                      {showPreview && (
                        <div className="w-1/2 h-full overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{editContent || `*${t.journal.previewPlaceholder}*`}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end flex-shrink-0">
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4 mr-1" />
                        取消
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {isSaving ? `${t.common.save}...` : t.common.save}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="space-y-4 overflow-y-auto h-full hover:bg-gray-50 transition-colors rounded-lg p-4 -m-4 cursor-pointer"
                    onDoubleClick={handleEdit}
                    title={locale === 'zh_Hant' ? '雙擊以編輯' : 'Double-click to edit'}
                  >
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2">
                      {selectedJournal.mood && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {t.journal.mood}: {selectedJournal.mood}
                        </span>
                      )}
                      {selectedJournal.energyLevel !== undefined && selectedJournal.energyLevel > 0 && (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                          {t.journal.energyLevel}: {selectedJournal.energyLevel}/10
                        </span>
                      )}
                      {selectedJournal.sleepQuality !== undefined && selectedJournal.sleepQuality > 0 && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                          {t.journal.sleepQuality}: {selectedJournal.sleepQuality}/10
                        </span>
                      )}
                    </div>

                    {/* Habits */}
                    {selectedJournal.habitsCompleted && selectedJournal.habitsCompleted.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.journal.habitsCompleted}</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedJournal.habitsCompleted.map(habit => (
                            <span key={habit} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">
                              ✓ {habit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="prose prose-sm max-w-none text-gray-800">
                      <ReactMarkdown>{selectedJournal.content}</ReactMarkdown>
                    </div>
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Edit2 className="h-8 w-8 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t.journal.noEntry}</p>
                    <button
                      onClick={handleCreateJournal}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      建立日記
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}