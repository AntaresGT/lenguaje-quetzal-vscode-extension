import * as vscode from 'vscode';

// Representación mínima de tipos para Quetzal
export type TipoBase = 'entero' | 'numero' | 'número' | 'texto' | 'log' | 'lista' | 'jsn' | 'vacio' | 'vacío' | 'desconocido';

export interface TipoInfo {
    base: TipoBase;
    generico?: TipoInfo; // Para lista<tipo>
}

const IDENT_UNICODE = String.raw`[\p{L}_][\p{L}\p{N}_]*`;

export class ServidorLenguajeQuetzal {
    constructor() {
        console.log('Servidor de Lenguaje Quetzal inicializado');
    }

    // Normaliza sinónimos a un tipo canónico
    normalizarTipo(tipo: string): TipoInfo {
        const t = tipo.normalize('NFC').toLowerCase();
        if (t.startsWith('lista')) {
            const m = t.match(/^lista\s*<\s*([^>]+)\s*>/u);
            if (m) {
                const interno = this.normalizarTipo(m[1].trim());
                return { base: 'lista', generico: interno };
            }
            return { base: 'lista' };
        }
        if (t === 'número' || t === 'numero') return { base: 'numero' };
        if (t === 'vacío' || t === 'vacio') return { base: 'vacio' };
        if (t === 'cadena') return { base: 'texto' };
        if (t === 'bool' || t === 'log') return { base: 'log' };
        if (t === 'entero') return { base: 'entero' };
        if (t === 'texto') return { base: 'texto' };
        if (t === 'jsn') return { base: 'jsn' };
        return { base: 'desconocido' };
    }

    /** Dado un tipo base y un método, retorna el tipo de resultado si es conocido */
    retorno_de_metodo(tipo: TipoInfo, metodoConParentesis: string): TipoInfo | undefined {
        const nombreMetodo = metodoConParentesis.replace(/\s*\(.*/, '');
        const lista = this.metodos_por_tipo(tipo);
        const entry = lista.find(m => m.nombre.startsWith(nombreMetodo + '('));
        if (!entry || !entry.detalle) return undefined;
        return this.normalizarTipo(entry.detalle);
    }

    /** Inferir tipo de una expresión simple o encadenada (heurística mínima) */
    tipo_de_cadena(document: vscode.TextDocument, fragmento: string): TipoInfo {
        const frag = fragmento.trim();
        // Cadena con puntos: evaluar de izquierda a derecha
        if (frag.includes('.')) {
            const partes = frag.split('.');
            let tipoActual = this.tipo_de_cadena(document, partes.shift() as string);
            for (const seg of partes) {
                const segTrim = seg.trim();
                // Método con paréntesis
                const m = segTrim.match(/^([\p{L}_][\p{L}\p{N}_]*)\s*\(/u);
                if (m) {
                    const ret = this.retorno_de_metodo(tipoActual, m[1] + '(');
                    tipoActual = ret ?? { base: 'desconocido' };
                } else {
                    // Acceso a propiedad no tipado -> desconocido
                    tipoActual = { base: 'desconocido' };
                }
            }
            return tipoActual;
        }
        // Identificador
        if (new RegExp(`^${IDENT_UNICODE}$`, 'u').test(frag)) {
            return this.tipo_de_identificador(document, frag) ?? { base: 'desconocido' };
        }
        // Literales
        if (/^t?"/.test(frag)) return { base: 'texto' };
        if (/^[0-9]+$/.test(frag)) return { base: 'entero' };
        if (/^[0-9]+\.[0-9]+$/.test(frag)) return { base: 'numero' };
        if (/^(verdadero|falso)$/u.test(frag)) return { base: 'log' };
        if (/^\[/.test(frag)) return { base: 'lista' };
        if (/^\{/.test(frag)) return { base: 'jsn' };
        return { base: 'desconocido' };
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
        const REGEX_DEF_FUNC = new RegExp(String.raw`\b(entero|número|numero|texto|cadena|log|bool|lista|jsn|vacio|vacío)\s+${IDENT_UNICODE}\s*\(`, 'u');
        for (let i = position.line; i >= 0; i--) {
            const linea = document.lineAt(i).text.trim();
            if (linea.includes('función ') || linea.includes('funcion ') || linea.includes('fn ') || REGEX_DEF_FUNC.test(linea)) {
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
     * Mapa nombre -> tipo inferido para el documento
     */
    inferir_tipos_documento(document: vscode.TextDocument): Map<string, TipoInfo> {
        const tipos = new Map<string, TipoInfo>();
        const texto = document.getText();
        // Declaración de variables: tipo [<gen>] [var ] nombre = ...
        const REGEX_DECL = new RegExp(String.raw`\b(entero|número|numero|texto|cadena|log|bool|lista\s*<\s*[^>]+\s*>|lista|jsn|vacio|vacío)\s+(?:var\s+)?(${IDENT_UNICODE})\s*=`, 'ug');
        let m: RegExpExecArray | null;
        while ((m = REGEX_DECL.exec(texto)) !== null) {
            const tipo = this.normalizarTipo(m[1]);
            const nombre = m[2];
            tipos.set(nombre, tipo);
        }
        return tipos;
    }

    /** Obtiene el tipo de un identificador si está declarado en el documento */
    tipo_de_identificador(document: vscode.TextDocument, nombre: string): TipoInfo | undefined {
        const mapa = this.inferir_tipos_documento(document);
        return mapa.get(nombre);
    }

    /**
     * Obtiene las funciones definidas en el documento
     */
    obtener_funciones_documento(document: vscode.TextDocument): string[] {
        const funciones: string[] = [];
        const texto_completo = document.getText();
        const REGEX_FUNC_NUEVA = new RegExp(String.raw`\b(entero|número|numero|texto|cadena|log|bool|lista|jsn|vacio|vacío)\s+(${IDENT_UNICODE})\s*\(`, 'ug');
        const REGEX_FUNC_LEG = new RegExp(String.raw`(?:función|funcion|fn)\s+(${IDENT_UNICODE})\s*\(`, 'ug');
        let coincidencia: RegExpExecArray | null;
        while ((coincidencia = REGEX_FUNC_NUEVA.exec(texto_completo)) !== null) {
            funciones.push(coincidencia[2]);
        }
        while ((coincidencia = REGEX_FUNC_LEG.exec(texto_completo)) !== null) {
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
        const REGEX_VARS = new RegExp(String.raw`\b(entero|número|numero|texto|cadena|log|bool|lista(?:\s*<\s*[^>]+\s*>)?|jsn|vacio|vacío)\s+(?:var\s+)?(${IDENT_UNICODE})\s*=`, 'ug');
        let coincidencia: RegExpExecArray | null;
        while ((coincidencia = REGEX_VARS.exec(texto_completo)) !== null) {
            variables.push(coincidencia[2]);
        }
        return variables;
    }

    /**
     * Obtiene los objetos definidos en el documento
     */
    obtener_objetos_documento(document: vscode.TextDocument): string[] {
        const objetos: string[] = [];
        const texto_completo = document.getText();
        const REGEX_OBJ = new RegExp(String.raw`\bobjeto\s+([A-Z][\p{L}\p{N}_]*)\s*\{`, 'ug');
        let coincidencia: RegExpExecArray | null;
        while ((coincidencia = REGEX_OBJ.exec(texto_completo)) !== null) {
            objetos.push(coincidencia[1]);
        }
        return objetos;
    }

    /** Lista de métodos disponibles por tipo base (según ejemplos) */
    metodos_por_tipo(tipo: TipoInfo): { nombre: string; snippet?: string; detalle?: string }[] {
        const base = this.normalizarTipo(tipo.base).base;
        if (base === 'texto') {
            return [
                { nombre: 'longitud()', detalle: 'entero' },
                { nombre: 'entero()', detalle: 'entero' },
                { nombre: 'numero()', detalle: 'número' },
                { nombre: 'mayusculas()', detalle: 'texto' },
                { nombre: 'minusculas()', detalle: 'texto' },
                { nombre: 'capitalizar()', detalle: 'texto' },
                { nombre: 'titulo()', detalle: 'texto' },
                { nombre: 'recortar()', detalle: 'texto' },
                { nombre: 'recortar_inicio()', detalle: 'texto' },
                { nombre: 'recortar_final()', detalle: 'texto' },
                { nombre: 'contiene(${1:subtexto})', detalle: 'log' },
                { nombre: 'empieza_con(${1:prefijo})', detalle: 'log' },
                { nombre: 'termina_con(${1:sufijo})', detalle: 'log' },
                { nombre: 'encontrar(${1:subtexto})', detalle: 'entero' },
                { nombre: 'buscar_ultimo(${1:subtexto})', detalle: 'entero' },
                { nombre: 'reemplazar(${1:buscar}, ${2:reemplazo})', detalle: 'texto' },
                { nombre: 'reemplazar_primero(${1:buscar}, ${2:reemplazo})', detalle: 'texto' },
                { nombre: 'dividir(${1:separador})', detalle: 'lista<texto>' },
                { nombre: 'partir_lineas()', detalle: 'lista<texto>' },
                { nombre: 'repetir(${1:veces})', detalle: 'texto' },
                { nombre: 'subtexto(${1:inicio}, ${2:fin})', detalle: 'texto' },
                { nombre: 'izquierda(${1:n})', detalle: 'texto' },
                { nombre: 'derecha(${1:n})', detalle: 'texto' },
                { nombre: 'es_numero()', detalle: 'log' },
                { nombre: 'es_entero()', detalle: 'log' },
                { nombre: 'es_alfanumerico()', detalle: 'log' },
                { nombre: 'a_base64()', detalle: 'texto' },
                { nombre: 'decodificar_base64()', detalle: 'texto' },
                { nombre: 'a_url()', detalle: 'texto' },
                { nombre: 'decodificar_url()', detalle: 'texto' },
                { nombre: 'igual_sin_caso(${1:otro})', detalle: 'log' },
                { nombre: 'jsn()', detalle: 'jsn' }
            ];
        }
        if (base === 'lista') {
            return [
                { nombre: 'longitud()', detalle: 'entero' },
                { nombre: 'esta_vacia()', detalle: 'log' },
                { nombre: 'agregar(${1:valor})', detalle: 'vacio' },
                { nombre: 'insertar(${1:indice}, ${2:valor})', detalle: 'vacio' },
                { nombre: 'remover(${1:valor})', detalle: 'vacio' },
                { nombre: 'quitar_en(${1:indice})', detalle: 'vacio' },
                { nombre: 'limpiar()', detalle: 'vacio' },
                { nombre: 'contiene(${1:valor})', detalle: 'log' },
                { nombre: 'buscar(${1:valor})', detalle: 'entero' },
                { nombre: 'buscar_ultimo(${1:valor})', detalle: 'entero' },
                { nombre: 'contar(${1:valor})', detalle: 'entero' },
                { nombre: 'ordenar()', detalle: 'vacio' },
                { nombre: 'ordenar_descendente()', detalle: 'vacio' },
                { nombre: 'ordenado()', detalle: 'lista' },
                { nombre: 'invertir()', detalle: 'vacio' },
                { nombre: 'primero()', detalle: 'elemento' },
                { nombre: 'ultimo()', detalle: 'elemento' },
                { nombre: 'tomar(${1:n})', detalle: 'lista' },
                { nombre: 'saltar(${1:n})', detalle: 'lista' },
                { nombre: 'sublista(${1:inicio}, ${2:fin})', detalle: 'lista' },
                { nombre: 'sumar()', detalle: 'numero' },
                { nombre: 'promedio()', detalle: 'numero' },
                { nombre: 'maximo()', detalle: 'entero' },
                { nombre: 'minimo()', detalle: 'entero' },
                { nombre: 'unir(${1:separador})', detalle: 'texto' },
                { nombre: 'concatenar(${1:otra_lista})', detalle: 'lista' },
                { nombre: 'extender(${1:otra_lista})', detalle: 'vacio' },
                { nombre: 'texto()', detalle: 'texto' },
                { nombre: 'json()', detalle: 'texto' },
                { nombre: 'logico()', detalle: 'log' }
            ];
        }
        if (base === 'jsn') {
            return [
                { nombre: 'contiene_clave(${1:clave})', detalle: 'log' },
                { nombre: 'claves()', detalle: 'lista<texto>' },
                { nombre: 'valores()', detalle: 'lista' },
                { nombre: 'establecer(${1:clave}, ${2:valor})', detalle: 'vacio' },
                { nombre: 'eliminar(${1:clave})', detalle: 'vacio' },
                { nombre: 'fusionar(${1:otro_jsn})', detalle: 'vacio' },
                { nombre: 'texto()', detalle: 'texto' },
                { nombre: 'texto_formateado()', detalle: 'texto' }
            ];
        }
        if (base === 'entero' || base === 'numero' || base === 'número') {
            return [
                { nombre: 'texto()', detalle: 'texto' }
            ];
        }
        if (base === 'log') {
            return [
                { nombre: 'texto()', detalle: 'texto' }
            ];
        }
        return [];
    }
}
