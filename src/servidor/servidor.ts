import {
    CompletionItem,
    CompletionItemKind,
    CompletionItemTag,
    CompletionParams,
    FileChangeType,
    Hover,
    HoverParams,
    InsertTextFormat,
    InitializeParams,
    InitializeResult,
    MarkupKind,
    Position,
    ProposedFeatures,
    SemanticTokens,
    SemanticTokensBuilder,
    SemanticTokensParams,
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
import { fusionarMiembros } from '../compartido/objetos';
import {
    AnalisisDocumento,
    ExportacionAnalizada,
    FuncionAnalizada,
    ImportacionAnalizada,
    MiembroObjetoAnalizado,
    ObjetoAnalizado,
    VariableAnalizada,
    analizarTextoQuetzal
} from './analizador';
import {
    MODULOS_NATIVOS,
    MiembroNativo,
    ModuloNativo,
    SimboloNativo,
    obtenerModuloNativo,
    obtenerSimboloNativo
} from './modulos_nativos';

const connection = createConnection(ProposedFeatures.all);
const documentos = new TextDocuments(TextDocument);

const IDENTIFICADOR_REGEX = String.raw`[\p{L}_][\p{L}\p{N}_]*`;
const DOCUMENTACION_BASE = 'https://lenguaje-quetzal.com';
const LEYENDA_SEMANTICA = {
    tokenTypes: ['class', 'function', 'method', 'variable', 'parameter', 'property'],
    tokenModifiers: []
};
const INDICES_TOKENS_SEMANTICOS = new Map(
    LEYENDA_SEMANTICA.tokenTypes.map((tipo, indice) => [tipo, indice])
);

function documentacionMarkdown(
    titulo: string,
    descripcion: string,
    firma?: string,
    enlace?: string
) {
    const partes = [`**${titulo}**`, '', descripcion];
    if (firma) {
        partes.push('', '```qz', firma, '```');
    }
    if (enlace) {
        partes.push('', `[Abrir documentación oficial](${enlace})`);
    }
    return { kind: MarkupKind.Markdown, value: partes.join('\n') };
}

function enlaceParaPalabra(etiqueta: string): string {
    if (['si', 'sino'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/control/condicionales/`;
    if (['mientras', 'para', 'hacer', 'en', 'cada'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/control/bucles/`;
    if (['romper', 'continuar', 'retornar'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/control/flujo/`;
    if (['intentar', 'capturar', 'atrapar', 'finalmente'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/errores/try-catch/`;
    if (['lanzar', 'excepcion', 'excepción'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/errores/excepciones/`;
    if (['importar', 'exportar', 'desde', 'como'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/modulos/importar-exportar/`;
    if (['objeto', 'nuevo', 'ambiente', 'padre'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/oop/clases-objetos/`;
    if (['prototipo', 'implementa', 'opcional'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/oop/prototipos/`;
    if (['publico', 'público', 'privado', 'libre'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/oop/modificadores-acceso/`;
    if (['asincrono', 'asíncrono', 'esperar'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/funciones/asincronas/`;
    if (['entero', 'numero', 'número', 'texto', 'log', 'lista', 'jsn', 'vacio', 'vacío', 'nulo'].includes(etiqueta)) return `${DOCUMENTACION_BASE}/fundamentos/tipos-datos/`;
    return `${DOCUMENTACION_BASE}/referencia/palabras-reservadas/`;
}

type OrigenArchivo = 'usuario' | 'ejemplo';

interface RegistroAnalisis {
    ruta: string;
    analisis: AnalisisDocumento;
    version?: number;
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

const DIRECTORIOS_IGNORADOS = new Set([
    '.agents', '.git', '.quetzal', '.vscode', '.vscode-test', 'node_modules', 'out',
    'dist', 'build', 'target', 'coverage'
]);

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
            if (entrada.isDirectory() && DIRECTORIOS_IGNORADOS.has(entrada.name)) {
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
        const existente = conocimientoEjemplos.objetos.get(objeto.nombre);
        if (existente) {
            fusionarMiembros(existente, objeto);
        } else {
            conocimientoEjemplos.objetos.set(objeto.nombre, {
                nombre: objeto.nombre,
                miembros: objeto.miembros.map(miembro => ({
                    ...miembro,
                    parametros: miembro.parametros ? [...miembro.parametros] : undefined
                }))
            });
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

function detectarContextoMetodo(documento: TextDocument, posicion: Position): { expresion: string; prefijo: string } | null {
    const linea = obtenerLinea(documento, posicion.line);
    const antes = linea.slice(0, posicion.character);
    const coincidencia = antes.match(new RegExp(String.raw`([^\s=;,{}]+)\.(\p{L}?[\p{L}\p{N}_]*)$`, 'u'));
    if (!coincidencia) {
        return null;
    }
    return { expresion: coincidencia[1], prefijo: coincidencia[2] ?? '' };
}

function obtenerAnalisisDocumento(documento: TextDocument): AnalisisDocumento {
    const ruta = path.normalize(uriAPathFs(documento.uri));
    const existente = archivosUsuario.get(ruta);
    if (existente?.version === documento.version) {
        return existente.analisis;
    }

    const analisis = analizarTextoQuetzal(documento.getText());
    archivosUsuario.set(ruta, { ruta, analisis, version: documento.version });
    return analisis;
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
    const enlace = palabra.documentacion ?? enlaceParaPalabra(palabra.etiqueta);
    const item: CompletionItem = {
        label: palabra.etiqueta,
        kind: palabra.tipo,
        detail: palabra.descripcion,
        documentation: documentacionMarkdown(
            palabra.etiqueta,
            palabra.descripcion,
            palabra.ejemplo?.replace(/\$\{\d+:([^}]+)\}/g, '$1'),
            enlace
        )
    };
    const snippet = palabra.ejemplo ?? palabra.snippet;
    if (snippet) {
        item.insertText = snippet;
        item.insertTextFormat = FORMATO_SNIPPET;
    }
    if (FUNCIONES_DEPRECADAS.includes(palabra)) {
        item.tags = [CompletionItemTag.Deprecated];
    }
    return item;
}

function crearItemFuncion(funcion: FuncionAnalizada, detalle: string): CompletionItem {
    const firma = `${funcion.tipoRetorno ?? 'valor'} ${funcion.nombre}(${funcion.parametros.join(', ')})`;
    const item: CompletionItem = {
        label: funcion.nombre,
        kind: CompletionItemKind.Function,
        detail: detalle,
        documentation: documentacionMarkdown(
            funcion.nombre,
            funcion.documentacion ?? `${detalle}. Parámetros inferidos desde código Quetzal del proyecto.`,
            firma,
            `${DOCUMENTACION_BASE}/funciones/definicion/`
        )
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
        item.documentation = documentacionMarkdown(
            nombre,
            `Símbolo disponible con tipo \`${tipo}\`.`,
            `${tipo} ${nombre}`,
            `${DOCUMENTACION_BASE}/fundamentos/variables-constantes/`
        );
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

function extraerNombreObjeto(tipo?: string): string | undefined {
    if (!tipo) {
        return undefined;
    }
    const limpio = tipo.trim();
    if (!limpio || limpio.includes('<') || limpio.includes('.')) {
        return undefined;
    }
    if (!/^[A-Z]/u.test(limpio)) {
        return undefined;
    }
    if (!new RegExp(`^${IDENTIFICADOR_REGEX}$`, 'u').test(limpio)) {
        return undefined;
    }
    return limpio;
}

function obtenerObjetoDesdeAnalisis(analisis: AnalisisDocumento, nombre: string): ObjetoAnalizado | undefined {
    return analisis.objetos.find(obj => obj.nombre === nombre);
}

function obtenerObjetoDefinido(nombre: string, analisis: AnalisisDocumento): ObjetoAnalizado | undefined {
    const local = obtenerObjetoDesdeAnalisis(analisis, nombre);
    if (local) {
        return local;
    }
    for (const registro of archivosUsuario.values()) {
        const encontrado = registro.analisis.objetos.find(obj => obj.nombre === nombre);
        if (encontrado) {
            return encontrado;
        }
    }
    return conocimientoEjemplos.objetos.get(nombre);
}

function crearItemMiembroObjeto(
    objeto: ObjetoAnalizado,
    miembro: MiembroObjetoAnalizado,
    esEstatico: boolean
): CompletionItem {
    const detalleBase = esEstatico ? `Miembro libre de ${objeto.nombre}` : `Miembro de ${objeto.nombre}`;
    if (miembro.clase === 'metodo') {
        const parametros = miembro.parametros ?? [];
        const placeholders = parametros
            .map((parametro, indice) => '${' + (indice + 1) + ':' + parametro + '}')
            .join(', ');
        const insertable = parametros.length
            ? `${miembro.nombre}(${placeholders})`
            : `${miembro.nombre}()`;
        const item: CompletionItem = {
            label: miembro.nombre,
            kind: CompletionItemKind.Method,
            detail: miembro.retorno ? `${detalleBase} → ${miembro.retorno}` : detalleBase,
            insertText: insertable,
            insertTextFormat: InsertTextFormat.Snippet
        };
        return item;
    }

    const item: CompletionItem = {
        label: miembro.nombre,
        kind: CompletionItemKind.Property,
        detail: miembro.tipo ? `${detalleBase} (${miembro.tipo})` : detalleBase
    };
    return item;
}

function sugerirMiembrosObjeto(objeto: ObjetoAnalizado, esEstatico: boolean): CompletionItem[] {
    return objeto.miembros
        .filter(miembro => miembro.alcance !== 'privado')
        .filter(miembro => (esEstatico ? miembro.esLibre : !miembro.esLibre))
        .filter(miembro => miembro.clase !== 'constructor')
        .map(miembro => crearItemMiembroObjeto(objeto, miembro, esEstatico));
}

function detectarContextoNuevo(documento: TextDocument, posicion: Position): { prefijo: string } | null {
    const linea = obtenerLinea(documento, posicion.line);
    const antes = linea.slice(0, posicion.character);
    const coincidencia = antes.match(new RegExp(String.raw`\bnuevo\s+(${IDENTIFICADOR_REGEX})?$`, 'u'));
    return coincidencia ? { prefijo: coincidencia[1] ?? '' } : null;
}

function crearItemMiembroNativo(
    modulo: ModuloNativo,
    simbolo: SimboloNativo,
    miembro: MiembroNativo
): CompletionItem {
    const parametros = miembro.parametros ?? [];
    const firma = miembro.propiedad
        ? `${simbolo.nombre}.${miembro.nombre}: ${miembro.retorno ?? 'valor'}`
        : `${simbolo.nombre}.${miembro.nombre}(${parametros.join(', ')}) -> ${miembro.retorno ?? 'vacío'}`;
    const item: CompletionItem = {
        label: miembro.nombre,
        kind: miembro.propiedad ? CompletionItemKind.Constant : CompletionItemKind.Method,
        detail: miembro.retorno ? `${miembro.descripcion} Retorna ${miembro.retorno}.` : miembro.descripcion,
        documentation: documentacionMarkdown(
            `${simbolo.nombre}.${miembro.nombre}`,
            miembro.descripcion,
            firma,
            modulo.documentacion
        ),
        sortText: miembro.propiedad ? `1_${miembro.nombre}` : `2_${miembro.nombre}`
    };
    if (!miembro.propiedad) {
        const argumentos = parametros.map((parametro, indice) => '${' + (indice + 1) + ':' + parametro + '}');
        item.insertText = `${miembro.nombre}(${argumentos.join(', ')})`;
        item.insertTextFormat = InsertTextFormat.Snippet;
    }
    return item;
}

function obtenerSimboloImportado(
    identificador: string,
    analisis: AnalisisDocumento
): { modulo: ModuloNativo; simbolo: SimboloNativo } | undefined {
    for (const importacion of analisis.importaciones) {
        const modulo = obtenerModuloNativo(importacion.modulo);
        if (!modulo) continue;
        for (const elemento of importacion.elementos) {
            if ((elemento.alias ?? elemento.nombre) !== identificador) continue;
            const simbolo = modulo.simbolos.find(candidato => candidato.nombre === elemento.nombre);
            if (simbolo) return { modulo, simbolo };
        }
    }
    return undefined;
}

function sugerirMiembrosNativos(
    modulo: ModuloNativo,
    simbolo: SimboloNativo,
    estaticos: boolean
): CompletionItem[] {
    return simbolo.miembros
        .filter(miembro => Boolean(miembro.estatico) === estaticos)
        .map(miembro => crearItemMiembroNativo(modulo, simbolo, miembro));
}

function obtenerExportacionesDeModulo(modulo: string, documento: TextDocument): ExportacionAnalizada[] | undefined {
    const moduloNativo = obtenerModuloNativo(modulo);
    if (moduloNativo) {
        return moduloNativo.simbolos.map(simbolo => ({ nombre: simbolo.nombre, tipo: simbolo.nombre }));
    }
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

function inferirTipoDeCadena(
    documento: TextDocument,
    analisis: AnalisisDocumento,
    expresion: string
): string | undefined {
    const raiz = expresion.match(new RegExp(`^(${IDENTIFICADOR_REGEX})`, 'u'))?.[1];
    if (!raiz) return undefined;

    const importado = obtenerSimboloImportado(raiz, analisis);
    let tipo = importado ? importado.simbolo.nombre : analisis.identificadores.get(raiz);
    if (!tipo) tipo = obtenerTipoImportado(raiz, analisis, documento);
    if (!tipo && raiz === 'consola') tipo = 'consola';

    const llamadas = [...expresion.matchAll(new RegExp(String.raw`\.(${IDENTIFICADOR_REGEX})\s*\(`, 'gu'))];
    let usarEstaticos = Boolean(importado);
    for (const llamada of llamadas) {
        if (!tipo) return undefined;
        const nombreMetodo = llamada[1];
        const nativo = obtenerSimboloNativo(tipo);
        if (nativo) {
            const miembro = nativo.simbolo.miembros.find(candidato =>
                candidato.nombre === nombreMetodo && Boolean(candidato.estatico) === usarEstaticos
            );
            tipo = miembro?.retorno;
            usarEstaticos = false;
            continue;
        }
        const base = normalizarTipoBase(tipo);
        const metodoBase = base
            ? METODOS_PREDEFINIDOS[base]?.find(candidato => candidato.nombre.replace(/\(.*/, '') === nombreMetodo)
            : undefined;
        tipo = metodoBase?.retorno;
        usarEstaticos = false;
    }
    return tipo;
}

function sugerirMetodos(documento: TextDocument, analisis: AnalisisDocumento, expresion: string): CompletionItem[] {
    if (expresion.includes('.')) {
        const tipoCadena = inferirTipoDeCadena(documento, analisis, expresion);
        if (!tipoCadena) return [];
        const nativoCadena = obtenerSimboloNativo(tipoCadena);
        if (nativoCadena) return sugerirMiembrosNativos(nativoCadena.modulo, nativoCadena.simbolo, false);
        const baseCadena = normalizarTipoBase(tipoCadena);
        if (baseCadena && METODOS_PREDEFINIDOS[baseCadena]) {
            return crearItemsMetodosPredefinidos(baseCadena);
        }
        return [];
    }
    const identificador = expresion;
    const nativoImportado = obtenerSimboloImportado(identificador, analisis);
    if (nativoImportado) {
        return sugerirMiembrosNativos(nativoImportado.modulo, nativoImportado.simbolo, true);
    }

    const objetoDirecto = obtenerObjetoDefinido(identificador, analisis);
    if (objetoDirecto) {
        const estaticos = sugerirMiembrosObjeto(objetoDirecto, true);
        if (estaticos.length > 0) {
            return estaticos;
        }
    }

    let tipo = analisis.identificadores.get(identificador);
    if (!tipo) {
        tipo = obtenerTipoImportado(identificador, analisis, documento);
    }
    if (!tipo && identificador === 'consola') {
        tipo = 'consola';
    }

    const nombreObjeto = extraerNombreObjeto(tipo);
    if (nombreObjeto) {
        const nativo = obtenerSimboloNativo(nombreObjeto);
        if (nativo) {
            const miembros = sugerirMiembrosNativos(nativo.modulo, nativo.simbolo, false);
            if (miembros.length > 0) return miembros;
        }
        const objeto = obtenerObjetoDefinido(nombreObjeto, analisis);
        if (objeto) {
            const miembros = sugerirMiembrosObjeto(objeto, false);
            if (miembros.length > 0) {
                return miembros;
            }
        }
    }

    const base = normalizarTipoBase(tipo);
    if (!base) {
        return [];
    }
    return crearItemsMetodosPredefinidos(base);
}

function crearItemsMetodosPredefinidos(base: string): CompletionItem[] {
    const definiciones = METODOS_PREDEFINIDOS[base];
    if (!definiciones) {
        return [];
    }
    return definiciones.map(definicion => {
        const nombre = definicion.nombre.replace(/\(.*/, '');
        const firma = `${base}.${definicion.nombre} -> ${definicion.retorno ?? 'vacío'}`;
        const item: CompletionItem = {
            label: nombre,
            kind: CompletionItemKind.Method,
            detail: definicion.retorno ? `Método de ${base}; retorna ${definicion.retorno}` : `Método de ${base}`,
            documentation: documentacionMarkdown(
                `${base}.${nombre}`,
                `Operación integrada para valores de tipo \`${base}\`.`,
                firma,
                base === 'lista'
                    ? `${DOCUMENTACION_BASE}/datos/listas/`
                    : base === 'jsn'
                        ? `${DOCUMENTACION_BASE}/datos/json/`
                        : `${DOCUMENTACION_BASE}/referencia/funciones-integradas/`
            )
        };
        const insertable = definicion.snippet ?? definicion.nombre;
        item.insertText = insertable;
        item.insertTextFormat = InsertTextFormat.Snippet;
        return item;
    });
}

function sugerirElementosImportacion(documento: TextDocument, modulo: string): CompletionItem[] {
    const moduloNativo = obtenerModuloNativo(modulo);
    if (moduloNativo) {
        return moduloNativo.simbolos.map(simbolo => ({
            label: simbolo.nombre,
            kind: simbolo.constructible ? CompletionItemKind.Class : CompletionItemKind.Module,
            detail: simbolo.descripcion,
            documentation: documentacionMarkdown(
                simbolo.nombre,
                `${simbolo.descripcion} Exportado por \`${moduloNativo.ruta}\`.`,
                `importar { ${simbolo.nombre} } desde "${moduloNativo.ruta}"`,
                moduloNativo.documentacion
            ),
            insertText: simbolo.nombre
        }));
    }
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
    for (const modulo of MODULOS_NATIVOS) {
        const rutas = modulo.ruta === 'quetzal/matemática'
            ? [modulo.ruta, 'quetzal/matematica']
            : [modulo.ruta];
        for (const ruta of rutas) {
            if ((!prefijo || ruta.startsWith(prefijo)) && !agregados.has(ruta)) {
                agregados.add(ruta);
                items.push({
                    label: ruta,
                    kind: CompletionItemKind.Module,
                    detail: modulo.descripcion,
                    documentation: documentacionMarkdown(ruta, modulo.descripcion, undefined, modulo.documentacion),
                    insertText: ruta,
                    sortText: `0_${ruta}`
                });
            }
        }
    }
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

    agregarItem(items, agregados, {
        label: 'consola',
        kind: CompletionItemKind.Module,
        detail: 'Entrada y salida estándar',
        documentation: documentacionMarkdown(
            'consola',
            'Objeto integrado para mostrar mensajes y solicitar datos.',
            'consola.mostrar("Hola")',
            `${DOCUMENTACION_BASE}/io/consola/`
        ),
        sortText: '0_consola'
    });
    agregarItem(items, agregados, {
        label: 'rango',
        kind: CompletionItemKind.Function,
        detail: 'Genera una lista de enteros consecutivos',
        documentation: documentacionMarkdown(
            'rango',
            'Con un argumento genera desde 0; con dos usa inicio y fin. El fin no se incluye.',
            'rango(inicio, fin) -> lista<entero>',
            `${DOCUMENTACION_BASE}/datos/listas/`
        ),
        insertText: 'rango(${1:inicio}, ${2:fin})',
        insertTextFormat: InsertTextFormat.Snippet,
        sortText: '0_rango'
    });

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
            const etiqueta = elemento.alias ?? elemento.nombre;
            const moduloNativo = obtenerModuloNativo(importacion.modulo);
            const simboloNativo = moduloNativo?.simbolos.find(simbolo => simbolo.nombre === elemento.nombre);
            if (moduloNativo && simboloNativo) {
                agregarItem(items, agregados, {
                    label: etiqueta,
                    kind: simboloNativo.constructible ? CompletionItemKind.Class : CompletionItemKind.Module,
                    detail: `${simboloNativo.descripcion} Importado de ${moduloNativo.ruta}.`,
                    documentation: documentacionMarkdown(
                        etiqueta,
                        simboloNativo.descripcion,
                        `importar { ${elemento.nombre}${elemento.alias ? ` como ${elemento.alias}` : ''} } desde "${moduloNativo.ruta}"`,
                        moduloNativo.documentacion
                    ),
                    sortText: `0_${etiqueta}`
                });
            } else {
                agregarItem(items, agregados, crearItemVariable(etiqueta, undefined, CompletionItemKind.Reference));
            }
        }
    }

    for (const registro of archivosUsuario.values()) {
        for (const funcion of registro.analisis.funciones) {
            agregarItem(items, agregados, crearItemFuncion(funcion, 'Función del proyecto'));
        }
    }

    return items;
}

function sugerirConstructores(analisis: AnalisisDocumento): CompletionItem[] {
    const items: CompletionItem[] = analisis.objetos.map(objeto => ({
        label: objeto.nombre,
        kind: CompletionItemKind.Constructor,
        detail: `Construir objeto ${objeto.nombre}`,
        documentation: documentacionMarkdown(
            `nuevo ${objeto.nombre}`,
            'Crea una instancia del objeto definido en este archivo.',
            `nuevo ${objeto.nombre}()`,
            `${DOCUMENTACION_BASE}/oop/constructores/`
        ),
        insertText: `${objeto.nombre}($0)`,
        insertTextFormat: InsertTextFormat.Snippet
    }));
    for (const importacion of analisis.importaciones) {
        const modulo = obtenerModuloNativo(importacion.modulo);
        if (!modulo) continue;
        for (const elemento of importacion.elementos) {
            const simbolo = modulo.simbolos.find(candidato => candidato.nombre === elemento.nombre && candidato.constructible);
            if (!simbolo) continue;
            const nombre = elemento.alias ?? elemento.nombre;
            items.push({
                label: nombre,
                kind: CompletionItemKind.Constructor,
                detail: `Construir ${simbolo.descripcion}`,
                documentation: documentacionMarkdown(
                    `nuevo ${nombre}`,
                    simbolo.descripcion,
                    `nuevo ${nombre}(...)`,
                    modulo.documentacion
                ),
                insertText: `${nombre}($0)`,
                insertTextFormat: InsertTextFormat.Snippet
            });
        }
    }
    return items;
}

function obtenerPalabraEnPosicion(documento: TextDocument, posicion: Position): { palabra: string; inicio: number } | undefined {
    const linea = obtenerLinea(documento, posicion.line);
    const antes = linea.slice(0, posicion.character);
    const despues = linea.slice(posicion.character);
    const izquierda = antes.match(/[\p{L}\p{N}_]+$/u)?.[0] ?? '';
    const derecha = despues.match(/^[\p{L}\p{N}_]+/u)?.[0] ?? '';
    const palabra = `${izquierda}${derecha}`;
    return palabra ? { palabra, inicio: posicion.character - izquierda.length } : undefined;
}

function hoverDesdeItem(item: CompletionItem): Hover | null {
    if (!item.documentation) return null;
    const contenido = typeof item.documentation === 'string'
        ? { kind: MarkupKind.Markdown, value: item.documentation }
        : item.documentation;
    return { contents: contenido };
}

function obtenerHover(documento: TextDocument, posicion: Position, analisis: AnalisisDocumento): Hover | null {
    const palabraEnPosicion = obtenerPalabraEnPosicion(documento, posicion);
    if (!palabraEnPosicion) return null;

    const linea = obtenerLinea(documento, posicion.line);
    const antesDePalabra = linea.slice(0, palabraEnPosicion.inicio);
    const expresion = antesDePalabra.match(/([^\s=;,{}]+)\.$/u)?.[1];
    if (expresion) {
        const miembro = sugerirMetodos(documento, analisis, expresion)
            .find(item => item.label === palabraEnPosicion.palabra);
        const hoverMiembro = miembro ? hoverDesdeItem(miembro) : null;
        if (hoverMiembro) return hoverMiembro;
    }

    const comentario = analisis.documentacionSimbolos.get(`simbolo:${palabraEnPosicion.palabra}`);
    const objeto = analisis.objetos.find(candidato => candidato.nombre === palabraEnPosicion.palabra);
    if (comentario && objeto) {
        return {
            contents: documentacionMarkdown(
                objeto.nombre,
                comentario,
                `objeto ${objeto.nombre} { ... }`,
                `${DOCUMENTACION_BASE}/oop/clases-objetos/`
            )
        };
    }

    const item = generarCompletadosGenerales(analisis)
        .find(candidato => candidato.label === palabraEnPosicion.palabra);
    return item ? hoverDesdeItem(item) : null;
}

function obtenerNombresDeClases(analisis: AnalisisDocumento): Set<string> {
    const nombres = new Set<string>(analisis.objetos.map(objeto => objeto.nombre));
    for (const modulo of MODULOS_NATIVOS) {
        for (const simbolo of modulo.simbolos) nombres.add(simbolo.nombre);
    }
    for (const importacion of analisis.importaciones) {
        const modulo = obtenerModuloNativo(importacion.modulo);
        if (!modulo) continue;
        for (const elemento of importacion.elementos) {
            const simbolo = modulo.simbolos.find(candidato => candidato.nombre === elemento.nombre);
            if (simbolo) nombres.add(elemento.alias ?? elemento.nombre);
        }
    }
    return nombres;
}

function construirTokensSemanticos(documento: TextDocument, analisis: AnalisisDocumento): SemanticTokens {
    const builder = new SemanticTokensBuilder();
    const clases = obtenerNombresDeClases(analisis);
    const funciones = new Set(analisis.funciones.map(funcion => funcion.nombre));
    const parametros = new Set(analisis.funciones.flatMap(funcion => funcion.parametros));
    const lineas = documento.getText().split(/\r?\n/);
    let enComentarioBloque = false;

    for (let numeroLinea = 0; numeroLinea < lineas.length; numeroLinea++) {
        const linea = lineas[numeroLinea];
        let columna = 0;
        let enCadena = false;
        let escape = false;

        while (columna < linea.length) {
            const caracter = linea[columna];
            const siguiente = linea[columna + 1];
            if (enComentarioBloque) {
                if (caracter === '*' && siguiente === '/') {
                    enComentarioBloque = false;
                    columna += 2;
                } else {
                    columna++;
                }
                continue;
            }
            if (enCadena) {
                if (!escape && caracter === '"') enCadena = false;
                escape = !escape && caracter === '\\';
                if (caracter !== '\\') escape = false;
                columna++;
                continue;
            }
            if (caracter === '/' && siguiente === '/') break;
            if (caracter === '/' && siguiente === '*') {
                enComentarioBloque = true;
                columna += 2;
                continue;
            }
            if (caracter === '"') {
                enCadena = true;
                columna++;
                continue;
            }

            const coincidencia = linea.slice(columna).match(/^[\p{L}_][\p{L}\p{N}_]*/u);
            if (!coincidencia) {
                columna++;
                continue;
            }
            const palabra = coincidencia[0];
            const fin = columna + palabra.length;
            const antes = linea.slice(0, columna).trimEnd();
            const despues = linea.slice(fin).trimStart();
            let tipo: string | undefined;

            if (clases.has(palabra)) {
                tipo = 'class';
            } else if (antes.endsWith('.')) {
                tipo = despues.startsWith('(') ? 'method' : 'property';
            } else if (funciones.has(palabra)) {
                tipo = 'function';
            } else if (parametros.has(palabra)) {
                tipo = 'parameter';
            } else if (analisis.identificadores.has(palabra) || palabra === 'consola') {
                tipo = 'variable';
            }

            const indiceTipo = tipo ? INDICES_TOKENS_SEMANTICOS.get(tipo) : undefined;
            if (indiceTipo !== undefined) builder.push(numeroLinea, columna, palabra.length, indiceTipo, 0);
            columna = fin;
        }
    }
    return builder.build();
}

connection.onInitialize(async (params: InitializeParams): Promise<InitializeResult> => {
    carpetasTrabajo = (params.workspaceFolders ?? []).map(folder => path.normalize(uriAPathFs(folder.uri)));
    rutaEjemplos = params.initializationOptions?.rutaEjemplos;
    // La indexación global no bloquea sugerencias del archivo que el usuario abre.
    // Los documentos abiertos se analizan de inmediato en sus eventos LSP.
    queueMicrotask(() => {
        void cargarArchivosUsuario();
    });

    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: false,
                triggerCharacters: ['.', '{', '"']
            },
            hoverProvider: true,
            semanticTokensProvider: {
                legend: LEYENDA_SEMANTICA,
                full: true
            }
        }
    };
});

connection.onCompletion((params: CompletionParams): CompletionItem[] => {
    const documento = documentos.get(params.textDocument.uri);
    if (!documento) {
        return [];
    }
    const analisis = obtenerAnalisisDocumento(documento);

    const contextoNuevo = detectarContextoNuevo(documento, params.position);
    if (contextoNuevo) {
        return filtrarPorPrefijo(sugerirConstructores(analisis), contextoNuevo.prefijo);
    }

    const contextoMetodo = detectarContextoMetodo(documento, params.position);
    if (contextoMetodo) {
        const metodos = sugerirMetodos(documento, analisis, contextoMetodo.expresion);
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

connection.onHover((params: HoverParams): Hover | null => {
    const documento = documentos.get(params.textDocument.uri);
    if (!documento) return null;
    return obtenerHover(documento, params.position, obtenerAnalisisDocumento(documento));
});

connection.languages.semanticTokens.on((params: SemanticTokensParams): SemanticTokens => {
    const documento = documentos.get(params.textDocument.uri);
    if (!documento) return { data: [] };
    return construirTokensSemanticos(documento, obtenerAnalisisDocumento(documento));
});

documentos.onDidOpen(async evento => {
    const ruta = uriAPathFs(evento.document.uri);
    if (esQuetzal(ruta)) {
        obtenerAnalisisDocumento(evento.document);
    }
});

documentos.onDidChangeContent(async evento => {
    const ruta = uriAPathFs(evento.document.uri);
    if (esQuetzal(ruta)) {
        obtenerAnalisisDocumento(evento.document);
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
