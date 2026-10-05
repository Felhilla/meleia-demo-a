# Doble materialidad · E9

La vista presenta primero el resultado y después el proceso: 15 temas, 9 materiales y 6 no materiales calculados desde el universo actual. La documentación E8 describe una versión anterior de los datos; no se codifican sus cifras. El encabezado conserva «Paso 2 de 4»; `app.js` agrega el enlace Siguiente.

## Diseño y contratos

Matriz SVG propia con X impacto e Y financiera (0–5), cuadrantes y etiquetas de configuración, cortes discontinuos y números de tema. Su ancho es el disponible hasta 1000 px; en escritorio supera 560 px. Cada punto tiene nombre y puntajes accesibles, detalle visible al enfocarlo o señalarlo, título con posición real y activación por clic, Enter o espacio. La tabla equivalente incluye 15 filas sin filtros, convergencia escrita y riesgos vinculados.

`posicionesMatriz(clasificados, ancho, alto, margen)` devuelve filas con `x`, `y`, `realX`, `realY`. Ordena por id y busca una posición en anillos de 15 px hasta preservar una distancia mínima de 14 px entre centros; limita las coordenadas al área y rechaza un área insuficiente. Los filtros se aplican después de ubicar todo el universo para conservar posiciones. No cambia datos ni calificaciones.

`resumen(temas, cfg)` devuelve `evaluados`, `materiales`, `noMateriales`, `porCuadrante` y `umbrales`. `filtrar` combina `cuadrante`, `dimension` y `materiales` (true, «1» o «true»). `ordenar` copia y ordena por impacto o financiera descendente, con desempate por id. Solo se agregaron funciones y sus exportaciones al módulo puro; las funciones anteriores permanecen intactas.

Los parámetros URL son `cuadrante`, `dimension`, `materiales=1`, `orden=impacto|financiera` y `etapa=1…6`. Abrir o cerrar una ficha conserva la consulta. Los filtros no alteran los umbrales ni la lista corta global.

Las seis etapas leen sus títulos y descripciones de la configuración. Tienen semántica de pestañas y navegación por flechas, Inicio y Fin. Incluyen fuentes y lista corta resaltada, grupos y mapa de calor, desglose del impacto y riesgos, desglose financiero por función, explicación del umbral/convergencia y cruce de temas materiales con riesgos, ejes y acciones. El mapa de calor mezcla fondo y principal; cada puntaje lleva un respaldo opaco del fondo para mantener el contraste del texto independientemente de la intensidad.

La ficha usa `Materialidad.cruce` y `App.obtenerPlan()` síncrono en cada render. Los puntajes de ejes proceden de la evaluación más reciente por fecha e id. El diálogo contiene el foco, cierra con Escape, restaura el estado inerte previo y libera eventos al salir. Los enlaces de riesgo, eje y acción llevan directamente a las rutas existentes.

Se usan nodos DOM y texto, sin HTML interpolado, bibliotecas, red ni persistencia nueva. Los colores dependen exclusivamente de los diez tokens existentes. Bajo 768 px las tablas se presentan como registros y el resto como una columna. Apertura de ficha y cambios de etapa usan 180 ms ease-out, solo opacidad y transformación, desactivados con movimiento reducido. La matriz respeta esa preferencia al desplazarse desde la etapa 5.

## Verificación

`npm test`: 86 pruebas, 86 aprobadas, 0 fallos, 0 omitidas; incluye anonimización y las pruebas de E11 presentes durante la ejecución. Ocho pruebas nuevas cubren geometría, pureza, conteos, filtros, ordenación y render con DOM simulado: matriz, 15 filas, seis etapas, ficha tema-03 con riesgo-05 y acciones, lectura del plan vivo, Escape, contención de foco, limpieza, teclado de puntos y carga sin datos. Sintaxis JavaScript y `git diff --check` correctos.

No se verificaron visualmente los anchos 1280–1920 y móvil, el contraste renderizado de ambos temas, la lectura con tecnología de asistencia ni las animaciones en un navegador real. El DOM simulado no sustituye esa comprobación.

Archivos del encargo: `public/vista-materialidad.js`, `public/estilos-materialidad.css`, `public/materialidad.js`, `tests/vista-materialidad.test.mjs` y este documento. Sin commit, push ni acceso a red. No se modificaron los archivos asignados a E11.
