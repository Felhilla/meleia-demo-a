# Sistema de diseño y relato · GH Studio × Meleia

**Referencia visual obligatoria:** el capítulo 01 (`public/vista-caso.js` + la sección «Capítulo 01» de `public/estilos.css`). Todo capítulo nuevo debe verse como parte del mismo informe: mismo aire, misma jerarquía, mismos componentes.

## Principios
1. **Relato antes que datos.** Cada pantalla responde a una pregunta y empieza por la conclusión: un titular en lenguaje de decisión («El riesgo está en la cadena de valor»), luego la evidencia (gráfico o cifra) y al final el detalle (tablas, fichas).
2. **Aire, ritmo y señal** (Meleia).
   - **Aire:** secciones separadas con `.seccion` (112 px); ancho de lectura de 720 px como máximo para el texto.
   - **Ritmo:** cada sección usa `.seccion-cabeza`: un antetítulo (`.antetitulo`, en dorado y mayúsculas), un `h2` con la idea y un párrafo de contexto a la derecha.
   - **Señal:** el dorado (`--oro`) solo para lo que importa; nada neón ni pesado.
3. **Una idea por bloque.** Nada de tarjetas con diez etiquetas. Como máximo una etiqueta de estado por elemento. Los detalles largos van a una ficha lateral (`.panel`) o a un `<details>`.
4. **Los gráficos explican; no decoran.** Cada gráfico lleva:
   - un titular que dice qué muestra,
   - los ejes rotulados una sola vez,
   - los valores escritos donde importan (coma decimal, es-CO),
   - y una lectura breve («Cómo leerlo»).

## Tokens (en `public/estilos.css`; no inventes colores)
| Uso | Token |
|---|---|
| Texto principal | `--texto` |
| Texto secundario | `--texto-suave` |
| Fondo | `--fondo` (Ivory) |
| Fondo alterno de bandas | `--fondo-alterno` (Sand) |
| Tarjetas | `--superficie` |
| Bordes | `--borde`, `--borde-fuerte` |
| Marca y cifras | `--principal` (Forest) |
| Acento | `--oro` (Gold; nunca como texto pequeño) |
| Dorado legible como texto | `--oro-texto` |
| Superficies suaves | `--suave` (Sage), `--secundario` (Blue) |
| Criticidad | `--alta`, `--media`, `--baja` y sus `-fondo` |

Más: espaciado `--e1` a `--e8`; radios `--radio` y `--radio-chico`; sombras `--sombra` y `--sombra-alta`; curva `--ease-out`.

Escala tipográfica: `--t-display`, `--t-h1`, `--t-h2`, `--t-h3`, `--t-cuerpo`, `--t-chico` y `--t-micro`. Fuente: Lato (400 y 700). Cifras grandes con `.cifra` + `.cifra-etiqueta`.

Todo debe funcionar en tema claro y oscuro (los tokens ya cambian). En SVG usa `var(--token)` en `fill` y `stroke`.

## Componentes disponibles
- **Estructura y texto:**
  - `.seccion`, `.seccion-cabeza`, `.antetitulo`
  - `.tarjeta` (superficie con borde y sombra)
  - `.rejilla.dos`, `.rejilla.tres`, `.rejilla.cuatro`
- **Cifras:** `.cifra`, `.cifra-etiqueta`, `.dato` (cifra con filete dorado arriba), `.numeral` (01, 02… en dorado)
- **Controles y estado:**
  - `.boton`, `.boton.secundario`
  - `.chip`, `.aviso` (etiqueta pequeña), `.nota`
  - `.criticidad.alta`, `.criticidad.media`, `.criticidad.baja`
- **Detalle y bandas:**
  - `.panel` dentro de `.fondo-dialogo` (ficha lateral, con `role="dialog"`, Esc y foco)
  - `.pregunta` (banda Forest para una idea fuerza; úsala con moderación: una por capítulo como máximo)
  - `.en-preparacion`

Si necesitas un componente nuevo, créalo en el CSS de tu capítulo, con tokens y con el mismo radio, sombra y espaciado.

## Armazón (ya existe en `app.js`)
- **Capítulos:** 01 El caso · 02 Metodología · 03 Resultados generales · 04 Debida diligencia en DDHH (Resultados por dimensión | Riesgos identificados) · 05 Doble materialidad (Impacto | Financiera | Doble) · 06 Plan de acción. Los textos están en `data/caso.json` → `capitulos`.
- **Lo que pone el armazón:** el encabezado del capítulo (antetítulo, `h1`, bajada y subpestañas) y la navegación «Anterior/Siguiente». **Tu vista no debe repetir el `h1` ni el título del capítulo:** empieza directamente con la primera `.seccion`.
- **Registro de vistas:** `App.registrarVista(nombre, {render(contenedor, datos, params)})`.
  - Nombres: `caso`, `metodologia`, `resultados`, `estandares` (dimensiones), `riesgos`, `materialidad-impacto`, `materialidad-financiera`, `materialidad` (doble) y `plan`.
  - `params`: `{id, sub, capitulo, filtros: URLSearchParams}`.
- **Rutas:**
  - `#/`, `#/metodologia`, `#/resultados`
  - `#/ddhh/dimensiones[?eje=…]`, `#/ddhh/riesgos[/riesgo-xx]`
  - `#/materialidad/{impacto|financiera|doble}[/tema-xx]`
  - `#/plan[?accion=…]`

  Las direcciones antiguas se redirigen (`App.resolverRuta`).
- **No uses anclas `#id` para desplazarte:** el enrutador usa el hash. Usa `scrollIntoView` con `prefers-reduced-motion`.

## Movimiento
- Solo `transform` y `opacity`.
- Duraciones: 150 ms para presionar; 200 a 240 ms para paneles.
- Curva `var(--ease-out)`.
- Escala 0,97 al presionar.
- Hover solo con `@media (hover: hover) and (pointer: fine)`.
- Nada de animaciones al cargar ni en cada render; todo desactivado con `prefers-reduced-motion`.

## Contenido
- Español claro, sin jerga técnica («id», «null», «JSON»). Decimales con coma (`App.numero`).
- Todo lo ilustrativo se declara una vez por capítulo, de forma discreta (`.nota`); no hace falta repetirlo en cada elemento.
- **Seguridad:** sin `innerHTML` con datos; usa `App.el` o `textContent`.
- **Anonimización:** ningún término de `privado/anonimizacion.json` (lo verifica `tests/anonimizacion.test.mjs`).
