import * as path from 'path';

const IDENTIFICADOR = String.raw`[\p{L}_][\p{L}\p{N}_]*`;
const PATRON_TIPO = String.raw`(?:entero|número|numero|texto|cadena|log|bool|lista\s*<\s*[^>]+?\s*>|lista|jsn|vacio|vacío|[A-Z][\p{L}\p{N}_]*)`;

export interface FuncionAnalizada {
    nombre: string;
    tipoRetorno?: string;
    parametros: string[];
}

export interface VariableAnalizada {
    nombre: string;
    tipo: string;
}

export interface ObjetoAnalizado {
    nombre: string;
}

export interface ExportacionAnalizada {
    nombre: string;
    alias?: string;
    tipo?: string;
}

export interface ImportacionAnalizada {
    modulo: string;
    elementos: ExportacionAnalizada[];
}

export interface AnalisisDocumento {
    funciones: FuncionAnalizada[];
    variables: VariableAnalizada[];
    objetos: ObjetoAnalizado[];
    exportaciones: ExportacionAnalizada[];
    importaciones: ImportacionAnalizada[];
    identificadores: Map<string, string>;
}

export function limpiarComentarios(texto: string): string {
    const sinComentariosLinea = texto.replace(/\/\/.*$/gm, '');
    return sinComentariosLinea.replace(/\/\*[\s\S]*?\*\//g, '');
}

function extraerNombreParametro(parametro: string): string {
    const limpio = parametro.trim();
    if (!limpio) {
        return '';
    }
    const partes = limpio.split(/\s+/u);
    return partes[partes.length - 1] ?? limpio;
}

function normalizarTipo(tipo: string): string {
    const limpio = tipo.trim();
    if (limpio.includes('\n')) {
        return limpio.replace(/\s+/g, ' ');
    }
    return limpio;
}

function dividirElementosLista(texto: string): string[] {
    const sinSaltos = texto.replace(/\n/g, ' ');
    const partes = sinSaltos.split(',');
    return partes
        .map(parte => parte.trim())
        .filter(parte => parte.length > 0);
}

export function analizarTextoQuetzal(texto: string): AnalisisDocumento {
    const textoLimpio = limpiarComentarios(texto);
    const funciones: FuncionAnalizada[] = [];
    const variables: VariableAnalizada[] = [];
    const objetos: ObjetoAnalizado[] = [];
    const exportaciones: ExportacionAnalizada[] = [];
    const importaciones: ImportacionAnalizada[] = [];
    const identificadores = new Map<string, string>();

    const regexObjeto = new RegExp(String.raw`\bobjeto\s+(${IDENTIFICADOR})\s*\{`, 'gu');
    let coincidencia: RegExpExecArray | null;
    while ((coincidencia = regexObjeto.exec(textoLimpio)) !== null) {
        const nombre = coincidencia[1];
        objetos.push({ nombre });
        identificadores.set(nombre, nombre);
    }

    const regexFuncionNueva = new RegExp(String.raw`\b(${PATRON_TIPO})\s+(${IDENTIFICADOR})\s*\(([^)]*)\)\s*\{`, 'gu');
    while ((coincidencia = regexFuncionNueva.exec(textoLimpio)) !== null) {
        const tipo = normalizarTipo(coincidencia[1]);
        const nombre = coincidencia[2];
        const parametros = coincidencia[3]
            .split(',')
            .map(p => extraerNombreParametro(p))
            .filter(p => p.length > 0);
        funciones.push({ nombre, tipoRetorno: tipo, parametros });
        identificadores.set(nombre, tipo);
    }

    const regexFuncionLegacy = new RegExp(String.raw`\b(?:función|funcion|fn)\s+(${IDENTIFICADOR})\s*\(([^)]*)\)\s*\{`, 'gu');
    while ((coincidencia = regexFuncionLegacy.exec(textoLimpio)) !== null) {
        const nombre = coincidencia[1];
        const parametros = coincidencia[2]
            .split(',')
            .map(p => extraerNombreParametro(p))
            .filter(p => p.length > 0);
        funciones.push({ nombre, parametros });
        identificadores.set(nombre, 'desconocido');
    }

    const regexVariable = new RegExp(String.raw`\b(${PATRON_TIPO})\s+(?:var\s+)?(${IDENTIFICADOR})\b`, 'gu');
    while ((coincidencia = regexVariable.exec(textoLimpio)) !== null) {
        const tipo = normalizarTipo(coincidencia[1]);
        const nombre = coincidencia[2];
        const posicionFinal = regexVariable.lastIndex;
        const resto = textoLimpio.slice(posicionFinal).trimStart();
        if (resto.startsWith('(')) {
            continue;
        }
        variables.push({ nombre, tipo });
        identificadores.set(nombre, tipo);
    }

    const regexImportacion = /importar\s*\{([\s\S]*?)\}\s*desde\s*"([^"]+)"/gu;
    while ((coincidencia = regexImportacion.exec(textoLimpio)) !== null) {
        const cuerpo = coincidencia[1];
        const modulo = coincidencia[2];
        const partes = dividirElementosLista(cuerpo.replace(/\/\/.*$/gm, ''));
        const elementos: ExportacionAnalizada[] = [];
        for (const parte of partes) {
            const matchElemento = parte.match(new RegExp(String.raw`^(${IDENTIFICADOR})(?:\s+como\s+(${IDENTIFICADOR}))?$`, 'u'));
            if (matchElemento) {
                const nombre = matchElemento[1];
                const alias = matchElemento[2];
                elementos.push({ nombre, alias });
            }
        }
        importaciones.push({ modulo, elementos });
    }

    const regexExportacion = /exportar\s*\{([\s\S]*?)\}/gu;
    while ((coincidencia = regexExportacion.exec(textoLimpio)) !== null) {
        const cuerpo = coincidencia[1];
        const partes = dividirElementosLista(cuerpo.replace(/\/\/.*$/gm, ''));
        for (const parte of partes) {
            const matchElemento = parte.match(new RegExp(String.raw`^(${IDENTIFICADOR})(?:\s+como\s+(${IDENTIFICADOR}))?$`, 'u'));
            if (matchElemento) {
                const nombre = matchElemento[1];
                const alias = matchElemento[2];
                const tipo = identificadores.get(nombre);
                exportaciones.push({ nombre, alias, tipo });
            }
        }
    }

    return { funciones, variables, objetos, exportaciones, importaciones, identificadores };
}

export function normalizarRutaModulo(ruta: string): string {
    const conExtension = ruta.endsWith('.qz') ? ruta : `${ruta}.qz`;
    const rutaNormalizada = conExtension.replace(/\\/g, '/');
    return rutaNormalizada.startsWith('.') ? rutaNormalizada : rutaNormalizada;
}

export function rutaRelativa(documentoFs: string, destinoFs: string): string {
    const directorioDocumento = path.dirname(documentoFs);
    let relativa = path.relative(directorioDocumento, destinoFs);
    if (!relativa.startsWith('.')) {
        relativa = `./${relativa}`;
    }
    return relativa.replace(/\\/g, '/');
}
