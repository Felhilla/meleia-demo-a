/* Contrato de vistas: render(contenedor, datos, {id, filtros: URLSearchParams}). */
(function () {
  'use strict';
  const vistas = new Map();
  let estadoPlan = 'respaldo';
  const App = window.App = {
    datos: null,
    numero(valor, opciones = {}) { return new Intl.NumberFormat('es-CO', opciones).format(valor); },
    listaNumerada(texto) {
      const limpio = String(texto ?? '').replace(/\\n/g, '\n').trim();
      if (!limpio) return [];
      return limpio.split(/(?:^|\n)\s*\d+\.\s+/).map(t => t.trim()).filter(Boolean);
    },
    registrarVista(nombre, vista) { vistas.set(nombre, vista); },
    obtenerPlan() { return App.datos.plan; },
    estadoBase() { return estadoPlan; },
    async guardarAccion(id, cambios) {
      if (estadoPlan !== 'base') throw new Error('No hay conexión con la base de datos. No se guardaron los cambios.');
      const original = App.datos.plan.find(a => a.id === id);
      if (!original) throw new Error('No se encontró la acción.');
      const resultado = Plan.aplicarCambio(original, cambios, App.datos.planConfig, new Date().toISOString());
      if (!resultado.ok) throw new Error(resultado.errores.join(' '));
      try {
        await GHDatos.set('plan-acciones', id, resultado.accion);
      } catch (error) {
        throw new Error('No se pudo guardar el cambio. Comprueba la conexión y vuelve a intentarlo.');
      }
      App.datos.plan = App.datos.plan.map(a => a.id === id ? resultado.accion : a);
      return resultado.accion;
    },
    // Todos los textos, incluidos atributos y datos remotos, se insertan con DOM seguro.
    el(tag, texto, clase) {
      const nodo = document.createElement(tag);
      if (texto !== undefined && texto !== null) nodo.textContent = texto;
      if (clase) nodo.className = clase;
      return nodo;
    }
  };
  const sistemaTema = window.matchMedia?.('(prefers-color-scheme: dark)');
  let temaElegido;
  try { temaElegido = localStorage.getItem('gh-meleia-tema'); } catch (_) { /* Almacenamiento restringido. */ }
  function aplicarTema() {
    const oscuro = temaElegido === 'oscuro' || (temaElegido !== 'claro' && !!sistemaTema?.matches);
    document.documentElement.dataset.tema = oscuro ? 'oscuro' : 'claro';
    const boton = document.getElementById('tema');
    if (boton) {
      boton.textContent = oscuro ? '☀' : '☾';
      boton.setAttribute('aria-label', oscuro ? 'Activar tema claro' : 'Activar tema oscuro');
      boton.setAttribute('aria-pressed', String(oscuro));
      boton.onclick = () => {
        temaElegido = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
        try { localStorage.setItem('gh-meleia-tema', temaElegido); } catch (_) { /* La elección dura esta sesión. */ }
        aplicarTema();
      };
    }
  }
  aplicarTema();
  sistemaTema?.addEventListener?.('change', aplicarTema);
  const el = App.el;
  let limpieza;

  /* ---------- Rutas del relato ----------
     #/                          01 El caso
     #/metodologia               02 Metodología
     #/resultados                03 Estado actual de la organización
     #/ddhh/{dimensiones|riesgos}[/riesgo-xx]           04 Debida diligencia en DDHH
     #/materialidad/{impacto|financiera|doble}[/tema-xx] 05 Doble materialidad
     #/plan                      06 Plan de acción
     Las direcciones anteriores (#/ddhh/estandares, #/ddhh/materialidad, #/ddhh/plan) se redirigen. */
  const VISTAS = {
    'caso': 'caso', 'metodologia': 'metodologia', 'resultados': 'resultados',
    'ddhh/dimensiones': 'estandares', 'ddhh/riesgos': 'riesgos',
    'materialidad/impacto': 'materialidad-impacto', 'materialidad/financiera': 'materialidad-financiera', 'materialidad/doble': 'materialidad',
    'plan': 'plan'
  };
  const HEREDADAS = [
    [/^\/ddhh\/estandares(\/.*)?$/, () => '/ddhh/dimensiones'],
    [/^\/ddhh\/materialidad(\/tema-\d{2})?$/, m => '/materialidad/doble' + (m[1] || '')],
    [/^\/ddhh\/plan$/, () => '/plan'],
    [/^\/ddhh\/?$/, () => '/ddhh/dimensiones'],
    [/^\/materialidad\/?$/, () => '/materialidad/impacto']
  ];
  App.resolverRuta = function (hash, datos) {
    const [crudo, query = ''] = (hash.replace(/^#/, '') || '/').split('?');
    const ruta = crudo || '/';
    for (const [patron, destino] of HEREDADAS) {
      const m = ruta.match(patron);
      if (m) return {redirigir: '#' + destino(m) + (query ? '?' + query : '')};
    }
    let m;
    if (ruta === '/') return {capitulo: 'caso', clave: 'caso', query};
    if ((m = ruta.match(/^\/(metodologia|resultados|plan)$/))) return {capitulo: m[1], clave: m[1], query};
    if ((m = ruta.match(/^\/ddhh\/(dimensiones|riesgos)(?:\/(riesgo-\d+))?$/))) {
      if (m[2] && (m[1] !== 'riesgos' || !datos.riesgos.some(r => r.id === m[2]))) return {redirigir: '#/ddhh/riesgos'};
      return {capitulo: 'ddhh', sub: m[1], clave: 'ddhh/' + m[1], id: m[2], query};
    }
    if ((m = ruta.match(/^\/materialidad\/(impacto|financiera|doble)(?:\/(tema-\d{2}))?$/))) {
      const temas = datos.materialidad?.temas;
      if (m[2] && Array.isArray(temas) && !temas.some(t => t.id === m[2])) return {redirigir: '#/materialidad/' + m[1]};
      return {capitulo: 'materialidad', sub: m[1], clave: 'materialidad/' + m[1], id: m[2], query};
    }
    return {redirigir: '#/'};
  };
  function rutaCapitulo(cap) {
    if (cap.id === 'caso') return '#/';
    return '#/' + cap.id + (cap.subcapitulos ? '/' + cap.subcapitulos[0].id : '');
  }
  function capitulos() { return App.datos.caso?.capitulos || []; }

  function pintarIndice(actual) {
    const nav = document.getElementById('capitulos');
    const ol = el('ol');
    capitulos().forEach(cap => {
      const li = el('li'), a = el('a');
      a.href = rutaCapitulo(cap);
      a.append(el('span', cap.numero), document.createTextNode(cap.titulo));
      if (cap.id === actual) a.setAttribute('aria-current', 'page');
      li.append(a); ol.append(li);
    });
    nav.replaceChildren(ol); nav.hidden = false;
    nav.querySelector('[aria-current="page"]')?.scrollIntoView?.({block: 'nearest', inline: 'nearest'});
  }

  function cabezaCapitulo(cap, sub) {
    // Banda Forest con el motivo de marca (arco y punto dorado), igual que «Para qué nos contrató».
    const cabeza = el('header', null, 'capitulo-cabeza');
    const banda = el('div', null, 'capitulo-banda');
    banda.append(el('p', 'Capítulo ' + cap.numero, 'antetitulo'), el('h1', cap.titulo), el('p', cap.bajada, 'bajada'));
    const ns = 'http://www.w3.org/2000/svg', arco = document.createElementNS(ns, 'svg');
    arco.setAttribute('viewBox', '0 0 400 400'); arco.setAttribute('aria-hidden', 'true'); arco.setAttribute('class', 'capitulo-arco');
    [[170, 'var(--gold)', 2.2], [138, 'var(--sage)', 1], [106, 'var(--sage)', 1]].forEach(([r, c, w]) => {
      const p = document.createElementNS(ns, 'path'); p.setAttribute('d', `M ${200 - r} 300 A ${r} ${r} 0 0 1 ${200 + r} 300`);
      p.setAttribute('fill', 'none'); p.setAttribute('stroke', c); p.setAttribute('stroke-width', w); arco.append(p);
    });
    const punto = document.createElementNS(ns, 'circle'); punto.setAttribute('cx', 200); punto.setAttribute('cy', 222); punto.setAttribute('r', 15); punto.setAttribute('fill', 'var(--gold)'); arco.append(punto);
    banda.append(arco); cabeza.append(banda);
    if (cap.subcapitulos) {
      const subs = el('nav', null, 'subcapitulos'); subs.setAttribute('aria-label', 'Secciones de ' + cap.titulo);
      cap.subcapitulos.forEach(s => {
        const a = el('a', s.titulo); a.href = '#/' + cap.id + '/' + s.id;
        if (s.id === sub) a.setAttribute('aria-current', 'page');
        subs.append(a);
      });
      cabeza.append(subs);
    }
    return cabeza;
  }

  function continuar(cap) {
    const lista = capitulos(), i = lista.findIndex(c => c.id === cap.id);
    const nav = el('nav', null, 'continuar'); nav.setAttribute('aria-label', 'Continuar el recorrido');
    const enlace = (c, rotulo, clase) => {
      const a = el('a', null, clase); a.href = rutaCapitulo(c);
      a.append(el('small', rotulo), el('strong', c.numero + ' · ' + c.titulo)); return a;
    };
    if (i > 0) nav.append(enlace(lista[i - 1], '← Anterior', 'anterior'));
    if (i < lista.length - 1) nav.append(enlace(lista[i + 1], 'Siguiente →', 'siguiente'));
    return nav;
  }

  // Temporal: las vistas anteriores traen su propio título y «Paso N de 4»; el capítulo ya los da.
  function depurarVistaHeredada(raiz) {
    raiz.querySelectorAll?.('h1').forEach((h, i) => { if (i === 0 && !h.closest('.panel')) h.remove(); });
    raiz.querySelectorAll?.('p').forEach(p => { if (/^Paso \d de 4/.test(p.textContent || '') || /^DEMO A/.test(p.textContent || '')) p.remove(); });
  }

  function enPreparacion(contenedor, titulo) {
    const caja = el('section', null, 'en-preparacion');
    caja.append(el('h2', titulo), el('p', 'Esta sección se está construyendo. Mientras tanto puede continuar el recorrido.'));
    contenedor.append(caja);
  }

  function enrutar() {
    if (!App.datos) return;
    const habiaDialogo = !!document.querySelector('[role="dialog"]');
    const r = App.resolverRuta(location.hash, App.datos);
    if (r.redirigir) { location.replace(location.pathname + location.search + r.redirigir); return; }
    if (typeof limpieza === 'function') limpieza();
    limpieza = null;
    const contenido = document.getElementById('contenido');
    contenido.replaceChildren();
    const cap = capitulos().find(c => c.id === r.capitulo);
    pintarIndice(r.capitulo);
    document.title = (cap ? cap.titulo + ' · ' : '') + 'Caso ' + App.datos.empresa.nombre_corto + ' · GH Studio × Meleia';
    if (cap && cap.id !== 'caso') contenido.append(cabezaCapitulo(cap, r.sub));
    const cuerpo = el('div', null, 'vista vista-' + r.clave.replace('/', '-'));
    contenido.append(cuerpo);
    const nombreVista = VISTAS[r.clave];
    const vista = vistas.get(nombreVista);
    if (vista) {
      limpieza = vista.render(cuerpo, App.datos, {id: r.id, sub: r.sub, capitulo: r.capitulo, filtros: new URLSearchParams(r.query)});
      if (!['caso', 'metodologia', 'resultados', 'estandares', 'riesgos'].includes(nombreVista)) depurarVistaHeredada(cuerpo);
    } else {
      enPreparacion(cuerpo, (cap?.subcapitulos?.find(s => s.id === r.sub)?.titulo) || cap?.titulo || 'Sección');
    }
    if (cap) contenido.append(continuar(cap));
    if (!document.querySelector('[role="dialog"]')) contenido.focus({preventScroll: !habiaDialogo});
  }

  document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector('.saltar').onclick = event => { event.preventDefault(); document.getElementById('contenido').focus(); };
    const archivos = {empresa: 'config/empresa-config.json', caso: 'data/caso.json', riesgos: 'data/riesgos.json', plan: 'data/plan.json', estandares: 'data/estandares.json', evaluaciones: 'data/evaluaciones.json', criticidad: 'config/criticidad-config.json', planConfig: 'config/plan-config.json', umbrales: 'config/umbrales-config.json'};
    try {
      const opcionales = {derechos: 'data/derechos.json', dimensiones: 'data/dimensiones.json', materialidad: 'data/materialidad.json', materialidadConfig: 'config/materialidad-config.json'};
      App.datos = Object.fromEntries(await Promise.all(Object.entries({...archivos, ...opcionales}).map(async ([clave, ruta]) => {
        try {
          const respuesta = await fetch(ruta);
          if (!respuesta.ok) throw new Error('No se pudo cargar ' + clave);
          return [clave, await respuesta.json()];
        } catch (error) {
          if (Object.hasOwn(opcionales, clave)) return [clave, null];
          throw error;
        }
      })));
      document.getElementById('caso-nombre').textContent = App.datos.empresa.nombre;
      document.getElementById('caso-ficticia').textContent = App.datos.empresa.ficticia ? 'Empresa ficticia' : '';
      document.getElementById('caso-ficticia').title = App.datos.empresa.etiqueta_ficticia;
      const estatico = App.datos.plan;
      let espera;
      try {
        const deBase = await Promise.race([
          Promise.resolve().then(() => GHDatos.list('plan-acciones')).then(acciones => ({acciones, estado: GHDatos.estado})),
          new Promise((resolve, reject) => { espera = setTimeout(() => reject(new Error('Tiempo de espera agotado')), 5000); })
        ]);
        estadoPlan = deBase.estado === 'base' ? 'base' : 'respaldo';
        App.datos.plan = Plan.combinar(estatico, estadoPlan === 'base' ? deBase.acciones : []);
      } catch (error) {
        estadoPlan = 'respaldo';
        App.datos.plan = estatico;
      } finally { clearTimeout(espera); }
      window.addEventListener('hashchange', enrutar); enrutar();
    } catch (error) {
      const aviso = el('section', null, 'error'); aviso.setAttribute('role', 'alert');
      aviso.append(el('h1', 'No pudimos cargar la plataforma'), el('p', 'Comprueba la conexión y vuelve a intentarlo. Si el problema continúa, contacta al equipo de GH Studio × Meleia.'));
      const boton = el('button', 'Volver a intentar'); boton.onclick = () => location.reload(); aviso.append(boton);
      document.getElementById('contenido').replaceChildren(aviso);
    }
  });
}());
