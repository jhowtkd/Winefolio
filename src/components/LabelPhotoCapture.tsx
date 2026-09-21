import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  X,
  Check,
  ZoomIn,
  AlertCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  ScanLine,
} from 'lucide-react';
import { compressImageFile, captureVideoFrame } from '../utils/imageUtils';

interface LabelPhotoCaptureProps {
  currentPhoto?: string;
  onChangePhoto: (photoDataUrl: string) => void;
  onRemovePhoto: () => void;
  wineStyle?: 'branco' | 'tinto' | 'rose';
  onAnalyzeLabel?: (photoDataUrl: string) => void;
  isAnalyzing?: boolean;
  autoOpenScanner?: boolean;
}

export const LabelPhotoCapture: React.FC<LabelPhotoCaptureProps> = ({
  currentPhoto,
  onChangePhoto,
  onRemovePhoto,
  wineStyle = 'tinto',
  onAnalyzeLabel,
  isAnalyzing = false,
  autoOpenScanner = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [autoAnalyzeAfterCapture, setAutoAnalyzeAfterCapture] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Auto open camera if requested on mount
  useEffect(() => {
    if (autoOpenScanner && !currentPhoto) {
      setShowCameraModal(true);
    }
  }, [autoOpenScanner, currentPhoto]);

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Close camera modal cleanly
  const handleCloseCameraModal = useCallback(() => {
    stopCamera();
    setShowCameraModal(false);
    setCameraError(null);
  }, [stopCamera]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start live camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setIsCameraStarting(true);
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada diretamente neste navegador.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraStarting(false);
    } catch (err: any) {
      console.warn('Direct camera stream error:', err);
      setIsCameraStarting(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permissão para câmera negada pelo navegador. Autorize o acesso à câmera para tirar foto ao vivo.');
      } else {
        setCameraError('Não foi possível iniciar o visor da câmera. Você pode usar a captura padrão do dispositivo.');
      }
    }
  }, [stopCamera]);

  // When camera modal opens or facing changes, start camera
  useEffect(() => {
    if (showCameraModal) {
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
  }, [showCameraModal, cameraFacing, startCamera, stopCamera]);

  // Capture still frame from live video
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    try {
      setFlashEffect(true);
      setTimeout(() => setFlashEffect(false), 200);

      const capturedDataUrl = captureVideoFrame(videoRef.current, {
        maxWidth: 900,
        maxHeight: 1200,
        quality: 0.84,
      });

      onChangePhoto(capturedDataUrl);
      handleCloseCameraModal();

      if (autoAnalyzeAfterCapture && onAnalyzeLabel) {
        onAnalyzeLabel(capturedDataUrl);
      }
    } catch (err) {
      console.error('Failed to capture frame:', err);
      setCameraError('Erro ao capturar foto. Tente novamente.');
    }
  };

  // Switch between front/back camera
  const handleToggleFacing = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Process selected file
  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const dataUrl = await compressImageFile(file, {
        maxWidth: 900,
        maxHeight: 1200,
        quality: 0.84,
      });
      onChangePhoto(dataUrl);

      if (autoAnalyzeAfterCapture && onAnalyzeLabel) {
        onAnalyzeLabel(dataUrl);
      }
    } catch (err: any) {
      console.error('Error compressing image:', err);
      setErrorMsg('Ocorreu um erro ao processar a foto. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="flex-1 font-medium">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-amber-500 hover:text-amber-800 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* State A: Photo is present */}
      {currentPhoto ? (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-stone-50/90 border border-stone-200">
          {/* Label Thumbnail with subtle bottle framing */}
          <div className="relative group shrink-0">
            <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden shadow-md border-2 border-white bg-stone-100 flex items-center justify-center">
              <img
                src={currentPhoto}
                alt="Rótulo da garrafa"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowZoomModal(true)}
              className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white transition-opacity cursor-pointer"
              title="Ver rótulo ampliado"
            >
              <ZoomIn className="w-6 h-6" />
            </button>
          </div>

          {/* Details & Actions */}
          <div className="flex-1 space-y-2.5 text-center sm:text-left">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-1">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Foto do Rótulo Salva
              </span>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                Esta foto será exibida como a miniatura oficial da garrafa na lista e na ficha de degustação.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {onAnalyzeLabel && (
                <button
                  type="button"
                  id="btn-ler-rotulo-ia-card"
                  onClick={() => onAnalyzeLabel(currentPhoto)}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-900 to-purple-900 hover:from-amber-700 hover:to-purple-950 text-white text-xs font-bold shadow-2xs hover:shadow transition cursor-pointer disabled:opacity-50"
                  title="Analisar foto com IA para ler produtor, safra, uvas e preencher a ficha"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Lendo Rótulo (IA)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ler Rótulo com IA</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                id="btn-abrir-camera-trocar"
                onClick={() => {
                  setAutoAnalyzeAfterCapture(false);
                  setShowCameraModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/90 dark:bg-[#232733] dark:hover:bg-[#2C3140] text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-stone-500" />
                <span>Tirar Nova Foto</span>
              </button>

              <button
                type="button"
                id="btn-upload-arquivo-trocar"
                onClick={() => {
                  setAutoAnalyzeAfterCapture(false);
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/90 dark:bg-[#232733] dark:hover:bg-[#2C3140] text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span>Substituir Arquivo</span>
              </button>

              <button
                type="button"
                id="btn-remover-foto-rotulo"
                onClick={onRemovePhoto}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-stone-400 hover:text-red-600 dark:text-stone-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition cursor-pointer"
                title="Remover foto do rótulo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* State B: No photo yet - Drag & drop zone with camera actions */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-6 transition-all text-center ${
            isDragOver
              ? 'border-rose-800 bg-rose-50/60 ring-2 ring-rose-200'
              : 'border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-[#1A1C23]/60 hover:bg-stone-50/80 dark:hover:bg-[#1A1C23]/90 hover:border-stone-400'
          }`}
        >
          {isProcessing || isAnalyzing ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-rose-800 animate-spin" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                {isAnalyzing ? 'Lendo rótulo e identificando dados técnicos com IA...' : 'Otimizando e preparando foto do rótulo...'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-100 via-amber-50 to-rose-50 dark:from-[#321623] dark:to-[#22171E] border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-900 dark:text-rose-300 shadow-2xs">
                <Camera className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200 font-serif-title flex items-center justify-center gap-1.5">
                  <span>Foto e Leitura Automática do Rótulo</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    IA Sommelier
                  </span>
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-0.5">
                  Tire uma foto do rótulo da garrafa para preencher automaticamente produtor, safra, uvas, região e estilo.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  id="btn-escanear-ler-rotulo"
                  onClick={() => {
                    setAutoAnalyzeAfterCapture(true);
                    setShowCameraModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-rose-900 to-purple-900 hover:from-amber-700 hover:to-purple-950 text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Escanear & Ler com Câmera (IA)</span>
                </button>

                <button
                  type="button"
                  id="btn-escolher-arquivo-rotulo"
                  onClick={() => {
                    setAutoAnalyzeAfterCapture(true);
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#232733] border border-stone-200 dark:border-[#282C38] hover:bg-stone-50 dark:hover:bg-[#2C3140] text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer shadow-2xs"
                  title="Carregar imagem do rótulo e ler com IA"
                >
                  <Upload className="w-4 h-4 text-stone-500" />
                  <span>Carregar Imagem (IA)</span>
                </button>
              </div>

              <span className="text-[11px] text-stone-400">
                Formatos aceitos: JPG, PNG, WEBP (ou arraste e solte o arquivo aqui)
              </span>
            </div>
          )}
        </div>
      )}

      {/* MODAL: LIVE CAMERA VIEWFINDER */}
      {showCameraModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-stone-950/85 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-stone-700 text-stone-100 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-fadeIn">
            {/* Camera Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-900/90">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-200 font-serif-title">
                  Câmera: Fotografia do Rótulo
                </span>
              </div>
              <button
                type="button"
                id="btn-fechar-camera"
                onClick={handleCloseCameraModal}
                className="p-1 text-stone-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Viewfinder Area */}
            <div className="relative aspect-[3/4] bg-black overflow-hidden flex items-center justify-center">
              {/* Shutter flash effect */}
              {flashEffect && (
                <div className="absolute inset-0 bg-white z-20 pointer-events-none animate-pulse" />
              )}

              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Wine Bottle / Label Guide Overlay Box */}
              <div className="absolute inset-x-8 inset-y-12 border-2 border-white/60 border-dashed rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-white rounded-tl"></span>
                  <span className="w-4 h-4 border-t-2 border-r-2 border-white rounded-tr"></span>
                </div>
                <div className="text-center">
                  <span className="bg-black/60 text-stone-200 text-[11px] px-2.5 py-1 rounded-full font-medium tracking-wide">
                    Enquadre o rótulo aqui
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-white rounded-bl"></span>
                  <span className="w-4 h-4 border-b-2 border-r-2 border-white rounded-br"></span>
                </div>
              </div>

              {/* Loading State */}
              {isCameraStarting && (
                <div className="absolute inset-0 bg-stone-950/80 flex flex-col items-center justify-center gap-2 z-10">
                  <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                  <span className="text-xs text-stone-300 font-medium">Iniciando câmera...</span>
                </div>
              )}

              {/* Error fallback */}
              {cameraError && (
                <div className="absolute inset-0 bg-stone-950/90 p-6 flex flex-col items-center justify-center text-center gap-3 z-10">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-xs text-stone-300 leading-relaxed">{cameraError}</p>
                  <div className="flex flex-col gap-2 w-full pt-2">
                    <button
                      type="button"
                      id="btn-fallback-camera-dispositivo"
                      onClick={() => {
                        handleCloseCameraModal();
                        mobileCameraInputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Abrir Câmera Nativa do Aparelho
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera(cameraFacing)}
                      className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls Footer */}
            <div className="px-4 py-2 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs">
              <button
                type="button"
                id="toggle-auto-analise-camera"
                onClick={() => setAutoAnalyzeAfterCapture(!autoAnalyzeAfterCapture)}
                className="inline-flex items-center gap-2 text-stone-300 hover:text-white transition cursor-pointer select-none"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    autoAnalyzeAfterCapture
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : 'border-stone-600 bg-stone-800'
                  }`}
                >
                  {autoAnalyzeAfterCapture && <Check className="w-3 h-3" />}
                </div>
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Preencher ficha com IA após capturar
                </span>
              </button>
              <span className="text-[11px] text-stone-400">
                {autoAnalyzeAfterCapture ? 'Leitura ativa' : 'Somente foto'}
              </span>
            </div>

            <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between">
              {/* Flip camera button */}
              <button
                type="button"
                id="btn-inverter-camera"
                onClick={handleToggleFacing}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                title="Inverter câmera (frontal / traseira)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Big Shutter Capture Button */}
              <button
                type="button"
                id="btn-disparar-foto"
                onClick={handleCapturePhoto}
                disabled={isCameraStarting || !!cameraError}
                className="relative group p-1 rounded-full border-4 border-white/80 hover:border-rose-500 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Capturar foto do rótulo"
              >
                <div className="w-14 h-14 rounded-full bg-white group-hover:bg-rose-500 group-active:scale-95 transition flex items-center justify-center">
                  <Camera className="w-6 h-6 text-stone-900 group-hover:text-white" />
                </div>
              </button>

              {/* Native mobile camera fallback button */}
              <button
                type="button"
                id="btn-camera-arquivo-modal"
                onClick={() => {
                  handleCloseCameraModal();
                  mobileCameraInputRef.current?.click();
                }}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer text-xs"
                title="Usar app de fotos nativo"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ZOOM PREVIEW */}
      {showZoomModal && currentPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-stone-950/85 backdrop-blur-sm p-4"
          onClick={() => setShowZoomModal(false)}
        >
          <div
            className="relative max-w-lg max-h-[85vh] bg-stone-900 border border-stone-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-900 border-b border-stone-800">
              <span className="text-xs font-bold text-stone-200">Foto do Rótulo</span>
              <button
                type="button"
                onClick={() => setShowZoomModal(false)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center overflow-auto bg-black/40">
              <img
                src={currentPhoto}
                alt="Rótulo ampliado"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
