import { useEffect, useState } from 'react';
import { journalsApi } from '../api';
import type { Journal, JournalStats } from '../types';
import { Calendar as CalendarIcon, TrendingUp, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import Calendar from '../components/Calendar';
import { format, isSameDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export default function Journals() {
  const { t } = useI18n();
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
    const journal = journals.find(j => isSameDay(new Date(j.date), selectedDate));
    setSelectedJournal(journal || null);
    setIsEditing(false);
  }, [journals, selectedDate]);

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

  const handleSave = async () => {
    if (!selectedJournal) return;

    setIsSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await journalsApi.update(dateStr, { content: editContent });

      // Update local state immediately
      const updatedJournal = { ...selectedJournal, content: editContent };
      setSelectedJournal(updatedJournal);

      // Update in list as well
      setJournals(prev => prev.map(j => j.id === updatedJournal.id ? updatedJournal : j));

      // Reload in background - Removed to prevent race condition with stale data
      // loadJournalsByMonth(currentMonth);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save journal:', err);
      alert('儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCreateJournal = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await journalsApi.getByDate(dateStr); // Backend creates if not exists
      await loadJournalsByMonth(currentMonth); // Reload month to show new journal
      loadJournalStats(); // Update stats
      // alert(`已建立 ${dateStr} 的日記`); // Optional feedback
    } catch (error) {
      console.error('Failed to create journal:', error);
      alert('建立日記失敗');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t.journal.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t.journal.title}</h1>
        <p className="mt-2 text-gray-600">{t.journal.subtitle}</p>
      </div>

      {/* Stats Grid */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          {loadingMonth ? (
             <div className="bg-white rounded-lg shadow p-12 flex justify-center items-center h-[400px]">
               <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
             </div>
          ) : (
            <Calendar
              journals={journals}
              currentDate={selectedDate}
              onDateSelect={setSelectedDate}
              onMonthChange={setCurrentMonth}
            />
          )}
        </div>

        {/* Journal Entry Detail */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h3 className="font-semibold text-gray-900">
                {format(selectedDate, 'yyyy年 MMMM d日 EEEE', { locale: zhTW })}
              </h3>
              {selectedJournal && !isEditing && (
                <button
                  onClick={handleEdit}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-full transition-colors"
                  title="編輯日記"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="p-6 flex-1 overflow-y-auto max-h-[600px]">
              {selectedJournal ? (
                isEditing ? (
                  <div className="h-full flex flex-col gap-4">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                      placeholder="寫下今天的想法..."
                    />
                    <div className="flex gap-2 justify-end">
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
                        {isSaving ? '儲存中...' : '儲存'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2">
                      {selectedJournal.mood && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          心情: {selectedJournal.mood}
                        </span>
                      )}
                      {selectedJournal.energyLevel && (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                          能量: {selectedJournal.energyLevel}/10
                        </span>
                      )}
                    </div>

                    {/* Habits */}
                    {selectedJournal.habitsCompleted && selectedJournal.habitsCompleted.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">完成習慣</h4>
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
                    <p className="font-medium text-gray-900">這天還沒有日記</p>
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
    <div className="bg-white rounded-lg shadow p-6">
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