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
        // Palabras reservadas de control de flujo
        this.palabras_reservadas = [
            this.crear_item_palabra_reservada('si', 'Condicional si'),
            this.crear_item_palabra_reservada('sino', 'Condicional sino'),
            this.crear_item_palabra_reservada('mientras', 'Bucle mientras'),
            this.crear_item_palabra_reservada('para', 'Bucle para'),
            this.crear_item_palabra_reservada('hacer', 'Bucle hacer-mientras'),
            this.crear_item_palabra_reservada('romper', 'Romper bucle'),
            this.crear_item_palabra_reservada('continuar', 'Continuar bucle'),
            this.crear_item_palabra_reservada('retornar', 'Retornar valor'),
            this.crear_item_palabra_reservada('funcion', 'Definir función'),
            this.crear_item_palabra_reservada('objeto', 'Definir objeto'),
            this.crear_item_palabra_reservada('nuevo', 'Crear nueva instancia'),
            this.crear_item_palabra_reservada('ambiente', 'Referencia al objeto actual'),
            this.crear_item_palabra_reservada('importar', 'Importar módulo'),
            this.crear_item_palabra_reservada('exportar', 'Exportar elementos'),
            this.crear_item_palabra_reservada('desde', 'Especificar origen'),
            this.crear_item_palabra_reservada('como', 'Crear alias'),
            this.crear_item_palabra_reservada('intentar', 'Bloque try'),
            this.crear_item_palabra_reservada('atrapar', 'Bloque catch'),
            this.crear_item_palabra_reservada('finalmente', 'Bloque finally'),
            this.crear_item_palabra_reservada('lanzar', 'Lanzar excepción'),
            this.crear_item_palabra_reservada('y', 'Operador lógico AND'),
            this.crear_item_palabra_reservada('o', 'Operador lógico OR'),
            this.crear_item_palabra_reservada('mut', 'Modificador mutable'),
            this.crear_item_palabra_reservada('publico', 'Modificador público'),
            this.crear_item_palabra_reservada('privado', 'Modificador privado'),
            this.crear_item_palabra_reservada('libre', 'Función estática')
        ];

        // Tipos de datos
        this.tipos_datos = [
            this.crear_item_tipo('vacio', 'Tipo sin valor'),
            this.crear_item_tipo('entero', 'Número entero'),
            this.crear_item_tipo('número', 'Número decimal'),
            this.crear_item_tipo('cadena', 'Cadena de texto'),
            this.crear_item_tipo('bool', 'Valor booleano'),
            this.crear_item_tipo('lista', 'Lista de elementos'),
            this.crear_item_tipo('jsn', 'Objeto JSON'),
            this.crear_item_valor('verdadero', 'Valor booleano verdadero'),
            this.crear_item_valor('falso', 'Valor booleano falso')
        ];

        // Funciones builtin
        this.funciones_builtin = [
            this.crear_item_funcion('imprimir', 'Imprimir mensaje en consola', 'imprimir("${1:mensaje}")'),
            this.crear_item_funcion('imprimir_exito', 'Imprimir mensaje de éxito', 'imprimir_exito("${1:mensaje}")'),
            this.crear_item_funcion('imprimir_error', 'Imprimir mensaje de error', 'imprimir_error("${1:mensaje}")'),
            this.crear_item_funcion('imprimir_advertencia', 'Imprimir advertencia', 'imprimir_advertencia("${1:mensaje}")'),
            this.crear_item_funcion('imprimir_informacion', 'Imprimir información', 'imprimir_informacion("${1:mensaje}")'),
            this.crear_item_funcion('imprimir_depurar', 'Imprimir mensaje de debug', 'imprimir_depurar("${1:mensaje}")'),
            this.crear_item_funcion('imprimir_alerta', 'Imprimir alerta', 'imprimir_alerta("${1:mensaje}")'),
            this.crear_item_funcion('imprimir_confirmacion', 'Imprimir confirmación', 'imprimir_confirmacion("${1:mensaje}")')
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
        const regex = /(?:funcion|fn)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
        let match;

        while ((match = regex.exec(texto)) !== null) {
            funciones.push(match[1]);
        }

        return [...new Set(funciones)]; // Eliminar duplicados
    }

    /**
     * Extrae nombres de variables del documento
     */
    private extraer_variables_documento(document: vscode.TextDocument): string[] {
        const variables: string[] = [];
        const texto = document.getText();
        const regex = /(?:entero|número|numero|cadena|bool|lista|jsn|vacio)\s+(?:mut\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
        let match;

        while ((match = regex.exec(texto)) !== null) {
            variables.push(match[1]);
        }

        return [...new Set(variables)]; // Eliminar duplicados
    }

    /**
     * Extrae nombres de objetos del documento
     */
    private extraer_objetos_documento(document: vscode.TextDocument): string[] {
        const objetos: string[] = [];
        const texto = document.getText();
        const regex = /objeto\s+([A-Z][a-zA-Z0-9_]*)\s*\{/g;
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
