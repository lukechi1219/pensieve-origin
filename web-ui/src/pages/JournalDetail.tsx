import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { journalsApi } from '../api';
import type { Journal } from '../types';
import { Calendar as CalendarIcon, Edit2, Save, X, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export default function JournalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const contentCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadJournal();
    }
  }, [id]);

  const loadJournal = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Convert YYYYMMDD to YYYY-MM-DD if needed
      let dateId = id;
      if (id.length === 8 && !id.includes('-')) {
        // Format: YYYYMMDD -> YYYY-MM-DD
        dateId = `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
      }

      const data = await journalsApi.getByDate(dateId);
      setJournal(data);
      setEditContent(data.content || '');
    } catch (error) {
      console.error('Failed to load journal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (journal) {
      setEditContent(journal.content || '');
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!journal || !id) return;

    // Skip save if content hasn't changed
    if (editContent === (journal.content || '')) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      // Convert YYYYMMDD to YYYY-MM-DD if needed
      let dateId = id;
      if (id.length === 8 && !id.includes('-')) {
        dateId = `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
      }

      await journalsApi.update(dateId, { content: editContent });
      setJournal({ ...journal, content: editContent });
      setIsEditing(false);
      toast.success(locale === 'zh_Hant' ? '日誌已保存' : 'Journal saved');
    } catch (error) {
      console.error('Failed to save journal:', error);
      toast.error(locale === 'zh_Hant' ? '保存失敗' : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(journal?.content || '');
  };

  // Click-outside detection for auto-save
  useEffect(() => {
    if (!isEditing || isSaving) return;

    const handleClickOutside = async (event: MouseEvent) => {
      // Check if click is outside the content card
      if (contentCardRef.current && !contentCardRef.current.contains(event.target as Node)) {
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
  }, [isEditing, isSaving, editContent, journal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 mb-4">
          {locale === 'zh_Hant' ? '找不到日誌' : 'Journal not found'}
        </p>
        <button
          onClick={() => navigate('/journals')}
          className="text-blue-600 hover:text-blue-800"
        >
          {locale === 'zh_Hant' ? '返回日誌列表' : 'Back to Journals'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/journals')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {journal.title || (locale === 'zh_Hant' ? '日誌條目' : 'Journal Entry')}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-gray-600">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {new Date(journal.date).toLocaleDateString(
                  locale === 'zh_Hant' ? 'zh-TW' : 'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview
                  ? (locale === 'zh_Hant' ? '編輯' : 'Edit')
                  : (locale === 'zh_Hant' ? '預覽' : 'Preview')}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                {locale === 'zh_Hant' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving
                  ? (locale === 'zh_Hant' ? '保存中...' : 'Saving...')
                  : (locale === 'zh_Hant' ? '保存' : 'Save')}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              {locale === 'zh_Hant' ? '編輯' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6" ref={contentCardRef}>
        {isEditing ? (
          showPreview ? (
            <div className="prose max-w-none">
              <ReactMarkdown>{editContent}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder={locale === 'zh_Hant' ? '寫下你的想法...' : 'Write your thoughts...'}
            />
          )
        ) : (
          <div
            className="prose max-w-none hover:bg-gray-50 transition-colors rounded-lg p-4 -m-4 cursor-pointer"
            onDoubleClick={handleEdit}
            title={locale === 'zh_Hant' ? '雙擊以編輯' : 'Double-click to edit'}
          >
            {journal.content ? (
              <ReactMarkdown>{journal.content}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">
                {locale === 'zh_Hant' ? '這篇日誌還沒有內容' : 'This journal entry is empty'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      {(journal.mood || journal.energyLevel || journal.habitsCompleted?.length > 0 || journal.gratitude?.length > 0) && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {locale === 'zh_Hant' ? '元數據' : 'Metadata'}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {journal.mood && (
              <div>
                <span className="text-sm text-gray-500">
                  {locale === 'zh_Hant' ? '心情' : 'Mood'}:
                </span>
                <span className="ml-2 text-gray-900">{journal.mood}</span>
              </div>
            )}

            {journal.energyLevel !== undefined && (
              <div>
                <span className="text-sm text-gray-500">
                  {locale === 'zh_Hant' ? '能量等級' : 'Energy Level'}:
                </span>
                <span className="ml-2 text-gray-900">{journal.energyLevel}/10</span>
              </div>
            )}
          </div>

          {journal.habitsCompleted && journal.habitsCompleted.length > 0 && (
            <div>
              <span className="text-sm text-gray-500 block mb-2">
                {locale === 'zh_Hant' ? '完成的習慣' : 'Habits Completed'}:
              </span>
              <div className="flex flex-wrap gap-2">
                {journal.habitsCompleted.map((habit, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded"
                  >
                    {habit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {journal.gratitude && journal.gratitude.length > 0 && (
            <div>
              <span className="text-sm text-gray-500 block mb-2">
                {locale === 'zh_Hant' ? '感恩清單' : 'Gratitude'}:
              </span>
              <ul className="list-disc list-inside space-y-1">
                {journal.gratitude.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
