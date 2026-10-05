/* Capítulo 03: evidencia calculada con los mismos módulos que los detalles. */
(function () {
  'use strict';
  const numero = v => App.numero(v, {maximumFractionDigits: 1, minimumFractionDigits: 1});
  function svg(tag, attrs, texto) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (texto !== undefined) n.textContent = texto;
    return n;
  }
  function grafico(ancho, alto, etiqueta) {
    return svg('svg', {viewBox: `0 0 ${ancho} ${alto}`, role: 'img', 'aria-label': etiqueta, class: 'relato-grafico'});
  }
  function texto(s, x, y, t, attrs = {}) {
    s.append(svg('text', {x, y, fill: 'var(--texto)', 'font-size': 16, ...attrs}, t));
  }
  function estandares(c, d) {
    const evaluacion = Estandares.ordenar(d.evaluaciones.filter(e => ['fuente', 'cargada'].includes(e.origen)))[0];
    if (!evaluacion) { c.append(App.el('p', 'No hay evaluaciones reales disponibles.', 'nota')); return; }
    c.append(App.el('h4', 'Madurez de gestión · ' + evaluacion.fecha));
    const grupos = [['etapas-ocde', 'Proceso OCDE'], ['temas-ddhh', 'Temas de DDHH']];
    const max = d.umbrales.escala.maximo, umbral = d.umbrales.cortes[0].menor_que;
    grupos.forEach(([id, nombre]) => {
      const valores = Estandares.comparar(evaluacion, null, Estandares.ejesDe(id, d.estandares)).map(f => f.a).filter(v => v !== null);
      const media = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
      const etiqueta = nombre + ': ' + (media === null ? 'sin datos' : numero(media)) + ' sobre ' + max + '. Umbral ' + numero(umbral) + '.';
      const s = grafico(400, 84, etiqueta);
      texto(s, 0, 20, nombre); texto(s, 400, 20, media === null ? '—' : numero(media), {'text-anchor': 'end'});
      s.append(svg('rect', {x: 0, y: 36, width: 400, height: 24, rx: 4, fill: 'var(--suave)'}));
      if (media !== null) s.append(svg('rect', {x: 0, y: 36, width: 400 * media / max, height: 24, rx: 4, fill: 'var(--principal)'}));
      s.append(svg('line', {x1: 400 * umbral / max, x2: 400 * umbral / max, y1: 30, y2: 65, stroke: 'var(--texto)', 'stroke-width': 2}));
      texto(s, 0, 82, '0'); texto(s, 400, 82, String(max), {'text-anchor': 'end'}); c.append(s);
    });
    c.append(App.el('p', 'Cómo leerlo: una barra más larga indica mayor madurez. El filete marca el umbral ' + numero(umbral) + '.', 'nota'), App.el('h4', 'Tres dimensiones con menor puntaje'));
    const lista = App.el('ol', null, 'relato-brechas');
    Estandares.comparar(evaluacion, null, d.estandares.ejes).filter(f => f.a !== null).sort((a, b) => a.a - b.a || a.eje.id.localeCompare(b.eje.id)).slice(0, 3).forEach(f => lista.append(App.el('li', f.eje.nombre + ' · ' + numero(f.a))));
    c.append(lista);
  }
  function riesgos(c, d) {
    const ubicacion = Riesgos.ubicar(d.riesgos, d.criticidad);
    const niveles = d.criticidad.gravedad.cortes.map(corte => corte.nivel).reverse();
    const probabilidades = d.criticidad.probabilidad.slice().reverse();
    c.append(App.el('h4', 'Riesgos por gravedad y probabilidad'));
    const descripcion = Object.entries(ubicacion.celdas).map(([clave, ids]) => clave.replace('|', ', probabilidad ') + ': ' + ids.length).join('; ');
    const s = grafico(400, 260, 'Gravedad y probabilidad. ' + descripcion + '. Sin probabilidad: ' + ubicacion.sinProbabilidad.length);
    texto(s, 0, 20, 'Gravedad');
    niveles.forEach((nivel, fila) => {
      texto(s, 0, 65 + fila * 52, nivel);
      probabilidades.forEach((p, col) => {
        const x = 80 + col * 105, y = 34 + fila * 52, cantidad = ubicacion.celdas[nivel + '|' + p].length;
        s.append(svg('rect', {x, y, width: 99, height: 46, rx: 4, fill: `var(--${nivel.toLowerCase()}-fondo)`}));
        texto(s, x + 49, y + 30, String(cantidad), {'text-anchor': 'middle', fill: `var(--${nivel.toLowerCase()})`, 'data-riesgos': cantidad});
      });
    });
    probabilidades.forEach((p, col) => texto(s, 129 + col * 105, 214, p, {'text-anchor': 'middle'}));
    texto(s, 235, 248, 'Probabilidad', {'text-anchor': 'middle'}); c.append(s);
    c.append(App.el('p', ubicacion.sinProbabilidad.length + ' sin probabilidad: se conserva fuera de la matriz, sin asignarle un valor supuesto.', 'nota relato-sin-probabilidad'));
    const cadena = d.riesgos.filter(r => r.ambitos.some(a => a !== 'operacion-propia')).length, propia = d.riesgos.length - cadena;
    const etiqueta = 'Solo operación propia: ' + propia + '. Con algún ámbito en cadena de valor: ' + cadena + '.';
    c.append(App.el('h4', 'Dónde se concentran los riesgos'), App.el('p', etiqueta));
    const barra = grafico(400, 32, etiqueta), ancho = d.riesgos.length ? propia / d.riesgos.length * 400 : 0;
    barra.append(svg('rect', {x: 0, y: 0, width: ancho, height: 28, fill: 'var(--secundario)'}), svg('rect', {x: ancho, y: 0, width: d.riesgos.length ? 400 - ancho : 0, height: 28, fill: 'var(--principal)'})); c.append(barra);
    c.append(App.el('p', 'Cómo leerlo: cada riesgo cuenta una vez, según su evaluación de mayor gravedad. El color indica gravedad; la barra separa solo operación propia de cualquier presencia en la cadena.', 'nota'));
  }
  function materialidad(c, d) {
    c.append(App.el('h4', 'Prioridades por impacto y efecto financiero'));
    if (!d.materialidad?.temas?.length || !d.materialidadConfig) { c.append(App.el('p', 'Materialidad en preparación: todavía no hay datos disponibles.', 'nota')); return; }
    const temas = d.materialidad.temas, cfg = d.materialidadConfig, filas = Materialidad.clasificar(temas, cfg), limites = Materialidad.umbrales(temas, cfg);
    const nombre = id => temas.find(t => t.id === id).nombre;
    const panel = App.el('div', null, 'relato-materialidad');
    const s = grafico(360, 340, 'Doble materialidad. Umbral de impacto ' + numero(limites.impacto) + ', financiero ' + numero(limites.financiera) + '. ' + filas.map(f => nombre(f.id) + ': impacto ' + numero(f.impacto) + ', financiera ' + numero(f.financiera) + (f.material ? ', material' : ', no material')).join('; '));
    const x = v => 48 + v / cfg.escala.maximo * 280, y = v => 280 - v / cfg.escala.maximo * 230;
    s.append(svg('path', {d: 'M 48 42 V 280 H 335', fill: 'none', stroke: 'var(--linea)'}));
    s.append(svg('line', {x1: x(limites.impacto), x2: x(limites.impacto), y1: 42, y2: 280, stroke: 'var(--linea)', 'stroke-dasharray': '5 5'}), svg('line', {x1: 48, x2: 335, y1: y(limites.financiera), y2: y(limites.financiera), stroke: 'var(--linea)', 'stroke-dasharray': '5 5'}));
    filas.forEach(f => s.append(svg('circle', {cx: x(f.impacto), cy: y(f.financiera), r: 5, fill: f.material ? 'var(--principal)' : 'var(--superficie)', stroke: f.material ? 'var(--principal)' : 'var(--linea)'})));
    texto(s, 48, 304, '0'); texto(s, 328, 304, String(cfg.escala.maximo)); texto(s, 20, 55, String(cfg.escala.maximo));
    texto(s, 190, 333, 'Impacto', {'text-anchor': 'middle'}); texto(s, 48, 22, 'Financiera');
    const lista = App.el('ol', null, 'relato-lista-corta');
    Materialidad.listaCorta(temas, cfg).forEach(f => lista.append(App.el('li', nombre(f.id))));
    panel.append(s, lista); c.append(panel, App.el('p', 'Cómo leerlo: los puntos rellenos superan al menos un umbral discontinuo. Los umbrales son los promedios del universo: impacto ' + numero(limites.impacto) + ' y financiera ' + numero(limites.financiera) + '. La lista ordena los temas materiales.', 'nota'));
  }
  function plan(c, d) {
    const acciones = App.obtenerPlan(), fecha = new Date(), hoy = [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, '0'), String(fecha.getDate()).padStart(2, '0')].join('-');
    const resumen = Plan.resumen(acciones, d.planConfig, hoy), avance = resumen.avanceGlobal;
    c.append(App.el('h4', 'Avance global del plan'));
    const s = grafico(240, 240, 'Avance global: ' + numero(avance) + ' %. Promedio de ' + acciones.length + ' acciones.');
    const longitud = 2 * Math.PI * 90;
    s.append(svg('circle', {cx: 120, cy: 120, r: 90, fill: 'none', stroke: 'var(--suave)', 'stroke-width': 16}), svg('circle', {cx: 120, cy: 120, r: 90, fill: 'none', stroke: 'var(--principal)', 'stroke-width': 16, 'stroke-dasharray': `${longitud * avance / 100} ${longitud}`, transform: 'rotate(-90 120 120)', 'data-avance': avance}));
    texto(s, 120, 127, numero(avance) + ' %', {'text-anchor': 'middle', 'font-size': 32}); s.setAttribute('class', 'relato-anillo'); c.append(s);
    const lista = App.el('ul', null, 'relato-estados');
    Object.entries(resumen.porEstado).forEach(([estado, cantidad]) => lista.append(App.el('li', estado.replace(/-/g, ' ') + ': ' + cantidad)));
    lista.append(App.el('li', 'Vencidas: ' + resumen.vencidas)); c.append(lista, App.el('p', 'Cómo leerlo: el anillo muestra el promedio de avance de todas las acciones. Las vencidas tienen plazo anterior a hoy y aún no están cumplidas.', 'nota'));
    return acciones.some(a => a.seguimiento_ejemplo);
  }
  function render(contenedor, datos) {
    const el = App.el, titular = el('section', null, 'seccion pregunta');
    titular.append(el('p', 'En una frase', 'antetitulo'), el('p', datos.caso.resultados.titular)); contenedor.append(titular);
    const evidencias = {Estándares: estandares, Riesgos: riesgos, Materialidad: materialidad, Plan: plan};
    let ejemplo = false;
    datos.caso.resultados.mensajes.forEach((mensaje, i) => {
      const s = el('section', null, 'seccion relato-mensaje'), relato = el('div', null, 'relato-texto'), evidencia = el('div', null, 'relato-evidencia');
      evidencia.setAttribute('tabindex', '0'); evidencia.setAttribute('role', 'region'); evidencia.setAttribute('aria-label', 'Evidencia: ' + mensaje.tema);
      const enlace = el('a', 'Ver detalle →'); enlace.href = mensaje.destino;
      relato.append(el('p', String(i + 1).padStart(2, '0') + ' · ' + mensaje.tema, 'antetitulo'), el('h3', mensaje.titulo), el('p', mensaje.texto), enlace);
      if (evidencias[mensaje.tema](evidencia, datos)) ejemplo = true;
      s.append(relato, evidencia); contenedor.append(s);
    });
    contenedor.append(el('p', 'La materialidad es ilustrativa.' + (ejemplo ? ' El seguimiento del plan incluye avances de ejemplo.' : ''), 'nota'));
    const cierre = el('nav', null, 'seccion relato-cierre'); cierre.setAttribute('aria-label', 'Explorar los resultados');
    [['04 · Debida diligencia', '#/ddhh/dimensiones'], ['05 · Doble materialidad', '#/materialidad/doble'], ['06 · Plan de acción', '#/plan'], ['Volver al caso', '#/']].forEach(([t, ruta]) => { const a = el('a', t); a.href = ruta; cierre.append(a); }); contenedor.append(cierre);
  }
  App.registrarVista('resultados', {render});
}());
