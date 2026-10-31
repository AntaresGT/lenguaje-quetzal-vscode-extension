import * as vscode from 'vscode';
import { FormateadorQuetzal } from './formateador';
import { ProveedorCompletado } from './proveedor_completado';
import { DiagnosticadorQuetzal } from './diagnosticador';
import { iniciarClienteLsp, detenerClienteLsp } from './cliente_lsp';
import { resolverRutaLsp } from './resolver_lsp';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Extensión Lenguaje Quetzal activada');

    const formateador = new FormateadorQuetzal();

    const comando_formatear = vscode.commands.registerCommand('quetzal.formatear_documento', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'quetzal') {
            formateador.formatear_documento(editor);
            vscode.window.showInformationMessage('Documento Quetzal formateado correctamente');
        } else {
            vscode.window.showWarningMessage('No hay un archivo Quetzal activo para formatear');
        }
    });

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

    const proveedor_formato = vscode.languages.registerDocumentFormattingEditProvider('quetzal', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            return formateador.obtener_ediciones_formato(document);
        }
    });

    context.subscriptions.push(
        comando_formatear,
        comando_ejecutar,
        proveedor_formato
    );

    const rutaLsp = resolverRutaLsp();
    if (rutaLsp) {
        try {
            await iniciarClienteLsp(rutaLsp);
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`No se pudo iniciar quetzal-lsp: ${mensaje}`);
        }
        return;
    }

    vscode.window.showWarningMessage(
        'No se encontró quetzal-lsp. Instálalo en el PATH o configura quetzal.lsp.ruta.'
    );
    registrarProveedoresLocales(context);
}

function registrarProveedoresLocales(context: vscode.ExtensionContext): void {
    const proveedor_completado = new ProveedorCompletado();
    const diagnosticador = new DiagnosticadorQuetzal();

    const proveedor_completado_registrado = vscode.languages.registerCompletionItemProvider(
        'quetzal',
        proveedor_completado,
        '.', '(', ' '
    );

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

    const coleccion_diagnosticos = vscode.languages.createDiagnosticCollection('quetzal');

    const actualizar_diagnosticos = (document: vscode.TextDocument) => {
        if (document.languageId === 'quetzal') {
            const diagnosticos = diagnosticador.analizar_documento(document);
            coleccion_diagnosticos.set(document.uri, diagnosticos);
        }
    };

    const cambio_documento = vscode.workspace.onDidChangeTextDocument(event => {
        actualizar_diagnosticos(event.document);
    });

    const apertura_documento = vscode.workspace.onDidOpenTextDocument(document => {
        actualizar_diagnosticos(document);
    });

    vscode.workspace.textDocuments.forEach(actualizar_diagnosticos);

    context.subscriptions.push(
        proveedor_completado_registrado,
        proveedor_hover,
        coleccion_diagnosticos,
        cambio_documento,
        apertura_documento
    );
}

export function deactivate(): Thenable<void> | undefined {
    return detenerClienteLsp();
}
