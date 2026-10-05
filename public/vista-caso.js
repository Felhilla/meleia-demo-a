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

  /* Íconos de línea (48 × 48) para los datos de la empresa. Trazo en --principal; el dorado solo marca
     lo que importa (las regiones de operación en el mapa). */
  const ICONOS = {
    personas: [
      ['circle', {cx: 24, cy: 16, r: 6}], ['circle', {cx: 10, cy: 12, r: 4}], ['circle', {cx: 38, cy: 12, r: 4}],
      ['path', {d: 'M15 40V32a9 9 0 0 1 18 0v8M3 32v-7a7 7 0 0 1 11-6M45 32v-7a7 7 0 0 0-11-6'}]
    ],
    empresas: [
      ['path', {d: 'M4 42V20h12M16 42V6h16v36M32 16h12v26M2 42h44M21 13h6M21 21h6M21 29h6M9 26h3M9 34h3M36 23h3M36 31h3M22 42v-6h4v6'}]
    ],
    encuesta: [
      ['path', {d: 'M17 8H9v36h30V8h-8'}], ['rect', {x:17,y:4,width:14,height:8,rx:3}],
      ['path', {d: 'M14 21l3 3 5-6M26 21h7M14 33l3 3 5-6M26 33h7'}]
    ],
    taller: [
      ['rect', {x:5,y:7,width:38,height:25,rx:2}], ['path', {d: 'M24 3v4M24 32v12M16 44l8-12 8 12M12 25l8-8 7 4 9-9'}]
    ],
    planta: [
      ['path', {d: 'M4 40V21l8 5v-5l8 5v-5l8 5v14'}],
      ['circle', {cx: 37, cy: 22, r: 7}],
      ['path', {d: 'M32 27l-2 13M42 27l2 13M37 29v11'}],
      ['path', {d: 'M2 40h44'}],
      ['path', {d: 'M9 33h4M17 33h4'}]
    ],
    camion: [
      ['rect', {x: 7, y: 11, width: 5, height: 10, rx: 2.5}],
      ['rect', {x: 14, y: 11, width: 5, height: 10, rx: 2.5}],
      ['rect', {x: 21, y: 11, width: 5, height: 10, rx: 2.5}],
      ['path', {d: 'M4 21h26v11H4z'}],
      ['path', {d: 'M30 21h8l6 7v4H30z'}],
      ['path', {d: 'M33 24h4l3 4h-7z'}],
      ['circle', {cx: 12, cy: 35, r: 3.5}],
      ['circle', {cx: 36, cy: 35, r: 3.5}]
    ],
    casco: [
      ['path', {d: 'M9 31a15 14 0 0 1 30 0'}],
      ['path', {d: 'M24 17v14M18 19.5V31M30 19.5V31'}],
      ['rect', {x: 5, y: 31, width: 38, height: 5, rx: 2.5}]
    ],
    mapa: [
      ['path', {d: 'M11.4 10.1 L14.5 13.7 L15.9 10.1 L19.3 7.3 L23.6 2.2 L27.4 5.1 L30.3 7.7 L36.0 12.0 L29.1 14.4 L26.7 19.7 L29.1 23.5 L34.8 24.5 L34.6 28.3 L37.0 28.1 L39.1 31.9 L37.4 38.6 L38.4 40.7 L37.0 43.3 L35.1 45.9 L32.7 44.3 L25.5 39.5 L21.0 34.3 L18.8 30.7 L16.4 26.1 L13.5 20.9 L12.1 17.5 L9.5 16.3 L9.0 13.2Z'}],
      ['circle', {cx: 14.5, cy: 21.4, r: 2.8, oro: true}],
      ['circle', {cx: 19.3, cy: 30.7, r: 2.8, oro: true}]
    ]
  };
  // Encuadre ajustado a cada dibujo para que llene el círculo; el trazo no se escala.
  const ENCUADRE = {personas: '0 5 48 38', empresas: '0 3 48 42', encuesta: '6 1 36 46', taller: '2 0 44 47', planta: '0 12 48 31', camion: '1 8 46 33', casco: '3 14 42 24', mapa: '6 0 36 48'};
  function icono(nombre) {
    const partes = ICONOS[nombre];
    if (!partes) return null;
    const s = svg('svg', {viewBox: ENCUADRE[nombre] || '0 0 48 48', width: 48, height: 48, 'aria-hidden': 'true', class: 'icono-dato', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
    partes.forEach(([tag, attrs]) => {
      const {oro, ...resto} = attrs;
      s.append(svg(tag, oro ? {...resto, fill: 'var(--oro)', stroke: 'none'} : {...resto, 'vector-effect': 'non-scaling-stroke'}));
    });
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
      // Tarjeta del boceto: círculo con el ícono (sobresale a la izquierda), cifra y etiqueta.
      const d = el('div', null, 'hecho'), circulo = el('span', null, 'hecho-icono');
      const i = icono(h.icono); if (i) circulo.append(i);
      d.append(circulo, el('span', h.valor, 'cifra'), el('span', h.etiqueta, 'cifra-etiqueta')); hechos.append(d);
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

  App.icono = icono; // Íconos de línea reutilizables por otros capítulos.
  App.registrarVista('caso', {render});
}());
