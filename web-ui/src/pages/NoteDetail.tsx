import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { notesApi } from '../api';
import type { Note } from '../types';
import { ArrowLeft, Tag, Calendar, TrendingUp } from 'lucide-react';
import SummarizeButton from '../components/SummarizeButton';

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadNote(id);
    }
  }, [id]);

  const loadNote = async (noteId: string) => {
    setLoading(true);
    setError(null);
    try {
      const noteData = await notesApi.getById(noteId);
      setNote(noteData);
    } catch (err) {
      console.error('Failed to load note:', err);
      setError(err instanceof Error ? err.message : 'Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          to="/notes/inbox"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回收件匣
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="space-y-6">
        <Link
          to="/notes/inbox"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回收件匣
        </Link>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">找不到筆記</p>
        </div>
      </div>
    );
  }

  const codeFlags = [
    note.isInspiring && { label: '啟發', color: 'bg-yellow-100 text-yellow-800' },
    note.isUseful && { label: '實用', color: 'bg-green-100 text-green-800' },
    note.isPersonal && { label: '個人', color: 'bg-blue-100 text-blue-800' },
    note.isSurprising && { label: '驚奇', color: 'bg-purple-100 text-purple-800' },
  ].filter(Boolean);

  // Determine the correct back link and label
  const getBackInfo = () => {
    // Parse the actual location from filePath as source of truth
    if (note.filePath) {
      const match = note.filePath.match(/vault\/([\d]-[\w]+)(?:\/([^/]+))?/);
      if (match) {
        const [, folderPath, subfolder] = match;
        // folderPath is like "0-inbox", "1-projects", "3-resources"
        const folderName = folderPath.split('-')[1]; // Extract "inbox", "projects", "resources"

        const folderLabels: Record<string, string> = {
          inbox: '收件匣',
          projects: '專案',
          areas: '領域',
          resources: '資源',
          archive: '封存',
        };

        // If there's a subfolder (project/area/resource name)
        if (subfolder && folderName === 'projects') {
          const projectName = subfolder.startsWith('project-')
            ? subfolder.substring(8)
            : subfolder;
          return {
            link: `/projects/${subfolder}`,
            label: projectName,
          };
        }

        // Otherwise return to PARA folder view
        return {
          link: `/notes/${folderName}`,
          label: folderLabels[folderName] || folderName,
        };
      }
    }

    // Fallback to metadata (shouldn't normally reach here)
    const folderLabels: Record<string, string> = {
      inbox: '收件匣',
      projects: '專案',
      areas: '領域',
      resources: '資源',
      archive: '封存',
    };

    return {
      link: `/notes/${note.paraFolder || 'inbox'}`,
      label: folderLabels[note.paraFolder] || note.paraFolder || '收件匣',
    };
  };

  const backInfo = getBackInfo();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to={backInfo.link}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回 {backInfo.label}
      </Link>

      {/* Note content */}
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          {/* Location badge */}
          {note.filePath && (() => {
            const match = note.filePath.match(/vault\/([\d]-[\w]+)(?:\/([^/]+))?/);
            if (match && match[2]) {
              const subfolder = match[2];
              const displayName = subfolder.startsWith('project-')
                ? subfolder.substring(8)
                : subfolder;
              return (
                <div className="mb-3">
                  <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                    📁 {displayName}
                  </span>
                </div>
              );
            }
            return null;
          })()}

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{note.title}</h1>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              建立於 {new Date(note.created).toLocaleString('zh-TW')}
            </div>
            {note.modified !== note.created && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                修改於 {new Date(note.modified).toLocaleString('zh-TW')}
              </div>
            )}
            {note.distillationLevel > 0 && (
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                精煉等級: {note.distillationLevel}
              </div>
            )}
          </div>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CODE flags */}
          {codeFlags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {codeFlags.map((flag) => (
                <span
                  key={flag.label}
                  className={`px-3 py-1 text-sm rounded-full ${flag.color}`}
                >
                  {flag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-900">
              {note.content}
            </pre>
          </div>
        </div>
      </div>

      {/* Progressive Summarization with JARVIS */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">漸進式摘要 (JARVIS)</h2>
        <SummarizeButton
          noteId={note.id}
          currentLevel={note.distillationLevel}
          language="zh"
          onSummaryGenerated={(summary) => {
            console.log('Summary generated:', summary);
          }}
          onDistillationComplete={() => {
            // Reload note to show updated distillation level
            if (id) loadNote(id);
          }}
        />
      </div>

      {/* Distillation History */}
      {note.distillationHistory && note.distillationHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">精煉歷史</h2>
          <div className="space-y-3">
            {note.distillationHistory.map((entry, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <span className="font-medium">Level {entry.level}</span>
                  <span>•</span>
                  <span>{entry.type}</span>
                  <span>•</span>
                  <span>{new Date(entry.date).toLocaleString('zh-TW')}</span>
                </div>
                {entry.summary && (
                  <p className="text-gray-700 text-sm">{entry.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">其他操作</h2>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            編輯筆記
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            移動到其他資料夾
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            刪除筆記
          </button>
        </div>
      </div>
    </div>
  );
}
