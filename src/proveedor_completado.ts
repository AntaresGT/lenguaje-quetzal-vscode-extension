import * as vscode from 'vscode';

export class ProveedorCompletado implements vscode.CompletionItemProvider {
    private palabras_reservadas: vscode.CompletionItem[] = [];
    private tipos_datos: vscode.CompletionItem[] = [];
    private funciones_builtin: vscode.CompletionItem[] = [];

    constructor() {
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

        // Filtrar por relevancia
        return this.filtrar_completados(completados, texto_antes_cursor);
    }

    /**
     * Inicializa los elementos de autocompletado básicos
     */
    private inicializar_completados(): void {
        this.palabras_reservadas = [
            'si', 'sino', 'mientras', 'para', 'hacer', 'en', 'cada', 'romper', 'continuar',
            'retornar', 'intentar', 'capturar', 'finalmente', 'lanzar', 'importar', 'exportar',
            'desde', 'como', 'nuevo', 'esto', 'padre', 'hereda', 'implementa', 'libre', 'opcional',
            'asincrono', 'asincróno', 'esperar', 'funcion', 'objeto', 'prototipo', 'var',
            'publico', 'público', 'privado', 'excepcion', 'excepción', 'y', 'o'
        ].map(palabra => this.crear_item_palabra_reservada(palabra, 'Palabra clave de Quetzal'));

        this.tipos_datos = [
            this.crear_item_tipo('vacio', 'Tipo sin valor'),
            this.crear_item_tipo('vacío', 'Tipo sin valor'),
            this.crear_item_tipo('entero', 'Número entero'),
            this.crear_item_tipo('numero', 'Número decimal'),
            this.crear_item_tipo('número', 'Número decimal'),
            this.crear_item_tipo('texto', 'Cadena de texto Unicode'),
            this.crear_item_tipo('log', 'Valor lógico'),
            this.crear_item_tipo('lista', 'Lista de elementos'),
            this.crear_item_tipo('jsn', 'Objeto JSON'),
            this.crear_item_valor('verdadero', 'Valor lógico verdadero'),
            this.crear_item_valor('falso', 'Valor lógico falso'),
            this.crear_item_valor('nulo', 'Ausencia de valor')
        ];

        this.funciones_builtin = [
            this.crear_item_funcion('consola.mostrar', 'Mostrar mensaje en consola', 'consola.mostrar(${1:mensaje})'),
            this.crear_item_funcion('consola.mostrar_error', 'Mostrar error en consola', 'consola.mostrar_error(${1:mensaje})'),
            this.crear_item_funcion('consola.mostrar_advertencia', 'Mostrar advertencia', 'consola.mostrar_advertencia(${1:mensaje})'),
            this.crear_item_funcion('consola.mostrar_exito', 'Mostrar mensaje de éxito', 'consola.mostrar_exito(${1:mensaje})'),
            this.crear_item_funcion('consola.mostrar_informacion', 'Mostrar información', 'consola.mostrar_informacion(${1:mensaje})'),
            this.crear_item_funcion('consola.pedir', 'Leer entrada de consola', 'consola.pedir(${1:mensaje})'),
            this.crear_item_funcion('consola.pedir_secreto', 'Leer entrada secreta', 'consola.pedir_secreto(${1:mensaje})'),
            this.crear_item_funcion('rango', 'Crear lista de enteros', 'rango(${1:inicio}, ${2:fin})')
        ];
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
        const regex = /(?:asincrono\s+)?(?:entero|número|numero|texto|log|lista|jsn|vacio|vacío|[A-Z][\p{L}\p{N}_]*)\s+([\p{L}_][\p{L}\p{N}_]*)\s*\(/gu;
        let match;

        while ((match = regex.exec(texto)) !== null) {
            funciones.push(match[1]);
        }

        return [...new Set(funciones)];
    }

    /**
     * Extrae nombres de variables del documento
     */
    private extraer_variables_documento(document: vscode.TextDocument): string[] {
        const variables: string[] = [];
        const texto = document.getText();
        const regex = /(?:entero|número|numero|texto|log|lista|jsn|vacio|vacío|[A-Z][\p{L}\p{N}_]*)\s+(?:var\s+)?([\p{L}_][\p{L}\p{N}_]*)\s*=/gu;
        let match;

        while ((match = regex.exec(texto)) !== null) {
            variables.push(match[1]);
        }

        return [...new Set(variables)];
    }

    /**
     * Extrae nombres de objetos del documento
     */
    private extraer_objetos_documento(document: vscode.TextDocument): string[] {
        const objetos: string[] = [];
        const texto = document.getText();
        const regex = /objeto\s+([A-Z][\p{L}\p{N}_]*)[^{]*\{/gu;
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
        const palabra_actual = texto_antes_cursor.split(/\s/).pop() || '';
        
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

        // Buscar en funciones builtin
        const funcion_builtin = this.funciones_builtin.find(item => 
            item.label === palabra
        );
        if (funcion_builtin) {
            return new vscode.Hover(funcion_builtin.documentation as vscode.MarkdownString);
        }

        return null;
    }
}
