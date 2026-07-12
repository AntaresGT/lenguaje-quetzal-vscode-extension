import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { FormateadorQuetzal } from './formateador';
import { DiagnosticadorQuetzal } from './diagnosticador';

let clienteLenguaje: LanguageClient | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Extensión Lenguaje Quetzal activada');

    // Inicializar servidor de lenguaje con implementación LSP
    inicializar_servidor_lenguaje(context);

    // Inicializar formateador
    const formateador = new FormateadorQuetzal();

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

    // Registrar diagnosticador para errores de sintaxis
    const coleccion_diagnosticos = vscode.languages.createDiagnosticCollection('quetzal');
    
    // Función para actualizar diagnósticos
    const actualizar_diagnosticos = (document: vscode.TextDocument) => {
        if (document.languageId === 'quetzal') {
            const habilitado = vscode.workspace
                .getConfiguration('quetzal', document.uri)
                .get<boolean>('diagnosticos.habilitado', true);
            if (!habilitado) {
                coleccion_diagnosticos.delete(document.uri);
                return;
            }
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

    context.subscriptions.push(
        comando_formatear,
        comando_ejecutar,
        proveedor_formato,
        coleccion_diagnosticos,
        cambio_documento,
        apertura_documento
    );

    vscode.window.showInformationMessage('¡Lenguaje Quetzal listo para usar!');
}

export function deactivate() {
    console.log('Extensión Lenguaje Quetzal desactivada');
    if (clienteLenguaje) {
        clienteLenguaje.stop();
    }
}

function inicializar_servidor_lenguaje(context: vscode.ExtensionContext): void {
    const rutaServidor = context.asAbsolutePath(path.join('out', 'servidor', 'servidor.js'));
    const rutaEjemplos = context.asAbsolutePath(path.join('recursos', 'ejemplos'));

    const opcionesServidor: ServerOptions = {
        run: {
            module: rutaServidor,
            transport: TransportKind.ipc
        },
        debug: {
            module: rutaServidor,
            transport: TransportKind.ipc,
            options: {
                execArgv: ['--nolazy', '--inspect=6009']
            }
        }
    };

    const opcionesCliente: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'quetzal' }],
        initializationOptions: {
            rutaEjemplos
        },
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.qz')
        }
    };

    clienteLenguaje = new LanguageClient(
        'quetzalLenguajeServidor',
        'Servidor de Lenguaje Quetzal',
        opcionesServidor,
        opcionesCliente
    );

    clienteLenguaje.start();
    context.subscriptions.push(clienteLenguaje);
}
