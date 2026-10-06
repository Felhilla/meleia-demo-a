(function () {
  'use strict';
  // Cajas conservadoras: hasta 18 px por carácter, líneas de 22 px.
  // La proyección radial de la caja queda fuera del círculo y sus puntajes.
  function posicionesArana(indice, total, partes, nivel = 5) {
    const angulo = 2 * Math.PI * indice / total - Math.PI / 2;
    const ux = Math.cos(angulo), uy = Math.sin(angulo);
    const ancho = Math.max(...partes.map(p => [...p].reduce((ancho, letra) => ancho + (/[MWmw]/.test(letra) ? 18 : 12), 0)), 12);
    const alto = partes.length * 22;
    const distancia = 240 + 36 + Math.abs(ux) * ancho / 2 + Math.abs(uy) * alto / 2;
    const x = 360 + ux * distancia, y = 350 + uy * distancia;
    const anguloNumero = -Math.PI / 2 + Math.PI / total;
    const nx = 360 + Math.cos(anguloNumero) * 240 * nivel / 5;
    const ny = 350 + Math.sin(anguloNumero) * 240 * nivel / 5;
    return {
      etiqueta: {x, y: y - alto / 2 + 17, caja: {x: x - ancho / 2, y: y - alto / 2, ancho, alto}},
      numero: {x: nx, y: ny, caja: {x: nx - 3, y: ny - 20, ancho: 24, alto: 26}}
    };
  }
  if (typeof module === 'object' && module.exports) { module.exports = {posicionesArana}; return; }
  /* Capítulo 04 · Resultados por dimensión. Boceto de Felipe: una tarjeta por dimensión con
     encabezado (dimensión), cuerpo en tres columnas (hallazgos · araña · brechas) y pie de estándares relacionados.
     Dos niveles: las dos grandes dimensiones y, al elegir un eje, su tarjeta de detalle con sus indicadores. */
  const E = window.Estandares, el = App.el;
  const respaldo = 'No hay conexión con la base de datos: se muestran los datos de respaldo; las evaluaciones nuevas no se pueden guardar ahora.';
  const graficos = [['etapas-ocde', 'Etapas de la debida diligencia (Guía OCDE)'], ['temas-ddhh', 'Temas de DDHH']];
  const formato = new Intl.NumberFormat('es-CO', {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const numero = n => n === null || n === undefined || Number.isNaN(n) ? 'Sin información' : formato.format(n);
  const delta = n => n === null || n === undefined ? '' : `${Math.abs(n) < 0.05 ? '=' : n > 0 ? '▲' : '▼'} ${n > 0.049 ? '+' : ''}${formato.format(Math.abs(n) < 0.05 ? 0 : n)}`;
  const etiqueta = e => {
    const nombre = e.nombre.replace(e.fecha, '').replace(new RegExp('\\s+' + e.fecha.slice(0, 4) + '$'), '').replace(/\s*\(ejemplo\)\s*/gi, '').trim();
    const fecha = new Intl.DateTimeFormat('es-CO', {month: 'short', year: 'numeric'}).format(new Date(e.fecha + '-01T12:00:00')).replace(' de ', ' ');
    return `${nombre} · ${fecha}${e.origen === 'ejemplo' ? ' (ejemplo)' : e.origen === 'cargada' ? ' · Cargada en la plataforma' : ''}`;
  };
  function svg(tag, attrs, texto) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
    if (texto !== undefined) n.textContent = texto;
    return n;
  }
  function lineas(texto, limite) {
    return texto.split(/\s+/).reduce((r, palabra) => {
      if (!r.length || r[r.length - 1].length + palabra.length + 1 > limite) r.push(palabra);
      else r[r.length - 1] += ' ' + palabra;
      return r;
    }, []);
  }
  const TONOS = ['var(--alta)', 'var(--media)', 'var(--baja)'];
  function tono(valor, umbrales) {
    if (valor === null || valor === undefined) return 'var(--texto-suave)';
    const i = umbrales.cortes.findIndex(c => c.menor_que === null || valor < c.menor_que);
    return TONOS[i] || 'var(--principal)';
  }
  const promedio = vs => { const v = vs.filter(n => typeof n === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

  /* Geometría de etiquetas para tipografía de 24 px: caja conservadora por carácter y por línea,
     proyectada fuera del círculo para que nunca toque anillos, valores ni puntos. */
  const R = 300, CX = 0, CY = 0, CHAR = 13, LINEA = 28, HOLGURA = 36;
  function ubicarEtiqueta(indice, total, partes) {
    const angulo = 2 * Math.PI * indice / total - Math.PI / 2, ux = Math.cos(angulo), uy = Math.sin(angulo);
    const ancho = Math.max(...partes.map(p => p.length * CHAR), CHAR), alto = partes.length * LINEA;
    const d = R + HOLGURA + Math.abs(ux) * ancho / 2 + Math.abs(uy) * alto / 2;
    const x = CX + ux * d, y = CY + uy * d;
    return {x, y: y - alto / 2 + 21, caja: {x: x - ancho / 2, y: y - alto / 2, ancho, alto}};
  }
  /* Araña genérica: ejes = [{clave, texto, partes}], valores y comparación alineados con ejes. */
  function arana({ejes, valores, comparacion, seleccionado, rotulo, umbrales, alElegir}) {
    const total = ejes.length, centro = [CX, CY], radio = R;
    const posiciones = ejes.map((e, i) => ubicarEtiqueta(i, total, e.partes));
    const cajas = posiciones.map(p => p.caja);
    const x0 = Math.min(-R, ...cajas.map(c => c.x)) - 12, y0 = Math.min(-R, ...cajas.map(c => c.y)) - 12;
    const x1 = Math.max(R, ...cajas.map(c => c.x + c.ancho)) + 12, y1 = Math.max(R, ...cajas.map(c => c.y + c.alto)) + 12;
    const dibujo = svg('svg', {viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}`, role: 'group', 'aria-label': rotulo, class: 'dim-arana'});
    const puntos = vals => E.puntosPoligono(vals, radio, centro);
    const cadena = ps => ps.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
    for (let nivel = 1; nivel <= 5; nivel++) dibujo.append(svg('polygon', {points: cadena(puntos(ejes.map(() => nivel))), class: 'dim-anillo' + (nivel === 5 ? ' borde' : '')}));
    puntos(ejes.map(() => 5)).forEach(([x, y], i) => dibujo.append(svg('line', {x1: centro[0], y1: centro[1], x2: x, y2: y, class: 'dim-radio' + (ejes[i].clave === seleccionado ? ' activo' : '')})));
    const angNivel = -Math.PI / 2 + Math.PI / total;
    [1, 3, 5].forEach(nivel => dibujo.append(svg('text', {x: CX + Math.cos(angNivel) * R * nivel / 5 + 6, y: CY + Math.sin(angNivel) * R * nivel / 5, class: 'dim-nivel'}, String(nivel))));
    if (comparacion && comparacion.every(v => typeof v === 'number')) dibujo.append(svg('polygon', {points: cadena(puntos(comparacion)), class: 'dim-comparada'}));
    if (valores.every(v => typeof v === 'number')) dibujo.append(svg('polygon', {points: cadena(puntos(valores)), class: 'dim-principal'}));
    const vertices = puntos(valores.map(v => v ?? 0));
    ejes.forEach((eje, i) => {
      const [x, y] = vertices[i], v = valores[i], c = comparacion?.[i];
      const lectura = `${eje.texto}: ${numero(v)}${typeof c === 'number' ? ` (antes ${numero(c)}, ${delta(v - c)})` : ''}`;
      const g = svg('g', {class: 'dim-vertice' + (eje.clave === seleccionado ? ' activo' : ''), tabindex: alElegir ? 0 : -1, role: alElegir ? 'button' : 'img', 'aria-label': lectura});
      g.append(svg('title', {}, lectura));
      const p = posiciones[i], texto = svg('text', {x: p.x, y: p.y, 'text-anchor': 'middle', class: 'dim-etiqueta'});
      eje.partes.forEach((parte, j) => texto.append(svg('tspan', {x: p.x, dy: j ? LINEA : 0}, parte)));
      g.append(texto, svg('circle', {cx: x, cy: y, r: 9, fill: tono(v, umbrales), class: 'dim-punto'}), svg('text', {x: x + 14, y: y - 12, class: 'dim-valor'}, numero(v)));
      if (alElegir) {
        g.addEventListener('click', () => alElegir(eje.clave));
        g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); alElegir(eje.clave); } });
      }
      dibujo.append(g);
    });
    return dibujo;
  }
  function barras(items, umbrales) {
    const lista = el('ol', null, 'dim-barras');
    items.slice().sort((a, b) => (a.valor ?? -1) - (b.valor ?? -1)).forEach(it => {
      const li = el('li'), pista = el('span', null, 'pista'), relleno = el('span', null, 'relleno');
      relleno.style.width = ((it.valor ?? 0) / 5 * 100) + '%'; relleno.style.background = tono(it.valor, umbrales);
      pista.append(relleno); li.append(el('span', it.codigo, 'codigo'), el('span', it.texto, 'texto'), pista, el('strong', numero(it.valor)));
      lista.append(li);
    });
    return lista;
  }
  function columna(titulo, frases, clase) {
    const c = el('div', null, 'dim-col ' + clase);
    c.append(el('h3', titulo));
    const ul = el('ul'); (frases || []).forEach(f => ul.append(el('li', f))); c.append(ul);
    return c;
  }
  function pie(estandares) {
    const p = el('footer', null, 'dim-pie');
    p.append(el('span', 'Estándares relacionados', 'antetitulo'));
    const lista = el('ul', null, 'dim-estandares'); estandares.forEach(s => lista.append(el('li', s)));
    p.append(lista); return p;
  }
  function indicadorCompleto(i) {
    const n = el('article', null, 'dim-indicador');
    n.append(el('h4', `${i.codigo} · ${i.pregunta}`), el('p', `Calificación: ${numero(i.calificacion)} · Incorporado: ${i.incorporado === 'si' ? 'sí' : i.incorporado === 'no' ? 'no' : 'sin información'}`, 'nota'));
    if (i.descripcion) n.append(el('p', i.descripcion, 'texto-dato'));
    n.append(el('p', i.brecha ? 'Brecha: ' + i.brecha : 'Sin brecha registrada', 'dim-brecha texto-dato'));
    return n;
  }

  App.registrarVista('estandares', {render(contenedor, datos, params) {
    let activo = true, dialogo, evaluaciones = [], principal, comparada, ejeId = null, sinBase = false;
    const dims = datos.dimensiones || {grandes: [], ejes: {}};
    const raiz = el('div', null, 'dim');
    const aviso = el('p', 'Cargando evaluaciones…', 'nota dim-aviso'); aviso.setAttribute('role', 'status');
    const controles = el('div', null, 'dim-barra'), cuerpo = el('div');
    raiz.append(controles, aviso, cuerpo); contenedor.append(raiz);
    function url() {
      const q = new URLSearchParams({eval: principal.id}); if (comparada) q.set('vs', comparada.id); if (ejeId) q.set('eje', ejeId);
      history.replaceState(null, '', '#/ddhh/dimensiones?' + q);
    }
    function avisoBase() { aviso.textContent = sinBase ? respaldo : ''; aviso.hidden = !sinBase; }
    let cerrarFicha = null, disparador = null;
    function elegir(id) {
      disparador = document.activeElement;
      ejeId = id; url(); dibujar(); abrirFicha();
    }
    function cabeza(antetitulo, titulo, subtitulo, valor, anterior) {
      const h = el('header', null, 'dim-cabeza'), t = el('div');
      const h2 = el('h2', titulo); h2.tabIndex = -1;
      t.append(el('p', antetitulo, 'antetitulo'), h2, el('p', subtitulo, 'dim-pregunta'));
      const c = el('div', null, 'dim-puntaje');
      c.append(el('span', numero(valor), 'cifra'), el('span', 'sobre 5', 'cifra-etiqueta'));
      if (typeof anterior === 'number' && typeof valor === 'number') c.append(el('span', delta(valor - anterior) + ' frente a ' + etiqueta(comparada).split(' · ')[0].toLowerCase(), 'dim-delta'));
      h.append(t, c); return h;
    }
    function tarjetaGeneral(g, indice) {
      const ejes = E.ejesDe(g.id, datos.estandares), filas = E.comparar(principal, comparada, ejes);
      const t = el('article', null, 'tarjeta dim-tarjeta');
      t.append(cabeza(`Dimensión ${indice + 1} de 2`, g.titulo, g.pregunta, promedio(filas.map(f => f.a)), comparada ? promedio(filas.map(f => f.b)) : null));
      const medio = el('div', null, 'dim-centro');
      medio.append(arana({ejes: ejes.map(e => ({clave: e.id, texto: e.nombre, partes: lineas(dims.ejes[e.id]?.corto || e.nombre, 13)})), valores: filas.map(f => f.a), comparacion: comparada ? filas.map(f => f.b) : null,
        seleccionado: ejeId, rotulo: g.titulo, umbrales: datos.umbrales, alElegir: elegir}), el('p', 'Toque un eje para ver su detalle.', 'nota dim-ayuda'));
      const cuerpoT = el('div', null, 'dim-cuerpo');
      cuerpoT.append(columna('Hallazgos', g.hallazgos, 'hallazgos'), medio, columna('Brechas', g.brechas, 'brechas'));
      t.append(cuerpoT, pie(g.estandares));
      const tabla = el('table'), thead = el('thead'), tr = el('tr');
      ['Eje', 'Puntaje', comparada ? 'Comparación' : null, comparada ? 'Diferencia' : null].filter(Boolean).forEach(x => { const th = el('th', x); th.scope = 'col'; tr.append(th); });
      thead.append(tr); tabla.append(thead);
      const tb = el('tbody');
      filas.slice().sort((a, b) => (a.a ?? 0) - (b.a ?? 0)).forEach(f => {
        const fila = el('tr'), th = el('th'), b = el('button', f.eje.nombre, 'enlace'); th.scope = 'row'; b.onclick = () => elegir(f.eje.id); th.append(b); fila.append(th);
        fila.append(el('td', numero(f.a))); if (comparada) fila.append(el('td', numero(f.b)), el('td', delta(f.diferencia)));
        tb.append(fila);
      });
      tabla.append(tb);
      const det = el('details', null, 'e3-datos dim-tabla'); det.append(el('summary', 'Ver puntajes por eje, de menor a mayor'), tabla); t.append(det);
      return t;
    }
    /* Ficha del eje en ventana (boceto de Felipe): título | calificación; hallazgos clave en viñetas;
       tabla Indicador | Calificación | Brecha específica | Estándares relacionados (a más texto, más espacio). */
    function circulo(valor) {
      const nivel = (datos.caso?.metodologia?.calificacion?.brechas?.niveles || []).find(n => typeof valor === 'number' && n.valor === Math.floor(valor));
      return el('span', typeof valor === 'number' ? numero(valor) : '—', 'dim-circulo sem-' + (nivel?.color || 'gris'));
    }
    function abrirFicha() {
      if (cerrarFicha) cerrarFicha(false);
      const eje = datos.estandares.ejes.find(e => e.id === ejeId);
      if (!eje) return;
      const g = dims.grandes.find(x => x.id === eje.grafico), info = dims.ejes[eje.id] || {};
      const valor = principal.puntajes[eje.id], antes = comparada?.puntajes[eje.id];
      const nivel = (datos.caso?.metodologia?.calificacion?.brechas?.niveles || []).find(n => typeof valor === 'number' && n.valor === Math.floor(valor));
      const fondo = el('div', null, 'fondo-dialogo centrado');
      const panel = el('section', null, 'panel dim-ficha'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'dim-ficha-titulo'); panel.tabIndex = -1;
      const cerrar = el('button', 'Cerrar ×', 'dim-cerrar');
      // Fila 1: título | calificación
      const cabeza = el('header', null, 'dim-ficha-cabeza');
      const titulo = el('div', null, 'dim-ficha-titulo');
      const h2 = el('h2', eje.nombre); h2.id = 'dim-ficha-titulo';
      titulo.append(el('p', g?.titulo || 'Dimensión', 'antetitulo'), h2, el('p', E.nivelEscala(valor, datos.estandares.escala), 'nota'));
      const calif = el('div', null, 'dim-ficha-calif sem-fondo-' + (nivel?.color || 'gris'));
      calif.append(el('span', 'Calificación', 'dim-ficha-rotulo'), el('strong', typeof valor === 'number' ? numero(valor) : '—'), el('span', (nivel ? nivel.nombre + ' · ' : '') + 'sobre 5', 'dim-ficha-nivel'));
      if (typeof antes === 'number' && typeof valor === 'number') calif.append(el('span', delta(valor - antes) + ' frente a la comparación', 'dim-ficha-nivel'));
      cabeza.append(titulo, calif);
      // Fila 2: hallazgos clave
      const hallazgos = el('section', null, 'dim-ficha-hallazgos');
      hallazgos.append(el('h3', 'Hallazgos clave'));
      const ul = el('ul'); (info.hallazgos || []).forEach(h => ul.append(el('li', h))); hallazgos.append(ul);
      // Fila 3: estándares relacionados (son generales del aspecto): fila completa en viñetas.
      const estandaresFila = el('section', null, 'dim-ficha-estandares-fila');
      estandaresFila.append(el('h3', 'Estándares relacionados'));
      const ule = el('ul'); (info.estandares || []).forEach(x => ule.append(el('li', x))); estandaresFila.append(ule);
      // Tabla de indicadores: Indicador | Calificación | Brecha específica (a más texto, más espacio).
      const indicadores = E.indicadoresEje(datos.estandares, eje.id);
      const tablaDe = lista => {
        const tabla = el('table', null, 'dim-ficha-tabla');
        const cols = el('colgroup'); ['indicador', 'calif', 'brecha'].forEach(c => { const col = el('col'); col.className = 'col-' + c; cols.append(col); }); tabla.append(cols);
        const thead = el('thead'), tr = el('tr');
        ['Indicador', 'Calificación', 'Brecha específica'].forEach(t => { const th = el('th', t); th.scope = 'col'; tr.append(th); });
        thead.append(tr); tabla.append(thead);
        const tb = el('tbody');
        lista.forEach(i => {
          const fila = el('tr'), th = el('th'); th.scope = 'row';
          th.append(el('span', i.codigo, 'dim-codigo'), document.createTextNode(i.pregunta));
          const tdc = el('td', null, 'dim-ficha-c'); tdc.append(circulo(i.calificacion));
          fila.append(th, tdc, el('td', i.brecha || 'Sin brecha registrada', i.brecha ? 'dim-ficha-brecha' : 'dim-ficha-brecha vacia'));
          tb.append(fila);
        });
        tabla.append(tb);
        const env = el('div', null, 'dim-ficha-tabla-env'); env.append(tabla); return env;
      };
      // Fila 4: componentes (criterios mínimos) que dan la calificación del aspecto; cada uno despliega sus indicadores.
      const grupos = eje.hallazgos?.grupos;
      const cuerpoInd = el('section', null, 'dim-ficha-cuerpo');
      if (grupos && grupos.length) {
        cuerpoInd.append(el('h3', 'Componentes de la calificación'), el('p', 'La calificación del aspecto es el promedio de sus componentes. Toque un componente para ver sus indicadores.', 'nota'));
        const comps = el('div', null, 'dim-componentes');
        let n = 0;
        grupos.forEach((gr, k) => {
          const criterio = eje.criterios?.[k], cal = E.parsearPuntaje(criterio?.calificacion);
          const propios = gr.indicadores.map(() => indicadores[n++]);
          const nivelC = (datos.caso?.metodologia?.calificacion?.brechas?.niveles || []).find(x => typeof cal === 'number' && x.valor === Math.floor(cal));
          const item = el('article', null, 'dim-comp');
          const boton = el('button', null, 'dim-comp-boton'); boton.type = 'button'; boton.setAttribute('aria-expanded', 'false');
          const idTabla = 'dim-comp-' + eje.id + '-' + k; boton.setAttribute('aria-controls', idTabla);
          const textoC = el('span', null, 'dim-comp-texto');
          textoC.append(el('span', 'Componente ' + (k + 1), 'dim-comp-num'), el('strong', criterio?.nombre || gr.nombre), el('span', (nivelC ? nivelC.nombre + ' · ' : '') + propios.length + ' indicadores', 'dim-comp-meta'));
          const grande = circulo(cal); grande.classList?.add('grande'); if (!grande.classList) grande.className += ' grande';
          boton.append(grande, textoC, el('span', 'Ver indicadores', 'dim-comp-accion'));
          const region = el('div', null, 'dim-comp-indicadores'); region.id = idTabla; region.hidden = true; region.append(tablaDe(propios));
          boton.onclick = () => {
            const abrir = boton.getAttribute('aria-expanded') !== 'true';
            boton.setAttribute('aria-expanded', String(abrir)); region.hidden = !abrir;
            boton.querySelector('.dim-comp-accion').textContent = abrir ? 'Ocultar indicadores' : 'Ver indicadores';
          };
          item.append(boton, region); comps.append(item);
        });
        cuerpoInd.append(comps);
      } else {
        cuerpoInd.append(el('h3', 'Indicadores evaluados (' + indicadores.length + ')'), tablaDe(indicadores));
      }
      // Pie: acciones del plan que cierran la brecha (trazabilidad)
      const acciones = App.obtenerPlan().filter(a => a.ejes?.includes(eje.id));
      const pieAcc = el('footer', null, 'dim-ficha-acciones');
      pieAcc.append(el('h3', acciones.length ? `Acciones del plan que cierran esta brecha (${acciones.length})` : 'Aún no hay acciones del plan vinculadas a esta dimensión'));
      const la = el('ul'); acciones.forEach(a => { const li = el('li'), link = el('a', a.titulo); link.href = '#/plan?accion=' + encodeURIComponent(a.id); li.append(link, el('span', ' · ' + a.estado.replace(/-/g, ' ') + ' · ' + a.avance + ' %', 'nota')); la.append(li); }); pieAcc.append(la);
      panel.append(cerrar, cabeza, hallazgos, estandaresFila, cuerpoInd, pieAcc);
      if (principal.origen !== 'fuente') panel.append(el('p', 'Las calificaciones por indicador y las brechas corresponden a la evaluación de diciembre de 2025.', 'nota'));
      fondo.append(panel); document.body.append(fondo); document.body.classList.add('dialogo-abierto');
      const regiones = [...document.querySelectorAll('body > header, body > main, body > footer, body > .saltar')]; regiones.forEach(n => { n.inert = true; });
      const teclado = e => { if (e.key === 'Escape') { e.preventDefault(); cerrarFicha(true); } };
      document.addEventListener('keydown', teclado);
      cerrarFicha = (restaurar) => {
        document.removeEventListener('keydown', teclado); regiones.forEach(n => { n.inert = false; }); fondo.remove(); document.body.classList.remove('dialogo-abierto');
        cerrarFicha = null;
        if (restaurar) { ejeId = null; url(); dibujar(); (disparador && disparador.isConnected ? disparador : cuerpo.querySelector('.dim-vertice'))?.focus?.(); }
      };
      cerrar.onclick = () => cerrarFicha(true);
      fondo.addEventListener('click', e => { if (e.target === fondo) cerrarFicha(true); });
      cerrar.focus();
    }
    function dibujar() {
      cuerpo.replaceChildren();
      if (!dims.grandes.length) { cuerpo.append(el('p', 'Contenido en preparación.', 'en-preparacion')); return; }
      const general = el('section', null, 'dim-general');
      dims.grandes.forEach((g, i) => general.append(tarjetaGeneral(g, i)));
      cuerpo.append(general);
      const escala = el('p', 'Escala de 0 a 5: 0 = sin información; 5 = práctica implementada con seguimiento y reporte. Colores de los puntos: por debajo de 3, entre 3 y 4, desde 4.', 'nota dim-escala');
      cuerpo.append(escala);
    }
    function prepararControles() {
      controles.replaceChildren();
      [['Evaluación', principal?.id, false], ['Comparar con', comparada?.id || '', true]].forEach(([texto, valor, vs]) => {
        const label = el('label', texto), select = el('select'); select.id = vs ? 'e3-vs' : 'e3-eval';
        if (vs) { const op = el('option', 'Sin comparación'); op.value = ''; select.append(op); }
        evaluaciones.forEach(e => { const op = el('option', etiqueta(e)); op.value = e.id; select.append(op); }); select.value = valor;
        select.onchange = () => { if (vs) comparada = evaluaciones.find(e => e.id === select.value) || null; else principal = evaluaciones.find(e => e.id === select.value); url(); dibujar(); };
        label.append(select); controles.append(label);
      });
      const leyenda = el('p', null, 'dim-leyenda-poligonos');
      leyenda.append(el('span', 'Evaluación', 'muestra principal'), el('span', 'Comparación', 'muestra comparada'));
      const cargar = el('button', 'Cargar nueva evaluación', 'boton secundario'); cargar.onclick = () => abrirFormulario(cargar);
      controles.append(leyenda, cargar);
    }
    function abrirFormulario(disparador) {
      dialogo = el('dialog', null, 'e3-dialogo'); dialogo.setAttribute('role', 'dialog'); dialogo.setAttribute('aria-labelledby', 'e3-form-titulo');
      const modal = dialogo;
      const form = el('form'); form.noValidate = true;
      const titulo = el('h2', 'Cargar nueva evaluación'); titulo.id = 'e3-form-titulo';
      const cerrar = el('button', 'Cerrar'); cerrar.type = 'button'; cerrar.onclick = () => modal.close();
      const mensaje = el('div', null, 'e3-error'); mensaje.setAttribute('role', 'alert'); mensaje.tabIndex = -1;
      form.append(cerrar, titulo, el('p', 'Esta es una demostración pública: lo que guardes será visible para cualquiera con el enlace.', 'e3-aviso'));
      if (sinBase) form.append(el('p', respaldo, 'e3-aviso'));
      const campos = new Map();
      function campo(padre, id, nombre, puntaje) {
        const label = el('label', nombre), input = el('input'); input.id = 'e3-campo-' + id; input.name = id; input.required = true; input.type = 'text';
        if (puntaje) {
          input.inputMode = 'decimal'; input.setAttribute('role', 'spinbutton');
          input.setAttribute('aria-valuemin', '0'); input.setAttribute('aria-valuemax', '5');
          input.setAttribute('aria-description', 'De 0 a 5. Flechas arriba y abajo cambian 0,1. Admite coma o punto.'); input.placeholder = '0 a 5';
          const actualizar = () => {
            const n = E.parsearPuntaje(input.value);
            if (n === null) input.removeAttribute('aria-valuenow'); else input.setAttribute('aria-valuenow', String(n));
          };
          input.addEventListener('input', actualizar);
          input.addEventListener('keydown', event => {
            if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const valor = event.key === 'Home' ? 0 : event.key === 'End' ? 5 : (E.parsearPuntaje(input.value) ?? 0) + (event.key === 'ArrowUp' ? 0.1 : -0.1);
            input.value = numero(Math.max(0, Math.min(5, valor))); actualizar();
          });
        }
        else if (id === 'nombre') input.maxLength = 80;
        else { input.placeholder = 'AAAA-MM'; input.pattern = '[0-9]{4}-(0[1-9]|1[0-2])'; }
        const error = el('span', '', 'e3-error'); error.id = input.id + '-error'; input.setAttribute('aria-describedby', error.id);
        label.append(input, error); padre.append(label); campos.set(id, {input, error});
      }
      campo(form, 'nombre', 'Nombre', false); campo(form, 'fecha', 'Fecha (AAAA-MM)', false);
      graficos.forEach(([g, t]) => { const fieldset = el('fieldset'); fieldset.append(el('legend', t)); E.ejesDe(g, datos.estandares).forEach(e => campo(fieldset, e.id, e.nombre, true)); form.append(fieldset); });
      const prellenar = el('button', 'Prellenar con la evaluación actual'); prellenar.type = 'button'; prellenar.onclick = () => datos.estandares.ejes.forEach(e => { const input = campos.get(e.id).input; input.value = numero(principal.puntajes[e.id]); input.setAttribute('aria-valuenow', String(E.parsearPuntaje(input.value))); });
      const guardar = el('button', 'Guardar evaluación'); guardar.type = 'submit'; guardar.disabled = sinBase;
      form.append(prellenar, mensaje, guardar); dialogo.append(form); document.body.append(dialogo);
      modal.addEventListener('close', () => { modal.remove(); if (dialogo === modal) dialogo = null; if (activo) disparador.focus(); });
      form.onsubmit = async ev => {
        ev.preventDefault(); if (guardar.disabled) return;
        const entrada = {nombre: campos.get('nombre').input.value, fecha: campos.get('fecha').input.value, puntajes: {}};
        datos.estandares.ejes.forEach(e => { entrada.puntajes[e.id] = campos.get(e.id).input.value; });
        const resultado = E.validarEvaluacion(entrada, datos.estandares.ejes, evaluaciones.map(e => e.id));
        campos.forEach(({input, error}, id) => { error.textContent = resultado.errores[id] || ''; input.setAttribute('aria-invalid', String(!!resultado.errores[id])); });
        if (!resultado.ok) { mensaje.textContent = resultado.errores.id || 'Revisa los campos señalados.'; (campos.get(Object.keys(resultado.errores)[0])?.input || mensaje).focus(); return; }
        guardar.disabled = true; mensaje.textContent = 'Guardando evaluación…';
        try {
          // Releer antes de escribir reduce el riesgo de reemplazar un id añadido desde otra sesión.
          const actuales = await GHDatos.list('evaluaciones');
          if (GHDatos.estado === 'respaldo') { sinBase = true; avisoBase(); throw new Error('respaldo'); }
          evaluaciones = E.combinar(evaluaciones, actuales);
          if (evaluaciones.some(e => e.id === resultado.evaluacion.id)) { mensaje.textContent = 'Ya existe una evaluación con esta fecha y nombre. Cambia el nombre.'; return; }
          await GHDatos.set('evaluaciones', resultado.evaluacion.id, resultado.evaluacion);
          if (!activo) return;
          const anterior = principal; principal = resultado.evaluacion; comparada = anterior;
          evaluaciones = E.combinar(evaluaciones, [principal]); sinBase = false; avisoBase(); modal.close(); prepararControles(); url(); dibujar(); controles.querySelector('select').focus();
        } catch (_) { mensaje.textContent = 'No se pudo guardar la evaluación. Revisa la conexión e inténtalo de nuevo. Los datos escritos se conservan.'; }
        finally { guardar.disabled = false; }
      };
      dialogo.showModal(); campos.get('nombre').input.focus();
    }
    (async () => {
      let base = [];
      try { base = await GHDatos.list('evaluaciones'); sinBase = GHDatos.estado === 'respaldo'; }
      catch (_) { sinBase = true; }
      if (!activo) return;
      evaluaciones = E.combinar(datos.evaluaciones, base);
      const real = evaluaciones.find(e => e.origen === 'fuente') || evaluaciones[0];
      principal = evaluaciones.find(e => e.id === params.filtros.get('eval')) || real;
      comparada = params.filtros.get('vs') ? evaluaciones.find(e => e.id === params.filtros.get('vs')) || null : null;
      ejeId = datos.estandares.ejes.some(e => e.id === params.filtros.get('eje')) ? params.filtros.get('eje') : null;
      avisoBase(); prepararControles(); url(); dibujar();
      if (ejeId) abrirFicha();
    })();
    return () => { activo = false; if (cerrarFicha) cerrarFicha(false); if (dialogo) { dialogo.remove(); dialogo = null; } };
  }});
}());
