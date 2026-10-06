/* Capítulo 05: tres lecturas de los mismos temas y una ficha compartida. */
(function () {
  'use strict';
  const el = App.el, M = Materialidad;
  let focoPendiente = null;
  const numero = v => new Intl.NumberFormat('es-CO', {maximumFractionDigits: 2}).format(v);
  const nota = 'Temas y calificaciones ilustrativos: muestran cómo funciona el método (GRI 3 · SASB Gas Utilities & Distributors)';
  const enlace = (texto, href) => {const a = el('a', texto); a.href = href; return a;};
  function svg(tag, attrs = {}, texto) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
    if (texto !== undefined) n.textContent = texto;
    return n;
  }
  let NIVELES_SEM = [];
  const semColor = v => (NIVELES_SEM.find(n => typeof v === 'number' && n.valor === Math.min(5, Math.floor(v))) || {}).color || 'gris';
  function circulo(v, grande) { return el('span', typeof v === 'number' ? numero(v) : '—', 'mat-circulo sem-' + semColor(v) + (grande ? ' grande' : '')); }
  function cabeza(antetitulo, titulo, contexto) {
    const c = el('div', null, 'seccion-cabeza mat-cabeza'), t = el('div');
    t.append(el('p', antetitulo, 'antetitulo'), el('h2', titulo)); c.append(t, el('p', contexto)); return c;
  }
  function barra(nombre, valor, umbral) {
    const b = el('div', null, 'mat-barra'), pista = el('div', null, 'mat-pista');
    b.append(typeof nombre === 'string' ? el('span', nombre) : nombre, el('span', numero(valor), 'mat-valor'));
    const relleno = el('span', null, 'mat-relleno'), marca = el('span', null, 'mat-marca');
    relleno.style.width = valor / 5 * 100 + '%'; marca.style.left = umbral / 5 * 100 + '%';
    relleno.className = 'mat-relleno sem-relleno-' + semColor(valor);
    pista.setAttribute('role', 'img'); pista.setAttribute('aria-label', `Puntaje ${numero(valor)} de 5; umbral ${numero(umbral)}`);
    pista.append(relleno, marca); b.append(pista); return b;
  }
  const lecturas = {
    impacto: ['Materialidad de impacto', '¿Qué temas afectan más a las personas y al entorno?', 'Probabilidad', 'Severidad', ['Prioridad de impacto', 'Severo pero poco probable', 'Probable pero menos severo', 'Impacto bajo']],
    financiera: ['Materialidad financiera', '¿Qué temas pueden afectar más el desempeño y el valor de la empresa?', 'Impacto en el gasto operativo', 'Impacto en la rentabilidad', ['Prioridad financiera', 'Afecta ingresos', 'Afecta costos', 'Efecto financiero bajo']],
    doble: ['Doble materialidad', '¿Qué temas son materiales en al menos una de las dos dimensiones?', 'Importancia del impacto', 'Materialidad financiera']
  };
  function render(contenedor, datos, params = {}, sub = 'doble') {
    const raiz = el('div', null, 'materialidad'); contenedor.append(raiz);
    NIVELES_SEM = datos.caso?.metodologia?.calificacion?.materialidad?.niveles || [];
    const cfg = datos.materialidadConfig, data = datos.materialidad;
    let filas;
    try {filas = M.clasificar(data.temas, cfg);} catch (_) {
      raiz.append(el('p', 'Contenido en preparación', 'en-preparacion'), el('p', nota, 'nota')); return;
    }
    const temas = data.temas, limites = M.umbrales(temas, cfg), lectura = lecturas[sub];
    const mi = M.mapaImpacto(temas, cfg), mf = M.mapaFinanciero(temas, cfg);
    const puntos = sub === 'impacto' ? mi : sub === 'financiera' ? mf : filas.map(f => ({...f, x: f.impacto, y: f.financiera}));
    const cortes = sub === 'doble' ? {x: limites.impacto, y: limites.financiera} : puntos.umbrales;
    const etiquetas = lectura[4] || ['doble', 'financiera', 'impacto', 'no-material'].map(id => cfg.cuadrantes.find(c => c.id === id).etiqueta);
    const tema = id => temas.find(t => t.id === id), fila = id => filas.find(f => f.id === id);
    const material = id => puntos.find(p => p.id === id).material;
    const cuadrante = p => etiquetas[p.x > cortes.x ? (p.y > cortes.y ? 0 : 2) : (p.y > cortes.y ? 1 : 3)];
    const ruta = (id = '') => '#/materialidad/' + sub + (id ? '/' + id : '');
    const linkTema = id => enlace(id.slice(-2) + ' · ' + tema(id).nombre, ruta(id));
    const cruzar = t => M.cruce(t, {riesgos: datos.riesgos, estandares: datos.estandares, plan: App.obtenerPlan()});
    function riesgos(t) {
      const caja = el('div', null, 'mat-riesgos');
      cruzar(t).riesgos.forEach(r => {
        const nivel = Riesgos.criticidad(r, datos.criticidad).nivel;
        const a = enlace(r.id.slice(-2) + ' · ' + r.nombre + ' · Criticidad: ' + nivel, '#/ddhh/riesgos/' + r.id);
        a.className = 'criticidad ' + nivel; caja.append(a);
      });
      if (!caja.children.length) caja.append(el('p', 'Los ejes de estándares sustentan este tema; no tiene riesgos vinculados.'));
      return caja;
    }
    function sasb(t, destino) {
      if (t.sasb) destino.append(el('p', 'Referencia SASB: ' + (typeof t.sasb === 'string' ? t.sasb : Object.values(t.sasb).join(' · '))));
    }
    const cantidad = puntos.filter(p => p.material).length;
    const hallazgo = sub === 'doble' ? `${cantidad} de ${temas.length} temas son materiales en al menos una dimensión` : `${cantidad} de ${temas.length} temas superan el umbral ${sub === 'impacto' ? 'de impacto' : 'financiero'}`;
    const mapa = el('section', null, 'seccion mat-mapa');
    mapa.append(cabeza(lectura[0], hallazgo, lectura[1]));
    const tarjeta = el('div', null, 'tarjeta mat-grafico'); tarjeta.append(el('h3', 'Mapa de cuadrantes'));
    const grafico = svg('svg', {viewBox: '0 0 1080 700', class: 'mat-svg', role: 'group', 'aria-label': `Mapa de cuadrantes: ${lectura[2]} y ${lectura[3]}, escala de 0 a 5`});
    const x = v => 90 + v / 5 * 900, y = v => 540 - v / 5 * 420, ux = x(cortes.x), uy = y(cortes.y);
    [[90,120,ux-90,uy-120,1],[ux,120,990-ux,uy-120,0],[90,uy,ux-90,540-uy,3],[ux,uy,990-ux,540-uy,2]].forEach(([a,b,w,h,i]) => {
      grafico.append(svg('rect', {x:a,y:b,width:w,height:h,class:'mat-cuadrante mat-cuadrante-' + i}));
    });
    for (let i = 0; i <= 5; i++) grafico.append(svg('text', {x:x(i),y:565,'text-anchor':'middle'}, numero(i)), svg('text', {x:74,y:y(i)+5,'text-anchor':'end'}, numero(i)));
    grafico.append(svg('line',{x1:ux,x2:ux,y1:120,y2:540,class:'mat-umbral'}),svg('line',{x1:90,x2:990,y1:uy,y2:uy,class:'mat-umbral'}));
    grafico.append(svg('text',{x:90,y:28}, `Umbral X: ${numero(cortes.x)} · Umbral Y: ${numero(cortes.y)}`));
    // Etiquetas fuera del área de puntos: nunca ocultan una observación.
    [[1,90,90,'start'],[0,990,90,'end'],[3,90,606,'start'],[2,990,606,'end']].forEach(([i,a,b,anchor]) => grafico.append(svg('text',{x:a,y:b,'text-anchor':anchor,class:'mat-etiqueta'},etiquetas[i])));
    grafico.append(svg('text',{x:540,y:663,'text-anchor':'middle'},lectura[2]), svg('text',{transform:'translate(25 330) rotate(-90)','text-anchor':'middle'},lectura[3]));
    // Trabajar a un tercio de escala convierte la separación mínima de 14 en 42 px.
    M.posicionesMatriz(puntos.map(p => ({...p,impacto:p.x,financiera:p.y})),360,200,30).forEach(p => {
      const px = p.x*3, py = p.y*3+30;
      if (p.x !== p.realX || p.y !== p.realY) grafico.append(svg('line',{x1:p.realX*3,y1:p.realY*3+30,x2:px,y2:py,class:'mat-conector'}));
      const g = svg('g',{role:'button',tabindex:0,class:'mat-punto' + (p.material ? ' mat-material' : ''),'aria-label': `${p.id.slice(-2)} · ${tema(p.id).nombre}; ${lectura[2]}: ${numero(p.impacto)}; ${lectura[3]}: ${numero(p.financiera)}; ${p.material ? 'material' : 'no material'}`});
      g.append(svg('circle',{cx:px,cy:py,r:18}),svg('text',{x:px,y:py+5,'text-anchor':'middle'},p.id.slice(-2)));
      g.onclick = () => {location.hash = ruta(p.id);}; g.onkeydown = e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); g.onclick();}}; grafico.append(g);
    });
    tarjeta.append(grafico, el('p', 'Cómo leerlo: el relleno identifica los temas materiales; el contorno, los no materiales. Seleccione un número para abrir su ficha. Las líneas discontinuas marcan los umbrales. Los puntos próximos se separan y se conectan a su posición real.', 'mat-lectura'));
    tarjeta.append(el('p', sub === 'doble' ? 'Un tema es material si supera al menos uno de los umbrales; la igualdad no lo supera.' : 'Los cuadrantes usan las medias de ambas variables. El relleno depende del total de la dimensión, no del cuadrante. La igualdad no supera el umbral.', 'mat-lectura'));
    mapa.append(tarjeta); raiz.append(mapa);

    const matriz = el('section', null, 'seccion mat-matriz');
    matriz.append(cabeza('Matriz', sub === 'doble' ? 'Dos dimensiones, una decisión por tema' : 'Las perspectivas detrás de cada puntaje', 'Los temas se ordenan de mayor a menor total. El punto dorado identifica los materiales; cada celda muestra su valor.'));
    const grupos = sub === 'impacto' ? data.grupos : data.evaluadores_financieros;
    const ordenadas = sub === 'doble' ? filas.map(f => ({...f,total:(f.impacto+f.financiera)/2})).sort((a,b) => b.total-a.total || a.id.localeCompare(b.id)) : sub === 'impacto' ? M.matrizGrupos(temas,cfg) : M.matrizEvaluadores(temas,cfg);
    const tabla = el('table'), head = el('thead'), tr = el('tr'), body = el('tbody'); tabla.id = 'mat-tabla';
    tabla.append(el('caption', sub === 'doble' ? 'Total de ordenación: promedio de impacto y financiera; la materialidad se decide por doble entrada.' : 'Importancia por ' + (sub === 'impacto' ? 'grupo de interés' : 'función evaluadora') + ' · Escala 0 a 5'));
    const columnas = ['Tema', ...(sub === 'doble' ? ['Impacto','Financiera','Cuadrante','Convergencia'] : [...grupos.map(g=>g.nombre),'Total'])];
    columnas.forEach(c => {const th = el('th',c); th.scope='col'; tr.append(th);}); head.append(tr);
    function celda(v) {const td = el('td', null, 'mat-calor mat-sem-' + semColor(v)); td.append(el('span', numero(v))); return td;}
    ordenadas.forEach(f => {
      const r = el('tr'), th = el('th'), a = linkTema(f.id); a.id='mat-fila-'+f.id; th.scope='row';
      if (material(f.id)) {const marca=el('span','●','mat-material-marca'); marca.setAttribute('aria-label','Material'); th.append(marca);}
      th.append(a); r.append(th);
      if (sub === 'doble') {
        r.append(celda(f.impacto),celda(f.financiera),el('td',cfg.cuadrantes.find(c=>c.id===f.cuadrante).etiqueta,'mat-calor mat-tono-'+(f.material?2:0)));
        const c=el('td','●'.repeat(f.convergencia)+'○'.repeat(3-f.convergencia)+` (${f.convergencia}/3)`,'mat-calor mat-tono-'+M.tonoCalor(f.convergencia,0,3)); r.append(c);
      } else r.append(...grupos.map(g=>celda(f.celdas[g.id])),celda(f.total));
      r.onclick = e => {if (!e.target?.closest?.('a')) location.hash=ruta(f.id);}; body.append(r);
    });
    tabla.append(head,body); const scroll=el('div',null,'mat-tabla-scroll'); scroll.tabIndex=0; scroll.setAttribute('role','region'); scroll.setAttribute('aria-label','Matriz de temas; desplazamiento horizontal disponible'); scroll.append(tabla); matriz.append(scroll);
    matriz.append(el('p',sub==='doble' ? 'Convergencia: cuántas de las tres variables —impacto, rentabilidad y gasto— superan su media del universo. No cambia la regla de materialidad.' : 'El total es el promedio simple de las columnas; todas las perspectivas tienen el mismo peso.','mat-lectura')); raiz.append(matriz);

    const resultados=el('section',null,'seccion mat-resultados'); resultados.id='mat-resultado'; resultados.tabIndex=-1;
    resultados.append(cabeza('Resultados',sub==='impacto' ? 'La materialidad de impacto se alimenta de la debida diligencia' : sub==='financiera' ? 'Los mayores efectos financieros orientan la atención' : 'De la lista corta a las acciones vinculadas','Compare los puntajes y abra una ficha para seguir el vínculo entre tema, riesgos, ejes y acciones.'));
    const ranking=el('div',null,'tarjeta mat-ranking'); ranking.append(el('h3','Ranking de temas'));
    function rankingDimension(dimension) {
      const bloque=el('div',null,'mat-ranking-dimension'); bloque.append(el('h4',dimension==='impacto'?'Importancia del impacto':'Materialidad financiera'),el('p',`Escala 0 a 5 · Línea vertical: umbral ${numero(limites[dimension])}`));
      M.ordenar(filas,dimension).forEach(f=>bloque.append(barra(linkTema(f.id),f[dimension],limites[dimension]))); ranking.append(bloque);
    }
    if(sub==='doble') {rankingDimension('impacto');rankingDimension('financiera');} else rankingDimension(sub);
    resultados.append(ranking);
    if(sub!=='doble') {
      const destacados=el('div',null,'rejilla tres mat-destacados');
      M.ordenar(filas,sub).slice(0,3).forEach(f=>{const c=el('article',null,'tarjeta'); const h=el('h3');h.append(linkTema(f.id));c.append(h,el('p',numero(f[sub])+' de 5','cifra'));if(sub==='impacto') c.append(el('h4','Riesgos en DDHH que lo sustentan'),riesgos(tema(f.id))); else sasb(tema(f.id),c);destacados.append(c);});resultados.append(destacados);
    } else {
      resultados.append(el('h3','Lista corta · '+cantidad+' temas materiales'));
      const corta=el('div',null,'rejilla tres mat-lista-corta');
      ['doble','impacto','financiera'].forEach((q,i)=>{const c=el('article',null,'tarjeta mat-columna');c.append(el('h4',['Doble','Solo impacto','Solo financiera'][i]));const lista=el('ul');M.listaCorta(temas,cfg).filter(f=>f.cuadrante===q).forEach(f=>{const li=el('li');li.append(linkTema(f.id));lista.append(li);});c.append(lista);corta.append(c);});resultados.append(corta,el('h3','Del tema material a la acción'));
      const acciones=el('div',null,'mat-cruces');
      M.listaCorta(temas,cfg).forEach(f=>{const c=el('article',null,'tarjeta mat-cruce'),h=el('h4');h.append(linkTema(f.id));c.append(h);const cruce=cruzar(tema(f.id));['riesgos','ejes','acciones'].forEach(k=>{const a=enlace(`${cruce[k].length} ${k} · Ver vínculos`,ruta(f.id));c.append(a);});acciones.append(c);});resultados.append(acciones);
    }
    raiz.append(resultados,el('p',nota,'nota'));
    if(!params.id || !tema(params.id)) {
      if (focoPendiente?.ruta === ruta()) {
        const id = focoPendiente.id; focoPendiente = null;
        window.queueMicrotask?.(() => document.getElementById('mat-fila-' + id)?.focus({preventScroll:true}));
      }
      return;
    }
    const t=tema(params.id), f=fila(t.id), pi=mi.find(p=>p.id===t.id), pf=mf.find(p=>p.id===t.id);
    const fondo=el('div',null,'fondo-dialogo centrado mat-fondo'),dialogo=el('section',null,'panel materialidad mat-ficha');
    dialogo.setAttribute('role','dialog');dialogo.setAttribute('aria-modal','true');dialogo.setAttribute('aria-labelledby','mat-titulo');
    const cerrar=el('button','Cerrar ×','cerrar mat-cerrar');cerrar.type='button';
    // Fila 1: tema material | dimensión ESG
    const f1=el('div',null,'mat-f1'), tit=el('div',null,'mat-f1-titulo'), titulo=el('h2',t.nombre); titulo.id='mat-titulo';
    tit.append(el('p',lectura[0]+' · Tema '+t.id.slice(-2),'antetitulo'),titulo,el('p',cuadrante(puntos.find(p=>p.id===t.id)),'mat-f1-cuadrante'));
    const esg=el('div',null,'mat-f1-esg'); esg.append(el('span','Dimensión ESG','mat-rotulo'),el('strong',t.dimension_esg.charAt(0).toUpperCase()+t.dimension_esg.slice(1)));
    f1.append(tit,esg);
    // Fila 2: variables de esta subpestaña con su calificación | riesgos DDHH y estándares relacionados
    const variables = sub==='impacto' ? [['Severidad',pi.y,'Promedio de escala, alcance e irremediabilidad'],['Probabilidad',pi.x,'Qué tan probable es que el impacto ocurra']]
      : sub==='financiera' ? [['Rentabilidad',pf.y,'Efecto en ingresos y márgenes'],['Gasto operativo',pf.x,'Efecto en costos de operación']]
      : [['Materialidad de impacto',f.impacto,'Umbral '+numero(limites.impacto)],['Materialidad financiera',f.financiera,'Umbral '+numero(limites.financiera)]];
    const f2=el('div',null,'mat-f2'), izq=el('div',null,'mat-vars');
    variables.forEach(([nombre,valor,ayuda])=>{const fila=el('div',null,'mat-var'),txt=el('div');txt.append(el('strong',nombre),el('span',ayuda,'mat-sub'));const cal=el('div',null,'mat-var-calif');cal.append(circulo(valor,true));fila.append(txt,cal);izq.append(fila);});
    const der=el('div',null,'mat-rel'), cruce=cruzar(t);
    const bR=el('section',null,'mat-rel-bloque'); bR.append(el('h3','Riesgos DDHH relacionados'));
    const ulR=el('ul',null,'mat-rel-riesgos');
    cruce.riesgos.forEach(r=>{const nivel=Riesgos.criticidad(r,datos.criticidad).nivel,li=el('li'),a=enlace('','#/ddhh/riesgos/'+r.id);a.append(el('span',r.id.slice(-2),'mat-num sem-'+({Alta:'rojo',Media:'ambar',Baja:'amarillo'}[nivel])),el('span',r.nombre));li.append(a);ulR.append(li);});
    if(!cruce.riesgos.length) ulR.append(el('li','Este tema se sustenta en los ejes de estándares; no tiene riesgos vinculados.','mat-vacio'));
    bR.append(ulR);
    const estandares=[...new Set([...cruce.ejes.flatMap(e=>datos.dimensiones?.ejes?.[e.id]?.estandares||[]),...(t.sasb?[typeof t.sasb==='string'?t.sasb:Object.values(t.sasb).join(' · ')]:[]),cfg.marco||'GRI 3: Temas Materiales 2021'])];
    const bE=el('section',null,'mat-rel-bloque'); bE.append(el('h3','Estándares relacionados'));
    const ulE=el('ul',null,'mat-vinetas'); estandares.forEach(x=>ulE.append(el('li',x))); bE.append(ulE);
    der.append(bR,bE); f2.append(izq,der);
    // Fila 3: dos cajas que despliegan su subficha
    const tituloCal = sub==='financiera' ? 'Calificación de las áreas miembro del comité' : sub==='doble' ? 'Calificación de los grupos de interés y de las áreas miembro del comité' : 'Calificación de los grupos de interés';
    const zona=el('div',null,'mat-subficha'); zona.hidden=true;
    // Tabla de calificación: primera columna = quién califica; demás columnas = calificaciones en círculo de semáforo.
    const tablaCal=(titulos,filasT)=>{const tb=el('table',null,'mat-tabla-sub mat-tabla-cal'),th=el('thead'),tr=el('tr');titulos.forEach(x=>{const c=el('th',x);c.scope='col';tr.append(c);});th.append(tr);tb.append(th);const body=el('tbody');filasT.forEach(([n,...vs])=>{const r=el('tr'),h=el('th',n);h.scope='row';r.append(h);vs.forEach(v=>{const td=el('td',null,'mat-tabla-c');td.append(circulo(v));r.append(td);});body.append(r);});tb.append(body);return tb;};
    const pg=M.porGrupo(t,cfg);
    const filasGrupos=data.grupos.map(g=>{const ev=t.evaluacion_impacto[g.id],sev=M.severidad(ev,cfg);return [g.nombre,sev,ev.probabilidad,pg[g.id]];});
    const evals=data.evaluadores_financieros.map(e=>{const x=t.evaluacion_financiera[e.id];return [e.nombre,x.rentabilidad,x.gasto_operativo,(x.rentabilidad+x.gasto_operativo)/2];});
    const subfichas={
      calificacion:()=>{const s=el('section');s.append(el('h3',tituloCal,'mat-sub-titulo'));
        if(sub!=='financiera') s.append(tablaCal(['Grupo de interés','Calificación severidad','Calificación probabilidad','Calificación promedio'],filasGrupos));
        if(sub!=='impacto') s.append(tablaCal(['Áreas miembro del comité','Calificación rentabilidad','Calificación gasto operativo','Calificación promedio'],evals));
        s.append(el('p',sub==='impacto'?'Severidad: promedio de escala, alcance e irremediabilidad que asignó cada grupo. Promedio: importancia del impacto (promedio de severidad y probabilidad).':sub==='financiera'?'Promedio: efecto financiero que asignó cada área (promedio de rentabilidad y gasto operativo).':'Impacto según los grupos de interés y efecto financiero según el comité.','nota mat-sub-nota'));return s;},
      plan:()=>{const s=el('section');s.append(el('h3','Relación con el plan de acción','mat-sub-titulo'));
        const tb=el('table',null,'mat-tabla-sub mat-tabla-plan'),th=el('thead'),tr=el('tr');['Acción','Estado','% de avance'].forEach(x=>{const c=el('th',x);c.scope='col';tr.append(c);});th.append(tr);tb.append(th);
        const body=el('tbody');
        if(!cruce.acciones.length){const r=el('tr'),td=el('td','Sin acciones vinculadas.');td.colSpan=3;r.append(td);body.append(r);}
        cruce.acciones.forEach(a=>{const r=el('tr'),h=el('th');h.scope='row';h.append(enlace(a.titulo,'#/plan?accion='+encodeURIComponent(a.id)));
          const est=el('td',null,'mat-estado');est.append(el('span',a.estado.replace(/-/g,' '),'mat-chip-estado estado-'+a.estado));
          const av=el('td',null,'mat-avance'),pista=el('span',null,'mat-avance-pista'),rel=el('span',null,'mat-avance-relleno');rel.style.width=(a.avance||0)+'%';pista.append(rel);av.append(el('strong',numero(a.avance||0)+' %'),pista);
          r.append(h,est,av);body.append(r);});
        tb.append(body);s.append(tb);return s;}
    };
    const f3=el('div',null,'mat-f3');
    const botones=[['calificacion',tituloCal,(sub==='financiera'?evals.length+' áreas del comité':sub==='doble'?data.grupos.length+' grupos · '+evals.length+' áreas del comité':data.grupos.length+' grupos de interés')],['plan','Relación con el plan de acción',cruce.acciones.length+(cruce.acciones.length===1?' acción vinculada':' acciones vinculadas')]].map(([clave,texto,meta])=>{
      const b=el('button',null,'mat-boton-sub');b.type='button';b.setAttribute('aria-expanded','false');b.dataset.sub=clave;
      const ver=el('span','Ver','mat-ver');b.verRotulo=ver;b.append(el('strong',texto),el('span',meta,'mat-sub'),ver);
      b.onclick=()=>{const abierto=b.getAttribute('aria-expanded')==='true';botones.forEach(o=>{o.setAttribute('aria-expanded','false');o.verRotulo.textContent='Ver';});
        if(abierto){zona.hidden=true;zona.replaceChildren();return;}
        b.setAttribute('aria-expanded','true');b.verRotulo.textContent='Ocultar';zona.replaceChildren(subfichas[clave]());zona.hidden=false;};
      f3.append(b);return b;});
    dialogo.append(cerrar,f1,f2,f3,zona);
    fondo.addEventListener('click',e=>{if(e.target===fondo)cerrar.onclick();});
    const anterior=document.activeElement,regiones=[...document.querySelectorAll('body > header, body > main, body > footer, body > .saltar')],inertes=regiones.map(n=>n.inert);
    regiones.forEach(n=>{n.inert=true;});fondo.append(dialogo);document.body.append(fondo);document.body.classList.add('dialogo-abierto');cerrar.focus();
    let limpio=false;
    function limpiar() {if(limpio)return;limpio=true;document.removeEventListener('keydown',teclado);regiones.forEach((n,i)=>{n.inert=inertes[i];});fondo.remove();document.body.classList.remove('dialogo-abierto');(document.getElementById('mat-fila-'+t.id)||anterior)?.focus();}
    cerrar.onclick=()=>{focoPendiente={ruta:ruta(),id:t.id};limpiar();location.hash=ruta();};
    function teclado(e) {if(e.key==='Escape'){e.preventDefault();cerrar.onclick();}if(e.key==='Tab'){const focos=[...dialogo.querySelectorAll('button, a[href]')],primero=focos[0],ultimo=focos.at(-1);if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}}}
    document.addEventListener('keydown',teclado);return limpiar;
  }
  [['materialidad-impacto','impacto'],['materialidad-financiera','financiera'],['materialidad','doble']].forEach(([nombre,sub])=>App.registrarVista(nombre,{render:(contenedor,datos,params)=>render(contenedor,datos,params,sub)}));
}());
