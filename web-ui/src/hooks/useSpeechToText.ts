import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onSentenceComplete?: (text: string) => void;
  onError?: (error: string) => void;
}

interface UseSpeechToTextReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
}

/**
 * Custom hook for speech-to-text using Web Speech API
 * with automatic sentence detection and submission
 */
export function useSpeechToText({
  language = 'zh-TW', // Default to Traditional Chinese
  continuous = true,
  interimResults = true,
  onSentenceComplete,
  onError,
}: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sentenceBufferRef = useRef<string>('');
  const lastSentenceTimeRef = useRef<number>(Date.now());

  // Sentence ending punctuation detection
  const isSentenceComplete = useCallback((text: string): boolean => {
    // Chinese punctuation: 。！？、
    // English punctuation: . ! ? ;
    const sentenceEnders = /[。！？!?;]\s*$/;
    return sentenceEnders.test(text.trim());
  }, []);

  // Auto-submit if silence detected (3 seconds after last word)
  useEffect(() => {
    if (!isListening || !sentenceBufferRef.current) return;

    const checkSilence = setInterval(() => {
      const timeSinceLastWord = Date.now() - lastSentenceTimeRef.current;

      // If 1 seconds of silence and there's text, consider it a complete sentence
      if (timeSinceLastWord > 1000 && sentenceBufferRef.current.trim()) {
        const completeSentence = sentenceBufferRef.current.trim();

        if (onSentenceComplete) {
          onSentenceComplete(completeSentence);
        }

        sentenceBufferRef.current = '';
        setTranscript('');
        setInterimTranscript('');
      }
    }, 500);

    return () => clearInterval(checkSilence);
  }, [isListening, onSentenceComplete]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      lastSentenceTimeRef.current = Date.now();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      // Update interim results (real-time display)
      setInterimTranscript(interimText);

      // Handle final results
      if (finalText) {
        lastSentenceTimeRef.current = Date.now();

        // Append to buffer
        sentenceBufferRef.current += finalText;

        // Update transcript
        const currentBuffer = sentenceBufferRef.current.trim();
        setTranscript(currentBuffer);

        // Check if sentence is complete
        if (isSentenceComplete(currentBuffer)) {
          if (onSentenceComplete) {
            onSentenceComplete(currentBuffer);
          }

          // Reset buffer after submission
          sentenceBufferRef.current = '';
          setTranscript('');
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      // If continuous mode and still should be listening, restart
      if (continuous && isListening) {
        try {
          recognition.start();
        } catch (e) {
          // Already started or stopped by user
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, isSupported, isSentenceComplete, onSentenceComplete, onError, isListening]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        sentenceBufferRef.current = '';
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        recognitionRef.current.start();
      } catch (e) {
        setError('Failed to start speech recognition. It may already be running.');
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);

      // Submit any remaining text
      if (sentenceBufferRef.current.trim() && onSentenceComplete) {
        onSentenceComplete(sentenceBufferRef.current.trim());
      }

      sentenceBufferRef.current = '';
      setTranscript('');
      setInterimTranscript('');
    }
  }, [onSentenceComplete]);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    isSupported,
    error,
  };
}
