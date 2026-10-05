import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import Plan from '../public/plan.js';
import Riesgos from '../public/riesgos.js';
import Estandares from '../public/estandares.js';
import Materialidad from '../public/materialidad.js';
const leer = ruta => readFileSync(new URL('../public/' + ruta, import.meta.url), 'utf8');
const json = ruta => JSON.parse(leer(ruta));
class Nodo {
  constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.dataset = {}; this.className = ''; this._texto = ''; }
  set textContent(v) { this._texto = String(v); this.children = []; }
  get textContent() { return this._texto + this.children.map(n => n.textContent).join(' '); }
  append(...n) { this.children.push(...n); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  querySelectorAll(selector) {
    return this.children.flatMap(n => [...((selector.startsWith('.') ? (n.className || n.attrs.class || '').split(' ').includes(selector.slice(1)) : n.tag === selector) ? [n] : []), ...n.querySelectorAll(selector)]);
  }
}
function montar(nombre, cambiar = () => {}) {
  const document = {documentElement: new Nodo('html'), createElement: t => new Nodo(t), createElementNS: (_, t) => new Nodo(t), getElementById: () => null, addEventListener() {}};
  const contexto = {document, Plan, Riesgos, Estandares, Materialidad, URLSearchParams, Intl}; contexto.window = contexto;
  vm.runInNewContext(leer('app.js'), contexto);
  const datos = Object.fromEntries(Object.entries({caso:'data/caso.json', riesgos:'data/riesgos.json', estandares:'data/estandares.json', evaluaciones:'data/evaluaciones.json', plan:'data/plan.json', materialidad:'data/materialidad.json', criticidad:'config/criticidad-config.json', materialidadConfig:'config/materialidad-config.json', planConfig:'config/plan-config.json', umbrales:'config/umbrales-config.json'}).map(([k, ruta]) => [k, json(ruta)]));
  cambiar(datos); contexto.App.datos = datos;
  let vista;
  contexto.App.registrarVista = (n, v) => { assert.equal(n, nombre); vista = v; };
  const raiz = new Nodo('main');
  if (nombre) { vm.runInNewContext(leer('vista-' + nombre + '.js'), contexto); vista.render(raiz, datos); }
  return {raiz, datos, App: contexto.App};
}
test('App.resolverRuta: nueve rutas, redirecciones heredadas, ids y rutas inexistentes', () => {
  const {App, datos} = montar();
  const rutas = [['#/', 'caso'], ['#/metodologia','metodologia'], ['#/resultados','resultados'], ['#/ddhh/dimensiones','ddhh/dimensiones'], ['#/ddhh/riesgos','ddhh/riesgos'], ['#/materialidad/impacto','materialidad/impacto'], ['#/materialidad/financiera','materialidad/financiera'], ['#/materialidad/doble','materialidad/doble'], ['#/plan','plan']];
  for (const [ruta, clave] of rutas) {
    const r = App.resolverRuta(ruta, datos); assert.equal(r.clave, clave); assert.equal(r.redirigir, undefined);
  }
  for (const [ruta, destino] of [['#/ddhh/estandares?eje=x','#/ddhh/dimensiones?eje=x'], ['#/ddhh/materialidad/tema-03','#/materialidad/doble/tema-03'], ['#/ddhh/plan?accion=a','#/plan?accion=a'], ['#/ddhh/riesgos/riesgo-999','#/ddhh/riesgos'], ['#/materialidad/doble/tema-99','#/materialidad/doble'], ['#/desconocida','#/']]) assert.equal(App.resolverRuta(ruta, datos).redirigir, destino);
  assert.equal(App.resolverRuta('#/ddhh/riesgos/riesgo-01', datos).id, 'riesgo-01');
  assert.equal(App.resolverRuta('#/materialidad/doble/tema-03', datos).id, 'tema-03');
});
test('metodología: cinco fases, ocho estándares en tres grupos, cuatro actividades y escalas configuradas', () => {
  const {raiz, datos} = montar('metodologia');
  assert.equal(raiz.querySelectorAll('h1').length, 0);
  assert.equal(raiz.querySelectorAll('.eslabon').length, 5);
  assert.equal(raiz.querySelectorAll('.relato-estandar').length, 8);
  assert.equal(raiz.querySelectorAll('.relato-grupo').length, 3);
  assert.equal(raiz.querySelectorAll('.dato').length, 4);
  const escalas = raiz.querySelectorAll('.relato-escala'); assert.equal(escalas.length, 3);
  assert.deepEqual(escalas.map(s => s.querySelectorAll('strong').map(n => n.textContent)), [datos.estandares.escala.map(n => String(n.valor)), ['1','2','3'], datos.materialidadConfig.escala.niveles.map(n => String(n.valor))]);
  for (const corte of datos.criticidad.gravedad.cortes) assert.ok(escalas[1].textContent.includes(corte.nivel));
  assert.ok(escalas[2].textContent.includes(datos.materialidadConfig.umbral.nota));
  const usos = raiz.querySelectorAll('.relato-estandar').map(n => [n.children[0].textContent, n.querySelectorAll('.relato-usos')[0].textContent]);
  for (const [sigla, uso] of usos) {
    assert.equal(uso.includes('Debida diligencia'), ['PRNU','OCDE','PNA','OIT','IPIECA','GRI 11'].includes(sigla));
    assert.equal(uso.includes('Materialidad'), ['GRI 3','GRI 11','SASB'].includes(sigla));
  }
});
test('metodología refleja cambios de configuración y admite materialidad ausente', () => {
  const {raiz} = montar('metodologia', d => { d.estandares.escala[0].descripcion = 'Nivel cambiado'; d.criticidad.gravedad.escala.maximo = 4; d.criticidad.gravedad.cortes[0].menor_que = 1.7; d.materialidadConfig.escala.niveles[0].etiqueta = 'Escala cambiada'; d.materialidadConfig.umbral.nota = 'Regla cambiada'; });
  for (const t of ['Nivel cambiado','1,7','Escala cambiada','Regla cambiada']) assert.ok(raiz.textContent.includes(t));
  assert.deepEqual(raiz.querySelectorAll('.relato-escala')[1].querySelectorAll('strong').map(n => n.textContent), ['1','2','3','4']);
  assert.match(montar('metodologia', d => {d.materialidadConfig = null;}).raiz.textContent, /Escala en preparación/);
});
test('resultados: cuatro mensajes, 17 riesgos ubicados más uno sin probabilidad, nueve temas y avance real', () => {
  const {raiz, datos} = montar('resultados');
  assert.equal(raiz.querySelectorAll('h1').length, 0);
  assert.equal(raiz.querySelectorAll('.pregunta').length, 1);
  assert.equal(raiz.querySelectorAll('.relato-mensaje').length, 4);
  assert.deepEqual(raiz.querySelectorAll('.relato-mensaje').map(n => n.querySelectorAll('a')[0].href), datos.caso.resultados.mensajes.map(m => m.destino));
  const celdas = raiz.querySelectorAll('text').filter(n => Object.hasOwn(n.attrs, 'data-riesgos'));
  assert.equal(celdas.length, 9); assert.equal(celdas.reduce((s,n) => s + Number(n.textContent), 0), 17);
  assert.match(raiz.querySelectorAll('.relato-sin-probabilidad')[0].textContent, /^1 sin probabilidad/);
  assert.equal(raiz.querySelectorAll('.relato-lista-corta')[0].children.length, 9);
  const anillo = raiz.querySelectorAll('circle').find(n => n.attrs['data-avance']);
  assert.equal(Number(anillo.attrs['data-avance']), Plan.resumen(datos.plan, datos.planConfig).avanceGlobal);
  assert.match(raiz.textContent, /avances de ejemplo/);
  assert.match(raiz.textContent, /3,1/); assert.match(raiz.textContent, /4,0/);
  assert.match(raiz.textContent, /Solo operación propia: 5/); assert.match(raiz.textContent, /cadena de valor: 13/);
  assert.ok(raiz.querySelectorAll('svg').every(n => n.attrs['aria-label'] && n.attrs.role === 'img'));
  assert.ok(raiz.querySelectorAll('text').every(n => Number(n.attrs['font-size']) >= 14));
});
test('resultados recalcula evidencia al cambiar datos y usa la última evaluación real', () => {
  const {raiz} = montar('resultados', d => {
    const base = d.evaluaciones.find(e => e.origen === 'fuente');
    d.evaluaciones.push({...base, id:'nueva', fecha:'2098-01', puntajes: Object.fromEntries(d.estandares.ejes.map(e => [e.id, 2]))});
    d.evaluaciones.push({...base, id:'ejemplo', origen:'ejemplo', fecha:'2099-01', puntajes: Object.fromEntries(d.estandares.ejes.map(e => [e.id, 5]))});
    d.plan = d.plan.map(a => ({...a, avance:100, estado:'cumplida', seguimiento_ejemplo:false}));
    d.materialidad = null;
    d.riesgos = d.riesgos.slice(0, 2);
  });
  assert.match(raiz.textContent, /2098-01/); assert.doesNotMatch(raiz.textContent, /2099-01/);
  assert.match(raiz.textContent, /2,0/); assert.match(raiz.textContent, /100,0 %/);
  assert.match(raiz.textContent, /Vencidas: 0/); assert.doesNotMatch(raiz.textContent, /avances de ejemplo/);
  assert.match(raiz.textContent, /Materialidad en preparación/);
});
test('index carga scripts locales diferidos y en orden válido para los nueve destinos', () => {
  const scripts = [...leer('index.html').matchAll(/<script\s+([^>]+)>/g)].map(m => m[1]);
  assert.ok(scripts.every(s => /\bdefer\b/.test(s)));
  const fuentes = scripts.map(s => s.match(/src="([^"]+)"/)[1]);
  assert.deepEqual(fuentes, ['config.js','api-supabase.js','riesgos.js','estandares.js','plan.js','materialidad.js','app.js','vista-caso.js','vista-metodologia.js','vista-resultados.js','vista-riesgos.js','vista-estandares.js','vista-plan.js','vista-materialidad.js']);
  fuentes.forEach(f => assert.doesNotThrow(() => leer(f)));
});
