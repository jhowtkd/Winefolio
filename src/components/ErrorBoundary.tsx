import React, { ErrorInfo, ReactNode } from 'react';
import { Wine, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Wine Sommelier App:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#121316] text-stone-800 dark:text-stone-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1A1C23] border border-stone-200 dark:border-[#282C38] rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto text-rose-900 dark:text-rose-300">
              <Wine className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold font-serif-title text-stone-900 dark:text-stone-100 mb-1">
                Ficha de Degustação de Vinhos
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Ocorreu uma instabilidade no carregamento inicial da aplicação.
              </p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-left text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p>
                {this.state.error?.message || 'Erro inesperado ao renderizar componentes visuais.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full px-4 py-2.5 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm"
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
