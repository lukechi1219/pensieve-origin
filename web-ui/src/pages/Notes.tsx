import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notesApi, jarvisApi } from '../api';
import type { NoteListItem } from '../types';
import { FileText, Tag, Plus, Folder, CheckSquare, Square, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { BatchSummarizeProgress } from '../api/jarvis';

export default function Notes() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { folder = 'inbox' } = useParams<{ folder: string }>();
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [useSubfolder, setUseSubfolder] = useState(false);
  const [subfolderName, setSubfolderName] = useState('');
  const [subfolders, setSubfolders] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string | null>(null);

  // Batch summarization state
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    noteId?: string;
    results: Array<{ noteId: string; summary: string; error?: string }>;
  } | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);

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
      const subPath = useSubfolder && subfolderName.trim() ? subfolderName.trim() : undefined;
      
      // Create note directly in target folder
      const note = await notesApi.create({
        title: newNoteTitle,
        content: '',
        folder: folder !== 'inbox' ? folder : undefined,
        subPath: folder !== 'inbox' ? subPath : undefined,
      });

      setShowCreateModal(false);
      setNewNoteTitle('');
      setUseSubfolder(false);
      setSubfolderName('');

      // Navigate to the new note
      navigate(`/note/${note.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('建立筆記失敗');
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

  // Show create button only for areas and resources and people
  const showCreateButton = folder === 'areas' || folder === 'resources' || folder === 'people';

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

  // Batch summarization handlers
  const toggleNoteSelection = (noteId: string) => {
    const newSelection = new Set(selectedNoteIds);
    if (newSelection.has(noteId)) {
      newSelection.delete(noteId);
    } else {
      newSelection.add(noteId);
    }
    setSelectedNoteIds(newSelection);
  };

  const selectAllNotes = () => {
    setSelectedNoteIds(new Set(filteredNotes.map(n => n.id)));
  };

  const clearSelection = () => {
    setSelectedNoteIds(new Set());
  };

  const handleBatchSummarize = async () => {
    if (selectedNoteIds.size === 0) return;

    setBatchRunning(true);
    setShowBatchModal(true);
    setBatchProgress({
      current: 0,
      total: selectedNoteIds.size,
      results: [],
    });

    try {
      await jarvisApi.batchSummarize(
        Array.from(selectedNoteIds),
        {
          language: 'zh', // TODO: Use user preference
          voice: false,
          onProgress: (event: BatchSummarizeProgress) => {
            if (event.type === 'progress') {
              setBatchProgress(prev => ({
                ...prev!,
                current: event.current || 0,
                total: event.total || prev!.total,
                noteId: event.noteId,
              }));
            } else if (event.type === 'result' && event.noteId && event.summary) {
              setBatchProgress(prev => ({
                ...prev!,
                results: [
                  ...prev!.results,
                  {
                    noteId: event.noteId!,
                    summary: event.summary!,
                    error: event.error,
                  },
                ],
              }));
            }
          },
          onComplete: (results: Array<{ noteId: string; summary: string; error?: string }>) => {
            setBatchProgress(prev => ({
              ...prev!,
              current: prev!.total,
              results,
            }));
            setBatchRunning(false);
            const successCount = results.filter(r => !r.error).length;
            const failCount = results.length - successCount;
            if (failCount === 0) {
              toast.success(`成功總結 ${successCount} 個筆記！`);
            } else {
              toast.error(`完成：${successCount} 成功，${failCount} 失敗`);
            }
          },
          onError: (error: string) => {
            console.error('Batch summarization failed:', error);
            toast.error(`批次總結失敗: ${error}`);
            setBatchRunning(false);
          },
        }
      );
    } catch (error) {
      console.error('Failed to start batch summarization:', error);
      toast.error('啟動批次總結失敗');
      setBatchRunning(false);
    }
  };

  const closeBatchModal = () => {
    setShowBatchModal(false);
    setBatchProgress(null);
    clearSelection();
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
            <h2 className="text-lg font-semibold text-gray-900">{t.notes.subfolderFilter}</h2>
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
            {selectedSubfolder ? `${selectedSubfolder} 資料夾` : t.notes.allNotes}
          </h2>
          <p className="text-sm text-gray-600">
            {t.notes.count(filteredNotes.length)}
          </p>
        </div>

        {/* Batch Actions Toolbar */}
        {filteredNotes.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAllNotes}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <CheckSquare className="h-4 w-4" />
                  全選
                </button>
                <button
                  onClick={clearSelection}
                  disabled={selectedNoteIds.size === 0}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Square className="h-4 w-4" />
                  清除
                </button>
                <span className="text-sm text-gray-600">
                  已選擇 {selectedNoteIds.size} / {filteredNotes.length} 個筆記
                </span>
              </div>
              <button
                onClick={handleBatchSummarize}
                disabled={selectedNoteIds.size === 0 || batchRunning}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                批次總結 ({selectedNoteIds.size})
              </button>
            </div>
          </div>
        )}

        {filteredNotes.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedSubfolder ? '此子資料夾沒有筆記' : t.notes.noNotes}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note: NoteListItem) => (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={selectedNoteIds.has(note.id)}
                onToggleSelect={toggleNoteSelection}
              />
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

      {/* Batch Summarization Progress Modal */}
      {showBatchModal && batchProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">批次總結進度</h2>
              <p className="text-sm text-gray-600 mt-1">
                {batchRunning ? '正在處理筆記...' : '處理完成'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  進度: {batchProgress.current} / {batchProgress.total}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {Array.from(selectedNoteIds).map((noteId) => {
                const result = batchProgress.results.find(r => r.noteId === noteId);
                const note = notes.find((n: NoteListItem) => n.id === noteId);
                const isProcessing = batchProgress.noteId === noteId && !result;
                const isPending = !result && !isProcessing;

                return (
                  <div
                    key={noteId}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      result
                        ? result.error
                          ? 'bg-red-50 border-red-200'
                          : 'bg-green-50 border-green-200'
                        : isProcessing
                        ? 'bg-blue-50 border-blue-200 animate-pulse'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className="mt-1">
                        {result ? (
                          result.error ? (
                            <span className="text-red-500 text-xl">✗</span>
                          ) : (
                            <span className="text-green-500 text-xl">✓</span>
                          )
                        ) : isProcessing ? (
                          <span className="text-blue-500 text-xl">⏳</span>
                        ) : (
                          <span className="text-gray-400 text-xl">⏸</span>
                        )}
                      </div>

                      {/* Note Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">
                          {note?.title || noteId}
                        </h3>
                        {result && (
                          <div className="mt-2">
                            {result.error ? (
                              <p className="text-sm text-red-700">
                                錯誤: {result.error}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {result.summary}
                              </p>
                            )}
                          </div>
                        )}
                        {isProcessing && (
                          <p className="text-sm text-blue-700">處理中...</p>
                        )}
                        {isPending && (
                          <p className="text-sm text-gray-500">等待中...</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              {!batchRunning && (
                <button
                  onClick={closeBatchModal}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  完成
                </button>
              )}
              {batchRunning && (
                <p className="text-sm text-gray-600 py-2">
                  處理中，請稍候...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface NoteCardProps {
  note: NoteListItem;
  isSelected: boolean;
  onToggleSelect: (noteId: string) => void;
}

function NoteCard({ note, isSelected, onToggleSelect }: NoteCardProps) {
  const { t } = useI18n();

  type CodeFlag = { label: string; color: string };
  const codeFlags = [
    note.isInspiring && { label: t.notes.codeFlags.inspiring, color: 'bg-yellow-100 text-yellow-800' },
    note.isUseful && { label: t.notes.codeFlags.useful, color: 'bg-green-100 text-green-800' },
    note.isPersonal && { label: t.notes.codeFlags.personal, color: 'bg-blue-100 text-blue-800' },
    note.isSurprising && { label: t.notes.codeFlags.surprising, color: 'bg-purple-100 text-purple-800' },
  ].filter(Boolean) as CodeFlag[];

  return (
    <div
      className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-all relative ${
        isSelected ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      {/* Checkbox */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect(note.id);
          }}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-purple-600" />
          ) : (
            <Square className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Clickable content */}
      <Link
        to={`/note/${note.id}`}
        className="block"
      >
      <h3 className="font-semibold text-gray-900 mb-2">{note.title}</h3>

      {/* Preview content - NoteListItem does not have content field */}
      {/* <p className="text-sm text-gray-600 line-clamp-3 mb-4">
        {note.content}
      </p> */}

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
    </div>
  );
}
