(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const interests = ['todos', 'cotidiana', 'producir', 'transporte', 'invertir'];
  const kindLabels = { norma: 'Norma de referencia', medida: 'Medida del informe', informe: 'Informe mensual', comunicado: 'Comunicado oficial' };
  const portable = document.documentElement.hasAttribute('data-portable');
  const base = document.documentElement.dataset.assetBase || '';
  const reads = new Map(), downloads = new Map();
  let localSearch = null;
  const params = () => {
    const values = new URLSearchParams(localSearch ?? location.search);
    if (values.get('tema') === 'emprender') values.set('tema', 'producir');
    return values;
  };
  function readData(name) {
    if (reads.has(name)) return reads.get(name);
    const promise = (async () => {
      const embedded = byId(`${name}-data`);
      if (embedded) return JSON.parse(embedded.textContent);
      const response = await fetch(`${base}data/${name}.json`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
      return response.json();
    })().catch(error => { reads.delete(name); throw error; });
    reads.set(name, promise); return promise;
  }
  function setParams(values, { hash, push = false } = {}) {
    const url = new URL(location.href);
    url.search = params().toString();
    for (const [key, value] of Object.entries(values)) value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    if (hash) url.hash = hash;
    try { history[push ? 'pushState' : 'replaceState'](null, '', url); localSearch = null; }
    catch { localSearch = url.search; if (hash) location.hash = hash; }
  }
  function archiveParams() {
    const current = params(), mapped = new URLSearchParams();
    const legacy = current.get('vista') === 'publicaciones';
    const values = {
      archivo: legacy ? current.get('q') : current.get('archivo'),
      anio: legacy ? current.get('periodo') : current.get('anio'),
      tema: current.get('tema'), tipo: current.get('tipo'),
      orden: legacy ? current.get('ordenar') : current.get('orden')
    };
    for (const [key, value] of Object.entries(values)) if (value && value !== 'todos' && value !== 'destacados' && value !== 'recientes') mapped.set(key, value);
    return mapped;
  }
  function redirectLegacy() {
    if (portable || document.documentElement.dataset.page === 'archive') return false;
    if (location.hash !== '#archivo' && params().get('vista') !== 'publicaciones') return false;
    const url = new URL('archivo/', location.href);
    url.search = archiveParams().toString(); url.hash = 'archivo';
    location.replace(url); return true;
  }
  function downloadData(id, data) {
    if (downloads.has(id)) URL.revokeObjectURL(downloads.get(id));
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], {type:'application/json'}));
    downloads.set(id,url); byId(id).href=url;
  }
  function publicationTopics(entry, citizen) {
    const explained = citizen?.entries.find((e) => e.archive_id === entry.id);
    if (explained) return explained.intereses;
    if (entry.kind === 'norma' || entry.kind === 'informe') return interests.slice(1);
    const text = normalize(`${entry.title} ${entry.description}`);
    const rules = {
      cotidiana: /alquiler|vivienda|consum|medicament|salud|higiene|cosmetic|alimento|pasajer|licencia|vehicul|auto|educaci|escolar|titulo|turis|celular|internet|telecom|pago|boleto|cine|cultur|menores/,
      producir: /producci|product|industr|agro|comerci|export|import|maquin|insumo|ganad|semilla|faena|fertiliz|energia|minera|alimento|vivero|laboratorio|empresa|emprend|pyme|marca|sociedad|igj|negocio|financ|credito|crowdfunding|postal|contratista|licencias tic/,
      transporte: /transport|logistic|aer|navega|maritim|buque|barco|embarca|puerto|vehicul|auto|rampa|correo|postal|pasajer|vuelo|pilotaje|courier/,
      invertir: /inversi|capital|financ|credito|banc|cnv|pagar|fideicomiso|acciones|crowdfunding|fondos comunes|valores/,
    };
    return Object.entries(rules).filter(([, pattern]) => pattern.test(text)).map(([key]) => key);
  }

  window.Desregulacion = { byId, escapeHtml, normalize, interests, kindLabels, readData, params, setParams, archiveParams, redirectLegacy, downloadData, publicationTopics, portable, homeHref: hash => `${portable ? '' : base}${hash}` };
})();
