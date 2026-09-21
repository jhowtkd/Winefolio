import React from 'react';
import { WineTastingSheet } from '../types';
import { WineGlassVisual } from './WineGlassVisual';
import { SensoryRadarChart } from './SensoryRadarChart';
import { Edit3, FileDown, Trash2, ArrowLeft, Star, Share2, Tag, Printer, Thermometer, Hourglass } from 'lucide-react';

interface TastingSheetViewProps {
  sheet: WineTastingSheet;
  onClose: () => void;
  onEdit: (sheet: WineTastingSheet) => void;
  onDelete: (id: string) => void;
}

/**
 * Returns dynamic color themes for the Tasting Sheet view based on the wine style:
 * - Branco: Greenish / emerald & sage tones (esverdeados)
 * - Tinto: Deep ruby / rose / bordeaux tones (avermelhados)
 * - Rosé: Salmon / pink tones (rosados)
 */
const getStyleTheme = (estilo: WineTastingSheet['estilo']) => {
  switch (estilo) {
    case 'branco':
      return {
        // Border & subtle background of the sheet paper replica
        cardBorder: 'border-emerald-300/80 dark:border-emerald-700/60 hover:border-emerald-400/90 dark:hover:border-emerald-600/70',
        cardBg: 'bg-[#FCFDFB] dark:bg-[#151C18]',
        cardShadow: 'shadow-sm shadow-emerald-950/5 dark:shadow-black/40',
        cardTopStripe: 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600',

        // Header accents
        accentBar: 'bg-emerald-700 dark:bg-emerald-500',
        sealBorder: 'border-emerald-800 dark:border-emerald-600',
        sealText: 'text-emerald-950 dark:text-emerald-200',
        sealBg: 'bg-emerald-50/80 dark:bg-[#122A1E]',
        sealStars: 'text-emerald-700 dark:text-emerald-400',
        badge: 'bg-emerald-50/90 dark:bg-[#163022] text-emerald-900 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-700/60',
        badgeDot: 'bg-emerald-600 dark:bg-emerald-400',

        // Action buttons
        pdfBtn: 'bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white',

        // Section headers
        sectionHeader: 'text-emerald-950 dark:text-emerald-200 bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-200/70 dark:border-emerald-800/60',

        // Tags & Radio selectors
        tagBadge: 'bg-emerald-50/90 dark:bg-[#163022] text-emerald-950 dark:text-emerald-200 border-emerald-200/90 dark:border-emerald-800/60',
        tagIcon: 'text-emerald-700 dark:text-emerald-400',
        radioActive: 'border-emerald-700 dark:border-emerald-500 bg-emerald-700 dark:bg-emerald-500 text-white',
        sideBoxBg: 'bg-emerald-50/40 dark:bg-[#132219]',
        sideBoxBorder: 'border-emerald-200/70 dark:border-emerald-800/50',

        // Wine glass graphic container
        glassBoxBg: 'bg-emerald-50/30 dark:bg-[#132219]',
        glassBoxBorder: 'border-emerald-200/70 dark:border-emerald-800/50',
      };
    case 'rose':
      return {
        // Border & subtle background of the sheet paper replica
        cardBorder: 'border-pink-300/80 dark:border-pink-800/60 hover:border-pink-400/90 dark:hover:border-pink-700/70',
        cardBg: 'bg-[#FDFBFC] dark:bg-[#1C151D]',
        cardShadow: 'shadow-sm shadow-pink-950/5 dark:shadow-black/40',
        cardTopStripe: 'bg-gradient-to-r from-pink-600 via-rose-400 to-pink-500',

        // Header accents
        accentBar: 'bg-pink-700 dark:bg-pink-500',
        sealBorder: 'border-pink-800 dark:border-pink-600',
        sealText: 'text-pink-950 dark:text-pink-200',
        sealBg: 'bg-pink-50/80 dark:bg-[#2A1426]',
        sealStars: 'text-pink-700 dark:text-pink-400',
        badge: 'bg-pink-50/90 dark:bg-[#32162E] text-pink-900 dark:text-pink-200 border-pink-300/80 dark:border-pink-800/60',
        badgeDot: 'bg-pink-600 dark:bg-pink-400',

        // Action buttons
        pdfBtn: 'bg-pink-800 hover:bg-pink-900 dark:bg-pink-700 dark:hover:bg-pink-600 text-white',

        // Section headers
        sectionHeader: 'text-pink-950 dark:text-pink-200 bg-pink-100/70 dark:bg-pink-950/70 border border-pink-200/70 dark:border-pink-800/60',

        // Tags & Radio selectors
        tagBadge: 'bg-pink-50/90 dark:bg-[#32162E] text-pink-950 dark:text-pink-200 border-pink-200/90 dark:border-pink-800/60',
        tagIcon: 'text-pink-700 dark:text-pink-400',
        radioActive: 'border-pink-700 dark:border-pink-500 bg-pink-700 dark:bg-pink-500 text-white',
        sideBoxBg: 'bg-pink-50/40 dark:bg-[#231420]',
        sideBoxBorder: 'border-pink-200/70 dark:border-pink-800/50',

        // Wine glass graphic container
        glassBoxBg: 'bg-pink-50/30 dark:bg-[#231420]',
        glassBoxBorder: 'border-pink-200/70 dark:border-pink-800/50',
      };
    case 'tinto':
    default:
      return {
        // Border & subtle background of the sheet paper replica
        cardBorder: 'border-rose-300/80 dark:border-[#7E1B2C]/70 hover:border-rose-400/90 dark:hover:border-[#962035]/80',
        cardBg: 'bg-[#FCFBF8] dark:bg-[#1A1619]',
        cardShadow: 'shadow-sm shadow-rose-950/5 dark:shadow-black/40',
        cardTopStripe: 'bg-gradient-to-r from-rose-900 via-rose-800 to-red-950',

        // Header accents
        accentBar: 'bg-rose-900 dark:bg-[#962035]',
        sealBorder: 'border-rose-900 dark:border-[#962035]',
        sealText: 'text-rose-950 dark:text-rose-200',
        sealBg: 'bg-rose-50/80 dark:bg-[#2A1118]',
        sealStars: 'text-rose-800 dark:text-rose-400',
        badge: 'bg-rose-50/90 dark:bg-[#34141B] text-rose-900 dark:text-rose-200 border-rose-300/80 dark:border-[#7E1B2C]/70',
        badgeDot: 'bg-rose-700 dark:bg-rose-400',

        // Action buttons
        pdfBtn: 'bg-rose-900 hover:bg-rose-950 dark:bg-[#7E1B2C] dark:hover:bg-[#962035] text-white',

        // Section headers
        sectionHeader: 'text-rose-950 dark:text-rose-200 bg-rose-100/70 dark:bg-[#34141B] border border-rose-200/70 dark:border-[#7E1B2C]/60',

        // Tags & Radio selectors
        tagBadge: 'bg-rose-50/90 dark:bg-[#34141B] text-rose-950 dark:text-rose-200 border-rose-200/90 dark:border-[#7E1B2C]/60',
        tagIcon: 'text-rose-800 dark:text-rose-400',
        radioActive: 'border-rose-900 dark:border-[#962035] bg-rose-900 dark:bg-[#962035] text-white',
        sideBoxBg: 'bg-rose-50/40 dark:bg-[#231317]',
        sideBoxBorder: 'border-rose-200/70 dark:border-[#7E1B2C]/40',

        // Wine glass graphic container
        glassBoxBg: 'bg-rose-50/30 dark:bg-[#231317]',
        glassBoxBorder: 'border-rose-200/70 dark:border-[#7E1B2C]/40',
      };
  }
};

export const TastingSheetView: React.FC<TastingSheetViewProps> = ({
  sheet,
  onClose,
  onEdit,
  onDelete,
}) => {
  const theme = getStyleTheme(sheet.estilo);
  const handleGeneratePdf = () => {
    const originalTitle = document.title;
    // Format sanitized file name for the browser's "Salvar como PDF" dialog
    const safeProdutor = (sheet.produtor || 'Vinho').replace(/[/\\?%*:|"<>]/g, '-').trim();
    const safeVinho = (sheet.vinho || '').replace(/[/\\?%*:|"<>]/g, '-').trim();
    const safeSafra = sheet.safra ? `-${sheet.safra}` : '';
    document.title = `Ficha-Degustacao-${safeProdutor}${safeVinho ? `-${safeVinho}` : ''}${safeSafra}`;

    window.print();

    // Restore title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  const handleShare = async () => {
    const shareText = `🍷 Ficha de Degustação:\n${sheet.produtor} - ${sheet.vinho} (${sheet.safra})\nUvas: ${sheet.uvas}\nRegião: ${sheet.regiaoPais}\nAvaliação: ${sheet.conclusao.qualidade} (${sheet.conclusao.avaliacaoEstrelas}★)\nNotas: ${sheet.conclusao.impressaoFinal}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Degustação: ${sheet.produtor} ${sheet.vinho}`,
          text: shareText,
        });
      } catch {
        // Ignored or cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Resumo da ficha copiado para a área de transferência!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fadeIn">
      {/* Top Action Bar (Hidden on print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 mb-6 bg-white/80 dark:bg-[#1A1C23]/90 backdrop-blur border border-stone-200/80 dark:border-[#282C38] rounded-2xl p-4 shadow-xs transition-colors">
        <button
          id="btn-voltar"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 dark:bg-[#232733] hover:bg-stone-200/80 dark:hover:bg-[#2D3241] text-sm font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar às Fichas</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="btn-compartilhar"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 dark:bg-[#232733] hover:bg-stone-200/80 dark:hover:bg-[#2D3241] text-sm font-medium transition cursor-pointer"
            title="Compartilhar resumo"
          >
            <Share2 className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>

          {/* Button: Gerar PDF da Ficha */}
          <button
            id="btn-gerar-pdf"
            onClick={handleGeneratePdf}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold shadow-xs hover:shadow transition cursor-pointer ${theme.pdfBtn}`}
            title="Gerar PDF da ficha formatada através das propriedades de impressão do navegador"
          >
            <FileDown className="w-4 h-4" />
            <span>Gerar PDF da Ficha</span>
          </button>

          <button
            id="btn-editar-ficha"
            onClick={() => onEdit(sheet)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-[#282C38] hover:bg-stone-100 dark:hover:bg-[#232733] text-sm font-medium transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <span className="hidden sm:inline">Editar</span>
          </button>

          <button
            id="btn-excluir-ficha"
            onClick={() => {
              if (window.confirm(`Tem certeza que deseja remover a ficha de "${sheet.produtor} - ${sheet.vinho}"?`)) {
                onDelete(sheet.id);
              }
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-red-600 dark:text-stone-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
            title="Excluir Ficha"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sommelier Tasting Sheet Paper Replica */}
      <div className={`relative ${theme.cardBg} border-2 ${theme.cardBorder} rounded-2xl p-6 sm:p-10 ${theme.cardShadow} transition-all duration-300 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white text-stone-900 dark:text-stone-100 overflow-hidden`}>
        {/* Subtle decorative top stripe indicating wine style */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.cardTopStripe} print:hidden`} />

        {/* Paper Header / Title Bar */}
        <div className="flex items-center justify-between border-b-2 border-stone-800 dark:border-stone-700 pb-4 mb-6 pt-1">
          <div className="flex items-center gap-3">
            <span className={`inline-block w-3 h-8 ${theme.accentBar} rounded-xs shrink-0`}></span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase font-serif-title text-stone-900 dark:text-stone-100">
                  FICHA DE DEGUSTAÇÃO
                </h1>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                  {sheet.estilo === 'rose' ? 'Vinho Rosé' : sheet.estilo === 'branco' ? 'Vinho Branco' : 'Vinho Tinto'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-widest font-mono mt-1">
                Análise Sensorial Técnica & Sommelier
              </p>
            </div>
          </div>

          {/* Header right side: Wine label photo thumbnail (if present) + Sommelier Seal */}
          <div className="flex items-center gap-3 shrink-0">
            {sheet.fotoRotulo && (
              <div
                className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 border-stone-300 dark:border-stone-600 shadow-xs bg-stone-100 dark:bg-stone-800 shrink-0"
                title="Rótulo da Garrafa"
              >
                <img
                  src={sheet.fotoRotulo}
                  alt="Rótulo da garrafa"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className={`flex flex-col items-center justify-center p-2 rounded-full border-2 ${theme.sealBorder} ${theme.sealText} w-16 h-16 shrink-0 ${theme.sealBg} shadow-2xs`}>
              <span className="text-[9px] font-bold uppercase tracking-tighter text-center leading-none">
                SOMMELIER
              </span>
              <div className="flex gap-0.5 my-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-[8px] leading-none ${theme.sealStars}`}>★</span>
                ))}
              </div>
              <span className="text-[8px] tracking-widest uppercase font-mono">ABS</span>
            </div>
          </div>
        </div>

        {/* General Wine Info Block */}
        <div className="print-break-inside-avoid grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-stone-200 dark:border-[#282C38]">
          <div className="md:col-span-2 space-y-3">
            <div className="flex flex-wrap items-baseline gap-2 border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-bold text-stone-500 dark:text-stone-400 tracking-wider">Produtor / Vinho / Safra:</span>
              <span className="text-base font-semibold text-stone-900 dark:text-stone-100">
                {sheet.produtor} {sheet.vinho ? `• ${sheet.vinho}` : ''} {sheet.safra ? `• ${sheet.safra}` : ''}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-bold text-stone-500 dark:text-stone-400 tracking-wider">Uvas:</span>
              <span className="text-base font-medium text-stone-900 dark:text-stone-100">{sheet.uvas || '—'}</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-bold text-stone-500 dark:text-stone-400 tracking-wider">Região / País:</span>
              <span className="text-base font-medium text-stone-900 dark:text-stone-100">{sheet.regiaoPais || '—'}</span>
            </div>

            <div className="flex items-center gap-4 pt-1 text-xs text-stone-500 dark:text-stone-400">
              <span>Data da degustação: <strong className="text-stone-800 dark:text-stone-200">{sheet.dataDegustacao}</strong></span>
              {sheet.conclusao.preco && (
                <span>Preço pago: <strong className="text-stone-800 dark:text-stone-200">{sheet.conclusao.preco}</strong></span>
              )}
            </div>

            {/* Informações de Serviço (Temperatura e Decantação) */}
            {(sheet.temperaturaServico || sheet.decantacao) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {sheet.temperaturaServico && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 font-medium shadow-2xs"
                    title="Temperatura ideal recomendada para servir este vinho"
                  >
                    <Thermometer className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Temp. Ideal: <strong>{sheet.temperaturaServico}</strong></span>
                  </div>
                )}
                {sheet.decantacao && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 font-medium shadow-2xs"
                    title="Sugestão de decantação / aeração recomendada"
                  >
                    <Hourglass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Decantação: <strong>{sheet.decantacao}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Custom Tags on Tasting Sheet */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200 dark:border-[#282C38]">
              <span className="text-xs uppercase font-bold text-stone-500 dark:text-stone-400 tracking-wider flex items-center gap-1">
                <Tag className={`w-3.5 h-3.5 ${theme.tagIcon}`} />
                Tags:
              </span>
              {sheet.tags && sheet.tags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {sheet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 dark:bg-[#232733] text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-[#282C38]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-stone-400 dark:text-stone-500 italic">Nenhuma tag atribuída</span>
              )}
            </div>
          </div>

          {/* Wine Type & Style Radios (Replica of checkboxes in physical sheet) */}
          <div className={`${theme.sideBoxBg} border ${theme.sideBoxBorder} rounded-xl p-4 flex flex-col justify-between transition-colors`}>
            <div>
              <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider block mb-2">
                Tipo do Vinho
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(['tranquilo', 'espumante', 'sobremesa', 'fortificado'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-1.5 cursor-default">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                        sheet.tipo === t
                          ? theme.radioActive
                          : 'border-stone-400 dark:border-stone-600 bg-white dark:bg-[#1A1C23]'
                      }`}
                    >
                      {sheet.tipo === t && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    <span className={`capitalize ${sheet.tipo === t ? 'font-bold text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}`}>
                      {t}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-stone-200 dark:border-[#282C38]">
              <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider block mb-2">
                Estilo / Cor
              </span>
              <div className="flex items-center gap-3 text-xs">
                {(['branco', 'rose', 'tinto'] as const).map((s) => (
                  <label key={s} className="flex items-center gap-1.5 cursor-default">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                        sheet.estilo === s
                          ? theme.radioActive
                          : 'border-stone-400 dark:border-stone-600 bg-white dark:bg-[#1A1C23]'
                      }`}
                    >
                      {sheet.estilo === s && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    <span className={`capitalize ${sheet.estilo === s ? 'font-bold text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}`}>
                      {s === 'rose' ? 'Rosé' : s}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Visual */}
        <div className="print-break-inside-avoid mb-6 pb-6 border-b border-stone-200 dark:border-[#282C38]">
          <div className="flex items-center gap-2 mb-3">
            <h2 className={`text-sm font-bold tracking-wider uppercase ${theme.sectionHeader} px-2.5 py-0.5 rounded`}>
              Visual
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3 text-sm">
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Limpidez:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.visual.limpidez || '—'}</span>
            </div>
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Transparência:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.visual.transparencia || '—'}</span>
            </div>
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Intensidade:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.visual.intensidade || '—'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1 flex items-center gap-2">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400">Cor Núcleo / Borda:</span>
              <div className="flex items-center gap-1.5">
                {sheet.visual.corHex && (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-stone-300 dark:border-stone-600 shrink-0"
                    style={{ backgroundColor: sheet.visual.corHex }}
                  ></span>
                )}
                <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.visual.corNucleoBorda || '—'}</span>
              </div>
            </div>
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 mr-2">Perlage:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.visual.perlage || '—'}</span>
            </div>
          </div>
        </div>

        {/* Section: Olfato */}
        <div className="print-break-inside-avoid mb-6 pb-6 border-b border-stone-200 dark:border-[#282C38]">
          <div className="flex items-center gap-2 mb-3">
            <h2 className={`text-sm font-bold tracking-wider uppercase ${theme.sectionHeader} px-2.5 py-0.5 rounded`}>
              Olfato
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 text-sm">
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Condição:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.olfato.condicao || 'Limpo / Correto'}</span>
            </div>
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Intensidade:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.olfato.intensidade || '—'}</span>
            </div>
          </div>

          <div className="border-b border-stone-300 dark:border-[#2E3342] pb-2 mb-3">
            <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block mb-1">Aromas:</span>
            <p className="text-base font-medium text-stone-900 dark:text-stone-100 leading-relaxed italic">
              {sheet.olfato.aromas || '—'}
            </p>
          </div>

          <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1 text-sm">
            <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 mr-2">Desenvolvimento:</span>
            <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.olfato.desenvolvimento || '—'}</span>
          </div>
        </div>

        {/* Section: Paladar */}
        <div className="print-break-inside-avoid mb-6 pb-6 border-b border-stone-200 dark:border-[#282C38]">
          <div className="flex items-center gap-2 mb-3">
            <h2 className={`text-sm font-bold tracking-wider uppercase ${theme.sectionHeader} px-2.5 py-0.5 rounded`}>
              Paladar
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3 text-sm">
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Doçura:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.paladar.docura || '—'}</span>
            </div>
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Acidez:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.paladar.acidez || '—'}</span>
            </div>
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Tanino:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.paladar.tanino || '—'}</span>
            </div>
          </div>

          <div className="border-b border-stone-300 dark:border-[#2E3342] pb-2 mb-3">
            <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block mb-1">Aromas em Boca:</span>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100 italic">
              {sheet.paladar.aromasBoca || '—'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 text-sm">
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Corpo:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.paladar.corpo || '—'}</span>
            </div>
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Álcool:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.paladar.alcool || '—'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Retrogosto:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.paladar.retrogosto || '—'}</span>
            </div>
            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Persistência:</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.paladar.persistencia || '—'}</span>
            </div>
          </div>
        </div>

        {/* Section: Perfil Sensorial (Radar Chart) */}
        <div className="print-break-inside-avoid mb-6 pb-6 border-b border-stone-200 dark:border-[#282C38]">
          <SensoryRadarChart
            paladar={sheet.paladar}
            wineStyle={sheet.estilo}
            colorHex={sheet.visual.corHex}
          />
        </div>

        {/* Section: Conclusão & Wine Glass Graphic */}
        <div className="print-break-inside-avoid relative grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1">
                <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Guarda:</span>
                <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.conclusao.guarda || '—'}</span>
              </div>
              <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Qualidade:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{sheet.conclusao.qualidade || '—'}</span>
                </div>
                {sheet.conclusao.avaliacaoEstrelas > 0 && (
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= sheet.conclusao.avaliacaoEstrelas
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recomendações de Serviço na Ficha */}
            {(sheet.temperaturaServico || sheet.decantacao) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {sheet.temperaturaServico && (
                  <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1 flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <div>
                      <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Temp. Serviço:</span>
                      <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.temperaturaServico}</span>
                    </div>
                  </div>
                )}
                {sheet.decantacao && (
                  <div className="border-b border-stone-300 dark:border-[#2E3342] pb-1 flex items-center gap-2">
                    <Hourglass className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block">Decantação / Aeração:</span>
                      <span className="font-medium text-stone-900 dark:text-stone-100">{sheet.decantacao}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-2">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block mb-1">Harmonização:</span>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                {sheet.conclusao.harmonizacao || '—'}
              </p>
            </div>

            <div className="border-b border-stone-300 dark:border-[#2E3342] pb-2">
              <span className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 block mb-1">Impressão Final:</span>
              <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-serif">
                "{sheet.conclusao.impressaoFinal || '—'}"
              </p>
            </div>
          </div>

          {/* Sommelier Glass graphic mirroring the paper notebook corner! */}
          <div className={`flex flex-col items-center justify-center p-3 ${theme.glassBoxBg} border ${theme.glassBoxBorder} rounded-xl transition-colors`}>
            <WineGlassVisual
              colorHex={sheet.visual.corHex}
              style={sheet.estilo}
              size="lg"
            />
            <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-widest mt-2 font-mono text-center">
              {sheet.visual.corNucleoBorda || sheet.estilo}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-dashed border-stone-300 dark:border-[#2E3342] flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 font-mono">
          <span>Registro: #{sheet.id.slice(0, 8)}</span>
          <span className="hidden print:inline text-stone-500">
            Caderno Digital de Degustação • Sommelier Journal
          </span>
          <span>Ficha de Degustação Técnica</span>
        </div>
      </div>
    </div>
  );
};
