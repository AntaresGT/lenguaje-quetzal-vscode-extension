import * as path from 'path';
import { IDENTIFICADOR, PATRON_TIPO, limpiarComentarios } from '../compartido/patrones';
import {
    MiembroObjetoDefinido,
    ObjetoDefinido,
    analizarObjetosDesdeTextoLimpio
} from '../compartido/objetos';

export interface FuncionAnalizada {
    nombre: string;
    tipoRetorno?: string;
    parametros: string[];
    documentacion?: string;
}

export interface VariableAnalizada {
    nombre: string;
    tipo: string;
}

export type MiembroObjetoAnalizado = MiembroObjetoDefinido;

export type ObjetoAnalizado = ObjetoDefinido;

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
    documentacionSimbolos: Map<string, string>;
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

function limpiarLineaComentario(linea: string): string {
    return linea
        .replace(/^\s*\/\/\/?\s?/u, '')
        .replace(/^\s*\/\*+\s?/u, '')
        .replace(/\*\/\s*$/u, '')
        .replace(/^\s*\*\s?/u, '')
        .trim();
}

function extraerDocumentacionSimbolos(texto: string): Map<string, string> {
    const documentos = new Map<string, string>();
    const lineas = texto.split(/\r?\n/);
    let comentarios: string[] = [];
    let enComentarioBloque = false;

    const patronFuncion = new RegExp(
        String.raw`^\s*(?:(?:libre|asincrono|asíncrono)\s+)*(${PATRON_TIPO})\s+(${IDENTIFICADOR})\s*\(`,
        'u'
    );
    const patronObjeto = new RegExp(String.raw`^\s*(?:objeto|prototipo)\s+(${IDENTIFICADOR})\b`, 'u');
    const patronVariable = new RegExp(
        String.raw`^\s*(${PATRON_TIPO})\s+(?:var\s+)?(${IDENTIFICADOR})\b`,
        'u'
    );

    for (const linea of lineas) {
        const recortada = linea.trim();
        if (enComentarioBloque || recortada.startsWith('/*')) {
            comentarios.push(limpiarLineaComentario(linea));
            if (recortada.includes('*/')) {
                enComentarioBloque = false;
            } else {
                enComentarioBloque = true;
            }
            continue;
        }
        if (recortada.startsWith('//')) {
            comentarios.push(limpiarLineaComentario(linea));
            continue;
        }
        if (!recortada) {
            if (comentarios.length > 0) comentarios.push('');
            continue;
        }

        const textoDoc = comentarios.join('\n').trim();
        const funcion = recortada.match(patronFuncion);
        const objeto = recortada.match(patronObjeto);
        const variable = recortada.match(patronVariable);
        if (textoDoc && funcion) {
            documentos.set(`funcion:${funcion[2]}`, textoDoc);
            documentos.set(`simbolo:${funcion[2]}`, textoDoc);
        } else if (textoDoc && objeto) {
            documentos.set(`objeto:${objeto[1]}`, textoDoc);
            documentos.set(`simbolo:${objeto[1]}`, textoDoc);
        } else if (textoDoc && variable) {
            documentos.set(`simbolo:${variable[2]}`, textoDoc);
        }
        comentarios = [];
    }
    return documentos;
}

export function analizarTextoQuetzal(texto: string): AnalisisDocumento {
    const textoLimpio = limpiarComentarios(texto);
    const funciones: FuncionAnalizada[] = [];
    const variables: VariableAnalizada[] = [];
    const objetos: ObjetoAnalizado[] = analizarObjetosDesdeTextoLimpio(textoLimpio);
    const exportaciones: ExportacionAnalizada[] = [];
    const importaciones: ImportacionAnalizada[] = [];
    const identificadores = new Map<string, string>();
    const documentacionSimbolos = extraerDocumentacionSimbolos(texto);

    for (const objeto of objetos) {
        identificadores.set(objeto.nombre, objeto.nombre);
    }

    const regexFuncionNueva = new RegExp(String.raw`\b(?:(?:libre|asincrono|asíncrono)\s+)*(${PATRON_TIPO})\s+(${IDENTIFICADOR})\s*\(([^)]*)\)\s*\{`, 'gu');
    let coincidencia: RegExpExecArray | null;
    while ((coincidencia = regexFuncionNueva.exec(textoLimpio)) !== null) {
        const tipo = normalizarTipo(coincidencia[1]);
        const nombre = coincidencia[2];
        const parametros = coincidencia[3]
            .split(',')
            .map(p => extraerNombreParametro(p))
            .filter(p => p.length > 0);
        funciones.push({
            nombre,
            tipoRetorno: tipo,
            parametros,
            documentacion: documentacionSimbolos.get(`funcion:${nombre}`)
        });
        identificadores.set(nombre, tipo);
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

    return {
        funciones,
        variables,
        objetos,
        exportaciones,
        importaciones,
        identificadores,
        documentacionSimbolos
    };
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
