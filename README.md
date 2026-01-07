<div align="center">
  <img src="imagenes/logo_lenguaje_quetzal.png" alt="Logo Lenguaje Quetzal" width="200">
  
  # Extensión Lenguaje Quetzal para VS Code
  
  **Soporte completo para el lenguaje de programación Quetzal**
  
  [![Versión](https://img.shields.io/badge/versión-0.0.2-blue.svg)](package.json)
  [![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-brightgreen.svg)](https://code.visualstudio.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
  [![Licencia](https://img.shields.io/badge/licencia-AntaresGT-orange.svg)](LICENSE)
  
  *Un lenguaje de programación interpretado con sintaxis en español, diseñado para ser intuitivo y fácil de aprender*
</div>

---

## Características Principales

### Resaltado de Sintaxis Avanzado
- Reconocimiento completo de palabras reservadas en español
- Coloreado diferenciado para tipos, funciones, variables y objetos
- Soporte para comentarios de línea `//` y bloque `/* */`
- Resaltado especial para cadenas con interpolación `t"texto {variable}"`
- Soporte para caracteres Unicode (acentos, ñ, etc.)

### Autocompletado Inteligente
- Sugerencias automáticas para palabras reservadas y tipos de datos
- Completado contextual de funciones y variables definidas por el usuario
- Autocompletado de métodos según el tipo de dato (texto, lista, jsn, etc.)
- Snippets predefinidos para estructuras comunes del lenguaje
- Información detallada al hacer hover sobre elementos
- Soporte para objetos builtin: `consola`, `Matemática`

### Formateador de Código
- Formateo automático con sangría inteligente
- Espaciado correcto alrededor de operadores
- Configuración personalizable de espacios de sangría
- Comando dedicado: `Formatear Documento Quetzal`

### Diagnósticos en Tiempo Real
- Detección automática de errores de sintaxis
- Validación de llaves `{}` y paréntesis `()` balanceados
- Advertencia sobre métodos deprecados (`imprimir` → `consola.mostrar`)
- Advertencias sobre puntos y comas innecesarios

### Tema Personalizado
- "Tema Quetzal Oscuro" optimizado para el lenguaje
- Colores específicos para cada tipo de token sintáctico
- Diseño que mejora la legibilidad del código

---

## Instalación

### Desde VS Code Marketplace
1. Abre Visual Studio Code
2. Ve a la pestaña de Extensiones (`Ctrl+Shift+X`)
3. Busca "Lenguaje Quetzal"
4. Haz clic en "Instalar"

### Instalación Manual
1. Descarga el archivo `.vsix` desde las releases
2. En VS Code: `Ctrl+Shift+P` → "Extensiones: Instalar desde VSIX..."
3. Selecciona el archivo descargado

---

## Sintaxis del Lenguaje Quetzal

### Tipos de Datos Básicos
```qz
// Tipos fundamentales (constantes por defecto)
entero edad = 25
número altura = 1.75
texto nombre = "Ana García"
log es_estudiante = verdadero
lista<texto> materias = ["Matemáticas", "Programación"]
jsn configuracion = {tema: "oscuro", version: "1.0"}

// Valor nulo
entero valor_sin_asignar = nulo
```

### Variables Mutables
```qz
// Variables que pueden cambiar de valor usando 'var'
entero var contador = 0
texto var mensaje = "texto inicial"
lista<entero> var numeros = [1, 2, 3]

// Modificar valores
contador = 10
mensaje = "nuevo texto"
```

### Interpolación de Texto
```qz
// Interpolación de texto con t"..."
texto nombre = "María"
entero edad = 25

texto saludo = t"¡Hola, {nombre}!"
texto info = t"{nombre} tiene {edad} años"
texto calculo = t"La suma es: {5 + 3}"
```

### Funciones
```qz
// Función con retorno
entero calcular_suma(entero a, entero b) {
    retornar a + b
}

// Función sin retorno
vacio mostrar_mensaje(texto mensaje) {
    consola.mostrar("Mensaje: " + mensaje)
}

// Función con parámetros mutables
texto procesar(texto var mensaje) {
    mensaje += " - procesado"
    retornar mensaje
}

// Función asíncrona
asincrono número obtener_dato(entero id) {
    retornar id * 10
}
```

### Estructuras de Control
```qz
// Condicionales
si (edad >= 18) {
    consola.mostrar("Mayor de edad")
} sino si (edad >= 13) {
    consola.mostrar("Adolescente")
} sino {
    consola.mostrar("Menor de edad")
}

// Bucle mientras
entero var contador = 0
mientras (contador < 10) {
    consola.mostrar("Contador: " + contador.texto())
    contador++
}

// Bucle para
para (entero var i = 0; i < 5; i++) {
    consola.mostrar("Iteración: " + i.texto())
}

// Bucle para-en (foreach)
lista<texto> frutas = ["manzana", "banana", "cereza"]
para (texto var fruta en frutas) {
    consola.mostrar("Fruta: " + fruta)
}

// Hacer-mientras
entero var intentos = 0
hacer {
    consola.mostrar("Intento: " + intentos.texto())
    intentos++
} mientras (intentos < 3)
```

### Objetos
```qz
objeto Persona {
    privado:
        texto var nombre
        entero var edad
        
    publico:
        Persona(texto nombre, entero edad) {
            ambiente.nombre = nombre
            ambiente.edad = edad
        }
        
        texto obtener_nombre() {
            retornar ambiente.nombre
        }
        
        vacio saludar() {
            consola.mostrar("Hola, soy " + ambiente.nombre)
        }
}

// Uso del objeto
Persona juan = nuevo Persona("Juan López", 30)
juan.saludar()
```

### Métodos de Consola
```qz
// Salida de texto
consola.mostrar("Mensaje normal")
consola.mostrar_error("Error crítico")
consola.mostrar_advertencia("Advertencia")
consola.mostrar_exito("Operación completada")
consola.mostrar_informacion("Información")

// Entrada de usuario
texto nombre = consola.pedir("Ingresa tu nombre: ")
texto clave = consola.pedir_secreto("Ingresa tu contraseña: ")
```

### Manejo de Excepciones
```qz
intentar {
    número resultado = dividir(10, 0)
} capturar (excepcion e) {
    consola.mostrar_error(e.mensaje)
} finalmente {
    consola.mostrar("Operación finalizada")
}
```

---

## Configuración

La extensión incluye múltiples opciones configurables:

```json
{
    "quetzal.formateador.habilitado": true,
    "quetzal.formateador.sangría": 4,
    "quetzal.autocompletado.habilitado": true,
    "quetzal.diagnosticos.habilitado": true
}
```

### Opciones Disponibles

| Configuración | Tipo | Por Defecto | Descripción |
|---------------|------|-------------|-------------|
| `quetzal.formateador.habilitado` | boolean | `true` | Habilita el formateador automático |
| `quetzal.formateador.sangría` | number | `4` | Espacios para la sangría |
| `quetzal.autocompletado.habilitado` | boolean | `true` | Habilita autocompletado |
| `quetzal.diagnosticos.habilitado` | boolean | `true` | Habilita diagnósticos de errores |

---

## Comandos Disponibles

| Comando | Descripción | Atajo |
|---------|-------------|-------|
| `Formatear Documento Quetzal` | Formatea el archivo .qz actual | `Ctrl+Shift+P` |
| `Ejecutar Archivo Quetzal` | Envía el archivo al terminal | Menú contextual |

---

## Snippets Incluidos

| Prefijo | Descripción | Genera |
|---------|-------------|--------|
| `funcion` | Función básica | `tipo nombre_funcion(parametros) { ... }` |
| `var` | Variable mutable | `tipo var variable = valor` |
| `si` | Condicional | `si (condición) { ... }` |
| `si_sino` | Condicional completo | `si (condición) { ... } sino { ... }` |
| `mientras` | Bucle while | `mientras (condición) { ... }` |
| `para` | Bucle for | `para (entero var i = 0; i < 10; i++) { ... }` |
| `para_en` | Bucle foreach | `para (tipo var elemento en lista) { ... }` |
| `hacer` | Bucle do-while | `hacer { ... } mientras (condición)` |
| `objeto` | Objeto completo | `objeto NombreObjeto { privado: ... publico: ... }` |
| `mostrar` | Consola mostrar | `consola.mostrar("mensaje")` |
| `intentar` | Try-catch | `intentar { ... } capturar (excepcion e) { ... }` |
| `importar` | Importar módulo | `importar { ... } desde "ruta"` |
| `t"` | Texto interpolado | `t"texto {variable}"` |
| `rango` | Crear rango | `lista numeros = rango(1, 10)` |

---

## Desarrollo

### Requisitos
- Node.js 18+
- TypeScript 5.0+
- Visual Studio Code 1.80.0+

### Configuración Local
```bash
# Clonar repositorio
git clone https://github.com/antaresgt/lenguaje-quetzal-vscode-extension.git
cd lenguaje-quetzal-vscode-extension

# Instalar dependencias
npm install

# Compilar código
npm run compile

# Ejecutar en modo desarrollo
# Presionar F5 en VS Code
```

### Empaquetar Extensión
```bash
# Instalar herramienta de empaquetado
npm install -g vsce

# Crear paquete .vsix
vsce package
```

---

## Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama para tu característica (`git checkout -b caracteristica/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin caracteristica/nueva-funcionalidad`)
5. Abre un Pull Request

---

## Licencia

Este proyecto está bajo la **Licencia AntaresGT**. 

### Términos Principales:
- ✅ **Permitido**: Usar, modificar, distribuir y crear forks
- ✅ **Libre para uso comercial y personal**
- ⚠️ **Requisito obligatorio**: Atribución clara a AntaresGT en todos los usos
- ⚠️ **Los forks deben indicar**: "Basado en el trabajo original de AntaresGT"

### Atribución Requerida:
Cualquier uso, modificación o fork debe incluir prominentemente:
```
"Basado en el trabajo original de AntaresGT (https://antaresgt.com)"
"Software original desarrollado por Allam López - AntaresGT"
```

Para más detalles, consulta el archivo [LICENSE](LICENSE).

**Contacto para permisos especiales:** alan@antaresgt.com

---

## Estructura del Proyecto

```
lenguaje-quetzal-vscode-extension/
├── src/                              # Código fuente TypeScript
│   ├── extension.ts                  # Punto de entrada principal
│   ├── servidor_lenguaje.ts          # Servidor de lenguaje
│   ├── formateador.ts                # Formateador de código
│   ├── proveedor_completado.ts       # Autocompletado
│   ├── diagnosticador.ts             # Diagnósticos
│   └── compartido/                   # Módulos compartidos
│       ├── metodos.ts                # Definición de métodos por tipo
│       ├── objetos.ts                # Análisis de objetos
│       └── patrones.ts               # Patrones regex comunes
├── syntaxes/                         # Gramática de sintaxis
│   └── quetzal.tmLanguage.json       # Definición de tokens
├── snippets/                         # Snippets predefinidos
│   └── quetzal.json                  # Plantillas de código
├── themes/                           # Temas de color
│   └── quetzal-dark-theme.json       # Tema oscuro
├── imagenes/                         # Recursos gráficos
├── ejemplos-lenguaje-quetzal/        # Ejemplos de código Quetzal
├── package.json                      # Configuración de la extensión
├── language-configuration.json       # Configuración del lenguaje
└── README.md                         # Este archivo
```

---

## Enlaces Útiles

- [Documentación de VS Code API](https://code.visualstudio.com/api)
- [Guía de Desarrollo de Extensiones](https://code.visualstudio.com/api/get-started/your-first-extension)
- [TextMate Grammar](https://macromates.com/manual/en/language_grammars)

---

<div align="center">
  
  **¿Te gusta el proyecto? ¡Dale una ⭐!**
  
  ---
  
  ### Desarrollado por AntaresGT
  
  **Empresa:** AntaresGT  
  **Desarrollador:** Allam López  
  **Email:** alan@antaresgt.com  
  **Web:** https://antaresgt.com
  
  *Tecnología innovadora desarrollada en Guatemala* 🇬🇹
  
  ---
  
  **Si usas este proyecto, por favor incluye la atribución requerida:**  
  *"Basado en el trabajo original de AntaresGT"*
  
</div>
