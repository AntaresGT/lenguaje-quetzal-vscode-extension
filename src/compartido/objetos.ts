import { IDENTIFICADOR, PATRON_TIPO } from './patrones';

type Alcance = 'publico' | 'privado';

type ClaseMiembro = 'atributo' | 'metodo' | 'constructor';

export interface MiembroObjetoDefinido {
    nombre: string;
    clase: ClaseMiembro;
    alcance: Alcance;
    esLibre: boolean;
    tipo?: string;
    retorno?: string;
    parametros?: string[];
}

export interface ObjetoDefinido {
    nombre: string;
    miembros: MiembroObjetoDefinido[];
}

interface BloqueObjeto {
    contenido: string;
    fin: number;
}

const REGEX_OBJETO = new RegExp(String.raw`\bobjeto\s+(${IDENTIFICADOR})\s*\{`, 'gu');

const REGEX_ETIQUETA = /^(p[uú]blico|privado)\s*:\s*$/u;

const REGEX_MIEMBRO_ATRIBUTO = new RegExp(
    String.raw`^(libre\s+)?(${PATRON_TIPO})\s+(?:var\s+)?(${IDENTIFICADOR})(?:\s*=.+)?$`,
    'u'
);

const REGEX_MIEMBRO_METODO = new RegExp(
    String.raw`^(libre\s+)?(?:(${PATRON_TIPO})\s+)?(${IDENTIFICADOR})\s*\(([^)]*)\)\s*(?:\{)?$`,
    'u'
);

function extraerBloque(texto: string, inicio: number): BloqueObjeto | null {
    let profundidad = 0;
    let comienzoContenido = -1;
    for (let i = inicio; i < texto.length; i++) {
        const caracter = texto[i];
        if (caracter === '{') {
            if (profundidad === 0) {
                comienzoContenido = i + 1;
            }
            profundidad++;
        } else if (caracter === '}') {
            profundidad--;
            if (profundidad === 0) {
                const contenido = texto.slice(comienzoContenido, i);
                return { contenido, fin: i + 1 };
            }
        }
    }
    return null;
}

function normalizarEtiqueta(etiqueta: string | undefined): Alcance | undefined {
    if (!etiqueta) {
        return undefined;
    }
    const normalized = etiqueta
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    if (normalized === 'publico') {
        return 'publico';
    }
    if (normalized === 'privado') {
        return 'privado';
    }
    return undefined;
}

function extraerNombreParametro(parametro: string): string {
    const limpio = parametro.trim();
    if (!limpio) {
        return '';
    }
    const partes = limpio.split(/\s+/u);
    return partes[partes.length - 1] ?? limpio;
}

function contar(caracter: string, linea: string): number {
    return (linea.match(new RegExp(`\\${caracter}`, 'g')) ?? []).length;
}

function analizarMiembrosDeObjeto(contenido: string, nombreObjeto: string): MiembroObjetoDefinido[] {
    const miembros: MiembroObjetoDefinido[] = [];
    const agregados = new Set<string>();
    let alcanceActual: Alcance = 'publico';
    let profundidad = 0;

    const lineas = contenido.split(/\r?\n/);
    for (const lineaOriginal of lineas) {
        const linea = lineaOriginal.trim();
        if (!linea) {
            profundidad += contar('{', lineaOriginal) - contar('}', lineaOriginal);
            if (profundidad < 0) {
                profundidad = 0;
            }
            continue;
        }

        if (REGEX_ETIQUETA.test(linea) && profundidad === 0) {
            alcanceActual = normalizarEtiqueta(linea.replace(':', '').trim()) ?? alcanceActual;
            profundidad += contar('{', lineaOriginal) - contar('}', lineaOriginal);
            if (profundidad < 0) {
                profundidad = 0;
            }
            continue;
        }

        if (linea.startsWith('//')) {
            profundidad += contar('{', lineaOriginal) - contar('}', lineaOriginal);
            if (profundidad < 0) {
                profundidad = 0;
            }
            continue;
        }

        if (profundidad === 0) {
            const matchMetodo = linea.match(REGEX_MIEMBRO_METODO);
            if (matchMetodo) {
                const esLibre = Boolean(matchMetodo[1]);
                const tipoRetorno = matchMetodo[2]?.trim();
                const nombre = matchMetodo[3];
                const paramsTexto = matchMetodo[4]?.trim() ?? '';
                const parametros = paramsTexto.length > 0
                    ? paramsTexto.split(',').map(extraerNombreParametro).filter(Boolean)
                    : [];

                let clase: ClaseMiembro = 'metodo';
                let retorno = tipoRetorno;
                if (!tipoRetorno && nombre === nombreObjeto) {
                    clase = 'constructor';
                    retorno = nombreObjeto;
                }

                const clave = `${nombre}|metodo|${esLibre}|${alcanceActual}`;
                if (!agregados.has(clave)) {
                    agregados.add(clave);
                    miembros.push({
                        nombre,
                        clase,
                        alcance: alcanceActual,
                        esLibre,
                        retorno,
                        parametros
                    });
                }

                profundidad += contar('{', lineaOriginal) - contar('}', lineaOriginal);
                if (profundidad < 0) {
                    profundidad = 0;
                }
                continue;
            }

            const matchAtributo = linea.match(REGEX_MIEMBRO_ATRIBUTO);
            if (matchAtributo) {
                const esLibre = Boolean(matchAtributo[1]);
                const tipo = matchAtributo[2];
                const nombre = matchAtributo[3];

                const clave = `${nombre}|atributo|${esLibre}|${alcanceActual}`;
                if (!agregados.has(clave)) {
                    agregados.add(clave);
                    miembros.push({
                        nombre,
                        clase: 'atributo',
                        alcance: alcanceActual,
                        esLibre,
                        tipo
                    });
                }

                profundidad += contar('{', lineaOriginal) - contar('}', lineaOriginal);
                if (profundidad < 0) {
                    profundidad = 0;
                }
                continue;
            }
        }

        profundidad += contar('{', lineaOriginal) - contar('}', lineaOriginal);
        if (profundidad < 0) {
            profundidad = 0;
        }
    }

    return miembros;
}

export function analizarObjetosDesdeTextoLimpio(textoLimpio: string): ObjetoDefinido[] {
    const objetos: ObjetoDefinido[] = [];
    let match: RegExpExecArray | null;
    while ((match = REGEX_OBJETO.exec(textoLimpio)) !== null) {
        const nombre = match[1];
        const indiceLlave = REGEX_OBJETO.lastIndex - 1;
        const bloque = extraerBloque(textoLimpio, indiceLlave);
        if (!bloque) {
            continue;
        }
        const miembros = analizarMiembrosDeObjeto(bloque.contenido, nombre);
        objetos.push({ nombre, miembros });
        REGEX_OBJETO.lastIndex = bloque.fin;
    }
    return objetos;
}

export function fusionarMiembros(base: ObjetoDefinido, nuevo: ObjetoDefinido): void {
    const existentes = new Set(
        base.miembros.map(miembro => `${miembro.nombre}|${miembro.clase}|${miembro.esLibre}|${miembro.alcance}`)
    );
    for (const miembro of nuevo.miembros) {
        const clave = `${miembro.nombre}|${miembro.clase}|${miembro.esLibre}|${miembro.alcance}`;
        if (!existentes.has(clave)) {
            existentes.add(clave);
            base.miembros.push(miembro);
        }
    }
}
