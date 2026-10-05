/* Capítulo 02: el método y sus reglas, leídos de los datos del caso. */
(function () {
  'use strict';
  function render(contenedor, datos) {
    const el = App.el, m = datos.caso.metodologia;
    function seccion(ante, titulo, contexto) {
      const s = el('section', null, 'seccion'), cab = el('div', null, 'seccion-cabeza'), t = el('div');
      t.append(el('p', ante, 'antetitulo'), el('h2', titulo)); cab.append(t, el('p', contexto)); s.append(cab); contenedor.append(s); return s;
    }
    const enfoque = seccion('Enfoque', 'De la evidencia a la acción', 'Tres análisis conectados orientan las prioridades.');
    enfoque.append(el('p', m.enfoque, 'relato-enfoque'));
    const flujo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    flujo.setAttribute('viewBox', '0 0 720 320'); flujo.setAttribute('class', 'relato-flujo'); flujo.setAttribute('role', 'img');
    flujo.setAttribute('aria-label', 'Brechas frente a estándares y riesgos en DDHH alimentan doble materialidad. Los tres análisis alimentan el plan de acción.');
    function svg(tag, attrs, texto) { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs).forEach(([k,v]) => n.setAttribute(k,v)); if (texto) n.textContent = texto; return n; }
    const defs = svg('defs', {}), marker = svg('marker', {id:'metodo-flecha', viewBox:'0 0 10 10', refX:9, refY:5, markerWidth:7, markerHeight:7, orient:'auto'});
    marker.append(svg('path', {d:'M 0 0 L 10 5 L 0 10', fill:'none', stroke:'var(--principal)'})); defs.append(marker); flujo.append(defs);
    ['M 175 80 L 285 143','M 545 80 L 435 143','M 360 181 L 360 245','M 130 80 L 130 275 L 260 275','M 590 80 L 590 275 L 460 275'].forEach(d => flujo.append(svg('path', {d, fill:'none', stroke:'var(--principal)', 'stroke-width':1.5, 'marker-end':'url(#metodo-flecha)'})));
    [[20,20,280,'Brechas frente a estándares'],[420,20,280,'Riesgos en DDHH'],[245,121,230,'Doble materialidad'],[260,245,200,'Plan de acción']].forEach(([x,y,w,t]) => { flujo.append(svg('rect',{x,y,width:w,height:60,rx:8,fill:'var(--superficie)',stroke:'var(--borde-fuerte)'}),svg('text',{x:x+w/2,y:y+36,'text-anchor':'middle',fill:'var(--texto)','font-size':18},t)); });
    enfoque.append(flujo);
    const proceso = seccion('Proceso', 'Cinco fases, una misma trazabilidad', 'Cada fase utiliza la evidencia de la anterior.');
    const fases = el('div', null, 'cadena relato-fases'); fases.setAttribute('role', 'list');
    m.fases.forEach(f => { const a = el('article', null, 'eslabon'); a.setAttribute('role','listitem'); a.append(el('span', String(f.numero).padStart(2,'0'), 'numeral'),el('h3',f.titulo),el('p',f.texto)); fases.append(a); }); proceso.append(fases);
    const universo = seccion('Referencias', 'Un marco común para evaluar', 'Ocho estándares aportan criterios complementarios. Las marcas indican dónde se utiliza cada uno.');
    [['Marco de derechos humanos',['PRNU','OCDE','PNA','OIT']],['Referencia sectorial',['IPIECA','GRI 11','SASB']],['Reporte y materialidad',['GRI 3']]].forEach(([nombre,siglas]) => {
      const grupo = el('div', null, 'relato-grupo'); grupo.append(el('h3', nombre, 'antetitulo')); const rejilla = el('div',null,'rejilla cuatro');
      siglas.forEach(sigla => { const e = m.estandares.find(e => e.sigla === sigla); if (!e) return;
        const a = el('article',null,'tarjeta relato-estandar'); a.append(el('p',e.sigla,'cifra'),el('h4',e.nombre),el('p',e.emisor,'nota'),el('p',e.uso));
        const usos = el('div',null,'relato-usos'); if (['OCDE','PRNU','PNA','IPIECA','OIT','GRI 11'].includes(sigla)) usos.append(el('span','Debida diligencia')); if (['GRI 3','SASB','GRI 11'].includes(sigla)) usos.append(el('span','Materialidad')); a.append(usos); rejilla.append(a);
      }); grupo.append(rejilla); universo.append(grupo);
    });
    const actividades = seccion('Trabajo de campo', 'Escuchar, contrastar y priorizar', 'La revisión documental se complementó con diálogo y talleres.');
    const cifras = el('div',null,'rejilla cuatro'); m.actividades.forEach(a => {const d=el('div',null,'dato'); d.append(el('span',a.valor,'cifra'),el('span',a.etiqueta,'cifra-etiqueta'),el('p',a.detalle,'nota')); cifras.append(d);}); actividades.append(cifras);
    const calificar = seccion('Cómo se califica', 'Reglas explícitas para interpretar los resultados', 'Las escalas y los cortes se leen de la configuración del caso.');
    const escalas = el('div',null,'relato-escalas');
    function tarjeta(titulo, niveles, texto) { const a=el('article',null,'tarjeta relato-escala'); a.append(el('h3',titulo)); const regla=el('ol',null,'relato-regla'); niveles.forEach(n=>{const li=el('li'); li.append(el('strong',App.numero(n.valor)),el('span',n.etiqueta || n.descripcion)); regla.append(li);}); a.append(regla,el('p',texto)); escalas.append(a); return a; }
    tarjeta('Brechas frente a estándares', datos.estandares.escala, 'Cada paso expresa una mayor madurez de gestión.');
    const g=datos.criticidad.gravedad;
    const riesgo=tarjeta('Riesgos en DDHH', Array.from({length:g.escala.maximo-g.escala.minimo+1},(_,i)=>({valor:g.escala.minimo+i,etiqueta:'Gravedad'})), 'Gravedad = promedio de escala, alcance e irremediabilidad. Se conserva la mayor gravedad entre las evaluaciones de cada riesgo.');
    const cortes=el('ul'); g.cortes.forEach((c,i)=>cortes.append(el('li',c.nivel+': '+(i ? 'desde '+App.numero(g.cortes[i-1].menor_que)+'; ' : '')+(c.menor_que===null ? 'hasta '+App.numero(g.escala.maximo) : 'menor que '+App.numero(c.menor_que))))); riesgo.append(cortes,el('p','Probabilidad según controles: '+datos.criticidad.probabilidad.join(', ')+'. Se representa por separado; no modifica la criticidad.'));
    if (datos.materialidadConfig) tarjeta('Doble materialidad',datos.materialidadConfig.escala.niveles,datos.materialidadConfig.umbral.nota);
    else tarjeta('Doble materialidad',[],'Escala en preparación: no se pudo cargar la configuración.');
    calificar.append(escalas,el('p','Las actividades describen un caso demostrativo. La materialidad y los cortes propuestos son ilustrativos.','nota'));
  }
  App.registrarVista('metodologia', {render});
}());
