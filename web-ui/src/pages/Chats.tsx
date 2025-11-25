import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Trash2, Clock } from 'lucide-react';
import { chatsApi } from '../api/chats';
import type { Chat } from '../types';

export default function Chats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await chatsApi.getAll();
      setChats(response.items || []);
    } catch (err: any) {
      console.error('Load chats error:', err);
      setError(err.message || 'Failed to load chats');
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async () => {
    if (!newChatTitle.trim()) return;

    try {
      const chat = await chatsApi.create(newChatTitle.trim());
      setShowNewChatDialog(false);
      setNewChatTitle('');
      navigate(`/chats/${chat.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create chat');
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('確定要刪除此對話嗎？')) return;

    try {
      await chatsApi.delete(id);
      await loadChats();
    } catch (err: any) {
      setError(err.message || 'Failed to delete chat');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-TW');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">對話記錄</h1>
            <p className="text-sm text-gray-500 mt-1">
              共 {chats?.length || 0} 個對話
            </p>
          </div>
          <button
            onClick={() => setShowNewChatDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新對話
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {!chats || chats.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">尚無對話記錄</p>
            <button
              onClick={() => setShowNewChatDialog(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              建立第一個對話
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => navigate(`/chats/${chat.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1 pr-2">
                    {chat.title}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="刪除對話"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {chat.summary}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {chat.messageCount} 則訊息
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(chat.modified)}
                    </span>
                  </div>
                </div>

                {chat.tags && chat.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {chat.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      {showNewChatDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">建立新對話</h2>
            <input
              type="text"
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateChat()}
              placeholder="對話標題"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCreateChat}
                disabled={!newChatTitle.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                建立
              </button>
              <button
                onClick={() => {
                  setShowNewChatDialog(false);
                  setNewChatTitle('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
