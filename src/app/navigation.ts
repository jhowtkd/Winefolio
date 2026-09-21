export type AppRoute =
  | { kind: 'journal'; search?: string; tab?: 'all' | 'favorites' | 'sparkling'; country?: string; aroma?: string }
  | { kind: 'new'; fromTemplateId?: string }
  | { kind: 'entry'; id: string; mode: 'view' | 'edit' }
  | { kind: 'passport' }
  | { kind: 'palate' }
  | { kind: 'cellar' }
  | { kind: 'stats' }
  | { kind: 'settings' }
  | { kind: 'recovery'; error: string };

export function parseHash(hash: string): AppRoute {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) return { kind: 'journal', tab: 'all' };

  const [path, queryString] = clean.split('?');
  const params = new URLSearchParams(queryString || '');

  const segments = path.split('/').filter(Boolean);
  const primary = segments[0];

  if (primary === 'novo' || primary === 'new') {
    const from = params.get('from');
    return from ? { kind: 'new', fromTemplateId: from } : { kind: 'new' };
  }

  if (primary === 'ficha' || primary === 'entry') {
    const id = segments[1];
    if (!id) return { kind: 'journal' };
    const mode = segments[2] === 'editar' || segments[2] === 'edit' || params.get('mode') === 'edit' ? 'edit' : 'view';
    return { kind: 'entry', id, mode };
  }

  if (primary === 'passaporte' || primary === 'passport') {
    return { kind: 'passport' };
  }

  if (primary === 'paladar' || primary === 'palate') {
    return { kind: 'palate' };
  }

  if (primary === 'adega' || primary === 'cellar') {
    return { kind: 'cellar' };
  }

  if (primary === 'estatisticas' || primary === 'stats') {
    return { kind: 'stats' };
  }

  if (primary === 'ajustes' || primary === 'settings' || primary === 'configuracoes') {
    return { kind: 'settings' };
  }

  if (primary === 'recuperacao' || primary === 'recovery') {
    return { kind: 'recovery', error: params.get('erro') || 'Falha de inicialização' };
  }

  const tabParam = params.get('aba');
  const validTab = tabParam === 'favorites' || tabParam === 'sparkling' ? tabParam : 'all';

  return {
    kind: 'journal',
    search: params.get('q') || undefined,
    tab: validTab,
    country: params.get('pais') || undefined,
    aroma: params.get('aroma') || undefined,
  };
}

export function formatHash(route: AppRoute): string {
  switch (route.kind) {
    case 'journal': {
      const params = new URLSearchParams();
      if (route.search) params.set('q', route.search);
      if (route.tab && route.tab !== 'all') params.set('aba', route.tab);
      if (route.country) params.set('pais', route.country);
      if (route.aroma) params.set('aroma', route.aroma);
      const q = params.toString();
      return q ? `#/caderno?${q}` : '#/caderno';
    }
    case 'new': {
      return route.fromTemplateId ? `#/novo?from=${encodeURIComponent(route.fromTemplateId)}` : '#/novo';
    }
    case 'entry': {
      return route.mode === 'edit' ? `#/ficha/${encodeURIComponent(route.id)}/editar` : `#/ficha/${encodeURIComponent(route.id)}`;
    }
    case 'passport':
      return '#/passaporte';
    case 'palate':
      return '#/paladar';
    case 'cellar':
      return '#/adega';
    case 'stats':
      return '#/estatisticas';
    case 'settings':
      return '#/ajustes';
    case 'recovery':
      return `#/recuperacao?erro=${encodeURIComponent(route.error)}`;
  }
}
