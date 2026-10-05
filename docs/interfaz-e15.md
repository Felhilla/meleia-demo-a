# E15 · Metodología, versión 2

Implementado en `main`, sin acceso a la red, commit ni push.

## Archivos tocados

- `public/vista-metodologia.js`: enfoque conectado, fichas de estándares y actividades, escalas verticales y procedimiento de riesgos.
- `public/estilos-relato.css`: estilos del capítulo 02, adaptación móvil y movimiento reducido. Se mantienen las reglas del capítulo 03.
- `public/vista-caso.js`: únicamente cuatro entradas en `ICONOS` (`personas`, `empresas`, `encuesta`, `taller`) y sus encuadres.
- `tests/relato.test.mjs`: pruebas ampliadas y soporte de eventos y foco en el DOM simulado.
- `docs/interfaz-e15.md`: este informe.

La modificación previa de `public/img/estandares/sasb.jpg` se conservó; no forma parte de este trabajo.

## Decisiones de diseño

- El enfoque ocupa una tarjeta única: párrafo a 1,3 rem y ancho completo; debajo, lista y SVG en dos columnas. Los cuatro pasos comparten número, destino y resaltado bidireccional por puntero o foco. Las cinco flechas representan las conexiones pedidas.
- Se conservan las cinco fases y los tres grupos de referencias. Los estándares usan cuatro columnas en escritorio, portada 3:4, nombre limitado visualmente a dos líneas y marcas de uso. Las fichas muestran el nombre completo y permiten cambiar a los estándares citados mediante detección de siglas con límites de palabra.
- Las actividades reproducen la geometría del componente `.hecho` mediante clases propias: círculo sobresaliente, cifra y etiqueta a 1,02 rem, en una rejilla de dos por dos. Sus detalles se consultan en fichas.
- Las fichas tienen nombre accesible, modalidad, foco inicial, ciclo de Tab y Mayús+Tab, cierre con Escape, botón o fondo y retorno al control original, incluso después de navegar entre estándares. El fondo queda inerte; la limpieza al cambiar de vista elimina el diálogo y sus eventos.
- Brechas y materialidad se presentan de 5 a 0, uniendo los niveles del caso con las descripciones de configuración por valor. Riesgos se explica en cuatro pasos: parámetros, promedio y cortes, probabilidad y vinculación. Los cortes de la banda y el cálculo visual del ejemplo se leen de la configuración y de `Riesgos.criticidad`; no están fijados en la vista. El párrafo del ejemplo procede del contenido del encargo.
- El esquema de materialidad coloca impacto sobre el umbral en la fila superior y efecto financiero sobre el umbral en la columna derecha; cada celda incorpora la etiqueta configurada y una explicación.
- Los colores usan los tokens existentes. Los números blancos sobre rojo, naranja y verde superan 3:1 (aproximadamente 4,92; 3,08 y 3,63). Las celdas ámbar, amarillas y grises usan `--texto` en claro y `--sobre-principal` en oscuro: esta excepción evita que el texto claro del tema oscuro pierda contraste sobre esos fondos. Las descripciones conservan `--texto` sobre los fondos suaves del semáforo.
- Por debajo de 768 px, las rejillas pasan a una columna y las filas de gravedad se convierten en tarjetas con etiquetas. Los controles mantienen la navegación por teclado; las transiciones se desactivan con movimiento reducido. No se agregaron animaciones de carga.
- Todo el contenido se construye mediante nodos y texto, sin `innerHTML` con datos. Se usa formato decimal es-CO.

## Verificación

`npm test` ejecutó la suite completa:

```text
ℹ tests 111
ℹ suites 0
ℹ pass 111
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Incluye anonimización, rutas, resultados generales, datos y cálculos existentes. Las pruebas de metodología verifican cuatro pasos y nodos enlazados, resaltado bidireccional, ocho portadas locales, relaciones de OCDE, cambio de ficha, Escape, ciclo y retorno del foco, cuatro actividades completas, filas y colores de las escalas, parámetros de gravedad, cortes configurables, cuadrantes y cálculo del ejemplo al modificar los datos. Se comprueba también el contraste mínimo de los números sobre los colores del semáforo. `git diff --check` no reporta errores.

## No verificado en navegador

No se ejecutó un navegador real: no hay herramienta de navegador disponible en esta sesión. Quedan pendientes la inspección visual en escritorio y móvil, recorte de portadas, tipografía, ausencia de desbordamientos, aspecto en claro y oscuro, interacción real con puntero y teclado, lector de pantalla y preferencia de movimiento reducido. Las pruebas de diálogo utilizan un DOM simulado; no sustituyen esa revisión. La comprobación numérica de los colores del semáforo tampoco equivale a una auditoría visual completa de contraste AA.
