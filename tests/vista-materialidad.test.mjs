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
function iniciar(hash = '#/materialidad/doble', sinDatos = false) {
  const eventos = {}, document = {};
  class Nodo {
    constructor(tag) {this.tag = tag; this.children = []; this.attrs = {}; this.dataset = {}; this.style = {}; this.className = ''; this.classList = {add: c => {this.className += ' ' + c;}, remove: c => {this.className = this.className.replace(c,'');}};}
    append(...ns) {ns.forEach(n => {this.children.push(n); if (typeof n === 'object') n.parent = this;});}
    setAttribute(k,v) {this.attrs[k] = String(v);}
    getAttribute(k) {return k in this.attrs ? this.attrs[k] : null;}
    addEventListener() {}
    replaceChildren(...ns) {this.children = []; this.append(...ns);}
    querySelectorAll(sel) {const c = sel.startsWith('.') ? sel.slice(1) : null, out = []; const ir = n => (n.children || []).forEach(h => {if (typeof h !== 'object') return; if (c ? (' ' + h.className + ' ').includes(' ' + c + ' ') : h.tag === sel) out.push(h); ir(h);}); ir(this); return out;}
    querySelector(sel) {return this.querySelectorAll(sel)[0] || null;}
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
  const vistas = {}; const microtareas = []; const location = {hash};
  const contexto = {Materialidad:M, Riesgos, URLSearchParams, Intl, document, location, window:{matchMedia:() => ({matches:true}), queueMicrotask:fn => microtareas.push(fn)}, App:{el, obtenerPlan:() => vivo, registrarVista:(nombre,v) => {vistas[nombre] = v;}}};
  vm.runInNewContext(readFileSync(new URL('../public/vista-materialidad.js',import.meta.url),'utf8'), contexto);
  const pintar = () => {
    const [ruta,q] = location.hash.split('?'), sub = ruta.split('/')[2];
    main.children = [];
    return vistas[sub === 'doble' ? 'materialidad' : 'materialidad-' + sub].render(main, datos, {id:ruta.split('/')[3], sub, filtros:new URLSearchParams(q)});
  };
  const limpiar = pintar();
  return {main, document, location, eventos, limpiar, pintar, microtareas, vistas};
}
function todos(n) {return typeof n === 'object' ? [n,...n.children.flatMap(todos)] : [];}
function texto(n) {return typeof n === 'object' ? [n.textContent || '',...n.children.map(texto)].join(' ') : String(n);}
const clase = (n, c) => (n.className || n.attrs.class || '').split(' ').includes(c);
const cerca = (a, b) => assert.ok(Math.abs(a-b) < 1e-10, `${a} ≠ ${b}`);
const media = xs => xs.reduce((a,b)=>a+b,0)/xs.length;
test('mapas: promedios independientes, umbrales, materialidad estricta y pureza', () => {
  const copia = JSON.stringify({data,cfg});
  for (const [dimension, calcular] of [['impacto',M.mapaImpacto],['financiera',M.mapaFinanciero]]) {
    const puntos = calcular(data.temas,cfg);
    puntos.forEach(p => {
      const t = data.temas.find(t=>t.id===p.id);
      const evs = Object.values(t[dimension==='impacto'?'evaluacion_impacto':'evaluacion_financiera']);
      cerca(p.x,media(evs.map(e=>dimension==='impacto'?e.probabilidad:e.gasto_operativo)));
      cerca(p.y,media(evs.map(e=>dimension==='impacto'?(e.escala+e.alcance+e.irremediabilidad)/3:e.rentabilidad)));
      assert.equal(p.material,filas.find(f=>f.id===p.id)[dimension]>M.umbrales(data.temas,cfg)[dimension]);
    });
    cerca(puntos.umbrales.x,media(puntos.map(p=>p.x)));
    cerca(puntos.umbrales.y,media(puntos.map(p=>p.y)));
    const fijo = {...cfg,umbral:{...cfg.umbral,metodo:'fijo',valor_fijo:3}};
    assert.deepEqual(calcular(data.temas,fijo).umbrales,puntos.umbrales);
    calcular(data.temas,fijo).forEach(p=>assert.equal(p.material,filas.find(f=>f.id===p.id)[dimension]>3));
    const igual = {...fijo,umbral:{...fijo.umbral,valor_fijo:filas[0][dimension]}};
    assert.equal(calcular(data.temas,igual).find(p=>p.id===filas[0].id).material,false);
    assert.throws(()=>calcular([],cfg));
  }
  assert.equal(JSON.stringify({data,cfg}),copia);
});
test('matrices: celdas, totales, orden descendente y entradas intactas', () => {
  const copia=JSON.stringify(data);
  for(const [calcular,dimension,n] of [[M.matrizGrupos,'impacto',6],[M.matrizEvaluadores,'financiera',5]]) {
    const rs=calcular(data.temas,cfg);
    assert.equal(rs.length,15);
    rs.forEach((r,i)=>{
      assert.equal(Object.keys(r.celdas).length,n);
      const t=data.temas.find(t=>t.id===r.id);
      for(const [id,v] of Object.entries(r.celdas)) {
        const e=t[dimension==='impacto'?'evaluacion_impacto':'evaluacion_financiera'][id];
        cerca(v,dimension==='impacto'?((e.escala+e.alcance+e.irremediabilidad)/3+e.probabilidad)/2:(e.rentabilidad+e.gasto_operativo)/2);
      }
      cerca(r.total,media(Object.values(r.celdas)));
      cerca(r.total,filas.find(f=>f.id===r.id)[dimension]);
      assert.ok(!i || rs[i-1].total>=r.total);
    });
    assert.deepEqual(calcular([...data.temas].reverse(),cfg),rs);
  }
  assert.equal(JSON.stringify(data),copia);
});
test('tono de calor: cinco niveles, recorte y escalas inválidas',()=>{
  assert.deepEqual([-2,0,1,2,3,4,5,9].map(v=>M.tonoCalor(v,0,5)),[0,0,1,2,3,4,4,4]);
  assert.equal(M.tonoCalor(2,2,2),0);
  assert.equal(M.tonoCalor(15,10,20),2);
  for(const args of [[NaN,0,5],[1,5,0],[Infinity,0,5]]) assert.throws(()=>M.tonoCalor(...args));
});
for(const sub of ['impacto','financiera','doble']) {
  test(`${sub}: mapa, matriz completa, resultados, nota única y teclado`,()=>{
    const r=iniciar('#/materialidad/'+sub), ns=todos(r.main);
    assert.deepEqual(Object.keys(r.vistas).sort(),['materialidad','materialidad-financiera','materialidad-impacto']);
    for(const c of ['mat-mapa','mat-matriz','mat-resultados']) assert.equal(ns.filter(n=>clase(n,c)).length,1);
    assert.equal(ns.filter(n=>n.tag==='h1').length,0);
    assert.doesNotMatch(texto(r.main),/Paso \d de 4|Siguiente:/);
    assert.equal(ns.filter(n=>clase(n,'nota')).length,1);
    const tabla=ns.find(n=>n.id==='mat-tabla'), cab=tabla.children[1].children[0], rows=tabla.children[2].children;
    assert.equal(rows.length,15);
    const columnas=sub==='impacto'?data.grupos:sub==='financiera'?data.evaluadores_financieros:[];
    assert.equal(cab.children.length,sub==='doble'?5:columnas.length+2);
    columnas.forEach((g,i)=>assert.equal(texto(cab.children[i+1]).trim(),g.nombre));
    const orden=sub==='doble'?[...filas].sort((a,b)=>(b.impacto+b.financiera)-(a.impacto+a.financiera)||a.id.localeCompare(b.id)).map(f=>f.id): (sub==='impacto'?M.matrizGrupos:M.matrizEvaluadores)(data.temas,cfg).map(f=>f.id);
    assert.deepEqual(rows.map(row=>todos(row).find(n=>n.tag==='a').href.split('/').at(-1)),orden);
    const puntos=ns.filter(n=>n.attrs.role==='button'); assert.equal(puntos.length,15);
    const materiales=sub==='doble'?9:filas.filter(f=>f[sub]>M.umbrales(data.temas,cfg)[sub]).length;
    assert.equal(puntos.filter(n=>clase(n,'mat-material')).length,materiales);
    assert.match(texto(ns.find(n=>n.tag==='h2')),new RegExp(`${materiales} de 15`));
    puntos.forEach((p,i)=>{
      const c=p.children[0];
      puntos.slice(i+1).forEach(q=>assert.ok(Math.hypot(c.attrs.cx-q.children[0].attrs.cx,c.attrs.cy-q.children[0].attrs.cy)>=40));
      for(const key of ['Enter',' ']) {let prevenido=false;p.onkeydown({key,preventDefault(){prevenido=true;}});assert.ok(prevenido);assert.equal(r.location.hash,`#/materialidad/${sub}/tema-${p.children[1].textContent}`);}
    });
    rows[0].onclick({target:{}});assert.equal(r.location.hash,todos(rows[0]).find(n=>n.tag==='a').href);
    const ranking=ns.find(n=>clase(n,'mat-ranking'));
    assert.equal(todos(ranking).filter(n=>clase(n,'mat-marca')).length,sub==='doble'?30:15);
    if(sub==='doble') {
      const corta=ns.find(n=>clase(n,'mat-lista-corta'));
      assert.equal(corta.children.length,3);
      assert.deepEqual(corta.children.map(c=>todos(c).filter(n=>n.tag==='li').length),[4,3,2]);
      assert.equal(ns.filter(n=>clase(n,'mat-cruce')).length,9);
    } else {
      const destacados=ns.find(n=>clase(n,'mat-destacados'));
      assert.equal(destacados.children.length,3);
      if(sub==='impacto') destacados.children.forEach(c=>assert.ok(todos(c).some(n=>n.href?.startsWith('#/ddhh/riesgos/riesgo-'))));
      else assert.match(texto(destacados),/Referencia SASB/);
    }
  });
  test(`${sub}: ficha tema-03 del boceto, solo con las variables de su análisis, subfichas, foco, Escape y limpieza`,()=>{
    const r=iniciar(`#/materialidad/${sub}/tema-03`);
    const dialogo=todos(r.document.body).find(n=>n.attrs.role==='dialog');assert.ok(dialogo);
    assert.equal(dialogo.attrs['aria-modal'],'true');
    const links=todos(dialogo).filter(n=>n.tag==='a');
    assert.ok(links.some(n=>n.href==='#/ddhh/riesgos/riesgo-05'));
    // Solo las variables de la subpestaña: impacto no muestra financiera y viceversa.
    const vars=todos(dialogo).filter(n=>clase(n,'mat-var')).map(texto).join(' ');
    if(sub==='impacto'){assert.match(vars,/Severidad/);assert.match(vars,/Probabilidad/);assert.doesNotMatch(vars,/Rentabilidad|Gasto/);}
    if(sub==='financiera'){assert.match(vars,/Rentabilidad/);assert.match(vars,/Gasto operativo/);assert.doesNotMatch(vars,/Severidad|Probabilidad/);}
    if(sub==='doble'){assert.match(vars,/Materialidad de impacto/);assert.match(vars,/Materialidad financiera/);}
    assert.ok(todos(dialogo).filter(n=>clase(n,'mat-circulo')).every(n=>/sem-(rojo|naranja|ambar|amarillo|verde|gris)/.test(n.className)));
    assert.match(texto(dialogo),/GRI 3/);
    const subs=todos(dialogo).filter(n=>clase(n,'mat-boton-sub'));assert.equal(subs.length,2);
    subs[0].onclick();
    const filasCal=todos(dialogo).filter(n=>n.tag==='tbody').flatMap(b=>b.children);
    assert.equal(filasCal.length,sub==='impacto'?data.grupos.length:sub==='financiera'?data.evaluadores_financieros.length:data.grupos.length+data.evaluadores_financieros.length);
    subs[1].onclick();
    assert.ok(todos(dialogo).filter(n=>n.tag==='a').some(n=>n.href.startsWith('#/plan?accion=')));
    assert.match(texto(dialogo),/% de avance/);
    assert.ok(r.main.inert);const cerrar=r.document.activeElement;assert.equal(cerrar.tag,'button');
    r.eventos.keydown({key:'Escape',preventDefault(){}});assert.equal(r.location.hash,`#/materialidad/${sub}`);
    r.limpiar();assert.ok(!r.main.inert);assert.equal(r.eventos.keydown,undefined);
    assert.ok(!todos(r.document.body).some(n=>n.attrs.role==='dialog'));
  });
}
test('limpieza al navegar restaura el fondo y elimina los eventos',()=>{
  const r=iniciar('#/materialidad/doble/tema-03');r.location.hash='#/plan';r.limpiar();r.limpiar();
  assert.ok(!r.main.inert);assert.equal(r.eventos.keydown,undefined);
  assert.ok(!todos(r.document.body).some(n=>n.attrs.role==='dialog'));
});
test('sin datos conserva preparación y nota ilustrativa en cada vista',()=>{
  for(const sub of ['impacto','financiera','doble']) {
    const {main}=iniciar('#/materialidad/'+sub,true);
    assert.match(texto(main),/Contenido en preparación/);assert.match(texto(main),/Temas y calificaciones ilustrativos/);
  }
});
