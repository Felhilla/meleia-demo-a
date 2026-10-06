/* Capítulo 06 · Plan de acción (bocetos de Felipe IMG_4427, 4428 y 4430).
   Panel: título del plan; avance global (anillo + estados) | pilares de intervención (anillo de avance).
   Ficha de pilar (o de un estado): tabla Acción | Responsable | Plazo de entrega | Estado.
   Ficha de acción: acción (estado); descripción | responsable*, plazo*, soporte de cumplimiento, actualizar;
   nota de seguimiento*. «Actualizar» habilita los campos con * y el estado; guarda con App.guardarAccion. */
(function () {
  'use strict';
  const el = App.el;
  const ETIQUETA_ESTADO = {pendiente: 'Pendiente', 'en-curso': 'En curso', cumplida: 'Completada'};
  const numero = v => App.numero(v, {maximumFractionDigits: 1});
  const hoyISO = () => { const f = new Date(); return [f.getFullYear(), String(f.getMonth() + 1).padStart(2, '0'), String(f.getDate()).padStart(2, '0')].join('-'); };
  const fecha = f => /^\d{4}-\d{2}-\d{2}$/.test(f || '') ? new Intl.DateTimeFormat('es-CO', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(f + 'T00:00:00Z')) : 'Sin plazo';
  const SVG = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) { const n = document.createElementNS(SVG, tag); Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v)); return n; }
  function anillo(porcentaje, tam, grosor, etiqueta) {
    const r = (tam - grosor) / 2, c = tam / 2, L = 2 * Math.PI * r;
    const s = svg('svg', {viewBox: `0 0 ${tam} ${tam}`, width: tam, height: tam, role: 'img', 'aria-label': etiqueta, class: 'plan-anillo'});
    s.append(svg('circle', {cx: c, cy: c, r, fill: 'none', stroke: 'var(--suave)', 'stroke-width': grosor}),
      svg('circle', {cx: c, cy: c, r, fill: 'none', stroke: 'var(--principal)', 'stroke-width': grosor, 'stroke-linecap': 'round', 'stroke-dasharray': `${L * Math.max(0, Math.min(100, porcentaje)) / 100} ${L}`, transform: `rotate(-90 ${c} ${c})`}));
    return s;
  }
  function chipEstado(a, hoy) {
    const vencida = Plan.vencida(a, hoy);
    const n = el('span', vencida ? 'Vencida' : ETIQUETA_ESTADO[a.estado] || a.estado, 'plan-estado estado-' + (vencida ? 'vencida' : a.estado));
    return n;
  }

  function render(contenedor, datos, params) {
    const cfg = datos.planConfig, hoy = hoyISO();
    const acciones = () => App.obtenerPlan();
    const raiz = el('div', null, 'plan2'); contenedor.append(raiz);
    if (App.estadoBase() !== 'base') raiz.append(el('p', 'No hay conexión con la base de datos: se muestran los datos de respaldo y no se pueden guardar cambios ahora.', 'aviso-conexion'));

    function pintar() {
      raiz.querySelectorAll('.plan-panel').forEach(n => n.remove());
      const lista = acciones(), res = Plan.resumen(lista, cfg, hoy);
      const panel = el('section', null, 'plan-panel');
      // Título del plan (boceto)
      panel.append(el('h2', 'Plan de acción para el cierre de brechas y la gestión de la debida diligencia en derechos humanos', 'plan-titulo'));
      const cuerpo = el('div', null, 'plan-cuerpo');
      // Avance global
      const global = el('section', null, 'tarjeta plan-global');
      global.append(el('h3', 'Avance global'));
      const g = el('div', null, 'plan-global-anillo');
      g.append(anillo(res.avanceGlobal, 200, 26, 'Avance global ' + numero(res.avanceGlobal) + ' %'), el('strong', numero(res.avanceGlobal) + ' %', 'plan-global-cifra'));
      global.append(g);
      const estados = el('div', null, 'plan-estados');
      [['pendiente', 'Pendientes', res.porEstado.pendiente], ['en-curso', 'En curso', res.porEstado['en-curso']], ['cumplida', 'Completadas', res.porEstado.cumplida], ['vencida', 'Vencidas', res.vencidas]].forEach(([id, texto, n]) => {
        const b = el('button', null, 'plan-chip estado-' + id); b.type = 'button'; b.dataset.estado = id;
        b.append(el('span', texto), el('strong', String(n)));
        b.onclick = () => { location.hash = '#/plan?estado=' + id; };
        estados.append(b);
      });
      global.append(estados);
      if (lista.some(a => a.seguimiento_ejemplo)) global.append(el('p', 'El avance es ilustrativo: simula el seguimiento del plan.', 'nota'));
      // Pilares de intervención
      const pilares = el('section', null, 'plan-pilares');
      pilares.append(el('h3', 'Pilares de intervención', 'plan-pilares-titulo'));
      res.porComponente.forEach((p, i) => {
        const b = el('button', null, 'tarjeta plan-pilar'); b.type = 'button'; b.dataset.pilar = p.componente;
        const txt = el('span', null, 'plan-pilar-texto');
        txt.append(el('span', 'Pilar ' + (i + 1), 'plan-pilar-num'), el('strong', p.nombre), el('span', p.n + (p.n === 1 ? ' acción' : ' acciones'), 'plan-pilar-n'));
        const av = el('span', null, 'plan-pilar-avance');
        const pct = el('span', null, 'plan-pilar-pct'); pct.append(el('small', 'Avance'), el('strong', numero(p.avance) + ' %'));
        av.append(anillo(p.avance, 64, 10, 'Avance ' + numero(p.avance) + ' %'), pct);
        b.append(txt, av);
        b.onclick = () => { location.hash = '#/plan?pilar=' + p.componente; };
        pilares.append(b);
      });
      cuerpo.append(global, pilares); panel.append(cuerpo);
      raiz.append(panel);
    }
    pintar();

    // ---------- Ventana (ficha de pilar / de estado / de acción) ----------
    const pilarId = params.filtros.get('pilar'), estadoId = params.filtros.get('estado'), accionId = params.filtros.get('accion');
    if (!pilarId && !estadoId && !accionId) return;
    const fondo = el('div', null, 'fondo-dialogo centrado');
    const ventana = el('section', null, 'panel plan-ficha'); ventana.setAttribute('role', 'dialog'); ventana.setAttribute('aria-modal', 'true'); ventana.setAttribute('aria-labelledby', 'plan-ficha-titulo'); ventana.tabIndex = -1;
    fondo.append(ventana); document.body.append(fondo); document.body.classList.add('dialogo-abierto');
    const regiones = [...document.querySelectorAll('body > header, body > main, body > footer, body > .saltar')]; regiones.forEach(n => { n.inert = true; });
    const cerrarTodo = () => { location.hash = '#/plan'; };
    fondo.addEventListener('click', e => { if (e.target === fondo) cerrarTodo(); });
    function teclado(e) { if (e.key === 'Escape') { e.preventDefault(); cerrarTodo(); } }
    document.addEventListener('keydown', teclado);

    function botonCerrar() { const b = el('button', 'Cerrar ×', 'plan-cerrar'); b.type = 'button'; b.onclick = cerrarTodo; return b; }

    function fichaTabla(titulo, subtitulo, avance, lista, volverA) {
      ventana.replaceChildren();
      const cab = el('header', null, 'plan-f1');
      const t = el('div', null, 'plan-f1-titulo'); const h = el('h2', titulo); h.id = 'plan-ficha-titulo';
      t.append(el('p', subtitulo, 'antetitulo'), h);
      const a = el('div', null, 'plan-f1-avance');
      if (avance !== null) a.append(el('span', 'Avance', 'plan-rotulo'), el('strong', numero(avance) + ' %'));
      a.append(el('span', lista.length + (lista.length === 1 ? ' acción' : ' acciones'), 'plan-sub'));
      cab.append(t, a);
      const tabla = el('table', null, 'plan-tabla');
      const thead = el('thead'), tr = el('tr');
      ['Acción', 'Responsable', 'Plazo de entrega', 'Estado'].forEach(x => { const th = el('th', x); th.scope = 'col'; tr.append(th); });
      thead.append(tr); tabla.append(thead);
      const tb = el('tbody');
      if (!lista.length) { const r = el('tr'), td = el('td', 'No hay acciones en esta categoría.'); td.colSpan = 4; r.append(td); tb.append(r); }
      lista.forEach(ac => {
        const r = el('tr'), th = el('th'); th.scope = 'row';
        const b = el('button', ac.titulo, 'plan-accion-link'); b.type = 'button'; b.dataset.accion = ac.id;
        b.onclick = () => { location.hash = '#/plan?' + (volverA ? volverA + '&' : '') + 'accion=' + ac.id; };
        th.append(b);
        const tdE = el('td'); tdE.append(chipEstado(ac, hoy));
        r.append(th, el('td', ac.responsable || 'Por definir'), el('td', fecha(ac.plazo), Plan.vencida(ac, hoy) ? 'plan-plazo vencido' : 'plan-plazo'), tdE);
        tb.append(r);
      });
      tabla.append(tb);
      const env = el('div', null, 'plan-tabla-env'); env.append(tabla);
      ventana.append(botonCerrar(), cab, env);
    }

    function fichaAccion(ac, volverA) {
      ventana.replaceChildren();
      let editando = false;
      const cerrar = botonCerrar();
      const volver = volverA ? el('button', '← Volver a la lista', 'plan-volver') : null;
      if (volver) { volver.type = 'button'; volver.onclick = () => { location.hash = '#/plan?' + volverA; }; }
      // Fila 1: acción (estado)
      const cab = el('header', null, 'plan-f1');
      const t = el('div', null, 'plan-f1-titulo'); const h = el('h2', ac.titulo); h.id = 'plan-ficha-titulo';
      const comp = cfg.componentes.find(c => c.id === ac.componente);
      t.append(el('p', comp ? comp.nombre : 'Acción', 'antetitulo'), h);
      const caja = el('div', null, 'plan-f1-estado');
      const chip = chipEstado(ac, hoy);
      const selEstado = el('select', null, 'plan-input'); selEstado.id = 'plan-campo-estado'; selEstado.setAttribute('aria-label', 'Estado');
      cfg.estados.forEach(e => { const o = el('option', ETIQUETA_ESTADO[e] || e); o.value = e; selEstado.append(o); }); selEstado.value = ac.estado; selEstado.hidden = true;
      caja.append(el('span', 'Estado', 'plan-rotulo'), chip, selEstado);
      cab.append(t, caja);
      // Fila 2: descripción | campos y botones
      const f2 = el('div', null, 'plan-f2');
      const desc = el('section', null, 'plan-caja plan-desc'); desc.append(el('h3', 'Descripción de la acción propuesta'));
      App.listaNumerada(ac.descripcion).forEach(p => desc.append(el('p', p)));
      const lado = el('div', null, 'plan-lado');
      const campo = (rotulo, valor, tipo, id) => {
        const c = el('section', null, 'plan-caja plan-campo');
        c.append(el('h3', rotulo + ' *'));
        const v = el('p', tipo === 'date' ? fecha(valor) : (valor || 'Por definir'), 'plan-valor');
        const inp = el('input', null, 'plan-input'); inp.type = tipo; inp.value = valor || ''; inp.id = id; inp.hidden = true; inp.setAttribute('aria-label', rotulo);
        if (tipo === 'text') inp.maxLength = 120;
        c.append(v, inp); return {c, v, inp};
      };
      const resp = campo('Responsable', ac.responsable, 'text', 'plan-campo-responsable');
      const plazo = campo('Plazo', ac.plazo, 'date', 'plan-campo-plazo');
      const soporte = el('a', 'Soporte de cumplimiento', 'boton plan-soporte'); soporte.href = '#/plan?accion=' + ac.id;
      const completada = ac.estado === 'cumplida';
      if (!completada) { soporte.setAttribute('aria-disabled', 'true'); soporte.classList.add('inactivo'); soporte.removeAttribute('href'); soporte.title = 'Disponible cuando la acción esté completada'; }
      else soporte.title = 'Demostración: aquí se abriría la carpeta donde la organización carga las evidencias de cumplimiento';
      soporte.onclick = e => { e.preventDefault(); if (completada) mensaje.textContent = 'Demostración: aquí se abriría la carpeta de evidencias de cumplimiento de la organización.'; };
      const actualizar = el('button', 'Actualizar', 'boton secundario plan-actualizar'); actualizar.type = 'button';
      if (App.estadoBase() !== 'base') { actualizar.disabled = true; actualizar.title = 'Sin conexión con la base de datos'; }
      lado.append(resp.c, plazo.c, soporte, actualizar);
      f2.append(desc, lado);
      // Fila 3: nota de seguimiento
      const notaC = el('section', null, 'plan-caja plan-nota'); notaC.append(el('h3', 'Nota de seguimiento *'));
      const notaV = el('p', ac.nota_seguimiento || 'Sin notas de seguimiento.', 'plan-valor');
      const notaI = el('textarea', null, 'plan-input'); notaI.id = 'plan-campo-nota'; notaI.value = ac.nota_seguimiento || ''; notaI.maxLength = 500; notaI.rows = 4; notaI.hidden = true; notaI.setAttribute('aria-label', 'Nota de seguimiento');
      notaC.append(notaV, notaI);
      if (ac.actualizado) notaC.append(el('p', 'Última actualización: ' + fecha(ac.actualizado.slice(0, 10)) + (ac.seguimiento_ejemplo ? ' · seguimiento de ejemplo' : ''), 'nota'));
      const mensaje = el('p', '', 'plan-mensaje'); mensaje.setAttribute('role', 'status');
      const pieAcc = el('div', null, 'plan-pie-acciones');
      const cancelar = el('button', 'Cancelar', 'plan-cancelar'); cancelar.type = 'button'; cancelar.hidden = true;
      pieAcc.append(mensaje, cancelar);
      const modo = on => {
        editando = on;
        [resp, plazo].forEach(x => { x.v.hidden = on; x.inp.hidden = !on; });
        notaV.hidden = on; notaI.hidden = !on; chip.hidden = on; selEstado.hidden = !on;
        actualizar.textContent = on ? 'Guardar cambios' : 'Actualizar'; cancelar.hidden = !on;
        ventana.classList.toggle('editando', on);
        if (on) resp.inp.focus();
      };
      cancelar.onclick = () => { resp.inp.value = ac.responsable || ''; plazo.inp.value = ac.plazo || ''; notaI.value = ac.nota_seguimiento || ''; selEstado.value = ac.estado; mensaje.textContent = ''; modo(false); };
      actualizar.onclick = async () => {
        if (!editando) { modo(true); return; }
        const cambios = {};
        if (resp.inp.value.trim() !== (ac.responsable || '')) cambios.responsable = resp.inp.value.trim();
        if (plazo.inp.value && plazo.inp.value !== ac.plazo) cambios.plazo = plazo.inp.value;
        if (notaI.value !== (ac.nota_seguimiento || '')) cambios.nota_seguimiento = notaI.value;
        if (selEstado.value !== ac.estado) cambios.estado = selEstado.value;
        if (!Object.keys(cambios).length) { modo(false); return; }
        actualizar.disabled = true; mensaje.textContent = 'Guardando…';
        try {
          const nueva = await App.guardarAccion(ac.id, cambios);
          pintar(); fichaAccion(nueva, volverA);
          ventana.querySelector('.plan-mensaje').textContent = 'Cambios guardados.';
        } catch (err) { mensaje.textContent = err.message || 'No se pudo guardar.'; actualizar.disabled = false; }
      };
      ventana.append(cerrar);
      if (volver) ventana.append(volver);
      ventana.append(cab, f2, notaC, pieAcc);
      cerrar.focus();
    }

    const lista = acciones();
    const volverA = pilarId ? 'pilar=' + pilarId : estadoId ? 'estado=' + estadoId : '';
    if (accionId && lista.some(a => a.id === accionId)) fichaAccion(lista.find(a => a.id === accionId), volverA);
    else if (pilarId) {
      const p = Plan.resumen(lista, cfg, hoy).porComponente.find(x => x.componente === pilarId);
      const i = cfg.componentes.findIndex(c => c.id === pilarId);
      if (p) fichaTabla(p.nombre, 'Pilar de intervención ' + (i + 1), p.avance, lista.filter(a => a.componente === pilarId), volverA); else cerrarTodo();
    } else if (estadoId) {
      const nombres = {pendiente: 'Acciones pendientes', 'en-curso': 'Acciones en curso', cumplida: 'Acciones completadas', vencida: 'Acciones vencidas'};
      const filtradas = estadoId === 'vencida' ? lista.filter(a => Plan.vencida(a, hoy)) : lista.filter(a => a.estado === estadoId);
      fichaTabla(nombres[estadoId] || 'Acciones', 'Estado del plan', null, filtradas, volverA);
    } else cerrarTodo();
    ventana.querySelector('.plan-cerrar')?.focus();

    return () => { document.removeEventListener('keydown', teclado); regiones.forEach(n => { n.inert = false; }); fondo.remove(); document.body.classList.remove('dialogo-abierto'); };
  }

  App.registrarVista('plan', {render});
}());
