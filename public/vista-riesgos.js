/* Capítulo 04 · Riesgos en Derechos Humanos Identificados (bocetos de Felipe IMG_4415 a IMG_4419).
   Vista: cuatro tarjetas de conteo que resaltan su nivel en el mapa, y el mapa gravedad × probabilidad.
   Ficha en ventana: riesgo | priorización; relación · derecho · estándares; gravedad | probabilidad;
   actividades · actor que reporta · localización; y dos cajas que despliegan las subfichas de
   mecanismos de control y de acciones recomendadas. */
(function () {
  'use strict';
  const el = App.el;
  const NIVELES = ['Alta', 'Media', 'Baja'];
  const PROBABILIDADES = ['baja', 'media', 'alta'];
  const etiqueta = v => v ? v.charAt(0).toUpperCase() + v.slice(1).replaceAll('-', ' ') : 'Sin asignar';
  const numero = r => r.id.split('-').at(-1);
  const vinculacion = {causa: 'Causa', contribuye: 'Contribuye', 'directamente-vinculada': 'Directamente vinculada'};
  const SEM = {Alta: 'rojo', Media: 'ambar', Baja: 'amarillo'};
  const fecha = f => /^\d{4}-\d{2}-\d{2}$/.test(f || '') ? new Intl.DateTimeFormat('es-CO', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(f + 'T00:00:00Z')) : (f || 'sin plazo');

  function cfgPriorizacion(datos) { return datos.caso?.metodologia?.calificacion?.riesgos?.priorizacion || {matriz: {}, colores: SEM}; }
  function priorizacion(datos, gravedad, probabilidad) {
    if (!probabilidad) return null;
    return cfgPriorizacion(datos).matriz[gravedad + '|' + probabilidad] || null;
  }
  function vinetas(texto) {
    const items = Array.isArray(texto) ? texto : App.listaNumerada(texto);
    const ul = el('ul', null, 'rie-vinetas');
    (items.length ? items : ['Sin información en la fuente']).forEach(t => ul.append(el('li', t)));
    return ul;
  }
  function unicos(lista) { return [...new Set(lista.filter(Boolean))]; }
  function caja(titulo, contenido, clase) {
    const c = el('section', null, 'rie-caja ' + (clase || ''));
    c.append(el('h3', titulo)); if (contenido) c.append(contenido); return c;
  }
  function nivelCaja(titulo, nivel, detalle) {
    const c = el('section', null, 'rie-caja rie-nivel sem-fondo-' + (SEM[nivel] || 'gris'));
    c.append(el('h3', titulo), el('strong', nivel || 'Sin asignar'));
    if (detalle) c.append(el('p', detalle));
    return c;
  }

  function render(contenedor, datos, params) {
    const cfg = datos.criticidad, riesgos = datos.riesgos;
    const resumen = Riesgos.resumen(riesgos, cfg);
    let resaltado = params.filtros.get('criticidad') || '';

    // 1 · Tarjetas de conteo: resaltan su nivel en el mapa (no filtran ni ocultan).
    const tarjetas = el('div', null, 'rie-conteos');
    const conteos = [['', riesgos.length, riesgos.length === 1 ? 'Riesgo identificado' : 'Riesgos identificados'],
      ...NIVELES.map(n => [n, resumen[n] || 0, (resumen[n] === 1 ? 'Riesgo' : 'Riesgos') + ' de criticidad ' + n.toLowerCase()])];
    const botones = conteos.map(([nivel, n, texto]) => {
      const b = el('button', null, 'rie-conteo' + (nivel ? ' sem-borde-' + SEM[nivel] : '')); b.type = 'button';
      b.append(el('strong', String(n)), el('span', texto));
      b.onclick = () => { resaltado = resaltado === nivel ? '' : nivel; pintarResaltado(); };
      tarjetas.append(b); return [nivel, b];
    });

    // 2 · Mapa de riesgos (boceto IMG_4415): gravedad en filas (Alta arriba), probabilidad en columnas.
    const ubicacion = Riesgos.ubicar(riesgos, cfg);
    const mapa = el('section', null, 'seccion rie-mapa-seccion');
    const cab = el('div', null, 'seccion-cabeza');
    const tc = el('div'); tc.append(el('p', 'Mapa de riesgos', 'antetitulo'), el('h2', 'Gravedad × probabilidad de ocurrencia'));
    cab.append(tc, el('p', 'Cada riesgo se ubica por su gravedad y por la probabilidad de que ocurra según los controles actuales. El color de la celda es el nivel de priorización. Toque un riesgo para ver su ficha.'));
    const grid = el('div', null, 'rie-mapa'); grid.setAttribute('role', 'table'); grid.setAttribute('aria-label', 'Mapa de riesgos');
    const ejeY = el('div', 'Gravedad', 'rie-eje-y'); ejeY.setAttribute('aria-hidden', 'true'); grid.append(ejeY);
    NIVELES.forEach(g => {
      const fila = el('div', null, 'rie-fila'); fila.setAttribute('role', 'row');
      const rot = el('div', g, 'rie-rotulo-fila'); rot.setAttribute('role', 'rowheader'); fila.append(rot);
      PROBABILIDADES.forEach(p => {
        const prio = priorizacion(datos, g, p);
        const celda = el('div', null, 'rie-celda sem-fondo-' + (SEM[prio] || 'gris')); celda.setAttribute('role', 'cell');
        celda.setAttribute('aria-label', `Gravedad ${g.toLowerCase()}, probabilidad ${p}: priorización ${(prio || '').toLowerCase()}`);
        (ubicacion.celdas[g + '|' + p] || []).forEach(id => celda.append(fichaMini(id)));
        fila.append(celda);
      });
      grid.append(fila);
    });
    const pie = el('div', null, 'rie-fila rie-pie'); pie.append(el('div'));
    PROBABILIDADES.forEach(p => pie.append(el('div', etiqueta(p), 'rie-rotulo-col')));
    grid.append(pie, el('div', 'Probabilidad de ocurrencia', 'rie-eje-x'));
    mapa.append(tarjetas, cab, grid);
    if (ubicacion.sinProbabilidad.length) {
      const sin = el('div', null, 'rie-sin-prob');
      sin.append(el('p', 'Sin probabilidad asignada en la fuente', 'antetitulo'));
      ubicacion.sinProbabilidad.forEach(id => sin.append(fichaMini(id)));
      mapa.append(sin);
    }
    const ley = el('ul', null, 'rie-leyenda');
    NIVELES.forEach(n => { const li = el('li', 'Priorización ' + n.toLowerCase(), 'sem-' + SEM[n]); ley.append(li); });
    mapa.append(ley, el('p', cfgPriorizacion(datos).nota || '', 'nota'));

    // Lista accesible (plegada): misma información que el mapa.
    const lista = el('details', null, 'rie-lista');
    lista.append(el('summary', 'Ver la lista de los ' + riesgos.length + ' riesgos'));
    const ol = el('ol');
    [...riesgos].sort((a, b) => NIVELES.indexOf(Riesgos.criticidad(a, cfg).nivel) - NIVELES.indexOf(Riesgos.criticidad(b, cfg).nivel) || a.id.localeCompare(b.id)).forEach(r => {
      const li = el('li'), a = el('a', numero(r) + ' · ' + r.nombre); a.href = '#/ddhh/riesgos/' + r.id; a.id = 'fila-' + r.id;
      li.append(a, el('span', ' · gravedad ' + Riesgos.criticidad(r, cfg).nivel.toLowerCase(), 'nota')); ol.append(li);
    });
    lista.append(ol); mapa.append(lista);
    contenedor.append(mapa);

    function fichaMini(id) {
      const r = riesgos.find(x => x.id === id), nivel = Riesgos.criticidad(r, cfg).nivel;
      const a = el('a', null, 'rie-mini'); a.href = '#/ddhh/riesgos/' + id; a.dataset.riesgo = id; a.dataset.nivel = nivel;
      a.append(el('span', numero(r), 'rie-mini-num sem-' + SEM[nivel]), el('span', r.nombre, 'rie-mini-nombre'));
      a.title = r.nombre + ' · gravedad ' + nivel.toLowerCase();
      return a;
    }
    function pintarResaltado() {
      botones.forEach(([nivel, b]) => b.setAttribute('aria-pressed', String(resaltado === nivel && nivel !== '')));
      contenedor.querySelectorAll('.rie-mini').forEach(m => m.classList.toggle('atenuado', !!resaltado && m.dataset.nivel !== resaltado));
    }
    pintarResaltado();

    if (params.id) return abrirFicha(riesgos.find(r => r.id === params.id), datos);
  }

  function abrirFicha(r, datos) {
    const cfg = datos.criticidad, crit = Riesgos.criticidad(r, cfg), dom = crit.evaluacionDominante;
    const prio = priorizacion(datos, crit.nivel, dom.probabilidad);
    const fondo = el('div', null, 'fondo-dialogo centrado');
    const panel = el('section', null, 'panel rie-ficha'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'rie-titulo'); panel.tabIndex = -1; panel.dataset.riesgo = r.id;
    const cerrar = el('button', 'Cerrar ×', 'rie-cerrar'); cerrar.type = 'button'; cerrar.onclick = () => { location.hash = '#/ddhh/riesgos'; };

    // Fila 1: riesgo identificado | nivel de priorización
    const f1 = el('div', null, 'rie-f1');
    const tit = el('div', null, 'rie-titulo');
    const h2 = el('h2', r.nombre); h2.id = 'rie-titulo';
    tit.append(el('p', 'Riesgo ' + numero(r), 'antetitulo'), h2);
    const p = el('div', null, 'rie-prio sem-fondo-' + (SEM[prio] || 'gris'));
    p.append(el('span', 'Nivel de priorización', 'rie-rotulo'), el('strong', prio || 'Sin asignar'), el('span', prio ? 'Gravedad ' + crit.nivel.toLowerCase() + ' × probabilidad ' + dom.probabilidad : 'La fuente no asigna probabilidad', 'rie-sub'));
    f1.append(tit, p);

    // Fila 2: relación con la organización · derecho humano afectado · estándares relacionados
    const f2 = el('div', null, 'rie-fila3');
    const vinc = unicos(r.evaluaciones.map(e => vinculacion[e.vinculacion] || etiqueta(e.vinculacion)));
    const respVinc = (datos.caso?.metodologia?.calificacion?.riesgos?.vinculacion || []).find(v => v.tipo === dom.vinculacion);
    const cVinc = caja('Relación con la organización', null);
    cVinc.append(el('strong', vinc.join(' · '), 'rie-destacado')); if (respVinc) cVinc.append(el('p', respVinc.texto, 'nota'));
    const cDer = caja('Derecho humano afectado', el('strong', r.derecho_humano, 'rie-destacado'));
    const est = datos.derechos?.derechos?.[r.derecho_humano] || [];
    const cEst = caja('Estándares relacionados', vinetas(est), 'rie-estandares');
    f2.append(cVinc, cDer, cEst);

    // Fila 3: nivel de gravedad | probabilidad de ocurrencia
    const f3 = el('div', null, 'rie-fila2');
    const g = Riesgos.gravedad(dom, cfg);
    const detG = `Escala ${dom.escala} · alcance ${dom.alcance} · irremediabilidad ${dom.irreparable} → promedio ${App.numero(g.promedio, {maximumFractionDigits: 2})}`;
    const probCfg = (datos.caso?.metodologia?.calificacion?.riesgos?.probabilidad || []).find(x => x.nivel.toLowerCase() === dom.probabilidad);
    f3.append(nivelCaja('Nivel de gravedad', crit.nivel, detG), nivelCaja('Probabilidad de ocurrencia', dom.probabilidad ? etiqueta(dom.probabilidad) : null, probCfg?.texto || (dom.probabilidad ? '' : 'La fuente no asigna probabilidad a este riesgo.')));
    if (r.evaluaciones.length > 1) f3.append(el('p', 'Este riesgo se evaluó para ' + r.evaluaciones.length + ' actores; se muestra la evaluación de mayor gravedad.', 'nota rie-nota-actores'));

    // Fila 4: actividades · actor que reporta · localización (viñetas)
    const f4 = el('div', null, 'rie-fila3');
    const reporta = unicos(r.evaluaciones.flatMap(e => App.listaNumerada(e.actor_reporta)));
    f4.append(caja('Actividades que generan el riesgo', vinetas(r.actividades)), caja('Actor que reporta el riesgo', vinetas(reporta)), caja('Localización', vinetas(r.localizacion)));

    // Fila 5: dos cajas que despliegan sus subfichas
    const f5 = el('div', null, 'rie-fila2 rie-subs');
    const zona = el('div', null, 'rie-subficha'); zona.hidden = true; zona.setAttribute('aria-live', 'polite');
    const acciones = Riesgos.accionesDe(r.id, App.obtenerPlan());
    const subfichas = {
      control: () => {
        const s = el('section'); s.append(el('h3', 'Mecanismos de control identificados', 'rie-sub-titulo'));
        const cuerpo = el('div', null, 'rie-sub-control');
        const izq = el('div'); izq.append(vinetas(r.medidas_control));
        const der = el('div', null, 'rie-analisis'); der.append(el('h4', 'Análisis de los mecanismos de control'), el('p', r.analisis_controles || 'Sin análisis en la fuente.'));
        cuerpo.append(izq, der); s.append(cuerpo); return s;
      },
      acciones: () => {
        const s = el('section'); s.append(el('h3', 'Acciones recomendadas', 'rie-sub-titulo'));
        const tabla = el('table', null, 'rie-tabla-acciones');
        const thead = el('thead'), tr = el('tr'); ['Acción', 'Relación con el plan'].forEach(t => { const th = el('th', t); th.scope = 'col'; tr.append(th); }); thead.append(tr); tabla.append(thead);
        const tb = el('tbody');
        if (!acciones.length) { const f = el('tr'), td = el('td', 'No hay acciones del plan vinculadas a este riesgo.'); td.colSpan = 2; f.append(td); tb.append(f); }
        acciones.forEach(a => {
          const f = el('tr'), th = el('th'); th.scope = 'row';
          th.append(el('strong', a.titulo)); if (a.actor_genera) th.append(el('span', 'Dirigida a: ' + a.actor_genera, 'nota'));
          const td = el('td'), link = el('a', 'Ver en el plan →'); link.href = '#/plan?accion=' + encodeURIComponent(a.id);
          const comp = datos.planConfig.componentes.find(c => c.id === a.componente)?.nombre || etiqueta(a.componente);
          td.append(el('span', comp, 'rie-comp'), el('span', etiqueta(a.estado) + ' · ' + a.avance + ' % · plazo: ' + fecha(a.plazo), 'nota'), link);
          f.append(th, td); tb.append(f);
        });
        tabla.append(tb); s.append(tabla);
        const resp = el('div', null, 'rie-responsables');
        resp.append(el('h4', 'Responsables de la gestión del riesgo'), vinetas(r.responsables || []));
        s.append(resp); return s;
      }
    };
    const botonesSub = [['control', 'Mecanismos de control identificados', (App.listaNumerada(r.medidas_control).length) + ' controles'], ['acciones', 'Acciones recomendadas', acciones.length + (acciones.length === 1 ? ' acción del plan' : ' acciones del plan')]].map(([clave, texto, meta]) => {
      const b = el('button', null, 'rie-boton-sub'); b.type = 'button'; b.setAttribute('aria-expanded', 'false'); b.dataset.sub = clave;
      b.append(el('strong', texto), el('span', meta, 'nota'), el('span', 'Ver', 'rie-ver'));
      b.onclick = () => {
        const abierto = b.getAttribute('aria-expanded') === 'true';
        botonesSub.forEach(o => { o.setAttribute('aria-expanded', 'false'); o.querySelector('.rie-ver').textContent = 'Ver'; });
        if (abierto) { zona.hidden = true; zona.replaceChildren(); return; }
        b.setAttribute('aria-expanded', 'true'); b.querySelector('.rie-ver').textContent = 'Ocultar';
        zona.replaceChildren(subfichas[clave]()); zona.hidden = false;
        zona.scrollIntoView?.({block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
      };
      f5.append(b); return b;
    });

    panel.append(cerrar, f1, f2, f3, f4, f5, zona);
    fondo.append(panel); document.body.append(fondo); document.body.classList.add('dialogo-abierto');
    fondo.addEventListener('click', e => { if (e.target === fondo) location.hash = '#/ddhh/riesgos'; });
    const regiones = [...document.querySelectorAll('body > header, body > main, body > footer, body > .saltar')]; regiones.forEach(n => { n.inert = true; });
    cerrar.focus();
    function teclado(e) {
      if (e.key === 'Escape') { e.preventDefault(); location.hash = '#/ddhh/riesgos'; }
      if (e.key === 'Tab') {
        const focos = [...panel.querySelectorAll('button, a[href], [tabindex="0"]')]; const primero = focos[0], ultimo = focos.at(-1);
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      }
    }
    document.addEventListener('keydown', teclado);
    return () => {
      document.removeEventListener('keydown', teclado); regiones.forEach(n => { n.inert = false; }); fondo.remove(); document.body.classList.remove('dialogo-abierto');
      document.querySelector('.rie-mini[data-riesgo="' + r.id + '"]')?.focus();
    };
  }

  App.registrarVista('riesgos', {render});
}());
