import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import Plan from '../public/plan.js';
import Riesgos from '../public/riesgos.js';

const leer = ruta => readFileSync(new URL('../public/' + ruta, import.meta.url), 'utf8');
function montar(nombre, consulta = '', base = 'base') {
  const vistas = new Map();
  const todos = [];
  class Nodo {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.dataset = {}; this.attrs = {}; this.className = ''; this._texto = ''; this.classList = {add() {}, remove() {}, toggle() {}}; todos.push(this); }
    set textContent(t) { this._texto = String(t); this.children = []; }
    get textContent() { return this._texto + this.children.map(n => typeof n === 'string' ? n : n.textContent).join(''); }
    append(...ns) { ns.forEach(n => { if (typeof n === 'object') n.parentElement = this; this.children.push(n); }); }
    replaceChildren(...ns) { this.children.forEach(n => { if (typeof n === 'object') n.parentElement = null; }); this.children = []; this._texto = ''; this.append(...ns); }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener() {}
    focus() { document.activeElement = this; }
    get isConnected() { return this === document.body || !!this.parentElement?.isConnected; }
    querySelectorAll(s) {
      const resultado = [];
      const coincide = n => s.startsWith('[data-') ? Object.hasOwn(n.dataset, s.slice(6, -1)) : s.startsWith('.') ? n.className.split(' ').includes(s.slice(1)) : n.tagName === s.toUpperCase();
      const recorrer = padre => padre.children.forEach(n => { if (typeof n !== 'object') return; if (coincide(n)) resultado.push(n); recorrer(n); });
      recorrer(this); return resultado;
    }
    querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  }
  const document = {documentElement: new Nodo('html'), createElement: t => new Nodo(t), createElementNS: (_, t) => new Nodo(t), addEventListener() {}, querySelectorAll: () => [], getElementById: id => todos.find(n => n.isConnected && n.id === id)};
  document.body = new Nodo('body');
  const contexto = {document, Plan, Riesgos, URLSearchParams, Intl, location: {search: '', hash: ''}, queueMicrotask, matchMedia: () => ({matches: true})}; contexto.window = contexto;
  vm.runInNewContext(leer('app.js'), contexto);
  const App = contexto.App;
  const datos = Object.fromEntries(Object.entries({plan: 'data/plan.json', caso: 'data/caso.json', derechos: 'data/derechos.json', riesgos: 'data/riesgos.json', estandares: 'data/estandares.json', criticidad: 'config/criticidad-config.json', planConfig: 'config/plan-config.json'}).map(([k, p]) => [k, JSON.parse(leer(p))]));
  App.datos = datos; App.estadoBase = () => base; App.registrarVista = (n, v) => vistas.set(n, v);
  App.guardarAccion = async (id, cambios) => { const r = Plan.aplicarCambio(datos.plan.find(a => a.id === id), cambios, datos.planConfig, '2026-10-02'); assert.equal(r.ok, true); datos.plan = datos.plan.map(a => a.id === id ? r.accion : a); return r.accion; };
  vm.runInNewContext(leer('vista-' + nombre + '.js'), contexto);
  const raiz = new Nodo('main'); document.body.append(raiz);
  vistas.get(nombre).render(raiz, datos, {filtros: new URLSearchParams(consulta), id: nombre === 'riesgos' ? 'riesgo-01' : undefined});
  return {raiz, datos, contexto, todos, document};
}

test('Plan: panel con avance global, estados y seis pilares; ficha de pilar; ficha de acción con edición', async () => {
  const v = montar('plan');
  assert.equal(v.raiz.querySelectorAll('.plan-pilar').length, 6);
  assert.deepEqual(v.raiz.querySelectorAll('.plan-chip').map(b => b.dataset.estado), ['pendiente', 'en-curso', 'cumplida', 'vencida']);
  assert.match(v.raiz.querySelector('.plan-global-cifra').textContent, /%/);
  // Ficha de pilar: tabla Acción | Responsable | Plazo de entrega | Estado
  const p = montar('plan', 'pilar=componente-1');
  const ficha = p.document.body.querySelector('.plan-ficha');
  assert.deepEqual(ficha.querySelector('thead').querySelectorAll('th').map(n => n.textContent), ['Acción', 'Responsable', 'Plazo de entrega', 'Estado']);
  assert.equal(ficha.querySelector('tbody').children.length, p.datos.plan.filter(a => a.componente === 'componente-1').length);
  // Ficha de acción: soporte activo solo si está completada; Actualizar habilita y guarda.
  const pend = v.datos.plan.find(a => a.estado === 'pendiente'), comp = v.datos.plan.find(a => a.estado === 'cumplida');
  const fc = montar('plan', 'accion=' + comp.id).document.body.querySelector('.plan-ficha');
  assert.notEqual(fc.querySelector('.plan-soporte').attrs['aria-disabled'], 'true');
  const a = montar('plan', 'accion=' + pend.id);
  const fa = a.document.body.querySelector('.plan-ficha');
  assert.equal(fa.querySelector('.plan-soporte').attrs['aria-disabled'], 'true');
  const inputs = () => fa.querySelectorAll('.plan-input');
  assert.ok(inputs().every(n => n.hidden));
  const boton = fa.querySelector('.plan-actualizar');
  await boton.onclick();
  assert.ok(inputs().every(n => !n.hidden));
  a.document.getElementById('plan-campo-responsable').value = 'Gerencia de Personas';
  a.document.getElementById('plan-campo-estado').value = 'en-curso';
  await fa.querySelector('.plan-actualizar').onclick();
  const guardada = a.datos.plan.find(x => x.id === pend.id);
  assert.equal(guardada.responsable, 'Gerencia de Personas');
  assert.equal(guardada.estado, 'en-curso');
  // Sin conexión: Actualizar deshabilitado.
  const sin = montar('plan', 'accion=' + pend.id, 'respaldo');
  assert.equal(sin.document.body.querySelector('.plan-actualizar').disabled, true);
});

test('Riesgos identificados: conteos, mapa gravedad × probabilidad y ficha del boceto con sus dos subfichas', () => {
  const v = montar('riesgos');
  const conteos = v.raiz.querySelectorAll('.rie-conteo');
  assert.equal(conteos.length, 4);
  assert.deepEqual(conteos.map(b => b.querySelector('strong').textContent), ['18', '1', '8', '9']);
  const celdas = v.raiz.querySelectorAll('.rie-celda');
  assert.equal(celdas.length, 9);
  assert.ok(celdas.every(n => n.attrs['aria-label'].startsWith('Gravedad ')));
  assert.equal(v.raiz.querySelectorAll('.rie-mini').length, 18);
  // Ficha de riesgo-01 (evaluación dominante: gravedad Media, probabilidad media → priorización Media).
  const ficha = v.document.body.querySelector('.rie-ficha');
  assert.equal(ficha.attrs.role, 'dialog');
  assert.equal(ficha.querySelector('h2').textContent, v.datos.riesgos.find(r => r.id === 'riesgo-01').nombre);
  assert.match(ficha.querySelector('.rie-prio').textContent, /Nivel de priorización.*Media/);
  const estandares = ficha.querySelector('.rie-estandares').querySelectorAll('li').map(n => n.textContent);
  assert.deepEqual(estandares, v.datos.derechos.derechos['Derecho a la vida']);
  assert.match(ficha.textContent, /Relación con la organización.*Causa/);
  assert.doesNotMatch(ficha.textContent, /\b1\. /);
  const subs = ficha.querySelectorAll('.rie-boton-sub');
  assert.equal(subs.length, 2);
  const zona = ficha.querySelector('.rie-subficha');
  assert.equal(zona.hidden, true);
  subs[1].onclick();
  assert.equal(zona.hidden, false);
  const filas = zona.querySelector('tbody').children;
  assert.equal(filas.length, Riesgos.accionesDe('riesgo-01', v.datos.plan).length);
  assert.ok(zona.querySelector('.rie-responsables').querySelectorAll('li').length >= 1);
  subs[0].onclick();
  assert.match(zona.textContent, /Análisis de los mecanismos de control/);
});
