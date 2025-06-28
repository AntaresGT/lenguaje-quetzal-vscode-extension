import * as vscode from 'vscode';
import { ServidorLenguajeQuetzal } from './servidor_lenguaje';
import { FormateadorQuetzal } from './formateador';
import { ProveedorCompletado } from './proveedor_completado';
import { DiagnosticadorQuetzal } from './diagnosticador';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extensión Lenguaje Quetzal activada');

    // Inicializar servidor de lenguaje
    const servidor_lenguaje = new ServidorLenguajeQuetzal();
    
    // Inicializar formateador
    const formateador = new FormateadorQuetzal();
    
    // Inicializar proveedor de autocompletado
    const proveedor_completado = new ProveedorCompletado();
    
    // Inicializar diagnosticador
    const diagnosticador = new DiagnosticadorQuetzal();

    // Registrar comando para formatear documento
    const comando_formatear = vscode.commands.registerCommand('quetzal.formatear_documento', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'quetzal') {
            formateador.formatear_documento(editor);
            vscode.window.showInformationMessage('Documento Quetzal formateado correctamente');
        } else {
            vscode.window.showWarningMessage('No hay un archivo Quetzal activo para formatear');
        }
    });

    // Registrar comando para ejecutar archivo
    const comando_ejecutar = vscode.commands.registerCommand('quetzal.ejecutar_archivo', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'quetzal') {
            const terminal = vscode.window.createTerminal('Quetzal');
            terminal.sendText(`echo \"Ejecutando archivo Quetzal: ${editor.document.fileName}\"`);
            terminal.show();
            vscode.window.showInformationMessage('Archivo Quetzal enviado al terminal');
        } else {
            vscode.window.showWarningMessage('No hay un archivo Quetzal activo para ejecutar');
        }
    });

    // Registrar proveedor de formato de documento
    const proveedor_formato = vscode.languages.registerDocumentFormattingEditProvider('quetzal', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            return formateador.obtener_ediciones_formato(document);
        }
    });

    // Registrar proveedor de autocompletado
    const proveedor_completado_registrado = vscode.languages.registerCompletionItemProvider(
        'quetzal',
        proveedor_completado,
        '.', '(', ' '
    );

    // Registrar proveedor de hover información
    const proveedor_hover = vscode.languages.registerHoverProvider('quetzal', {
        provideHover(document, position, token) {
            const palabra = document.getWordRangeAtPosition(position);
            if (palabra) {
                const texto_palabra = document.getText(palabra);
                return proveedor_completado.obtener_informacion_hover(texto_palabra);
            }
            return null;
        }
    });

    // Registrar diagnosticador para errores de sintaxis
    const coleccion_diagnosticos = vscode.languages.createDiagnosticCollection('quetzal');
    
    // Función para actualizar diagnósticos
    const actualizar_diagnosticos = (document: vscode.TextDocument) => {
        if (document.languageId === 'quetzal') {
            const diagnosticos = diagnosticador.analizar_documento(document);
            coleccion_diagnosticos.set(document.uri, diagnosticos);
        }
    };

    // Escuchar cambios en documentos
    const cambio_documento = vscode.workspace.onDidChangeTextDocument(event => {
        actualizar_diagnosticos(event.document);
    });

    // Escuchar apertura de documentos
    const apertura_documento = vscode.workspace.onDidOpenTextDocument(document => {
        actualizar_diagnosticos(document);
    });

    // Analizar documentos ya abiertos
    vscode.workspace.textDocuments.forEach(actualizar_diagnosticos);

    // Agregar disposables al contexto
    context.subscriptions.push(
        comando_formatear,
        comando_ejecutar,
        proveedor_formato,
        proveedor_completado_registrado,
        proveedor_hover,
        coleccion_diagnosticos,
        cambio_documento,
        apertura_documento
    );

    vscode.window.showInformationMessage('¡Lenguaje Quetzal listo para usar!');
}

export function deactivate() {
    console.log('Extensión Lenguaje Quetzal desactivada');
}
