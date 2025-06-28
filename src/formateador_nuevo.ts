import * as vscode from 'vscode';

export class FormateadorQuetzal {
    private configuracion: vscode.WorkspaceConfiguration;

    constructor() {
        this.configuracion = vscode.workspace.getConfiguration('quetzal');
        console.log('Formateador Quetzal inicializado');
    }

    /**
     * Formatea todo el documento activo
     */
    formatear_documento(editor: vscode.TextEditor): void {
        const documento = editor.document;
        const texto_completo = documento.getText();
        const texto_formateado = this.formatear_texto(texto_completo);

        const edicion = new vscode.WorkspaceEdit();
        const rango_completo = new vscode.Range(
            documento.positionAt(0),
            documento.positionAt(texto_completo.length)
        );
        
        edicion.replace(documento.uri, rango_completo, texto_formateado);
        vscode.workspace.applyEdit(edicion);
    }

    /**
     * Obtiene las ediciones de formato para el documento
     */
    obtener_ediciones_formato(documento: vscode.TextDocument): vscode.TextEdit[] {
        const texto_completo = documento.getText();
        const texto_formateado = this.formatear_texto(texto_completo);
        
        const rango_completo = new vscode.Range(
            documento.positionAt(0),
            documento.positionAt(texto_completo.length)
        );

        return [vscode.TextEdit.replace(rango_completo, texto_formateado)];
    }

    /**
     * Formatea el texto según las reglas de Quetzal
     */
    private formatear_texto(texto: string): string {
        const lineas = texto.split('\n');
        const lineas_formateadas: string[] = [];
        let nivel_sangria = 0;
        const espacios_sangria = this.configuracion.get<number>('formateador.sangría', 4);
        
        for (let i = 0; i < lineas.length; i++) {
            let linea = lineas[i].trim();
            
            // Saltar líneas vacías
            if (linea === '') {
                lineas_formateadas.push('');
                continue;
            }

            // Ajustar sangría antes de procesar
            if (this.debe_reducir_sangria(linea)) {
                nivel_sangria = Math.max(0, nivel_sangria - 1);
            }

            // Aplicar sangría
            const sangria = ' '.repeat(nivel_sangria * espacios_sangria);
            linea = this.formatear_linea(linea);
            lineas_formateadas.push(sangria + linea);

            // Ajustar sangría después de procesar
            if (this.debe_aumentar_sangria(linea)) {
                nivel_sangria++;
            }
        }

        return lineas_formateadas.join('\n');
    }

    /**
     * Formatea una línea individual
     */
    private formatear_linea(linea: string): string {
        // Agregar espacio después de palabras clave
        linea = linea.replace(/\b(si|sino|mientras|para|funcion|objeto)\s*\(/g, '$1 (');
        
        // Agregar espacio alrededor de operadores
        linea = linea.replace(/([^=!<>])=([^=])/g, '$1 = $2');
        linea = linea.replace(/([^=!<>])==([^=])/g, '$1 == $2');
        linea = linea.replace(/([^=!<>])!=([^=])/g, '$1 != $2');
        linea = linea.replace(/([^<])<=([^=])/g, '$1 <= $2');
        linea = linea.replace(/([^>])>=([^=])/g, '$1 >= $2');
        
        // Espacio después de comas
        linea = linea.replace(/,(?!\s)/g, ', ');
        
        // Limpiar espacios múltiples
        linea = linea.replace(/\s+/g, ' ');
        
        return linea;
    }

    /**
     * Determina si se debe aumentar la sangría después de esta línea
     */
    private debe_aumentar_sangria(linea: string): boolean {
        const patrones_aumento = [
            /\{\s*$/,  // Línea termina con {
            /\b(si|sino|mientras|para|funcion|objeto)\b.*\{\s*$/,  // Palabras clave seguidas de {
            /\bpublico:\s*$/,  // publico:
            /\bprivado:\s*$/   // privado:
        ];

        return patrones_aumento.some(patron => patron.test(linea));
    }

    /**
     * Determina si se debe reducir la sangría antes de esta línea
     */
    private debe_reducir_sangria(linea: string): boolean {
        const patrones_reduccion = [
            /^\}\s*$/,          // Línea solo con }
            /^\}\s*sino\b/,    // } sino
            /^sino\b/,           // sino al inicio
            /\bpublico:\s*$/,   // publico:
            /\bprivado:\s*$/    // privado:
        ];

        return patrones_reduccion.some(patron => patron.test(linea));
    }

    /**
     * Actualiza la configuración del formateador
     */
    actualizar_configuracion(): void {
        this.configuracion = vscode.workspace.getConfiguration('quetzal');
    }
}
