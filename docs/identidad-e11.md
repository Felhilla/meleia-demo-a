# Identidad E11 · GH Studio × Meleia

Implementación local, sin red, commit ni push. Solo se modificaron archivos autorizados. Los cambios concurrentes de E9 en materialidad no forman parte de E11.

## Archivos

- public/estilos.css, public/estilos-estandares.css y public/estilos-plan.css.
- public/index.html.
- public/app.js: únicamente selección y persistencia de tema; eliminación de la selección anterior.
- public/vista-estandares.js: geometría de etiquetas y colores de umbral en la presentación.
- public/img/logo-gh-color.png, logo-gh-blanco.png, logo-meleia-color.png y logo-meleia-blanco.png; eliminado el antiguo logo-gh.png sin referencias.
- tests/identidad-e11.test.mjs y este documento.

## Tokens

| Token | Claro | Oscuro |
| --- | --- | --- |
| `--principal` | `#2F5548` | `#B8D6C6` |
| `--secundario` | `#DCE7EB` | `#DCE7EB` |
| `--acento` | `#C9B789` | `#C9B789` |
| `--fondo` | `#F8F6F1` | `#101F19` |
| `--superficie` | `#FFFFFF` | `#1B3027` |
| `--suave` | `#DCE7DE` | `#294136` |
| `--borde` | `#C4BDAF` | `#587064` |
| `--texto` | `#243C32` | `#F8F6F1` |
| `--texto-suave` | `#506257` | `#C6D3C9` |
| `--alta` | `#884A36` | `#E8B49E` |
| `--media` | `#72591F` | `#DEC98F` |
| `--baja` | `#2F5548` | `#B8D6C6` |
| `--alta-fondo` | `#F3E3DB` | `#432C24` |
| `--media-fondo` | `#EFEAE1` | `#383321` |
| `--baja-fondo` | `#DCE7DE` | `#294136` |
| `--linea` | `#77877D` | `#8DA397` |
| `--sobre-principal` | `#FFFFFF` | `#101F19` |
| `--oro` | `#C9B789` | `#C9B789` |
| `--terra` | `#D9A58F` | `#D9A58F` |

El principal oscuro es Sage aclarado para mantener legibles enlaces y cifras sobre Forest oscuro. Blue se conserva como token decorativo secundario: los textos auxiliares de las vistas intervenidas usan texto-suave. Gold y Terra se reservan para señal y decoración. Los diez tokens originales mantienen sus nombres.

Espaciado: 4, 8, 16, 24, 32 y 48 px. Sombra: `0 4px 18px #101f1909`. Lato 400/700 declarada mediante Google Fonts; ninguna fuente se descargó durante el encargo. Alternativa local system-ui. Cifras tabulares en tablas y resúmenes.

## Contrastes calculados

Luminancia relativa sRGB: canales linealizados con punto de corte 0,04045, pesos 0,2126 / 0,7152 / 0,0722 y razón `(Lmayor + 0,05)/(Lmenor + 0,05)`. Texto normal >=4,5:1; líneas SVG >=3:1.

| Combinación | Claro | Oscuro |
| --- | --- | --- |
| texto / fondo | 11.00:1 | 15.78:1 |
| texto / superficie | 11.88:1 | 12.97:1 |
| texto-suave / fondo | 6.03:1 | 11.01:1 |
| texto-suave / superficie | 6.51:1 | 9.05:1 |
| principal / fondo | 7.73:1 | 10.93:1 |
| sobre-principal / principal | 8.35:1 | 10.93:1 |
| alta / alta-fondo | 5.46:1 | 7.05:1 |
| media / media-fondo | 5.54:1 | 7.73:1 |
| baja / baja-fondo | 6.57:1 | 7.08:1 |
| linea / superficie | 3.79:1 | 5.22:1 |

La prueba calcula también texto y texto auxiliar sobre Sage y los tres fondos de la matriz, además de puntos/polígonos sobre superficie. Los bordes Sand son decorativos; controles de entrada y anillos usan linea.

## Tema, cabecera y logos

Claro sin preferencia; oscuro cuando lo solicita el sistema. Botón sol/luna con nombre accesible y estado aria-pressed. La clave gh-meleia-tema de localStorage guarda claro/oscuro y prevalece sobre el sistema; lectura y escritura protegidas con try/catch. Cambios del sistema se siguen mientras no exista elección manual. Las consultas antiguas de paleta se ignoran.

Los cuatro originales privados se recortaron por canal alfa y optimizaron con Pillow, con altura máxima de 160 px (cuatro veces la altura visual de 40 px). Color en claro, blanco en oscuro, filete vertical y enlace de inicio compartido. Cabecera de 80 px prevista en escritorio, máximo 88 px desde 1200 px, flexible en anchos menores. Pie con la marca y los tres servicios solicitados.

## Arañas

Una araña por fila; SVG de 1100 px dentro de una tarjeta con desplazamiento horizontal en pantallas estrechas. Se prioriza tamaño legible frente a reducir el gráfico en móvil. Se conserva posicionesArana y toda la prueba E10. Las cajas reservan 12 px por carácter y 18 para M/W/m/w; mantienen 22 px por línea. E11 comprueba además ausencia de intersecciones entre las cajas de todas las etiquetas reales y tamaño efectivo mínimo de diámetro/ejes/anillos.

A 1440 px, con SVG de 1100 px: OCDE tiene diámetro útil de 590,01 px, ejes de 22,13 px y anillos de 19,67 px; DDHH tiene diámetro de 591,95 px, ejes de 22,20 px y anillos de 19,73 px. Son medidas derivadas del viewBox, pendientes de confirmación visual.

Umbrales: se conservan cortes, nombres y puntajes de config/umbrales-config.json. Solo se mapean los colores por posición: puntaje bajo -> alta (Terra oscura), medio -> media (ocre Gold), alto -> baja (Forest); puntos y leyenda comparten el mapa. Datos y cálculos no se alteran.

## Revisión de movimiento

Se aplicaron las guías privadas emil-design-eng y review-animations, incluidas sus referencias de tiempos. La especificación E11 prevalece donde prescribe 150 ms ease-out y desactivación total con movimiento reducido.

| Antes | Después | Motivo |
| --- | --- | --- |
| Sin respuesta de presión coherente | scale(.98), transición transform 150 ms ease-out | Confirmación breve de interacción |
| Sin entrada espacial del panel | transform 220 ms cubic-bezier(.23,1,.32,1), @starting-style | Señalar procedencia lateral sin animar tamaño |
| Hover sin distinguir dispositivo | Movimiento solo con hover y puntero fino | Evitar estados de hover persistentes en táctil |
| Sin política global de animación reducida | Sin transiciones, animaciones ni desplazamiento animado | Cumplir la preferencia y el encargo |

Veredicto de revisión estática: aprobado. En los cambios E11 solo se transiciona transform; sin keyframes, animaciones de carga ni animaciones generales al renderizar vistas. Teclado con foco visible evita transformaciones en controles y entrada animada del panel. Cierre inmediato al desmontar; la entrada es la única transición del panel. Navegadores sin @starting-style presentan entrada inmediata. La percepción y fluidez real quedan pendientes de navegador.

## Verificación

`npm test`: 86 pruebas, 86 aprobadas, 0 fallos, 0 canceladas, 0 omitidas. Incluye anonimización y la prueba de geometría E10 intacta. No hubo fallos de E9 en esta ejecución. node --check correcto para app.js y vista-estandares.js; git diff --check sin errores.

No hay herramienta de navegador disponible en la sesión y no se accedió a la red. No se verificaron visualmente cabecera a 1200/1440/1920 px, móvil, recorte perceptual de logos, desplazamiento de SVG, foco con lector de pantalla, carga real de Google Fonts ni fluidez de @starting-style. Los tamaños son cálculos geométricos y el contraste es numérico. Los archivos E9 y sus pruebas aparecieron al cierre y se volvió a ejecutar la suite: los 86 casos pasan. Materialidad no se editó. Sus animaciones propias (mat-abrir y mat-etapa) quedan fuera de la revisión de movimiento E11 y de su lista de archivos autorizados.
