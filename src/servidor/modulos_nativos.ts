export interface MiembroNativo {
    nombre: string;
    descripcion: string;
    retorno?: string;
    parametros?: string[];
    propiedad?: boolean;
    estatico?: boolean;
}

export interface SimboloNativo {
    nombre: string;
    descripcion: string;
    constructible?: boolean;
    miembros: MiembroNativo[];
}

export interface ModuloNativo {
    ruta: string;
    descripcion: string;
    documentacion: string;
    simbolos: SimboloNativo[];
}

const DOCUMENTACION = 'https://lenguaje-quetzal.com';

function metodo(
    nombre: string,
    descripcion: string,
    retorno?: string,
    parametros: string[] = [],
    estatico = false
): MiembroNativo {
    return { nombre, descripcion, retorno, parametros, estatico };
}

function propiedad(nombre: string, descripcion: string, retorno: string, estatico = false): MiembroNativo {
    return { nombre, descripcion, retorno, propiedad: true, estatico };
}

const matematica: SimboloNativo = {
    nombre: 'Matemática',
    descripcion: 'Operaciones matemáticas, trigonometría, estadística y valores aleatorios.',
    miembros: [
        propiedad('PI', 'Constante π.', 'número', true),
        propiedad('TAU', 'Constante τ, equivalente a 2π.', 'número', true),
        propiedad('E', 'Constante de Euler.', 'número', true),
        metodo('sumar', 'Suma dos números.', 'número', ['a', 'b'], true),
        metodo('restar', 'Resta el segundo número al primero.', 'número', ['a', 'b'], true),
        metodo('multiplicar', 'Multiplica dos números.', 'número', ['a', 'b'], true),
        metodo('dividir', 'Divide el primer número entre el segundo.', 'número', ['dividendo', 'divisor'], true),
        metodo('potencia', 'Eleva una base a un exponente.', 'número', ['base', 'exponente'], true),
        metodo('raiz_cuadrada', 'Calcula la raíz cuadrada.', 'número', ['valor'], true),
        metodo('absoluto', 'Devuelve el valor absoluto.', 'número', ['valor'], true),
        metodo('hipotenusa', 'Calcula la hipotenusa a partir de dos catetos.', 'número', ['a', 'b'], true),
        metodo('logaritmo', 'Calcula el logaritmo natural.', 'número', ['valor'], true),
        metodo('logaritmo_base', 'Calcula un logaritmo con base explícita.', 'número', ['valor', 'base'], true),
        metodo('exponencial', 'Calcula e elevado al valor indicado.', 'número', ['valor'], true),
        metodo('seno', 'Calcula el seno de un ángulo en radianes.', 'número', ['radianes'], true),
        metodo('coseno', 'Calcula el coseno de un ángulo en radianes.', 'número', ['radianes'], true),
        metodo('tangente', 'Calcula la tangente de un ángulo en radianes.', 'número', ['radianes'], true),
        metodo('grados_a_radianes', 'Convierte grados a radianes.', 'número', ['grados'], true),
        metodo('radianes_a_grados', 'Convierte radianes a grados.', 'número', ['radianes'], true),
        metodo('redondear', 'Redondea un número; puede recibir cantidad de decimales.', 'número', ['valor', 'decimales'], true),
        metodo('piso', 'Redondea hacia menos infinito.', 'número', ['valor'], true),
        metodo('techo', 'Redondea hacia más infinito.', 'número', ['valor'], true),
        metodo('promedio', 'Calcula el promedio de una lista numérica.', 'número', ['valores'], true),
        metodo('maximo', 'Devuelve el mayor valor de una lista.', 'número', ['valores'], true),
        metodo('minimo', 'Devuelve el menor valor de una lista.', 'número', ['valores'], true),
        metodo('suma_total', 'Suma todos los valores de una lista.', 'número', ['valores'], true),
        metodo('producto_total', 'Multiplica todos los valores de una lista.', 'número', ['valores'], true),
        metodo('aleatorio', 'Genera un número aleatorio entre 0 y 1.', 'número', [], true),
        metodo('aleatorio_rango', 'Genera un número aleatorio dentro de un rango.', 'número', ['inicio', 'fin'], true)
    ]
};

const bits: SimboloNativo = {
    nombre: 'Bits',
    descripcion: 'Búfer mutable de bytes para datos binarios.',
    constructible: true,
    miembros: [
        metodo('desde_hex', 'Crea un búfer desde texto hexadecimal.', 'Bits', ['hexadecimal'], true),
        metodo('longitud', 'Devuelve cantidad de bytes.', 'entero'),
        metodo('obtener', 'Obtiene byte por índice; acepta índices negativos.', 'entero', ['indice']),
        metodo('rebanada', 'Copia intervalo de bytes [inicio, fin).', 'Bits', ['inicio', 'fin']),
        metodo('a_texto', 'Decodifica bytes como UTF-8.', 'texto'),
        metodo('a_hex', 'Codifica bytes como texto hexadecimal.', 'texto'),
        metodo('a_lista', 'Convierte búfer a lista de enteros.', 'lista<entero>'),
        metodo('fijar', 'Reemplaza byte en un índice.', 'vacío', ['indice', 'byte']),
        metodo('agregar', 'Agrega byte al final.', 'vacío', ['byte']),
        metodo('extender', 'Agrega bytes de otro Bits o lista.', 'vacío', ['datos']),
        metodo('limpiar', 'Vacía el búfer.', 'vacío'),
        metodo('y', 'Aplica AND byte a byte.', 'Bits', ['otro']),
        metodo('o', 'Aplica OR byte a byte.', 'Bits', ['otro']),
        metodo('oexclusivo', 'Aplica XOR byte a byte.', 'Bits', ['otro']),
        metodo('negar', 'Aplica NOT byte a byte.', 'Bits'),
        metodo('desplazar_izquierda', 'Desplaza todos los bits hacia la izquierda.', 'Bits', ['cantidad']),
        metodo('desplazar_derecha', 'Desplaza todos los bits hacia la derecha.', 'Bits', ['cantidad'])
    ]
};

const tiempo: SimboloNativo = {
    nombre: 'Tiempo',
    descripcion: 'Instante inmutable con fecha, hora y zona horaria.',
    constructible: true,
    miembros: [
        metodo('ahora', 'Obtiene instante actual en zona local.', 'Tiempo', [], true),
        metodo('ahora_utc', 'Obtiene instante actual en UTC.', 'Tiempo', [], true),
        metodo('ahora_en', 'Obtiene instante actual en zona IANA.', 'Tiempo', ['zona'], true),
        metodo('hoy', 'Obtiene fecha actual a medianoche.', 'Tiempo', [], true),
        metodo('marca', 'Obtiene marca Unix en milisegundos.', 'entero', [], true),
        metodo('desde_marca', 'Crea un instante desde marca Unix.', 'Tiempo', ['milisegundos'], true),
        metodo('analizar', 'Analiza texto con patrón de fecha.', 'Tiempo', ['texto', 'patron'], true),
        metodo('zona_local', 'Obtiene nombre de zona local.', 'texto', [], true),
        metodo('zonas', 'Lista zonas horarias, opcionalmente por región.', 'lista<texto>', ['region'], true),
        metodo('es_bisiesto', 'Indica si un año es bisiesto.', 'log', ['año'], true),
        metodo('dias_en_mes', 'Devuelve días del mes indicado.', 'entero', ['año', 'mes'], true),
        ...['año', 'mes', 'dia', 'hora', 'minuto', 'segundo', 'milisegundo', 'dia_semana', 'dia_año', 'marca']
            .map(nombre => metodo(nombre, `Obtiene componente ${nombre}.`, 'entero')),
        metodo('texto', 'Convierte a ISO 8601.', 'texto'),
        metodo('texto_fecha', 'Formatea como AAAA-MM-DD.', 'texto'),
        metodo('texto_hora', 'Formatea como HH:MM:SS.', 'texto'),
        metodo('formatear', 'Formatea usando patrón de fecha.', 'texto', ['patron']),
        metodo('nombre_dia', 'Devuelve nombre del día en español.', 'texto'),
        metodo('nombre_mes', 'Devuelve nombre del mes en español.', 'texto'),
        ...['años', 'meses', 'dias', 'horas', 'minutos', 'segundos']
            .map(unidad => metodo(`agregar_${unidad}`, `Agrega ${unidad}; acepta valores negativos.`, 'Tiempo', ['cantidad'])),
        metodo('diferencia', 'Calcula diferencia entre dos instantes.', 'jsn', ['otro']),
        metodo('es_antes', 'Compara si este instante ocurre antes.', 'log', ['otro']),
        metodo('es_despues', 'Compara si este instante ocurre después.', 'log', ['otro']),
        metodo('es_mismo_instante', 'Compara marcas de tiempo.', 'log', ['otro']),
        metodo('es_mismo_dia', 'Compara fecha en su zona.', 'log', ['otro']),
        metodo('zona', 'Obtiene nombre de zona.', 'texto'),
        metodo('desfase', 'Obtiene desfase respecto de UTC.', 'texto'),
        metodo('en_zona', 'Representa mismo instante en otra zona.', 'Tiempo', ['zona']),
        metodo('en_utc', 'Representa mismo instante en UTC.', 'Tiempo'),
        metodo('en_local', 'Representa mismo instante en zona local.', 'Tiempo')
    ]
};

const sistemaArchivos: SimboloNativo = {
    nombre: 'SistemaArchivos',
    descripcion: 'Operaciones directas de archivos y directorios sujetas a permisos.',
    miembros: [
        metodo('leer_texto', 'Lee archivo completo como texto.', 'texto', ['ruta'], true),
        metodo('leer_lineas', 'Lee archivo como lista de líneas.', 'lista<texto>', ['ruta'], true),
        metodo('escribir_texto', 'Crea o sobrescribe archivo de texto.', 'vacío', ['ruta', 'texto'], true),
        metodo('agregar_texto', 'Agrega texto al final del archivo.', 'vacío', ['ruta', 'texto'], true),
        metodo('leer_bits', 'Lee archivo como datos binarios.', 'Bits', ['ruta'], true),
        metodo('escribir_bits', 'Crea o sobrescribe archivo binario.', 'vacío', ['ruta', 'bits'], true),
        metodo('agregar_bits', 'Agrega bytes al final del archivo.', 'vacío', ['ruta', 'bits'], true),
        metodo('existe', 'Comprueba si ruta existe.', 'log', ['ruta'], true),
        metodo('es_archivo', 'Comprueba si ruta es archivo.', 'log', ['ruta'], true),
        metodo('es_directorio', 'Comprueba si ruta es directorio.', 'log', ['ruta'], true),
        metodo('tamaño', 'Obtiene tamaño en bytes.', 'entero', ['ruta'], true),
        metodo('metadatos', 'Obtiene metadatos de ruta.', 'jsn', ['ruta'], true),
        metodo('listar', 'Lista nombres dentro de directorio.', 'lista<texto>', ['ruta'], true),
        metodo('crear_directorio', 'Crea directorio y padres necesarios.', 'vacío', ['ruta'], true),
        metodo('eliminar_archivo', 'Elimina archivo.', 'vacío', ['ruta'], true),
        metodo('eliminar_directorio', 'Elimina directorio vacío.', 'vacío', ['ruta'], true),
        metodo('eliminar_todo', 'Elimina directorio de forma recursiva.', 'vacío', ['ruta'], true),
        metodo('copiar', 'Copia archivo.', 'vacío', ['origen', 'destino'], true),
        metodo('mover', 'Mueve archivo o directorio.', 'vacío', ['origen', 'destino'], true)
    ]
};

const archivo: SimboloNativo = {
    nombre: 'Archivo',
    descripcion: 'Archivo abierto con modo y cursor de lectura/escritura.',
    constructible: true,
    miembros: [
        metodo('leer_texto', 'Lee texto restante o hasta cierta cantidad de bytes.', 'texto', ['cantidad']),
        metodo('leer_lineas', 'Lee líneas restantes.', 'lista<texto>'),
        metodo('leer_linea', 'Lee siguiente línea; nulo al final.', 'texto'),
        metodo('leer_bits', 'Lee lote binario y avanza cursor.', 'Bits', ['cantidad']),
        metodo('leer_todo_bits', 'Lee bytes restantes.', 'Bits'),
        metodo('al_final', 'Indica si cursor llegó al final.', 'log'),
        metodo('bits_restantes', 'Obtiene bytes restantes.', 'entero'),
        metodo('escribir', 'Escribe texto en posición actual.', 'vacío', ['texto']),
        metodo('escribir_linea', 'Escribe texto seguido de salto de línea.', 'vacío', ['texto']),
        metodo('escribir_bits', 'Escribe Bits o lista de bytes.', 'vacío', ['bits']),
        metodo('posicion', 'Obtiene posición del cursor.', 'entero'),
        metodo('ir_a', 'Mueve cursor a posición absoluta.', 'vacío', ['posicion']),
        metodo('ir_al_inicio', 'Mueve cursor al inicio.', 'vacío'),
        metodo('ir_al_final', 'Mueve cursor al final.', 'vacío'),
        ...['ruta', 'nombre', 'extension', 'modo'].map(nombre => metodo(nombre, `Obtiene ${nombre} del archivo.`, 'texto')),
        metodo('tamaño', 'Obtiene tamaño en bytes.', 'entero'),
        metodo('existe', 'Comprueba si archivo existe.', 'log'),
        metodo('esta_abierto', 'Comprueba si archivo sigue abierto.', 'log'),
        metodo('cerrar', 'Cierra archivo; operación idempotente.', 'vacío'),
        metodo('eliminar', 'Elimina archivo y cierra instancia.', 'vacío')
    ]
};

const ruta: SimboloNativo = {
    nombre: 'Ruta',
    descripcion: 'Ruta inmutable para composición y consultas de disco.',
    constructible: true,
    miembros: [
        metodo('actual', 'Obtiene directorio de trabajo.', 'Ruta', [], true),
        metodo('temporal', 'Obtiene directorio temporal.', 'Ruta', [], true),
        metodo('separador', 'Obtiene separador del sistema.', 'texto', [], true),
        metodo('texto', 'Convierte ruta a texto.', 'texto'),
        metodo('nombre', 'Obtiene último componente.', 'texto'),
        metodo('nombre_sin_extension', 'Obtiene nombre sin extensión.', 'texto'),
        metodo('extension', 'Obtiene extensión.', 'texto'),
        metodo('padre', 'Obtiene ruta padre.', 'Ruta'),
        metodo('unir', 'Une componente a ruta.', 'Ruta', ['parte']),
        metodo('con_extension', 'Cambia extensión.', 'Ruta', ['extension']),
        metodo('componentes', 'Lista componentes de ruta.', 'lista<texto>'),
        metodo('es_absoluta', 'Indica si ruta es absoluta.', 'log'),
        metodo('existe', 'Comprueba existencia en disco.', 'log'),
        metodo('es_archivo', 'Comprueba si apunta a archivo.', 'log'),
        metodo('es_directorio', 'Comprueba si apunta a directorio.', 'log'),
        metodo('absoluta', 'Canonicaliza ruta existente.', 'Ruta')
    ]
};

function simboloRed(nombre: string, descripcion: string, miembros: MiembroNativo[], constructible = true): SimboloNativo {
    return { nombre, descripcion, constructible, miembros };
}

const simbolosRed: SimboloNativo[] = [
    simboloRed('red', 'Cliente HTTP sencillo compatible con API histórica.', [
        metodo('obtener', 'Ejecuta GET y devuelve cuerpo como texto.', 'texto', ['url'], true),
        metodo('enviar', 'Ejecuta POST con cuerpo de texto.', 'texto', ['url', 'cuerpo'], true)
    ], false),
    simboloRed('Socket', 'Conexión TCP síncrona o asíncrona.', [
        metodo('conectar', 'Abre conexión TCP bloqueante.', 'Socket', ['host', 'puerto']),
        metodo('conectar_asincrono', 'Abre conexión TCP sin bloquear la VM.', 'Socket', ['host', 'puerto']),
        metodo('enviar_texto', 'Envía texto por la conexión.', 'vacío', ['texto']),
        metodo('recibir_linea', 'Recibe una línea de texto.', 'texto'),
        metodo('recibir_bits_asincrono', 'Recibe hasta cierta cantidad de bytes.', 'Bits', ['maximo']),
        metodo('cerrar', 'Cierra conexión.', 'vacío')
    ]),
    simboloRed('ServidorSocket', 'Servidor TCP con manejador por conexión.', [
        metodo('al_conectar', 'Registra manejador para nuevas conexiones.', 'vacío', ['manejador']),
        metodo('escuchar', 'Comienza escucha TCP.', 'vacío', ['puerto']),
        metodo('puerto', 'Obtiene puerto asignado.', 'entero'),
        metodo('detener', 'Detiene servidor.', 'vacío')
    ]),
    simboloRed('SocketUdp', 'Socket UDP para datagramas.', [
        metodo('enlazar', 'Enlaza socket a puerto local.', 'vacío', ['puerto']),
        metodo('enviar_a', 'Envía datagrama a host y puerto.', 'vacío', ['datos', 'host', 'puerto']),
        metodo('recibir', 'Recibe siguiente datagrama.', 'jsn', ['maximo']),
        metodo('recibir_asincrono', 'Recibe datagrama sin bloquear la VM.', 'jsn', ['maximo']),
        metodo('puerto', 'Obtiene puerto local.', 'entero'),
        metodo('cerrar', 'Cierra socket.', 'vacío')
    ]),
    simboloRed('ClienteHttp', 'Cliente HTTP reutilizable síncrono y asíncrono.', [
        metodo('autenticacion_basica', 'Configura cabecera de autenticación básica.', 'vacío', ['usuario', 'clave']),
        metodo('fijar_tiempo_espera', 'Configura tiempo máximo en segundos.', 'vacío', ['segundos']),
        metodo('obtener', 'Ejecuta GET bloqueante.', 'RespuestaHttp', ['url']),
        metodo('publicar', 'Ejecuta POST bloqueante.', 'RespuestaHttp', ['url', 'cuerpo']),
        metodo('obtener_asincrono', 'Ejecuta GET sin bloquear la VM.', 'RespuestaHttp', ['url']),
        metodo('publicar_asincrono', 'Ejecuta POST sin bloquear la VM.', 'RespuestaHttp', ['url', 'cuerpo']),
        metodo('descargar_asincrono', 'Descarga respuesta a archivo.', 'vacío', ['url', 'destino'])
    ]),
    simboloRed('RespuestaHttp', 'Respuesta recibida por ClienteHttp.', [
        metodo('estado', 'Obtiene código de estado HTTP.', 'entero'),
        metodo('cabecera', 'Obtiene cabecera por nombre.', 'texto', ['nombre']),
        metodo('peso', 'Obtiene tamaño del cuerpo en bytes.', 'entero'),
        metodo('texto', 'Decodifica cuerpo como texto.', 'texto'),
        metodo('jsn', 'Decodifica cuerpo como JSON.', 'jsn'),
        metodo('bits', 'Obtiene cuerpo binario.', 'Bits')
    ], false),
    simboloRed('ServidorHttp', 'Servidor HTTP con rutas, interceptores y ciclo de vida.', [
        ...['obtener', 'publicar', 'poner', 'parchar', 'eliminar', 'cabeza', 'opciones', 'todo']
            .map(verbo => metodo(verbo, `Registra ruta ${verbo.toUpperCase()}.`, 'vacío', ['patron', 'manejador'])),
        metodo('usar', 'Registra interceptor global.', 'vacío', ['interceptor']),
        metodo('manejar_errores', 'Registra manejador global de errores.', 'vacío', ['manejador']),
        metodo('estaticos', 'Sirve directorio bajo prefijo URL.', 'vacío', ['prefijo', 'directorio']),
        metodo('montar', 'Monta Enrutador bajo prefijo.', 'vacío', ['prefijo', 'enrutador']),
        metodo('al_listo', 'Registra hook de inicio.', 'vacío', ['manejador']),
        metodo('al_cerrar', 'Registra hook de cierre.', 'vacío', ['manejador']),
        metodo('escuchar', 'Comienza escucha HTTP.', 'vacío', ['puerto']),
        metodo('puerto', 'Obtiene puerto asignado.', 'entero'),
        metodo('detener', 'Detiene servidor.', 'vacío')
    ]),
    simboloRed('Enrutador', 'Grupo de rutas montable en ServidorHttp.', [
        ...['obtener', 'publicar', 'poner', 'parchar', 'eliminar', 'cabeza', 'opciones', 'todo']
            .map(verbo => metodo(verbo, `Registra ruta ${verbo.toUpperCase()} en grupo.`, 'vacío', ['patron', 'manejador'])),
        metodo('usar', 'Registra interceptor del grupo.', 'vacío', ['interceptor'])
    ]),
    simboloRed('PeticionHttp', 'Petición entregada a manejadores HTTP.', [
        metodo('metodo', 'Obtiene método HTTP.', 'texto'),
        metodo('ruta', 'Obtiene ruta normalizada.', 'texto'),
        metodo('parametros', 'Obtiene parámetros de ruta.', 'jsn'),
        metodo('consulta', 'Obtiene parámetros de consulta.', 'jsn'),
        metodo('cabecera', 'Obtiene cabecera por nombre.', 'texto', ['nombre']),
        metodo('cabeceras', 'Obtiene todas las cabeceras.', 'jsn'),
        metodo('galletas', 'Obtiene cookies parseadas.', 'jsn'),
        metodo('peso', 'Obtiene peso del cuerpo.', 'entero'),
        metodo('es', 'Comprueba Content-Type.', 'texto', ['tipo']),
        metodo('acepta', 'Comprueba negociación Accept.', 'texto', ['tipo']),
        metodo('partes', 'Parsea cuerpo multipart.', 'lista<ParteMultiparte>'),
        metodo('texto', 'Decodifica cuerpo como texto.', 'texto'),
        metodo('jsn', 'Decodifica cuerpo como JSON.', 'jsn'),
        metodo('bits', 'Obtiene cuerpo binario.', 'Bits')
    ], false),
    simboloRed('ParteMultiparte', 'Parte individual de multipart/form-data.', [
        metodo('nombre', 'Obtiene nombre del campo.', 'texto'),
        metodo('nombre_archivo', 'Obtiene nombre original de archivo.', 'texto'),
        metodo('tipo_contenido', 'Obtiene Content-Type de la parte.', 'texto'),
        metodo('texto', 'Decodifica contenido como texto.', 'texto'),
        metodo('bits', 'Obtiene contenido binario.', 'Bits')
    ], false),
    simboloRed('RespuestaServidor', 'Respuesta HTTP configurable antes de enviarse.', [
        metodo('fijar_cabecera', 'Agrega o reemplaza cabecera.', 'RespuestaServidor', ['nombre', 'valor']),
        metodo('fijar_galleta', 'Agrega cookie con opciones.', 'RespuestaServidor', ['nombre', 'valor', 'opciones']),
        metodo('borrar_galleta', 'Expira cookie.', 'RespuestaServidor', ['nombre', 'opciones'])
    ], false),
    simboloRed('Respuestas', 'Factoría de respuestas para ServidorHttp.', [
        metodo('crear', 'Crea respuesta con estado y cuerpo.', 'RespuestaServidor', ['estado', 'cuerpo'], true),
        metodo('texto', 'Crea respuesta de texto.', 'RespuestaServidor', ['texto'], true),
        metodo('jsn', 'Crea respuesta JSON.', 'RespuestaServidor', ['valor'], true),
        metodo('bits', 'Crea respuesta binaria.', 'RespuestaServidor', ['bits'], true),
        metodo('error', 'Crea respuesta de error.', 'RespuestaServidor', ['estado', 'mensaje'], true),
        metodo('nada', 'Crea respuesta sin cuerpo.', 'RespuestaServidor', ['estado'], true),
        metodo('redirigir', 'Crea redirección HTTP.', 'RespuestaServidor', ['url', 'opciones'], true),
        metodo('archivo', 'Transmite archivo con soporte Range y ETag.', 'RespuestaServidor', ['ruta', 'opciones'], true),
        metodo('flujo', 'Crea respuesta transmitida por generador.', 'RespuestaServidor', ['generador'], true),
        metodo('eventos', 'Crea flujo Server-Sent Events.', 'RespuestaServidor', ['generador'], true)
    ], false),
    simboloRed('ClienteRs', 'Cliente RedSocket (WebSocket).', [
        metodo('conectar', 'Abre conexión RedSocket.', 'ClienteRs', ['url']),
        metodo('enviar_texto', 'Envía marco de texto.', 'vacío', ['texto']),
        metodo('recibir', 'Recibe siguiente marco.', 'texto'),
        metodo('cerrar', 'Cierra conexión.', 'vacío')
    ]),
    simboloRed('ServidorRs', 'Servidor RedSocket con eventos.', [
        metodo('al_conectar', 'Registra manejador de conexión.', 'vacío', ['manejador']),
        metodo('al_mensaje', 'Registra manejador de mensajes.', 'vacío', ['manejador']),
        metodo('escuchar', 'Comienza escucha.', 'vacío', ['puerto']),
        metodo('puerto', 'Obtiene puerto asignado.', 'entero'),
        metodo('detener', 'Detiene servidor.', 'vacío')
    ]),
    simboloRed('ConexionRs', 'Conexión aceptada por ServidorRs.', [
        metodo('enviar_texto', 'Envía marco de texto.', 'vacío', ['texto']),
        metodo('cerrar', 'Cierra conexión.', 'vacío')
    ], false)
];

export const MODULOS_NATIVOS: ModuloNativo[] = [
    {
        ruta: 'quetzal/matemática',
        descripcion: matematica.descripcion,
        documentacion: `${DOCUMENTACION}/referencia/funciones-integradas/`,
        simbolos: [matematica]
    },
    {
        ruta: 'quetzal/bits',
        descripcion: bits.descripcion,
        documentacion: `${DOCUMENTACION}/fundamentos/tipos-datos/`,
        simbolos: [bits]
    },
    {
        ruta: 'quetzal/tiempo',
        descripcion: tiempo.descripcion,
        documentacion: `${DOCUMENTACION}/referencia/funciones-integradas/`,
        simbolos: [tiempo]
    },
    {
        ruta: 'quetzal/sistema_archivos',
        descripcion: 'Archivos, directorios y rutas con permisos explícitos.',
        documentacion: `${DOCUMENTACION}/io/archivos/`,
        simbolos: [sistemaArchivos, archivo, ruta]
    },
    {
        ruta: 'quetzal/red',
        descripcion: 'HTTP, TCP, UDP y RedSocket con permisos explícitos.',
        documentacion: `${DOCUMENTACION}/modulos/importar-exportar/`,
        simbolos: simbolosRed
    }
];

const aliasRutas = new Map<string, string>([
    ['quetzal/matematica', 'quetzal/matemática']
]);

export function obtenerModuloNativo(rutaModulo: string): ModuloNativo | undefined {
    const ruta = aliasRutas.get(rutaModulo) ?? rutaModulo;
    return MODULOS_NATIVOS.find(modulo => modulo.ruta === ruta);
}

export function obtenerSimboloNativo(nombre: string): { modulo: ModuloNativo; simbolo: SimboloNativo } | undefined {
    for (const modulo of MODULOS_NATIVOS) {
        const simbolo = modulo.simbolos.find(candidato => candidato.nombre === nombre);
        if (simbolo) {
            return { modulo, simbolo };
        }
    }
    return undefined;
}
