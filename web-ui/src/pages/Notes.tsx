import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { notesApi } from '../api';
import type { Note } from '../types';
import { FileText, Tag } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function Notes() {
  const { t } = useI18n();
  const { folder = 'inbox' } = useParams<{ folder: string }>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t.notes.loading}</div>
      </div>
    );
  }

  const folderName = t.notes.folders[folder as keyof typeof t.notes.folders] || folder;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {folderName}
        </h1>
        <p className="mt-2 text-gray-600">
          {t.notes.count(notes.length)}
        </p>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t.notes.noNotes}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
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
