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
    try {
        if (fs.statSync(ruta).isDirectory()) {
            return buscarEnDirectorio(ruta);
        }
    } catch {
        // La ruta no existe todavía; se prueban sufijos de Windows más abajo.
    }

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
    directorios.push(...directoriosCargoCercanos());
    return directorios;
}

function directoriosCargoCercanos(): string[] {
    const raices = new Set<string>();
    for (const carpeta of vscode.workspace.workspaceFolders ?? []) {
        raices.add(carpeta.uri.fsPath);
        raices.add(path.dirname(carpeta.uri.fsPath));
    }
    for (const documento of vscode.workspace.textDocuments) {
        if (documento.uri.scheme === 'file') {
            raices.add(path.dirname(documento.uri.fsPath));
        }
    }

    const directorios: string[] = [];
    for (const raiz of raices) {
        directorios.push(...directoriosCargoDesde(raiz));
    }
    return directorios;
}

function directoriosCargoDesde(inicio: string): string[] {
    const directorios: string[] = [];
    let actual = path.resolve(inicio);
    for (let i = 0; i < 8; i++) {
        directorios.push(path.join(actual, 'target', 'release'));
        directorios.push(path.join(actual, 'target', 'debug'));
        directorios.push(path.join(actual, 'lenguaje-quetzal', 'target', 'release'));
        directorios.push(path.join(actual, 'lenguaje-quetzal', 'target', 'debug'));
        const padre = path.dirname(actual);
        if (padre === actual) {
            break;
        }
        actual = padre;
    }
    return directorios;
}

function rutasHabituales(): string[] {
    switch (process.platform) {
        case 'win32':
            return rutasWindows();
        case 'darwin':
            return rutasMacos();
        default:
            return rutasUnix();
    }
}

function prefijosConBin(prefijos: string[]): string[] {
    const directorios: string[] = [];
    for (const prefijo of prefijos) {
        directorios.push(prefijo, path.join(prefijo, 'bin'));
    }
    return directorios;
}

function rutasWindows(): string[] {
    const hogar = os.homedir();
    const local = process.env.LOCALAPPDATA || path.join(hogar, 'AppData', 'Local');
    const roaming = process.env.APPDATA || path.join(hogar, 'AppData', 'Roaming');
    const unidad = process.env.SystemDrive || 'C:';
    const programFiles = process.env.ProgramFiles || `${unidad}\\Program Files`;
    const programFilesX86 = process.env['ProgramFiles(x86)'] || `${unidad}\\Program Files (x86)`;

    return [
        path.join(hogar, '.cargo', 'bin'),
        path.join(hogar, '.local', 'bin'),
        path.join(hogar, 'scoop', 'shims'),
        `${unidad}\\ProgramData\\chocolatey\\bin`,
        ...prefijosConBin([
            `${unidad}\\quetzal`,
            path.join(hogar, 'quetzal'),
            path.join(local, 'quetzal'),
            path.join(local, 'Programs', 'quetzal'),
            path.join(local, 'Programs', 'Quetzal'),
            path.join(roaming, 'quetzal'),
            path.join(programFiles, 'Quetzal'),
            path.join(programFiles, 'quetzal'),
            path.join(programFilesX86, 'Quetzal'),
            path.join(hogar, 'scoop', 'apps', 'quetzal', 'current'),
        ]),
    ];
}

function rutasUnix(): string[] {
    const hogar = os.homedir();
    const datos = process.env.XDG_DATA_HOME || path.join(hogar, '.local', 'share');
    const binUsuario = process.env.XDG_BIN_HOME || path.join(hogar, '.local', 'bin');
    return [
        binUsuario,
        path.join(hogar, '.cargo', 'bin'),
        path.join(hogar, 'bin'),
        '/usr/local/bin',
        '/usr/bin',
        ...prefijosConBin([
            path.join(hogar, 'quetzal'),
            path.join(datos, 'quetzal'),
            '/opt/quetzal',
            '/usr/local/quetzal',
        ]),
    ];
}

function rutasMacos(): string[] {
    const hogar = os.homedir();
    return [
        ...rutasUnix(),
        '/opt/homebrew/bin',
        '/usr/local/opt/quetzal/bin',
        '/opt/homebrew/opt/quetzal/bin',
        ...prefijosConBin([
            '/Applications/Quetzal.app/Contents/MacOS',
            path.join(hogar, 'Applications', 'Quetzal.app', 'Contents', 'MacOS'),
        ]),
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
