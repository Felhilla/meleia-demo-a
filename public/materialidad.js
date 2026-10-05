/* Doble materialidad ilustrativa. Módulo puro, sin DOM ni dependencias. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Materialidad = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const exigir = (ok, mensaje) => { if (!ok) throw new Error(mensaje); };
  const objeto = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const promedio = valores => valores.reduce((a, b) => a + b, 0) / valores.length;
  const mismas = (a, b) => Array.isArray(a) && a.length === b.length && new Set(a).size === b.length && b.every(k => a.includes(k));
  function validar(cfg) {
    const error = 'Configuración de materialidad inválida: ';
    exigir(objeto(cfg), error + 'se requiere un objeto');
    exigir(objeto(cfg.escala) && cfg.escala.minimo === 0 && cfg.escala.maximo === 5, error + 'escala 0–5');
    exigir(objeto(cfg.impacto) && mismas(cfg.impacto.severidad, ['escala', 'alcance', 'irremediabilidad']), error + 'variables de severidad');
    exigir(cfg.impacto.agregacion_severidad === 'promedio' && cfg.impacto.agregacion_grupos === 'promedio' && cfg.impacto.importancia === 'promedio(severidad, probabilidad)', error + 'agregación de impacto no soportada');
    exigir(objeto(cfg.financiera) && mismas(cfg.financiera.variables, ['rentabilidad', 'gasto_operativo']) && cfg.financiera.agregacion === 'promedio' && cfg.financiera.agregacion_evaluadores === 'promedio', error + 'agregación financiera no soportada');
    exigir(objeto(cfg.umbral) && ['fijo', 'promedio_universo'].includes(cfg.umbral.metodo) && cfg.umbral.regla === 'doble_entrada', error + 'regla de umbral no soportada');
    exigir(cfg.umbral.metodo === 'fijo' ? Number.isFinite(cfg.umbral.valor_fijo) && cfg.umbral.valor_fijo >= 0 && cfg.umbral.valor_fijo <= 5 : cfg.umbral.valor_fijo === null, error + 'valor_fijo');
  }
  function valor(ev, k, cfg) {
    exigir(objeto(ev) && Number.isFinite(ev[k]) && ev[k] >= cfg.escala.minimo && ev[k] <= cfg.escala.maximo, 'Evaluación: ' + k + ' fuera de escala 0–5 o ausente');
    return ev[k];
  }
  function evaluaciones(tema, clave) {
    exigir(objeto(tema) && objeto(tema[clave]) && Object.keys(tema[clave]).length > 0, 'Tema: ' + clave + ' debe contener evaluaciones por id');
    return Object.entries(tema[clave]);
  }
  function severidad(ev, cfg) {
    validar(cfg);
    return promedio(cfg.impacto.severidad.map(k => valor(ev, k, cfg)));
  }
  function porGrupo(tema, cfg) {
    validar(cfg);
    return Object.fromEntries(evaluaciones(tema, 'evaluacion_impacto').map(([id, ev]) => [id, promedio([severidad(ev, cfg), valor(ev, 'probabilidad', cfg)])]));
  }
  function importanciaImpacto(tema, cfg) {
    return promedio(Object.values(porGrupo(tema, cfg)));
  }
  function variablesFinancieras(tema, cfg) {
    validar(cfg);
    const evs = evaluaciones(tema, 'evaluacion_financiera').map(([, ev]) => ev);
    return Object.fromEntries(cfg.financiera.variables.map(k => [k, promedio(evs.map(ev => valor(ev, k, cfg)))]));
  }
  function puntajeFinanciero(tema, cfg) {
    return promedio(Object.values(variablesFinancieras(tema, cfg)));
  }
  function puntajes(temas, cfg) {
    validar(cfg);
    exigir(Array.isArray(temas) && temas.length > 0, 'Universo de temas vacío o inválido');
    exigir(temas.every(t => objeto(t) && typeof t.id === 'string' && t.id.trim()) && new Set(temas.map(t => t.id)).size === temas.length, 'Ids de temas ausentes o duplicados');
    return temas.map(t => ({ id: t.id, impacto: importanciaImpacto(t, cfg), financiera: puntajeFinanciero(t, cfg), ...variablesFinancieras(t, cfg) }));
  }
  function limites(filas, cfg) {
    return Object.fromEntries(['impacto', 'financiera'].map(k => [k, cfg.umbral.metodo === 'fijo' ? cfg.umbral.valor_fijo : promedio(filas.map(f => f[k]))]));
  }
  function umbrales(temas, cfg) {
    return limites(puntajes(temas, cfg), cfg);
  }
  function clasificar(temas, cfg) {
    const filas = puntajes(temas, cfg), cortes = limites(filas, cfg);
    const variables = ['impacto', 'rentabilidad', 'gasto_operativo'];
    const medias = Object.fromEntries(variables.map(k => [k, promedio(filas.map(f => f[k]))]));
    return filas.map(f => {
      const i = f.impacto > cortes.impacto, n = f.financiera > cortes.financiera;
      return { id: f.id, impacto: f.impacto, financiera: f.financiera,
        cuadrante: i && n ? 'doble' : i ? 'impacto' : n ? 'financiera' : 'no-material',
        material: i || n, convergencia: variables.filter(k => f[k] > medias[k]).length };
    });
  }
  function listaCorta(temas, cfg) {
    return clasificar(temas, cfg).filter(t => t.material).sort((a, b) => (b.impacto + b.financiera) - (a.impacto + a.financiera) || a.id.localeCompare(b.id));
  }
  function cruce(tema, { riesgos, plan, estandares }) {
    exigir(objeto(tema) && Array.isArray(tema.riesgos) && Array.isArray(tema.ejes), 'Tema: vínculos inválidos');
    exigir(Array.isArray(riesgos) && Array.isArray(plan) && objeto(estandares) && Array.isArray(estandares.ejes), 'Cruce: colecciones inválidas');
    const rs = new Set(tema.riesgos), es = new Set(tema.ejes);
    const unicos = filas => [...new Map(filas.map(f => [f.id, f])).values()].sort((a, b) => a.id.localeCompare(b.id));
    return { riesgos: unicos(riesgos.filter(r => rs.has(r.id))), ejes: unicos(estandares.ejes.filter(e => es.has(e.id))),
      acciones: unicos(plan.filter(a => (a.riesgos || []).some(id => rs.has(id)) || (a.ejes || []).some(id => es.has(id)))) };
  }
  return { severidad, importanciaImpacto, puntajeFinanciero, umbrales, clasificar, listaCorta, cruce, porGrupo };
}));
