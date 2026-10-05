# Datos E8 · Doble materialidad ilustrativa

Los temas nacen de los riesgos y ejes de debida diligencia existentes. Todos los registros nuevos son ilustrativos: no representan hechos adicionales, consultas realizadas, participantes reales ni una validación empresarial. El marco y la referencia sectorial identifican el enfoque del demo; las fórmulas son decisiones metodológicas del demo, no una afirmación de que GRI imponga estos promedios.

## Archivos y regeneración

- `scripts/materialidad.py`: tablas legibles de los 15 temas, vínculos, bases financieras y ajustes; generador determinista.
- `public/data/materialidad.json`: objeto con `grupos`, `evaluadores_financieros` y `temas`.
- `public/config/materialidad-config.json`: escala, agregaciones, seis etapas, cuadrantes y umbrales.
- `public/materialidad.js`: módulo UMD puro, disponible como `Materialidad` en navegador y `module.exports` en Node.
- `tests/materialidad.test.mjs`: pruebas de datos, cálculo, cruces, validación y pureza.
- `docs/datos-e8.md`: método, contrato y resultados.

Ejecutar desde cualquier directorio `python3 /ruta/al/repositorio/scripts/materialidad.py`. Requiere Python 3.9+ y Node, sin paquetes adicionales ni red. Solo escribe `public/data/materialidad.json`; no modifica el extractor existente.

## Derivación

Entradas: `riesgos.json`, `estandares.json`, `evaluaciones.json`, `criticidad-config.json` y `materialidad-config.json`. La lectura adicional de `evaluaciones.json` es necesaria porque los puntajes de diciembre no están en el archivo de estándares.

1. Se llama a `Riesgos.criticidad` desde Node; la evaluación dominante es la de máxima gravedad promedio, conservando la primera en empate. Se usa su probabilidad, no la máxima de otras evaluaciones.
2. La base común de escala, alcance e irremediabilidad es la media de las gravedades dominantes de los riesgos vinculados multiplicada por 5/3. Se conserva la gravedad agregada; no se transforman por separado los tres componentes originales.
3. La probabilidad base promedia alta=4,5, media=3,0, baja=1,5 y null=2,5. El sustituto para null es un supuesto ilustrativo, no una probabilidad observada.
4. Para el tema 14, sin riesgos, se usa `5 − puntaje` del eje ambiental en `eval-2025-12`, acotado a [1,5]: 1,222222… Se utiliza esa base también como probabilidad ilustrativa, pues el eje no aporta una probabilidad independiente. Si hubiera varios ejes se promediarían sus puntajes.
5. A las cuatro variables se aplica el mismo ajuste fijo del grupo; luego se recorta a [0,5] y se redondea a un decimal con `round` de Python. No se redondean los agregados posteriores para clasificar.
6. Severidad = media de tres variables; importancia por grupo = media de severidad y probabilidad; impacto = media simple de grupos. El número de participantes no pondera.
7. Rentabilidad y gasto tienen bases manuales en `TEMAS`. Los ajustes por función (rentabilidad, gasto) son Finanzas (+0,2; 0), Comercial (+0,1; −0,1), Operaciones (−0,1; +0,2), Sostenibilidad (−0,1; 0) y Gerencia de Personas (−0,1; −0,1). Suman cero por variable, sin recortes en estos datos; representan énfasis de cada función, no respuestas reales. Se promedian variables y evaluadores por igual.

Los vínculos siguen la tabla del encargo. El trabajo forzoso del tema 6 se fundamenta en su eje, no en atribuirlo al riesgo de trabajo infantil. El tema 14 deriva del eje ambiental; SASB complementa su enfoque. `fuentes: grupos` indica la perspectiva simulada, no evidencia de una consulta. Los vínculos tema–eje no crean relaciones directas riesgo–eje en las fuentes.

## Ajustes de impacto

Columnas: C colaboradores, D distribuidores, P proveedores, Cl clientes, Co comunidades, A autoridades. Los negativos representan menor cercanía relativa; cero conserva la base. Cada ajuste está entre −1 y +1.

| Tema | C | D | P | Cl | Co | A | Justificación |
|---|---:|---:|---:|---:|---:|---:|---|
| 01 | +0.2 | +0.0 | +0.2 | +0.0 | +0.0 | +0.5 | Autoridades: cumplimiento; colaboradores y proveedores: decisiones y compras. |
| 02 | +0.8 | +0.5 | +0.4 | -0.2 | -0.2 | +0.2 | Colaboradores: exposición en planta; distribuidores y contratistas: manipulación; clientes y comunidades: menor cercanía laboral. |
| 03 | +0.5 | +0.7 | +0.3 | +0.5 | +0.6 | +0.5 | Distribuidores: cilindros; comunidades: entorno; colaboradores, clientes y autoridades: seguridad de instalaciones. |
| 04 | +0.8 | +0.4 | +0.3 | -0.3 | -0.3 | +0.2 | Colaboradores: jornada y salario; cadena: condiciones contractuales; clientes y comunidades: menor cercanía laboral. |
| 05 | +0.2 | +0.7 | +0.7 | -0.2 | +0.0 | +0.4 | Distribuidores y proveedores: titulares y gestores de relaciones laborales; autoridades: supervisión. |
| 06 | +0.2 | +0.6 | +0.6 | +0.0 | +0.2 | +0.5 | Cadena: contratación y distribución; autoridades: protección; comunidades y colaboradores: detección. |
| 07 | +0.7 | +0.4 | +0.4 | +0.0 | +0.0 | +0.2 | Colaboradores: trato cotidiano; cadena: relaciones laborales; autoridades: protección de derechos. |
| 08 | +0.0 | +0.4 | +0.0 | +0.8 | +0.8 | +0.5 | Clientes y comunidades: continuidad y acceso; autoridades: servicio; distribuidores: suministro. |
| 09 | +0.0 | +0.5 | +0.1 | +0.2 | +1.0 | +0.6 | Comunidades: tránsito y ruido; autoridades: territorio; distribuidores: rutas. |
| 10 | +0.2 | +0.4 | +0.4 | +0.3 | +0.6 | +0.4 | Comunidades: diálogo territorial; cadena y autoridades: acceso a información; clientes y colaboradores: comunicación. |
| 11 | +0.5 | +0.5 | +0.5 | +0.3 | +0.6 | +0.3 | Comunidades y trabajadores de la cadena: acceso a reparación; demás grupos: uso del canal. |
| 12 | +0.3 | +0.2 | +0.2 | +0.0 | +0.2 | +0.4 | Autoridades: supervisión; colaboradores: implementación; cadena y comunidades: seguimiento. |
| 13 | +0.1 | +0.5 | +0.7 | -0.2 | +0.0 | +0.3 | Proveedores: contratación; distribuidores: abastecimiento; autoridades: supervisión; clientes: menor cercanía contractual. |
| 14 | +0.0 | +0.2 | +0.1 | +0.2 | +0.7 | +0.6 | Comunidades y autoridades: ambiente y transición; clientes y distribuidores: consumo y transporte. |
| 15 | +0.5 | +0.3 | +0.5 | +0.0 | +0.7 | +0.5 | Comunidades: entorno; colaboradores y contratistas: sustancias; autoridades: gestión ambiental. |

## Contrato de cálculo

Las evaluaciones se indexan por id: `evaluacion_impacto[grupoId]` y `evaluacion_financiera[evaluadorId]`; cada objeto también lleva `origen`. `porGrupo` devuelve un objeto `{grupoId: importancia}`. `clasificar` devuelve filas `{id, impacto, financiera, cuadrante, material, convergencia}`; `listaCorta` devuelve esas mismas filas materiales, ordenadas por suma descendente y por id en empate. Para mostrar nombres se unen a `temas` por id. No se persiste lista corta ni resultados calculados.

`cruce(tema, {riesgos, plan, estandares})` recibe las colecciones originales (estándares como objeto con `ejes`) y devuelve objetos completos en `riesgos`, `ejes` y `acciones`. Las acciones coinciden por riesgo **o** eje; se deduplican por id y se ordenan por id. No se modifican las entradas.

El método predeterminado usa promedios del universo. Para un umbral fijo basta cambiar `umbral.metodo` a `fijo` y `umbral.valor_fijo` a `3`; no requiere cambiar código ni regenerar datos. La comparación es estricta `>`: igualdad no supera el umbral. Convergencia cuenta cuántas de impacto, rentabilidad y gasto superan su propia media del universo, incluso bajo el método fijo.

Se rechazan configuraciones incompletas de cálculo, reglas o agregaciones no soportadas, escalas distintas de 0–5, valores no numéricos/no finitos/fuera de escala, evaluaciones vacías, universos vacíos e ids duplicados. Los campos editoriales no intervienen en el cálculo. La completitud de grupos y funciones contra el catálogo se comprueba en las pruebas.

## Resultados

Umbral de impacto: **2.925000**. Umbral financiero: **2.853333**. Son 8 materiales (4 dobles, 3 por impacto y 1 financiero) y 7 no materiales. No fue necesario alterar la regla ni recalibrar los valores tras la primera generación. Las cifras de la tabla están redondeadas solo para presentación.

| Tema | Impacto | Financiera | Cuadrante | Convergencia |
|---|---:|---:|---|---:|
| tema-01 · Ética, anticorrupción y cumplimiento | 3.325 | 4.200 | doble | 3 |
| tema-02 · Salud y seguridad en el trabajo | 2.250 | 2.600 | no-material | 0 |
| tema-03 · Seguridad de procesos e integridad de instalaciones y cilindros | 3.667 | 4.700 | doble | 3 |
| tema-04 · Jornada, remuneración y condiciones de trabajo | 2.783 | 2.200 | no-material | 0 |
| tema-05 · Derechos laborales en la cadena de suministro y distribución | 3.592 | 3.100 | doble | 3 |
| tema-06 · Trabajo infantil y trabajo forzoso en la cadena de valor | 3.683 | 2.300 | impacto | 1 |
| tema-07 · Igualdad, inclusión y prevención del acoso | 2.633 | 2.000 | no-material | 0 |
| tema-08 · Acceso y continuidad del suministro de energía | 3.117 | 4.400 | doble | 3 |
| tema-09 · Convivencia con comunidades y seguridad vial | 2.000 | 2.200 | no-material | 0 |
| tema-10 · Transparencia y diálogo con grupos de interés | 4.575 | 1.900 | impacto | 1 |
| tema-11 · Mecanismos de queja y remediación | 2.550 | 2.000 | no-material | 0 |
| tema-12 · Gestión de la debida diligencia en DDHH | 2.317 | 2.100 | no-material | 0 |
| tema-13 · Abastecimiento responsable y gestión de contratistas | 3.867 | 2.700 | impacto | 1 |
| tema-14 · Emisiones y cambio climático | 1.500 | 4.100 | financiera | 2 |
| tema-15 · Gestión ambiental de residuos y sustancias | 2.017 | 2.300 | no-material | 0 |

## Verificación

`npm test`: 73 pruebas, 73 aprobadas, 0 fallos, 0 omitidas; incluye anonimización. No se ejecuta Python dentro de las pruebas. Se ejecutó manualmente el generador dos veces y se compararon los bytes contra la primera generación: SHA-256 `23727ffed2c86897a800bcd02f310b49cd3a9ddeb470ee68c4d887a961505768` en las tres lecturas.

Solo se crearon los seis archivos autorizados. Sin commit, push ni acceso a red.

## Dudas para Felipe

No hay bloqueos. Antes de usar el demo como metodología acordada, confirmar el uso de la brecha ambiental también como probabilidad ilustrativa del tema sin riesgos y validar los ajustes/participantes simulados. Salud laboral queda no material respecto del universo de este ejercicio; ello no elimina sus riesgos ni sus obligaciones de gestión. Confirmar que se desea conservar este resultado relativo en la presentación.
