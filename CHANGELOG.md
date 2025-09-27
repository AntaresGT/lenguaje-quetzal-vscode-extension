# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

## [0.0.12] - 2025-06-28

### ✨ Agregado
- **Soporte para camelCase y snake_case** en variables y funciones
- **Palabras reservadas con tilde** (`función`, `número`, `vacío`, `público`, etc.)
- **Snippets actualizados** para ambos estilos de nomenclatura
- **Protección mejorada** contra sobrescritura de palabras reservadas

### 🔄 Cambiado
- **Sintaxis de funciones actualizada** para usar `tipo nombreFuncion()` en lugar de `funcion nombreFuncion()`
- **Diagnósticos más flexibles** que permiten ambos estilos de nomenclatura
- **Gramática mejorada** para reconocer la sintaxis real del lenguaje Quetzal
- **Autocompletado expandido** con palabras reservadas con y sin tilde

### 🐛 Corregido
- Reconocimiento incorrecto de sintaxis de funciones
- Forzado innecesario del uso de snake_case únicamente
- Falta de soporte para palabras reservadas con acentos

---

## [0.0.1] - 2025-06-28

### ✨ Agregado
- **Resaltado de sintaxis completo** para el lenguaje Quetzal
- **Autocompletado inteligente** con sugerencias contextuales
- **Formateador de código** con sangría inteligente
- **Diagnósticos en tiempo real** para detección de errores
- **Snippets predefinidos** para estructuras comunes
- **Tema oscuro personalizado** "Tema Quetzal Oscuro"
- **Comandos dedicados**:
  - Formatear Documento Quetzal
  - Ejecutar Archivo Quetzal
- **Configuración personalizable** para todas las características
- **Licencia AntaresGT** personalizada con requisitos de atribución

### 🎨 Características de Sintaxis
- Reconocimiento de palabras reservadas en español
- Soporte para tipos de datos nativos (entero, número, texto, log, lista, jsn, vacio)
- Resaltado de funciones builtin (imprimir, imprimir_exito, imprimir_error, etc.)
- Diferenciación visual entre variables, funciones y objetos
- Soporte para comentarios de línea `//` y bloque `/* */`
- Resaltado especial para cadenas con templates `c"texto {variable}"`

### 🔧 Herramientas de Desarrollo
- Detección automática de archivos `.qz`
- Validación de llaves y paréntesis balanceados
- Verificación de convenciones de nomenclatura (snake_case)
- Advertencias sobre puntos y comas innecesarios
- Información de hover para elementos del lenguaje

### 📦 Snippets Incluidos
- `funcion` - Plantilla de función básica
- `objeto` - Plantilla de objeto con público/privado
- `si`, `mientras`, `para` - Estructuras de control
- `imprimir` - Funciones de consola
- `intentar` - Manejo de excepciones
- `importar`, `exportar` - Gestión de módulos
- `var`, `mut` - Declaración de variables

### 🎯 Configuraciones
- `quetzal.formateador.habilitado` - Habilitar formateador
- `quetzal.formateador.sangría` - Espacios de sangría
- `quetzal.autocompletado.habilitado` - Habilitar autocompletado
- `quetzal.diagnosticos.habilitado` - Habilitar diagnósticos

### 📁 Estructura del Proyecto
- Código fuente en TypeScript bien organizado
- Gramática TextMate para resaltado de sintaxis
- Tema de colores personalizado
- Documentación completa en español
- Configuración de desarrollo y debug

---

## [Próximas Versiones]

### 🔄 Planificado para v0.1.0
- [ ] Integración con servidor de lenguaje LSP
- [ ] Autocompletado avanzado con análisis semántico
- [ ] Refactoring de código
- [ ] Definición y referencias (Go to Definition)
- [ ] Depurador integrado
- [ ] Más temas de colores (claro, contrastado)
- [ ] Soporte para múltiples workspaces
- [ ] Integración con Git para archivos .qz

### 🔄 Planificado para v0.2.0
- [ ] Generador de documentación automática
- [ ] Linting avanzado con reglas personalizables
- [ ] Soporte para testing framework
- [ ] Integración con package manager del lenguaje
- [ ] Plantillas de proyecto
- [ ] Extensión web para VS Code online

---

**Formato de Versiones:**
- **Major.Minor.Patch** (Semantic Versioning)
- **Major**: Cambios incompatibles con versiones anteriores
- **Minor**: Nuevas funcionalidades compatibles
- **Patch**: Correcciones de errores compatibles
