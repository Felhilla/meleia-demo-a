/* Capítulo 01 · El caso: quién es la empresa, su cadena de valor y para qué nos contrató.
   Todo el relato sale de data/caso.json y de empresa-config.json; las cifras de entregables se calculan en vivo. */
(function () {
  'use strict';
  const SVG = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    const n = document.createElementNS(SVG, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  }
  // Motivo de marca Meleia: arco (horizonte) y punto dorado (propósito).
  function motivoArco(clase) {
    const s = svg('svg', {viewBox: '0 0 400 400', role: 'presentation', 'aria-hidden': 'true', class: clase || ''});
    [[170, 'var(--oro)', 2.2, 1], [138, 'var(--borde-fuerte)', 1, .9], [106, 'var(--borde-fuerte)', 1, .6]].forEach(([r, color, ancho, op]) => {
      s.append(svg('path', {d: `M ${200 - r} 300 A ${r} ${r} 0 0 1 ${200 + r} 300`, fill: 'none', stroke: color, 'stroke-width': ancho, 'stroke-linecap': 'round', opacity: op}));
    });
    s.append(svg('line', {x1: 10, y1: 300, x2: 390, y2: 300, stroke: 'var(--borde-fuerte)', 'stroke-width': 1}));
    s.append(svg('circle', {cx: 200, cy: 222, r: 15, fill: 'var(--oro)'}));
    return s;
  }

  function render(contenedor, datos) {
    const el = App.el, caso = datos.caso, empresa = datos.empresa;

    // 1 · Portada del caso
    const hero = el('section', null, 'caso-hero');
    const texto = el('div');
    const irPregunta = el('button', 'Para qué nos contrató', 'boton');
    const irResultados = el('a', 'Ver los resultados', 'boton secundario'); irResultados.href = '#/resultados';
    const acciones = el('div', null, 'acciones'); acciones.append(irPregunta, irResultados);
    texto.append(el('p', 'Caso demostrativo · Debida diligencia y doble materialidad', 'antetitulo'), el('h1', empresa.nombre),
      el('p', caso.empresa.lema, 'lema'), el('p', caso.empresa.perfil, 'perfil'), acciones);
    const arte = el('div', null, 'motivo-arco'); arte.append(motivoArco());
    hero.append(texto, arte);

    const hechos = el('div', null, 'hechos');
    caso.empresa.hechos.forEach(h => {
      const d = el('div', null, 'dato'); d.append(el('span', h.valor, 'cifra'), el('span', h.etiqueta, 'cifra-etiqueta')); hechos.append(d);
    });

    // 2 · Cadena de valor
    const cadenaSec = el('section', null, 'seccion');
    const cabCadena = el('div', null, 'seccion-cabeza');
    const tc = el('div'); tc.append(el('p', 'Contexto', 'antetitulo'), el('h2', 'Una operación que va de la planta a la puerta de cada hogar'));
    cabCadena.append(tc, el('p', 'La mayor parte del valor —y del riesgo— ocurre fuera de las plantas: en quienes abastecen, transportan y distribuyen el gas.'));
    const cadena = el('div', null, 'cadena'); cadena.setAttribute('role', 'list');
    caso.empresa.cadena.forEach((e, i) => {
      const item = el('article', null, 'eslabon' + (e.id === 'distribucion' ? ' foco' : '')); item.setAttribute('role', 'listitem');
      item.append(el('span', String(i + 1).padStart(2, '0'), 'numeral'), el('h3', e.nombre), el('p', e.descripcion));
      cadena.append(item);
    });
    cadenaSec.append(cabCadena, cadena, el('p', 'Alcance del análisis: ' + caso.encargo.alcance, 'alcance'));

    // 3 · Para qué nos contrató
    const encargoSec = el('section', null, 'seccion'); encargoSec.id = 'para-que';
    const pregunta = el('div', null, 'pregunta');
    pregunta.append(el('p', 'Para qué nos contrató', 'antetitulo'), el('p', '«' + caso.encargo.pregunta + '»'), motivoArco());
    const motivos = el('div', null, 'rejilla tres motivos');
    caso.encargo.motivos.forEach((m, i) => {
      const t = el('article', null, 'tarjeta motivo');
      t.append(el('span', String(i + 1).padStart(2, '0'), 'numeral'), el('h3', m.titulo), el('p', m.texto));
      motivos.append(t);
    });
    encargoSec.append(pregunta, motivos);

    // 4 · Qué entregamos (cifras en vivo)
    const plan = App.obtenerPlan();
    const avance = window.Plan ? Plan.resumen(plan, datos.planConfig).avanceGlobal : null;
    let materiales = null;
    try { if (window.Materialidad && datos.materialidad && datos.materialidadConfig) materiales = Materialidad.listaCorta(datos.materialidad.temas, datos.materialidadConfig).length; } catch (_) { /* sin cifra */ }
    const cifras = [
      [datos.estandares.ejes.length, 'dimensiones evaluadas frente a estándares'],
      [datos.riesgos.length, 'riesgos en derechos humanos identificados'],
      [materiales ?? '—', materiales === null ? 'temas materiales (en preparación)' : 'temas materiales de ' + datos.materialidad.temas.length + ' evaluados'],
      [plan.length, 'acciones' + (avance === null ? '' : ' · ' + App.numero(avance, {maximumFractionDigits: 0}) + ' % de avance' + (plan.some(a => a.seguimiento_ejemplo) ? ' (ejemplo)' : ''))]
    ];
    const entregaSec = el('section', null, 'seccion');
    const cabEntrega = el('div', null, 'seccion-cabeza');
    const te = el('div'); te.append(el('p', 'Qué entregamos', 'antetitulo'), el('h2', 'Cuatro resultados conectados entre sí'));
    cabEntrega.append(te, el('p', 'Cada riesgo se rastrea hasta su calificación, el derecho afectado y la acción que lo atiende; cada tema material, hasta los riesgos y brechas que lo explican.'));
    const entregables = el('div', null, 'rejilla cuatro');
    caso.encargo.entregables.forEach((e, i) => {
      const a = el('a', null, 'tarjeta entregable'); a.href = e.destino;
      a.append(el('span', cifras[i][0], 'cifra'), el('span', cifras[i][1], 'cifra-etiqueta'), el('h3', e.titulo), el('p', e.texto), el('span', 'Ver detalle →', 'ir'));
      entregables.append(a);
    });
    entregaSec.append(cabEntrega, entregables, el('p', caso.nota, 'nota'));

    contenedor.append(hero, hechos, cadenaSec, encargoSec, entregaSec);
    irPregunta.onclick = () => encargoSec.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
  }

  App.registrarVista('caso', {render});
}());
