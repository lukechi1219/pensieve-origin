import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { notesApi } from '../api';
import type { Note } from '../types';
import { ArrowLeft, Tag, Calendar, TrendingUp, Save, X, Edit2, Eye, PenLine } from 'lucide-react';
import SummarizeButton from '../components/SummarizeButton';
import ReactMarkdown from 'react-markdown';
import MoveNoteModal from '../components/MoveNoteModal';

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [showMoveModal, setShowMoveModal] = useState(false);

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

  const handleEdit = () => {
    if (note) {
      setEditContent(note.content);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleSave = async () => {
    if (!note || !id) return;

    setIsSaving(true);
    try {
      await notesApi.update(id, { content: editContent });
      setNote({ ...note, content: editContent, modified: new Date().toISOString() });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save note:', err);
      alert('儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note || !id) return;
    if (!window.confirm('確定要刪除這則筆記嗎？此操作無法復原。')) return;

    try {
      await notesApi.delete(id);
      navigate('/notes/inbox');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('刪除失敗');
    }
  };

  const handleMove = async (targetFolder: string, subPath?: string) => {
    if (!note || !id || !targetFolder || (targetFolder === note.paraFolder && !subPath)) return;

    const validFolders = ['inbox', 'projects', 'areas', 'resources', 'archive'];
    if (!validFolders.includes(targetFolder)) {
      alert('無效的資料夾名稱。請輸入: inbox, projects, areas, resources, 或 archive');
      return;
    }

    try {
      await notesApi.move(id, targetFolder, subPath);
      // Reload to update path info
      loadNote(id);
      setShowMoveModal(false);
      alert(`已移動至 ${targetFolder}${subPath ? `/${subPath}` : ''}`);
    } catch (err) {
      console.error('Move failed:', err);
      alert('移動失敗');
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
            link: `/projects/${projectName}`,
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
          <div className="flex justify-between items-start">
            <div className="flex-1">
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
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? '儲存中...' : '儲存'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    取消
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  編輯
                </button>
              )}
            </div>
          </div>

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
          {isEditing ? (
            <div className="space-y-4">
              {/* Tabs for mobile / Switcher */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('write')}
                    className={`flex items-center pb-2 text-sm font-medium transition-colors ${
                      activeTab === 'write'
                        ? 'text-blue-600 border-b-2 border-blue-600 -mb-2.5'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    編輯
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center pb-2 text-sm font-medium transition-colors lg:hidden ${
                      activeTab === 'preview'
                        ? 'text-blue-600 border-b-2 border-blue-600 -mb-2.5'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    預覽
                  </button>
                </div>
                <span className="text-xs text-gray-400 hidden sm:block">
                  支援 Markdown 格式
                </span>
              </div>

              {/* Editor Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Write Column - Always show on mobile if activeTab is write, always show on desktop */}
                <div className={`min-h-[500px] ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full min-h-[500px] p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y text-gray-900"
                    placeholder="開始輸入筆記內容..."
                  />
                </div>

                {/* Preview Column - Always show on mobile if activeTab is preview, always show on desktop */}
                <div className={`min-h-[500px] bg-white border border-gray-200 rounded-lg p-6 overflow-y-auto ${activeTab === 'write' ? 'hidden lg:block' : ''}`}>
                  <div className="prose prose-sm max-w-none">
                    {editContent ? (
                      <ReactMarkdown>{editContent}</ReactMarkdown>
                    ) : (
                      <p className="text-gray-400 italic">預覽區域</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none font-sans text-gray-900">
              <ReactMarkdown>
                {note.content}
              </ReactMarkdown>
            </div>
          )}
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
          <button 
            onClick={handleEdit}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            編輯筆記
          </button>
          <button 
            onClick={() => setShowMoveModal(true)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            移動到其他資料夾
          </button>
          <button 
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            刪除筆記
          </button>
        </div>
      </div>
      
      <MoveNoteModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        currentFolder={note.paraFolder || 'inbox'}
        onMove={handleMove}
      />
    </div>
  );
}
