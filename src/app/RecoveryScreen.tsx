import React from 'react';
import { PaperSurface } from '../components/ui/PaperSurface';
import { PaperButton } from '../components/ui/PaperButton';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';

interface RecoveryScreenProps {
  error: string;
  onRetry: () => void;
}

export const RecoveryScreen: React.FC<RecoveryScreenProps> = ({ error, onRetry }) => {
  const handleDownloadEmergencyLocalStorage = () => {
    try {
      const data: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key);
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `winefolio-emergency-dump-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Não foi possível gerar dump de emergência: ' + String(e));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f2ecdf] dark:bg-[#1a1714]">
      <PaperSurface
        material="sheet"
        className="max-w-md w-full p-6 sm:p-8 space-y-6 text-center border-2 border-[#cfc4b0] shadow-xl"
      >
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-[#312d26] dark:text-[#eee7db]">
            Modo de Recuperação
          </h1>
          <p className="text-sm text-[#6b6458] dark:text-[#9e9687]">
            Ocorreu um problema ao acessar o armazenamento local seguro do navegador.
          </p>
        </div>

        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded text-xs text-red-800 dark:text-red-200 font-mono break-all text-left">
          {error}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <PaperButton variant="primary" onClick={onRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar reconectar ao banco de dados
          </PaperButton>

          <PaperButton
            variant="secondary"
            onClick={handleDownloadEmergencyLocalStorage}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar dados de emergência (localStorage)
          </PaperButton>

          <PaperButton
            variant="quiet"
            onClick={() => {
              window.location.hash = '#/caderno';
              window.location.reload();
            }}
            className="w-full text-xs"
          >
            Voltar para a tela inicial
          </PaperButton>
        </div>
      </PaperSurface>
    </div>
  );
};
