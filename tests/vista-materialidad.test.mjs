import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import M from '../public/materialidad.js';
import Riesgos from '../public/riesgos.js';
const leer = p => JSON.parse(readFileSync(new URL('../public/' + p, import.meta.url), 'utf8'));
const data = leer('data/materialidad.json'), cfg = leer('config/materialidad-config.json');
const filas = M.clasificar(data.temas, cfg);
test('posiciones: límites, separación de coincidencias, determinismo y pureza', () => {
  const entrada = [...filas, ...Array.from({length:8}, (_, i) => ({id:'extra-' + i, impacto:0, financiera:5}))];
  const copia = JSON.stringify(entrada), ps = M.posicionesMatriz(entrada, 760, 560, 60);
  assert.deepEqual(ps, M.posicionesMatriz([...entrada].reverse(), 760, 560, 60));
  for (const [i, p] of ps.entries()) {assert.ok(p.x >= 60 && p.x <= 700 && p.y >= 60 && p.y <= 500); for (const q of ps.slice(i + 1)) assert.ok(Math.hypot(p.x - q.x, p.y - q.y) >= 14);}
  assert.equal(JSON.stringify(entrada), copia);
  assert.deepEqual(M.posicionesMatriz([], 100, 100, 10), []);
});
test('resumen coincide con clasificación: 9 materiales y 6 no materiales', () => {
  const r = M.resumen(data.temas, cfg);
  assert.equal(r.materiales, 9); assert.equal(r.noMateriales, 6); assert.equal(r.evaluados, 15);
  for (const [k,v] of Object.entries(r.porCuadrante)) assert.equal(v, filas.filter(f => f.cuadrante === k).length);
  assert.deepEqual(r.umbrales, M.umbrales(data.temas, cfg));
});
test('filtros combinados, vacíos y ordenación sin mutaciones', () => {
  const copia = JSON.stringify(filas);
  const r = M.filtrar(filas, data.temas, {dimension:'social', materiales:'1', cuadrante:'impacto'});
  assert.ok(r.length); assert.ok(r.every(f => f.material && f.cuadrante === 'impacto' && data.temas.find(t => t.id === f.id).dimension_esg === 'social'));
  assert.equal(M.filtrar(filas, data.temas, {materiales:'0'}).length, 15);
  assert.deepEqual(M.filtrar(filas, data.temas, {dimension:'inexistente'}), []);
  assert.deepEqual(M.filtrar([], [], {}), []); assert.deepEqual(M.ordenar([], 'financiera'), []);
  for (const k of ['impacto','financiera']) {const sorted = M.ordenar(filas,k); assert.ok(sorted.every((f,i) => !i || sorted[i-1][k] >= f[k]));}
  assert.equal(JSON.stringify(filas), copia);
});
function iniciar(hash = '#/ddhh/materialidad', sinDatos = false) {
  const eventos = {}, document = {};
  class Nodo {
    constructor(tag) {this.tag = tag; this.children = []; this.attrs = {}; this.dataset = {}; this.style = {}; this.className = ''; this.classList = {add: c => {this.className += ' ' + c;}, remove: c => {this.className = this.className.replace(c,'');}};}
    append(...ns) {ns.forEach(n => {this.children.push(n); if (typeof n === 'object') n.parent = this;});}
    setAttribute(k,v) {this.attrs[k] = String(v);}
    focus() {document.activeElement = this;}
    remove() {this.parent.children = this.parent.children.filter(n => n !== this);}
    querySelectorAll(s) {return todos(this).filter(n => s.includes('button') && n.tag === 'button' || s.includes('a[href]') && n.tag === 'a' && n.href);}
    scrollIntoView(o) {this.scroll = o;}
  }
  const el = (tag, texto, clase) => {const n = new Nodo(tag); if (texto != null) n.textContent = texto; if (clase) n.className = clase; return n;};
  document.body = el('body'); const main = el('main'); document.body.append(main);
  document.createElementNS = (_,tag) => el(tag); document.createElement = el;
  document.querySelectorAll = () => [main]; document.getElementById = id => todos(document.body).find(n => n.id === id);
  document.addEventListener = (k,fn) => {eventos[k] = fn;}; document.removeEventListener = k => {delete eventos[k];};
  const datos = {materialidad:sinDatos ? null : data, materialidadConfig:cfg, riesgos:leer('data/riesgos.json'), estandares:leer('data/estandares.json'), evaluaciones:leer('data/evaluaciones.json'), criticidad:leer('config/criticidad-config.json'), plan:leer('data/plan.json')};
  // Verifica que la ficha consulta el plan vivo, no el respaldo.
  const vivo = datos.plan.map(a => ({...a, estado:'en_curso', avance:37}));
  let vista; const location = {hash};
  const contexto = {Materialidad:M, Riesgos, URLSearchParams, Intl, document, location, window:{matchMedia:() => ({matches:true})}, App:{el, obtenerPlan:() => vivo, registrarVista:(_,v) => {vista = v;}}};
  vm.runInNewContext(readFileSync(new URL('../public/vista-materialidad.js',import.meta.url),'utf8'), contexto);
  const [ruta,q] = hash.split('?'); const limpiar = vista.render(main, datos, {id:ruta.split('/')[3], filtros:new URLSearchParams(q)});
  return {main, document, location, eventos, limpiar};
}
function todos(n) {return typeof n === 'object' ? [n,...n.children.flatMap(todos)] : [];}
function texto(n) {return typeof n === 'object' ? [n.textContent || '',...n.children.map(texto)].join(' ') : String(n);}
test('render: matriz, 15 filas, seis etapas y encabezado sin duplicar siguiente', () => {
  const {main} = iniciar(), ns = todos(main);
  assert.equal(ns.filter(n => n.tag === 'svg').length,1);
  assert.equal(ns.find(n => n.id === 'mat-tabla').children[2].children.length,15);
  assert.equal(ns.filter(n => n.attrs.role === 'tab').length,6);
  assert.equal(texto(main).match(/Paso 2 de 4/g).length,1);
  assert.doesNotMatch(texto(main), /Siguiente:/);
});
test('ficha tema-03: cruce, plan vivo, Esc, contención y limpieza', () => {
  const r = iniciar('#/ddhh/materialidad/tema-03?etapa=3');
  const dialogo = todos(r.document.body).find(n => n.attrs.role === 'dialog'); assert.ok(dialogo);
  const links = todos(dialogo).filter(n => n.tag === 'a');
  assert.ok(links.some(n => n.href.includes('riesgo-05'))); assert.ok(links.some(n => n.href.includes('accion=')));
  assert.match(texto(dialogo), /37 %/); assert.ok(r.main.inert);
  const ultimo = links.at(-1); ultimo.focus(); r.eventos.keydown({key:'Tab',preventDefault(){}}); assert.equal(r.document.activeElement.tag,'button');
  r.eventos.keydown({key:'Escape',preventDefault(){}}); assert.equal(r.location.hash,'#/ddhh/materialidad?etapa=3');
  r.limpiar(); assert.ok(!r.main.inert); assert.ok(!todos(r.document.body).some(n => n.attrs.role === 'dialog')); assert.equal(r.eventos.keydown,undefined);
});
test('seis etapas renderizan y filtros conservan el universo de umbrales', () => {
  for (let i=1;i<=6;i++) {const {main} = iniciar('#/ddhh/materialidad?etapa='+i); assert.match(texto(main), new RegExp(cfg.etapas[i-1].titulo.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));}
  const {main} = iniciar('#/ddhh/materialidad?materiales=1&orden=financiera'); assert.equal(todos(main).find(n=>n.id==='mat-tabla').children[2].children.length,9);
});
test('puntos responden a espacio y filtros cambian URL', () => {
  const r = iniciar(); const ns = todos(r.main), punto = ns.find(n=>n.attrs.role==='button'); punto.onkeydown({key:' ',preventDefault(){}}); assert.match(r.location.hash,/materialidad\/tema-/);
  const filtro = ns.find(n=>n.id==='mat-filtro-dimension'); filtro.value='ambiental'; filtro.onchange(); assert.match(r.location.hash,/dimension=ambiental/);
});
test('sin datos conserva Contenido en preparación y banda ilustrativa', () => {const {main} = iniciar(undefined,true); assert.match(texto(main),/Contenido en preparación/); assert.match(texto(main),/Los temas y las calificaciones/);});
