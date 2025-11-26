import { Search, Plus, X, FileText, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { notesApi } from '../api';
import type { Note } from '../types';
import { useI18n } from '../i18n/I18nContext';

export default function Header() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Quick Capture state
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureTitle, setCaptureTitle] = useState('');
  const [captureContent, setCaptureContent] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search effect with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        setShowResults(true);
        try {
          // Fetch all notes and filter client-side (temporary solution)
          const response = await notesApi.list();
          const query = searchQuery.toLowerCase();
          const filtered = response.items.filter(note => 
            note.title.toLowerCase().includes(query) || 
            note.tags.some(tag => tag.toLowerCase().includes(query))
          ).slice(0, 5); // Limit to 5 results
          setSearchResults(filtered);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captureTitle || !captureContent) return;

    setIsCapturing(true);
    try {
      const note = await notesApi.create({
        title: captureTitle,
        content: captureContent,
        tags: ['inbox']
      });
      
      setCaptureTitle('');
      setCaptureContent('');
      setShowCaptureModal(false);
      navigate(`/note/${note.id}`);
    } catch (error) {
      console.error('Capture failed:', error);
      alert('捕捉失敗');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 z-20 relative">
        <div className="flex items-center justify-between">
          {/* Search bar */}
          <div className="flex-1 max-w-2xl" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={locale === 'zh_Hant' ? "搜尋筆記、標籤..." : "Search notes, tags..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 max-h-80 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map(note => (
                      <Link
                        key={note.id}
                        to={`/note/${note.id}`}
                        onClick={() => {
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{note.title}</div>
                            <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                              <span>{new Date(note.created).toLocaleDateString(locale === 'zh_Hant' ? 'zh-TW' : 'en-US')}</span>
                              {note.tags.length > 0 && (
                                <span className="text-blue-500 truncate max-w-[200px]">
                                  {note.tags.map(t => `#${t}`).join(' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {!isSearching && (locale === 'zh_Hant' ? '找不到相關筆記' : 'No notes found')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 ml-4">
            <button
              onClick={() => setShowCaptureModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              {locale === 'zh_Hant' ? '快速捕捉' : 'Quick Capture'}
            </button>
          </div>
        </div>
      </header>

      {/* Quick Capture Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {locale === 'zh_Hant' ? '快速捕捉' : 'Quick Capture'}
              </h3>
              <button 
                onClick={() => setShowCaptureModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCapture} className="p-6 space-y-4">
              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={captureTitle}
                  onChange={(e) => setCaptureTitle(e.target.value)}
                  className="w-full px-4 py-2 text-lg font-medium border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                  placeholder={locale === 'zh_Hant' ? "標題..." : "Title..."}
                />
              </div>
              
              <div>
                <textarea
                  required
                  rows={6}
                  value={captureContent}
                  onChange={(e) => setCaptureContent(e.target.value)}
                  className="w-full px-4 py-2 border-0 bg-gray-50 rounded-lg focus:ring-0 resize-none"
                  placeholder={locale === 'zh_Hant' ? "寫下你的想法..." : "What's on your mind?..."}
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCaptureModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {locale === 'zh_Hant' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCapturing}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isCapturing 
                    ? (locale === 'zh_Hant' ? '儲存中...' : 'Saving...') 
                    : (locale === 'zh_Hant' ? '儲存至收件匣' : 'Save to Inbox')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

