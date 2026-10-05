# E12 · Metodología, resultados y pruebas del recorrido

Entrega del 5 de octubre de 2026. Se retomó el trabajo parcial del último commit: la metodología ya tenía contenido; resultados y estilos solo tenían un comentario. Se conservó la metodología y se completó su presentación, la vista de resultados y las pruebas autorizadas. Sin red, commit ni push.

## 1. Archivos tocados por esta ejecución

- `public/vista-metodologia.js`: se conservan contenido, agrupaciones y lectura de configuración; se incorpora un contenedor desplazable por teclado al diagrama.
- `public/vista-resultados.js`: capítulo completo y evidencia calculada en cada render.
- `public/estilos-relato.css`: presentación de ambos capítulos, distribución adaptable y gráficos legibles.
- `tests/plan.test.mjs`: DOM simulado actualizado para nodos de texto, cabecera de empresa y seis capítulos. Se conservan verificaciones de persistencia, respaldo, espera agotada, escritura completa, memoria y listas.
- `tests/recorrido-e10.test.mjs`: capítulos 01–06, selección, anterior/siguiente, parámetros, rutas de materialidad, errores opcionales y portada del caso con cuatro cifras y destinos.
- `tests/identidad-e11.test.mjs`: contraste sobre los valores efectivos de ambos temas, incluida la herencia CSS; reconocimiento de espacios y `!important` en los selectores de logos. Se conserva AA y la comprobación de cuatro PNG y Lato.
- `tests/relato.test.mjs`: seis pruebas nuevas con DOM simulado, rutas, configuración, cálculos, cambios de datos, accesibilidad y orden de scripts.
- `docs/interfaz-e12.md`: este informe.

`tests/e6-vistas.test.mjs` ya pasa y se conserva intacto. No se modificaron `vista-estandares.js`, pruebas de dimensiones/estándares, archivos de materialidad, armazón, datos ni configuración. Los cambios concurrentes que aparecen en el estado de Git de esos archivos pertenecen a otros agentes.

## 2. Decisiones de diseño

### Capítulo 02 · ¿Cómo se hizo y con qué rigor?

Se conserva el enfoque como párrafo de 1,35 rem y ancho máximo de 720 px. El flujo tiene cuatro nodos y cinco flechas: brechas y riesgos alimentan materialidad, y los tres análisis alimentan el plan. Su tamaño mínimo mantiene los rótulos legibles; en pantallas estrechas se puede desplazar con teclado.

La línea de cinco fases reutiliza punto, filete y numeral de la cadena del capítulo 01; pasa a vertical bajo 900 px. Los ocho estándares se organizan en los tres grupos pedidos, con sus usos explícitos. Las cuatro actividades reutilizan `.dato`. Las tres reglas visuales leen niveles, cortes y explicación del umbral de los datos y la configuración, con alternativa si falta materialidad. Se mantiene una nota discreta sobre el carácter demostrativo.

### Capítulo 03 · ¿Qué encontramos?

Una única banda `.pregunta` abre el capítulo. Los cuatro mensajes del caso alternan texto y evidencia en escritorio; en móvil mantienen primero el relato y después el gráfico. Cada bloque enlaza a su detalle. No se repite el `h1` del armazón. El cierre ofrece los capítulos 04, 05, 06 y volver al caso.

- **Estándares:** se ordenan por fecha las evaluaciones reales (`fuente` o `cargada`), excluyendo ejemplos. Las dos barras promedian los ejes OCDE y DDHH; el máximo y umbral salen de configuración. Se muestran las tres dimensiones de menor puntaje.
- **Riesgos:** se usa `Riesgos.ubicar`, que selecciona la evaluación dominante. Se cuentan **17 riesgos ubicados y uno sin probabilidad**, visible fuera de la matriz y conservado en el total. El color expresa gravedad, no un producto inventado entre gravedad y probabilidad. La barra distribuye **5 riesgos solo de operación propia y 13 con algún ámbito en cadena de valor**, sin doble conteo.
- **Materialidad:** puntos calculados con `Materialidad.clasificar`, líneas discontinuas con `Materialidad.umbrales` y lista numerada con `Materialidad.listaCorta`: **9 temas**. Puntos rellenos en `--principal` para los materiales; huecos para los demás. Si faltan datos o configuración, se muestra preparación sin romper el capítulo.
- **Plan:** anillo SVG estático con `stroke-dasharray`, promedio de `Plan.resumen`, conteos por estado y vencidas respecto de la fecha local del navegador. Usa `App.obtenerPlan()` para reflejar el plan vigente. La nota final declara materialidad ilustrativa y seguimiento de ejemplo cuando corresponde.

Todos los gráficos tienen nombre accesible con la evidencia equivalente, coma decimal, colores por tokens y texto de al menos 14 px al tamaño mínimo de representación. Las regiones de evidencia admiten foco para permitir desplazamiento horizontal en pantallas estrechas. No se introducen animaciones de entrada, dependencias ni inserción de datos con `innerHTML`.

## 3. Validación

Salida de la última ejecución completa de `npm test`:

```text
ℹ tests 107
ℹ suites 0
ℹ pass 105
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Las seis pruebas de `tests/relato.test.mjs` pasan. Cubren nueve rutas válidas, tres redirecciones heredadas, ids inexistentes, ruta desconocida, estructura de metodología, cambios de configuración, cuatro mensajes, suma de la matriz, lista corta, avance global, datos ausentes, exclusión de evaluaciones de ejemplo y orden de scripts. Se verifican también etiquetas accesibles y tamaños de texto de los SVG.

Fallos pendientes, sin omitir ni desactivar pruebas:

1. **`tests/identidad-e11.test.mjs` — «E11 diámetro >=420, ejes >=13 y anillos >=11 con cajas de etiquetas sin superposición».** La prueba de dimensiones intenta extraer `min-width:(\d+)px` del CSS anterior. La nueva vista usa `.dim-arana { width: 100%; height: auto; ... }`, por lo que la búsqueda no encuentra coincidencia y falla al acceder a `[1]`. Se deja intacta por la prohibición expresa de tocar pruebas de estándares/dimensiones. El responsable de esa vista debe adaptar la validación de tamaño a su nueva geometría y diseño adaptable, conservando legibilidad y separación.
2. **`tests/vista-riesgos.test.mjs:66` — «index carga scripts locales diferidos y en orden válido».** La lista esperada antigua omite `vista-caso.js`, `vista-metodologia.js` y `vista-resultados.js`. Este archivo no figura entre los permitidos, aunque el encargo menciona reparar esa prueba. No se modifica. La prueba equivalente actualizada en `tests/relato.test.mjs` sí verifica y aprueba la lista completa, archivos existentes y `defer`.

Las pruebas actuales de E13 y E14 en sus archivos separados pasan en esta ejecución; el resultado puede variar con trabajo concurrente posterior. La comprobación de contraste conserva 4,5:1 para texto y 3:1 para señales SVG; se calculan los valores desde `estilos.css`, sin sustituir la exigencia por valores fijos ni saltar pares.

No se realizó inspección visual en navegador: no había herramienta de navegador disponible. La validación de presentación se limita a revisión del CSS/SVG y pruebas de DOM simulado; no se afirma haber comprobado píxeles o capturas. No se generaron artefactos de graphify, ya que no había un grafo existente y construirlo escribiría fuera de la lista autorizada.

## 4. Armazón y dependencias pendientes

No se detectaron errores funcionales de `app.js` en las rutas, carga, persistencia o navegación verificadas. No se necesita modificar el armazón para los capítulos entregados.

Para dejar la suite completa en verde quedan las dos adaptaciones de pruebas descritas arriba: una pertenece a dimensiones y la otra está fuera de la lista de archivos autorizados. No son fallos de las nuevas vistas ni se han ocultado con exclusiones.
