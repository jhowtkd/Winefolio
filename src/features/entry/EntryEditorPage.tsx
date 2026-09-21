import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  WineEntry,
  EntryDraft,
  WineType,
  WineStyle,
  PhotoChange,
} from '../../domain/wine-entry';
import { createEntry } from '../../domain/wine-factory';
import { COUNTRIES, inferCountryCode } from '../../domain/countries';
import { applyLabelAnalysis } from '../../domain/label-fill';
import { appendDictation } from '../../domain/dictation';
import { useSpeechDictation } from './useSpeechDictation';
import { PaperSurface } from '../../components/ui/PaperSurface';
import { PaperButton } from '../../components/ui/PaperButton';
import { InkStamp } from '../../components/ui/InkStamp';
import { ModalDialog } from '../../components/proto/ModalDialog';
import { Icon, Doodle } from '../../components/proto/Sprite';
import { LabelPhotoCapture } from '../../components/LabelPhotoCapture';
import { analyzeWineLabelPhoto } from '../../services/wineOcrService';
import { dataUrlToBlob } from '../../utils/imageUtils';
import { usePhotoUrl } from '../journal/usePhotoUrl';
import {
  WINE_COLORS,
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
  AROMA_CATEGORIES,
} from '../../data/sommelierData';
import {
  Save,
  ArrowLeft,
  Sparkles,
  Camera,
  Star,
  Check,
  AlertCircle,
  Tag,
  Mic,
  MicOff,
  Trash2,
  Clock,
} from 'lucide-react';

interface EntryEditorPageProps {
  initialEntry?: WineEntry | null;
  fromTemplate?: WineEntry | null;
  existingDraft?: EntryDraft | null;
  readPhoto: (id: string) => Promise<Blob | undefined>;
  onCommit: (
    entry: WineEntry,
    photo: PhotoChange,
    expectedRevision: number | null,
    clearDraft: boolean
  ) => Promise<WineEntry>;
  onSaveDraft: (draft: EntryDraft, photo: PhotoChange) => Promise<void>;
  onDiscardDraft: () => Promise<void>;
  onNavigate: (hash: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

type TabKey = 'geral' | 'visual' | 'olfato' | 'paladar' | 'conclusao';

export const EntryEditorPage: React.FC<EntryEditorPageProps> = ({
  initialEntry,
  fromTemplate,
  existingDraft,
  readPhoto,
  onCommit,
  onSaveDraft,
  onDiscardDraft,
  onNavigate,
  showToast,
}) => {
  const isEditingExisting = Boolean(initialEntry);

  // Inicialização da Ficha (seja edição, template, rascunho ou nova em branco)
  const [formData, setFormData] = useState<WineEntry>(() => {
    if (initialEntry) return { ...initialEntry };

    const newOne = createEntry(`wine-${Date.now()}`);

    if (fromTemplate) {
      newOne.produtor = fromTemplate.produtor;
      newOne.vinho = fromTemplate.vinho;
      newOne.uvas = fromTemplate.uvas;
      newOne.regiaoPais = fromTemplate.regiaoPais;
      newOne.origin = fromTemplate.origin ? { ...fromTemplate.origin } : undefined;
      newOne.tipo = fromTemplate.tipo;
      newOne.estilo = fromTemplate.estilo;
      newOne.tags = fromTemplate.tags ? [...fromTemplate.tags] : [];
    }

    return newOne;
  });

  const [activeTab, setActiveTab] = useState<TabKey>('geral');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [aromaTagInput, setAromaTagInput] = useState('');
  const [draftStatus, setDraftStatus] = useState<string>('');

  // Gerenciamento de foto
  const existingPhotoUrl = usePhotoUrl(formData.photoId, readPhoto);
  const [currentPhotoPreview, setCurrentPhotoPreview] = useState<string | null>(null);
  const [photoChange, setPhotoChange] = useState<PhotoChange>({ kind: 'keep' });

  const dictation = useSpeechDictation((chunk) =>
    setFormData((prev) => ({
      ...prev,
      conclusao: {
        ...prev.conclusao!,
        impressaoFinal: appendDictation(prev.conclusao?.impressaoFinal || '', chunk),
      },
    }))
  );

  // Sincroniza preview inicial se não houver foto nova selecionada
  useEffect(() => {
    if (existingPhotoUrl && photoChange.kind === 'keep') {
      setCurrentPhotoPreview(existingPhotoUrl);
    }
  }, [existingPhotoUrl, photoChange]);

  // Se houver um rascunho salvo para novas fichas
  const [showDraftBanner, setShowDraftBanner] = useState<boolean>(
    !isEditingExisting && Boolean(existingDraft) && !fromTemplate
  );

  const applyDraft = () => {
    if (existingDraft) {
      setFormData(existingDraft.entry);
      setShowDraftBanner(false);
      showToast('Rascunho recuperado com sucesso!', 'info');
    }
  };

  const discardCurrentDraft = async () => {
    await onDiscardDraft();
    setShowDraftBanner(false);
  };

  // Auto-save de rascunho com debounce para novas fichas
  useEffect(() => {
    if (isEditingExisting) return; // Não sobrescreve rascunho de novas fichas com edições existentes

    const timer = setTimeout(async () => {
      // Salva rascunho apenas se houver algum conteúdo preenchido
      if (formData.produtor || formData.vinho || formData.uvas || formData.olfato?.aromas) {
        setDraftStatus('Salvando rascunho...');
        try {
          const draft: EntryDraft = {
            id: 'active',
            entry: formData,
            editingId: null,
            baseRevision: null,
            updatedAt: Date.now(),
            photoBlob: photoChange.kind === 'replace' ? photoChange.blob : undefined,
          };
          await onSaveDraft(draft, photoChange);
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setDraftStatus(`Rascunho salvo às ${nowStr}`);
        } catch {
          setDraftStatus('');
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData, photoChange, isEditingExisting, onSaveDraft]);

  // Mudança de Foto
  const handlePhotoSelect = async (dataUrl: string) => {
    setCurrentPhotoPreview(dataUrl);
    try {
      const blob = await dataUrlToBlob(dataUrl);
      setPhotoChange({ kind: 'replace', blob });
    } catch {
      showToast('Não foi possível processar a imagem.', 'error');
    }
  };

  const handlePhotoRemove = () => {
    setCurrentPhotoPreview(null);
    setPhotoChange({ kind: 'remove' });
    setFormData((prev) => ({ ...prev, photoId: null }));
  };

  // Análise IA de Rótulo
  const handleAnalyzeLabel = async (photoDataUrl: string) => {
    setIsAnalyzing(true);
    showToast('Analisando rótulo com sommelier digital...', 'info');
    try {
      const result = await analyzeWineLabelPhoto(photoDataUrl);
      if (result) {
        setFormData((prev) => applyLabelAnalysis(prev, result));
        showToast('Campos do rótulo identificados e preenchidos!', 'success');
      }
    } catch (err: any) {
      showToast('Não foi possível analisar o rótulo: ' + err.message, 'warn');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Salvar ficha definitiva
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vinho && !formData.produtor) {
      showToast('Por favor, informe ao menos o nome do Vinho ou do Produtor.', 'warn');
      setActiveTab('geral');
      return;
    }

    try {
      setIsSaving(true);
      const saved = await onCommit(
        formData,
        photoChange,
        isEditingExisting ? initialEntry!.revision : null,
        !isEditingExisting // Limpa rascunho se era nova ficha
      );
      onNavigate(`#/ficha/${saved.id}`);
    } catch (err: any) {
      showToast('Erro ao salvar: ' + (err.message || 'Falha de concorrência'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const closeDialog = () =>
    onNavigate(isEditingExisting ? `#/ficha/${initialEntry!.id}` : '#/caderno');

  const saveDraftNow = async () => {
    if (isEditingExisting) return;
    setDraftStatus('Salvando rascunho...');
    try {
      const draft: EntryDraft = {
        id: 'active',
        entry: formData,
        editingId: null,
        baseRevision: null,
        updatedAt: Date.now(),
        photoBlob: photoChange.kind === 'replace' ? photoChange.blob : undefined,
      };
      await onSaveDraft(draft, photoChange);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDraftStatus(`Rascunho salvo às ${nowStr}`);
      showToast('Rascunho guardado neste navegador.', 'success');
    } catch {
      setDraftStatus('');
    }
  };

  // Adição de Tags
  const handleAddTag = () => {
    const clean = tagInput.trim();
    if (clean && !formData.tags?.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), clean],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }));
  };

  const handleAddAroma = (aroma: string) => {
    const clean = aroma.trim();
    if (clean && !formData.aromaTags?.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        aromaTags: [...(prev.aromaTags || []), clean],
      }));
    }
  };

  const handleRemoveAroma = (aroma: string) => {
    setFormData((prev) => ({
      ...prev,
      aromaTags: (prev.aromaTags || []).filter((a) => a !== aroma),
    }));
  };

  return (
    <ModalDialog
      label={isEditingExisting ? 'Winefolio / editar página' : 'Winefolio / uma nova página'}
      closeLabel={isEditingExisting ? 'Fechar edição' : 'Fechar registro'}
      onClose={closeDialog}
      ariaLabelledBy="entry-title"
      footer={
        <>
          <small>
            {draftStatus || (
              <>
                Uma memória sua.
                <br />
                Guardada só neste navegador.
              </>
            )}
          </small>
          <div className="actions">
            {!isEditingExisting && (
              <button type="button" className="text-btn" onClick={saveDraftNow}>
                Guardar rascunho
              </button>
            )}
            <button
              type="submit"
              form="entry-editor-form"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving
                ? 'Guardando...'
                : isEditingExisting
                  ? 'Guardar alterações'
                  : 'Guardar no caderno'}{' '}
              <Icon name="check" />
            </button>
          </div>
        </>
      }
    >
      {/* Banner de Rascunho Não Finalizado */}
      {showDraftBanner && existingDraft && (
        <div className="p-4 rounded-xs border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              Você possui um rascunho anterior salvo em{' '}
              <strong>{new Date(existingDraft.updatedAt).toLocaleDateString()}</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PaperButton variant="primary" onClick={applyDraft} className="!py-1 !px-2.5 text-xs">
              Continuar rascunho
            </PaperButton>
            <PaperButton
              variant="quiet"
              onClick={discardCurrentDraft}
              className="!py-1 !px-2.5 text-xs text-stone-600"
            >
              Descartar
            </PaperButton>
          </div>
        </div>
      )}

      <div className="entry-heading">
        <div>
          <h2 id="entry-title">
            {isEditingExisting ? 'Revisitar esta memória?' : 'O que ficou na memória?'}
          </h2>
          <p>
            Uma anotação já é um bom começo. O resto pode esperar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={formData.favorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
            aria-pressed={Boolean(formData.favorite)}
            onClick={() => setFormData((p) => ({ ...p, favorite: !p.favorite }))}
            className={`p-1.5 rounded transition-colors ${
              formData.favorite
                ? 'text-[#793b46] bg-[#793b46]/10'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Star className={`w-5 h-5 ${formData.favorite ? 'fill-current' : ''}`} />
          </button>
          <Doodle name="cork" className="doodle" />
        </div>
      </div>

      {/* Papel Principal da Ficha de Registro */}
      <PaperSurface
        material="sheet"
        className="p-6 sm:p-8 border border-[#cfc4b0] dark:border-[#3d362b] rounded-xs shadow-md space-y-6"
      >

        {/* Abas das Etapas da Ficha */}
        <div className="flex items-center gap-1 border-b border-[#cfc4b0]/70 dark:border-[#3d362b] overflow-x-auto pb-px text-xs">
          {[
            { key: 'geral', label: '1. Geral & Rótulo' },
            { key: 'visual', label: '2. Visual' },
            { key: 'olfato', label: '3. Olfato' },
            { key: 'paladar', label: '4. Paladar' },
            { key: 'conclusao', label: '5. Conclusão' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`py-2 px-3.5 border-b-2 font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'border-[#793b46] text-[#793b46] dark:text-[#b05e6e] font-bold'
                  : 'border-transparent text-[#6b6458] dark:text-[#9e9687] hover:text-[#312d26] dark:hover:text-[#eee7db]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo da Aba Ativa */}
        <form id="entry-editor-form" onSubmit={handleSave} className="space-y-6">
          {/* ABA 1: GERAL & RÓTULO */}
          {activeTab === 'geral' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Captura de Foto do Rótulo */}
              <div className="md:col-span-5 space-y-4">
                <LabelPhotoCapture
                  currentPhoto={currentPhotoPreview || undefined}
                  onChangePhoto={handlePhotoSelect}
                  onRemovePhoto={handlePhotoRemove}
                  wineStyle={formData.estilo || 'tinto'}
                  onAnalyzeLabel={handleAnalyzeLabel}
                  isAnalyzing={isAnalyzing}
                />
              </div>

              {/* Campos Básicos */}
              <div className="md:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Produtor / Vinícola *
                    </label>
                    <input
                      type="text"
                      value={formData.produtor}
                      onChange={(e) => setFormData({ ...formData, produtor: e.target.value })}
                      placeholder="Ex: Catena Zapata, Concha y Toro"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] focus:ring-1 focus:ring-[#793b46]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Nome do Vinho / Rótulo *
                    </label>
                    <input
                      type="text"
                      value={formData.vinho}
                      onChange={(e) => setFormData({ ...formData, vinho: e.target.value })}
                      placeholder="Ex: Malbec Argentino, Don Melchor"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] focus:ring-1 focus:ring-[#793b46]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Safra (Ano)
                    </label>
                    <input
                      type="text"
                      value={formData.safra || ''}
                      onChange={(e) => setFormData({ ...formData, safra: e.target.value })}
                      placeholder="Ex: 2020 ou N/V"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] font-mono-code text-[#312d26] dark:text-[#eee7db]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tipo: e.target.value as WineType,
                          estilo: e.target.value === 'espumante' ? null : formData.estilo,
                        })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db]"
                    >
                      <option value="tranquilo">Tranquilo</option>
                      <option value="espumante">Espumante</option>
                      <option value="sobremesa">Sobremesa</option>
                      <option value="fortificado">Fortificado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Estilo
                    </label>
                    <select
                      value={formData.estilo || ''}
                      disabled={formData.tipo === 'espumante'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estilo: (e.target.value as WineStyle) || null,
                        })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] capitalize disabled:opacity-50"
                    >
                      <option value="tinto">Tinto</option>
                      <option value="branco">Branco</option>
                      <option value="rose">Rosé</option>
                      <option value="laranja">Laranja</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Uva(s) / Corte
                    </label>
                    <input
                      type="text"
                      value={formData.uvas || ''}
                      onChange={(e) => setFormData({ ...formData, uvas: e.target.value })}
                      placeholder="Ex: Cabernet Sauvignon (70%), Malbec (30%)"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Região / País
                    </label>
                    <input
                      type="text"
                      value={formData.regiaoPais || ''}
                      onChange={(e) => {
                        const countryCode =
                          inferCountryCode(e.target.value) ?? formData.origin?.countryCode ?? null;
                        setFormData({
                          ...formData,
                          regiaoPais: e.target.value,
                          origin: { countryCode, region: e.target.value },
                        });
                      }}
                      placeholder="Ex: Vale dos Vinhedos, Brasil"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      País
                    </label>
                    <select
                      value={formData.origin?.countryCode || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          origin: {
                            countryCode: e.target.value || null,
                            region: formData.origin?.region || formData.regiaoPais || '',
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                    >
                      <option value="">Sem país</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Data da Degustação
                    </label>
                    <input
                      type="date"
                      value={formData.dataDegustacao}
                      onChange={(e) => setFormData({ ...formData, dataDegustacao: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] font-mono-code text-[#312d26] dark:text-[#eee7db]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Ocasião / Companhia
                    </label>
                    <input
                      type="text"
                      value={formData.occasion || ''}
                      onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                      placeholder="Ex: Jantar de aniversário com amigos"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db]"
                    />
                  </div>
                </div>

                {/* Marcadores / Tags */}
                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Tags Personalizadas
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Adicionar tag e pressionar Enter (ex: Adega, Presente, Biodinâmico)"
                      className="flex-1 px-3 py-1.5 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db]"
                    />
                    <PaperButton
                      variant="secondary"
                      type="button"
                      onClick={handleAddTag}
                      className="!py-1.5 !px-3 text-xs"
                    >
                      Adicionar
                    </PaperButton>
                  </div>

                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {formData.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full text-xs bg-[#f2ecdf] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] border border-[#cfc4b0]/70 flex items-center gap-1"
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="text-stone-400 hover:text-red-700"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: VISUAL */}
          {activeTab === 'visual' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Limpidez
                  </label>
                  <select
                    value={formData.visual?.limpidez || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visual: { ...formData.visual!, limpidez: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {LIMPIDITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Intensidade
                  </label>
                  <select
                    value={formData.visual?.intensidade || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visual: { ...formData.visual!, intensidade: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {INTENSITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Transparência
                  </label>
                  <select
                    value={formData.visual?.transparencia || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visual: { ...formData.visual!, transparencia: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {TRANSPARENCY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tonalidades de Cor do Vinho */}
              <div>
                <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-2">
                  Cor do Núcleo e Reflexos
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {WINE_COLORS.map((col) => {
                    const isSelected = formData.visual?.corHex === col.hex;
                    return (
                      <button
                        key={col.label}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            visual: {
                              ...formData.visual!,
                              corNucleoBorda: col.label,
                              corHex: col.hex,
                            },
                          })
                        }
                        className={`p-2 rounded-xs border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-[#793b46] ring-1 ring-[#793b46] bg-[#f2ecdf]'
                            : 'border-[#cfc4b0]/70 hover:bg-[#fffaf0]'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="text-xs truncate">{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.tipo === 'espumante' && (
                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Perlage (Bolhas)
                  </label>
                  <input
                    type="text"
                    value={formData.visual?.perlage || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visual: { ...formData.visual!, perlage: e.target.value },
                      })
                    }
                    placeholder="Ex: Fina, abundante, persistente"
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  />
                </div>
              )}
            </div>
          )}

          {/* ABA 3: OLFATO */}
          {activeTab === 'olfato' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Condição Olfativa
                  </label>
                  <select
                    value={formData.olfato?.condicao || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        olfato: { ...formData.olfato!, condicao: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {CONDITION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Intensidade Olfativa
                  </label>
                  <select
                    value={formData.olfato?.intensidade || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        olfato: { ...formData.olfato!, intensidade: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {INTENSITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Evolução / Desenvolvimento
                  </label>
                  <select
                    value={formData.olfato?.desenvolvimento || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        olfato: { ...formData.olfato!, desenvolvimento: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {DEVELOPMENT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição dos Aromas */}
              <div>
                <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                  Notas Aromáticas Descritivas
                </label>
                <textarea
                  rows={3}
                  value={formData.olfato?.aromas || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      olfato: { ...formData.olfato!, aromas: e.target.value },
                    })
                  }
                  placeholder="Descreva as sensações no nariz (ex: frutas vermelhas frescas, framboesa, violeta, baunilha e toque mineral)..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                />
              </div>

              {/* Rápido Seletor de Aromas */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db]">
                  Aromas Frequentes (Clique para incluir):
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {AROMA_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <span className="text-[10px] font-mono-code uppercase text-[#6b6458] dark:text-[#9e9687]">
                        {cat.name}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cat.items.map((aroma) => {
                          const isSelected = formData.aromaTags?.includes(aroma);
                          return (
                            <button
                              key={aroma}
                              type="button"
                              onClick={() =>
                                isSelected ? handleRemoveAroma(aroma) : handleAddAroma(aroma)
                              }
                              className={`px-2 py-0.5 rounded-full text-[11px] transition-all ${
                                isSelected
                                  ? 'bg-[#793b46] text-[#fffaf0] font-medium'
                                  : 'bg-[#f2ecdf] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] hover:bg-[#eae1cd]'
                              }`}
                            >
                              {aroma}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: PALADAR */}
          {activeTab === 'paladar' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Doçura
                  </label>
                  <select
                    value={formData.paladar?.docura || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paladar: { ...formData.paladar!, docura: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {SWEETNESS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Acidez
                  </label>
                  <select
                    value={formData.paladar?.acidez || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paladar: { ...formData.paladar!, acidez: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {ACIDITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Taninos
                  </label>
                  <select
                    value={formData.paladar?.tanino || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paladar: { ...formData.paladar!, tanino: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {TANNIN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Corpo
                  </label>
                  <select
                    value={formData.paladar?.corpo || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paladar: { ...formData.paladar!, corpo: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {BODY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Teor Alcoólico
                  </label>
                  <input
                    type="text"
                    value={formData.paladar?.alcool || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paladar: { ...formData.paladar!, alcool: e.target.value },
                      })
                    }
                    placeholder="Ex: 13.5% ou Médio / Alto"
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Persistência
                  </label>
                  <select
                    value={formData.paladar?.persistencia || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paladar: { ...formData.paladar!, persistencia: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {PERSISTENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                  Sensações em Boca / Retrogosto
                </label>
                <textarea
                  rows={3}
                  value={formData.paladar?.aromasBoca || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paladar: { ...formData.paladar!, aromasBoca: e.target.value },
                    })
                  }
                  placeholder="Sabores na boca, textura, salinidade, final tostado ou frutado..."
                  className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                />
              </div>
            </div>
          )}

          {/* ABA 5: CONCLUSÃO */}
          {activeTab === 'conclusao' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Avaliação em Estrelas
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            conclusao: {
                              ...formData.conclusao!,
                              avaliacaoEstrelas: star,
                            },
                          })
                        }
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            (formData.conclusao?.avaliacaoEstrelas || 0) >= star
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-stone-300 dark:text-stone-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Nível de Qualidade
                  </label>
                  <select
                    value={formData.conclusao?.qualidade || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conclusao: { ...formData.conclusao!, qualidade: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {QUALITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                    Potencial de Guarda
                  </label>
                  <select
                    value={formData.conclusao?.guarda || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conclusao: { ...formData.conclusao!, guarda: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                  >
                    {AGING_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                  Harmonização Sugerida
                </label>
                <input
                  type="text"
                  value={formData.conclusao?.harmonizacao || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conclusao: { ...formData.conclusao!, harmonizacao: e.target.value },
                    })
                  }
                  placeholder="Ex: Queijo brie com mel, risoto de cogumelos, carnes grelhadas"
                  className="w-full px-3 py-2 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d]"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                  <span>Impressão Final do Sommelier (Manuscrito do Caderno)</span>
                  {dictation.supported && (
                    <button
                      type="button"
                      onClick={dictation.toggle}
                      aria-label="Ditar impressão final"
                      className={`p-1.5 rounded-xs border transition-colors ${
                        dictation.listening
                          ? 'border-[#793b46] bg-[#793b46] text-[#fffaf0]'
                          : 'border-[#cfc4b0] dark:border-[#3d362b] text-[#6b6458] dark:text-[#9e9687] hover:text-[#793b46]'
                      }`}
                    >
                      {dictation.listening ? (
                        <MicOff className="w-3.5 h-3.5" />
                      ) : (
                        <Mic className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </label>
                <textarea
                  rows={4}
                  value={formData.conclusao?.impressaoFinal || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conclusao: { ...formData.conclusao!, impressaoFinal: e.target.value },
                    })
                  }
                  placeholder="Sua memória afetiva, impressão geral do equilíbrio e emoção que o vinho transmitiu..."
                  className="w-full px-3 py-2 text-sm sm:text-base font-hand rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] leading-relaxed"
                />
                {dictation.interim && (
                  <p className="mt-1 text-xs italic text-[#6b6458] dark:text-[#9e9687]">
                    {dictation.interim}
                  </p>
                )}
                {dictation.error && (
                  <p className="mt-1 text-xs text-[#793b46] dark:text-[#b05e6e]">{dictation.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Botões de Navegação Entre Abas e Conclusão */}
          <div className="pt-4 border-t border-[#cfc4b0]/70 dark:border-[#3d362b] flex items-center justify-between">
            <div>
              {activeTab !== 'geral' && (
                <PaperButton
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    const tabs: TabKey[] = ['geral', 'visual', 'olfato', 'paladar', 'conclusao'];
                    const currIdx = tabs.indexOf(activeTab);
                    if (currIdx > 0) setActiveTab(tabs[currIdx - 1]);
                  }}
                  className="!py-1.5 !px-3 text-xs"
                >
                  &larr; Etapa Anterior
                </PaperButton>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeTab !== 'conclusao' ? (
                <PaperButton
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    const tabs: TabKey[] = ['geral', 'visual', 'olfato', 'paladar', 'conclusao'];
                    const currIdx = tabs.indexOf(activeTab);
                    if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1]);
                  }}
                  className="!py-1.5 !px-3 text-xs font-semibold"
                >
                  Próxima Etapa &rarr;
                </PaperButton>
              ) : (
                <PaperButton
                  variant="primary"
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="!py-2 !px-4 text-xs font-bold"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {isSaving ? 'Salvando...' : 'Finalizar Ficha'}
                </PaperButton>
              )}
            </div>
          </div>
        </form>
      </PaperSurface>
    </ModalDialog>
  );
};
