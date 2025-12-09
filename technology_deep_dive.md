  # Guía de Estudio Profunda: Tecnologías del Proyecto

Esta guía profundiza en cada tecnología clave del proyecto. Está diseñada para que entiendas el "por qué" y el "cómo", y te da plantillas de código para que puedas empezar tus propios proyectos.

---

## 1. Node.js & Runtime

### ¿Qué es?
Es el entorno que permite que JavaScript corra en tu computadora, no solo en el navegador. Es como el motor del auto. Sin él, nada de esto funciona.

### ¿Para qué sirve en este proyecto?
*   Ejecuta el servidor de desarrollo (`npm run dev`).
*   Corre los scripts de construcción (`npm run build`).
*   Maneja las dependencias (`node_modules`).

### Código de Ejemplo: Tu Primer Script
Crea un archivo `hola.js` y ejecútalo con `node hola.js`.

```javascript
// hola.js
const os = require('os');

console.log("Hola, estoy corriendo en tu computadora!");
console.log("Tu sistema operativo es:", os.platform());
console.log("Memoria libre:", os.freemem() / 1024 / 1024, "MB");
```

**Reto:** Intenta hacer un script que lea un archivo de texto y lo imprima en consola. (Pista: busca `fs.readFile`).

---

## 2. TypeScript (El Lenguaje)

### ¿Qué es?
Es JavaScript con **Tipos**. Te obliga a definir qué es cada cosa. Esto evita el 90% de los errores tontos (como intentar multiplicar un texto).

### Concepto Clave: Interfaces
Una interfaz es un contrato. Si dices que un objeto es un `Usuario`, TIENE que cumplir las reglas.

### Código de Ejemplo: Plantilla Base
Usa esto para empezar cualquier lógica de negocio.

```typescript
// Definimos la forma de nuestros datos
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  esComestible: boolean;
}

// Una función que recibe un producto y devuelve un texto
function analizarProducto(prod: Producto): string {
  const impuesto = prod.esComestible ? 0 : 0.19;
  const total = prod.precio * (1 + impuesto);
  
  return `El producto ${prod.nombre} cuesta $${total.toFixed(0)}`;
}

// Uso
const manzana: Producto = {
  id: 1,
  nombre: "Manzana",
  precio: 100,
  esComestible: true
};

console.log(analizarProducto(manzana));
```

**En tu proyecto:** Mira `packages/core/src/lib/utils/pricing.ts`. Fíjate cómo definen `PriceBreakdown` antes de hacer cualquier cálculo.

---

## 3. React (La Interfaz)

### ¿Qué es?
Es una librería para crear interfaces dividiéndolas en **Componentes**. Un componente es una función que devuelve HTML (JSX).

### Concepto Clave: Props y State
*   **Props:** Información que *recibe* el componente (como argumentos de función).
*   **State:** Información que el componente *recuerda* y puede cambiar (como si está abierto o cerrado).

### Código de Ejemplo: Un Botón Interactivo
Este es el bloque básico de cualquier app interactiva.

```tsx
import { useState } from 'react';

// Definimos qué props recibe
interface BotonProps {
  texto: string;
  colorInicial?: string;
}

export function BotonMagico({ texto, colorInicial = 'blue' }: BotonProps) {
  // State: React recuerda este valor
  const [clicks, setClicks] = useState(0);

  return (
    <button 
      style={{ backgroundColor: colorInicial }}
      onClick={() => setClicks(clicks + 1)}
    >
      {texto} - Clics: {clicks}
    </button>
  );
}
```

**En tu proyecto:** Mira `packages/ui/src/booking/AvailabilityCalendar.tsx`. Usa `useState` para recordar el mes actual y `props` para recibir el `cabinId`.

---

## 4. Next.js (El Framework)

### ¿Qué es?
Es el "jefe de obra" que usa React. Organiza tus archivos en páginas reales (`/contacto`, `/nosotros`) y hace que carguen rápido.

### Concepto Clave: App Router
La estructura de carpetas DEFINE tus rutas (URLs).
*   `app/page.tsx` -> Tu página de inicio (`/`).
*   `app/contacto/page.tsx` -> Tu página de contacto (`/contacto`).

### Código de Ejemplo: Estructura de una Página
Así se ve una página en Next.js.

```tsx
// app/contacto/page.tsx

export default function PaginaContacto() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">Contáctanos</h1>
      <p>Envíanos un correo a hola@ejemplo.com</p>
      
      {/* Aquí puedes usar componentes de React */}
      <a href="/" className="text-blue-500">Volver al inicio</a>
    </main>
  );
}
```

**En tu proyecto:** Explora `apps/web/app/page.tsx`. Verás que es el punto de entrada de tu sitio.

---

## 5. Tailwind CSS (El Estilo)

### ¿Qué es?
Es una forma de dar estilo sin salir del HTML. En lugar de escribir CSS aparte, usas clases predefinidas.

### Traductor Rápido
*   `flex` -> `display: flex;`
*   `p-4` -> `padding: 1rem;` (espacio interno)
*   `bg-red-500` -> `background-color: #ef4444;` (rojo)
*   `text-white` -> `color: white;`

### Código de Ejemplo: Tarjeta Bonita
Copia esto para tener una tarjeta moderna instantánea.

```tsx
<div className="max-w-sm rounded overflow-hidden shadow-lg bg-white p-6 hover:shadow-xl transition-shadow">
  <h2 className="font-bold text-xl mb-2 text-gray-800">Título de la Tarjeta</h2>
  <p className="text-gray-700 text-base">
    Este es un ejemplo de cómo Tailwind hace que todo se vea bien rápido.
  </p>
  <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    Acción
  </button>
</div>
```

---

## 6. Base de Datos (Supabase/SQL)

### ¿Qué es?
Es donde se guardan los datos para siempre. Tu proyecto usa SQL (Structured Query Language).

### Código de Ejemplo: Tabla de Usuarios
Así es como se define una "hoja de cálculo" en base de datos.

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- ID único automático
  email TEXT NOT NULL,                            -- Texto obligatorio
  nombre TEXT,                                    -- Texto opcional
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Fecha automática
);
```

**En tu proyecto:** Mira `packages/database/supabase-schema.sql`. Ahí están definidas las tablas de `cabins` (cabañas) y `bookings` (reservas).

---

## ¿Cómo empezar tu propio proyecto?

Si tienes una idea, sigue este orden:

1.  **Datos (TypeScript):** Define tus interfaces. ¿Qué datos necesito? (Ej: `interface Tarea { id: number, texto: string }`).
2.  **Lógica (Functions):** Crea funciones que manipulen esos datos.
3.  **Visual (React/Tailwind):** Crea componentes que muestren esos datos.
4.  **Páginas (Next.js):** Pon esos componentes en una página.

¡Usa estas plantillas como base y experimenta!
