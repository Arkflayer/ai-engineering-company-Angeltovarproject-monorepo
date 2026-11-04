/* Supplier directory UI; requires a valid TrackFlow API session. */
(() => {
  const apiBase = (window.TRACKFLOW_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const loginForm = document.querySelector('#login-form');
  const loginMessage = document.querySelector('#auth-message');
  const logoutButton = document.querySelector('#logout-button');
  const directory = document.querySelector('#directory');
  const rows = document.querySelector('#supplier-rows');
  const listMessage = document.querySelector('#list-message');
  const count = document.querySelector('#supplier-count');
  const formMessage = document.querySelector('#form-message');
  const rateFormatter = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const categoryLabels = {
    carrier_last_mile: 'Última milla', carrier_international: 'Internacional',
    warehouse_supplies: 'Suministros de almacén', packaging_materials: 'Embalaje',
    reverse_logistics: 'Logística inversa', fleet_maintenance: 'Mantenimiento de flota',
    it_and_wms_software: 'Software IT/WMS', cleaning_and_facilities: 'Limpieza e instalaciones'
  };
  let token = '';
  let suppliers = [];

  function message(target, text, isError = false) {
    target.textContent = text;
    target.classList.toggle('error', isError);
  }

  async function request(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) }
    });
    if (!response.ok) {
      let detail = `Error HTTP ${response.status}`;
      try {
        const body = await response.json();
        detail = Array.isArray(body.detail) ? body.detail.map((item) => item.msg).join(' ') : body.detail || detail;
      } catch { /* Keep the HTTP status as the useful fallback. */ }
      const error = new Error(detail);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : response.json();
  }

  function render() {
    const country = document.querySelector('#country-filter').value;
    const category = document.querySelector('#category-filter').value;
    const filtered = suppliers.filter((supplier) => (!country || supplier.country === country) && (!category || supplier.categories.includes(category)));
    rows.replaceChildren();
    count.textContent = `${filtered.length} de ${suppliers.length} proveedores`;
    if (!filtered.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 7;
      cell.textContent = 'No hay proveedores que coincidan con los filtros.';
      row.append(cell);
      rows.append(row);
      return;
    }
    for (const supplier of filtered) {
      const row = document.createElement('tr');
      const name = document.createElement('td');
      name.className = 'reference';
      name.textContent = supplier.name;
      const countryCell = document.createElement('td');
      countryCell.textContent = supplier.country;
      const categories = document.createElement('td');
      categories.textContent = supplier.categories.map((item) => categoryLabels[item] || item).join(', ');
      const rate = document.createElement('td');
      rate.textContent = `${rateFormatter.format(supplier.rate_per_shipment)} ${supplier.currency}`;
      const statusCell = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `supplier-status ${supplier.status}`;
      badge.textContent = supplier.status === 'active' ? 'Activo' : 'Suspendido';
      statusCell.append(badge);
      const updated = document.createElement('td');
      updated.textContent = new Date(supplier.updated_at).toLocaleString('es-ES');
      const actions = document.createElement('td');
      actions.className = 'supplier-actions';
      const rateForm = document.createElement('form');
      rateForm.className = 'inline-rate-form';
      const rateInput = document.createElement('input');
      rateInput.type = 'number';
      rateInput.min = '0';
      rateInput.step = 'any';
      rateInput.required = true;
      rateInput.value = supplier.rate_per_shipment;
      rateInput.setAttribute('aria-label', `Nueva tarifa de ${supplier.name} en ${supplier.currency}`);
      const rateButton = document.createElement('button');
      rateButton.className = 'secondary-button';
      rateButton.type = 'submit';
      rateButton.textContent = 'Cambiar tarifa';
      rateForm.append(rateInput, rateButton);
      rateForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!rateForm.reportValidity()) return;
        const newRate = Number(rateInput.value);
        if (!Number.isFinite(newRate) || newRate <= 0) {
          message(listMessage, 'La tarifa debe ser un número mayor que cero.', true);
          return;
        }
        rateButton.disabled = true;
        try {
          await request(`/suppliers/${supplier.id}/rate`, { method: 'PATCH', body: JSON.stringify({ rate_per_shipment: newRate }) });
          if (!await loadSuppliers()) return;
          message(listMessage, `Tarifa actualizada para ${supplier.name}.`);
        } catch (error) { message(listMessage, error.message, true); }
        finally { rateButton.disabled = false; }
      });
      const statusButton = document.createElement('button');
      statusButton.className = 'secondary-button';
      statusButton.type = 'button';
      statusButton.textContent = supplier.status === 'active' ? 'Suspender' : 'Reactivar';
      statusButton.setAttribute('aria-label', `${statusButton.textContent} ${supplier.name}`);
      statusButton.addEventListener('click', async () => {
        statusButton.disabled = true;
        const nextStatus = supplier.status === 'active' ? 'suspended' : 'active';
        try {
          await request(`/suppliers/${supplier.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
          if (!await loadSuppliers()) return;
          message(listMessage, `${supplier.name}: ${nextStatus === 'active' ? 'activo' : 'suspendido'}.`);
        } catch (error) { message(listMessage, error.message, true); }
        finally { statusButton.disabled = false; }
      });
      actions.append(rateForm, statusButton);
      const historyRow = document.createElement('tr');
      historyRow.className = 'supplier-history-row';
      const historyCell = document.createElement('td');
      historyCell.colSpan = 7;
      const historyDetails = document.createElement('details');
      const historySummary = document.createElement('summary');
      historySummary.textContent = 'Historial de suspensiones y reactivaciones';
      const historyList = document.createElement('ul');
      historyList.className = 'supplier-status-history';
      historyDetails.append(historySummary, historyList);
      historyDetails.addEventListener('toggle', async () => {
        if (!historyDetails.open || historyDetails.dataset.loaded) return;
        try {
          const history = await request(`/suppliers/${supplier.id}/status-history`);
          historyList.replaceChildren();
          if (!history.length) {
            const item = document.createElement('li');
            item.textContent = 'Sin cambios de estado registrados.';
            historyList.append(item);
          } else {
            for (const change of history) {
              const item = document.createElement('li');
              const before = change.previous_status === 'active' ? 'Activo' : 'Suspendido';
              const after = change.status === 'active' ? 'Activo' : 'Suspendido';
              item.textContent = `${before} → ${after} · ${new Date(change.changed_at).toLocaleString('es-ES')}`;
              historyList.append(item);
            }
          }
          historyDetails.dataset.loaded = 'true';
        } catch (error) {
          const item = document.createElement('li');
          item.textContent = `No se pudo cargar el historial: ${error.message}`;
          historyList.replaceChildren(item);
        }
      });
      historyCell.append(historyDetails);
      historyRow.append(historyCell);
      row.append(name, countryCell, categories, rate, statusCell, updated, actions);
      rows.append(row, historyRow);
    }
  }

  async function loadSuppliers() {
    const params = new URLSearchParams();
    const country = document.querySelector('#country-filter').value;
    const category = document.querySelector('#category-filter').value;
    if (country) params.set('country', country);
    if (category) params.set('category', category);
    try {
      suppliers = await request(`/suppliers${params.size ? `?${params}` : ''}`);
      render();
      message(listMessage, 'Directorio actualizado.');
      return true;
    } catch (error) {
      message(listMessage, error.message, true);
      if (error.status === 401) logout();
      return false;
    }
  }

  function logout() {
    token = '';
    suppliers = [];
    rows.replaceChildren();
    directory.hidden = true;
    logoutButton.hidden = true;
    loginForm.hidden = false;
    message(loginMessage, 'Sesión cerrada. Inicia sesión para acceder al directorio.');
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: document.querySelector('#login-email').value, password: document.querySelector('#login-password').value })
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'Credenciales no válidas.' : `No se pudo iniciar sesión (HTTP ${response.status}).`);
      token = (await response.json()).access_token;
      loginForm.hidden = true;
      logoutButton.hidden = false;
      directory.hidden = false;
      message(loginMessage, 'Sesión iniciada.');
      await loadSuppliers();
    } catch (error) { message(loginMessage, error.message, true); }
    finally { button.disabled = false; }
  });

  logoutButton.addEventListener('click', logout);
  document.querySelector('#country-filter').addEventListener('change', loadSuppliers);
  document.querySelector('#category-filter').addEventListener('change', loadSuppliers);
  document.querySelector('#clear-filters').addEventListener('click', () => {
    document.querySelector('#country-filter').value = '';
    document.querySelector('#category-filter').value = '';
    loadSuppliers();
  });
  document.querySelector('#refresh-button').addEventListener('click', loadSuppliers);

  document.querySelector('#supplier-country').addEventListener('change', (event) => {
    document.querySelector('#supplier-currency').value = event.target.value === 'USA' ? 'USD' : 'EUR';
  });
  document.querySelector('#supplier-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const selectedCategories = [...document.querySelector('#supplier-categories').selectedOptions].map((option) => option.value);
    const email = document.querySelector('#supplier-email').value.trim();
    const payload = {
      name: document.querySelector('#supplier-name').value.trim(),
      country: document.querySelector('#supplier-country').value,
      categories: selectedCategories,
      rate_per_shipment: Number(document.querySelector('#supplier-rate').value),
      currency: document.querySelector('#supplier-currency').value,
      status: document.querySelector('#supplier-status').value,
      service_zone: document.querySelector('#supplier-zone').value.trim() || null,
      contact_email: email || null,
      notes: document.querySelector('#supplier-notes').value.trim() || null
    };
    if (!payload.name || !Number.isFinite(payload.rate_per_shipment) || payload.rate_per_shipment <= 0 || !payload.categories.length) {
      message(formMessage, 'Revisa el nombre, la tarifa positiva y al menos una categoría.', true);
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await request('/suppliers', { method: 'POST', body: JSON.stringify(payload) });
      form.reset();
      document.querySelector('#supplier-currency').value = 'USD';
      if (await loadSuppliers()) message(formMessage, 'Proveedor registrado correctamente.');
    } catch (error) { message(formMessage, error.message, true); }
    finally { button.disabled = false; }
  });
})();
