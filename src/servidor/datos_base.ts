import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node';
import { METODOS_POR_TIPO, MetodoDefinido } from '../compartido/metodos';

export type DefinicionMetodo = MetodoDefinido;

export interface DefinicionFuncion {
    nombre: string;
    descripcion?: string;
    snippet?: string;
}

export interface DefinicionPalabra {
    etiqueta: string;
    descripcion: string;
    tipo: CompletionItemKind;
    snippet?: string;
    documentacion?: string;
    ejemplo?: string;
}

const DOCS = 'https://lenguaje-quetzal.com';

export const PALABRAS_RESERVADAS: DefinicionPalabra[] = [
    { etiqueta: 'si', descripcion: 'Ejecuta un bloque cuando la condición es verdadera', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/control/condicionales/`, ejemplo: 'si (${1:condición}) {\n    ${2:// instrucciones}\n}' },
    { etiqueta: 'sino', descripcion: 'Condicional sino', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'mientras', descripcion: 'Repite mientras la condición sea verdadera', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/control/bucles/`, ejemplo: 'mientras (${1:condición}) {\n    ${2:// instrucciones}\n}' },
    { etiqueta: 'para', descripcion: 'Bucle para', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'en', descripcion: 'Iterar sobre una colección', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'cada', descripcion: 'Iterar asignando nombre al elemento', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'hacer', descripcion: 'Bucle hacer-mientras', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'romper', descripcion: 'Romper bucle', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'continuar', descripcion: 'Continuar bucle', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'retornar', descripcion: 'Retornar valor', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'var', descripcion: 'Variable mutable', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'objeto', descripcion: 'Define un objeto con atributos y métodos', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/oop/clases-objetos/` },
    { etiqueta: 'prototipo', descripcion: 'Define un contrato para objetos', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/oop/prototipos/` },
    { etiqueta: 'implementa', descripcion: 'Declara prototipos implementados', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/oop/prototipos/` },
    { etiqueta: 'opcional', descripcion: 'Marca un miembro de prototipo como opcional', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/oop/prototipos/` },
    { etiqueta: 'padre', descripcion: 'Accede a miembros heredados', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/oop/clases-objetos/` },
    { etiqueta: 'constructor', descripcion: 'Identificador reservado para constructores', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/oop/constructores/` },
    { etiqueta: 'nuevo', descripcion: 'Crear nueva instancia', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'ambiente', descripcion: 'Referencia al objeto actual', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'importar', descripcion: 'Importa símbolos desde otro módulo', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/modulos/importar-exportar/`, ejemplo: 'importar { ${1:Simbolo} } desde "${2:modulo}"' },
    { etiqueta: 'exportar', descripcion: 'Exportar elementos', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'desde', descripcion: 'Especificar origen de importación', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'como', descripcion: 'Crear alias en importación', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'intentar', descripcion: 'Protege instrucciones que pueden lanzar excepción', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/errores/try-catch/`, ejemplo: 'intentar {\n    ${1:// código}\n} capturar (excepcion ${2:error}) {\n    ${3:// recuperación}\n}' },
    { etiqueta: 'atrapar', descripcion: 'Bloque atrapar', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'capturar', descripcion: 'Bloque capturar', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'finalmente', descripcion: 'Bloque finalmente', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'lanzar', descripcion: 'Lanzar excepción', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'esperar', descripcion: 'Esperar resultado asíncrono', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'asincrono', descripcion: 'Función asíncrona', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'asíncrono', descripcion: 'Función asíncrona (con tilde)', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'y', descripcion: 'Operador lógico AND', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'o', descripcion: 'Operador lógico OR', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'no', descripcion: 'Negación lógica', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/fundamentos/operadores/` },
    { etiqueta: 'público', descripcion: 'Miembro público (con tilde)', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'publico', descripcion: 'Miembro público', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'privado', descripcion: 'Miembro privado', tipo: CompletionItemKind.Keyword },
    { etiqueta: 'libre', descripcion: 'Miembro accesible sin instanciar objeto', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/oop/modificadores-acceso/` },
    { etiqueta: 'mut', descripcion: 'Palabra reservada para mutabilidad futura', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/referencia/palabras-reservadas/` },
    { etiqueta: 'de', descripcion: 'Palabra reservada del lenguaje', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/referencia/palabras-reservadas/` },
    { etiqueta: 'es', descripcion: 'Palabra reservada del lenguaje', tipo: CompletionItemKind.Keyword, documentacion: `${DOCS}/referencia/palabras-reservadas/` }
];

export const TIPOS_BÁSICOS: DefinicionPalabra[] = [
    { etiqueta: 'vacío', descripcion: 'Tipo sin valor (con tilde)', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'vacio', descripcion: 'Tipo sin valor', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'entero', descripcion: 'Número entero', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'número', descripcion: 'Número decimal (con tilde)', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'numero', descripcion: 'Número decimal', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'texto', descripcion: 'Cadena de texto', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'log', descripcion: 'Valor lógico', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'lista', descripcion: 'Lista de elementos', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'jsn', descripcion: 'Objeto JSON', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'excepcion', descripcion: 'Tipo de excepción', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'excepción', descripcion: 'Tipo de excepción (con tilde)', tipo: CompletionItemKind.TypeParameter },
    { etiqueta: 'verdadero', descripcion: 'Valor booleano verdadero', tipo: CompletionItemKind.Value },
    { etiqueta: 'falso', descripcion: 'Valor booleano falso', tipo: CompletionItemKind.Value },
    { etiqueta: 'nulo', descripcion: 'Valor nulo', tipo: CompletionItemKind.Value }
];

export const METODOS_PREDEFINIDOS: Record<string, DefinicionMetodo[]> = METODOS_POR_TIPO;

export const FUNCIONES_DEPRECADAS: DefinicionPalabra[] = [
    {
        etiqueta: 'imprimir',
        descripcion: 'Reemplazado por consola.mostrar("texto")',
        tipo: CompletionItemKind.Function,
        snippet: 'imprimir(${1:mensaje})'
    },
    {
        etiqueta: 'imprimir_exito',
        descripcion: 'Reemplazado por consola.mostrar_exito("texto")',
        tipo: CompletionItemKind.Function,
        snippet: 'imprimir_exito(${1:mensaje})'
    },
    {
        etiqueta: 'imprimir_error',
        descripcion: 'Reemplazado por consola.mostrar_error("texto")',
        tipo: CompletionItemKind.Function,
        snippet: 'imprimir_error(${1:mensaje})'
    },
    {
        etiqueta: 'imprimir_advertencia',
        descripcion: 'Reemplazado por consola.mostrar_advertencia("texto")',
        tipo: CompletionItemKind.Function,
        snippet: 'imprimir_advertencia(${1:mensaje})'
    },
    {
        etiqueta: 'imprimir_informacion',
        descripcion: 'Reemplazado por consola.mostrar_informacion("texto")',
        tipo: CompletionItemKind.Function,
        snippet: 'imprimir_informacion(${1:mensaje})'
    }
];

export const FORMATO_SNIPPET = InsertTextFormat.Snippet;
