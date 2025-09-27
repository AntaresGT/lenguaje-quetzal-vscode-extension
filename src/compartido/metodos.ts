export interface MetodoDefinido {
    nombre: string;
    retorno?: string;
    snippet?: string;
}

export type MetodosPorTipo = Record<string, MetodoDefinido[]>;

export const METODOS_POR_TIPO: MetodosPorTipo = {
    texto: [
        { nombre: 'longitud()', retorno: 'entero' },
        { nombre: 'entero()', retorno: 'entero' },
        { nombre: 'numero()', retorno: 'número' },
        { nombre: 'log()', retorno: 'log' },
        { nombre: 'mayusculas()', retorno: 'texto' },
        { nombre: 'minusculas()', retorno: 'texto' },
        { nombre: 'capitalizar()', retorno: 'texto' },
        { nombre: 'titulo()', retorno: 'texto' },
        { nombre: 'recortar()', retorno: 'texto' },
        { nombre: 'recortar_inicio()', retorno: 'texto' },
        { nombre: 'recortar_final()', retorno: 'texto' },
        { nombre: 'contiene(${1:subtexto})', retorno: 'log', snippet: 'contiene(${1:subtexto})' },
        { nombre: 'empieza_con(${1:prefijo})', retorno: 'log', snippet: 'empieza_con(${1:prefijo})' },
        { nombre: 'termina_con(${1:sufijo})', retorno: 'log', snippet: 'termina_con(${1:sufijo})' },
        { nombre: 'encontrar(${1:subtexto})', retorno: 'entero', snippet: 'encontrar(${1:subtexto})' },
        { nombre: 'buscar_ultimo(${1:subtexto})', retorno: 'entero', snippet: 'buscar_ultimo(${1:subtexto})' },
        { nombre: 'reemplazar(${1:buscar}, ${2:reemplazo})', retorno: 'texto', snippet: 'reemplazar(${1:buscar}, ${2:reemplazo})' },
        { nombre: 'reemplazar_primero(${1:buscar}, ${2:reemplazo})', retorno: 'texto', snippet: 'reemplazar_primero(${1:buscar}, ${2:reemplazo})' },
        { nombre: 'dividir(${1:separador})', retorno: 'lista<texto>', snippet: 'dividir(${1:separador})' },
        { nombre: 'partir_lineas()', retorno: 'lista<texto>' },
        { nombre: 'repetir(${1:veces})', retorno: 'texto', snippet: 'repetir(${1:veces})' },
        { nombre: 'subtexto(${1:inicio}, ${2:fin})', retorno: 'texto', snippet: 'subtexto(${1:inicio}, ${2:fin})' },
        { nombre: 'izquierda(${1:n})', retorno: 'texto', snippet: 'izquierda(${1:n})' },
        { nombre: 'derecha(${1:n})', retorno: 'texto', snippet: 'derecha(${1:n})' },
        { nombre: 'es_numero()', retorno: 'log' },
        { nombre: 'es_entero()', retorno: 'log' },
        { nombre: 'es_alfanumerico()', retorno: 'log' },
        { nombre: 'a_base64()', retorno: 'texto' },
        { nombre: 'decodificar_base64()', retorno: 'texto' },
        { nombre: 'a_url()', retorno: 'texto' },
        { nombre: 'decodificar_url()', retorno: 'texto' },
        { nombre: 'igual_sin_caso(${1:otro})', retorno: 'log', snippet: 'igual_sin_caso(${1:otro})' },
        { nombre: 'jsn()', retorno: 'jsn' },
        { nombre: 'lista()', retorno: 'lista' },
        { nombre: 'contar(${1:subtexto})', retorno: 'entero', snippet: 'contar(${1:subtexto})' },
        { nombre: 'invertir()', retorno: 'texto' }
    ],
    lista: [
        { nombre: 'longitud()', retorno: 'entero' },
        { nombre: 'esta_vacia()', retorno: 'log' },
        { nombre: 'agregar(${1:valor})', retorno: 'vacío', snippet: 'agregar(${1:valor})' },
        { nombre: 'insertar(${1:indice}, ${2:valor})', retorno: 'vacío', snippet: 'insertar(${1:indice}, ${2:valor})' },
        { nombre: 'remover(${1:valor})', retorno: 'vacío', snippet: 'remover(${1:valor})' },
        { nombre: 'quitar_en(${1:indice})', retorno: 'vacío', snippet: 'quitar_en(${1:indice})' },
        { nombre: 'limpiar()', retorno: 'vacío' },
        { nombre: 'contiene(${1:valor})', retorno: 'log', snippet: 'contiene(${1:valor})' },
        { nombre: 'buscar(${1:valor})', retorno: 'entero', snippet: 'buscar(${1:valor})' },
        { nombre: 'buscar_ultimo(${1:valor})', retorno: 'entero', snippet: 'buscar_ultimo(${1:valor})' },
        { nombre: 'contar(${1:valor})', retorno: 'entero', snippet: 'contar(${1:valor})' },
        { nombre: 'ordenar()', retorno: 'vacío' },
        { nombre: 'ordenar_descendente()', retorno: 'vacío' },
        { nombre: 'ordenado()', retorno: 'lista' },
        { nombre: 'invertir()', retorno: 'vacío' },
        { nombre: 'primero()', retorno: 'elemento' },
        { nombre: 'ultimo()', retorno: 'elemento' },
        { nombre: 'tomar(${1:n})', retorno: 'lista', snippet: 'tomar(${1:n})' },
        { nombre: 'saltar(${1:n})', retorno: 'lista', snippet: 'saltar(${1:n})' },
        { nombre: 'sublista(${1:inicio}, ${2:fin})', retorno: 'lista', snippet: 'sublista(${1:inicio}, ${2:fin})' },
        { nombre: 'sumar()', retorno: 'número' },
        { nombre: 'promedio()', retorno: 'número' },
        { nombre: 'maximo()', retorno: 'entero' },
        { nombre: 'minimo()', retorno: 'entero' },
        { nombre: 'unir(${1:separador})', retorno: 'texto', snippet: 'unir(${1:separador})' },
        { nombre: 'concatenar(${1:otra_lista})', retorno: 'lista', snippet: 'concatenar(${1:otra_lista})' },
        { nombre: 'extender(${1:otra_lista})', retorno: 'vacío', snippet: 'extender(${1:otra_lista})' },
        { nombre: 'texto()', retorno: 'texto' },
        { nombre: 'json()', retorno: 'texto' },
        { nombre: 'logico()', retorno: 'log' }
    ],
    jsn: [
        { nombre: 'contiene_clave(${1:clave})', retorno: 'log', snippet: 'contiene_clave(${1:clave})' },
        { nombre: 'claves()', retorno: 'lista<texto>' },
        { nombre: 'valores()', retorno: 'lista' },
        { nombre: 'establecer(${1:clave}, ${2:valor})', retorno: 'vacío', snippet: 'establecer(${1:clave}, ${2:valor})' },
        { nombre: 'eliminar(${1:clave})', retorno: 'vacío', snippet: 'eliminar(${1:clave})' },
        { nombre: 'fusionar(${1:otro_jsn})', retorno: 'vacío', snippet: 'fusionar(${1:otro_jsn})' },
        { nombre: 'texto()', retorno: 'texto' },
        { nombre: 'texto_formateado()', retorno: 'texto' }
    ],
    numero: [
        { nombre: 'texto()', retorno: 'texto' }
    ],
    'número': [
        { nombre: 'texto()', retorno: 'texto' }
    ],
    entero: [
        { nombre: 'texto()', retorno: 'texto' }
    ],
    log: [
        { nombre: 'texto()', retorno: 'texto' }
    ],
    consola: [
        { nombre: 'mostrar(${1:texto})', retorno: 'vacío', snippet: 'mostrar(${1:texto})' },
        { nombre: 'mostrar_error(${1:texto})', retorno: 'vacío', snippet: 'mostrar_error(${1:texto})' },
        { nombre: 'mostrar_advertencia(${1:texto})', retorno: 'vacío', snippet: 'mostrar_advertencia(${1:texto})' },
        { nombre: 'mostrar_exito(${1:texto})', retorno: 'vacío', snippet: 'mostrar_exito(${1:texto})' },
        { nombre: 'mostrar_informacion(${1:texto})', retorno: 'vacío', snippet: 'mostrar_informacion(${1:texto})' },
        { nombre: 'pedir(${1:mensaje})', retorno: 'texto', snippet: 'pedir(${1:mensaje})' },
        { nombre: 'pedir_secreto(${1:mensaje})', retorno: 'texto', snippet: 'pedir_secreto(${1:mensaje})' }
    ]
};
