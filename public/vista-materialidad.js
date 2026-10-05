(function () {
  'use strict';
  const el = App.el, M = Materialidad;
  const numero = v => new Intl.NumberFormat('es-CO', {maximumFractionDigits: 1}).format(v);
  const media = vs => vs.reduce((a, b) => a + b, 0) / vs.length;
  const fuentes = {riesgos: 'Riesgos', estandares: 'Estándares', sector: 'Sector', grupos: 'Grupos de interés'};
  const enlace = (texto, href) => {const a = el('a', texto); a.href = href; return a;};
  function tabla(titulo, columnas, filas) {
    const t = el('table'), head = el('thead'), tr = el('tr'), body = el('tbody');
    t.append(el('caption', titulo));
    columnas.forEach(c => {const th = el('th', c); th.scope = 'col'; tr.append(th);}); head.append(tr);
    filas.forEach(valores => {const r = el('tr'); valores.forEach((v, i) => {const td = el('td'); td.dataset.etiqueta = columnas[i]; td.append(v); r.append(td);}); body.append(r);});
    t.append(head, body); return t;
  }
  function barra(nombre, valor) {
    const b = el('div', null, 'mat-barra'); b.append(el('span', nombre + ': ' + numero(valor)));
    const m = el('meter'); m.min = 0; m.max = 5; m.value = valor; m.setAttribute('aria-label', nombre); b.append(m); return b;
  }
  function render(contenedor, datos, params) {
    const raiz = el('div', null, 'materialidad'); contenedor.append(raiz);
    raiz.append(el('h1', 'Doble materialidad'), el('p', 'Paso 2 de 4', 'eyebrow'), el('p', 'Qué temas importan para la empresa y para su entorno, y por qué: cada tema se apoya en riesgos y brechas ya identificados.', 'intro'), el('p', 'Los temas y las calificaciones de esta pestaña son ilustrativos: muestran cómo funciona el método.', 'aviso mat-banda'));
    const cfg = datos.materialidadConfig, data = datos.materialidad;
    if (cfg) raiz.append(el('p', 'Marco: ' + cfg.marco + ' · Referencia sectorial: ' + cfg.sasb));
    let filas;
    try {filas = M.clasificar(data.temas, cfg);} catch (_) {raiz.append(el('p', 'Contenido en preparación', 'superficie')); return;}
    const temas = data.temas, query = new URLSearchParams(params.filtros), limites = M.umbrales(temas, cfg);
    const tema = id => temas.find(t => t.id === id);
    const cuadrante = id => cfg.cuadrantes.find(c => c.id === id)?.etiqueta || id;
    const ruta = (id = '') => '#/ddhh/materialidad' + (id ? '/' + id : '') + (query.size ? '?' + query.toString() : '');
    function cambiar(k, v) {v ? query.set(k, v) : query.delete(k); location.hash = ruta(params.id);}
    function linkTema(t, principal = false) {const a = enlace(t.id.slice(-2) + ' · ' + t.nombre, ruta(t.id)); if (principal) a.id = 'mat-fila-' + t.id; return a;}
    const cruzar = t => M.cruce(t, {riesgos: datos.riesgos, estandares: datos.estandares, plan: App.obtenerPlan()});
    function riesgos(t) {
      const caja = el('div', null, 'mat-tarjetas');
      cruzar(t).riesgos.forEach(r => {const a = enlace(r.id.slice(-2) + ' · ' + r.nombre, '#/ddhh/riesgos/' + r.id); a.className = 'mat-tarjeta'; a.append(el('span', 'Criticidad: ' + Riesgos.criticidad(r, datos.criticidad).nivel)); caja.append(a);});
      if (!caja.children.length) caja.append(el('p', 'Sin riesgos vinculados; consulte los ejes que sustentan el tema.'));
      return caja;
    }
    function impacto(t, f, destino) {
      const evs = Object.values(t.evaluacion_impacto);
      destino.append(barra('Severidad', media(evs.map(e => M.severidad(e, cfg)))), barra('Probabilidad', media(evs.map(e => e.probabilidad))), barra('Importancia del impacto', f.impacto));
    }
    function financiera(t, f, destino) {
      const evs = Object.values(t.evaluacion_financiera);
      destino.append(barra('Rentabilidad', media(evs.map(e => e.rentabilidad))), barra('Gasto operativo', media(evs.map(e => e.gasto_operativo))), barra('Promedio financiero', f.financiera));
    }
    const r = M.resumen(temas, cfg), resumen = el('section', null, 'superficie');
    resumen.append(el('h2', 'Resultado de la evaluación'), el('p', `${r.evaluados} temas evaluados · ${r.materiales} materiales · ${r.noMateriales} no materiales`));
    const corta = el('p', 'Lista corta: '); M.listaCorta(temas, cfg).forEach((f, i) => {if (i) corta.append(' · '); corta.append(enlace(tema(f.id).nombre, ruta(f.id)));}); resumen.append(corta);
    resumen.append(el('p', cfg.cuadrantes.map(c => `${c.etiqueta}: ${r.porCuadrante[c.id]}`).join(' · ')), el('p', `Umbral de impacto: ${numero(limites.impacto)} · Umbral financiero: ${numero(limites.financiera)}`)); raiz.append(resumen);
    const filtros = el('div', null, 'mat-filtros');
    [['cuadrante', 'Cuadrante', cfg.cuadrantes.map(c => [c.id, c.etiqueta])], ['dimension', 'Dimensión ESG', [...new Set(temas.map(t => t.dimension_esg))].map(v => [v, v])], ['materiales', 'Materialidad', [['1', 'Solo materiales']]], ['orden', 'Ordenar por', [['impacto', 'Impacto'], ['financiera', 'Financiera']]]].forEach(([k, nombre, opciones]) => {
      const label = el('label', nombre), select = el('select'); select.id = 'mat-filtro-' + k;
      if (k !== 'orden') opciones = [['', 'Todos'], ...opciones];
      if (query.get(k) && !opciones.some(([v]) => v === query.get(k))) opciones.push([query.get(k), query.get(k)]);
      opciones.forEach(([v, texto]) => {const o = el('option', texto); o.value = v; select.append(o);}); select.value = query.get(k) || (k === 'orden' ? 'impacto' : ''); select.onchange = () => cambiar(k, select.value); label.append(select); filtros.append(label);
    }); filtros.append(enlace('Limpiar filtros', '#/ddhh/materialidad')); raiz.append(filtros);
    const visibles = M.ordenar(M.filtrar(filas, temas, Object.fromEntries(query)), query.get('orden'));
    const resultado = el('section', null, 'superficie mat-resultado'); resultado.id = 'mat-resultado'; resultado.tabIndex = -1;
    resultado.append(el('h2', 'Matriz de doble materialidad'));
    const estado = el('p', `${visibles.length} de ${temas.length} temas coinciden con los filtros.`); estado.setAttribute('role', 'status'); resultado.append(estado);
    function svg(tag, attrs = {}, texto) {const n = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v))); if (texto !== undefined) n.textContent = texto; return n;}
    const grafico = svg('svg', {viewBox: '0 0 760 560', class: 'mat-svg', role: 'group', 'aria-label': 'Matriz: importancia del impacto y materialidad financiera, escala de cero a cinco'});
    const x = v => 70 + v / 5 * 620, y = v => 490 - v / 5 * 420, ux = x(limites.impacto), uy = y(limites.financiera);
    [['financiera', 70, 70, ux - 70, uy - 70], ['doble', ux, 70, 690 - ux, uy - 70], ['no-material', 70, uy, ux - 70, 490 - uy], ['impacto', ux, uy, 690 - ux, 490 - uy]].forEach(([id, a, b, w, h]) => {grafico.append(svg('rect', {x: a, y: b, width: w, height: h, class: 'mat-cuadrante mat-' + id}), svg('text', {x: a + 7, y: b + 18, class: 'mat-etiqueta'}, cuadrante(id)));});
    for (let i = 0; i <= 5; i++) grafico.append(svg('text', {x: x(i), y: 510, 'text-anchor': 'middle'}, i), svg('text', {x: 55, y: y(i) + 4, 'text-anchor': 'end'}, i));
    grafico.append(svg('line', {x1: ux, x2: ux, y1: 70, y2: 490, class: 'mat-umbral'}), svg('line', {x1: 70, x2: 690, y1: uy, y2: uy, class: 'mat-umbral'}), svg('text', {x: ux, y: 35, 'text-anchor': 'middle'}, 'Umbral de impacto: ' + numero(limites.impacto)), svg('text', {x: 70, y: 55}, 'Umbral financiero: ' + numero(limites.financiera)), svg('text', {x: 380, y: 545, 'text-anchor': 'middle'}, 'Importancia del impacto (0 a 5)'), svg('text', {transform: 'translate(20 280) rotate(-90)', 'text-anchor': 'middle'}, 'Materialidad financiera (0 a 5)'));
    // Geometría de 760 × 560 ajustada a la caja de trazado 620 × 420.
    const ids = new Set(visibles.map(f => f.id));
    M.posicionesMatriz(filas, 660, 460, 20).filter(p => ids.has(p.id)).forEach(p => {
      const nombre = `${p.id.slice(-2)} · ${tema(p.id).nombre}. Impacto: ${numero(p.impacto)}; financiera: ${numero(p.financiera)}. Posición real: (${numero(p.impacto)}; ${numero(p.financiera)}).`;
      const g = svg('g', {transform: `translate(${p.x + 50} ${p.y + 50})`, tabindex: '0', role: 'button', 'aria-label': nombre, class: 'mat-punto'});
      g.append(svg('title', {}, nombre), svg('circle', {r: 10}), svg('text', {'text-anchor': 'middle', dy: '0.35em'}, p.id.slice(-2)));
      g.onclick = () => {location.hash = ruta(p.id);}; g.onkeydown = e => {if (['Enter', ' '].includes(e.key)) {e.preventDefault(); g.onclick();}};
      const mostrar = () => {detalle.textContent = nombre;}; g.onmouseenter = mostrar; g.onfocus = mostrar; grafico.append(g);
    });
    const detalle = el('p', 'Enfoque o señale un punto para consultar sus puntajes.', 'mat-detalle'); detalle.setAttribute('aria-live', 'polite'); resultado.append(grafico, detalle);
    const listado = tabla('Temas evaluados', ['Número', 'Tema', 'Impacto', 'Financiera', 'Cuadrante', 'Convergencia', 'Riesgos'], visibles.map(f => [f.id.slice(-2), linkTema(tema(f.id), true), numero(f.impacto), numero(f.financiera), cuadrante(f.cuadrante), '●'.repeat(f.convergencia) + '○'.repeat(3 - f.convergencia) + ` (${f.convergencia}/3)`, tema(f.id).riesgos.length])); listado.id = 'mat-tabla';
    Array.from(listado.children[2].children).forEach((fila, i) => {fila.onclick = e => {if (!e.target.closest('a')) location.hash = ruta(visibles[i].id);};}); resultado.append(listado); raiz.append(resultado);
    const proceso = el('section', null, 'superficie'); proceso.append(el('h2', 'Cómo se llega al resultado'));
    const tabs = el('div', null, 'mat-etapas'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Proceso en seis etapas');
    let activa = Number(query.get('etapa') || 1); if (!Number.isInteger(activa) || activa < 1 || activa > 6) activa = 1;
    const panel = el('section', null, 'mat-etapa'); panel.id = 'mat-etapa'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'mat-tab-' + activa);
    cfg.etapas.forEach((et, i) => {const b = el('button', `${i + 1}. ${et.titulo}`); b.id = 'mat-tab-' + (i + 1); b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(activa === i + 1)); b.setAttribute('aria-controls', panel.id); b.tabIndex = activa === i + 1 ? 0 : -1; b.onclick = () => {render.etapaPendiente = true; cambiar('etapa', String(i + 1));}; b.onkeydown = e => {if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault(); const n = e.key === 'Home' ? 0 : e.key === 'End' ? 5 : (i + (e.key === 'ArrowRight' ? 1 : 5)) % 6; tabs.children[n].focus(); tabs.children[n].onclick();}; tabs.append(b);});
    panel.append(el('h3', cfg.etapas[activa - 1].titulo), el('p', cfg.etapas[activa - 1].descripcion));
    const regla = `La lista corta incluye todo tema que supere el umbral de impacto (${numero(limites.impacto)}) o el financiero (${numero(limites.financiera)}). La doble entrada exige superar al menos uno, no ambos; la igualdad no lo supera.`;
    if (activa === 1) {panel.append(el('p', regla)); temas.forEach(t => {const card = el('article', null, 'mat-tarjeta' + (filas.find(f => f.id === t.id).material ? ' mat-material' : '')); card.append(linkTema(t), el('p', filas.find(f => f.id === t.id).material ? 'Lista corta · Material' : 'Lista larga · No material'), el('p', 'Fuentes: ' + t.fuentes.map(f => fuentes[f] || f).join(' · '))); panel.append(card);});}
    if (activa === 2) {
      const tarjetas = el('div', null, 'mat-tarjetas'); data.grupos.forEach(g => {const c = el('article', null, 'mat-tarjeta'); c.append(el('h4', g.nombre), el('p', `${g.mecanismo} · ${g.participantes} participantes ilustrativos`)); tarjetas.append(c);}); panel.append(tarjetas);
      panel.append(el('p', 'Importancia del impacto por grupo: 0 a 5. El número expresa el puntaje; la intensidad del fondo lo acompaña.'));
      panel.append(tabla('Mapa de calor: tema × grupo', ['Tema', ...data.grupos.map(g => g.nombre)], temas.map(t => [t.nombre, ...data.grupos.map(g => {const v = M.porGrupo(t, cfg)[g.id], celda = el('span', numero(v), 'mat-calor'); celda.style.background = `color-mix(in srgb, var(--principal) ${v / 5 * 100}%, var(--fondo))`; const cifra = el('span', numero(v)); celda.textContent = ''; celda.append(cifra); return celda;})])));
    }
    if (activa === 3) {panel.append(el('p', 'Severidad = promedio de escala, alcance e irremediabilidad; importancia = promedio de severidad y probabilidad'), el('p', 'Misma lógica que la calificación de riesgos en DDHH. Se promedian los grupos con igual peso.')); filas.forEach(f => {const t = tema(f.id), c = el('article', null, 'mat-tarjeta'); c.append(linkTema(t)); impacto(t, f, c); c.append(el('h4', 'Riesgos que la sustentan'), riesgos(t)); panel.append(c);});}
    if (activa === 4) filas.forEach(f => {const t = tema(f.id), c = el('article', null, 'mat-tarjeta'); c.append(linkTema(t)); financiera(t, f, c); c.append(tabla('Por función evaluadora', ['Función', 'Rentabilidad', 'Gasto operativo', 'Promedio'], data.evaluadores_financieros.map(e => {const v = t.evaluacion_financiera[e.id]; return [e.nombre, numero(v.rentabilidad), numero(v.gasto_operativo), numero((v.rentabilidad + v.gasto_operativo) / 2)];}))); panel.append(c);});
    if (activa === 5) {panel.append(el('p', cfg.umbral.metodo === 'fijo' ? 'Método: valor fijo de ' + numero(cfg.umbral.valor_fijo) : 'Método: promedio del universo completo de temas en cada dimensión. Los filtros no cambian los umbrales.'), el('p', regla), el('p', 'Convergencia: ●●○ indica que dos de tres variables (impacto, rentabilidad y gasto operativo) superan sus respectivas medias del universo. Es un indicador de robustez, no otro criterio de materialidad.')); const volver = el('button', 'Volver a la matriz'); volver.onclick = () => {resultado.focus({preventScroll: true}); resultado.scrollIntoView({behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});}; panel.append(volver);}
    if (activa === 6) {
      panel.append(el('p', 'La materialidad de impacto se alimenta de la debida diligencia: los riesgos identificados y calificados sustentan la priorización.'));
      panel.append(tabla('De los temas materiales a la acción', ['Tema', 'Riesgos', 'Ejes', 'Acciones'], filas.filter(f => f.material).map(f => {const t = tema(f.id), c = cruzar(t); return [linkTema(t), ...['riesgos', 'ejes', 'acciones'].map(k => {const caja = el('div'); caja.append(enlace(`${c[k].length} ${k}: ver cruce`, ruta(t.id))); c[k].forEach(v => caja.append(enlace(v.nombre || v.titulo, k === 'riesgos' ? '#/ddhh/riesgos/' + v.id : k === 'ejes' ? '#/ddhh/estandares?eje=' + encodeURIComponent(v.id) : '#/ddhh/plan?accion=' + encodeURIComponent(v.id)))); return caja;})];})));
    }
    proceso.append(tabs, panel); raiz.append(proceso);
    if (render.etapaPendiente) {panel.classList.add('mat-cambio'); render.etapaPendiente = false;}
    if (!params.id || !tema(params.id)) return;
    const t = tema(params.id), f = filas.find(f => f.id === t.id), fondo = el('div', null, 'fondo-dialogo mat-fondo'), dialogo = el('section', null, 'panel materialidad mat-dialogo');
    dialogo.setAttribute('role', 'dialog'); dialogo.setAttribute('aria-modal', 'true'); dialogo.setAttribute('aria-labelledby', 'mat-titulo');
    const cerrar = el('button', 'Cerrar ficha ×', 'cerrar'); cerrar.onclick = () => {location.hash = ruta();};
    const titulo = el('h2', t.nombre); titulo.id = 'mat-titulo'; dialogo.append(cerrar, titulo, el('span', 'Ilustrativo', 'aviso'), el('p', t.dimension_esg + ' · ' + cuadrante(f.cuadrante)), el('p', 'Convergencia: ' + '●'.repeat(f.convergencia) + '○'.repeat(3 - f.convergencia) + ` (${f.convergencia}/3)`), el('p', 'Fuentes: ' + t.fuentes.map(k => fuentes[k] || k).join(' · ')), el('h3', 'Impacto')); impacto(t, f, dialogo); dialogo.append(el('h3', 'Financiera')); financiera(t, f, dialogo);
    ['impacto', 'financiera'].forEach(k => {const dif = f[k] - limites[k]; dialogo.append(el('p', (dif > 0 ? 'Supera' : dif === 0 ? 'Iguala' : 'Está por debajo de') + ' el umbral de ' + k + (dif === 0 ? '' : ' por ' + numero(Math.abs(dif)))));});
    dialogo.append(el('h3', 'Importancia del impacto por grupo')); const grupos = M.porGrupo(t, cfg); data.grupos.forEach(g => dialogo.append(barra(g.nombre, grupos[g.id])));
    dialogo.append(el('h3', 'Riesgos en DDHH'), riesgos(t), el('h3', 'Ejes de estándares'));
    const cruce = cruzar(t), ultima = [...datos.evaluaciones].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id))[0];
    cruce.ejes.forEach(e => {const puntaje = ultima?.puntajes[e.id]; dialogo.append(enlace(e.nombre + ' · ' + (Number.isFinite(puntaje) ? numero(puntaje) : 'Sin puntaje') + (ultima ? ' · ' + ultima.fecha : ''), '#/ddhh/estandares?eje=' + encodeURIComponent(e.id)));});
    dialogo.append(el('h3', 'Acciones del plan')); cruce.acciones.forEach(a => {const c = el('article', null, 'mat-tarjeta'); c.append(enlace(a.titulo, '#/ddhh/plan?accion=' + encodeURIComponent(a.id)), el('p', a.estado.replaceAll('_', ' ') + ' · Avance: ' + numero(a.avance) + ' %')); dialogo.append(c);});
    if (!cruce.acciones.length) dialogo.append(el('p', 'Sin acciones vinculadas.'));
    if (t.sasb) dialogo.append(el('h3', 'Referencia SASB'), el('p', typeof t.sasb === 'string' ? t.sasb : Object.values(t.sasb).join(' · ')));
    const anterior = document.activeElement, regiones = [...document.querySelectorAll('body > header, body > main, body > footer, body > .saltar')], inertes = regiones.map(n => n.inert);
    regiones.forEach(n => {n.inert = true;}); fondo.append(dialogo); document.body.append(fondo); document.body.classList.add('dialogo-abierto'); cerrar.focus();
    function teclado(e) {if (e.key === 'Escape') {e.preventDefault(); cerrar.onclick();} if (e.key === 'Tab') {const focos = [...dialogo.querySelectorAll('button, a[href]')], primero = focos[0], ultimo = focos.at(-1); if (e.shiftKey && document.activeElement === primero) {e.preventDefault(); ultimo.focus();} else if (!e.shiftKey && document.activeElement === ultimo) {e.preventDefault(); primero.focus();}}}
    document.addEventListener('keydown', teclado);
    return () => {document.removeEventListener('keydown', teclado); regiones.forEach((n, i) => {n.inert = inertes[i];}); fondo.remove(); document.body.classList.remove('dialogo-abierto'); (document.getElementById('mat-fila-' + t.id) || anterior)?.focus(); window.queueMicrotask?.(() => {if (location.hash === ruta()) (document.getElementById('mat-fila-' + t.id) || document.getElementById('mat-resultado'))?.focus({preventScroll: true});});};
  }
  App.registrarVista('materialidad', {render});
}());
