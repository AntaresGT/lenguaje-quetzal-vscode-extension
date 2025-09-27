import * as vscode from 'vscode';

export class DiagnosticadorQuetzal {
    private palabras_reservadas: Set<string> = new Set();
    private tipos_datos: Set<string> = new Set();

    constructor() {
        this.inicializar_vocabulario();
        console.log('Diagnosticador Quetzal inicializado');
    }

    /**
     * Analiza un documento y retorna diagnósticos
     */
    analizar_documento(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnosticos: vscode.Diagnostic[] = [];
        const texto = document.getText();
        const lineas = texto.split('\n');

        for (let numero_linea = 0; numero_linea < lineas.length; numero_linea++) {
            const linea = lineas[numero_linea];
            
            // Analizar errores de sintaxis
            diagnosticos.push(...this.analizar_sintaxis_linea(linea, numero_linea));
            
            // Analizar llaves balanceadas
            diagnosticos.push(...this.analizar_llaves_balanceadas(linea, numero_linea));
            
            // Analizar declaraciones de variables
            diagnosticos.push(...this.analizar_declaraciones_variables(linea, numero_linea));
            
            // Analizar llamadas a funciones
            diagnosticos.push(...this.analizar_llamadas_funciones(linea, numero_linea));

            // Advertir métodos deprecados imprimir*
            diagnosticos.push(...this.analizar_deprecados_imprimir(linea, numero_linea));
        }

        // Analizar estructura general del documento
        diagnosticos.push(...this.analizar_estructura_documento(document));

        return diagnosticos;
    }

    /**
     * Marca advertencia para métodos imprimir* deprecados y sugiere consola.*
     */
    private analizar_deprecados_imprimir(linea: string, numero_linea: number): vscode.Diagnostic[] {
        const ds: vscode.Diagnostic[] = [];
        const regex = /\b(imprimir(?:_[\p{L}\p{N}_]+)?)\s*\(/gu;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(linea)) !== null) {
            const nombre = m[1];
            const inicio = m.index;
            const fin = inicio + nombre.length;
            const rango = new vscode.Range(numero_linea, inicio, numero_linea, fin);
            const d = new vscode.Diagnostic(
                rango,
                `Método deprecado: ${nombre}. Usa consola.mostrar(...), consola.mostrar_error(...), consola.mostrar_advertencia(...), consola.mostrar_exito(...), consola.mostrar_informacion(...)`,
                vscode.DiagnosticSeverity.Warning
            );
            ds.push(d);
        }
        return ds;
    }

    /**
     * Inicializa el vocabulario del lenguaje
     */
    private inicializar_vocabulario(): void {
        this.palabras_reservadas = new Set([
            'si', 'sino', 'mientras', 'para', 'en', 'cada', 'hacer', 'romper', 'continuar',
            'retornar', 'intentar', 'atrapar', 'finalmente', 'lanzar',
            'capturar',
            'objeto', 'nuevo', 'ambiente', 'libre',
            'importar', 'exportar', 'desde', 'como', 'asíncrono', 'asincrono', 'esperar',
            'y', 'o', 'var', 'público', 'publico', 'privado', 'tipo', 'excepción', 'excepcion'
        ]);

        this.tipos_datos = new Set([
            'vacío', 'vacio', 'entero', 'número', 'numero', 'texto', 'log', 'lista', 'jsn',
            'excepción', 'excepcion',
            'verdadero', 'falso', 'nulo'
        ]);
    }

    /**
     * Analiza la sintaxis de una línea específica
     */
    private analizar_sintaxis_linea(linea: string, numero_linea: number): vscode.Diagnostic[] {
        const diagnosticos: vscode.Diagnostic[] = [];
        const linea_limpia = linea.trim();

        // Saltar líneas vacías y comentarios
        if (linea_limpia === '' || linea_limpia.startsWith('//') || linea_limpia.startsWith('/*')) {
            return diagnosticos;
        }

        // Verificar punto y coma al final (no debe tenerlo en Quetzal)
        if (linea_limpia.endsWith(';')) {
            const posicion_error = linea.lastIndexOf(';');
            const rango = new vscode.Range(numero_linea, posicion_error, numero_linea, posicion_error + 1);
            diagnosticos.push(new vscode.Diagnostic(
                rango,
                'Quetzal no utiliza punto y coma (;) al final de las instrucciones',
                vscode.DiagnosticSeverity.Warning
            ));
        }

        // Verificar paréntesis balanceados
        const parentesis_abiertos = (linea.match(/\(/g) || []).length;
        const parentesis_cerrados = (linea.match(/\)/g) || []).length;
        if (parentesis_abiertos !== parentesis_cerrados) {
            const rango = new vscode.Range(numero_linea, 0, numero_linea, linea.length);
            diagnosticos.push(new vscode.Diagnostic(
                rango,
                'Paréntesis no balanceados en esta línea',
                vscode.DiagnosticSeverity.Error
            ));
        }

        // Verificar comillas balanceadas
        const comillas_dobles = (linea.match(/"/g) || []).length;
        if (comillas_dobles % 2 !== 0) {
            const rango = new vscode.Range(numero_linea, 0, numero_linea, linea.length);
            diagnosticos.push(new vscode.Diagnostic(
                rango,
                'Comillas no balanceadas en esta línea',
                vscode.DiagnosticSeverity.Error
            ));
        }

        return diagnosticos;
    }

    /**
     * Analiza llaves balanceadas
     */
    private analizar_llaves_balanceadas(linea: string, numero_linea: number): vscode.Diagnostic[] {
        const diagnosticos: vscode.Diagnostic[] = [];
        
        // Verificar que las llaves tengan espacios apropiados
        const regex_llave_mal_formateada = /\w\{|\}\w/;
        if (regex_llave_mal_formateada.test(linea)) {
            const rango = new vscode.Range(numero_linea, 0, numero_linea, linea.length);
            diagnosticos.push(new vscode.Diagnostic(
                rango,
                'Las llaves deben estar separadas por espacios',
                vscode.DiagnosticSeverity.Information
            ));
        }

        return diagnosticos;
    }

    /**
     * Analiza declaraciones de variables
     */
    private analizar_declaraciones_variables(linea: string, numero_linea: number): vscode.Diagnostic[] {
        const diagnosticos: vscode.Diagnostic[] = [];
        const linea_limpia = linea.trim();

        // Regex para detectar declaraciones de variables
        const regex_declaracion = /^(entero|número|numero|texto|log|lista|jsn|vacio|vacío)\s+((?:mut|var)\s+)?([\p{L}_][\p{L}\p{N}_]*)\s*=/u;
        const coincidencia = linea_limpia.match(regex_declaracion);

        if (coincidencia) {
            const nombre_variable = coincidencia[3];
            
            // Ya no verificamos convención de nombres - permitimos camelCase y snake_case
            // Solo verificamos que no sean palabras reservadas
            
            // Verificar que las palabras reservadas no se usen como nombres de variables
            if (this.palabras_reservadas.has(nombre_variable) || this.tipos_datos.has(nombre_variable)) {
                const posicion_inicio = linea.indexOf(nombre_variable);
                const rango = new vscode.Range(numero_linea, posicion_inicio, numero_linea, posicion_inicio + nombre_variable.length);
                diagnosticos.push(new vscode.Diagnostic(
                    rango,
                    `"${nombre_variable}" es una palabra reservada y no puede usarse como nombre de variable`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }

        return diagnosticos;
    }

    /**
     * Analiza llamadas a funciones
     */
    private analizar_llamadas_funciones(linea: string, numero_linea: number): vscode.Diagnostic[] {
        const diagnosticos: vscode.Diagnostic[] = [];
        
        // Regex para detectar definiciones de funciones
        const regex_funcion_nueva = /^(entero|número|numero|texto|log|lista|jsn|vacio|vacío)\s+([\p{L}_][\p{L}\p{N}_]*)\s*\(/u;

        const coincidencia = linea.match(regex_funcion_nueva);

        if (coincidencia) {
            const nombre_funcion = coincidencia[2];
            
            // Ya no verificamos convención de nombres - permitimos camelCase y snake_case
            // Solo verificamos que no sean palabras reservadas
            
            // Verificar que las palabras reservadas no se usen como nombres de funciones
            if (this.palabras_reservadas.has(nombre_funcion) || this.tipos_datos.has(nombre_funcion)) {
                const posicion_inicio = linea.indexOf(nombre_funcion);
                const rango = new vscode.Range(numero_linea, posicion_inicio, numero_linea, posicion_inicio + nombre_funcion.length);
                diagnosticos.push(new vscode.Diagnostic(
                    rango,
                    `"${nombre_funcion}" es una palabra reservada y no puede usarse como nombre de función`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }

        return diagnosticos;
    }

    /**
     * Analiza la estructura general del documento
     */
    private analizar_estructura_documento(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnosticos: vscode.Diagnostic[] = [];
        const texto = document.getText();

        // Verificar llaves balanceadas en todo el documento
        const llaves_abiertas = (texto.match(/\{/g) || []).length;
        const llaves_cerradas = (texto.match(/\}/g) || []).length;
        
        if (llaves_abiertas !== llaves_cerradas) {
            const rango = new vscode.Range(0, 0, document.lineCount - 1, 0);
            diagnosticos.push(new vscode.Diagnostic(
                rango,
                `Llaves no balanceadas en el documento: ${llaves_abiertas} abiertas, ${llaves_cerradas} cerradas`,
                vscode.DiagnosticSeverity.Error
            ));
        }

        // Verificar paréntesis balanceados en todo el documento
        const parentesis_abiertos = (texto.match(/\(/g) || []).length;
        const parentesis_cerrados = (texto.match(/\)/g) || []).length;
        
        if (parentesis_abiertos !== parentesis_cerrados) {
            const rango = new vscode.Range(0, 0, document.lineCount - 1, 0);
            diagnosticos.push(new vscode.Diagnostic(
                rango,
                `Paréntesis no balanceados en el documento: ${parentesis_abiertos} abiertos, ${parentesis_cerrados} cerrados`,
                vscode.DiagnosticSeverity.Error
            ));
        }

        return diagnosticos;
    }

    /**
     * Crea un diagnóstico personalizado
     */
    crear_diagnostico(
        linea: number,
        columna_inicio: number,
        columna_fin: number,
        mensaje: string,
        severidad: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error
    ): vscode.Diagnostic {
        const rango = new vscode.Range(linea, columna_inicio, linea, columna_fin);
        return new vscode.Diagnostic(rango, mensaje, severidad);
    }
}
