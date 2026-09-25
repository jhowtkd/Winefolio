import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  WineEntry,
  EntryDraft,
  WineType,
  WineStyle,
  PhotoChange,
  SheetLevel,
} from '../../domain/wine-entry';
import { createEntry } from '../../domain/wine-factory';
import { COUNTRIES, inferCountryCode } from '../../domain/countries';
import { applyLabelAnalysis, settleAiProvenance } from '../../domain/label-fill';
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
  CORE_COLOURS,
  WINE_STYLES,
  WINE_TYPES,
} from '../../domain/asi-vocabulary';
import { AROMA_GROUPS, aromaGroupOf } from '../../domain/aroma-catalog';
import {
  ASI_FIELDS,
  hasAnyContent,
  isFilled,
  isSectionVisible,
  setPath,
  SHEET_SECTIONS,
  withStyle,
  withType,
  type AsiFieldDef,
  type SheetSection,
} from '../../domain/asi-fields';
import { chipClass, FieldTitle, LegacyNote, SectionFields } from './AsiFields';
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
  aiConsented: boolean;
  onGrantAiConsent: () => Promise<void>;
  /** Nível padrão da ficha, escolhido em Ajustes. */
  sheetLevel?: SheetLevel;
}

type TabKey = SheetSection;

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
  aiConsented,
  onGrantAiConsent,
  sheetLevel = 'iniciante',
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
      newOne.skinContact = fromTemplate.skinContact ?? false;
      newOne.subestilo = fromTemplate.subestilo ?? null;
      newOne.tags = fromTemplate.tags ? [...fromTemplate.tags] : [];
    }

    return newOne;
  });

  // Estado da ficha na última vez que a IA a preencheu (ou ao abrir).
  // Campo sugerido pela IA que a pessoa mudou depois disso passa a ser dela.
  const aiSnapshot = useRef<WineEntry>(formData);
  const [pendingAiPhoto, setPendingAiPhoto] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('geral');
  // "Mostrar grade completa" vale só para esta ficha. O padrão vem de Ajustes.
  const [showFullGrid, setShowFullGrid] = useState(false);
  const [showAllAromaGroups, setShowAllAromaGroups] = useState(false);
  const advanced = sheetLevel === 'avancado' || showFullGrid;
  // Campo que teve valor nesta edição continua à vista depois de limpo: no Iniciante,
  // desmarcar um valor avançado não pode sumir com o campo nem com a aba.
  const touchedFields = useRef(new Set<string>());
  for (const field of ASI_FIELDS) {
    if (isFilled(formData, field.path)) touchedFields.current.add(field.path);
  }
  const tabs = SHEET_SECTIONS.filter((section) =>
    isSectionVisible(formData, section.key, advanced, touchedFields.current)
  );
  const tabIndex = tabs.findIndex((tab) => tab.key === activeTab);
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
      aiSnapshot.current = existingDraft.entry;
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
      if (hasAnyContent(formData)) {
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

  // Análise IA de Rótulo. Sem consentimento, a foto espera a resposta da pessoa.
  const handleAnalyzeLabel = (photoDataUrl: string) => {
    if (!aiConsented) {
      setPendingAiPhoto(photoDataUrl);
      return;
    }
    void runLabelAnalysis(photoDataUrl);
  };

  const acceptAiConsent = async () => {
    const photo = pendingAiPhoto;
    setPendingAiPhoto(null);
    try {
      await onGrantAiConsent();
    } catch {
      showToast('Não foi possível guardar a sua escolha.', 'error');
      return;
    }
    if (photo) void runLabelAnalysis(photo);
  };

  const runLabelAnalysis = async (photoDataUrl: string) => {
    setIsAnalyzing(true);
    showToast('Analisando rótulo com sommelier digital...', 'info');
    try {
      const result = await analyzeWineLabelPhoto(photoDataUrl);
      if (result) {
        setFormData((prev) => {
          const next = applyLabelAnalysis(prev, result);
          aiSnapshot.current = next;
          return next;
        });
        showToast('Campos sugeridos pela IA. Revise antes de salvar.', 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'Não foi possível ler as informações do rótulo.', 'warn');
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
        settleAiProvenance(formData, aiSnapshot.current),
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

  // Se a aba aberta sumiu (a pessoa voltou à ficha essencial), volta para a primeira.
  useEffect(() => {
    if (tabIndex === -1) setActiveTab('geral');
  }, [tabIndex]);

  const LABEL = 'block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1';

  /** Cor oficial da ASI. Sem estilo escolhido, a cor define o estilo. */
  const renderColour = (field: AsiFieldDef) => {
    const styles: WineStyle[] = formData.estilo ? [formData.estilo] : ['branco', 'rose', 'tinto'];
    return (
      <fieldset>
        <legend className={LABEL}>
          <FieldTitle pt={field.pt} en={field.en} />
        </legend>
        <div className="space-y-2">
          {styles.map((style) => (
            <div key={style}>
              {!formData.estilo && (
                <span className="text-[10px] font-mono-code uppercase text-[#6b6458] dark:text-[#9e9687]">
                  {WINE_STYLES.find((s) => s.code === style)?.pt}
                </span>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CORE_COLOURS[style].map((colour) => {
                  const selected = formData.visual.coreColour === colour.code && (formData.estilo ?? style) === style;
                  return (
                    <button
                      key={colour.code}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setFormData((prev) => {
                          if (selected) {
                            // O hex veio desta cor; sem ela, a taça e o radar voltam ao padrão.
                            const cleared = setPath(prev, 'visual.coreColour', null);
                            const corHex = prev.visual.corHex === colour.hex ? undefined : prev.visual.corHex;
                            return { ...cleared, visual: { ...cleared.visual, corHex } };
                          }
                          const next = setPath(prev, 'visual.coreColour', colour.code);
                          return {
                            ...next,
                            estilo: prev.estilo ?? style,
                            visual: { ...next.visual, corHex: colour.hex },
                          };
                        })
                      }
                      className={`p-2 rounded-xs border text-left flex items-center gap-2 transition-all ${
                        selected
                          ? 'border-[#793b46] ring-1 ring-[#793b46] bg-[#f2ecdf] dark:bg-[#2f2a23]'
                          : 'border-[#cfc4b0]/70 dark:border-[#3d362b] hover:bg-[#fffaf0] dark:hover:bg-[#25221d]'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: colour.hex }}
                      />
                      <span className="text-xs leading-tight min-w-0">
                        {colour.pt}
                        {colour.en !== colour.pt && <span className="opacity-70"> · {colour.en}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <LegacyNote text={formData.legacyNotes?.['visual.coreColour']} />
      </fieldset>
    );
  };

  /** Descritores agrupados pelos grupos aromáticos da ASI, mais o descritor livre. */
  const renderAromas = (field: AsiFieldDef) => {
    const groups = advanced || showAllAromaGroups ? AROMA_GROUPS : AROMA_GROUPS.filter((g) => g.common);
    const selected = formData.aromaTags ?? [];
    return (
      <fieldset className="space-y-3">
        <legend className={LABEL}>
          <FieldTitle pt={field.pt} en={field.en} />
        </legend>
        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.code} className="space-y-1">
              <span className="text-[10px] font-mono-code uppercase text-[#6b6458] dark:text-[#9e9687]">
                {group.pt}
                {group.en !== group.pt && ` · ${group.en}`}
              </span>
              <div className="flex flex-wrap gap-1">
                {group.descriptors.map((aroma) => {
                  const isSelected = selected.includes(aroma);
                  return (
                    <button
                      key={aroma}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => (isSelected ? handleRemoveAroma(aroma) : handleAddAroma(aroma))}
                      className={chipClass(isSelected)}
                    >
                      {aroma}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {!advanced && (
          <button type="button" className="text-btn text-xs" onClick={() => setShowAllAromaGroups((v) => !v)}>
            {showAllAromaGroups ? 'Menos grupos' : 'Mais grupos aromáticos'}
          </button>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={aromaTagInput}
            aria-label="Outro aroma"
            onChange={(e) => setAromaTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAroma(aromaTagInput);
                setAromaTagInput('');
              }
            }}
            placeholder="Outro aroma (Enter para incluir)"
            className="flex-1 px-3 py-1.5 text-xs rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db]"
          />
        </div>
        {selected.some((aroma) => !aromaGroupOf(aroma)) && (
          <div className="flex flex-wrap gap-1">
            {selected
              .filter((aroma) => !aromaGroupOf(aroma))
              .map((aroma) => (
                <button
                  key={aroma}
                  type="button"
                  aria-pressed
                  aria-label={`Remover ${aroma}`}
                  onClick={() => handleRemoveAroma(aroma)}
                  className={chipClass(true)}
                >
                  {aroma} &times;
                </button>
              ))}
          </div>
        )}
      </fieldset>
    );
  };

  const renderStars = (field: AsiFieldDef) => (
    <fieldset>
      <legend className={LABEL}>{field.pt}</legend>
      <div className="flex items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} de 5 estrelas`}
            aria-pressed={formData.conclusao?.avaliacaoEstrelas === star}
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                conclusao: { ...prev.conclusao, avaliacaoEstrelas: star as 1 | 2 | 3 | 4 | 5 },
              }))
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
      <p className="text-[11px] text-[#6b6458] dark:text-[#9e9687] mt-1">
        O seu gosto. A qualidade técnica da ASI fica à parte, na grade completa.
      </p>
    </fieldset>
  );

  const renderImpression = (field: AsiFieldDef) => (
    <div>
      <label
        htmlFor="impressao-final"
        className="flex items-center justify-between text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1"
      >
        <span>{field.pt}</span>
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
            {dictation.listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        )}
      </label>
      <textarea
        id="impressao-final"
        rows={4}
        value={formData.conclusao?.impressaoFinal || ''}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, conclusao: { ...prev.conclusao, impressaoFinal: e.target.value } }))
        }
        placeholder="O que ficou na memória: equilíbrio, emoção, com quem foi..."
        className="w-full px-3 py-2 text-sm sm:text-base font-hand rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] leading-relaxed"
      />
      {dictation.interim && (
        <p className="mt-1 text-xs italic text-[#6b6458] dark:text-[#9e9687]">{dictation.interim}</p>
      )}
      {dictation.error && <p className="mt-1 text-xs text-[#793b46] dark:text-[#b05e6e]">{dictation.error}</p>}
    </div>
  );

  const renderCustomField = (field: AsiFieldDef): React.ReactNode | undefined => {
    if (field.kind === 'colour') return renderColour(field);
    if (field.kind === 'aromas') return renderAromas(field);
    if (field.kind === 'stars') return renderStars(field);
    if (field.path === 'conclusao.impressaoFinal') return renderImpression(field);
    return undefined;
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

        {/* Nível da ficha: o Iniciante mostra só o essencial da grade ASI */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-[#6b6458] dark:text-[#9e9687]">
            {advanced
              ? 'Grade ASI completa.'
              : 'Ficha essencial: cor, aromas, doçura, corpo e nota.'}
          </p>
          {sheetLevel !== 'avancado' && (
            <button
              type="button"
              aria-pressed={showFullGrid}
              onClick={() => setShowFullGrid((v) => !v)}
              className="text-btn"
            >
              {showFullGrid ? 'Voltar à ficha essencial' : 'Mostrar grade completa'}
            </button>
          )}
        </div>

        {/* Abas das Etapas da Ficha */}
        <div
          role="tablist"
          aria-label="Etapas da ficha"
          className="flex items-center gap-1 border-b border-[#cfc4b0]/70 dark:border-[#3d362b] overflow-x-auto pb-px text-xs"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-3.5 border-b-2 font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'border-[#793b46] text-[#793b46] dark:text-[#b05e6e] font-bold'
                  : 'border-transparent text-[#6b6458] dark:text-[#9e9687] hover:text-[#312d26] dark:hover:text-[#eee7db]'
              }`}
            >
              {index + 1}. {tab.pt}
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
                    <label htmlFor="entry-tipo" className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Tipo
                    </label>
                    <select
                      id="entry-tipo"
                      value={formData.tipo ?? ''}
                      onChange={(e) => {
                        const tipo = (e.target.value as WineType) || null;
                        setFormData((prev) => withType(prev, tipo));
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db]"
                    >
                      <option value="">Não informado</option>
                      {WINE_TYPES.map((type) => (
                        <option key={type.code} value={type.code}>
                          {type.pt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="entry-estilo" className="block text-xs font-semibold text-[#312d26] dark:text-[#eee7db] mb-1">
                      Cor principal
                    </label>
                    <select
                      id="entry-estilo"
                      value={formData.estilo ?? ''}
                      onChange={(e) => {
                        const estilo = (e.target.value as WineStyle) || null;
                        setFormData((prev) => withStyle(prev, estilo));
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db]"
                    >
                      <option value="">Não informada</option>
                      {WINE_STYLES.map((style) => (
                        <option key={style.code} value={style.code}>
                          {style.pt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <SectionFields
                  section="geral"
                  entry={formData}
                  advanced={advanced}
                  keep={touchedFields.current}
                  onChange={setFormData}
                />

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

          {/* Abas 2 a 6: a grade ASI, desenhada pelo registro de campos */}
          {activeTab !== 'geral' && (
            <SectionFields
              section={activeTab}
              entry={formData}
              advanced={advanced}
              keep={touchedFields.current}
              onChange={setFormData}
              renderCustom={renderCustomField}
            />
          )}

          {/* Botões de Navegação Entre Abas e Conclusão */}
          <div className="pt-4 border-t border-[#cfc4b0]/70 dark:border-[#3d362b] flex items-center justify-between">
            <div>
              {activeTab !== 'geral' && (
                <PaperButton
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    if (tabIndex > 0) setActiveTab(tabs[tabIndex - 1].key);
                  }}
                  className="!py-1.5 !px-3 text-xs"
                >
                  &larr; Etapa Anterior
                </PaperButton>
              )}
            </div>

            <div className="flex items-center gap-2">
              {tabIndex < tabs.length - 1 ? (
                <PaperButton
                  variant="secondary"
                  type="button"
                  onClick={() => setActiveTab(tabs[tabIndex + 1].key)}
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

      {pendingAiPhoto && (
        <ModalDialog
          label="Winefolio / leitura de rótulo"
          closeLabel="Fechar sem enviar"
          onClose={() => setPendingAiPhoto(null)}
          ariaLabelledBy="ai-consent-title"
          footer={
            <div className="actions">
              <button type="button" className="btn btn-secondary" onClick={() => setPendingAiPhoto(null)}>
                Só guardar a foto
              </button>
              <button type="button" className="btn btn-primary" onClick={acceptAiConsent}>
                Enviar e ler
              </button>
            </div>
          }
        >
          <h2 id="ai-consent-title" className="font-serif text-2xl mb-3">
            Ler o rótulo com IA?
          </h2>
          <p className="text-sm leading-relaxed">
            Para ler o rótulo, a foto é enviada ao Google Gemini. O Winefolio não guarda a foto no
            servidor. Os campos preenchidos ficam marcados como sugestão até você revisar.
          </p>
          <p className="text-xs mt-3 text-[#6b6458]">Você pode revogar isso em Opções.</p>
        </ModalDialog>
      )}
    </ModalDialog>
  );
};
