# Cambios de Sintaxis - Versión 0.0.12

## 🆕 Nuevas Características

### ✅ Soporte para camelCase y snake_case
La extensión ahora soporta ambos estilos de nomenclatura:

#### Variables
```quetzal
// camelCase
entero miEdad = 25
cadena nombreCompleto = "Ana García"
bool estaActivo = verdadero

// snake_case
entero mi_edad = 25
cadena nombre_completo = "Ana García"
bool esta_activo = verdadero
```

#### Funciones
```quetzal
// camelCase
entero calcularSuma(entero valorUno, entero valorDos) {
    retornar valorUno + valorDos
}

// snake_case
entero calcular_suma(entero valor_uno, entero valor_dos) {
    retornar valor_uno + valor_dos
}
```

### ✅ Palabras reservadas con tilde
Se agregó soporte para palabras reservadas con acentos:

- `función` (además de `funcion`)
- `número` (además de `numero`)
- `vacío` (además de `vacio`)
- `público` (además de `publico`)
- `asíncrono` (además de `asincrono`)
- `excepción` (además de `excepcion`)

### ✅ Protección mejorada contra sobrescritura
Las palabras reservadas (con y sin tilde) no pueden ser usadas como nombres de variables o funciones.

## ⚠️ Cambios Importantes

### 🔄 Sintaxis de funciones actualizada
La sintaxis correcta es:
```quetzal
tipo nombreFuncion(parametros) {
    // código
}
```

### 🔄 Diagnósticos actualizados
- ✅ Ya no se fuerza el uso de snake_case únicamente
- ✅ Se permite tanto camelCase como snake_case
- ✅ Se mantiene la protección contra palabras reservadas

## 📋 Notas Técnicas

### Archivos modificados:
- `syntaxes/quetzal.tmLanguage.json` - Gramática actualizada
- `src/diagnosticador.ts` - Diagnósticos más flexibles
- `src/servidor_lenguaje.ts` - Reconocimiento de nueva sintaxis
- `src/proveedor_completado.ts` - Autocompletado mejorado
- `snippets/quetzal.json` - Snippets para ambos estilos

### Compatibilidad:
- ✅ Código existente en snake_case sigue funcionando
- ✅ Código nuevo puede usar camelCase o snake_case
- ✅ Palabras reservadas protegidas en ambos formatos

---

**Desarrollado por AntaresGT** ❤️
