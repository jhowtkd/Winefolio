import React, { useState, useEffect, useRef } from 'react';
import { WineTastingSheet, WineType, WineStyle } from '../types';
import { WineGlassVisual } from './WineGlassVisual';
import { LabelPhotoCapture } from './LabelPhotoCapture';
import { analyzeWineLabelPhoto, AnalyzedWineLabel } from '../services/wineOcrService';
import {
  WINE_COLORS,
  AROMA_CATEGORIES,
  LIMPIDITY_OPTIONS,
  TRANSPARENCY_OPTIONS,
  INTENSITY_OPTIONS,
  CONDITION_OPTIONS,
  DEVELOPMENT_OPTIONS,
  SWEETNESS_OPTIONS,
  ACIDITY_OPTIONS,
  TANNIN_OPTIONS,
  BODY_OPTIONS,
  PERSISTENCE_OPTIONS,
  AGING_OPTIONS,
  QUALITY_OPTIONS,
  DEFAULT_TAG_SUGGESTIONS,
} from '../data/sommelierData';
import {
  X,
  Check,
  Star,
  Sparkles,
  Tag,
  Plus,
  Mic,
  MicOff,
  Square,
  Volume2,
  AlertCircle,
  Loader2,
  Thermometer,
  Hourglass,
  Info,
} from 'lucide-react';

interface TastingFormModalProps {
  initialData?: WineTastingSheet | null;
  availableTags?: string[];
  onSave: (data: WineTastingSheet) => void;
  onCancel: () => void;
  autoOpenScanner?: boolean;
}

export const TastingFormModal: React.FC<TastingFormModalProps> = ({
  initialData,
  availableTags = [],
  onSave,
  onCancel,
  autoOpenScanner = false,
}) => {
  const [formData, setFormData] = useState<WineTastingSheet>(() => {
    if (initialData) {
      return {
        ...initialData,
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        temperaturaServico: initialData.temperaturaServico || '',
        decantacao: initialData.decantacao || '',
      };
    }
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: `wine-${Date.now()}`,
      produtor: '',
      vinho: '',
      safra: '',
      uvas: '',
      regiaoPais: '',
      tipo: 'tranquilo',
      estilo: 'tinto',
      visual: {
        limpidez: 'Límpido',
        transparencia: 'Translúcido',
        intensidade: 'Média',
        corNucleoBorda: 'Rubi',
        corHex: '#83122D',
        perlage: '—',
      },
      olfato: {
        condicao: 'Limpo / Correto',
        intensidade: 'Média+',
        aromas: '',
        desenvolvimento: 'Jovem / Primário',
      },
      paladar: {
        docura: 'Seco',
        acidez: 'Média',
        tanino: 'Médio',
        aromasBoca: '',
        corpo: 'Médio',
        alcool: 'Equilibrado (13.5%)',
        retrogosto: '',
        persistencia: 'Média',
      },
      conclusao: {
        guarda: 'Pronto',
        preco: '',
        qualidade: 'Boa',
        avaliacaoEstrelas: 4,
        harmonizacao: '',
        impressaoFinal: '',
      },
      tags: [],
      dataDegustacao: today,
      temperaturaServico: '',
      decantacao: '',
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
    };
  });

  const [activeTab, setActiveTab] = useState<'geral' | 'visual' | 'olfato' | 'paladar' | 'conclusao'>('geral');
  const [showAromaHelper, setShowAromaHelper] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Wine Label OCR & AI Analysis State
  const [isAnalyzingLabel, setIsAnalyzingLabel] = useState(false);
  const [labelScanError, setLabelScanError] = useState<string | null>(null);
  const [labelScanSuccess, setLabelScanSuccess] = useState<string | null>(null);
  const [analyzedWineInfo, setAnalyzedWineInfo] = useState<AnalyzedWineLabel | null>(null);

  const handleAnalyzeLabel = async (photoDataUrl: string) => {
    if (!photoDataUrl) return;
    setIsAnalyzingLabel(true);
    setLabelScanError(null);
    setLabelScanSuccess(null);

    try {
      const analyzed = await analyzeWineLabelPhoto(photoDataUrl);
      setAnalyzedWineInfo(analyzed);

      setFormData((prev) => {
        const next = { ...prev };
        if (analyzed.produtor) next.produtor = analyzed.produtor;
        if (analyzed.vinho) next.vinho = analyzed.vinho;
        if (analyzed.safra) next.safra = analyzed.safra;
        if (analyzed.uvas) next.uvas = analyzed.uvas;
        if (analyzed.regiaoPais) next.regiaoPais = analyzed.regiaoPais;
        if (
          analyzed.tipo &&
          ['tranquilo', 'espumante', 'sobremesa', 'fortificado'].includes(analyzed.tipo)
        ) {
          next.tipo = analyzed.tipo as WineType;
        }
        if (
          analyzed.estilo &&
          ['tinto', 'branco', 'rose'].includes(analyzed.estilo)
        ) {
          next.estilo = analyzed.estilo as WineStyle;
        }
        if (analyzed.temperaturaServico) {
          next.temperaturaServico = analyzed.temperaturaServico;
        }
        if (analyzed.decantacao) {
          next.decantacao = analyzed.decantacao;
        }
        if (analyzed.potencialGuarda && next.conclusao.guarda === 'Pronto') {
          next.conclusao = { ...next.conclusao, guarda: analyzed.potencialGuarda };
        }
        if (analyzed.harmonizacaoSugerida && !next.conclusao.harmonizacao) {
          next.conclusao = { ...next.conclusao, harmonizacao: analyzed.harmonizacaoSugerida };
        }
        if (analyzed.aromasSugeridos && !next.olfato.aromas) {
          next.olfato = { ...next.olfato, aromas: analyzed.aromasSugeridos };
        }
        if (analyzed.resumo) {
          const prevNotes = next.conclusao.impressaoFinal ? `${next.conclusao.impressaoFinal}\n\n` : '';
          next.conclusao = {
            ...next.conclusao,
            impressaoFinal: `${prevNotes}[Nota do Rótulo IA]: ${analyzed.resumo}`,
          };
        }
        if (analyzed.alcool) {
          next.paladar = { ...next.paladar, alcool: `Equilibrado (${analyzed.alcool})` };
        }
        if (analyzed.corHexSugerida) {
          next.visual = { ...next.visual, corHex: analyzed.corHexSugerida };
        }
        return next;
      });

      const wineTitle = [analyzed.produtor, analyzed.vinho, analyzed.safra ? `(${analyzed.safra})` : '']
        .filter(Boolean)
        .join(' ');
      setLabelScanSuccess(
        `Rótulo analisado com sucesso! Identificado: ${wineTitle || 'Vinho'}. Os dados técnicos foram preenchidos.`
      );
    } catch (err: any) {
      console.error('Error analyzing label:', err);
      setLabelScanError(err.message || 'Não foi possível ler as informações do rótulo.');
    } finally {
      setIsAnalyzingLabel(false);
    }
  };

  // Speech-to-Text & Microphone State for Impressão Final
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const isSpeechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setInterimTranscript('');

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (err) {
        // ignore
      }
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  };

  const startRecording = async () => {
    setRecordingError(null);
    setInterimTranscript('');
    setRecordingDuration(0);

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setRecordingError(
        'A API de reconhecimento de voz não é suportada por este navegador. Experimente o Google Chrome ou Microsoft Edge.'
      );
      return;
    }

    try {
      // Access browser microphone via getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Audio analysis for real-time waveform / audio level feedback
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!isRecordingRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (audioErr) {
        console.warn('AudioContext visualization not available:', audioErr);
      }

      // Initialize SpeechRecognition
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isRecordingRef.current = true;
        setIsRecording(true);
        setRecordingError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscriptChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptChunk += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        setInterimTranscript(currentInterim);

        if (finalTranscriptChunk.trim()) {
          setFormData((prev) => {
            const existing = prev.conclusao.impressaoFinal.trim();
            const chunk = finalTranscriptChunk.trim();

            const formattedChunk =
              existing === '' || /[.!?]$/.test(existing)
                ? chunk.charAt(0).toUpperCase() + chunk.slice(1)
                : chunk;

            const updatedText = existing
              ? `${existing} ${formattedChunk}`
              : formattedChunk;

            return {
              ...prev,
              conclusao: {
                ...prev.conclusao,
                impressaoFinal: updatedText,
              },
            };
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setRecordingError(
            'Permissão de microfone negada. Por favor, autorize o acesso ao microfone nas permissões do navegador.'
          );
          stopRecording();
        } else if (event.error === 'network') {
          setRecordingError('Problema de rede com o serviço de transcrição.');
        }
      };

      recognition.onend = () => {
        // If still flagged as active, restart automatically to prevent browser silence timeouts
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // ignore
          }
        }
      };

      recognition.start();
      isRecordingRef.current = true;
      setIsRecording(true);

      // Duration counter
      const startTime = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setRecordingError(
          'Permissão de acesso ao microfone foi negada pelo navegador. Permita o microfone para gravar suas notas.'
        );
      } else {
        setRecordingError(
          'Não foi possível iniciar o microfone. Verifique as configurações de áudio do seu dispositivo.'
        );
      }
      stopRecording();
    }
  };

  // Clean up recording on unmount or tab switch
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'conclusao' && isRecording) {
      stopRecording();
    }
  }, [activeTab]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Combine default suggestions and existing tags without duplicates
  const allSuggestedTags = Array.from(
    new Set([...DEFAULT_TAG_SUGGESTIONS, ...availableTags])
  );

  const handleAddTag = (tagToAdd?: string) => {
    const raw = (tagToAdd !== undefined ? tagToAdd : newTagInput).trim();
    if (!raw) return;
    const splitTags = raw
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);

    setFormData((prev) => {
      const currentTags = prev.tags || [];
      const updated = [...currentTags];
      splitTags.forEach((t) => {
        if (!updated.some((existing) => existing.toLowerCase() === t.toLowerCase())) {
          updated.push(t);
        }
      });
      return { ...prev, tags: updated };
    });

    if (tagToAdd === undefined) {
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tagToRemove),
    }));
  };

  const handleToggleTag = (tag: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      handleRemoveTag(tag);
    } else {
      handleAddTag(tag);
    }
  };

  const handleUpdate = (section: keyof WineTastingSheet, key: string, value: any) => {
    if (section === 'visual' || section === 'olfato' || section === 'paladar' || section === 'conclusao') {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [section]: value,
      }));
    }
  };

  const addAromaTag = (tag: string) => {
    setFormData((prev) => {
      const current = prev.olfato.aromas.trim();
      if (!current) {
        return {
          ...prev,
          olfato: { ...prev.olfato, aromas: tag },
        };
      }
      if (current.includes(tag)) return prev;
      return {
        ...prev,
        olfato: { ...prev.olfato, aromas: `${current} / ${tag}` },
      };
    });
  };

  const handleSelectColor = (colorObj: { label: string; hex: string; style: string }) => {
    setFormData((prev) => ({
      ...prev,
      estilo: colorObj.style as WineStyle,
      visual: {
        ...prev.visual,
        corNucleoBorda: colorObj.label,
        corHex: colorObj.hex,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.produtor.trim() && !formData.vinho.trim()) {
      alert('Por favor, informe pelo menos o Produtor ou o Vinho.');
      setActiveTab('geral');
      return;
    }
    stopRecording();
    onSave({
      ...formData,
      atualizadoEm: Date.now(),
    });
  };

  const handleClose = () => {
    stopRecording();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-stone-300 w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-6 bg-rose-900 rounded-xs"></span>
            <h2 className="text-xl font-bold font-serif-title tracking-wide text-stone-900">
              {initialData ? 'Editar Ficha de Degustação' : 'Nova Ficha de Degustação'}
            </h2>
          </div>
          <button
            id="btn-fechar-modal"
            onClick={handleClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-100/70 overflow-x-auto text-xs sm:text-sm font-medium scrollbar-none">
          <button
            id="tab-geral"
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'geral'
                ? 'border-rose-900 text-rose-950 font-bold bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            1. Vinho & Produtor
          </button>
          <button
            id="tab-visual"
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`px-4 py-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'visual'
                ? 'border-rose-900 text-rose-950 font-bold bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            2. Visual
          </button>
          <button
            id="tab-olfato"
            type="button"
            onClick={() => setActiveTab('olfato')}
            className={`px-4 py-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'olfato'
                ? 'border-rose-900 text-rose-950 font-bold bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            3. Olfato
          </button>
          <button
            id="tab-paladar"
            type="button"
            onClick={() => setActiveTab('paladar')}
            className={`px-4 py-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'paladar'
                ? 'border-rose-900 text-rose-950 font-bold bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            4. Paladar
          </button>
          <button
            id="tab-conclusao"
            type="button"
            onClick={() => setActiveTab('conclusao')}
            className={`px-4 py-3 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === 'conclusao'
                ? 'border-rose-900 text-rose-950 font-bold bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            5. Conclusão & Avaliação
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: IDENTIFICAÇÃO GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Foto do Rótulo para a Miniatura */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Rótulo da Garrafa
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Leitura com IA
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-medium">
                    Tire uma foto ou carregue a imagem
                  </span>
                </div>

                {/* AI Label Status Feedback */}
                {isAnalyzingLabel && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 animate-pulse">
                    <Loader2 className="w-5 h-5 text-amber-700 animate-spin shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold block text-amber-950">Sommelier IA está lendo o rótulo...</span>
                      <span className="text-amber-800">
                        Extraindo produtor, safra, uvas, região, estilo e notas técnicas automaticamente.
                      </span>
                    </div>
                  </div>
                )}

                {labelScanSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start justify-between gap-2 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs space-y-1">
                        <span className="font-bold block text-emerald-900">
                          {labelScanSuccess}
                        </span>
                        {analyzedWineInfo && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {analyzedWineInfo.produtor && (
                              <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-[11px] font-semibold text-emerald-800">
                                Produtor: {analyzedWineInfo.produtor}
                              </span>
                            )}
                            {analyzedWineInfo.vinho && (
                              <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-[11px] font-semibold text-emerald-800">
                                Vinho: {analyzedWineInfo.vinho}
                              </span>
                            )}
                            {analyzedWineInfo.safra && (
                              <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-[11px] font-semibold text-emerald-800">
                                Safra: {analyzedWineInfo.safra}
                              </span>
                            )}
                            {analyzedWineInfo.uvas && (
                              <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-[11px] font-semibold text-emerald-800">
                                Uvas: {analyzedWineInfo.uvas}
                              </span>
                            )}
                            {analyzedWineInfo.regiaoPais && (
                              <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-[11px] font-semibold text-emerald-800">
                                Região: {analyzedWineInfo.regiaoPais}
                              </span>
                            )}
                            {analyzedWineInfo.alcool && (
                              <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-[11px] font-semibold text-emerald-800">
                                Álcool: {analyzedWineInfo.alcool}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-fechar-aviso-ia"
                      onClick={() => setLabelScanSuccess(null)}
                      className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {labelScanError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start justify-between gap-2 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold block text-rose-900">Não foi possível ler o rótulo</span>
                        <span className="text-rose-800">{labelScanError}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-fechar-erro-ia"
                      onClick={() => setLabelScanError(null)}
                      className="text-rose-700 hover:text-rose-900 p-1 rounded-md transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <LabelPhotoCapture
                  currentPhoto={formData.fotoRotulo}
                  onChangePhoto={(photoDataUrl) =>
                    setFormData((prev) => ({ ...prev, fotoRotulo: photoDataUrl }))
                  }
                  onRemovePhoto={() =>
                    setFormData((prev) => ({ ...prev, fotoRotulo: undefined }))
                  }
                  wineStyle={formData.estilo}
                  onAnalyzeLabel={handleAnalyzeLabel}
                  isAnalyzing={isAnalyzingLabel}
                  autoOpenScanner={autoOpenScanner}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Produtor *
                  </label>
                  <input
                    id="input-produtor"
                    type="text"
                    required
                    placeholder="Ex: Terrazas de los Andes, Catena Zapata..."
                    value={formData.produtor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('produtor', '', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Safra
                  </label>
                  <input
                    id="input-safra"
                    type="text"
                    placeholder="Ex: 2024, 2021, N/V"
                    value={formData.safra}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('safra', '', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Nome do Vinho / Rótulo
                  </label>
                  <input
                    id="input-vinho"
                    type="text"
                    placeholder="Ex: Reserva Chardonnay, Gran Reserva..."
                    value={formData.vinho}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('vinho', '', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Uva(s)
                  </label>
                  <input
                    id="input-uvas"
                    type="text"
                    placeholder="Ex: Chardonnay, Cabernet Sauvignon, Blend..."
                    value={formData.uvas}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('uvas', '', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Região / País
                  </label>
                  <input
                    id="input-regiao"
                    type="text"
                    placeholder="Ex: Mendoza - AR, Vale dos Vinhedos - BR, Douro - PT..."
                    value={formData.regiaoPais}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('regiaoPais', '', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Data da Degustação
                  </label>
                  <input
                    id="input-data"
                    type="date"
                    value={formData.dataDegustacao}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('dataDegustacao', '', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                  />
                </div>
              </div>

              {/* Wine Type Radios */}
              <div className="pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Tipo do Vinho (como na ficha)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['tranquilo', 'espumante', 'sobremesa', 'fortificado'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleUpdate('tipo', '', type)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition ${
                        formData.tipo === type
                          ? 'border-rose-900 bg-rose-900 text-white shadow-xs'
                          : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${formData.tipo === type ? 'bg-white' : 'bg-stone-400'}`}></span>
                      <span className="capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wine Style Radios */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Estilo / Cor
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['branco', 'rose', 'tinto'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => {
                        const defaultHex = {
                          branco: '#F3E99F',
                          rose: '#E88B7C',
                          tinto: '#83122D',
                        }[style];
                        setFormData((prev) => ({
                          ...prev,
                          estilo: style,
                          visual: {
                            ...prev.visual,
                            corHex: defaultHex,
                          },
                        }));
                      }}
                      className={`px-4 py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition ${
                        formData.estilo === style
                          ? 'border-rose-900 bg-rose-900 text-white shadow-xs'
                          : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-stone-300"
                        style={{
                          backgroundColor: style === 'branco' ? '#F3E99F' : style === 'rose' ? '#E88B7C' : '#83122D',
                        }}
                      ></span>
                      <span className="capitalize">{style === 'rose' ? 'Rosé' : style}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Personalizadas Section */}
              <div className="pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700">
                    <Tag className="w-3.5 h-3.5 text-rose-900" />
                    Tags Personalizadas & Ocasiões
                  </label>
                  {(formData.tags || []).length > 0 && (
                    <span className="text-[11px] font-semibold text-rose-900 bg-rose-50 px-2 py-0.5 rounded-full">
                      {(formData.tags || []).length} {(formData.tags || []).length === 1 ? 'tag' : 'tags'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mb-3">
                  Categorize esta garrafa para encontrar e filtrar facilmente no painel principal (ex: <em>Presente</em>, <em>Compra Anual</em>, <em>Encontro</em>).
                </p>

                {/* Active Tags Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-3 min-h-8 p-2 bg-stone-50/80 rounded-xl border border-stone-200">
                  {(formData.tags || []).length === 0 ? (
                    <span className="text-xs text-stone-400 italic">
                      Nenhuma tag atribuída a esta ficha ainda. Adicione abaixo ou clique em uma sugestão.
                    </span>
                  ) : (
                    (formData.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700"
                      >
                        <Tag className="w-3 h-3 text-rose-800 shrink-0" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          id={`btn-remover-tag-${tag}`}
                          onClick={() => handleRemoveTag(tag)}
                          className="text-stone-400 hover:text-red-600 rounded-full p-0.5 ml-0.5 transition cursor-pointer"
                          title={`Remover tag "${tag}"`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Custom Tag Input & Button */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1">
                    <input
                      id="input-nova-tag"
                      type="text"
                      placeholder="Criar nova tag (pressione Enter para adicionar)..."
                      value={newTagInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagInput(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                    />
                  </div>
                  <button
                    type="button"
                    id="btn-adicionar-tag"
                    onClick={() => handleAddTag()}
                    disabled={!newTagInput.trim()}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shrink-0 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {/* Tag Suggestions Quick-Pick */}
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                    Sugestões rápidas (clique para adicionar ou remover):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {allSuggestedTags.map((suggestion) => {
                      const isSelected = (formData.tags || []).some(
                        (t) => t.toLowerCase() === suggestion.toLowerCase()
                      );
                      return (
                        <button
                          key={suggestion}
                          type="button"
                          id={`sugestao-tag-${suggestion.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => handleToggleTag(suggestion)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                            isSelected
                              ? 'bg-rose-900 text-white border-rose-900 font-semibold shadow-2xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100/80 hover:border-stone-300'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <Plus className="w-3 h-3 text-stone-400" />
                          )}
                          <span>{suggestion}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANÁLISE VISUAL */}
          {activeTab === 'visual' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-white border border-stone-200 rounded-2xl">
                <div className="flex flex-col items-center justify-center bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <WineGlassVisual
                    colorHex={formData.visual.corHex}
                    style={formData.estilo}
                    size="lg"
                  />
                  <span className="text-[11px] font-mono text-stone-500 uppercase mt-1">
                    {formData.visual.corNucleoBorda || 'Cor Selecionada'}
                  </span>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Paleta de Cores do Vinho (Selecione para preencher a taça)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {WINE_COLORS.map((col) => (
                      <button
                        key={col.label}
                        type="button"
                        onClick={() => handleSelectColor(col)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs text-left cursor-pointer transition ${
                          formData.visual.corNucleoBorda === col.label
                            ? 'border-rose-900 bg-rose-50 font-bold text-rose-950 ring-1 ring-rose-900'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 border border-stone-300 shadow-xs"
                          style={{ backgroundColor: col.hex }}
                        ></span>
                        <span className="truncate">{col.label}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Ou digite a cor (Núcleo / Borda):
                    </label>
                    <input
                      id="input-cor-texto"
                      type="text"
                      placeholder="Ex: Palha com reflexos dourados, Rubi translúcido..."
                      value={formData.visual.corNucleoBorda}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('visual', 'corNucleoBorda', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Limpidez */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Limpidez
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {LIMPIDITY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleUpdate('visual', 'limpidez', opt)}
                      className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer transition ${
                        formData.visual.limpidez === opt
                          ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.visual.limpidez}
                  onChange={(e) => handleUpdate('visual', 'limpidez', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-800"
                  placeholder="Personalizado..."
                />
              </div>

              {/* Transparência & Intensidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Transparência
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {TRANSPARENCY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('visual', 'transparencia', opt)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition ${
                          formData.visual.transparencia === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.visual.transparencia}
                    onChange={(e) => handleUpdate('visual', 'transparencia', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-800"
                    placeholder="Ex: Translúcido"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Intensidade Visual
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {INTENSITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('visual', 'intensidade', opt)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition ${
                          formData.visual.intensidade === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.visual.intensidade}
                    onChange={(e) => handleUpdate('visual', 'intensidade', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-800"
                    placeholder="Ex: Baixa"
                  />
                </div>
              </div>

              {/* Perlage */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Perlage (Para espumantes)
                </label>
                <input
                  id="input-perlage"
                  type="text"
                  value={formData.visual.perlage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('visual', 'perlage', e.target.value)}
                  placeholder="Ex: Fina, abundante e persistente, ou —"
                  className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                />
              </div>
            </div>
          )}

          {/* TAB 3: ANÁLISE OLFATIVA */}
          {activeTab === 'olfato' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Condição
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {CONDITION_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('olfato', 'condicao', opt)}
                        className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer transition ${
                          formData.olfato.condicao === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.olfato.condicao}
                    onChange={(e) => handleUpdate('olfato', 'condicao', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Intensidade Olfativa
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {INTENSITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('olfato', 'intensidade', opt)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition ${
                          formData.olfato.intensidade === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.olfato.intensidade}
                    onChange={(e) => handleUpdate('olfato', 'intensidade', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-800"
                  />
                </div>
              </div>

              {/* Aromas Free text + Sommelier helper */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Aromas (como escrito na ficha)
                  </label>
                  <button
                    id="btn-toggle-aromas"
                    type="button"
                    onClick={() => setShowAromaHelper(!showAromaHelper)}
                    className="flex items-center gap-1.5 text-xs text-rose-900 font-semibold hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {showAromaHelper ? 'Ocultar catálogo de aromas' : 'Ver catálogo de aromas sommelier'}
                  </button>
                </div>

                <textarea
                  id="textarea-aromas"
                  rows={3}
                  value={formData.olfato.aromas}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdate('olfato', 'aromas', e.target.value)}
                  placeholder="Ex: Maçã madura / Casca de pêssego / Manteiga / Lima da Pérsia..."
                  className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm leading-relaxed font-serif text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                />

                {/* Quick Aroma Category Chips */}
                {showAromaHelper && (
                  <div className="p-4 bg-stone-100/80 border border-stone-300 rounded-2xl space-y-3 animate-fadeIn">
                    <p className="text-xs text-stone-600 font-medium">
                      Clique para adicionar aromas comuns detectados na roda de aromas:
                    </p>
                    {AROMA_CATEGORIES.map((cat) => (
                      <div key={cat.name} className="space-y-1">
                        <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                          {cat.name}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.items.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => addAromaTag(item)}
                              className="px-2.5 py-1 text-xs bg-white hover:bg-rose-50 hover:text-rose-900 border border-stone-200 rounded-lg text-stone-700 transition cursor-pointer"
                            >
                              + {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desenvolvimento */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Desenvolvimento
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {DEVELOPMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleUpdate('olfato', 'desenvolvimento', opt)}
                      className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer transition ${
                        formData.olfato.desenvolvimento === opt
                          ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.olfato.desenvolvimento}
                  onChange={(e) => handleUpdate('olfato', 'desenvolvimento', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-800"
                  placeholder="Ex: Primário"
                />
              </div>
            </div>
          )}

          {/* TAB 4: PALADAR */}
          {activeTab === 'paladar' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Doçura, Acidez, Tanino */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Doçura
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {SWEETNESS_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('paladar', 'docura', opt)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition ${
                          formData.paladar.docura === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.paladar.docura}
                    onChange={(e) => handleUpdate('paladar', 'docura', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Acidez
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ACIDITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('paladar', 'acidez', opt)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition ${
                          formData.paladar.acidez === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.paladar.acidez}
                    onChange={(e) => handleUpdate('paladar', 'acidez', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Tanino
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {TANNIN_OPTIONS.slice(0, 4).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('paladar', 'tanino', opt)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition ${
                          formData.paladar.tanino === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.paladar.tanino}
                    onChange={(e) => handleUpdate('paladar', 'tanino', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Aromas em Boca */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Aromas em Boca (Retronasal)
                </label>
                <input
                  id="input-aromas-boca"
                  type="text"
                  value={formData.paladar.aromasBoca}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('paladar', 'aromasBoca', e.target.value)}
                  placeholder="Ex: Casca de pêssego, fruta fresca, mineral..."
                  className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                />
              </div>

              {/* Corpo & Álcool */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Corpo
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {BODY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('paladar', 'corpo', opt)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition ${
                          formData.paladar.corpo === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.paladar.corpo}
                    onChange={(e) => handleUpdate('paladar', 'corpo', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Álcool
                  </label>
                  <input
                    id="input-alcool"
                    type="text"
                    value={formData.paladar.alcool}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('paladar', 'alcool', e.target.value)}
                    placeholder="Ex: Equilibrado (13%), Quente (15%)..."
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                  />
                </div>
              </div>

              {/* Retrogosto & Persistência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Retrogosto
                  </label>
                  <input
                    id="input-retrogosto"
                    type="text"
                    value={formData.paladar.retrogosto}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate('paladar', 'retrogosto', e.target.value)}
                    placeholder="Ex: Mineral / Abacaxi"
                    className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Persistência
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PERSISTENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('paladar', 'persistencia', opt)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition ${
                          formData.paladar.persistencia === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.paladar.persistencia}
                    onChange={(e) => handleUpdate('paladar', 'persistencia', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CONCLUSÃO & AVALIAÇÃO */}
          {activeTab === 'conclusao' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Potencial de Guarda
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {AGING_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('conclusao', 'guarda', opt)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition ${
                          formData.conclusao.guarda === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.conclusao.guarda}
                    onChange={(e) => handleUpdate('conclusao', 'guarda', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Preço
                  </label>
                  <input
                    id="input-preco"
                    type="text"
                    value={formData.conclusao.preco}
                    onChange={(e) => handleUpdate('conclusao', 'preco', e.target.value)}
                    placeholder="Ex: R$ 150"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Qualidade
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {QUALITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdate('conclusao', 'qualidade', opt)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition ${
                          formData.conclusao.qualidade === opt
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.conclusao.qualidade}
                    onChange={(e) => handleUpdate('conclusao', 'qualidade', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Avaliação Estrelas */}
              <div className="p-4 bg-white border border-stone-200 rounded-2xl flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">
                    Sua Avaliação (Estrelas)
                  </label>
                  <span className="text-xs text-stone-500">Classificação pessoal de 1 a 5 estrelas</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleUpdate('conclusao', 'avaliacaoEstrelas', star)}
                      className="p-1.5 text-stone-300 hover:text-amber-400 transition cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formData.conclusao.avaliacaoEstrelas
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Harmonização */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Harmonização Gastronômica
                </label>
                <input
                  id="input-harmonizacao"
                  type="text"
                  value={formData.conclusao.harmonizacao}
                  onChange={(e) => handleUpdate('conclusao', 'harmonizacao', e.target.value)}
                  placeholder="Ex: Massa molho branco / Frango caipira / Queijo branco / Caesar Salad..."
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-sm"
                />
              </div>

              {/* Informações Opcionais de Serviço (Temperatura Ideal & Decantação) */}
              <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-rose-900" />
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">
                      Recomendações de Serviço (Opcional)
                    </label>
                  </div>
                  <span className="text-xs text-stone-500">
                    Exibido como ícones úteis na visualização da ficha técnica
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Temperatura Ideal */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      Temperatura Ideal de Serviço
                    </label>
                    <input
                      id="input-temperatura-servico"
                      type="text"
                      placeholder="Ex: 16°C - 18°C, 8°C - 10°C..."
                      value={formData.temperaturaServico || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, temperaturaServico: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition mb-2"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[
                        '6°C - 8°C',
                        '8°C - 10°C',
                        '10°C - 12°C',
                        '14°C - 16°C',
                        '16°C - 18°C',
                      ].map((temp) => (
                        <button
                          key={temp}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, temperaturaServico: temp }))}
                          className={`px-2 py-0.5 text-[11px] rounded-md border transition cursor-pointer ${
                            formData.temperaturaServico === temp
                              ? 'bg-sky-100 border-sky-400 text-sky-900 font-semibold'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {temp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sugestão de Decantação */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                      <Hourglass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Sugestão de Decantação / Aeração
                    </label>
                    <input
                      id="input-decantacao"
                      type="text"
                      placeholder="Ex: Não necessita, 30 minutos em decanter..."
                      value={formData.decantacao || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, decantacao: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition mb-2"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[
                        'Não necessita',
                        '15 - 30 min',
                        '45 min',
                        '1 hora (Decanter)',
                        '2 horas (Reserva)',
                      ].map((dec) => (
                        <button
                          key={dec}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, decantacao: dec }))}
                          className={`px-2 py-0.5 text-[11px] rounded-md border transition cursor-pointer ${
                            formData.decantacao === dec
                              ? 'bg-amber-100 border-amber-400 text-amber-900 font-semibold'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {dec}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Impressão Final com Transcrição por Voz */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Impressão Final (Notas Pessoais)
                    </label>
                    <span className="text-xs text-stone-500">
                      Digite suas observações ou use a gravação por voz do microfone
                    </span>
                  </div>

                  {/* Voice Dictation Button & Status */}
                  <div className="flex items-center gap-2">
                    {isRecording ? (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 rounded-xl px-3 py-1.5 shadow-xs">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                        </span>

                        <span className="text-xs font-bold text-rose-900 tabular-nums">
                          {formatDuration(recordingDuration)}
                        </span>

                        {/* Audio visualizer wave bars */}
                        <div className="flex items-center gap-0.5 h-4 px-1" title="Nível do microfone">
                          {[0.35, 0.7, 1.0, 0.65, 0.4].map((mult, i) => {
                            const barHeight = Math.max(3, Math.min(16, (audioLevel * mult) / 3.5));
                            return (
                              <span
                                key={i}
                                className="w-1 bg-rose-600 rounded-full transition-all duration-75"
                                style={{ height: `${barHeight}px` }}
                              />
                            );
                          })}
                        </div>

                        <button
                          id="btn-parar-gravacao-voz"
                          type="button"
                          onClick={stopRecording}
                          className="inline-flex items-center gap-1 ml-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-900 hover:bg-rose-950 text-white shadow-xs transition cursor-pointer"
                          title="Finalizar gravação de voz"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          Parar
                        </button>
                      </div>
                    ) : (
                      <button
                        id="btn-iniciar-gravacao-voz"
                        type="button"
                        onClick={startRecording}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 shadow-xs transition cursor-pointer group"
                        title={
                          isSpeechSupported
                            ? 'Gravar anotações por voz usando o microfone do navegador'
                            : 'O navegador pode exigir permissão de microfone'
                        }
                      >
                        <Mic className="w-3.5 h-3.5 text-rose-700 group-hover:scale-110 transition-transform" />
                        <span>Gravar por Voz</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Banner if any */}
                {recordingError && (
                  <div
                    id="banner-erro-gravacao"
                    className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <div className="flex-1">
                      <p className="font-medium">{recordingError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRecordingError(null)}
                      className="text-amber-600 hover:text-amber-900 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Interim Live Transcript Feedback Bubble */}
                {isRecording && (
                  <div
                    id="feedback-transcricao-ao-vivo"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50/80 border border-rose-200/80 text-xs text-rose-950"
                  >
                    <Volume2 className="w-4 h-4 shrink-0 text-rose-600 animate-pulse" />
                    <span className="font-semibold text-rose-900">Ouvindo:</span>
                    <span className="italic truncate flex-1">
                      {interimTranscript ? `"${interimTranscript}"` : 'Fale agora com o microfone...'}
                    </span>
                  </div>
                )}

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    id="textarea-impressao-final"
                    rows={4}
                    value={formData.conclusao.impressaoFinal}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdate('conclusao', 'impressaoFinal', e.target.value)}
                    placeholder="Ex: Vinho jovem e versátil feito por uma das maiores vinícolas de Mendoza. Vinho Reserva que agrada a todos... (Ou use o botão 'Gravar por Voz' acima para ditar)"
                    className={`w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm leading-relaxed font-serif text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800 transition ${
                      isRecording ? 'ring-2 ring-rose-300/50' : ''
                    }`}
                  />
                  {formData.conclusao.impressaoFinal && (
                    <div className="flex justify-between items-center px-1 pt-1 text-[11px] text-stone-400">
                      <span>{formData.conclusao.impressaoFinal.length} caracteres transcritos/digitados</span>
                      <button
                        type="button"
                        onClick={() => handleUpdate('conclusao', 'impressaoFinal', '')}
                        className="text-stone-400 hover:text-stone-700 underline text-[11px] cursor-pointer"
                      >
                        Limpar texto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Bottom Controls */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <div className="flex gap-2">
              {activeTab !== 'geral' && (
                <button
                  type="button"
                  onClick={() => {
                    const order: ('geral' | 'visual' | 'olfato' | 'paladar' | 'conclusao')[] = [
                      'geral',
                      'visual',
                      'olfato',
                      'paladar',
                      'conclusao',
                    ];
                    const idx = order.indexOf(activeTab);
                    if (idx > 0) setActiveTab(order[idx - 1]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer"
                >
                  ← Anterior
                </button>
              )}
              {activeTab !== 'conclusao' && (
                <button
                  type="button"
                  onClick={() => {
                    const order: ('geral' | 'visual' | 'olfato' | 'paladar' | 'conclusao')[] = [
                      'geral',
                      'visual',
                      'olfato',
                      'paladar',
                      'conclusao',
                    ];
                    const idx = order.indexOf(activeTab);
                    if (idx < order.length - 1) setActiveTab(order[idx + 1]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer"
                >
                  Próximo →
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-salvar-ficha"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-sm font-semibold shadow-xs hover:shadow transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Ficha</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
