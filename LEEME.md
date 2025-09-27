# Extensión Lenguaje Quetzal para VS Code

Una extensión completa de Visual Studio Code para el lenguaje de programación Quetzal, un lenguaje interpretado con sintaxis en español diseñado para ser intuitivo y fácil de aprender.

## Características

### 🎨 Resaltado de Sintaxis
- Coloreado sintáctico completo para el lenguaje Quetzal
- Tema oscuro personalizado "Tema Quetzal Oscuro"
- Reconocimiento de todas las palabras reservadas en español
- Diferenciación visual entre tipos de datos, funciones, variables y objetos

### ⚡ Autocompletado Inteligente
- Sugerencias automáticas para palabras reservadas
- Autocompletado de tipos de datos (entero, número, texto, log, lista, jsn)
- Completado de funciones builtin del lenguaje
- Reconocimiento automático de funciones, variables y objetos definidos por el usuario
- Snippets predefinidos para estructuras comunes

### 🔧 Formateador de Código
- Formateo automático de código Quetzal
- Sangría inteligente basada en bloques de código
- Espaciado correcto alrededor de operadores
- Configuración personalizable de espacios de sangría

### 🔍 Diagnósticos y Validación
- Detección de errores de sintaxis en tiempo real
- Validación de llaves y paréntesis balanceados
- Verificación de convenciones de nomenclatura (snake_case para variables y funciones)
- Advertencias sobre el uso incorrecto de punto y coma
- Detección de uso de palabras reservadas como nombres de identificadores

### 🛠️ Herramientas Adicionales
- Comando para formatear documentos Quetzal
- Comando para ejecutar archivos Quetzal en terminal
- Información de hover para palabras reservadas y funciones
- Configuración personalizable para habilitar/deshabilitar características

## Sintaxis del Lenguaje Quetzal

### Tipos de Datos
```qz
// Tipos básicos
entero numero_entero = 42
número numero_decimal = 3.14
texto saludo = "Hola mundo"
log estado = verdadero
lista<entero> numeros = [1, 2, 3, 4, 5]
jsn objeto_json = {clave: "valor", numero: 123}
vacio sin_valor
```

### Variables Mutables
```qz
// Variables que pueden cambiar
entero mut contador = 0
texto mut mensaje = "inicial"
```

### Funciones
```qz
// Función básica
entero sumar(entero a, entero b) {
    retornar a + b
}

// Función sin retorno
vacio saludar(texto nombre) {
    imprimir("Hola " + nombre)
}
```

### Estructuras de Control
```qz
// Condicionales
si (edad >= 18) {
    imprimir("Eres mayor de edad")
} sino {
    imprimir("Eres menor de edad")
}

// Bucles
mientras (contador < 10) {
    imprimir("Contador: " + contador.texto())
    contador++
}

para (entero i = 0; i < 5; i++) {
    imprimir("Iteración: " + i.texto())
}

para (elemento en lista) {
    imprimir("Elemento: " + elemento.texto())
}
```

### Objetos
```qz
objeto Persona {
    publico:
        texto nombre
        entero edad
        
        Persona(texto n, entero e) {
            ambiente.nombre = n
            ambiente.edad = e
        }
        
        vacio saludar() {
            imprimir("Hola, soy " + ambiente.nombre)
        }
    
    privado:
        texto secreto = "información privada"
}

// Usar objeto
Persona juan = nuevo Persona("Juan", 25)
juan.saludar()
```

### Funciones de Consola
```qz
imprimir("Mensaje normal")
imprimir_exito("Operación exitosa")
imprimir_error("Ha ocurrido un error")
imprimir_advertencia("Cuidado con esto")
imprimir_informacion("Información útil")
```

## Instalación

1. Abre Visual Studio Code
2. Ve a la pestaña de Extensiones (Ctrl+Shift+X)
3. Busca "Lenguaje Quetzal"
4. Haz clic en "Instalar"

## Uso

1. Crea un archivo con extensión `.qz`
2. VS Code automáticamente detectará el lenguaje Quetzal
3. Disfruta del resaltado de sintaxis y autocompletado
4. Usa `Ctrl+Shift+P` y busca "Formatear Documento Quetzal" para formatear tu código

## Configuración

La extensión incluye varias opciones de configuración:

```json
{
    "quetzal.formateador.habilitado": true,
    "quetzal.formateador.sangría": 4,
    "quetzal.autocompletado.habilitado": true,
    "quetzal.diagnosticos.habilitado": true
}
```

## Comandos Disponibles

- `Formatear Documento Quetzal`: Formatea el archivo Quetzal actual
- `Ejecutar Archivo Quetzal`: Envía el archivo actual al terminal para ejecución

## Snippets Incluidos

- `funcion` - Plantilla de función básica
- `si` - Condicional si
- `mientras` - Bucle mientras  
- `para` - Bucle para
- `objeto` - Plantilla de objeto
- `imprimir` - Función de impresión
- Y muchos más...

## Contribuir

¿Quieres contribuir al desarrollo de esta extensión? ¡Genial! 

## Licencia

Esta extensión está bajo licencia MIT.

## Changelog

### 0.0.1
- Lanzamiento inicial
- Resaltado de sintaxis completo
- Autocompletado básico
- Formateador de código
- Diagnósticos de sintaxis
- Tema oscuro personalizado

---

**¡Disfruta programando en Quetzal!** 🦎✨
