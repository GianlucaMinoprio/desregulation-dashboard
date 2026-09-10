(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const fmt = (number) => number.toLocaleString('es-AR');
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const metricLabels = { articulos: 'Artículos alcanzados', normativas: 'Normas alcanzadas', normas: 'Normas de desregulación' };
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  let historyData;
  let metric = 'articulos';
  let selectedMonth = null;
  let chartGeometry;
  const blobs = new Map();

  function dateLabel(date, short = false) {
    const [year, month, day] = date.split('-');
    const name = months[Number(month) - 1];
    return short ? `${name.slice(0, 3)} ${year.slice(2)}` : `${day ? Number(day) + ' de ' : ''}${name} de ${year}`;
  }

  async function readData(name) {
    const embedded = byId(`${name}-data`);
    if (embedded) return JSON.parse(embedded.textContent);
    const response = await fetch(`data/${name}.json`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    return response.json();
  }

  function downloadData(id, data) {
    if (blobs.has(id)) URL.revokeObjectURL(blobs.get(id));
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }));
    blobs.set(id, url);
    byId(id).href = url;
  }

  function setUrl(values) {
    if (location.protocol === 'file:') return;
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(values)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(null, '', url);
  }

  function readUrl() {
    const value = new URLSearchParams(location.search).get('metrica');
    metric = Object.hasOwn(metricLabels, value) ? value : 'articulos';
  }

  function renderHistory() {
    if (!historyData) return;
    const rows = historyData.months;
    const latest = rows[rows.length - 1];
    byId('history-status').hidden = true;
    document.querySelectorAll('[data-metric]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.metric === metric)));
    const width = byId('history-chart').clientWidth || 280;
    const height = 260, left = 51, right = width - 18, top = 16, bottom = height - 34;
    const max = Math.max(...rows.map((row) => row[metric]));
    const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, max / 4)));
    const step = [1, 2, 2.5, 5, 10].map((n) => n * magnitude).find((n) => n >= max / 4);
    const ceiling = step * 4;
    const points = rows.map((row, i) => [left + (right - left) * i / (rows.length - 1), bottom - row[metric] / ceiling * (bottom - top)]);
    const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    const area = `${path} L${right},${bottom} L${left},${bottom} Z`;
    const ticks = Array.from({ length: 5 }, (_, i) => {
      const y = bottom - i / 4 * (bottom - top);
      return `<line class="history-gridline" x1="${left}" x2="${right}" y1="${y}" y2="${y}"/><text class="history-axis" x="${left - 9}" y="${y + 4}" text-anchor="end">${fmt(i * step)}</text>`;
    }).join('');
    const xIndexes = width < 400 ? [0, rows.length - 1] : [0, ...rows.map((row, i) => row.month.endsWith('-12') && i > 0 ? i : -1).filter((i) => i >= 0), rows.length - 1];
    const dates = xIndexes.map((i, index) => `<text class="history-axis" x="${points[i][0]}" y="${height - 13}" text-anchor="${index === 0 ? 'start' : index === xIndexes.length - 1 ? 'end' : 'middle'}">${dateLabel(rows[i].month, true)}</text>`).join('');
    chartGeometry = { width, height, left, right, top, bottom, points };
    byId('history-chart').innerHTML = `<div id="history-tooltip" class="history-tooltip" aria-hidden="true"><span id="history-tooltip-month"></span><strong id="history-tooltip-value"></strong><span id="history-tooltip-delta"></span></div><svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="history-svg-title history-svg-description"><title id="history-svg-title">${escapeHtml(metricLabels[metric])}: evolución mensual</title><desc id="history-svg-description">${rows.length} observaciones desde ${dateLabel(rows[0].month)} (${fmt(rows[0][metric])}) hasta ${dateLabel(latest.month)} (${fmt(latest[metric])}). La escala parte de cero. Usá el selector de mes para consultar cada valor o la tabla que sigue.</desc><g aria-hidden="true">${ticks}<path class="history-area" d="${area}"/><path class="history-line" d="${path}"/>${points.map(([x, y]) => `<circle class="history-point" cx="${x}" cy="${y}" r="2.5"/>`).join('')}<line id="history-cursor" class="history-cursor" y1="16" y2="${bottom}"/><circle id="history-selected-point" class="history-selected-point" r="6"/>${dates}</g></svg>`;
    byId('history-month').max = String(rows.length - 1);
    byId('history-scrubber').hidden = false;
    updateHistorySelection(selectedMonth ?? rows.length - 1);
    const discrepancy = historyData.reconciliation?.find((item) => item.metric === metric);
    byId('history-reconciliation').hidden = !discrepancy;
    if (discrepancy) {
      const previous = discrepancy.report_previous == null ? '' : ` Para ${dateLabel(discrepancy.month)}, la planilla registra ${fmt(discrepancy.series_previous)} y el informe de agosto, ${fmt(discrepancy.report_previous)}.`;
      byId('history-reconciliation').innerHTML = `<summary>Las fuentes difieren en julio de 2026 <span aria-hidden="true">+</span></summary><p>La diferencia entre los acumulados de julio y agosto de esta planilla es +${fmt(discrepancy.series_delta)}. El <a href="${escapeHtml(discrepancy.report_url)}" target="_blank" rel="noopener">informe de agosto<span class="visually-hidden"> (nueva pestaña)</span></a> informa +${fmt(discrepancy.report_delta)}.${previous} Conservamos cada cifra con su fuente; no asumimos el motivo de la diferencia.</p>`;
    }
    byId('history-table').innerHTML = `<table><caption>Totales acumulados al cierre de cada mes · Fuente: Ministerio de Desregulación</caption><thead><tr><th scope="col">Mes</th><th scope="col">Artículos alcanzados</th><th scope="col">Normas alcanzadas</th><th scope="col">Normas de desregulación</th></tr></thead><tbody>${rows.map((row) => `<tr><th scope="row">${dateLabel(row.month)}</th><td>${fmt(row.articulos)}</td><td>${fmt(row.normativas)}</td><td>${fmt(row.normas)}</td></tr>`).join('')}</tbody></table>`;
  }

  function updateHistorySelection(index, { announce = false } = {}) {
    if (!historyData || !chartGeometry) return;
    const rows = historyData.months;
    selectedMonth = Math.max(0, Math.min(rows.length - 1, Math.round(index)));
    const row = rows[selectedMonth];
    const previous = rows[selectedMonth - 1];
    const delta = previous ? row[metric] - previous[metric] : null;
    const change = delta == null ? 'Primer mes de la serie' : delta === 0 ? 'Sin variación mensual' : `${delta > 0 ? '+' : '−'}${fmt(Math.abs(delta))} respecto al mes anterior`;
    const description = `${dateLabel(row.month)}: ${fmt(row[metric])} ${metricLabels[metric].toLowerCase()}. ${change}.`;
    const [x, y] = chartGeometry.points[selectedMonth];
    byId('history-tooltip-month').textContent = dateLabel(row.month);
    byId('history-tooltip-value').textContent = fmt(row[metric]);
    byId('history-tooltip-delta').textContent = change;
    byId('history-tooltip').dataset.direction = delta < 0 ? 'negative' : 'positive';
    byId('history-cursor').setAttribute('x1', x);
    byId('history-cursor').setAttribute('x2', x);
    byId('history-selected-point').setAttribute('cx', x);
    byId('history-selected-point').setAttribute('cy', y);
    byId('history-month').value = String(selectedMonth);
    byId('history-month').setAttribute('aria-valuetext', description);
    byId('history-prev').disabled = selectedMonth === 0;
    byId('history-next').disabled = selectedMonth === rows.length - 1;
    if (announce) byId('history-selection-live').textContent = description;
  }

  function selectMetric(value) {
    if (!Object.hasOwn(metricLabels, value)) return;
    metric = value;
    setUrl({ metrica: value === 'articulos' ? '' : value });
    renderHistory();
  }

  async function loadHistory() {
    byId('history-status').hidden = false;
    byId('history-status').textContent = 'Cargando la serie histórica…';
    try {
      const data = await readData('history');
      if (!Array.isArray(data.months) || data.months.length < 2) throw new Error('Empty monthly series');
      historyData = data;
      renderHistory();
      downloadData('download-history', historyData);
    } catch (error) {
      byId('history-status').hidden = false;
      console.error(error);
      byId('history-status').innerHTML = 'No pudimos cargar la serie. <button type="button" class="inline-retry" id="retry-history">Volver a intentar</button>';
      byId('retry-history').addEventListener('click', async () => { await loadHistory(); if (historyData) document.querySelector(`[data-metric="${metric}"]`).focus(); else byId('retry-history').focus(); });
    }
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-history-metric]');
    if (link) selectMetric(link.dataset.historyMetric);
  });
  document.querySelectorAll('[data-metric]').forEach(button => button.addEventListener('click', () => selectMetric(button.dataset.metric)));
  byId('history-month').addEventListener('input', event => updateHistorySelection(Number(event.target.value)));
  byId('history-prev').addEventListener('click', () => updateHistorySelection(selectedMonth - 1, { announce: true }));
  byId('history-next').addEventListener('click', () => updateHistorySelection(selectedMonth + 1, { announce: true }));
  window.addEventListener('popstate', () => { readUrl(); renderHistory(); });
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width < 1 || Math.abs(entry.contentRect.width - lastWidth) < 1) return;
    lastWidth = entry.contentRect.width;
    renderHistory();
  }).observe(byId('history-chart'));
  readUrl();
  window.desregulacionLoads = window.desregulacionLoads || {};
  window.desregulacionLoads.history = loadHistory();
})();
