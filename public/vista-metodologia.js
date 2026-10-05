/* Capítulo 02: contenido y reglas del método leídos del caso y su configuración. */
(function () {
  'use strict';
  function render(contenedor, datos) {
    const el = App.el, m = datos.caso.metodologia;
    let cerrarFicha = null;
    function seccion(ante, titulo, contexto) {
      const s = el('section', null, 'seccion'), cab = el('div', null, 'seccion-cabeza'), t = el('div');
      t.append(el('p', ante, 'antetitulo'), el('h2', titulo)); cab.append(t, el('p', contexto)); s.append(cab); contenedor.append(s); return s;
    }
    function lista(items) { const ul = el('ul', null, 'metodo-lista'); items.forEach(t => ul.append(el('li', t))); return ul; }
    function portada(e) { const img = el('img'); img.src = e.imagen; img.alt = 'Portada de ' + e.nombre; img.loading = 'lazy'; return img; }
    function usos(e) {
      const marcas = el('div', null, 'relato-usos');
      if (['PRNU','OCDE','PNA','OIT','IPIECA','GRI 11'].includes(e.sigla)) marcas.append(el('span', 'Debida diligencia'));
      if (['GRI 3','GRI 11','SASB'].includes(e.sigla)) marcas.append(el('span', 'Materialidad'));
      return marcas;
    }
    function ficha(origen, dibujar) {
      if (cerrarFicha) cerrarFicha();
      const fondo = el('div', null, 'fondo-dialogo'), panel = el('section', null, 'panel metodo-panel');
      panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'metodo-titulo');
      const cerrar = el('button', 'Cerrar ficha ×', 'cerrar'), contenido = el('div');
      cerrar.type = 'button'; panel.append(cerrar, contenido); fondo.append(panel);
      const regiones = [...document.querySelectorAll('body > header, body > main, body > footer, body > .saltar')].map(n => [n, n.inert]);
      regiones.forEach(([n]) => { n.inert = true; });
      document.body.append(fondo); document.body.classList.add('dialogo-abierto');
      function mostrar(construir) { contenido.replaceChildren(); construir(contenido, mostrar); panel.scrollTop = 0; cerrar.focus(); }
      function terminar() {
        document.removeEventListener('keydown', teclado); fondo.remove(); regiones.forEach(([n, estado]) => { n.inert = estado; });
        document.body.classList.remove('dialogo-abierto'); cerrarFicha = null; origen.focus();
      }
      function teclado(e) {
        if (e.key === 'Escape') { e.preventDefault(); terminar(); }
        if (e.key === 'Tab') {
          const focos = [...panel.querySelectorAll('button, a[href]')], primero = focos[0], ultimo = focos.at(-1);
          if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
          else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
        }
      }
      cerrar.onclick = terminar; fondo.onclick = e => { if (e.target === fondo) terminar(); };
      document.addEventListener('keydown', teclado); cerrarFicha = terminar; mostrar(dibujar);
    }
    function detalleEstandar(e) {
      return (contenido, mostrar) => {
        const cab = el('div', null, 'metodo-portada-cabecera'), texto = el('div'), titulo = el('h2', e.sigla); titulo.id = 'metodo-titulo';
        texto.append(titulo, el('p', e.nombre), el('p', e.emisor, 'nota'), usos(e)); cab.append(portada(e), texto);
        contenido.append(cab, el('h3', '¿Por qué se eligió?'), el('p', e.porque), el('h3', '¿Qué requerimientos tiene?'), lista(e.requerimientos), el('h3', '¿Cómo se relaciona con los demás estándares?'), el('p', e.relacion));
        const enlaces = el('div', null, 'metodo-relaciones');
        m.estandares.filter(otro => otro !== e && new RegExp('\\b' + otro.sigla + '\\b').test(e.relacion)).forEach(otro => {
          const b = el('button', otro.sigla, 'boton secundario'); b.type = 'button'; b.onclick = () => mostrar(detalleEstandar(otro)); enlaces.append(b);
        }); contenido.append(enlaces);
      };
    }
    const enfoque = seccion('Enfoque', 'De la evidencia a la acción', 'Tres análisis conectados orientan las prioridades.');
    const tarjeta = el('div', null, 'tarjeta metodo-enfoque'), columnas = el('div', null, 'metodo-enfoque-columnas'), pasos = el('ol', null, 'metodo-flujo-pasos');
    tarjeta.append(el('p', m.enfoque, 'relato-enfoque'), columnas); enfoque.append(tarjeta);
    function svg(tag, attrs, texto) { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs).forEach(([k,v]) => n.setAttribute(k,v)); if (texto !== undefined) n.textContent = texto; return n; }
    const flujo = svg('svg', {viewBox:'0 0 520 350', class:'relato-flujo', role:'group', 'aria-label':'Brechas y riesgos alimentan doble materialidad; los tres análisis alimentan el plan.'});
    const defs = svg('defs', {}), marcador = svg('marker', {id:'metodo-flecha', viewBox:'0 0 10 10', refX:9, refY:5, markerWidth:7, markerHeight:7, orient:'auto'});
    marcador.append(svg('path', {d:'M0 0L10 5L0 10', fill:'none', stroke:'var(--principal)'})); defs.append(marcador); flujo.append(defs);
    ['M130 85L210 160','M390 85L310 160','M260 215V280','M95 85V310H165','M425 85V310H355'].forEach(d => flujo.append(svg('path', {d, fill:'none', stroke:'var(--principal)', 'stroke-width':1.5, 'marker-end':'url(#metodo-flecha)'})));
    const posiciones = [[30,30,200],[290,30,200],[160,160,200],[165,280,190]];
    m.flujo.forEach((p,i) => {
      const li = el('li', null, 'metodo-flujo-paso'), texto = el('div'), enlace = el('a', 'Ver en el capítulo →'); enlace.href = p.destino;
      li.append(el('span', p.numero, 'metodo-numero'), texto); texto.append(el('h3', p.titulo), el('p', p.pregunta, 'nota'), enlace); pasos.append(li);
      const [x,y,w] = posiciones[i], nodo = svg('a', {href:p.destino, tabindex:0, class:'metodo-nodo', 'aria-label':p.numero + ' · ' + p.titulo});
      nodo.append(svg('rect', {x,y,width:w,height:55,rx:10}), svg('circle', {cx:x+20,cy:y,r:16}), svg('text', {x:x+20,y:y+5,'text-anchor':'middle',class:'metodo-nodo-numero'}, p.numero), svg('text', {x:x+w/2,y:y+33,'text-anchor':'middle'}, ['Brechas','Riesgos en DDHH','Doble materialidad','Plan de acción'][i])); flujo.append(nodo);
      const activos = new Set();
      function activar(fuente, activo) { if (activo) activos.add(fuente); else activos.delete(fuente); [li,nodo].forEach(n => n.setAttribute('data-activo', String(activos.size > 0))); }
      [li,nodo].forEach((n,j) => {
        n.onpointerenter = () => activar('puntero'+j, true); n.onpointerleave = () => activar('puntero'+j, false);
        n.onfocusin = () => activar('foco'+j, true); n.onfocusout = () => activar('foco'+j, false);
      });
    }); columnas.append(pasos, flujo);
    const proceso = seccion('Proceso', 'Cinco fases, una misma trazabilidad', 'Cada fase utiliza la evidencia de la anterior.');
    const fases = el('div', null, 'cadena relato-fases'); fases.setAttribute('role','list');
    m.fases.forEach(f => { const a=el('article',null,'eslabon'); a.setAttribute('role','listitem'); a.append(el('span',String(f.numero).padStart(2,'0'),'numeral'),el('h3',f.titulo),el('p',f.texto)); fases.append(a); }); proceso.append(fases);
    const universo = seccion('Referencias', 'Un marco común para evaluar', 'Ocho estándares aportan criterios complementarios. Las marcas indican dónde se utiliza cada uno.');
    [['Marco de derechos humanos',['PRNU','OCDE','PNA','OIT']],['Referencia sectorial',['IPIECA','GRI 11','SASB']],['Reporte y materialidad',['GRI 3']]].forEach(([nombre,siglas]) => {
      const grupo=el('div',null,'relato-grupo'), rejilla=el('div',null,'metodo-estandares'); grupo.append(el('h3',nombre,'antetitulo'),rejilla);
      siglas.forEach(sigla => { const e=m.estandares.find(e=>e.sigla===sigla), b=el('button',null,'tarjeta relato-estandar'), texto=el('div',null,'metodo-estandar-texto');
        b.type='button'; b.setAttribute('aria-haspopup','dialog'); texto.append(el('h3',e.sigla),el('p',e.nombre,'metodo-nombre'),usos(e)); b.append(portada(e),texto); b.onclick=()=>ficha(b,detalleEstandar(e)); rejilla.append(b);
      }); universo.append(grupo);
    });
    const campo=seccion('Trabajo de campo','Escuchar, contrastar y priorizar','La revisión documental se complementó con diálogo y talleres.'), cifras=el('div',null,'metodo-campos');
    m.actividades.forEach(a => {
      const b=el('button',null,'campo'), icono=el('span',null,'campo-icono'); icono.append(App.icono(a.icono)); b.type='button'; b.setAttribute('aria-haspopup','dialog');
      b.append(icono,el('span',a.valor,'cifra'),el('span',a.etiqueta,'cifra-etiqueta')); cifras.append(b);
      b.onclick=()=>ficha(b,contenido=>{const titulo=el('h2',a.valor+' · '+a.etiqueta); titulo.id='metodo-titulo'; contenido.append(titulo,el('h3','Objetivo del relacionamiento'),el('p',a.objetivo),el('h3','Herramientas utilizadas'),lista(a.herramientas),el('h3','Participantes'),el('p',a.participantes),el('h3','Referencia metodológica'),el('p',a.referencia,'nota'));});
    }); campo.append(cifras);
    const calificar=seccion('Cómo se califica','Reglas explícitas para interpretar los resultados','Las escalas y los cortes se leen de la configuración del caso.'), escalas=el('div',null,'relato-escalas'); calificar.append(escalas);
    function tabla(columnas, filas, clase) {
      const t=el('table',null,'metodo-tabla '+clase), head=el('thead'), tr=el('tr'), body=el('tbody');
      columnas.forEach(c=>{const th=el('th',c); th.scope='col'; tr.append(th);}); head.append(tr);
      filas.forEach(f=>{const r=el('tr',null,'sem-'+f.color); f.celdas.forEach((v,i)=>{const c=el(i===0?'th':'td',null,i===0?'metodo-calificacion':''); if(i===0)c.scope='row'; c.dataset.etiqueta=columnas[i]; if(Array.isArray(v))c.append(el('strong',v[0]),el('p',v[1])); else c.textContent=v; r.append(c);}); body.append(r);}); t.append(head,body); return t;
    }
    function escala(c) {const a=el('article',null,'tarjeta relato-escala'); a.append(el('h3',c.titulo),el('p',c.pregunta,'nota')); escalas.append(a); return a;}
    function niveles(c, descripciones, clase) {return tabla(['Calificación',c.columna],[...c.niveles].sort((a,b)=>b.valor-a.valor).map(n=>({color:n.color,celdas:[App.numero(n.valor),[n.nombre,descripciones.find(d=>d.valor===n.valor)?.descripcion || '']]})),clase);}
    const c=m.calificacion, brechas=escala(c.brechas); brechas.append(niveles(c.brechas,datos.estandares.escala,'metodo-brechas'),el('p',c.brechas.nota,'nota'));
    const riesgo=escala(c.riesgos), g=datos.criticidad.gravedad;
    const pasosRiesgo=c.riesgos.pasos.map(p=>{const s=el('section',null,'metodo-riesgo-paso'), h=el('h4'); h.append(el('span',p.numero,'metodo-numero'),el('span',p.titulo)); s.append(h,el('p',p.numero===2?'El promedio de escala, alcance e irremediabilidad se compara con estos cortes.':p.texto)); riesgo.append(s); return s;});
    pasosRiesgo[0].append(tabla(['Calificación','Escala · qué tan serio es el daño','Alcance · a cuántas personas afecta','Irremediabilidad · qué tan difícil es reparar'],[3,2,1].map(valor=>({color:{3:'rojo',2:'ambar',1:'amarillo'}[valor],celdas:[String(valor),...['escala','alcance','irreparable'].map(k=>g.parametros[k].find(p=>p.valor===valor).descripcion)]})),'metodo-gravedad'));
    const banda=el('div',null,'metodo-banda');
    g.cortes.forEach((c,i)=>{const inicio=i?g.cortes[i-1].menor_que:g.escala.minimo, fin=c.menor_que ?? g.escala.maximo, tramo=el('div',null,'sem-'+['amarillo','ambar','rojo'][i]); tramo.style.flexGrow=fin-inicio;
      tramo.append(el('strong',c.nivel),el('span',c.menor_que===null?'Desde '+App.numero(inicio)+' hasta '+App.numero(fin):'De '+App.numero(inicio)+' a menos de '+App.numero(fin))); banda.append(tramo);}); pasosRiesgo[1].append(banda);
    pasosRiesgo[2].append(tabla(['Probabilidad','Qué significa la calificación'],c.riesgos.probabilidad.map(n=>({color:n.color,celdas:[n.nivel,n.texto]})),'metodo-probabilidad'));
    pasosRiesgo[3].append(tabla(['Vinculación','Qué significa y qué respuesta corresponde'],c.riesgos.vinculacion.map(n=>({color:n.color,celdas:[n.nombre,[n.texto,n.respuesta]]})),'metodo-vinculacion'));
    const ejemplo=el('aside',null,'metodo-ejemplo'), r=datos.riesgos.find(r=>r.id===c.riesgos.ejemplo.riesgo);
    ejemplo.append(el('h4','Ejemplo resuelto'),el('p',c.riesgos.ejemplo.texto));
    if(r){const calculo=Riesgos.criticidad(r,datos.criticidad), e=calculo.evaluacionDominante, visual=el('div',null,'metodo-calculo');
      g.criterios.forEach((k,i)=>{if(i)visual.append(el('span','·')); const valor=el('span',App.numero(e[k]),'metodo-ficha-valor'); valor.setAttribute('aria-label',k+' '+App.numero(e[k])); visual.append(valor);});
      const prob=c.riesgos.probabilidad.find(p=>p.nivel.toLowerCase()===e.probabilidad), vin=c.riesgos.vinculacion.find(v=>v.tipo===e.vinculacion);
      visual.append(el('span','→'),el('span','Promedio '+App.numero(calculo.promedio,{minimumFractionDigits:1,maximumFractionDigits:1}),'metodo-ficha-valor'),el('span','→'),el('strong','Gravedad '+calculo.nivel,'metodo-ficha-valor sem-'+({Alta:'rojo',Media:'ambar',Baja:'amarillo'}[calculo.nivel] || 'gris')),el('strong','Probabilidad '+(prob?.nivel || 'Sin información'),'metodo-ficha-valor sem-'+(prob?.color || 'gris')),el('span','Vinculación: '+(vin?.nombre || 'Sin información'),'metodo-ficha-valor'));
      const link=el('a','Ver ficha del riesgo →'); link.href='#/ddhh/riesgos/'+r.id; ejemplo.append(visual,link);
    } riesgo.append(ejemplo);
    const materialidad=escala(c.materialidad);
    if(datos.materialidadConfig){materialidad.append(niveles(c.materialidad,datos.materialidadConfig.escala.niveles,'metodo-materialidad'),el('p',c.materialidad.nota,'nota'),el('p',datos.materialidadConfig.umbral.nota,'nota'));
      const cuadrantes=el('div',null,'metodo-cuadrantes'); datos.materialidadConfig.cuadrantes.forEach(q=>{const celda=el('div',null,'metodo-cuadrante'); celda.dataset.cuadrante=q.id; celda.append(el('strong',q.etiqueta),el('p',({doble:'Impacto y efecto financiero sobre el umbral',impacto:'Solo impacto sobre el umbral',financiera:'Solo efecto financiero sobre el umbral','no-material':'Ninguna dimensión sobre el umbral'})[q.id],'nota')); cuadrantes.append(celda);}); materialidad.append(cuadrantes);
    } else materialidad.append(el('p','Escala en preparación: no se pudo cargar la configuración.','nota'));
    calificar.append(el('p','Las actividades describen un caso demostrativo. La materialidad y los cortes propuestos son ilustrativos.','nota'));
    return () => { if(cerrarFicha) cerrarFicha(); };
  }
  App.registrarVista('metodologia', {render});
}());
