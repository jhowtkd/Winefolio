import React, { useRef, useState } from 'react';
import { PaperSurface } from '../../components/ui/PaperSurface';
import { PaperButton } from '../../components/ui/PaperButton';
import { PaperDialog } from '../../components/ui/PaperDialog';
import type { Preferences } from '../../domain/wine-entry';
import {
  Download,
  Upload,
  Sparkles,
  Sun,
  Moon,
  Eye,
  Sliders,
  Database,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  FileJson,
  Layers,
} from 'lucide-react';

interface SettingsPageProps {
  preferences: Preferences;
  onUpdatePreferences: (prefs: Partial<Preferences>) => Promise<void>;
  onExportBackup: () => Promise<void>;
  onImportBackup: (file: File) => Promise<{ imported: number; skipped: number }>;
  onLoadDemoWines: () => Promise<void>;
  onNavigate: (hash: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  preferences,
  onUpdatePreferences,
  onExportBackup,
  onImportBackup,
  onLoadDemoWines,
  onNavigate,
  showToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExportBackup();
    } catch (err: any) {
      showToast('Falha ao exportar backup: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const res = await onImportBackup(file);
      showToast(`Importação realizada! ${res.imported} fichas processadas com sucesso.`, 'success');
      onNavigate('#/caderno');
    } catch (err: any) {
      showToast('Falha ao importar arquivo: ' + err.message, 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      await onLoadDemoWines();
      onNavigate('#/caderno');
    } catch (err: any) {
      showToast('Falha ao carregar exemplos: ' + err.message, 'error');
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="border-b border-[#cfc4b0]/70 dark:border-[#3d362b] pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#312d26] dark:text-[#eee7db]">
          Ajustes & Preservação
        </h1>
        <p className="text-xs sm:text-sm text-[#6b6458] dark:text-[#9e9687]">
          Gerencie backups, transferência de fichas e preferências de exibição do seu caderno.
        </p>
      </div>

      {/* 1. Backup & Transferência de Dados */}
      <PaperSurface
        material="sheet"
        className="p-5 sm:p-6 border border-[#cfc4b0] dark:border-[#3d362b] rounded-xs shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-[#cfc4b0]/40 dark:border-[#3d362b] pb-2">
          <Database className="w-5 h-5 text-[#793b46] dark:text-[#b05e6e]" />
          <h2 className="font-serif font-bold text-base text-[#312d26] dark:text-[#eee7db]">
            Preservação & Backups
          </h2>
        </div>

        <p className="text-xs text-[#6b6458] dark:text-[#9e9687] leading-relaxed">
          Suas fichas e fotografias ficam salvas de forma 100% privada no armazenamento seguro do seu
          navegador (IndexedDB). Para garantir que suas memórias nunca se percam ao limpar o cache ou
          trocar de aparelho, recomendamos exportar um backup periódico.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <PaperButton
            variant="secondary"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full justify-center !py-2.5 text-xs font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar Backup Completo (JSON)'}
          </PaperButton>

          <PaperButton
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full justify-center !py-2.5 text-xs font-semibold"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? 'Importando...' : 'Restaurar / Importar Fichas'}
          </PaperButton>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept=".json,application/json"
            className="hidden"
          />
        </div>
      </PaperSurface>

      {/* 2. Preferências Visuais e de Tema */}
      <PaperSurface
        material="sheet"
        className="p-5 sm:p-6 border border-[#cfc4b0] dark:border-[#3d362b] rounded-xs shadow-xs space-y-5"
      >
        <div className="flex items-center gap-2 border-b border-[#cfc4b0]/40 dark:border-[#3d362b] pb-2">
          <Layers className="w-5 h-5 text-[#793b46] dark:text-[#b05e6e]" />
          <h2 className="font-serif font-bold text-base text-[#312d26] dark:text-[#eee7db]">
            Aparência & Experiência
          </h2>
        </div>

        {/* Modo Claro / Escuro */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-[#cfc4b0]/30 dark:border-[#3d362b]">
          <div>
            <h3 className="text-xs font-semibold text-[#312d26] dark:text-[#eee7db]">
              Modo Noturno (Tema Escuro)
            </h3>
            <p className="text-[11px] text-[#6b6458] dark:text-[#9e9687]">
              Alterna entre papel pergaminho claro e couro/papel escuro preservando alto contraste.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdatePreferences({
                theme: preferences.theme === 'night' ? 'paper' : 'night',
              })
            }
            className="p-2 rounded-xs border border-[#cfc4b0] dark:border-[#3d362b] bg-[#fffaf0] dark:bg-[#25221d] text-[#793b46] dark:text-[#b05e6e]"
          >
            {preferences.theme === 'night' ? (
              <Moon className="w-4 h-4 fill-current" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Texturas de Papel */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-[#cfc4b0]/30 dark:border-[#3d362b]">
          <div>
            <h3 className="text-xs font-semibold text-[#312d26] dark:text-[#eee7db]">
              Texturas de Fibras de Papel
            </h3>
            <p className="text-[11px] text-[#6b6458] dark:text-[#9e9687]">
              Adiciona sutis granulações e fibras táteis de papel artesanal às superfícies.
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.textures !== false}
            onChange={(e) => onUpdatePreferences({ textures: e.target.checked })}
            className="w-4 h-4 accent-[#793b46] rounded cursor-pointer"
          />
        </div>

        {/* Movimento Reduzido */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <h3 className="text-xs font-semibold text-[#312d26] dark:text-[#eee7db]">
              Movimento Reduzido
            </h3>
            <p className="text-[11px] text-[#6b6458] dark:text-[#9e9687]">
              Desativa transições dinâmicas para maior rapidez e acessibilidade visual.
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.reduceMotion}
            onChange={(e) =>
              onUpdatePreferences({
                reduceMotion: e.target.checked,
              })
            }
            className="w-4 h-4 accent-[#793b46] rounded cursor-pointer"
          />
        </div>
      </PaperSurface>

      {/* 3. Demonstração & Exemplos do Sommelier */}
      <PaperSurface
        material="kraft"
        className="p-5 sm:p-6 border border-[#cfc4b0] dark:border-[#42392c] rounded-xs space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-[#312d26]/15 dark:border-[#eee7db]/15 pb-2">
          <Sparkles className="w-5 h-5 text-[#b3674c] dark:text-[#c97c62]" />
          <h2 className="font-serif font-bold text-base text-[#312d26] dark:text-[#eee7db]">
            Fichas de Demonstração
          </h2>
        </div>

        <p className="text-xs text-[#6b6458] dark:text-[#9e9687] leading-relaxed">
          Deseja experimentar a interface com exemplos reais de vinhos premiados (Tinto argentino,
          Espumante brasileiro e Branco francês)? Clique abaixo para incluir essas fichas marcadas
          como demonstração no seu caderno.
        </p>

        <PaperButton
          variant="secondary"
          onClick={handleLoadDemo}
          disabled={isLoadingDemo}
          className="!py-2 !px-4 text-xs font-semibold"
        >
          <Sparkles className="w-4 h-4 mr-2 text-amber-600" />
          {isLoadingDemo ? 'Carregando exemplos...' : 'Carregar 3 Vinhos de Exemplo'}
        </PaperButton>
      </PaperSurface>

      {/* 4. Privacidade e Informações do Sistema */}
      <div className="p-4 rounded-xs border border-[#cfc4b0]/50 dark:border-[#3d362b] bg-[#fffaf0]/50 dark:bg-[#1f1b16]/50 text-xs space-y-2 text-[#6b6458] dark:text-[#9e9687]">
        <div className="flex items-center gap-1.5 font-bold text-[#312d26] dark:text-[#eee7db]">
          <ShieldCheck className="w-4 h-4 text-[#5d6b4f]" />
          <span>Privacidade Garantida & Armazenamento Local Seguro</span>
        </div>
        <p>
          O Winefolio 1.1 armazena suas fichas exclusivamente no seu dispositivo, através do motor
          IndexedDB v2 local (<code className="font-mono-code text-[11px]">winefolio-local</code>).
          Nenhuma nota de degustação ou foto é transmitida para servidores de terceiros sem seu
          consentimento.
        </p>
      </div>
    </div>
  );
};
