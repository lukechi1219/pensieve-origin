import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, Bot, Volume2, VolumeX } from 'lucide-react';
import { chatsApi } from '../api/chats';
import { jarvisApi } from '../api/jarvis';
import type { Chat } from '../types';
import { useI18n } from '../i18n/I18nContext';

const BATCH_SIZE = 20;

export default function ChatDetail() {
  const { t, locale } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isJarvisResponding, setIsJarvisResponding] = useState(false);
  
  // Pagination state
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollHeightRef = useRef<number>(0);
  const isRestoringScrollRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (id) {
      loadChat(id);
    }
  }, [id]);

  // Auto-scroll to bottom on initial load (when loading finishes)
  useEffect(() => {
    if (!loading && chat?.messages.length) {
      scrollToBottom();
    }
  }, [loading, chat?.id]);

  // Restore scroll position when prepending messages
  useLayoutEffect(() => {
    if (isRestoringScrollRef.current && scrollContainerRef.current) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      const diff = newScrollHeight - scrollHeightRef.current;
      if (diff > 0) {
        scrollContainerRef.current.scrollTop = diff;
      }
      isRestoringScrollRef.current = false;
    }
  }, [chat?.messages]);

  const loadChat = async (chatId: string) => {
    try {
      setLoading(true);
      // Initial load: get latest messages
      const data = await chatsApi.getById(chatId, { limit: BATCH_SIZE, skip: 0 });
      setChat(data);
      // Check if there are more messages on server
      setHasMore(data.messages.length < data.messageCount);
    } catch (err: any) {
      setError(err.message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    // Trigger load when scrolled near top (within 50px)
    if (scrollTop < 50 && hasMore && !isFetchingMore && !loading && chat) {
      await loadMoreMessages();
    }
  };

  // Auto-load more messages if content doesn't fill the container (enables scrolling/filling)
  useEffect(() => {
    if (!scrollContainerRef.current || !hasMore || isFetchingMore || loading || !chat) return;
    
    const { scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight <= clientHeight + 50) {
      loadMoreMessages();
    }
  }, [chat?.messages.length, hasMore, isFetchingMore, loading]);

  const loadMoreMessages = async () => {
    if (!id || !chat || isFetchingMore) return;

    setIsFetchingMore(true);
    
    // Capture current scroll height before update
    if (scrollContainerRef.current) {
      scrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      isRestoringScrollRef.current = true;
    }

    try {
      const currentLength = chat.messages.length;
      // Skip the number of messages we already have
      const data = await chatsApi.getById(id, { 
        limit: BATCH_SIZE, 
        skip: currentLength 
      });

      if (data.messages.length > 0) {
        // Prepend new older messages to the list
        setChat(prev => {
          if (!prev) return data;
          return {
            ...prev,
            messages: [...data.messages, ...prev.messages],
            // Ensure total count is consistent
            messageCount: data.messageCount
          };
        });
        
        // Update hasMore based on total count
        setHasMore(currentLength + data.messages.length < data.messageCount);
      } else {
        setHasMore(false);
        isRestoringScrollRef.current = false; // Cancel restoration if no data
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
      isRestoringScrollRef.current = false;
    } finally {
      setIsFetchingMore(false);
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

    setChat(prev => prev ? ({
      ...prev,
      messages: [...prev.messages, optimisticUserMessage],
      messageCount: prev.messageCount + 1,
      modified: new Date().toISOString(),
    }) : null);

    // Force scroll to bottom for new message
    setTimeout(scrollToBottom, 0);

    try {
      setSending(true);
      setIsJarvisResponding(true); // Start showing JARVIS thinking
      setTimeout(scrollToBottom, 0); // Scroll to show thinking indicator

      const updatedChatFull = await chatsApi.addMessage(id, messageToSend, language, voiceMode);
      
      // Update chat with response
      // To avoid replacing our paginated list with the full list from server (if server returns all),
      // we just append the assistant's response from the returned data.
      const lastMessage = updatedChatFull.messages[updatedChatFull.messages.length - 1];
      
      if (lastMessage && lastMessage.role === 'assistant') {
         setChat(prev => prev ? ({
           ...prev,
           messages: [...prev.messages, lastMessage],
           messageCount: updatedChatFull.messageCount,
           modified: updatedChatFull.modified
         }) : null);
         
         setTimeout(scrollToBottom, 0); // Scroll to show response

         if (voiceMode) {
            try {
              await jarvisApi.speak(lastMessage.content, language);
            } catch (ttsError) {
              console.error('TTS playback error:', ttsError);
            }
         }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      // On error, we might want to reload to get consistent state
      loadChat(id);
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
      setIsJarvisResponding(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(locale === 'zh_Hant' ? 'zh-TW' : 'en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t.common.loading}</div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t.notes.notFound}</p>
          <button
            onClick={() => navigate('/chats')}
            className="text-blue-600 hover:text-blue-700"
          >
            {t.common.back}
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
              {chat.messageCount} {t.chat.messages} • {t.chat.lastUpdate}: {formatTime(chat.modified)}
            </p>
          </div>
          <button
            onClick={() => setVoiceMode(!voiceMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              voiceMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={voiceMode ? t.chat.disableVoice : t.chat.enableVoice}
          >
            {voiceMode ? (
              <>
                <Volume2 className="w-5 h-5" />
                <span>{t.chat.voiceMode}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5" />
                <span>{t.chat.voiceMode}</span>
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
      <div 
        className="flex-1 overflow-auto px-8 py-6 space-y-4"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {hasMore && !isFetchingMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMoreMessages}
              className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors"
            >
              {t.common.previous || 'Load previous messages'}
            </button>
          </div>
        )}
        {isFetchingMore && (
           <div className="text-center py-2 text-sm text-gray-500">
             {t.common.loading}...
           </div>
        )}
        
        {chat.messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t.chat.noMessages}
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
        {isJarvisResponding && (
          <div className="flex gap-4 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-600 animate-bounce" />
            </div>
            <div
              className="max-w-2xl px-4 py-3 rounded-lg bg-gray-100 text-gray-900"
            >
              <div className="whitespace-pre-wrap break-words">
                {t.chat.sending}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-8 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleSendMessage()}
            placeholder={t.chat.inputPlaceholder}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? t.chat.sending : t.chat.sendMessage}
          </button>
        </div>
      </div>
    </div>
  );
}