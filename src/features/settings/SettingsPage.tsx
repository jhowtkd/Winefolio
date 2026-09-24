import React, { useRef, useState } from 'react';
import { ModalDialog } from '../../components/proto/ModalDialog';
import { Icon } from '../../components/proto/Sprite';
import type { Preferences } from '../../domain/wine-entry';
import type { BackupStatus } from '../../domain/backup-reminder';

interface SettingsPageProps {
  preferences: Preferences;
  onUpdatePreferences: (prefs: Partial<Preferences>) => Promise<void>;
  onExportBackup: () => Promise<void>;
  onImportBackup: (file: File) => Promise<{ imported: number; skipped: number }>;
  onLoadDemoWines: () => Promise<void>;
  backupStatus: BackupStatus;
  storagePersisted: boolean | null;
  onNavigate: (hash: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

/** Opções do caderno como diálogo, no padrão do protótipo. */
export const SettingsPage: React.FC<SettingsPageProps> = ({
  preferences,
  onUpdatePreferences,
  onExportBackup,
  onImportBackup,
  onLoadDemoWines,
  backupStatus,
  storagePersisted,
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
    <ModalDialog
      label="Um pouco sobre este caderno"
      closeLabel="Fechar opções"
      onClose={() => onNavigate('#/caderno')}
      ariaLabelledBy="settings-title"
    >
      <div className="entry-heading">
        <div>
          <h2 id="settings-title">Na mesa de criação.</h2>
          <p>Ajustes do caderno, suas preferências e a preservação das suas páginas.</p>
        </div>
      </div>

      <div className="settings-list">
        <div className="setting-row">
          <div>
            <h3>Mostrar coleção de exemplo</h3>
            <p>Seis vinhos e relatos fictícios. Seus registros continuam separados.</p>
          </div>
          <input
            type="checkbox"
            aria-label="Mostrar coleção de exemplo"
            checked={preferences.showDemo !== false}
            onChange={(e) => onUpdatePreferences({ showDemo: e.target.checked })}
          />
        </div>

        <div className="setting-row">
          <div>
            <h3>Texturas de papel</h3>
            <p>Desative para uma superfície visualmente mais limpa.</p>
          </div>
          <input
            type="checkbox"
            aria-label="Mostrar texturas"
            checked={preferences.textures !== false}
            onChange={(e) => onUpdatePreferences({ textures: e.target.checked })}
          />
        </div>

        <div className="setting-row">
          <div>
            <h3>Reduzir movimento</h3>
            <p>Sem entrada animada, deslocamentos ou elevação dos cartões.</p>
          </div>
          <input
            type="checkbox"
            aria-label="Reduzir movimento"
            checked={Boolean(preferences.reduceMotion)}
            onChange={(e) => onUpdatePreferences({ reduceMotion: e.target.checked })}
          />
        </div>

        <div className="setting-row">
          <div>
            <h3>Modo noturno</h3>
            <p>Papel escuro de alto contraste para ler à noite.</p>
          </div>
          <input
            type="checkbox"
            aria-label="Modo noturno"
            checked={preferences.theme === 'night'}
            onChange={(e) =>
              onUpdatePreferences({ theme: e.target.checked ? 'night' : 'paper' })
            }
          />
        </div>

        <div className="setting-row">
          <div>
            <h3>Leitura de rótulo com IA</h3>
            <p>
              {preferences.aiConsentAt
                ? `Permitida desde ${new Date(preferences.aiConsentAt).toLocaleDateString('pt-BR')}. A foto vai ao Google Gemini só quando você pede a leitura.`
                : 'Pede licença no primeiro uso. Sem licença, a foto fica só neste navegador.'}
            </p>
          </div>
          {preferences.aiConsentAt ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onUpdatePreferences({ aiConsentAt: null })}
            >
              Revogar
            </button>
          ) : null}
        </div>

        <div className="setting-row">
          <div>
            <h3>Traga as fichas de exemplo</h3>
            <p>Carrega a coleção ilustrativa de seis vinhos no seu caderno.</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isLoadingDemo}
            onClick={handleLoadDemo}
          >
            <Icon name="leaf" />
            {isLoadingDemo ? 'Trazendo...' : 'Carregar'}
          </button>
        </div>

        <div className="setting-row">
          <div>
            <h3>Uma cópia das suas anotações</h3>
            <p>Exportação JSON das suas fichas para guardar ou levar a outro navegador.</p>
            <p>
              {backupStatus.lastBackupAt
                ? `Último backup: ${new Date(backupStatus.lastBackupAt).toLocaleDateString('pt-BR')}.`
                : 'Nenhum backup ainda.'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isExporting}
            onClick={handleExport}
          >
            <Icon name="download" />
            {isExporting ? 'Exportando...' : 'Exportar'}
          </button>
        </div>

        <div className="setting-row">
          <div>
            <h3>Proteção contra limpeza do navegador</h3>
            <p>
              {storagePersisted === true
                ? 'Ativa. O navegador não apaga o caderno para liberar espaço.'
                : storagePersisted === false
                  ? 'Negada pelo navegador. Instale o app na tela inicial ou faça backups.'
                  : 'Não suportada neste navegador. Faça backups.'}
            </p>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <h3>Restaurar de um backup</h3>
            <p>Importa um arquivo JSON exportado pelo Winefolio.</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="refresh" />
            {isImporting ? 'Importando...' : 'Importar'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept=".json,application/json"
            hidden
          />
        </div>
      </div>

      <div className="settings-note">
        <strong>Privacidade:</strong> suas notas e fotos ficam só neste navegador (IndexedDB{' '}
        <code>winefolio-local</code>). A foto do rótulo só sai daqui quando você usa a leitura com
        IA, e vai para o Google Gemini.
      </div>
    </ModalDialog>
  );
};
