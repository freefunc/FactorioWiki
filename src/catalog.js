export const categories = [
  { id: 'all', name: '全部词条', symbol: '▦' },
  { id: 'materials', name: '原料与中间产物', symbol: '◇' },
  { id: 'logistics', name: '物流与运输', symbol: '⇄' },
  { id: 'production', name: '生产与制造', symbol: '⚙' },
  { id: 'power', name: '能源与电力', symbol: 'ϟ' },
  { id: 'science', name: '科研与科技', symbol: '⌘' },
  { id: 'mechanics', name: '游戏机制', symbol: '◎' },
];

export function filterEntries(entries, { query = '', category = 'all', scope = 'all' } = {}) {
  const words = query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter(entry => {
    const search = [entry.name, entry.id, entry.summary, ...(entry.aliases || [])].join(' ').normalize('NFKC').toLocaleLowerCase();
    return (category === 'all' || entry.category === category)
      && (scope === 'all' || entry.scope === scope)
      && words.every(word => search.includes(word));
  });
}

export function readRoute(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    query: params.get('q') || '',
    category: categories.some(c => c.id === params.get('category')) ? params.get('category') : 'all',
    scope: ['base', 'space'].includes(params.get('scope')) ? params.get('scope') : 'all',
    article: params.get('article'),
  };
}
