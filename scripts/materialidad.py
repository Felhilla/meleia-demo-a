#!/usr/bin/env python3
"""Genera exclusivamente materialidad.json; Python estándar y Node, sin red."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# nombre, dimensión, riesgos, ejes, referencia sectorial, rentabilidad, gasto.
TEMAS = [
    ('Ética, anticorrupción y cumplimiento', 'gobernanza', [15], ['etapa-ocde-1'], None, 4.4, 4.0),
    ('Salud y seguridad en el trabajo', 'social', [3, 6], ['tema-ddhh-6'], None, 3.6, 4.0),
    ('Seguridad de procesos e integridad de instalaciones y cilindros', 'social', [5], ['tema-ddhh-6'], 'SASB: integridad de la infraestructura de gas', 4.8, 4.6),
    ('Jornada, remuneración y condiciones de trabajo', 'social', [1, 4], ['tema-ddhh-7', 'tema-ddhh-8', 'tema-ddhh-9'], None, 2.0, 2.4),
    ('Derechos laborales en la cadena de suministro y distribución', 'social', [8, 10, 11, 18], ['tema-ddhh-5', 'tema-ddhh-9'], None, 3.0, 3.2),
    ('Trabajo infantil y trabajo forzoso en la cadena de valor', 'social', [7], ['tema-ddhh-1', 'tema-ddhh-2'], None, 2.2, 2.4),
    ('Igualdad, inclusión y prevención del acoso', 'social', [2, 9, 14], ['tema-ddhh-3', 'tema-ddhh-4'], None, 1.8, 2.2),
    ('Acceso y continuidad del suministro de energía', 'social', [12], [], 'SASB: asequibilidad de la energía', 4.5, 4.3),
    ('Convivencia con comunidades y seguridad vial', 'social', [13], ['tema-ddhh-10'], None, 2.0, 2.4),
    ('Transparencia y diálogo con grupos de interés', 'gobernanza', [16], ['etapa-ocde-5'], None, 1.8, 2.0),
    ('Mecanismos de queja y remediación', 'gobernanza', [17], ['etapa-ocde-6'], None, 1.8, 2.2),
    ('Gestión de la debida diligencia en DDHH', 'gobernanza', [17], ['etapa-ocde-1', 'etapa-ocde-2', 'etapa-ocde-3', 'etapa-ocde-4'], None, 2.0, 2.2),
    ('Abastecimiento responsable y gestión de contratistas', 'gobernanza', [10, 11], ['etapa-ocde-2'], None, 2.6, 2.8),
    ('Emisiones y cambio climático', 'ambiental', [], ['tema-ddhh-10'], 'SASB: emisiones de gases de efecto invernadero', 4.0, 4.2),
    ('Gestión ambiental de residuos y sustancias', 'ambiental', [6], ['tema-ddhh-10'], None, 2.0, 2.6),
]
# Orden: colaboradores, distribuidores, proveedores, clientes, comunidades, autoridades.
AJUSTES = [
    (0.2, 0, 0.2, 0, 0, 0.5),
    (0.8, 0.5, 0.4, -0.2, -0.2, 0.2),
    (0.5, 0.7, 0.3, 0.5, 0.6, 0.5),
    (0.8, 0.4, 0.3, -0.3, -0.3, 0.2),
    (0.2, 0.7, 0.7, -0.2, 0, 0.4),
    (0.2, 0.6, 0.6, 0, 0.2, 0.5),
    (0.7, 0.4, 0.4, 0, 0, 0.2),
    (0, 0.4, 0, 0.8, 0.8, 0.5),
    (0, 0.5, 0.1, 0.2, 1.0, 0.6),
    (0.2, 0.4, 0.4, 0.3, 0.6, 0.4),
    (0.5, 0.5, 0.5, 0.3, 0.6, 0.3),
    (0.3, 0.2, 0.2, 0, 0.2, 0.4),
    (0.1, 0.5, 0.7, -0.2, 0, 0.3),
    (0, 0.2, 0.1, 0.2, 0.7, 0.6),
    (0.5, 0.3, 0.5, 0, 0.7, 0.5),
]
GRUPOS = [
    ('colaboradores', 'Colaboradores de planta y administrativos', 'encuesta', 36, 'Perspectiva ilustrativa de las condiciones laborales y la exposición en planta.'),
    ('distribuidores', 'Distribuidores y transportistas', 'taller', 18, 'Perspectiva ilustrativa de la distribución, transporte y manipulación de cilindros.'),
    ('proveedores', 'Proveedores y contratistas', 'entrevista', 12, 'Perspectiva ilustrativa del abastecimiento y los servicios contratados.'),
    ('clientes', 'Clientes de hogares y comerciales', 'encuesta', 40, 'Perspectiva ilustrativa de la seguridad y continuidad del suministro.'),
    ('comunidades', 'Comunidades vecinas a plantas y rutas', 'taller', 24, 'Perspectiva ilustrativa de la convivencia y las afectaciones ambientales.'),
    ('autoridades', 'Autoridades del sector y locales', 'entrevista', 8, 'Perspectiva ilustrativa del cumplimiento y la protección de derechos.'),
]
EVALUADORES = [('finanzas', 'Finanzas'), ('comercial', 'Comercial'), ('operaciones', 'Operaciones'), ('sostenibilidad', 'Sostenibilidad'), ('personas', 'Gerencia de Personas')]
# Diferencias de enfoque, suma cero por variable; no ponderan las funciones.
AJUSTES_FIN = [(0.2, 0), (0.1, -0.1), (-0.1, 0.2), (-0.1, 0), (-0.1, -0.1)]


def leer(ruta):
    return json.loads((ROOT / ruta).read_text(encoding='utf-8'))


def generar():
    riesgos = leer('public/data/riesgos.json')
    ejes = {e['id'] for e in leer('public/data/estandares.json')['ejes']}
    cfg = leer('public/config/materialidad-config.json')
    puntajes = next(e['puntajes'] for e in leer('public/data/evaluaciones.json') if e['id'] == 'eval-2025-12')
    # La selección dominante y la gravedad usan el módulo existente, incluidos empates.
    codigo = """
const R = require('./public/riesgos.js');
const cfg = require('./public/config/criticidad-config.json');
const riesgos = require('./public/data/riesgos.json');
console.log(JSON.stringify(Object.fromEntries(riesgos.map(r => [r.id, R.criticidad(r, cfg)]))));
"""
    dominantes = json.loads(subprocess.check_output(['node', '-e', codigo], cwd=ROOT, text=True))
    def valor(n):
        return round(max(cfg['escala']['minimo'], min(cfg['escala']['maximo'], n)), 1)
    grupos = [dict(id='gi-' + g, nombre=n, mecanismo=m, participantes=p, descripcion=d, origen='ilustrativo') for g, n, m, p, d in GRUPOS]
    evaluadores = [dict(id='ef-' + i, nombre=n, origen='ilustrativo') for i, n in EVALUADORES]
    temas = []
    for numero, ((nombre, dimension, refs, eids, sasb, renta, gasto), ajustes) in enumerate(zip(TEMAS, AJUSTES), 1):
        rids = [f'riesgo-{r:02}' for r in refs]
        assert set(rids) <= {r['id'] for r in riesgos} and set(eids) <= ejes
        assert rids or eids
        assert all(-1 <= a <= 1 for a in ajustes)
        if rids:
            base = sum(dominantes[r]['promedio'] for r in rids) / len(rids) * 5 / 3
            prob = sum({'alta': 4.5, 'media': 3.0, 'baja': 1.5, None: 2.5}[dominantes[r]['evaluacionDominante']['probabilidad']] for r in rids) / len(rids)
        else:
            base = max(1, min(5, 5 - sum(puntajes[e] for e in eids) / len(eids)))
            prob = base
        temas.append(dict(
            id=f'tema-{numero:02}', nombre=nombre, dimension_esg=dimension,
            descripcion=f'Tema ilustrativo sobre {nombre[0].lower() + nombre[1:]}, derivado de los riesgos o ejes vinculados. No representa una consulta ni una medición real de la empresa.',
            fuentes=(['riesgos'] if rids else []) + (['estandares'] if eids else []) + (['sector'] if sasb else []) + ['grupos'],
            riesgos=rids, ejes=eids, sasb=sasb,
            evaluacion_impacto={g['id']: dict(escala=valor(base+a), alcance=valor(base+a), irremediabilidad=valor(base+a), probabilidad=valor(prob+a), origen='ilustrativo') for g, a in zip(grupos, ajustes)},
            evaluacion_financiera={e['id']: dict(rentabilidad=valor(renta+a), gasto_operativo=valor(gasto+b), origen='ilustrativo') for e, (a, b) in zip(evaluadores, AJUSTES_FIN)},
            origen='ilustrativo'))
    datos = dict(origen='ilustrativo', grupos=grupos, evaluadores_financieros=evaluadores, temas=temas)
    # Valida con el mismo contrato que consumirá la interfaz antes de escribir.
    subprocess.run(['node', '-e', "const M=require('./public/materialidad.js');const fs=require('fs');M.clasificar(JSON.parse(fs.readFileSync(0,'utf8')).temas,require('./public/config/materialidad-config.json'));"], cwd=ROOT, input=json.dumps(datos), text=True, check=True)
    (ROOT / 'public/data/materialidad.json').write_text(json.dumps(datos, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    generar()
