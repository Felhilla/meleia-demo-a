# E14 · Doble materialidad en tres subpestañas

## Archivos y recuperación del trabajo parcial

Se revisaron los cinco archivos autorizados. En esta continuación se modificaron:

- `public/vista-materialidad.js`: restauración del foco después del nuevo render del armazón al cerrar una ficha; identificación de la evaluación de ejemplo en los puntajes de ejes.
- `tests/vista-materialidad.test.mjs`: adaptación del DOM simulado a las tres rutas actuales y ampliación de verificaciones.
- `docs/interfaz-e14.md`: este informe.

Se conservaron sin cambios `public/materialidad.js` y `public/estilos-materialidad.css`: ya incluían las funciones puras y los estilos solicitados. No se modificaron archivos fuera de la lista, incluida `vista-estandares.js`. Sin commit, push ni acceso a red. Los cambios concurrentes de otros agentes no forman parte de esta entrega.

## Decisiones de diseño y cálculo

Las vistas `materialidad-impacto`, `materialidad-financiera` y `materialidad` comparten la secuencia titular calculado → mapa → matriz → resultados, con las secciones, tarjetas, espaciado y tokens del capítulo 01. El armazón aporta el título del capítulo y las subpestañas. Hay una sola nota ilustrativa al pie.

Los mapas de impacto y financiera usan medias del universo para sus cortes geométricos. El relleno de cada punto depende de superar estrictamente el umbral de la dimensión, que puede configurarse como fijo. Doble aplica la regla de entrada por cualquiera de las dos dimensiones. Los puntos numerados conservan coordenadas reales mediante conectores cuando se desplazan para evitar superposición; las etiquetas de cuadrante quedan fuera del área de puntos. El SVG tiene altura mínima de 560 px y desplazamiento horizontal en pantallas pequeñas.

Las tablas muestran números con coma decimal y cinco tonos, ordenadas por total descendente. Impacto tiene seis grupos y financiera cinco funciones evaluadoras, más total. Doble muestra impacto, financiera, cuadrante y convergencia; se ordena por el promedio de ambas dimensiones sin usar ese promedio para decidir materialidad. Sus resultados mantienen dos rankings con sus respectivos umbrales, evitando introducir un umbral combinado que la metodología no define.

Los datos actuales producen 9 materiales: 4 dobles, 3 solo por impacto y 2 solo financieros. La referencia histórica `docs/datos-e8.md` aún describe 8; se respetan los datos actuales y no se modifica esa documentación ajena al encargo.

Impacto destaca los tres primeros temas con sus riesgos en DDHH. Financiera incluye referencias SASB cuando existen. Doble presenta tres columnas de lista corta y conteos enlazados a la ficha con riesgos, ejes y acciones. La ficha consulta el plan vivo mediante `App.obtenerPlan()`, muestra puntajes de la evaluación más reciente con fecha y señala cuando es de ejemplo. Incluye barras y umbrales, enlaces a las rutas actuales, Escape, contención de Tab/Mayús+Tab y fondo inerte. Al cerrar, el foco vuelve a la fila del tema después de que el armazón reconstruye el contenido.

Se conserva la API pura añadida: `mapaImpacto` y `mapaFinanciero` devuelven arreglos con propiedad `.umbrales = {x, y}`; `matrizGrupos` y `matrizEvaluadores`, filas `{id, celdas, total}`; `tonoCalor`, índices acotados de 0 a 4. No se cambian fórmulas preexistentes.

## Verificación

Las 14 pruebas de `tests/vista-materialidad.test.mjs` pasan. Se conservan las verificaciones previas de posiciones, resumen, filtros puros, ordenación y ausencia de mutaciones. Se sustituyen expectativas de seis etapas y rutas antiguas por las tres subpestañas del encargo. Se comprueban promedios de variables y celdas con cálculos independientes, umbrales medios y fijos, igualdad estricta, límites del calor, orden de las tres tablas, 15 puntos separados, navegación con Enter/espacio, filas clicables, rankings, 9 materiales en tres columnas y destacados. La ficha tema-03 se verifica en las tres rutas: riesgo-05, sus ejes, acciones del plan vivo, barras, Escape, foco y limpieza.

Salida de la última ejecución de `npm test` (código de salida 1):

```text
ℹ tests 94
ℹ suites 0
ℹ pass 80
ℹ fail 14
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Fallos fuera de E14, conservados para coordinación:

| Archivo y líneas de prueba | Fallos | Ámbito y evidencia |
|---|---:|---|
| `tests/plan.test.mjs`: 85, 89, 97, 102, 138 | 5 | Integración del armazón (E12): el DOM simulado falla al leer `textContent` en su inicialización, línea 81. Afecta carga, guardado, errores y lista numerada. |
| `tests/recorrido-e10.test.mjs`: 32, 41, 52, 63, 73 | 5 | Recorrido y portada antiguos (E12): elementos ausentes en el DOM simulado y expectativa anterior a la redirección de materialidad hacia `#/materialidad/doble/tema-01`. |
| `tests/vista-riesgos.test.mjs`: 66 | 1 | Carga del armazón (E12): la lista esperada de scripts no incluye caso, metodología ni resultados. |
| `tests/identidad-e11.test.mjs`: 15, 24 | 2 | Identidad compartida: token `secundario` y expectativas de fuentes, PNG y logos. Fuera de E14; requieren revisión del responsable del armazón/identidad. |
| `tests/identidad-e11.test.mjs`: 70 | 1 | Expectativa de la vista de estándares anterior (ámbito E13/reescritura indicada por el usuario): la búsqueda de geometría devuelve `undefined`. No se tocó la vista. |

La asignación anterior identifica ámbitos, no atribuye a otros agentes la causa de los fallos. La salida completa de esta ejecución está en `/tmp/e14-npm-test.log` (archivo temporal local).

Contraste calculado con los tokens actuales y las mezclas sRGB del CSS, tonos 0 a 4: claro **12,41 / 11,45 / 10,55 / 6,14 / 7,73**; oscuro **14,99 / 12,82 / 10,65 / 9,50 / 11,15**. Todos superan 4,5:1 para texto normal. `git diff --check` no detecta errores de espacios.

## No verificado en navegador

No se ejecutó un navegador real. Pendientes de revisión visual: composición a 1440 px y en móvil, ajuste tipográfico de etiquetas, desplazamiento horizontal, temas claro/oscuro, transición con movimiento reducido, lector de pantalla y comportamiento del foco con el enrutador real. Las pruebas DOM y el cálculo de contraste no sustituyen esa revisión.
