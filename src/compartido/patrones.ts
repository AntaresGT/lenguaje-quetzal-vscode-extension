export const IDENTIFICADOR = String.raw`[\p{L}_][\p{L}\p{N}_]*`;

export const PATRON_TIPO = String.raw`(?:entero|número|numero|texto|log|lista\s*<\s*[^>]+?\s*>|lista|jsn|vacio|vacío|excepción|excepcion|[A-Z][\p{L}\p{N}_]*)`;

export function limpiarComentarios(texto: string): string {
    const sinComentariosLinea = texto.replace(/\/\/.*$/gm, '');
    return sinComentariosLinea.replace(/\/\*[\s\S]*?\*\//g, '');
}
