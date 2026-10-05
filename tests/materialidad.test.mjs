import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import M from '../public/materialidad.js';
const leer = ruta => JSON.parse(fs.readFileSync(new URL('../public/' + ruta, import.meta.url), 'utf8'));
const datos = leer('data/materialidad.json'), cfg = leer('config/materialidad-config.json');
const riesgos = leer('data/riesgos.json'), estandares = leer('data/estandares.json'), plan = leer('data/plan.json');
const temas = datos.temas;
const media = xs => xs.reduce((a,b) => a+b,0)/xs.length;
const cerca = (a,b) => assert.ok(Math.abs(a-b)<1e-12, `${a} ≠ ${b}`);
const fijo = {...cfg, umbral:{...cfg.umbral, metodo:'fijo', valor_fijo:3}};
const ejemplo = (id, impacto, rentabilidad, gasto_operativo=rentabilidad) => ({id,
  evaluacion_impacto:{grupo:{escala:impacto, alcance:impacto, irremediabilidad:impacto, probabilidad:impacto}},
  evaluacion_financiera:{comite:{rentabilidad,gasto_operativo}}});

test('E8: universo, referencias, construcción y origen ilustrativo', () => {
  assert.equal(temas.length,15);
  assert.equal(new Set(temas.map(t=>t.id)).size,15);
  assert.equal(datos.grupos.length,6);
  assert.equal(datos.evaluadores_financieros.length,5);
  for(const t of temas){
    assert.match(t.id,/^tema-\d{2}$/);
    assert.ok(t.riesgos.length+t.ejes.length>0);
    assert.ok(t.riesgos.every(id=>riesgos.some(r=>r.id===id)));
    assert.ok(t.ejes.every(id=>estandares.ejes.some(e=>e.id===id)));
    assert.ok(['ambiental','social','gobernanza'].includes(t.dimension_esg));
    for(const [campo, lista, variables] of [
      ['evaluacion_impacto',datos.grupos,['escala','alcance','irremediabilidad','probabilidad']],
      ['evaluacion_financiera',datos.evaluadores_financieros,['rentabilidad','gasto_operativo']]]){
      assert.deepEqual(Object.keys(t[campo]).sort(),lista.map(g=>g.id).sort());
      for(const ev of Object.values(t[campo])) for(const k of variables){
        assert.ok(Number.isFinite(ev[k]) && ev[k]>=0 && ev[k]<=5);
        cerca(ev[k]*10, Math.round(ev[k]*10));
      }
    }
  }
  for(const registro of [datos,cfg,...temas,...datos.grupos,...datos.evaluadores_financieros,...temas.flatMap(t=>[...Object.values(t.evaluacion_impacto),...Object.values(t.evaluacion_financiera)])]) assert.equal(registro.origen,'ilustrativo');
});
test('E8: fórmulas y medias por grupo sin ponderar participantes',()=>{
  const t=ejemplo('a',2,4,2);
  t.evaluacion_impacto.otro={escala:3,alcance:4,irremediabilidad:5,probabilidad:2};
  assert.equal(M.severidad(t.evaluacion_impacto.otro,cfg),4);
  assert.deepEqual(M.porGrupo(t,cfg),{grupo:2,otro:3});
  assert.equal(M.importanciaImpacto(t,cfg),2.5);
  assert.equal(M.puntajeFinanciero(t,cfg),3);
});
test('E8: umbrales promedio y fijo',()=>{
  const u=M.umbrales(temas,cfg);
  cerca(u.impacto,media(temas.map(t=>M.importanciaImpacto(t,cfg))));
  cerca(u.financiera,media(temas.map(t=>M.puntajeFinanciero(t,cfg))));
  assert.deepEqual(M.umbrales(temas,fijo),{impacto:3,financiera:3});
});
test('E8: doble entrada y comparación estricta en los cuatro cuadrantes',()=>{
  const filas=M.clasificar([ejemplo('a',4,2),ejemplo('b',2,4),ejemplo('c',3,3),ejemplo('d',4,4)],fijo);
  assert.deepEqual(filas.map(f=>f.cuadrante),['impacto','financiera','no-material','doble']);
  assert.deepEqual(filas.map(f=>f.material),[true,true,false,true]);
  assert.equal(M.clasificar([ejemplo('a',3,3),ejemplo('b',3,3)],cfg).some(t=>t.material),false);
});
test('E8: convergencia usa tres medias propias incluso con umbral fijo',()=>{
  const ts=[ejemplo('a',2,4,1),ejemplo('b',4,2,5),ejemplo('c',3,3,3)];
  assert.deepEqual(M.clasificar(ts,fijo).map(t=>t.convergencia),[1,2,0]);
  assert.deepEqual(M.clasificar(ts,cfg).map(t=>t.convergencia),[1,2,0]);
});
test('E8: conteos y lista corta ordenada',()=>{
  const filas=M.clasificar(temas,cfg), corta=M.listaCorta(temas,cfg);
  assert.ok(corta.length>=7 && corta.length<=10);
  for(const cuadrante of ['doble','impacto','financiera']) assert.ok(filas.some(t=>t.cuadrante===cuadrante));
  assert.ok(filas.filter(t=>!t.material).length>=3);
  assert.deepEqual(new Set(corta.map(t=>t.id)),new Set(filas.filter(t=>t.material).map(t=>t.id)));
  for(let i=1;i<corta.length;i++) assert.ok(corta[i-1].impacto+corta[i-1].financiera>=corta[i].impacto+corta[i].financiera);
});
test('E8: cruce por riesgo O eje, sin duplicados, ordenado por id',()=>{
  const tema=temas[2], resultado=M.cruce(tema,{riesgos,plan:[...plan,...plan],estandares});
  assert.deepEqual(resultado.riesgos.map(r=>r.id),['riesgo-05']);
  assert.ok(resultado.acciones.length>0);
  const esperado=plan.filter(a=>a.riesgos.includes('riesgo-05')||a.ejes.includes('tema-ddhh-6')).map(a=>a.id).sort();
  assert.deepEqual(resultado.acciones.map(a=>a.id),esperado);
  assert.deepEqual(resultado.ejes.map(e=>e.id),['tema-ddhh-6']);
});
test('E8: errores claros para configuración, evaluaciones y universo inválidos',()=>{
  for(const cambio of [null,{}, {...cfg,escala:{minimo:0,maximo:6}}, {...cfg,impacto:{...cfg.impacto,agregacion_grupos:'suma'}}, {...cfg,financiera:{...cfg.financiera,variables:['rentabilidad']}}, {...cfg,umbral:{...cfg.umbral,metodo:'otro'}}, {...fijo,umbral:{...fijo.umbral,valor_fijo:6}}]) assert.throws(()=>M.clasificar(temas,cambio),/Configuración/);
  for(const n of [-1,6,NaN,Infinity,null,'3']) assert.throws(()=>M.importanciaImpacto(ejemplo('a',n,3),cfg),/fuera de escala/);
  assert.throws(()=>M.puntajeFinanciero(ejemplo('a',3,6),cfg),/fuera de escala/);
  assert.throws(()=>M.clasificar([],cfg),/Universo/);
  assert.throws(()=>M.clasificar([temas[0],temas[0]],cfg),/Ids/);
  assert.throws(()=>M.porGrupo({evaluacion_impacto:{}},cfg),/evaluaciones/);
});
test('E8: UMD navegador y pureza',()=>{
  const sandbox={};
  vm.runInNewContext(fs.readFileSync(new URL('../public/materialidad.js',import.meta.url),'utf8'),sandbox);
  assert.equal(typeof sandbox.Materialidad.clasificar,'function');
  const antes=JSON.stringify({temas,cfg,riesgos,plan,estandares});
  M.listaCorta(temas,cfg);M.cruce(temas[2],{riesgos,plan,estandares});
  assert.equal(JSON.stringify({temas,cfg,riesgos,plan,estandares}),antes);
});
