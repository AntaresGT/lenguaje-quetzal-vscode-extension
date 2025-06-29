import * as vscode from 'vscode';

export class ServidorLenguajeQuetzal {
    constructor() {
        console.log('Servidor de Lenguaje Quetzal inicializado');
    }

    /**
     * Analiza el documento y proporciona información de contexto
     */
    analizar_contexto(document: vscode.TextDocument, position: vscode.Position): any {
        const linea_actual = document.lineAt(position.line);
        const texto_linea = linea_actual.text;
        
        return {
            linea: position.line,
            columna: position.character,
            texto: texto_linea,
            es_en_funcion: this.detectar_contexto_funcion(document, position),
            es_en_objeto: this.detectar_contexto_objeto(document, position)
        };
    }

    /**
     * Detecta si la posición actual está dentro de una función
     */
    private detectar_contexto_funcion(document: vscode.TextDocument, position: vscode.Position): boolean {
        for (let i = position.line; i >= 0; i--) {
            const linea = document.lineAt(i).text.trim();
            if (linea.includes('función ') || linea.includes('funcion ') || linea.includes('fn ') || 
                /\b(entero|número|numero|cadena|bool|lista|jsn|vacio|vacío)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(linea)) {
                return true;
            }
            if (linea.includes('objeto ')) {
                return false;
            }
        }
        return false;
    }

    /**
     * Detecta si la posición actual está dentro de un objeto
     */
    private detectar_contexto_objeto(document: vscode.TextDocument, position: vscode.Position): boolean {
        let nivel_llaves = 0;
        for (let i = position.line; i >= 0; i--) {
            const linea = document.lineAt(i).text;
            
            // Contar llaves para determinar el contexto
            for (const char of linea) {
                if (char === '{') nivel_llaves++;
                if (char === '}') nivel_llaves--;
            }
            
            if (linea.trim().startsWith('objeto ') && nivel_llaves > 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Obtiene las funciones definidas en el documento
     */
    obtener_funciones_documento(document: vscode.TextDocument): string[] {
        const funciones: string[] = [];
        const texto_completo = document.getText();
        
        // Expresión regular para encontrar definiciones de funciones (nueva sintaxis)
        const regex_funciones_nueva = /(entero|número|numero|cadena|bool|lista|jsn|vacio|vacío)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
        let coincidencia;
        
        while ((coincidencia = regex_funciones_nueva.exec(texto_completo)) !== null) {
            funciones.push(coincidencia[2]);
        }
        
        // Expresión regular para encontrar definiciones de funciones (sintaxis legacy)
        const regex_funciones_legacy = /(?:función|funcion|fn)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
        
        while ((coincidencia = regex_funciones_legacy.exec(texto_completo)) !== null) {
            funciones.push(coincidencia[1]);
        }
        
        return funciones;
    }

    /**
     * Obtiene las variables definidas en el documento
     */
    obtener_variables_documento(document: vscode.TextDocument): string[] {
        const variables: string[] = [];
        const texto_completo = document.getText();
        
        // Expresión regular para encontrar declaraciones de variables
        const regex_variables = /(?:entero|número|numero|cadena|bool|lista|jsn|vacio|vacío)\s+(?:mut\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
        let coincidencia;
        
        while ((coincidencia = regex_variables.exec(texto_completo)) !== null) {
            variables.push(coincidencia[1]);
        }
        
        return variables;
    }

    /**
     * Obtiene los objetos definidos en el documento
     */
    obtener_objetos_documento(document: vscode.TextDocument): string[] {
        const objetos: string[] = [];
        const texto_completo = document.getText();
        
        // Expresión regular para encontrar definiciones de objetos
        const regex_objetos = /objeto\s+([A-Z][a-zA-Z0-9_]*)\s*\{/g;
        let coincidencia;
        
        while ((coincidencia = regex_objetos.exec(texto_completo)) !== null) {
            objetos.push(coincidencia[1]);
        }
        
        return objetos;
    }
}
