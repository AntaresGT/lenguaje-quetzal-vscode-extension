import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';

let cliente: LanguageClient | undefined;

/**
 * Arranca el cliente LSP contra el ejecutable ya resuelto.
 */
export async function iniciarClienteLsp(rutaEjecutable: string): Promise<LanguageClient> {
    const opcionesServidor: ServerOptions = {
        command: rutaEjecutable,
        args: ['--stdio'],
        transport: TransportKind.stdio,
        options: { shell: false },
    };

    const opcionesCliente: LanguageClientOptions = {
        documentSelector: [
            { language: 'quetzal', scheme: 'file' },
            { language: 'quetzal', scheme: 'untitled' },
        ],
        outputChannelName: 'Quetzal LSP',
    };

    cliente = new LanguageClient(
        'quetzalLsp',
        'Quetzal LSP',
        opcionesServidor,
        opcionesCliente
    );

    await cliente.start();
    return cliente;
}

/**
 * Detiene el cliente LSP si está en marcha.
 */
export function detenerClienteLsp(): Thenable<void> | undefined {
    if (!cliente) {
        return undefined;
    }
    const promesa = cliente.stop();
    cliente = undefined;
    return promesa;
}
