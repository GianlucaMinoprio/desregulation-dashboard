(() => {
  'use strict';
  const { escapeHtml, readData } = window.Desregulacion;
  // Provider marks observed on daimo.com; see docs/ai-links.md for provenance.
  const providerIcons = {
  "chatgpt": {
    "viewBox": "0 0 320 320",
    "path": "m297.06 130.97c7.26-21.79 4.76-45.66-6.85-65.48-17.46-30.4-52.56-46.04-86.84-38.68-15.25-17.18-37.16-26.95-60.13-26.81-35.04-.08-66.13 22.48-76.91 55.82-22.51 4.61-41.94 18.7-53.31 38.67-17.59 30.32-13.58 68.54 9.92 94.54-7.26 21.79-4.76 45.66 6.85 65.48 17.46 30.4 52.56 46.04 86.84 38.68 15.24 17.18 37.16 26.95 60.13 26.8 35.06.09 66.16-22.49 76.94-55.86 22.51-4.61 41.94-18.7 53.31-38.67 17.57-30.32 13.55-68.51-9.94-94.51zm-120.28 168.11c-14.03.02-27.62-4.89-38.39-13.88.49-.26 1.34-.73 1.89-1.07l63.72-36.8c3.26-1.85 5.26-5.32 5.24-9.07v-89.83l26.93 15.55c.29.14.48.42.52.74v74.39c-.04 33.08-26.83 59.9-59.91 59.97zm-128.84-55.03c-7.03-12.14-9.56-26.37-7.15-40.18.47.28 1.3.79 1.89 1.13l63.72 36.8c3.23 1.89 7.23 1.89 10.47 0l77.79-44.92v31.1c.02.32-.13.63-.38.83l-64.41 37.19c-28.69 16.52-65.33 6.7-81.92-21.95zm-16.77-139.09c7-12.16 18.05-21.46 31.21-26.29 0 .55-.03 1.52-.03 2.2v73.61c-.02 3.74 1.98 7.21 5.23 9.06l77.79 44.91-26.93 15.55c-.27.18-.61.21-.91.08l-64.42-37.22c-28.63-16.58-38.45-53.21-21.95-81.89zm221.26 51.49-77.79-44.92 26.93-15.54c.27-.18.61-.21.91-.08l64.42 37.19c28.68 16.57 38.51 53.26 21.94 81.94-7.01 12.14-18.05 21.44-31.2 26.28v-75.81c.03-3.74-1.96-7.2-5.2-9.06zm26.8-40.34c-.47-.29-1.3-.79-1.89-1.13l-63.72-36.8c-3.23-1.89-7.23-1.89-10.47 0l-77.79 44.92v-31.1c-.02-.32.13-.63.38-.83l64.41-37.16c28.69-16.55 65.37-6.7 81.91 22 6.99 12.12 9.52 26.31 7.15 40.1zm-168.51 55.43-26.94-15.55c-.29-.14-.48-.42-.52-.74v-74.39c.02-33.12 26.89-59.96 60.01-59.94 14.01 0 27.57 4.92 38.34 13.88-.49.26-1.33.73-1.89 1.07l-63.72 36.8c-3.26 1.85-5.26 5.31-5.24 9.06l-.04 89.79zm14.63-31.54 34.65-20.01 34.65 20v40.01l-34.65 20-34.65-20z",
    "rule": "nonzero"
  },
  "claude": {
    "viewBox": "0 0 24 24",
    "path": "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z",
    "rule": "nonzero"
  },
  "grok": {
    "viewBox": "0 0 24 24",
    "path": "M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815",
    "rule": "evenodd"
  }
};
  const providers = [
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', parameter: 'q' },
    { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', parameter: 'q' },
    { id: 'grok', name: 'Grok', url: 'https://grok.com/', parameter: 'q' }
  ];

  function placeTooltip(choice) {
    const tooltip = choice.querySelector('.ai-provider-tooltip');
    tooltip.style.setProperty('--tooltip-offset', '0px');
    const rect = tooltip.getBoundingClientRect();
    const offset = Math.max(24 - rect.left, Math.min(0, window.innerWidth - 24 - rect.right));
    tooltip.style.setProperty('--tooltip-offset', `${offset}px`);
  }

  window.addEventListener('resize', () => {
    document.querySelectorAll('.ai-provider-choice').forEach(placeTooltip);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.ai-provider-choice').forEach((choice) => {
        choice.dataset.tooltipDismissed = 'true';
      });
    }
  });

  function showManualCopy(helper) {
    const fallback = helper.querySelector('.ai-manual-copy');
    fallback.hidden = false;
    const field = fallback.querySelector('textarea');
    field.focus({ preventScroll: true });
    field.select();
  }

  async function copyPrompt(helper, prompt) {
    const status = helper.querySelector('.ai-copy-status');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(prompt);
      helper.querySelector('.ai-manual-copy').hidden = true;
      status.textContent = 'Prompt copiado. Pegalo en tu IA para empezar.';
    } catch {
      showManualCopy(helper);
      status.textContent = 'Copiá el texto seleccionado y pegalo en tu IA para empezar.';
    }
    status.hidden = false;

  }

  async function populate(helper, channel) {
    const content = helper.querySelector('.ai-helper-content');
    content.setAttribute('aria-busy', 'true');
    content.innerHTML = '<p role="status">Preparando el mensaje…</p>';
    try {
      const data = await readData('participation-prompts');
      const prompt = data[channel];
      if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('Missing conversation starter');
      const links = providers.map((provider) => {
        const url = new URL(provider.url);
        url.searchParams.set(provider.parameter, prompt);
        const icon = providerIcons[provider.id];
        const isClaude = provider.id === 'claude';
        const tooltipId = `ai-claude-note-${channel}`;
        const label = `<span>${provider.name}</span>`;
        const link = `<a class="ai-provider" data-provider="${provider.id}" ${isClaude ? `aria-describedby="${tooltipId}"` : ''} href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer"><svg class="ai-provider-logo" viewBox="${icon.viewBox}" fill="currentColor" fill-rule="${icon.rule}" aria-hidden="true" focusable="false"><path d="${icon.path}"/></svg>${label}<svg class="ai-provider-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="visually-hidden">(abrir con el prompt en una pestaña nueva)</span></a>`;
        return isClaude ? `<span class="ai-provider-choice">${link}<span class="ai-provider-tooltip" id="${tooltipId}" role="tooltip">Claude no nos da buena espina. El prompt igual es para vos 😉</span></span>` : link;
      }).join('');
      content.innerHTML = `<p>Contale tu problema. La IA te ayudará a preparar ${channel === 'igj' ? 'el documento para adjuntar a la consulta' : 'las respuestas del formulario'} y usará su memoria si está habilitada.</p>
        <div class="ai-providers" role="group" aria-label="Elegí una IA para ${channel === 'igj' ? 'la consulta de la IGJ' : 'reportar una norma'}">${links}</div>
        <div class="ai-prompt-actions"><button class="ai-copy-button" type="button" data-ai-copy>Copiar prompt</button>
        <p class="ai-copy-status" id="ai-copy-status-${channel}" role="status" aria-live="polite" hidden></p>
        <div class="ai-manual-copy" hidden><label for="ai-prompt-${channel}">Copiá este mensaje y pegalo en tu IA</label><textarea id="ai-prompt-${channel}" aria-describedby="ai-copy-status-${channel}" rows="8" readonly spellcheck="false" autocomplete="off">${escapeHtml(prompt)}</textarea></div></div>`;
      content.querySelector('[data-ai-copy]').addEventListener('click', () => copyPrompt(helper, prompt));
      const choice = content.querySelector('.ai-provider-choice');
      const resetTooltip = () => {
        delete choice.dataset.tooltipDismissed;
        placeTooltip(choice);
      };
      choice.addEventListener('mouseenter', resetTooltip);
      choice.addEventListener('focusin', resetTooltip);
    } catch {
      content.innerHTML = '<p role="status">No pudimos cargar el prompt. Podés seguir usando el formulario oficial.</p><button class="button button-outline" type="button" data-ai-retry>Volver a intentar</button>';
      content.querySelector('[data-ai-retry]').addEventListener('click', async () => {
        await populate(helper, channel);
        content.querySelector('a, button')?.focus();
      });
    } finally {
      content.setAttribute('aria-busy', 'false');
    }
  }

  function mount(root = document) {
    root.querySelectorAll('[data-ai-channel]:not([data-ai-mounted])').forEach((slot) => {
      slot.dataset.aiMounted = 'true';
      const channel = slot.dataset.aiChannel;
      slot.innerHTML = `<details class="ai-helper" id="ai-${escapeHtml(channel)}"><summary>Prepará tu propuesta con IA <span aria-hidden="true">+</span></summary><div class="ai-helper-content"></div></details>`;
      const helper = slot.querySelector('details');
      helper.addEventListener('toggle', () => {
        if (helper.open && !helper.dataset.started) {
          helper.dataset.started = 'true';
          populate(helper, channel);
        }
      });
    });
  }

  window.DesregulacionAI = { mount };
  mount();
})();
