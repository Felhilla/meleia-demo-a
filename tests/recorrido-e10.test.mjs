import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import Plan from '../public/plan.js';
import {createRequire} from 'node:module';
const {posicionesArana} = createRequire(import.meta.url)('../public/vista-estandares.js');
const leer = ruta => JSON.parse(readFileSync(new URL('../public/' + ruta, import.meta.url), 'utf8'));
async function iniciar(hash, {materialidad = null, fallo = 'http'} = {}) {
  const eventos = {}, nodos = new Map(), renders = [];
  const nodo = tag => ({tag, dataset: {}, children: [], attrs: {}, append(...n) {this.children.push(...n);}, replaceChildren(...n) {this.children = n;}, setAttribute(k,v) {this.attrs[k] = v;}, removeAttribute(k) {delete this.attrs[k];}, addEventListener() {}, focus() {}, querySelector() {return null;}});
  const document = {documentElement: nodo(), activeElement: null, createElement: nodo, createElementNS: (_, tag) => nodo(tag), createTextNode: textContent => ({textContent}), addEventListener(t,fn) {eventos[t] = fn;}, querySelector: s => s === '.saltar' ? nodo() : null, getElementById(id) {if (!nodos.has(id)) nodos.set(id,nodo()); return nodos.get(id);}};
  const location = {hash, search: '?paleta=b', pathname: '/demo/', replace(url) {this.redireccion = url;}};
  const contexto = {document, location, URLSearchParams, Plan, setTimeout, clearTimeout, GHDatos: {estado: 'base', list: async () => []}, fetch: async ruta => {
    if (ruta.includes('materialidad')) {
      if (materialidad) return {ok: true, json: async () => ruta.startsWith('data/') ? materialidad : leer('config/materialidad-config.json')};
      if (fallo === 'red') throw Error('sin conexión');
      return {ok: fallo === 'json', json: async () => {throw Error('JSON inválido');}};
    }
    return {ok: true, json: async () => leer(ruta)};
  }};
  contexto.window = contexto; contexto.addEventListener = (t,fn) => {eventos[t] = fn;};
  vm.runInNewContext(readFileSync(new URL('../public/materialidad.js', import.meta.url), 'utf8'), contexto);
  vm.runInNewContext(readFileSync(new URL('../public/app.js', import.meta.url), 'utf8'), contexto);
  for (const nombre of ['estandares','riesgos','plan','metodologia','resultados','materialidad','materialidad-impacto','materialidad-financiera']) contexto.App.registrarVista(nombre, {render(c,d,p) {renders.push({nombre, ...p});}});
  vm.runInNewContext(readFileSync(new URL('../public/vista-caso.js', import.meta.url), 'utf8'), contexto);
  await eventos.DOMContentLoaded();
  return {contexto, nodos, renders, location};
}
const texto = n => [n.textContent || '', ...(n.children || []).map(texto)].join(' ');
const enlaces = n => [ ...(n.tag === 'a' ? [n] : []), ...(n.children || []).flatMap(enlaces) ];
test('capítulos 01 a 06, selección y navegación anterior/siguiente conservan el recorrido', async () => {
  const rutas = ['#/', '#/metodologia', '#/resultados', '#/ddhh/dimensiones', '#/materialidad/impacto', '#/plan'];
  for (const [i, ruta] of rutas.entries()) {
    const {nodos} = await iniciar(ruta);
    const tabs = enlaces(nodos.get('capitulos'));
    assert.deepEqual(tabs.map(t => t.href), rutas);
    assert.deepEqual(tabs.map(t => t.children[0].textContent), ['01','02','03','04','05','06']);
    assert.equal(tabs[i].attrs['aria-current'], 'page');
    assert.equal(tabs.filter(t => t.attrs['aria-current']).length, 1);
    const nav = nodos.get('contenido').children.at(-1);
    assert.deepEqual(enlaces(nav).map(a => a.href), [rutas[i-1], rutas[i+1]].filter(Boolean));
    if (i) assert.match(texto(nav), /Anterior/);
    if (i < 5) assert.match(texto(nav), /Siguiente/);
  }
});
test('ficha de riesgo y parámetros existentes llegan intactos a la vista', async () => {
  const {renders, location} = await iniciar('#/ddhh/riesgos/riesgo-01?criticidad=Alta&ambito=directo');
  assert.equal(location.redireccion, undefined);
  assert.equal(renders[0].id, 'riesgo-01');
  assert.equal(renders[0].filtros.get('criticidad'), 'Alta');
  assert.equal(renders[0].filtros.get('ambito'), 'directo');
  for (const ruta of ['ddhh/dimensiones?eval=a&vs=b&eje=c', 'plan?accion=accion-01&vencidas=1']) {
    const r = await iniciar('#/' + ruta);
    assert.equal(r.renders[0].filtros.toString(), ruta.split('?')[1]);
  }
});
test('materialidad valida ids disponibles y usa patrón solo sin temas', async () => {
  for (const sub of ['impacto','financiera','doble']) {
    for (const materialidad of [null, {temas: [{id:'tema-01'}]}]) {
      const r = await iniciar('#/materialidad/' + sub + '/tema-01', {materialidad});
      assert.equal(r.location.redireccion, undefined);
      assert.equal(r.renders[0].id, 'tema-01');
      assert.equal(r.renders[0].sub, sub);
    }
    for (const temas of [[], [{id:'tema-02'}]]) {
      const r = await iniciar('#/materialidad/' + sub + '/tema-01', {materialidad:{temas}});
      assert.equal(r.location.redireccion, '/demo/?paleta=b#/materialidad/' + sub);
    }
  }
  for (const ruta of ['materialidad/doble/tema-1','desconocida','plan/riesgo-01']) {
    const r = await iniciar('#/' + ruta);
    assert.equal(r.location.redireccion, '/demo/?paleta=b#/');
  }
});
test('fallos HTTP, red o JSON opcionales no causan error global', async () => {
  for (const fallo of ['http','red','json']) {
    const {contexto, nodos, renders} = await iniciar('#/materialidad/doble', {fallo});
    assert.equal(contexto.App.datos.materialidad, null);
    assert.equal(contexto.App.datos.materialidadConfig, null);
    assert.equal(contexto.App.estadoBase(), 'base');
    assert.equal(renders[0].nombre, 'materialidad');
    assert.doesNotMatch(texto(nodos.get('contenido')), /No pudimos cargar/);
  }
});
test('portada del caso muestra empresa, cuatro cifras vivas y enlaces a sus capítulos', async () => {
  for (const materialidad of [null, leer('data/materialidad.json')]) {
    const {nodos, contexto} = await iniciar('#/', {materialidad});
    const contenido = nodos.get('contenido');
    assert.match(texto(contenido), new RegExp(contexto.App.datos.empresa.nombre));
    const tarjetas = enlaces(contenido).filter(n => n.className === 'tarjeta entregable');
    assert.deepEqual(tarjetas.map(n => n.href), ['#/ddhh/dimensiones','#/ddhh/riesgos','#/materialidad/doble','#/plan']);
    const esperadas = [contexto.App.datos.estandares.ejes.length, contexto.App.datos.riesgos.length,
      materialidad ? contexto.Materialidad.listaCorta(materialidad.temas, leer('config/materialidad-config.json')).length : '—', contexto.App.obtenerPlan().length];
    assert.deepEqual(tarjetas.map(n => n.children[0].textContent), esperadas);
    assert.match(texto(tarjetas[3]), /% de avance.*ejemplo/);
  }
});
test('geometría de ambas arañas separa etiqueta superior, anillo 5 y puntos', () => {
  const intersecta = (a,b) => a.x < b.x+b.ancho && a.x+a.ancho > b.x && a.y < b.y+b.alto && a.y+a.alto > b.y;
  for (const total of [6,10]) {
    const superior = posicionesArana(0,total,['Integrar la','conducta','empresarial','responsable']);
    assert.equal(intersecta(superior.etiqueta.caja, superior.numero.caja), false);
    assert.ok(superior.etiqueta.caja.y + superior.etiqueta.caja.alto < 350-240-20);
    for (let i=0; i<total; i++) {
      const {etiqueta} = posicionesArana(i,total,['Una etiqueta de','varias líneas','para este eje']);
      const b = etiqueta.caja;
      const dx = Math.max(b.x-360,0,360-b.x-b.ancho), dy = Math.max(b.y-350,0,350-b.y-b.alto);
      assert.ok(Math.hypot(dx,dy) > 270);
      for (let nivel=0; nivel<=5; nivel++) assert.equal(intersecta(b,posicionesArana(i,total,[''],nivel).numero.caja),false);
    }
  }
});
