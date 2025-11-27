import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { notesApi } from '../api';
import type { Note } from '../types';
import { FileText, Tag, Plus, Folder } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function Notes() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { folder = 'inbox' } = useParams<{ folder: string }>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [useSubfolder, setUseSubfolder] = useState(false);
  const [subfolderName, setSubfolderName] = useState('');
  const [subfolders, setSubfolders] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
    loadSubfolders();
    setSelectedSubfolder(null); // Reset filter when folder changes
  }, [folder]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await notesApi.list({ folder });
      setNotes(response.items);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubfolders = async () => {
    // Only load subfolders for areas and resources
    if (folder === 'areas' || folder === 'resources') {
      try {
        const response = await notesApi.listSubfolders(folder);
        setSubfolders(response.subfolders);
      } catch (error) {
        console.error('Failed to load subfolders:', error);
      }
    } else {
      setSubfolders([]);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;

    setCreating(true);
    try {
      // Create note (will be created in inbox by default)
      const note = await notesApi.create({
        title: newNoteTitle,
        content: '',
      });

      // Move to target folder if not inbox
      if (folder !== 'inbox') {
        const subPath = useSubfolder && subfolderName.trim() ? subfolderName.trim() : undefined;
        await notesApi.move(note.id, folder, subPath);
      }

      setShowCreateModal(false);
      setNewNoteTitle('');
      setUseSubfolder(false);
      setSubfolderName('');

      // Navigate to the new note
      navigate(`/note/${note.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('建立筆記失敗');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t.notes.loading}</div>
      </div>
    );
  }

  const folderName = t.notes.folders[folder as keyof typeof t.notes.folders] || folder;

  // Show create button only for areas and resources
  const showCreateButton = folder === 'areas' || folder === 'resources';

  // Filter notes by selected subfolder
  const filteredNotes = selectedSubfolder
    ? notes.filter(note => {
        // Match if para_path ends with /subfolder or contains /subfolder/
        return note.paraPath?.endsWith(`/${selectedSubfolder}`) ||
               note.paraPath?.includes(`/${selectedSubfolder}/`);
      })
    : notes;

  const handleSubfolderClick = (subfolderName: string) => {
    setSelectedSubfolder(selectedSubfolder === subfolderName ? null : subfolderName);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {folderName}
          </h1>
          <p className="mt-2 text-gray-600">
            {t.notes.count(notes.length)}
          </p>
        </div>
        {showCreateButton && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            新增筆記
          </button>
        )}
      </div>

      {/* Subfolders section */}
      {subfolders.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">子資料夾篩選</h2>
            {selectedSubfolder && (
              <button
                onClick={() => setSelectedSubfolder(null)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                清除篩選
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {subfolders.map((subfolder) => (
              <div
                key={subfolder.name}
                onClick={() => handleSubfolderClick(subfolder.name)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                  selectedSubfolder === subfolder.name
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200'
                }`}
              >
                <Folder className={`h-5 w-5 ${
                  selectedSubfolder === subfolder.name ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    selectedSubfolder === subfolder.name ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {subfolder.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {subfolder.count} 筆記
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedSubfolder ? `${selectedSubfolder} 資料夾` : '所有筆記'}
          </h2>
          <p className="text-sm text-gray-600">
            {t.notes.count(filteredNotes.length)}
          </p>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedSubfolder ? '此子資料夾沒有筆記' : t.notes.noNotes}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">新增筆記</h2>
            <input
              type="text"
              placeholder="筆記標題"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !creating && !useSubfolder) {
                  handleCreateNote();
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />

            {/* Subfolder option */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSubfolder}
                  onChange={(e) => setUseSubfolder(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                建立/使用子資料夾
              </label>
            </div>

            {/* Subfolder name input */}
            {useSubfolder && (
              <input
                type="text"
                placeholder="子資料夾名稱（例如：health, finance）"
                value={subfolderName}
                onChange={(e) => setSubfolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !creating) {
                    handleCreateNote();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewNoteTitle('');
                  setUseSubfolder(false);
                  setSubfolderName('');
                }}
                disabled={creating}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNoteTitle.trim() || creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? '建立中...' : '建立'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface NoteCardProps {
  note: Note;
}

function NoteCard({ note }: NoteCardProps) {
  const { t } = useI18n();

  type CodeFlag = { label: string; color: string };
  const codeFlags = [
    note.isInspiring && { label: t.notes.codeFlags.inspiring, color: 'bg-yellow-100 text-yellow-800' },
    note.isUseful && { label: t.notes.codeFlags.useful, color: 'bg-green-100 text-green-800' },
    note.isPersonal && { label: t.notes.codeFlags.personal, color: 'bg-blue-100 text-blue-800' },
    note.isSurprising && { label: t.notes.codeFlags.surprising, color: 'bg-purple-100 text-purple-800' },
  ].filter(Boolean) as CodeFlag[];

  return (
    <Link
      to={`/note/${note.id}`}
      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-gray-900 mb-2">{note.title}</h3>

      {/* Preview content */}
      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
        {note.content}
      </p>

      {/* Meta info */}
      <div className="space-y-2">
        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CODE flags */}
        {codeFlags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {codeFlags.map((flag) => (
              <span
                key={flag.label}
                className={`px-2 py-1 text-xs rounded ${flag.color}`}
              >
                {flag.label}
              </span>
            ))}
          </div>
        )}

        {/* Distillation level */}
        {note.distillationLevel > 0 && (
          <div className="text-xs text-gray-500">
            精煉等級: {note.distillationLevel}
          </div>
        )}

        {/* Date */}
        <div className="text-xs text-gray-500">
          {new Date(note.created).toLocaleDateString('zh-TW')}
        </div>
      </div>
    </Link>
  );
}
