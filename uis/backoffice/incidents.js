'use strict';

(() => {
  const form = document.querySelector('#upload-form');
  const fileInput = document.querySelector('#csv-file');
  const fileName = document.querySelector('#file-name');
  const message = document.querySelector('#analysis-message');
  const button = document.querySelector('#analyze-button');
  const results = document.querySelector('#results');
  const loginForm = document.querySelector('#login-form');
  const loginButton = document.querySelector('#login-button');
  const authMessage = document.querySelector('#auth-message');
  const logoutButton = document.querySelector('#logout-button');
  const URL_SERVICIO = window.TRACKFLOW_API_URL || 'http://localhost:8000';
  let accessToken = null;
  let hasResults = false;

  const setSession = (token) => {
    accessToken = token;
    const authenticated = Boolean(token);
    button.disabled = !authenticated;
    document.querySelector('#export-button').disabled = !authenticated || !hasResults;
    loginForm.hidden = authenticated;
    logoutButton.hidden = !authenticated;
    authMessage.textContent = authenticated
      ? 'Sesión iniciada. El token se conserva solo en memoria mientras esta página permanezca abierta.'
      : 'Inicia sesión con tu cuenta de TrackFlow para habilitar el análisis.';
    authMessage.className = 'analysis-message';
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginButton.disabled = true;
    authMessage.textContent = 'Verificando credenciales…';
    authMessage.className = 'analysis-message';
    try {
      const response = await fetch(`${URL_SERVICIO}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.querySelector('#login-email').value,
          password: document.querySelector('#login-password').value,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'No se pudo iniciar sesión.');
      loginForm.reset();
      setSession(payload.access_token);
    } catch (error) {
      authMessage.textContent = error instanceof TypeError
        ? 'No fue posible conectar con el servicio de autenticación.'
        : error.message;
      authMessage.className = 'analysis-message error';
    } finally {
      loginButton.disabled = false;
    }
  });

  logoutButton.addEventListener('click', () => {
    accessToken = null;
    hasResults = false;
    results.hidden = true;
    setSession(null);
  });

  const escapeText = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  fileInput.addEventListener('change', () => {
    fileName.textContent = fileInput.files[0]?.name || 'Ningún archivo seleccionado';
  });

  const renderRows = (target, data, total) => {
    const element = document.querySelector(target);
    const entries = Object.entries(data || {});
    element.innerHTML = entries.map(([label, count]) => {
      const pct = total ? ` <span>${(Number(count) * 100 / total).toFixed(1)}%</span>` : '';
      return `<div class="breakdown-row"><span>${escapeText(label)}</span><strong>${escapeText(count)}${pct}</strong></div>`;
    }).join('') || '<p class="empty-breakdown">Sin valores para mostrar.</p>';
  };

  const render = (summary, source) => {
    const invalidLabels = summary.invalid_labels || {};
    const valueNames = {
      LOST_PARCEL: 'Paquete perdido',
      DELAYED_DELIVERY: 'Entrega retrasada',
      WRONG_ADDRESS: 'Dirección incorrecta',
      RETURN_REQUEST: 'Solicitud de devolución',
      DAMAGE: 'Daño en el paquete',
      OPEN: 'Abierta',
      CLOSED: 'Cerrada',
      DISCARDED: 'Descartada',
    };
    const ruleNames = {
      tracking_number: 'Número de seguimiento faltante o inválido',
      carrier: 'Transportista no válido para el país',
      category: 'Categoría faltante o inválida',
      email: 'Correo electrónico faltante o inválido',
      closed_no_score: 'Incidente cerrado sin puntuación',
      score_range: 'Puntuación fuera del rango de 1 a 5',
      incident_id: 'Identificador de incidencia inválido',
      duplicate_id: 'Identificador de incidencia duplicado',
      date: 'Fecha faltante o inválida',
      country: 'País faltante o inválido',
      customer_type: 'Tipo de cliente faltante o inválido',
      description: 'Descripción faltante o inválida',
      status: 'Estado faltante o inválido',
    };
    const cards = [
      ['Registros procesados', summary.total_records, 'Total del archivo'],
      ['Registros válidos', summary.valid_records, 'Incluidos en métricas'],
      ['Registros inválidos', summary.invalid_records, 'Excluidos del análisis'],
      ['Satisfacción media', summary.satisfaction.average == null ? 'No disponible' : `${Number(summary.satisfaction.average).toFixed(2)} / 5`, `${summary.satisfaction.scored_incidents} puntuaciones`],
    ];
    document.querySelector('#summary-metrics').innerHTML = cards.map(([title, value, foot]) => `<article class="metric-card"><div class="metric-top">${escapeText(title)}</div><p class="metric-value">${escapeText(value)}</p><p class="metric-foot">${escapeText(foot)}</p></article>`).join('');
    document.querySelector('#result-source').textContent = `Archivo analizado: ${source}`;
    document.querySelector('#invalid-notice').textContent = summary.invalid_records
      ? `Se encontraron ${summary.invalid_records} registros inválidos o incompletos. Fueron excluidos del análisis principal; consulta el desglose por regla.`
      : 'No se encontraron registros inválidos.';
    renderRows('#category-breakdown', Object.fromEntries(Object.entries(summary.by_category).map(([key, count]) => [valueNames[key] || key, count])), summary.valid_records);
    renderRows('#status-breakdown', Object.fromEntries(Object.entries(summary.by_status).map(([key, count]) => [valueNames[key] || key, count])), summary.valid_records);
    renderRows('#country-breakdown', summary.by_country, summary.valid_records);
    const sat = summary.satisfaction;
    const satisfactionRows = { 'Promedio (escala 1–5)': sat.average == null ? 'No disponible' : `${Number(sat.average).toFixed(2)} / 5`, 'Puntuaciones registradas': `${sat.scored_incidents} de ${sat.closed_incidents} cerrados`, ...Object.fromEntries(Object.entries(sat.by_score).map(([score, count]) => [`Puntuación ${score}`, count])) };
    renderRows('#satisfaction-breakdown', satisfactionRows, null);
    renderRows('#invalid-breakdown', Object.fromEntries(Object.entries(summary.invalid_breakdown || {}).map(([key, count]) => [ruleNames[key] || invalidLabels[key] || key, count])), null);
    results.hidden = false;
    hasResults = true;
    document.querySelector('#export-button').disabled = false;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file) return;
    if (!accessToken) {
      message.textContent = 'Inicia sesión antes de analizar un archivo.';
      message.className = 'analysis-message error';
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      message.textContent = 'Selecciona un archivo con extensión .csv.';
      message.className = 'analysis-message error';
      return;
    }
    const body = new FormData();
    body.append('file', file);
    button.disabled = true;
    message.textContent = 'Analizando archivo…';
    message.className = 'analysis-message';
    try {
      const response = await fetch(`${URL_SERVICIO}/api/incidents/analyze`, {
        method: 'POST', body, headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await response.json();
      if (response.status === 401) {
        setSession(null);
        throw new Error('La sesión caducó. Inicia sesión nuevamente.');
      }
      if (!response.ok) throw new Error(payload.detail || 'No se pudo analizar el archivo.');
      render(payload, file.name);
      message.textContent = 'Análisis completado. Los datos se muestran de forma agregada.';
    } catch (error) {
      message.textContent = error instanceof TypeError
        ? 'No fue posible conectar con el servicio. Verifica que esté iniciado y permita el acceso desde esta página.'
        : error.message;
      message.className = 'analysis-message error';
    } finally {
      button.disabled = false;
    }
  });

  document.querySelector('#export-button').addEventListener('click', async () => {
    if (!hasResults) return;
    const exportButton = document.querySelector('#export-button');
    exportButton.disabled = true;
    try {
      const response = await fetch(`${URL_SERVICIO}/api/incidents/results/export`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const payload = await response.json();
        if (response.status === 401) setSession(null);
        throw new Error(payload.detail || 'No se pudo exportar el resultado.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'results.csv';
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      message.textContent = 'CSV agregado descargado.';
      message.className = 'analysis-message';
    } catch (error) {
      message.textContent = error.message;
      message.className = 'analysis-message error';
    } finally {
      exportButton.disabled = false;
    }
  });

  const drop = document.querySelector('.file-drop');
  for (const eventName of ['dragenter', 'dragover']) {
    drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.classList.add('dragging'); });
  }
  for (const eventName of ['dragleave', 'drop']) {
    drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.classList.remove('dragging'); });
  }
  drop.addEventListener('drop', (event) => {
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  });
})();
