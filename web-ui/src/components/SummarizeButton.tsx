import { useState } from 'react';
import { Sparkles, Volume2, VolumeX, Play } from 'lucide-react';
import { jarvisApi } from '../api/jarvis';
import { useI18n } from '../i18n/I18nContext';

interface SummarizeButtonProps {
  noteId: string;
  currentLevel: number;
  language?: 'en' | 'zh';
  onSummaryGenerated?: (summary: string) => void;
  onDistillationComplete?: () => void;
  className?: string;
}

export default function SummarizeButton({
  noteId,
  currentLevel,
  language,
  onSummaryGenerated,
  onDistillationComplete,
  className = '',
}: SummarizeButtonProps) {
  const { t, locale } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Determine language to use: prop override > current locale
  const targetLanguage = language || (locale === 'zh_Hant' ? 'zh' : 'en');

  const handleSummarize = async () => {
    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const response = await jarvisApi.summarize(noteId, {
        language: targetLanguage,
        voice: voiceEnabled,
      });

      setSummary(response.summary);

      if (onSummaryGenerated) {
        onSummaryGenerated(response.summary);
      }
    } catch (err: any) {
      setError(err.message || t.jarvis.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistill = async () => {
    if (currentLevel >= 4) {
      setError('Note is already at maximum distillation level');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const targetLevel = currentLevel + 1;
      await jarvisApi.distill(noteId, targetLevel, {
        language: targetLanguage,
        voice: voiceEnabled,
      });

      if (onDistillationComplete) {
        onDistillationComplete();
      }
    } catch (err: any) {
      setError(err.message || t.jarvis.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplay = async () => {
    if (!summary) return;

    setIsPlaying(true);
    setError('');

    try {
      await jarvisApi.speak(summary, targetLanguage);
    } catch (err: any) {
      setError(err.message || 'Failed to play audio');
    } finally {
      setIsPlaying(false);
    }
  };

  const levelNames = ['Raw', 'Excerpts', 'Highlights', 'Summary', 'Remix'];
  const nextLevel = currentLevel + 1;
  const canDistill = currentLevel < 4;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Control Bar */}
      <div className="flex items-center gap-3">
        {/* Summarize Button */}
        <button
          onClick={handleSummarize}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          {isLoading ? t.jarvis.summarizing : t.jarvis.summarize}
        </button>

        {/* Distill Button */}
        {canDistill && (
          <button
            onClick={handleDistill}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            {isLoading ? t.jarvis.summarizing : `${t.jarvis.distill} (Level ${nextLevel})`}
          </button>
        )}

        {/* Voice Toggle */}
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
            voiceEnabled
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          }`}
          title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
        >
          {voiceEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>

        {/* Current Level Indicator */}
        <div className="ml-auto flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
          <span className="text-gray-600">Level:</span>
          <span className="font-semibold text-gray-900">
            {currentLevel} - {levelNames[currentLevel]}
          </span>
        </div>
      </div>

      {/* Summary Display */}
      {summary && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-purple-900">JARVIS {t.jarvis.summarize}</h4>
                <button
                  onClick={handleReplay}
                  disabled={isPlaying}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Play summary via TTS"
                >
                  <Play className="w-4 h-4" />
                  {isPlaying ? 'Playing...' : t.jarvis.replay}
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Distillation Level Guide */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Progressive Summarization Levels</h4>
        <div className="space-y-2">
          {levelNames.map((name, level) => (
            <div
              key={level}
              className={`flex items-center gap-3 ${
                level === currentLevel
                  ? 'text-blue-700 font-medium'
                  : level < currentLevel
                  ? 'text-gray-500'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  level === currentLevel
                    ? 'bg-blue-600'
                    : level < currentLevel
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
              <span className="text-sm">
                Level {level}: {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

