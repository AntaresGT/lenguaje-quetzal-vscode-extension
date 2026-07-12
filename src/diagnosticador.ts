import * as vscode from 'vscode';

interface Apertura {
    simbolo: '(' | '{' | '[';
    posicion: vscode.Position;
}

const PARES: Record<')' | '}' | ']', '(' | '{' | '['> = {
    ')': '(',
    '}': '{',
    ']': '['
};

export class DiagnosticadorQuetzal {
    private palabrasReservadas = new Set([
        'si', 'sino', 'mientras', 'para', 'en', 'cada', 'hacer', 'romper', 'continuar',
        'retornar', 'intentar', 'atrapar', 'capturar', 'finalmente', 'lanzar', 'objeto',
        'prototipo', 'implementa', 'opcional', 'nuevo', 'ambiente', 'padre', 'libre',
        'importar', 'exportar', 'desde', 'como', 'asincrono', 'asíncrono', 'esperar',
        'y', 'o', 'no', 'var', 'público', 'publico', 'privado', 'excepción', 'excepcion'
    ]);

    private tiposDatos = new Set([
        'vacío', 'vacio', 'entero', 'número', 'numero', 'texto', 'log', 'lóg', 'lista',
        'jsn', 'excepción', 'excepcion', 'verdadero', 'falso', 'nulo'
    ]);

    analizar_documento(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnosticos: vscode.Diagnostic[] = [];
        const lineas = document.getText().split(/\r?\n/);

        for (let numeroLinea = 0; numeroLinea < lineas.length; numeroLinea++) {
            const linea = lineas[numeroLinea];
            diagnosticos.push(...this.analizarLinea(linea, numeroLinea));
            diagnosticos.push(...this.analizarDeclaracion(linea, numeroLinea));
            diagnosticos.push(...this.analizarFuncion(linea, numeroLinea));
            diagnosticos.push(...this.analizarDeprecados(linea, numeroLinea));
        }

        diagnosticos.push(...this.analizarDelimitadores(document));
        return diagnosticos;
    }

    private analizarLinea(linea: string, numeroLinea: number): vscode.Diagnostic[] {
        const codigo = this.quitarComentarioLinea(linea).trimEnd();
        if (!codigo || codigo.trimStart().startsWith('/*')) return [];
        if (!codigo.endsWith(';')) return [];

        const columna = linea.lastIndexOf(';');
        return [new vscode.Diagnostic(
            new vscode.Range(numeroLinea, columna, numeroLinea, columna + 1),
            'Quetzal no utiliza punto y coma (;) al final de las instrucciones.',
            vscode.DiagnosticSeverity.Warning
        )];
    }

    private analizarDeclaracion(linea: string, numeroLinea: number): vscode.Diagnostic[] {
        const coincidencia = this.quitarComentarioLinea(linea).trim().match(
            /^(entero|número|numero|texto|log|lóg|lista|jsn|vacio|vacío)\s+(?:var\s+)?([\p{L}_][\p{L}\p{N}_]*)\s*=/u
        );
        return coincidencia ? this.validarNombre(coincidencia[2], linea, numeroLinea, 'variable') : [];
    }

    private analizarFuncion(linea: string, numeroLinea: number): vscode.Diagnostic[] {
        const coincidencia = this.quitarComentarioLinea(linea).trim().match(
            /^(?:(?:libre|asincrono|asíncrono)\s+)*(?:entero|número|numero|texto|log|lóg|lista|jsn|vacio|vacío)\s+([\p{L}_][\p{L}\p{N}_]*)\s*\(/u
        );
        return coincidencia ? this.validarNombre(coincidencia[1], linea, numeroLinea, 'función') : [];
    }

    private validarNombre(nombre: string, linea: string, numeroLinea: number, clase: string): vscode.Diagnostic[] {
        if (!this.palabrasReservadas.has(nombre) && !this.tiposDatos.has(nombre)) return [];
        const inicio = linea.indexOf(nombre);
        return [new vscode.Diagnostic(
            new vscode.Range(numeroLinea, inicio, numeroLinea, inicio + nombre.length),
            `"${nombre}" es una palabra reservada y no puede usarse como nombre de ${clase}.`,
            vscode.DiagnosticSeverity.Error
        )];
    }

    private analizarDeprecados(linea: string, numeroLinea: number): vscode.Diagnostic[] {
        const diagnosticos: vscode.Diagnostic[] = [];
        const codigo = this.quitarComentarioLinea(linea);
        const regex = /\b(imprimir(?:_[\p{L}\p{N}_]+)?)\s*\(/gu;
        let coincidencia: RegExpExecArray | null;
        while ((coincidencia = regex.exec(codigo)) !== null) {
            const nombre = coincidencia[1];
            diagnosticos.push(new vscode.Diagnostic(
                new vscode.Range(numeroLinea, coincidencia.index, numeroLinea, coincidencia.index + nombre.length),
                `Método deprecado: ${nombre}. Usa consola.mostrar(...).`,
                vscode.DiagnosticSeverity.Warning
            ));
        }
        return diagnosticos;
    }

    private analizarDelimitadores(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnosticos: vscode.Diagnostic[] = [];
        const aperturas: Apertura[] = [];
        const texto = document.getText();
        let linea = 0;
        let columna = 0;
        let enCadena = false;
        let enComentarioBloque = false;
        let escape = false;

        for (let indice = 0; indice < texto.length; indice++) {
            const caracter = texto[indice];
            const siguiente = texto[indice + 1];
            const posicion = new vscode.Position(linea, columna);

            if (enComentarioBloque) {
                if (caracter === '*' && siguiente === '/') {
                    enComentarioBloque = false;
                    indice++;
                    columna++;
                }
            } else if (enCadena) {
                if (!escape && caracter === '"') enCadena = false;
                escape = !escape && caracter === '\\';
                if (caracter !== '\\') escape = false;
            } else if (caracter === '/' && siguiente === '/') {
                while (indice < texto.length && texto[indice] !== '\n') {
                    indice++;
                    columna++;
                }
                indice--;
                columna--;
            } else if (caracter === '/' && siguiente === '*') {
                enComentarioBloque = true;
                indice++;
                columna++;
            } else if (caracter === '"') {
                enCadena = true;
            } else if (caracter === '(' || caracter === '{' || caracter === '[') {
                aperturas.push({ simbolo: caracter, posicion });
            } else if (caracter === ')' || caracter === '}' || caracter === ']') {
                const apertura = aperturas.pop();
                if (!apertura || apertura.simbolo !== PARES[caracter]) {
                    diagnosticos.push(new vscode.Diagnostic(
                        new vscode.Range(posicion, posicion.translate(0, 1)),
                        `"${caracter}" no tiene un delimitador de apertura compatible.`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            }

            if (caracter === '\n') {
                linea++;
                columna = 0;
            } else {
                columna++;
            }
        }

        if (enCadena) {
            const posicion = new vscode.Position(linea, Math.max(0, columna - 1));
            diagnosticos.push(new vscode.Diagnostic(
                new vscode.Range(posicion, posicion.translate(0, 1)),
                'Cadena de texto sin cerrar.',
                vscode.DiagnosticSeverity.Error
            ));
        }
        if (enComentarioBloque) {
            diagnosticos.push(new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 1),
                'Comentario de bloque sin cerrar.',
                vscode.DiagnosticSeverity.Error
            ));
        }
        for (const apertura of aperturas) {
            diagnosticos.push(new vscode.Diagnostic(
                new vscode.Range(apertura.posicion, apertura.posicion.translate(0, 1)),
                `Falta cerrar "${apertura.simbolo}".`,
                vscode.DiagnosticSeverity.Error
            ));
        }
        return diagnosticos;
    }

    private quitarComentarioLinea(linea: string): string {
        let enCadena = false;
        let escape = false;
        for (let indice = 0; indice < linea.length - 1; indice++) {
            const caracter = linea[indice];
            if (!escape && caracter === '"') enCadena = !enCadena;
            escape = !escape && caracter === '\\';
            if (caracter !== '\\') escape = false;
            if (!enCadena && caracter === '/' && linea[indice + 1] === '/') return linea.slice(0, indice);
        }
        return linea;
    }

    crear_diagnostico(
        linea: number,
        columna_inicio: number,
        columna_fin: number,
        mensaje: string,
        severidad: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error
    ): vscode.Diagnostic {
        return new vscode.Diagnostic(new vscode.Range(linea, columna_inicio, linea, columna_fin), mensaje, severidad);
    }
}
