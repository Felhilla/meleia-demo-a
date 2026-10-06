import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../public/estandares.js');
const estandares = require('../public/data/estandares.json');
const evaluaciones = require('../public/data/evaluaciones.json');
const umbrales = require('../public/config/umbrales-config.json');
const dimensiones = require('../public/data/dimensiones.json');
const ejes = estandares.ejes;
// DOM mínimo para verificar contratos de la vista sin navegador, dependencias ni red.
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
async function montar({estado = 'base', guardar = async () => {}, plan = [], base = [], filtros = '', datos = {}} = {}) {
  const todos = [];
  class Nodo {
    constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.dataset = {}; this.style = {}; this.eventos = {}; this._texto = ''; todos.push(this); }
    set textContent(t) { this._texto = String(t); this.children = []; }
    get textContent() { return this._texto + this.children.map(n => n.textContent).join(''); }
    append(...nodos) { for (const n of nodos) { n.parent = this; this.children.push(n); } }
    prepend(n) { n.parent = this; this.children.unshift(n); }
    replaceChildren(...n) { for (const c of this.children) c.parent = null; this.children = []; this.append(...n); }
    setAttribute(k,v) { this.attrs[k] = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(k,fn) { this.eventos[k] = fn; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); this.parent = null; }
    get lastChild() { return this.children.at(-1); }
    get isConnected() { return this === document.body || !!this.parent?.isConnected; }
    focus() { document.activeElement = this; }
    scrollIntoView() {}
    showModal() { this.open = true; }
    close() { this.open = false; this.eventos.close?.(); }
    matches(s) { return s.startsWith('#') ? this.id === s.slice(1) : s.startsWith('.') ? s.slice(1).split('.').every(c => (this.className || this.attrs.class || '').split(/\s+/).includes(c)) : this.tag === s; }
    querySelectorAll(s) { return this.children.flatMap(n => [...(n.matches(s) ? [n] : []), ...n.querySelectorAll(s)]); }
    querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  }
  const document = {createElement: t => new Nodo(t), createElementNS: (_,t) => new Nodo(t)};
  document.createTextNode = texto => { const n = new Nodo('#text'); n.textContent = texto; return n; };
  document.body = new Nodo('body'); document.body.classList = {add() {}, remove() {}};
  // La ficha del eje es una ventana sobre el documento: escucha Esc y vuelve inertes las regiones.
  const teclas = []; document.addEventListener = (k, fn) => { if (k === 'keydown') teclas.push(fn); }; document.removeEventListener = () => {};
  document.querySelectorAll = () => [];
  const contenedor = new Nodo('main'); document.body.append(contenedor);
  const api = {estado, list: async () => base, set: guardar}; let vista, ruta;
  const App = {el: (tag,texto,clase) => {const n = new Nodo(tag); if (texto != null) n.textContent = texto; n.className = clase; return n;}, registrarVista: (_,v) => {vista = v;}, obtenerPlan: () => plan};
  const contexto = {matchMedia: () => ({matches:true}), App, Estandares:E, GHDatos:api, document, URLSearchParams, Intl, history:{replaceState: (_, __, url) => {ruta = url;}}}; contexto.window = contexto;
  vm.runInNewContext(readFileSync(new URL('../public/vista-estandares.js', import.meta.url), 'utf8'), contexto);
  const limpiar = vista.render(contenedor, {estandares, evaluaciones, umbrales, dimensiones, planConfig:require('../public/config/plan-config.json'), ...datos}, {filtros:new URLSearchParams(filtros)});
  await new Promise(resolve => setImmediate(resolve));
  const buscar = pred => todos.find(n => n.isConnected && pred(n));
  const boton = texto => buscar(n => n.tag === 'button' && n.textContent === texto);
  const campo = id => buscar(n => n.id === 'e3-campo-' + id);
  const ficha = () => document.body.querySelector('.dim-ficha');
  return {document, todos, contenedor, limpiar, buscar, boton, campo, ficha, teclas, ruta:() => ruta};
}

test('dimensiones: dos grandes y los 16 ejes, síntesis completas y frases de hasta 20 palabras', () => {
  assert.equal(dimensiones.grandes.length, 2);
  assert.deepEqual(dimensiones.grandes.map(g => g.id), ['etapas-ocde', 'temas-ddhh']);
  assert.equal(Object.keys(dimensiones.ejes).length, 16);
  assert.deepEqual(Object.keys(dimensiones.ejes).sort(), ejes.map(e => e.id).sort());
  const frase = (texto, contexto) => {
    assert.equal(typeof texto, 'string', contexto);
    assert.ok(texto.trim().length > 0, contexto);
    assert.ok(texto.trim().split(/\s+/).length <= 20, `${contexto}: ${texto}`);
  };
  for (const [id, info] of [...dimensiones.grandes.map(g => [g.id, g]), ...Object.entries(dimensiones.ejes)]) {
    for (const campo of ['hallazgos', 'brechas', 'estandares']) {
      assert.ok(Array.isArray(info[campo]) && info[campo].length > 0, `${id}.${campo}`);
      info[campo].forEach(t => frase(t, `${id}.${campo}`));
    }
    for (const campo of dimensiones.ejes[id] ? ['corto'] : ['titulo', 'pregunta']) frase(info[campo], `${id}.${campo}`);
  }
});
test('promedioDimension: media por eje, ceros, decimales, faltantes y pureza', () => {
  const evaluacion = {puntajes:{a:0, b:'3,5', c:5, d:null, e:-1, f:6, g:'basura'}};
  const seleccion = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'ausente'];
  const copia = structuredClone(evaluacion);
  assert.equal(E.promedioDimension(evaluacion, seleccion), 8.5 / 3);
  assert.equal(E.promedioDimension(evaluacion, [{id:'b'}, {id:'c'}]), 4.25);
  assert.equal(E.promedioDimension(evaluacion, ['a']), 0);
  assert.equal(E.promedioDimension(evaluacion, ['d', 'e', 'f', 'g']), null);
  assert.equal(E.promedioDimension(evaluacion, []), null);
  assert.equal(E.promedioDimension(null, seleccion), null);
  assert.deepEqual(evaluacion, copia);
});
test('indicadoresEje: indicadores directos y agrupados, códigos consecutivos y sin mutación', () => {
  const datos = {ejes:[
    {id:'directo', hallazgos:{indicadores:[{pregunta:'Uno', calificacion:'3,5', brecha:'Pendiente'}, {pregunta:'Dos', calificacion:0}]}},
    {id:'grupos', hallazgos:{grupos:[{indicadores:[{pregunta:'Tres', calificacion:'5'}]}, {indicadores:[{pregunta:'Cuatro', calificacion:'sin dato'}]}]}},
    {id:'vacio'}
  ]};
  const copia = structuredClone(datos);
  assert.deepEqual(E.indicadoresEje(datos, 'directo'), [
    {pregunta:'Uno', calificacion:3.5, brecha:'Pendiente', codigo:'I1'},
    {pregunta:'Dos', calificacion:0, codigo:'I2'}
  ]);
  assert.deepEqual(E.indicadoresEje(datos, 'grupos'), [
    {pregunta:'Tres', calificacion:5, codigo:'I1'}, {pregunta:'Cuatro', calificacion:null, codigo:'I2'}
  ]);
  assert.deepEqual(E.indicadoresEje(datos, 'vacio'), []);
  assert.deepEqual(E.indicadoresEje(datos, 'desconocido'), []);
  E.indicadoresEje(datos, 'directo')[0].pregunta = 'Modificada';
  assert.deepEqual(datos, copia);
});
test('nivelEscala: nivel inferior, límites, datos inválidos y escala sin mutar', () => {
  const escala = structuredClone(estandares.escala).reverse(), copia = structuredClone(escala);
  for (const nivel of escala) {
    assert.equal(E.nivelEscala(nivel.valor, escala), nivel.descripcion);
    if (nivel.valor < 5) assert.equal(E.nivelEscala(nivel.valor + 0.99, escala), nivel.descripcion);
  }
  assert.equal(E.nivelEscala('3,5', escala), escala.find(n => n.valor === 3).descripcion);
  for (const valor of [null, undefined, '', 'basura', -0.1, 5.1, NaN, Infinity]) assert.equal(E.nivelEscala(valor, escala), 'Sin información');
  assert.equal(E.nivelEscala(3, []), 'Sin información');
  assert.deepEqual(escala, copia);
});
test('vista general: dos tarjetas con hallazgos, araña, brechas y fichas de estándares', async () => {
  const v = await montar();
  const tarjetas = v.contenedor.querySelectorAll('.dim-tarjeta');
  assert.equal(tarjetas.length, 2);
  assert.equal(v.contenedor.querySelectorAll('.dim-detalle').length, 0);
  tarjetas.forEach((t, i) => {
    const info = dimensiones.grandes[i];
    assert.equal(t.querySelectorAll('.dim-col.hallazgos').length, 1);
    assert.equal(t.querySelectorAll('.dim-col.brechas').length, 1);
    assert.equal(t.querySelectorAll('.dim-arana').length, 1);
    assert.equal(t.querySelector('.dim-arana').tag, 'svg');
    assert.equal(t.querySelectorAll('.dim-vertice').length, i === 0 ? 6 : 10);
    assert.deepEqual(t.querySelector('.hallazgos').querySelectorAll('li').map(n => n.textContent), info.hallazgos);
    assert.deepEqual(t.querySelector('.brechas').querySelectorAll('li').map(n => n.textContent), info.brechas);
    assert.equal(t.querySelectorAll('.dim-pie').length, 1);
    assert.deepEqual(t.querySelector('.dim-pie').querySelector('.dim-estandares').querySelectorAll('li').map(n => n.textContent), info.estandares);
  });
});
test('vista: ?eje=tema-ddhh-1 abre la ficha en ventana con título, calificación, hallazgos y tabla de cuatro columnas', async () => {
  const v = await montar({filtros:'eje=tema-ddhh-1', plan:[{id:'accion-prueba', titulo:'Acción vinculada', ejes:['tema-ddhh-1'], estado:'en-curso', avance:25}]});
  assert.equal(v.contenedor.querySelectorAll('.dim-tarjeta').length, 2);
  const ficha = v.ficha();
  assert.ok(ficha, 'la ficha se abre como ventana');
  assert.equal(ficha.attrs.role, 'dialog'); assert.equal(ficha.attrs['aria-modal'], 'true');
  assert.equal(ficha.querySelector('h2').textContent, ejes.find(e => e.id === 'tema-ddhh-1').nombre);
  assert.match(ficha.querySelector('.dim-ficha-calif').textContent, /Calificación/);
  assert.deepEqual(ficha.querySelector('.dim-ficha-hallazgos').querySelectorAll('li').map(n => n.textContent), dimensiones.ejes['tema-ddhh-1'].hallazgos);
  // Estándares generales del aspecto: fila completa debajo de los hallazgos.
  assert.deepEqual(ficha.querySelector('.dim-ficha-estandares-fila').querySelectorAll('li').map(n => n.textContent), dimensiones.ejes['tema-ddhh-1'].estandares);
  // Sin componentes intermedios: la tabla de tres columnas aparece directamente.
  assert.equal(ficha.querySelectorAll('.dim-comp').length, 0);
  const encabezados = ficha.querySelector('.dim-ficha-tabla').querySelector('thead').querySelectorAll('th').map(n => n.textContent);
  assert.deepEqual(encabezados, ['Indicador', 'Calificación', 'Brecha específica']);
  assert.equal(ficha.querySelector('tbody').children.length, E.indicadoresEje(estandares, 'tema-ddhh-1').length);
  assert.equal(ficha.querySelector('.dim-ficha-acciones').querySelector('a').href, '#/plan?accion=accion-prueba');
  assert.equal(v.ruta(), '#/ddhh/dimensiones?eval=eval-2025-12&eje=tema-ddhh-1');
  v.teclas.at(-1)({key:'Escape', preventDefault() {}});
  assert.equal(v.ficha(), null);
  assert.equal(v.ruta(), '#/ddhh/dimensiones?eval=eval-2025-12');
});
test('ficha: las etapas OCDE muestran sus componentes con calificación y cada uno despliega sus indicadores', async () => {
  const v = await montar({filtros:'eje=etapa-ocde-2'});
  const ficha = v.ficha(), eje = ejes.find(e => e.id === 'etapa-ocde-2');
  const comps = ficha.querySelectorAll('.dim-comp');
  assert.equal(comps.length, eje.hallazgos.grupos.length);
  const indicadores = E.indicadoresEje(estandares, 'etapa-ocde-2');
  let n = 0;
  comps.forEach((c, k) => {
    const boton = c.querySelector('.dim-comp-boton'), region = c.querySelector('.dim-comp-indicadores');
    assert.match(c.textContent, new RegExp(eje.criterios[k].nombre.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(c.querySelector('.dim-circulo').textContent, /^\d,\d$|^—$/);
    assert.equal(region.hidden, true); assert.equal(boton.attrs['aria-expanded'], 'false');
    boton.onclick();
    assert.equal(region.hidden, false); assert.equal(boton.attrs['aria-expanded'], 'true');
    const filas = region.querySelector('tbody').children;
    assert.equal(filas.length, eje.hallazgos.grupos[k].indicadores.length);
    filas.forEach(f => {
      const ind = indicadores[n++];
      assert.equal(f.querySelector('.dim-ficha-brecha').textContent, ind.brecha || 'Sin brecha registrada');
    });
    boton.onclick(); assert.equal(region.hidden, true);
  });
  assert.equal(n, indicadores.length);
  v.limpiar();
});
test('geometría: las diez etiquetas renderizadas no se solapan ni entran en el círculo de radio 300', async () => {
  // Exponer la función de producción solo en la VM evita modificar la vista.
  const fuente = readFileSync(new URL('../public/vista-estandares.js', import.meta.url), 'utf8');
  const contexto = {window:{}, App:{el(){}, registrarVista(){}}, Intl};
  const cierre = /\}\(\)\);\s*$/;
  assert.match(fuente, cierre);
  vm.runInNewContext(fuente.replace(cierre, 'globalThis.geometria = {ubicarEtiqueta, posicionesArana}; }());'), contexto);
  assert.equal(typeof contexto.geometria.posicionesArana, 'function');
  const v = await montar();
  const arana = v.contenedor.querySelectorAll('.dim-arana')[1];
  const etiquetas = arana.querySelectorAll('.dim-etiqueta');
  assert.equal(etiquetas.length, 10);
  const cajas = etiquetas.map((n, i) => {
    const partes = n.querySelectorAll('tspan').map(t => t.textContent);
    const p = contexto.geometria.ubicarEtiqueta(i, 10, partes);
    assert.equal(Number(n.attrs.x), p.x); assert.equal(Number(n.attrs.y), p.y);
    assert.ok(p.caja.ancho > 0 && p.caja.alto > 0);
    return p.caja;
  });
  cajas.forEach((c, i) => {
    const cercaX = Math.max(c.x, Math.min(0, c.x + c.ancho));
    const cercaY = Math.max(c.y, Math.min(0, c.y + c.alto));
    assert.ok(Math.hypot(cercaX, cercaY) >= 300, `Etiqueta ${i + 1} invade el círculo`);
    cajas.slice(i + 1).forEach((otra, j) => {
      const solapa = c.x < otra.x + otra.ancho && c.x + c.ancho > otra.x && c.y < otra.y + otra.alto && c.y + c.alto > otra.y;
      assert.equal(solapa, false, `Etiquetas ${i + 1} y ${i + j + 2} se solapan`);
    });
  });
});
