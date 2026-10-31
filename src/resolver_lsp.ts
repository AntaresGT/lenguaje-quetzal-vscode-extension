import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

const NOMBRE_BINARIO = 'quetzal-lsp';

/**
 * Resuelve la ruta absoluta a quetzal-lsp.
 * Si el ajuste `quetzal.lsp.ruta` tiene valor, esa ruta manda y no se busca en PATH.
 */
export function resolverRutaLsp(): string | undefined {
    const configurado = vscode.workspace
        .getConfiguration('quetzal')
        .get<string>('lsp.ruta')
        ?.trim();

    if (configurado) {
        return resolverCandidatoConfigurado(expandirRuta(configurado));
    }

    const vistos = new Set<string>();
    for (const directorio of directoriosDeBusqueda()) {
        const clave = normalizarDirectorio(directorio);
        if (vistos.has(clave)) {
            continue;
        }
        vistos.add(clave);

        const encontrado = buscarEnDirectorio(directorio);
        if (encontrado) {
            return encontrado;
        }
    }

    return undefined;
}

function expandirRuta(ruta: string): string {
    if (ruta === '~') {
        return os.homedir();
    }
    if (ruta.startsWith('~/') || ruta.startsWith('~\\')) {
        return path.join(os.homedir(), ruta.slice(2));
    }
    return path.resolve(ruta);
}

function resolverCandidatoConfigurado(ruta: string): string | undefined {
    if (esEjecutable(ruta)) {
        return ruta;
    }

    if (process.platform === 'win32') {
        for (const extension of ['.exe', '.cmd']) {
            if (!ruta.toLowerCase().endsWith(extension) && esEjecutable(ruta + extension)) {
                return ruta + extension;
            }
        }
    }

    return undefined;
}

function directoriosDeBusqueda(): string[] {
    const directorios: string[] = [];
    const pathEnv = process.env.PATH ?? process.env.Path ?? '';
    for (const parte of pathEnv.split(path.delimiter)) {
        if (parte) {
            directorios.push(parte);
        }
    }
    directorios.push(...rutasHabituales());
    return directorios;
}

function rutasHabituales(): string[] {
    const hogar = os.homedir();
    if (process.platform === 'win32') {
        return [path.join(hogar, '.cargo', 'bin')];
    }
    return [
        path.join(hogar, '.cargo', 'bin'),
        path.join(hogar, '.local', 'bin'),
        '/usr/local/bin',
        '/usr/bin',
    ];
}

function nombresCandidatos(): string[] {
    if (process.platform === 'win32') {
        return [`${NOMBRE_BINARIO}.exe`, `${NOMBRE_BINARIO}.cmd`, NOMBRE_BINARIO];
    }
    return [NOMBRE_BINARIO];
}

function buscarEnDirectorio(directorio: string): string | undefined {
    for (const nombre of nombresCandidatos()) {
        const candidato = path.join(directorio, nombre);
        if (esEjecutable(candidato)) {
            return candidato;
        }
    }
    return undefined;
}

function esEjecutable(ruta: string): boolean {
    try {
        const estado = fs.statSync(ruta);
        if (!estado.isFile()) {
            return false;
        }
        if (process.platform === 'win32') {
            return true;
        }
        fs.accessSync(ruta, fs.constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

function normalizarDirectorio(directorio: string): string {
    try {
        const resuelto = path.resolve(directorio);
        return process.platform === 'win32' ? resuelto.toLowerCase() : resuelto;
    } catch {
        return directorio;
    }
}
