// 📸 Script para tomar capturas del Gestor de Incidencias
const { chromium } = require('playwright');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const BASE = 'http://localhost:3000';
const API  = 'http://localhost:8000';
const EMAIL = 'demo@trackflow.com';
const PASSWORD = 'DemoSegura2024!';
const OUT = 'docs/evidence';

(async () => {
  console.log('🔧 Iniciando navegador…');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });

  // ── Login via API, then set token in localStorage ──
  console.log('🔑 Obteniendo token…');
  const resp = await (await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${encodeURIComponent(EMAIL)}&password=${encodeURIComponent(PASSWORD)}`
  })).json();
  const token = resp.access_token;
  console.log(`✅ Token obtenido: ${token.slice(0, 20)}…`);

  // ── Inyectar token y navegar a /incidents ──
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.evaluate((t) => {
    localStorage.setItem('trackflow-access-token', t);
  }, token);
  console.log('✅ Token inyectado en localStorage');

  // ── Navegar a /incidents ──
  await page.goto(`${BASE}/incidents`, { waitUntil: 'networkidle' });
  await sleep(2000);
  console.log('✅ Página de incidencias cargada');

  // ── Helper: asegurar pestaña Gestión ──
  async function ensureGestion() {
    const tabs = page.locator('div[role="tablist"] button');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const text = await tabs.nth(i).textContent();
      if (text && text.trim() === 'Gestión') {
        await tabs.nth(i).click();
        return;
      }
    }
  }

  // ── 1. Screenshot: Error de validación ──
  console.log('📸 1/3 — Error de validación…');
  await ensureGestion();
  await sleep(500);
  // Llenar título minimamente para habilitar botón
  const titleInput = page.locator('#inc-title');
  if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await titleInput.fill(' ');
    await sleep(300);
    await titleInput.fill('Prueba');
    await sleep(300);
  }
  // Limpiar description y branch para forzar errores
  const descInput = page.locator('#inc-description');
  if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await descInput.fill('');
  }
  // Click en "Crear incidencia"
  const crearBtn = page.locator('button.primary-button');
  if (await crearBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await crearBtn.click();
    await sleep(1500);
  }
  await page.screenshot({ path: `${OUT}/01-error-validacion.png`, fullPage: true });
  console.log('   ✅ Guardado');

  // ── 2. Screenshot: Listado con datos ──
  console.log('📸 2/3 — Listado con datos cargados…');
  await page.goto(`${BASE}/incidents`, { waitUntil: 'networkidle' });
  await sleep(3000);
  await ensureGestion();
  await sleep(1000);
  // Scroll hacia abajo para ver lista
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(500);
  await page.screenshot({ path: `${OUT}/02-listado-datos.png`, fullPage: true });
  console.log('   ✅ Guardado');

  // ── 3. Screenshot: Panel de resumen con métricas ──
  console.log('📸 3/3 — Panel de resumen…');
  await page.goto(`${BASE}/incidents`, { waitUntil: 'networkidle' });
  await sleep(3000);
  await ensureGestion();
  await sleep(1000);
  // Scroll arriba para ver resumen
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await page.screenshot({ path: `${OUT}/03-resumen-metricas.png`, fullPage: true });
  console.log('   ✅ Guardado');

  await browser.close();
  console.log('\n✅ Todas las capturas guardadas en docs/evidence/');
})();