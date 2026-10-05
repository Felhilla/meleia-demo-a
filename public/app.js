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
  document.documentElement.dataset.paleta = new URLSearchParams(location.search).get('paleta') === 'b' ? 'b' : 'a';
  const el = App.el;
  let limpieza;
  const pasos = [['estandares', 'Alineación con estándares'], ['materialidad', 'Doble materialidad'], ['riesgos', 'Riesgos'], ['plan', 'Plan de acción']];
  function portada(contenedor, datos) {
    const hero = el('section', null, 'hero');
    hero.append(el('p', 'Sostenibilidad · Riesgo preventivo · Debida diligencia', 'eyebrow'), el('h1', 'Inteligencia para decidir en sostenibilidad'), el('p', 'Del cumplimiento de estándares a las decisiones: conecte brechas, temas materiales, riesgos y acciones en una sola plataforma viva.', 'intro'));
    contenedor.append(hero);
    const modulos = el('div', null, 'modulos');
    const activo = el('section', null, 'modulo activo');
    const entrada = el('a', 'Demo A · Debida diligencia, estándares y doble materialidad'); entrada.href = '#/ddhh/estandares';
    const titulo = el('h2'); titulo.append(entrada); activo.append(titulo);
    const cifras = el('div', null, 'cifras');
    const plan = App.obtenerPlan();
    const avance = Plan.resumen(plan, datos.planConfig).avanceGlobal;
    const evaluada = datos.evaluaciones.slice().sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id))[0];
    const valores = [[datos.estandares.ejes.filter(e => typeof evaluada?.puntajes[e.id] === 'number').length, 'ejes de estándares evaluados']];
    if (Array.isArray(datos.materialidad?.temas) && datos.materialidadConfig && window.Materialidad) {
      try { valores.push([Materialidad.listaCorta(datos.materialidad.temas, datos.materialidadConfig).length, 'temas materiales']); } catch (error) { /* sin cifra si la configuración es inválida */ }
    }
    valores.push([datos.riesgos.length, 'riesgos en DDHH'], [App.numero(avance, {maximumFractionDigits: 1}) + ' %', plan.some(a => a.seguimiento_ejemplo) ? 'avance del plan (ejemplo)' : 'avance del plan']);
    valores.forEach(([n, t]) => {
      const c = el('div'); c.append(el('strong', n), el('span', t)); cifras.append(c);
    });
    const recorrido = el('ol', null, 'recorrido'); recorrido.setAttribute('aria-label', 'Recorrido del Demo A');
    pasos.forEach(([ruta], i) => {
      const item = el('li'), enlace = el('a', ['Estándares', 'Materialidad', 'Riesgos', 'Plan'][i]);
      enlace.href = '#/ddhh/' + ruta; item.append(enlace); recorrido.append(item);
    });
    activo.append(cifras, recorrido); modulos.append(activo);
    const pendiente = el('section', null, 'modulo pendiente');
    pendiente.append(el('span', 'En desarrollo', 'eyebrow'), el('h2', 'Demo B · Gestión de riesgos y mapeo de actores'), el('p', 'Una matriz de riesgos corporativos vinculada a los actores que los generan o los sufren.'));
    modulos.append(pendiente);
    contenedor.append(modulos);
  }
  function enrutar() {
    if (!App.datos) return;
    const focoAnterior = document.activeElement;
    const focoId = focoAnterior?.id;
    const focoRiesgo = focoAnterior?.dataset.riesgo || document.querySelector('[role="dialog"]')?.dataset.riesgo;
    const habiaDialogo = !!document.querySelector('[role="dialog"]');
    if (typeof limpieza === 'function') limpieza();
    limpieza = null;
    const hash = location.hash.slice(1) || '/';
    const [ruta, query = ''] = hash.split('?');
    const match = ruta.match(/^\/ddhh\/(riesgos|estandares|materialidad|plan)(?:\/([^/]+))?$/);
    const idValido = !match?.[2] || (match[1] === 'riesgos' && /^riesgo-\d+$/.test(match[2]) && App.datos.riesgos.some(r => r.id === match[2])) ||
      (match[1] === 'materialidad' && (Array.isArray(App.datos.materialidad?.temas) ? App.datos.materialidad.temas.some(t => t.id === match[2]) : /^tema-\d{2}$/.test(match[2])));
    if (ruta !== '/' && (!match || !idValido)) {
      location.replace(location.pathname + location.search + '#/'); return;
    }
    const contenedor = document.getElementById('contenido');
    const nav = document.getElementById('pestanas');
    contenedor.replaceChildren(); nav.replaceChildren(); nav.hidden = !match;
    if (match) {
      nav.setAttribute('role', 'tablist');
      pasos.forEach(([nombre, titulo]) => {
        const a = el('a', titulo); a.href = '#/ddhh/' + nombre; a.id = 'tab-' + nombre;
        a.setAttribute('role', 'tab'); a.setAttribute('aria-selected', String(nombre === match[1]));
        a.setAttribute('aria-controls', 'contenido'); a.tabIndex = nombre === match[1] ? 0 : -1;
        a.addEventListener('keydown', event => {
          const tabs = [...nav.children]; let i = tabs.indexOf(a);
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          i = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          location.hash = tabs[i].hash;
        }); nav.append(a);
      });
      contenedor.setAttribute('role', 'tabpanel'); contenedor.setAttribute('aria-labelledby', 'tab-' + match[1]);
      limpieza = vistas.get(match[1]).render(contenedor, App.datos, {id: match[2], filtros: new URLSearchParams(query)});
      const indice = pasos.findIndex(([nombre]) => nombre === match[1]);
      const siguiente = el('a', indice < 3 ? 'Siguiente: ' + pasos[indice + 1][1] + ' →' : 'Volver a la portada →', 'siguiente-paso');
      siguiente.href = indice < 3 ? '#/ddhh/' + pasos[indice + 1][0] : '#/';
      contenedor.append(siguiente);
    } else {
      contenedor.removeAttribute('role'); contenedor.removeAttribute('aria-labelledby'); portada(contenedor, App.datos);
    }
    if (!document.querySelector('[role="dialog"]')) {
      const restaurar = focoId?.startsWith('tab-') ? nav.querySelector('[aria-selected="true"]') : focoId && document.getElementById(focoId);
      const riesgo = focoRiesgo && [...contenedor.querySelectorAll('[data-riesgo]')].find(n => n.dataset.riesgo === focoRiesgo);
      (restaurar || riesgo || contenedor).focus({preventScroll: !habiaDialogo});
    }
  }
  document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector('.saltar').onclick = event => { event.preventDefault(); document.getElementById('contenido').focus(); };
    const archivos = {empresa: 'config/empresa-config.json', riesgos: 'data/riesgos.json', plan: 'data/plan.json', estandares: 'data/estandares.json', evaluaciones: 'data/evaluaciones.json', criticidad: 'config/criticidad-config.json', umbrales: 'config/umbrales-config.json', planConfig: 'config/plan-config.json'};
    try {
      const opcionales = {materialidad: 'data/materialidad.json', materialidadConfig: 'config/materialidad-config.json'};
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
      document.getElementById('contexto-empresa').textContent = `${App.datos.empresa.nombre} · ${App.datos.empresa.etiqueta_ficticia}`;
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
      aviso.append(el('h1', 'No pudimos cargar la plataforma'), el('p', 'Comprueba la conexión y vuelve a intentarlo. Si el problema continúa, contacta al equipo de GH Estudios.'));
      const boton = el('button', 'Volver a intentar'); boton.onclick = () => location.reload(); aviso.append(boton);
      document.getElementById('contenido').replaceChildren(aviso);
    }
  });
}());
