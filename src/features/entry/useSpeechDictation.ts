import { useEffect, useRef, useState } from 'react';

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function createRecognition(): Recognition | null {
  const host = window as Window & {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Ctor = host.SpeechRecognition || host.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = true;
  return recognition;
}

export function useSpeechDictation(onChunk: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;
  const recognitionRef = useRef<Recognition | null>(null);
  const supported = typeof window !== 'undefined' && createRecognition() !== null;

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setInterim('');
      return;
    }
    const recognition = createRecognition();
    if (!recognition) {
      setError('Este navegador não oferece ditado por voz.');
      return;
    }
    recognition.onresult = (event) => {
      let pending = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) onChunkRef.current(piece);
        else pending += piece;
      }
      setInterim(pending);
    };
    recognition.onerror = (event) => {
      setError(
        event.error === 'not-allowed'
          ? 'Permita o microfone neste site para ditar a impressão final.'
          : 'Não foi possível usar o microfone.'
      );
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };
    recognitionRef.current = recognition;
    setError(null);
    recognition.start();
    setListening(true);
  };

  return { supported, listening, interim, error, toggle };
}
