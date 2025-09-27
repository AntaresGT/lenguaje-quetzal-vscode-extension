import * as vscode from 'vscode';
import { ServidorLenguajeQuetzal, TipoInfo } from './servidor_lenguaje';

const IDENT_UNICODE = /[\p{L}_][\p{L}\p{N}_]*/u;

export class ProveedorCompletado implements vscode.CompletionItemProvider {
    private palabras_reservadas: vscode.CompletionItem[] = [];
    private tipos_datos: vscode.CompletionItem[] = [];
    private funciones_builtin: vscode.CompletionItem[] = [];
    private servidor: ServidorLenguajeQuetzal;

    constructor(servidor?: ServidorLenguajeQuetzal) {
        this.servidor = servidor ?? new ServidorLenguajeQuetzal();
        this.inicializar_completados();
        console.log('Proveedor de Autocompletado Quetzal inicializado');
    }

    /**
     * Provee items de autocompletado
     */
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const configuracion = vscode.workspace.getConfiguration('quetzal');
        const autocompletadoHabilitado = configuracion.get<boolean>('autocompletado.habilitado', true);
        if (!autocompletadoHabilitado) {
            return [];
        }

        const linea_actual = document.lineAt(position.line);
        const texto_antes_cursor = linea_actual.text.substring(0, position.character);

        const completados: vscode.CompletionItem[] = [];

        // Agregar palabras reservadas
        completados.push(...this.palabras_reservadas);
        
        // Agregar tipos de datos
        completados.push(...this.tipos_datos);
        
        // Agregar funciones builtin
        completados.push(...this.funciones_builtin);

        // Agregar completados contextuales
        completados.push(...this.obtener_completados_contextuales(document, position));

        // Autocompletado por tipo si hay un identificador antes de un punto
        const tipados = this.obtener_completados_por_tipo(document, position, texto_antes_cursor);
        completados.push(...tipados);

        // Filtrar por relevancia
        return this.filtrar_completados(completados, texto_antes_cursor);
    }

    /**
     * Inicializa los elementos de autocompletado básicos
     */
    private inicializar_completados(): void {
        // Palabras reservadas de control de flujo
        this.palabras_reservadas = [
            this.crear_item_palabra_reservada('si', 'Condicional si'),
            this.crear_item_palabra_reservada('sino', 'Condicional sino'),
            this.crear_item_palabra_reservada('mientras', 'Bucle mientras'),
            this.crear_item_palabra_reservada('para', 'Bucle para'),
            this.crear_item_palabra_reservada('en', 'Iterar sobre una colección'),
            this.crear_item_palabra_reservada('cada', 'Iterar asignando nombre al elemento'),
            this.crear_item_palabra_reservada('hacer', 'Bucle hacer-mientras'),
            this.crear_item_palabra_reservada('romper', 'Romper bucle'),
            this.crear_item_palabra_reservada('continuar', 'Continuar bucle'),
            this.crear_item_palabra_reservada('retornar', 'Retornar valor'),
            this.crear_item_palabra_reservada('var', 'Variable mutable'),
            this.crear_item_palabra_reservada('objeto', 'Definir objeto'),
            this.crear_item_palabra_reservada('nuevo', 'Crear nueva instancia'),
            this.crear_item_palabra_reservada('ambiente', 'Referencia al objeto actual'),
            this.crear_item_palabra_reservada('importar', 'Importar módulo'),
            this.crear_item_palabra_reservada('exportar', 'Exportar elementos'),
            this.crear_item_palabra_reservada('desde', 'Especificar origen'),
            this.crear_item_palabra_reservada('como', 'Crear alias'),
            this.crear_item_palabra_reservada('intentar', 'Bloque try'),
            this.crear_item_palabra_reservada('atrapar', 'Bloque catch'),
            this.crear_item_palabra_reservada('capturar', 'Bloque catch'),
            this.crear_item_palabra_reservada('finalmente', 'Bloque finally'),
            this.crear_item_palabra_reservada('lanzar', 'Lanzar excepción'),
            this.crear_item_palabra_reservada('y', 'Operador lógico AND'),
            this.crear_item_palabra_reservada('o', 'Operador lógico OR'),
            this.crear_item_palabra_reservada('público', 'Modificador público (con tilde)'),
            this.crear_item_palabra_reservada('publico', 'Modificador público'),
            this.crear_item_palabra_reservada('privado', 'Modificador privado'),
            this.crear_item_palabra_reservada('libre', 'Función estática'),
            this.crear_item_palabra_reservada('asíncrono', 'Función asíncrona (con tilde)'),
            this.crear_item_palabra_reservada('asincrono', 'Función asíncrona'),
            this.crear_item_palabra_reservada('esperar', 'Esperar resultado asíncrono'),
            this.crear_item_palabra_reservada('excepción', 'Tipo excepción (con tilde)'),
            this.crear_item_palabra_reservada('excepcion', 'Tipo excepción')
        ];

        // Tipos de datos
        this.tipos_datos = [
            this.crear_item_tipo('vacío', 'Tipo sin valor (con tilde)'),
            this.crear_item_tipo('vacio', 'Tipo sin valor'),
            this.crear_item_tipo('entero', 'Número entero'),
            this.crear_item_tipo('número', 'Número decimal (con tilde)'),
            this.crear_item_tipo('numero', 'Número decimal'),
            this.crear_item_tipo('texto', 'Cadena de texto'),
            this.crear_item_tipo('log', 'Valor lógico'),
            this.crear_item_tipo('lista', 'Lista de elementos'),
            this.crear_item_tipo('jsn', 'Objeto JSON'),
            this.crear_item_tipo('excepcion', 'Tipo de excepción'),
            this.crear_item_tipo('excepción', 'Tipo de excepción (con tilde)'),
            this.crear_item_valor('verdadero', 'Valor booleano verdadero'),
            this.crear_item_valor('falso', 'Valor booleano falso'),
            this.crear_item_valor('nulo', 'Valor nulo para cualquier tipo')
        ];

        // Funciones builtin
        this.funciones_builtin = [
            this.crear_item_funcion_deprecada('imprimir', 'Reemplazado por consola.mostrar("texto")', 'imprimir("${1:mensaje}")', 'consola.mostrar("${1:mensaje}")'),
            this.crear_item_funcion_deprecada('imprimir_exito', 'Reemplazado por consola.mostrar_exito("texto")', 'imprimir_exito("${1:mensaje}")', 'consola.mostrar_exito("${1:mensaje}")'),
            this.crear_item_funcion_deprecada('imprimir_error', 'Reemplazado por consola.mostrar_error("texto")', 'imprimir_error("${1:mensaje}")', 'consola.mostrar_error("${1:mensaje}")'),
            this.crear_item_funcion_deprecada('imprimir_advertencia', 'Reemplazado por consola.mostrar_advertencia("texto")', 'imprimir_advertencia("${1:mensaje}")', 'consola.mostrar_advertencia("${1:mensaje}")'),
            this.crear_item_funcion_deprecada('imprimir_informacion', 'Reemplazado por consola.mostrar_informacion("texto")', 'imprimir_informacion("${1:mensaje}")', 'consola.mostrar_informacion("${1:mensaje}")')
        ];
    }

    /** Crear item de función deprecada con sugerencia */
    private crear_item_funcion_deprecada(nombre: string, descripcion: string, snippet: string, sugerencia: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(nombre, vscode.CompletionItemKind.Function);
        item.detail = descripcion;
        const doc = new vscode.MarkdownString();
        doc.appendMarkdown(`⚠️ Método deprecado: ${nombre}\n\n`);
        doc.appendMarkdown(`Usa en su lugar:\n\n\`${sugerencia}\``);
        item.documentation = doc;
        item.tags = [vscode.CompletionItemTag.Deprecated];
        item.insertText = new vscode.SnippetString(snippet);
        item.sortText = 'zzz_' + nombre; // depriorizar
        return item;
    }

    /**
     * Obtiene completados basados en el contexto actual
     */
    private obtener_completados_contextuales(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
        const completados: vscode.CompletionItem[] = [];
        
        // Obtener funciones definidas en el documento
        const funciones_documento = this.extraer_funciones_documento(document);
        funciones_documento.forEach(funcion => {
            completados.push(this.crear_item_funcion_usuario(funcion));
        });

        // Obtener variables definidas en el documento
        const variables_documento = this.extraer_variables_documento(document);
        variables_documento.forEach(variable => {
            completados.push(this.crear_item_variable_usuario(variable));
        });

        // Obtener objetos definidos en el documento
        const objetos_documento = this.extraer_objetos_documento(document);
        objetos_documento.forEach(objeto => {
            completados.push(this.crear_item_objeto_usuario(objeto));
        });

        return completados;
    }

    /**
     * Si el usuario escribe IDENTIFICADOR. sugiere métodos según el tipo del identificador.
     */
    private obtener_completados_por_tipo(document: vscode.TextDocument, position: vscode.Position, texto_antes_cursor: string): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];
        const hastaCursor = texto_antes_cursor;
        const puntoIdx = hastaCursor.lastIndexOf('.');
        if (puntoIdx === -1) return items;
        const antesDelPunto = hastaCursor.substring(0, puntoIdx);
        const match = antesDelPunto.match(new RegExp(`${IDENT_UNICODE.source}$`, 'u'));
        if (!match) {
            // Puede ser literal o expresión: usar heurística del servidor
            const tipoExpr = this.servidor.tipo_de_cadena(document, antesDelPunto);
            const metodos = this.servidor.metodos_por_tipo(tipoExpr);
            for (const m of metodos) {
                const ci = new vscode.CompletionItem(m.nombre, vscode.CompletionItemKind.Method);
                ci.detail = m.detalle ? `Método (${m.detalle})` : 'Método';
                if (m.nombre.includes('(')) ci.insertText = new vscode.SnippetString(m.nombre);
                items.push(ci);
            }
            return items;
        }
        const nombreIdent = match[0];
        // Sugerencias para consola.*
        if (nombreIdent === 'consola') {
            const metodosConsola = [
                { n: 'mostrar', desc: 'Mostrar texto (color por defecto)' },
                { n: 'mostrar_error', desc: 'Mostrar error (rojo)' },
                { n: 'mostrar_advertencia', desc: 'Mostrar advertencia (amarillo)' },
                { n: 'mostrar_exito', desc: 'Mostrar éxito (verde)' },
                { n: 'mostrar_informacion', desc: 'Mostrar información (azul)' },
                { n: 'pedir', desc: 'Solicitar entrada de texto' },
                { n: 'pedir_secreto', desc: 'Solicitar entrada secreta' }
            ];
            for (const m of metodosConsola) {
                const ci = new vscode.CompletionItem(m.n, vscode.CompletionItemKind.Method);
                ci.detail = `consola.${m.n}(texto)`;
                ci.documentation = new vscode.MarkdownString(`consola.${m.n}("${'{texto}'}") — ${m.desc}`);
                ci.insertText = new vscode.SnippetString(`${m.n}("${'${1:texto}'}")`);
                items.push(ci);
            }
            return items;
        }
        const tipo = this.servidor.tipo_de_identificador(document, nombreIdent);
        if (!tipo) return items;
        const metodos = this.servidor.metodos_por_tipo(tipo);
        for (const m of metodos) {
            const ci = new vscode.CompletionItem(m.nombre, vscode.CompletionItemKind.Method);
            ci.detail = m.detalle ? `Método (${m.detalle})` : 'Método';
            if (m.nombre.includes('(')) {
                ci.insertText = new vscode.SnippetString(m.nombre);
            }
            items.push(ci);
        }
        return items;
    }

    /**
     * Crea un item de palabra reservada
     */
    private crear_item_palabra_reservada(palabra: string, descripcion: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(palabra, vscode.CompletionItemKind.Keyword);
        item.detail = descripcion;
        item.documentation = new vscode.MarkdownString(`**${palabra}** - ${descripcion}`);
        return item;
    }

    /**
     * Crea un item de tipo de datos
     */
    private crear_item_tipo(tipo: string, descripcion: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(tipo, vscode.CompletionItemKind.TypeParameter);
        item.detail = descripcion;
        item.documentation = new vscode.MarkdownString(`**${tipo}** - ${descripcion}`);
        return item;
    }

    /**
     * Crea un item de valor
     */
    private crear_item_valor(valor: string, descripcion: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(valor, vscode.CompletionItemKind.Value);
        item.detail = descripcion;
        item.documentation = new vscode.MarkdownString(`**${valor}** - ${descripcion}`);
        return item;
    }

    /**
     * Crea un item de función builtin
     */
    private crear_item_funcion(nombre: string, descripcion: string, snippet: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(nombre, vscode.CompletionItemKind.Function);
        item.detail = descripcion;
        item.documentation = new vscode.MarkdownString(`**${nombre}** - ${descripcion}`);
        item.insertText = new vscode.SnippetString(snippet);
        return item;
    }

    /**
     * Crea un item de función definida por el usuario
     */
    private crear_item_funcion_usuario(nombre: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(nombre, vscode.CompletionItemKind.Function);
        item.detail = 'Función definida por el usuario';
        item.documentation = new vscode.MarkdownString(`**${nombre}** - Función definida en el documento actual`);
        return item;
    }

    /**
     * Crea un item de variable definida por el usuario
     */
    private crear_item_variable_usuario(nombre: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(nombre, vscode.CompletionItemKind.Variable);
        item.detail = 'Variable definida por el usuario';
        item.documentation = new vscode.MarkdownString(`**${nombre}** - Variable definida en el documento actual`);
        return item;
    }

    /**
     * Crea un item de objeto definido por el usuario
     */
    private crear_item_objeto_usuario(nombre: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(nombre, vscode.CompletionItemKind.Class);
        item.detail = 'Objeto definido por el usuario';
        item.documentation = new vscode.MarkdownString(`**${nombre}** - Objeto definido en el documento actual`);
        return item;
    }

    /**
     * Extrae nombres de funciones del documento
     */
    private extraer_funciones_documento(document: vscode.TextDocument): string[] {
        const funciones: string[] = [];
        const texto = document.getText();
        const regexNueva = new RegExp(String.raw`\b(entero|número|numero|texto|log|lista|jsn|vacio|vacío)\s+([\p{L}_][\p{L}\p{N}_]*)\s*\(`, 'ug');
        let match;
        while ((match = regexNueva.exec(texto)) !== null) {
            funciones.push(match[2]);
        }
        return [...new Set(funciones)]; // Eliminar duplicados
    }

    /**
     * Extrae nombres de variables del documento
     */
    private extraer_variables_documento(document: vscode.TextDocument): string[] {
        const variables: string[] = [];
        const texto = document.getText();
    const regex = new RegExp(String.raw`\b(entero|número|numero|texto|log|lista(?:\s*<\s*[^>]+\s*>)?|jsn|vacio|vacío)\s+(?:var\s+)?([\p{L}_][\p{L}\p{N}_]*)\s*=`, 'ug');
        let match;
        while ((match = regex.exec(texto)) !== null) {
            variables.push(match[2]);
        }
        return [...new Set(variables)]; // Eliminar duplicados
    }

    /**
     * Extrae nombres de objetos del documento
     */
    private extraer_objetos_documento(document: vscode.TextDocument): string[] {
        const objetos: string[] = [];
        const texto = document.getText();
        const regex = new RegExp(String.raw`\bobjeto\s+([A-Z][\p{L}\p{N}_]*)\s*\{`, 'ug');
        let match;
        while ((match = regex.exec(texto)) !== null) {
            objetos.push(match[1]);
        }
        return [...new Set(objetos)]; // Eliminar duplicados
    }

    /**
     * Filtra completados por relevancia
     */
    private filtrar_completados(completados: vscode.CompletionItem[], texto_antes_cursor: string): vscode.CompletionItem[] {
        let palabra_actual = texto_antes_cursor.split(/\s/).pop() || '';
        // Si contiene punto, filtrar por la parte después del último punto
        if (palabra_actual.includes('.')) {
            palabra_actual = palabra_actual.substring(palabra_actual.lastIndexOf('.') + 1);
        }
        
        if (palabra_actual.length === 0) {
            return completados;
        }

        return completados.filter(item => 
            item.label.toString().toLowerCase().startsWith(palabra_actual.toLowerCase())
        );
    }

    /**
     * Obtiene información de hover para una palabra
     */
    obtener_informacion_hover(palabra: string): vscode.Hover | null {
        // Buscar en palabras reservadas
        const palabra_reservada = this.palabras_reservadas.find(item => 
            item.label === palabra
        );
        if (palabra_reservada) {
            return new vscode.Hover(palabra_reservada.documentation as vscode.MarkdownString);
        }

        // Buscar en tipos de datos
        const tipo_dato = this.tipos_datos.find(item => 
            item.label === palabra
        );
        if (tipo_dato) {
            return new vscode.Hover(tipo_dato.documentation as vscode.MarkdownString);
        }

        // Buscar en funciones builtin y marcar deprecadas si aplica
        const funcion_builtin = this.funciones_builtin.find(item => item.label === palabra);
        if (funcion_builtin) {
            return new vscode.Hover(funcion_builtin.documentation as vscode.MarkdownString);
        }

        // Hover especial para métodos imprimir*
        if (/^imprimir[\p{L}\p{N}_]*$/u.test(palabra)) {
            const doc = new vscode.MarkdownString();
            doc.appendMarkdown(`⚠️ Método deprecado: ${palabra}\n\n`);
            doc.appendMarkdown('Usa: `consola.mostrar("texto")`, `consola.mostrar_error(...)`, `consola.mostrar_advertencia(...)`, `consola.mostrar_exito(...)`, `consola.mostrar_informacion(...)`.');
            return new vscode.Hover(doc);
        }

        return null;
    }
}
