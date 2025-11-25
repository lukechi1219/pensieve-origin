import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, Bot, Volume2, VolumeX } from 'lucide-react';
import { chatsApi } from '../api/chats';
import { jarvisApi } from '../api/jarvis';
import type { Chat, ChatMessage } from '../types';

export default function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  useEffect(() => {
    if (id) {
      loadChat(id);
    }
  }, [id]);

  const loadChat = async (chatId: string) => {
    try {
      setLoading(true);
      const data = await chatsApi.getById(chatId);
      setChat(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!id || !newMessage.trim() || sending || !chat) return;

    const messageToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // Detect language based on message content (simple heuristic)
    const hasChinese = /[\u4e00-\u9fa5]/.test(messageToSend);
    const language = hasChinese ? 'zh' : 'en';

    // Optimistically add user message to UI immediately
    const optimisticUserMessage = {
      role: 'user' as const,
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };

    setChat({
      ...chat,
      messages: [...chat.messages, optimisticUserMessage],
      messageCount: chat.messages.length + 1,
      modified: new Date().toISOString(),
    });

    try {
      setSending(true);

      const updatedChat = await chatsApi.addMessage(id, messageToSend, language, voiceMode);
      setChat(updatedChat); // Update chat with server response (includes JARVIS reply)

      // If voice mode is enabled, play the assistant's response
      if (voiceMode && updatedChat.messages.length > 0) {
        const lastMessage = updatedChat.messages[updatedChat.messages.length - 1];
        if (lastMessage.role === 'assistant') {
          try {
            await jarvisApi.speak(lastMessage.content, language);
          } catch (ttsError) {
            console.error('TTS playback error:', ttsError);
            // Don't show error to user, just log it
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      // Remove optimistic message on error and restore input
      setChat({
        ...chat,
        messages: chat.messages,
        messageCount: chat.messages.length,
      });
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 mb-4">找不到對話</p>
          <button
            onClick={() => navigate('/chats')}
            className="text-blue-600 hover:text-blue-700"
          >
            返回對話列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/chats')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{chat.title}</h1>
            <p className="text-sm text-gray-500">
              {chat.messageCount} 則訊息 • 最後更新: {formatTime(chat.modified)}
            </p>
          </div>
          <button
            onClick={() => setVoiceMode(!voiceMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              voiceMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={voiceMode ? '關閉語音陪聊' : '開啟語音陪聊'}
          >
            {voiceMode ? (
              <>
                <Volume2 className="w-5 h-5" />
                <span>語音陪聊</span>
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5" />
                <span>語音陪聊</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto px-8 py-6 space-y-4">
        {chat.messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            尚無訊息，開始對話吧！
          </div>
        ) : (
          chat.messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
              )}

              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-8 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="輸入訊息... (Enter 送出)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? '傳送中...' : '送出'}
          </button>
        </div>
      </div>
    </div>
  );
}
