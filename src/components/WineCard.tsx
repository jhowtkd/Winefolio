import React from 'react';
import { WineTastingSheet } from '../types';
import { WineGlassVisual } from './WineGlassVisual';
import { Star, MapPin, Calendar, Eye, Edit3, Trash2, Tag, Thermometer, Hourglass } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface WineCardProps {
  sheet: WineTastingSheet;
  index?: number;
  onOpenSheet: (sheet: WineTastingSheet) => void;
  onEdit: (sheet: WineTastingSheet) => void;
  onDelete: (id: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const cardVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.98,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 280,
      mass: 0.8,
    },
  },
};

export const WineCard: React.FC<WineCardProps> = ({
  sheet,
  index = 0,
  onOpenSheet,
  onEdit,
  onDelete,
  onSelectTag,
}) => {
  const { isDark } = useTheme();

  const getStyleBadgeClasses = (estilo: string) => {
    switch (estilo) {
      case 'branco':
        return 'bg-amber-50 dark:bg-[#2B2515] text-amber-900 dark:text-amber-200 border-amber-200/80 dark:border-amber-900/60';
      case 'rose':
        return 'bg-rose-50 dark:bg-[#321623] text-rose-900 dark:text-rose-200 border-rose-200/80 dark:border-rose-900/60';
      case 'espumante':
        return 'bg-emerald-50 dark:bg-[#162B20] text-emerald-900 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-900/60';
      default:
        return 'bg-red-50 dark:bg-[#34141B] text-rose-950 dark:text-rose-200 border-red-200/80 dark:border-rose-900/60';
    }
  };

  return (
    <motion.div
      id={`wine-card-${sheet.id}`}
      variants={cardVariants}
      whileHover={{
        scale: 1.015,
        y: -4,
        transition: {
          type: 'spring',
          stiffness: 350,
          damping: 24,
        },
      }}
      className="h-full"
    >
      <div className="h-full bg-white dark:bg-[#1A1C23] border border-stone-200/90 dark:border-[#282C38] rounded-2xl p-5 flex flex-col justify-between group transition-all duration-300 hover:shadow-md hover:border-stone-300 dark:hover:border-stone-700 shadow-2xs">
        <div>
          {/* Top bar: Wine Style Badge, Type, Rating */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStyleBadgeClasses(
                  sheet.estilo
                )}`}
              >
                {sheet.estilo === 'rose' ? 'Rosé' : sheet.estilo}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium capitalize px-1">
                {sheet.tipo}
              </span>
            </div>

            <div className="flex items-center gap-0.5 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
                    s <= sheet.conclusao.avaliacaoEstrelas
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-300 dark:text-stone-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content with Mini Glass or Bottle Label on side */}
          <div className="flex items-start gap-3.5 mb-4">
            {sheet.fotoRotulo ? (
              <div
                onClick={() => onOpenSheet(sheet)}
                className="cursor-pointer shrink-0 relative w-16 h-20 sm:w-18 sm:h-22 rounded-xl overflow-hidden border border-stone-200 dark:border-[#2C3140] shadow-2xs group-hover:shadow-md transition-all duration-300 ease-out bg-stone-100 dark:bg-[#232733]"
                title="Ver ficha com foto do rótulo"
              >
                <img
                  src={sheet.fotoRotulo}
                  alt={`Rótulo de ${sheet.produtor}`}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-108"
                />
                <div
                  className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white/90 shadow-2xs"
                  style={{
                    backgroundColor:
                      sheet.visual.corHex ||
                      (sheet.estilo === 'branco'
                        ? '#F3E99F'
                        : sheet.estilo === 'rose'
                        ? '#E88B7C'
                        : '#83122D'),
                  }}
                  title={`Estilo: ${sheet.estilo}`}
                />
              </div>
            ) : (
              <div
                onClick={() => onOpenSheet(sheet)}
                className="cursor-pointer shrink-0 bg-stone-50 dark:bg-[#232733] p-2 rounded-xl border border-stone-200/80 dark:border-[#2C3140] group-hover:bg-white dark:group-hover:bg-[#282D3B] transition-all duration-300 ease-out shadow-2xs"
                title="Ver ficha técnica"
              >
                <div className="transition-transform duration-300 ease-out group-hover:scale-105">
                  <WineGlassVisual
                    colorHex={sheet.visual.corHex}
                    style={sheet.estilo}
                    size="sm"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3
                onClick={() => onOpenSheet(sheet)}
                className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-rose-900 dark:group-hover:text-rose-300 transition-colors duration-200 cursor-pointer font-serif-title leading-snug line-clamp-1"
              >
                {sheet.produtor}
              </h3>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 leading-snug line-clamp-1 mt-0.5">
                {sheet.vinho || 'Vinho'} {sheet.safra ? `• ${sheet.safra}` : ''}
              </p>

              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 truncate">
                <strong className="text-stone-700 dark:text-stone-300">Uvas:</strong> {sheet.uvas || 'Não especificado'}
              </p>

              {sheet.regiaoPais && (
                <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 mt-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0 text-stone-400 dark:text-stone-500 group-hover:text-rose-800 dark:group-hover:text-rose-400 transition-colors duration-200" />
                  <span className="truncate">{sheet.regiaoPais}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sensory Preview snippets */}
          <div className="bg-stone-50/80 dark:bg-[#232733]/70 rounded-xl p-3 space-y-1.5 mb-3 text-xs transition-colors duration-200 border border-stone-200/50 dark:border-[#2C3140]/50">
            {sheet.olfato.aromas && (
              <p className="text-stone-700 dark:text-stone-300 line-clamp-2 italic">
                <span className="font-semibold text-stone-900 dark:text-stone-100 not-italic">Aromas: </span>
                {sheet.olfato.aromas}
              </p>
            )}

            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/60 dark:border-[#2C3140]">
              <span>Corpo: <strong className="text-stone-800 dark:text-stone-200">{sheet.paladar.corpo || '—'}</strong></span>
              <span>Acidez: <strong className="text-stone-800 dark:text-stone-200">{sheet.paladar.acidez || '—'}</strong></span>
              <span>Qualidade: <strong className="text-rose-950 dark:text-rose-300 font-semibold">{sheet.conclusao.qualidade}</strong></span>
            </div>

            {(sheet.temperaturaServico || sheet.decantacao) && (
              <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/60 dark:border-[#2C3140]">
                {sheet.temperaturaServico && (
                  <span className="inline-flex items-center gap-1 font-medium text-sky-800 dark:text-sky-300" title="Temperatura de serviço">
                    <Thermometer className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>{sheet.temperaturaServico}</span>
                  </span>
                )}
                {sheet.decantacao && (
                  <span className="inline-flex items-center gap-1 font-medium text-amber-800 dark:text-amber-300 truncate" title="Decantação">
                    <Hourglass className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">{sheet.decantacao}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Custom Tags on Card */}
          {sheet.tags && sheet.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {sheet.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 hover:bg-stone-200 dark:bg-[#232733] dark:hover:bg-[#2B303E] text-stone-700 dark:text-stone-300 border border-stone-200/70 dark:border-[#282C38] cursor-pointer transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag?.(tag);
                  }}
                  title={`Filtrar fichas pela tag "${tag}"`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-200/70 dark:border-[#282C38]">
          <div className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500">
            <Calendar className="w-3 h-3" />
            <span>{sheet.dataDegustacao}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenSheet(sheet)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/90 dark:bg-[#232733] dark:hover:bg-[#2C3140] text-stone-800 dark:text-stone-200 text-xs font-semibold transition cursor-pointer"
              title="Abrir Ficha de Degustação"
            >
              <Eye className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>Ver Ficha</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(sheet)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#232733] transition cursor-pointer"
              title="Editar Ficha"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Excluir a ficha de "${sheet.produtor}"?`)) {
                  onDelete(sheet.id);
                }
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 dark:text-stone-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
              title="Excluir Ficha"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
