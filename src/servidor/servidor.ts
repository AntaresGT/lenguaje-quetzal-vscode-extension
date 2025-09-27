import {
    CompletionItem,
    CompletionItemKind,
    CompletionItemTag,
    CompletionParams,
    FileChangeType,
    InsertTextFormat,
    InitializeParams,
    InitializeResult,
    Position,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind,
    createConnection
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import {
    DefinicionPalabra,
    FORMATO_SNIPPET,
    FUNCIONES_DEPRECADAS,
    METODOS_PREDEFINIDOS,
    PALABRAS_RESERVADAS,
    TIPOS_BÁSICOS
} from './datos_base';
import {
    AnalisisDocumento,
    ExportacionAnalizada,
    FuncionAnalizada,
    ImportacionAnalizada,
    ObjetoAnalizado,
    VariableAnalizada,
    analizarTextoQuetzal
} from './analizador';

const connection = createConnection(ProposedFeatures.all);
const documentos = new TextDocuments(TextDocument);

const IDENTIFICADOR_REGEX = String.raw`[\p{L}_][\p{L}\p{N}_]*`;

type OrigenArchivo = 'usuario' | 'ejemplo';

interface RegistroAnalisis {
    ruta: string;
    analisis: AnalisisDocumento;
}

interface ConocimientoGlobal {
    funciones: Map<string, FuncionAnalizada>;
    objetos: Map<string, ObjetoAnalizado>;
    variables: Map<string, VariableAnalizada>;
    exportaciones: Map<string, ExportacionAnalizada[]>;
}

const conocimientoEjemplos: ConocimientoGlobal = {
    funciones: new Map(),
    objetos: new Map(),
    variables: new Map(),
    exportaciones: new Map()
};

const archivosUsuario = new Map<string, RegistroAnalisis>();
let carpetasTrabajo: string[] = [];
let rutaEjemplos: string | undefined;

function uriAPathFs(uri: string): string {
    try {
        if (uri.startsWith('file://')) {
            return fileURLToPath(uri);
        }
    } catch (error) {
        connection.console.error(`No se pudo convertir URI a ruta: ${uri}`);
    }
    return uri;
}

function esQuetzal(ruta: string): boolean {
    return ruta.toLowerCase().endsWith('.qz');
}

async function listarArchivosQuetzal(carpeta: string): Promise<string[]> {
    const resultado: string[] = [];
    try {
        const entradas = await fs.promises.readdir(carpeta, { withFileTypes: true });
        for (const entrada of entradas) {
            if (entrada.name === 'node_modules' || entrada.name === '.git' || entrada.name === 'out') {
                continue;
            }
            const rutaCompleta = path.join(carpeta, entrada.name);
            if (entrada.isDirectory()) {
                const internos = await listarArchivosQuetzal(rutaCompleta);
                resultado.push(...internos);
            } else if (entrada.isFile() && esQuetzal(entrada.name)) {
                resultado.push(path.normalize(rutaCompleta));
            }
        }
    } catch (error) {
        connection.console.warn(`No se pudo listar carpeta ${carpeta}: ${String(error)}`);
    }
    return resultado;
}

async function cargarEjemplosDesdeCarpeta(carpeta: string): Promise<void> {
    try {
        const archivos = await listarArchivosQuetzal(carpeta);
        for (const archivo of archivos) {
            await registrarAnalisis(archivo, 'ejemplo');
        }
    } catch (error) {
        connection.console.warn(`No se pudieron cargar ejemplos desde ${carpeta}: ${String(error)}`);
    }
}

async function cargarArchivosUsuario(): Promise<void> {
    archivosUsuario.clear();
    for (const carpeta of carpetasTrabajo) {
        const archivos = await listarArchivosQuetzal(carpeta);
        for (const archivo of archivos) {
            await registrarAnalisis(archivo, 'usuario');
        }
    }
}

async function registrarAnalisis(ruta: string, origen: OrigenArchivo, contenido?: string): Promise<void> {
    try {
        const texto = contenido ?? await fs.promises.readFile(ruta, 'utf8');
        const analisis = analizarTextoQuetzal(texto);
        const registro: RegistroAnalisis = { ruta: path.normalize(ruta), analisis };
        if (origen === 'usuario') {
            archivosUsuario.set(registro.ruta, registro);
        } else {
            agregarAnalisisEjemplo(registro);
        }
    } catch (error) {
        connection.console.warn(`No se pudo analizar ${ruta}: ${String(error)}`);
    }
}

function agregarAnalisisEjemplo(registro: RegistroAnalisis): void {
    const { analisis, ruta } = registro;
    for (const funcion of analisis.funciones) {
        if (!conocimientoEjemplos.funciones.has(funcion.nombre)) {
            conocimientoEjemplos.funciones.set(funcion.nombre, funcion);
        }
    }
    for (const objeto of analisis.objetos) {
        if (!conocimientoEjemplos.objetos.has(objeto.nombre)) {
            conocimientoEjemplos.objetos.set(objeto.nombre, objeto);
        }
    }
    for (const variable of analisis.variables) {
        if (!conocimientoEjemplos.variables.has(variable.nombre)) {
            conocimientoEjemplos.variables.set(variable.nombre, variable);
        }
    }
    const rutaBase = rutaEjemplos ?? path.dirname(ruta);
    const relativa = path.relative(rutaBase, ruta).replace(/\\/g, '/');
    const baseNombre = path.basename(ruta);
    const baseSinExtension = path.basename(ruta, '.qz');
    const claves = new Set<string>([
        relativa,
        baseNombre,
        `./${baseNombre}`,
        baseSinExtension,
        `./${baseSinExtension}`
    ]);
    for (const clave of claves) {
        if (clave.length > 0) {
            conocimientoEjemplos.exportaciones.set(clave, analisis.exportaciones);
        }
    }
}

function obtenerLinea(documento: TextDocument, indice: number): string {
    const texto = documento.getText();
    const lineas = texto.split(/\r?\n/);
    return lineas[indice] ?? '';
}

function extraerPrefijoGeneral(documento: TextDocument, posicion: Position): string {
    const linea = obtenerLinea(documento, posicion.line);
    const antes = linea.slice(0, posicion.character);
    const coincidencia = antes.match(/([\p{L}\p{N}_]+)$/u);
    return coincidencia ? coincidencia[1] : '';
}

function detectarContextoMetodo(documento: TextDocument, posicion: Position): { identificador: string; prefijo: string } | null {
    const linea = obtenerLinea(documento, posicion.line);
    const antes = linea.slice(0, posicion.character);
    const coincidencia = antes.match(new RegExp(String.raw`(${IDENTIFICADOR_REGEX})\.(\p{L}?[\p{L}\p{N}_]*)$`, 'u'));
    if (!coincidencia) {
        return null;
    }
    return { identificador: coincidencia[1], prefijo: coincidencia[2] ?? '' };
}

function detectarContextoImportacion(documento: TextDocument, posicion: Position): { modulo: string; prefijo: string } | null {
    const texto = documento.getText();
    const offset = documento.offsetAt(posicion);
    const hastaCursor = texto.slice(0, offset);
    const indiceImportar = hastaCursor.lastIndexOf('importar');
    if (indiceImportar === -1) {
        return null;
    }
    const indiceLlave = texto.indexOf('{', indiceImportar);
    if (indiceLlave === -1 || indiceLlave > offset) {
        return null;
    }
    const indiceCierre = texto.indexOf('}', indiceLlave);
    if (indiceCierre === -1 || offset > indiceCierre) {
        return null;
    }
    const textoTrasCierre = texto.slice(indiceCierre, Math.min(texto.length, indiceCierre + 200));
    const coincidenciaDesde = textoTrasCierre.match(/\}\s*desde\s*"([^"]+)"/);
    if (!coincidenciaDesde) {
        return null;
    }
    const modulo = coincidenciaDesde[1];
    const dentro = texto.slice(indiceLlave + 1, offset);
    const partes = dentro.split(/[,\n]/);
    const ultimo = partes[partes.length - 1] ?? '';
    const prefijo = ultimo.trim().split(/\s+/).pop() ?? '';
    return { modulo, prefijo };
}

function detectarContextoRutaModulo(documento: TextDocument, posicion: Position): { prefijo: string } | null {
    const linea = obtenerLinea(documento, posicion.line);
    const antes = linea.slice(0, posicion.character);
    const coincidencia = antes.match(/desde\s+"([^"}]*)$/);
    if (!coincidencia) {
        return null;
    }
    return { prefijo: coincidencia[1] };
}

function filtrarPorPrefijo(items: CompletionItem[], prefijo: string): CompletionItem[] {
    if (!prefijo) {
        return items;
    }
    const prefijoMin = prefijo.toLowerCase();
    return items.filter(item => item.label.toString().toLowerCase().startsWith(prefijoMin));
}

function crearItemDesdePalabra(palabra: DefinicionPalabra): CompletionItem {
    const item: CompletionItem = {
        label: palabra.etiqueta,
        kind: palabra.tipo,
        detail: palabra.descripcion
    };
    if (palabra.snippet) {
        item.insertText = palabra.snippet;
        item.insertTextFormat = FORMATO_SNIPPET;
    }
    if (FUNCIONES_DEPRECADAS.includes(palabra)) {
        item.tags = [CompletionItemTag.Deprecated];
    }
    return item;
}

function crearItemFuncion(funcion: FuncionAnalizada, detalle: string): CompletionItem {
    const item: CompletionItem = {
        label: funcion.nombre,
        kind: CompletionItemKind.Function,
        detail: detalle
    };
    if (funcion.parametros.length > 0) {
        const partes = funcion.parametros.map((parametro, indice) => '${' + (indice + 1) + ':' + parametro + '}');
        item.insertText = `${funcion.nombre}(${partes.join(', ')})`;
        item.insertTextFormat = InsertTextFormat.Snippet;
    } else {
        item.insertText = `${funcion.nombre}()`;
        item.insertTextFormat = InsertTextFormat.Snippet;
    }
    return item;
}

function crearItemVariable(nombre: string, tipo: string | undefined, clase: CompletionItemKind): CompletionItem {
    const item: CompletionItem = {
        label: nombre,
        kind: clase
    };
    if (tipo) {
        item.detail = `Tipo: ${tipo}`;
    }
    return item;
}

function agregarItem(lista: CompletionItem[], mapaEtiquetas: Set<string>, item: CompletionItem): void {
    const clave = `${item.label}|${item.kind}`;
    if (!mapaEtiquetas.has(clave)) {
        mapaEtiquetas.add(clave);
        lista.push(item);
    }
}

function normalizarTipoBase(tipo?: string): string | undefined {
    if (!tipo) {
        return undefined;
    }
    const limpio = tipo.trim().toLowerCase();
    if (limpio.startsWith('lista')) {
        return 'lista';
    }
    if (limpio.includes('<')) {
        return limpio.split('<')[0]?.trim();
    }
    if (limpio === 'numero' || limpio === 'número') {
        return 'numero';
    }
    return limpio;
}

function obtenerExportacionesDeModulo(modulo: string, documento: TextDocument): ExportacionAnalizada[] | undefined {
    if (conocimientoEjemplos.exportaciones.has(modulo)) {
        return conocimientoEjemplos.exportaciones.get(modulo);
    }
    const rutaDocumento = path.normalize(uriAPathFs(documento.uri));
    const directorio = path.dirname(rutaDocumento);
    const posiblesRutas: string[] = [];
    if (path.isAbsolute(modulo)) {
        posiblesRutas.push(path.normalize(modulo));
        if (!modulo.endsWith('.qz')) {
            posiblesRutas.push(path.normalize(`${modulo}.qz`));
        }
    } else {
        posiblesRutas.push(path.normalize(path.resolve(directorio, modulo)));
        if (!modulo.endsWith('.qz')) {
            posiblesRutas.push(path.normalize(path.resolve(directorio, `${modulo}.qz`)));
        }
        for (const carpeta of carpetasTrabajo) {
            posiblesRutas.push(path.normalize(path.resolve(carpeta, modulo)));
            if (!modulo.endsWith('.qz')) {
                posiblesRutas.push(path.normalize(path.resolve(carpeta, `${modulo}.qz`)));
            }
        }
    }
    for (const ruta of posiblesRutas) {
        const registro = archivosUsuario.get(ruta);
        if (registro) {
            return registro.analisis.exportaciones;
        }
    }
    return undefined;
}

function obtenerTipoImportado(nombre: string, analisis: AnalisisDocumento, documento: TextDocument): string | undefined {
    for (const importacion of analisis.importaciones) {
        for (const elemento of importacion.elementos) {
            const alias = elemento.alias ?? elemento.nombre;
            if (alias === nombre) {
                const exportaciones = obtenerExportacionesDeModulo(importacion.modulo, documento);
                if (exportaciones) {
                    const encontrado = exportaciones.find(exp => exp.nombre === elemento.nombre);
                    if (encontrado?.tipo) {
                        return encontrado.tipo;
                    }
                }
            }
        }
    }
    return undefined;
}

function sugerirMetodos(documento: TextDocument, analisis: AnalisisDocumento, identificador: string): CompletionItem[] {
    let tipo = analisis.identificadores.get(identificador);
    if (!tipo) {
        tipo = obtenerTipoImportado(identificador, analisis, documento);
    }
    if (!tipo && identificador === 'consola') {
        tipo = 'consola';
    }
    const base = normalizarTipoBase(tipo);
    if (!base) {
        return [];
    }
    const definiciones = METODOS_PREDEFINIDOS[base];
    if (!definiciones) {
        return [];
    }
    return definiciones.map(definicion => {
        const item: CompletionItem = {
            label: definicion.nombre,
            kind: CompletionItemKind.Method,
            detail: definicion.retorno ? `Retorna ${definicion.retorno}` : 'Método'
        };
        const insertable = definicion.snippet ?? definicion.nombre;
        item.insertText = insertable;
        item.insertTextFormat = InsertTextFormat.Snippet;
        return item;
    });
}

function sugerirElementosImportacion(documento: TextDocument, modulo: string): CompletionItem[] {
    const exportaciones = obtenerExportacionesDeModulo(modulo, documento);
    if (!exportaciones) {
        return [];
    }
    return exportaciones.map(exp => {
        const item: CompletionItem = {
            label: exp.nombre,
            kind: CompletionItemKind.Reference,
            detail: exp.tipo ? `Exportado (${exp.tipo})` : 'Exportado'
        };
        item.insertText = exp.nombre;
        return item;
    });
}

function sugerirRutasModulo(documento: TextDocument, prefijo: string): CompletionItem[] {
    const rutaDocumento = path.normalize(uriAPathFs(documento.uri));
    const directorio = path.dirname(rutaDocumento);
    const items: CompletionItem[] = [];
    const agregados = new Set<string>();
    for (const registro of archivosUsuario.values()) {
        const relativa = path.relative(directorio, registro.ruta).replace(/\\/g, '/');
        let sugerencia = relativa;
        if (!sugerencia.startsWith('.')) {
            sugerencia = `./${sugerencia}`;
        }
        if (!sugerencia.toLowerCase().endsWith('.qz')) {
            sugerencia += '.qz';
        }
        if (!prefijo || sugerencia.startsWith(prefijo)) {
            if (!agregados.has(sugerencia)) {
                agregados.add(sugerencia);
                items.push({
                    label: sugerencia,
                    kind: CompletionItemKind.File,
                    insertText: sugerencia
                });
            }
        }
    }
    for (const [clave] of conocimientoEjemplos.exportaciones) {
        if (!prefijo || clave.startsWith(prefijo)) {
            if (!agregados.has(clave)) {
                agregados.add(clave);
                items.push({
                    label: clave,
                    kind: CompletionItemKind.File,
                    insertText: clave
                });
            }
        }
    }
    return items;
}

function generarCompletadosGenerales(analisis: AnalisisDocumento): CompletionItem[] {
    const items: CompletionItem[] = [];
    const agregados = new Set<string>();

    for (const palabra of PALABRAS_RESERVADAS) {
        agregarItem(items, agregados, crearItemDesdePalabra(palabra));
    }
    for (const tipo of TIPOS_BÁSICOS) {
        agregarItem(items, agregados, crearItemDesdePalabra(tipo));
    }
    for (const dep of FUNCIONES_DEPRECADAS) {
        agregarItem(items, agregados, crearItemDesdePalabra(dep));
    }

    for (const funcion of conocimientoEjemplos.funciones.values()) {
        agregarItem(items, agregados, crearItemFuncion(funcion, 'Función de ejemplo'));
    }

    for (const funcion of analisis.funciones) {
        agregarItem(items, agregados, crearItemFuncion(funcion, funcion.tipoRetorno ? `Función (${funcion.tipoRetorno})` : 'Función'));
    }

    for (const variable of analisis.variables) {
        agregarItem(items, agregados, crearItemVariable(variable.nombre, variable.tipo, CompletionItemKind.Variable));
    }

    for (const objeto of analisis.objetos) {
        agregarItem(items, agregados, crearItemVariable(objeto.nombre, 'Objeto', CompletionItemKind.Class));
    }

    for (const importacion of analisis.importaciones) {
        for (const elemento of importacion.elementos) {
            agregarItem(items, agregados, crearItemVariable(elemento.alias ?? elemento.nombre, undefined, CompletionItemKind.Reference));
        }
    }

    for (const registro of archivosUsuario.values()) {
        for (const funcion of registro.analisis.funciones) {
            agregarItem(items, agregados, crearItemFuncion(funcion, 'Función del proyecto'));
        }
    }

    return items;
}

connection.onInitialize(async (params: InitializeParams): Promise<InitializeResult> => {
    carpetasTrabajo = (params.workspaceFolders ?? []).map(folder => path.normalize(uriAPathFs(folder.uri)));
    rutaEjemplos = params.initializationOptions?.rutaEjemplos;
    if (rutaEjemplos) {
        await cargarEjemplosDesdeCarpeta(rutaEjemplos);
    }
    await cargarArchivosUsuario();

    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: false,
                triggerCharacters: ['.', '{', '"']
            }
        }
    };
});

connection.onCompletion((params: CompletionParams): CompletionItem[] => {
    const documento = documentos.get(params.textDocument.uri);
    if (!documento) {
        return [];
    }
    const analisis = analizarTextoQuetzal(documento.getText());

    const contextoMetodo = detectarContextoMetodo(documento, params.position);
    if (contextoMetodo) {
        const metodos = sugerirMetodos(documento, analisis, contextoMetodo.identificador);
        return filtrarPorPrefijo(metodos, contextoMetodo.prefijo);
    }

    const contextoImportacion = detectarContextoImportacion(documento, params.position);
    if (contextoImportacion) {
        const elementos = sugerirElementosImportacion(documento, contextoImportacion.modulo);
        return filtrarPorPrefijo(elementos, contextoImportacion.prefijo);
    }

    const contextoRuta = detectarContextoRutaModulo(documento, params.position);
    if (contextoRuta) {
        return sugerirRutasModulo(documento, contextoRuta.prefijo);
    }

    const prefijo = extraerPrefijoGeneral(documento, params.position);
    const items = generarCompletadosGenerales(analisis);
    return filtrarPorPrefijo(items, prefijo);
});

documentos.onDidOpen(async evento => {
    const ruta = uriAPathFs(evento.document.uri);
    if (esQuetzal(ruta)) {
        await registrarAnalisis(path.normalize(ruta), 'usuario', evento.document.getText());
    }
});

documentos.onDidChangeContent(async evento => {
    const ruta = uriAPathFs(evento.document.uri);
    if (esQuetzal(ruta)) {
        await registrarAnalisis(path.normalize(ruta), 'usuario', evento.document.getText());
    }
});

documentos.onDidClose(async evento => {
    const ruta = uriAPathFs(evento.document.uri);
    if (esQuetzal(ruta)) {
        if (fs.existsSync(ruta)) {
            await registrarAnalisis(path.normalize(ruta), 'usuario');
        } else {
            archivosUsuario.delete(path.normalize(ruta));
        }
    }
});

connection.onDidChangeWatchedFiles(async evento => {
    for (const cambio of evento.changes) {
        const ruta = path.normalize(uriAPathFs(cambio.uri));
        if (!esQuetzal(ruta)) {
            continue;
        }
        if (cambio.type === FileChangeType.Deleted) {
            archivosUsuario.delete(ruta);
            continue;
        }
        await registrarAnalisis(ruta, 'usuario');
    }
});

documentos.listen(connection);
connection.listen();
