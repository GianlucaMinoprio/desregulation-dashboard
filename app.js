async function load() {
  const res = await fetch("data/august-2026.json");
  const data = await res.json();
  renderKpis(data.totals);
  renderBars(data.articulos_ultimos_3_meses);
  renderSectors(data.sectores);
  renderExamples(data.ejemplos_destacados);
  document.getElementById("source-quote").textContent = `“${data.source.text}”`;
}

function fmt(n) {
  return n.toLocaleString("es-AR");
}

function renderKpis(t) {
  const items = [
    { label: "Normas de desregulación", ...t.normas_desregulacion },
    { label: "Normas modificadas o eliminadas", ...t.normas_modificadas_o_eliminadas },
    { label: "Artículos modificados o eliminados", ...t.articulos_modificados_o_eliminados },
  ];
  const el = document.getElementById("kpis");
  el.innerHTML = items.map((k) => `
    <article class="kpi">
      <div class="label">${k.label}</div>
      <div class="value">${fmt(k.value)}</div>
      <div class="delta">+${fmt(k.delta_month)} este mes</div>
    </article>
  `).join("");
}

function renderBars(rows) {
  const max = Math.max(...rows.map((r) => r.value));
  const el = document.getElementById("bars");
  el.innerHTML = rows.map((r) => {
    const pct = Math.max(8, (r.value / max) * 100);
    const delta = r.delta != null ? `<span class="d">+${fmt(r.delta)}</span>` : "";
    return `
      <div class="bar-row">
        <div class="bar-label">${r.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-meta">${fmt(r.value)}${delta}</div>
      </div>`;
  }).join("");
}

function renderSectors(sectors) {
  const max = Math.max(...sectors.map((s) => s.normas));
  const el = document.getElementById("sectors");
  el.innerHTML = sectors.map((s) => {
    const pct = (s.normas / max) * 100;
    return `
      <div class="sector">
        <div class="sector-name">${s.name}</div>
        <div class="sector-n">${fmt(s.normas)}</div>
        <div class="sector-track"><div class="sector-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join("");
}

function renderExamples(list) {
  const el = document.getElementById("examples");
  el.innerHTML = list.map((e) => `
    <li>
      <div class="n">${e.n}</div>
      <div>
        <div class="norma">${e.norma}</div>
        <h3>${e.titulo}</h3>
        <p>${e.detalle}</p>
      </div>
    </li>
  `).join("");
}

load().catch((err) => {
  console.error(err);
  document.querySelector(".lede").textContent = "No se pudo cargar data/august-2026.json";
});
