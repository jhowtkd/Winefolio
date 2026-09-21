import React from 'react';
import type { WineEntry } from '../../domain/wine-entry';
import { PaperSurface } from '../../components/ui/PaperSurface';
import { PaperButton } from '../../components/ui/PaperButton';
import { InkStamp } from '../../components/ui/InkStamp';
import { ModalDialog } from '../../components/proto/ModalDialog';
import { WineGlassVisual } from '../../components/WineGlassVisual';
import { SensoryRadar } from './SensoryRadar';
import { usePhotoUrl } from '../journal/usePhotoUrl';
import { BottleArt } from '../../components/proto/BottleArt';
import {
  ArrowLeft,
  Edit2,
  Copy,
  Trash2,
  Printer,
  Heart,
  Star,
  Calendar,
  Sparkles,
  Award,
  Globe2,
  UtensilsCrossed,
  Clock,
  CircleDollarSign,
  Tag,
} from 'lucide-react';

interface TastingSheetDetailsProps {
  entry: WineEntry;
  readPhoto: (id: string) => Promise<Blob | undefined>;
  onBack: () => void;
  onEdit: (entry: WineEntry) => void;
  onDuplicate: (entry: WineEntry) => void;
  onToggleFavorite: (entry: WineEntry) => void;
  onDelete: (id: string, revision: number) => Promise<void>;
}

export const TastingSheetDetails: React.FC<TastingSheetDetailsProps> = ({
  entry,
  readPhoto,
  onBack,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onDelete,
}) => {
  const photoUrl = usePhotoUrl(entry.photoId, readPhoto);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const wineTitle = entry.vinho || entry.produtor || 'Vinho Sem Nome';
  const producer = entry.vinho && entry.produtor ? entry.produtor : '';
  const stars = entry.conclusao?.avaliacaoEstrelas ?? null;

  return (
    <ModalDialog
      label="Winefolio / página do caderno"
      closeLabel="Fechar ficha"
      onClose={onBack}
    >
      <div className="space-y-6 print:p-0 print:m-0">
      {/* Ações da Página (Ocultas na Impressão) */}
      <div className="flex flex-wrap items-center justify-end gap-3 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <PaperButton
            variant="secondary"
            onClick={() => onToggleFavorite(entry)}
            className="!py-1.5 !px-3 text-xs"
          >
            <Heart
              className={`w-3.5 h-3.5 mr-1.5 ${
                entry.favorite ? 'text-[#793b46] fill-[#793b46]' : ''
              }`}
            />
            {entry.favorite ? 'Favorito' : 'Favoritar'}
          </PaperButton>

          <PaperButton
            variant="secondary"
            onClick={() => window.print()}
            className="!py-1.5 !px-3 text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Imprimir
          </PaperButton>

          <PaperButton
            variant="secondary"
            onClick={() => onDuplicate(entry)}
            className="!py-1.5 !px-3 text-xs"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Duplicar
          </PaperButton>

          <PaperButton
            variant="primary"
            onClick={() => onEdit(entry)}
            className="!py-1.5 !px-3.5 text-xs"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Editar Ficha
          </PaperButton>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded text-stone-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
            title="Excluir ficha"
            aria-label="Excluir ficha"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ficha Principal no formato Folha de Caderno / Manuscrito */}
      <PaperSurface
        material="sheet"
        className="p-6 sm:p-10 border border-[#cfc4b0] dark:border-[#3d362b] rounded-xs shadow-md space-y-8 relative overflow-hidden print:border-none print:shadow-none print:p-0"
      >
        {/* Tiras decorativas de fita adesiva nos cantos (estilo caderno físico) */}
        <div className="tape print:hidden" />

        {/* Cabeçalho da Ficha */}
        <header className="border-b-2 border-[#312d26]/20 dark:border-[#eee7db]/20 pb-6 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#f2ecdf] dark:bg-[#25221d] text-[#793b46] dark:text-[#b05e6e] border border-[#cfc4b0]/70">
                  Ficha Técnica Nº {entry.id.slice(-6).toUpperCase()}
                </span>
                {entry.tipo === 'espumante' ? (
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    Espumante
                  </span>
                ) : entry.estilo ? (
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded capitalize bg-[#f2ecdf] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] border border-[#cfc4b0]/70">
                    Vinho {entry.estilo}
                  </span>
                ) : null}
                {entry.kind === 'demo' && (
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-bold">
                    DEMO
                  </span>
                )}
              </div>

              {producer && (
                <p className="text-xs uppercase tracking-widest font-semibold text-[#6b6458] dark:text-[#9e9687]">
                  {producer}
                </p>
              )}

              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#312d26] dark:text-[#eee7db] leading-tight">
                {wineTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#6b6458] dark:text-[#9e9687] pt-1">
                {entry.safra && (
                  <span className="font-mono-code font-medium">
                    Safra: <strong className="text-[#312d26] dark:text-[#eee7db]">{entry.safra}</strong>
                  </span>
                )}
                {entry.uvas && (
                  <span>
                    Uva(s): <strong className="text-[#312d26] dark:text-[#eee7db]">{entry.uvas}</strong>
                  </span>
                )}
                {entry.regiaoPais && (
                  <span>
                    Origem: <strong className="text-[#312d26] dark:text-[#eee7db]">{entry.regiaoPais}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Selo Postal e Avaliação */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
              {entry.origin?.countryCode && (
                <InkStamp label={entry.origin.countryCode} size="md" tone="wine" />
              )}

              {stars !== null ? (
                <div className="text-right">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= stars ? 'text-amber-500 fill-amber-500' : 'text-[#cfc4b0]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono-code text-[#6b6458] dark:text-[#9e9687]">
                    {stars} de 5 estrelas
                  </span>
                </div>
              ) : (
                <span className="text-xs italic text-[#6b6458] dark:text-[#9e9687]">
                  (Sem pontuação)
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Grade com Rótulo / Visual e Detalhes da Degustação */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Coluna da Esquerda: Rótulo, Taça e Metadados da Degustação */}
          <div className="md:col-span-5 space-y-6">
            {/* Foto do Rótulo ou Silhueta */}
            <div className="p-3 bg-[#ede5d4] dark:bg-[#1a1714] border border-[#cfc4b0] dark:border-[#3d362b] rounded-xs shadow-xs text-center space-y-2">
              <div className="aspect-[3/4] max-h-72 w-full overflow-hidden rounded-xs flex items-center justify-center bg-white/40 dark:bg-black/20">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`Rótulo de ${wineTitle}`}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <BottleArt entry={entry} />
                )}
              </div>
              <p className="text-[10px] font-mono-code text-[#6b6458] dark:text-[#9e9687]">
                {photoUrl ? 'Fotografia do Rótulo' : 'Ilustração do Sommelier'}
              </p>
            </div>

            {/* Metadados da Degustação */}
            <div className="p-4 rounded-xs border border-[#cfc4b0]/70 dark:border-[#3d362b] bg-[#fffaf0]/60 dark:bg-[#25221d]/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6b6458] dark:text-[#9e9687] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Data da Prova:
                </span>
                <span className="font-mono-code font-bold text-[#312d26] dark:text-[#eee7db]">
                  {entry.dataDegustacao}
                </span>
              </div>

              {entry.occasion && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6b6458] dark:text-[#9e9687]">Ocasião:</span>
                  <span className="font-medium text-[#312d26] dark:text-[#eee7db]">
                    {entry.occasion}
                  </span>
                </div>
              )}

              {entry.conclusao?.preco && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6b6458] dark:text-[#9e9687] flex items-center gap-1.5">
                    <CircleDollarSign className="w-3.5 h-3.5" />
                    Faixa de Preço:
                  </span>
                  <span className="font-medium text-[#312d26] dark:text-[#eee7db]">
                    {entry.conclusao.preco}
                  </span>
                </div>
              )}

              {entry.conclusao?.guarda && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6b6458] dark:text-[#9e9687] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Potencial de Guarda:
                  </span>
                  <span className="font-medium text-[#312d26] dark:text-[#eee7db]">
                    {entry.conclusao.guarda}
                  </span>
                </div>
              )}
            </div>

            {/* Tags e Palavras-chave */}
            {((entry.aromaTags && entry.aromaTags.length > 0) || (entry.tags && entry.tags.length > 0)) && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono-code uppercase tracking-wider text-[#6b6458] dark:text-[#9e9687]">
                  Marcadores & Aromas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(entry.aromaTags || []).map((aroma) => (
                    <span
                      key={aroma}
                      className="px-2 py-0.5 rounded-full text-xs bg-[#f2ecdf] dark:bg-[#25221d] text-[#793b46] dark:text-[#b05e6e] border border-[#cfc4b0]/70 font-medium"
                    >
                      {aroma}
                    </span>
                  ))}
                  {(entry.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs bg-[#f2ecdf] dark:bg-[#25221d] text-[#312d26] dark:text-[#eee7db] border border-[#cfc4b0]/70"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna da Direita: As 3 Etapas Sensoriais (Visual, Olfato, Paladar) e Conclusão */}
          <div className="md:col-span-7 space-y-6">
            {/* 1. Análise Visual */}
            <div className="p-4 rounded-xs border border-[#cfc4b0]/70 dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] space-y-3">
              <h3 className="font-serif font-bold text-sm text-[#793b46] dark:text-[#b05e6e] uppercase tracking-wider border-b border-[#cfc4b0]/50 pb-1.5 flex items-center justify-between">
                <span>1. Exame Visual</span>
                {entry.visual?.corHex && (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: entry.visual.corHex }}
                    title={`Cor: ${entry.visual.corHex}`}
                  />
                )}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Limpidez
                  </span>
                  <span className="font-medium">{entry.visual?.limpidez || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Intensidade
                  </span>
                  <span className="font-medium">{entry.visual?.intensidade || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Transparência
                  </span>
                  <span className="font-medium">{entry.visual?.transparencia || '—'}</span>
                </div>
              </div>
              {entry.visual?.corNucleoBorda && (
                <div className="text-xs pt-1 border-t border-[#cfc4b0]/30">
                  <span className="text-[#6b6458] dark:text-[#9e9687] text-[10px] uppercase block">
                    Tonalidade & Halo
                  </span>
                  <span className="font-medium">{entry.visual.corNucleoBorda}</span>
                </div>
              )}
              {entry.tipo === 'espumante' && entry.visual?.perlage && (
                <div className="text-xs pt-1 border-t border-[#cfc4b0]/30">
                  <span className="text-[#6b6458] dark:text-[#9e9687] text-[10px] uppercase block">
                    Perlage (Bolhas)
                  </span>
                  <span className="font-medium">{entry.visual.perlage}</span>
                </div>
              )}
            </div>

            {/* 2. Análise Olfativa */}
            <div className="p-4 rounded-xs border border-[#cfc4b0]/70 dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] space-y-3">
              <h3 className="font-serif font-bold text-sm text-[#793b46] dark:text-[#b05e6e] uppercase tracking-wider border-b border-[#cfc4b0]/50 pb-1.5">
                2. Exame Olfativo
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Condição
                  </span>
                  <span className="font-medium">{entry.olfato?.condicao || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Intensidade
                  </span>
                  <span className="font-medium">{entry.olfato?.intensidade || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Evolução
                  </span>
                  <span className="font-medium">{entry.olfato?.desenvolvimento || '—'}</span>
                </div>
              </div>
              {entry.olfato?.aromas && (
                <div className="text-xs pt-1 border-t border-[#cfc4b0]/30">
                  <span className="text-[#6b6458] dark:text-[#9e9687] text-[10px] uppercase block">
                    Notas Aromáticas Descritivas
                  </span>
                  <p className="font-serif italic text-sm text-[#312d26] dark:text-[#eee7db] mt-0.5">
                    "{entry.olfato.aromas}"
                  </p>
                </div>
              )}
            </div>

            {/* 3. Análise Gustativa */}
            <div className="p-4 rounded-xs border border-[#cfc4b0]/70 dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] space-y-3">
              <h3 className="font-serif font-bold text-sm text-[#793b46] dark:text-[#b05e6e] uppercase tracking-wider border-b border-[#cfc4b0]/50 pb-1.5">
                3. Exame Gustativo
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Doçura
                  </span>
                  <span className="font-medium">{entry.paladar?.docura || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Acidez
                  </span>
                  <span className="font-medium">{entry.paladar?.acidez || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Taninos
                  </span>
                  <span className="font-medium">{entry.paladar?.tanino || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Corpo
                  </span>
                  <span className="font-medium">{entry.paladar?.corpo || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#cfc4b0]/30">
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Álcool
                  </span>
                  <span className="font-medium">{entry.paladar?.alcool || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6b6458] dark:text-[#9e9687] block text-[10px] uppercase">
                    Persistência
                  </span>
                  <span className="font-medium">{entry.paladar?.persistencia || '—'}</span>
                </div>
              </div>

              <SensoryRadar
                paladar={entry.paladar}
                estilo={entry.estilo}
                corHex={entry.visual?.corHex}
              />

              {entry.paladar?.aromasBoca && (
                <div className="text-xs pt-1 border-t border-[#cfc4b0]/30">
                  <span className="text-[#6b6458] dark:text-[#9e9687] text-[10px] uppercase block">
                    Sensações em Boca
                  </span>
                  <p className="font-serif italic text-xs text-[#312d26] dark:text-[#eee7db] mt-0.5">
                    {entry.paladar.aromasBoca}
                  </p>
                </div>
              )}
            </div>

            {/* 4. Conclusão & Impressão Final do Sommelier */}
            <div className="p-4 sm:p-5 rounded-xs border-2 border-[#793b46]/30 dark:border-[#b05e6e]/30 bg-[#f9f5ed] dark:bg-[#201d18] space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#793b46]/20 pb-2">
                <h3 className="font-serif font-bold text-sm text-[#793b46] dark:text-[#b05e6e] uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Conclusão do Degustador
                </h3>
                {entry.conclusao?.qualidade && (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#793b46] text-[#fffaf0]">
                    {entry.conclusao.qualidade}
                  </span>
                )}
              </div>

              {entry.conclusao?.impressaoFinal ? (
                <div className="pt-1">
                  <span className="text-[10px] font-mono-code text-[#6b6458] dark:text-[#9e9687] uppercase block">
                    Anotação Manuscrita:
                  </span>
                  <p className="font-hand text-xl sm:text-2xl text-[#312d26] dark:text-[#eee7db] leading-relaxed pt-1">
                    "{entry.conclusao.impressaoFinal}"
                  </p>
                </div>
              ) : (
                <p className="text-xs italic text-[#6b6458]">Nenhuma anotação final registrada.</p>
              )}

              {entry.conclusao?.harmonizacao && (
                <div className="pt-2 border-t border-[#793b46]/15 flex items-start gap-2 text-xs">
                  <UtensilsCrossed className="w-4 h-4 text-[#793b46] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#312d26] dark:text-[#eee7db]">Harmonização Sugerida:</strong>{' '}
                    <span className="text-[#6b6458] dark:text-[#9e9687]">
                      {entry.conclusao.harmonizacao}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PaperSurface>

      {/* Modal de Exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <PaperSurface
            material="sheet"
            className="max-w-md w-full p-6 space-y-4 border-2 border-red-300 dark:border-red-900 shadow-2xl"
          >
            <h3 className="font-serif text-lg font-bold text-red-900 dark:text-red-300">
              Confirmar Exclusão
            </h3>
            <p className="text-xs sm:text-sm text-[#6b6458] dark:text-[#9e9687]">
              Deseja realmente excluir permanentemente a ficha de <strong>{wineTitle}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <PaperButton variant="secondary" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </PaperButton>
              <PaperButton
                variant="danger"
                onClick={async () => {
                  await onDelete(entry.id, entry.revision);
                  onBack();
                }}
              >
                Sim, excluir
              </PaperButton>
            </div>
          </PaperSurface>
        </div>
      )}
      </div>
    </ModalDialog>
  );
};
