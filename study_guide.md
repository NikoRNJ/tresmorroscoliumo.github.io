# Guía de Estudio: Proyecto Tres Morros

Esta guía está diseñada para ayudarte a entender este proyecto desde cero, asumiendo conocimientos básicos de programación (variables, operadores). Aquí aprenderás qué tecnologías se usan, cómo está estructurado el proyecto y cómo "piensa" un programador al resolver problemas usando TypeScript.

---

## 1. Tecnologías: ¿Qué hace funcionar este sitio?

Un proyecto moderno como este es como un edificio. Necesitas diferentes materiales y herramientas para construirlo.

### El Cimiento (Runtime & Gestión)
*   **Node.js:** Es el motor que permite ejecutar código JavaScript fuera del navegador (en tu computadora o servidor). Es la base de todo.
*   **pnpm:** Es el "gestor de paquetes". Imagina que necesitas herramientas pre-fabricadas (librerías) para no reinventar la rueda. `pnpm` las descarga y organiza.
*   **Turbo (Turborepo):** Este proyecto es un **Monorepo**. Significa que hay varios "sub-proyectos" (la web, la lógica, la base de datos) en una sola carpeta gigante. `Turbo` ayuda a manejar esto eficientemente, para que no tengas que abrir 5 terminales distintas.

### La Estructura (Frontend)
*   **React:** Es una librería para construir interfaces de usuario. En lugar de escribir HTML estático, creas "Componentes" (piezas de lego) como `<Boton />` o `<Calendario />` que tienen su propia lógica y estilo.
*   **Next.js:** Es un "framework" construido sobre React. React solo se encarga de la vista, pero Next.js te da todo lo demás: navegación entre páginas, optimización de imágenes y la capacidad de renderizar la página en el servidor antes de enviarla al usuario (mejor velocidad).
*   **Tailwind CSS:** Es para los estilos. En lugar de escribir archivos `.css` largos, usas clases directas en el HTML como `class="bg-red-500 text-white"`. Es rápido y mantiene el diseño consistente.

### El Lenguaje
*   **TypeScript:** Es JavaScript con "superpoderes". Lo explicaremos a fondo más adelante.

---

## 2. Anatomía del Proyecto

Al abrir la carpeta, ves muchos archivos. No te asustes, todo tiene un orden lógico.

### Carpetas Principales
*   **`apps/web`**: Aquí vive la aplicación principal (lo que ve el usuario). Usa **Next.js**.
    *   `app/`: Contiene las páginas del sitio.
*   **`packages/`**: Aquí vive el código compartido.
    *   **`core`**: Es el "cerebro". Aquí está la lógica de negocio pura (cálculos de precios, funciones de email) que no depende de la interfaz visual.
    *   **`ui`**: Son los "brazos y piernas". Contiene los componentes visuales (botones, calendarios) que usa la web.
    *   **`database`**: La conexión con los datos.

**¿Por qué separar así?**
Si mañana quieres hacer una App Móvil, puedes reutilizar `packages/core` (la lógica) sin tener que reescribirla, solo cambias la `app` visual.

---

## 3. Introducción a TypeScript (TS)

TypeScript es el lenguaje que usaremos. Es **JavaScript** + **Tipos**.

### ¿Por qué lo usamos?
Imagina que tienes una función que suma dos números: `sumar(a, b)`.
*   En **JavaScript**, podrías pasarle "hola" y 5, y te devolvería "hola5" (error silencioso).
*   En **TypeScript**, tú defines: `sumar(a: number, b: number)`. Si intentas pasar un texto, el editor te grita **antes** de que ejecutes el código.

### Conceptos Clave para Principiantes

1.  **Tipado Estático**: Le dices a la computadora qué *tipo* de dato es cada variable.
    ```typescript
    let edad: number = 25;
    let nombre: string = "Juan";
    let esEstudiante: boolean = true;
    ```

2.  **Interfaces**: Son como "planos" o "contratos" para objetos. Definen qué forma debe tener un objeto.
    ```typescript
    interface Auto {
      marca: string;
      modelo: string;
      anio: number;
    }

    const miAuto: Auto = {
      marca: "Toyota",
      modelo: "Corolla",
      anio: 2020 // Si olvido esto o pongo un texto, TS me avisa.
    };
    ```

### ¿Cómo razona un programador con TS?
Cuando un programador empieza una tarea, no empieza escribiendo `if` o `for`. Empieza pensando en los **Datos**:
1.  **¿Qué entra?** (Input)
2.  **¿Qué sale?** (Output)
3.  **¿Cómo transformo la entrada en salida?** (Proceso)

TypeScript te obliga a definir el paso 1 y 2 explícitamente, lo cual hace que el paso 3 sea mucho más fácil.

---

## 4. Análisis Práctico: Desglosando una Función Real

Vamos a estudiar una función real de tu proyecto: `calculatePrice` en `packages/core/src/lib/utils/pricing.ts`.

### El Problema
Necesitamos saber cuánto cobrarle a un cliente por su estadía. El precio depende de:
*   Cuántas noches se queda.
*   Cuántas personas son (hay un cobro extra si son muchas).
*   Si usa el Jacuzzi.
*   Si pide toallas extra.

### Paso 1: Definir los Tipos (El Contrato)

Antes de la lógica, definimos qué devuelve la función. Mira la interfaz `PriceBreakdown` (línea 12):

```typescript
export interface PriceBreakdown {
  nights: number;       // Cantidad de noches
  basePrice: number;    // Precio base total
  extraPeople: number;  // Cuántas personas extra hay
  // ... otros campos
  total: number;        // El precio final a pagar
}
```
Esto le dice a cualquier programador: "Esta función te va a devolver un objeto con estos datos exactos".

### Paso 2: La Función (Input -> Proceso -> Output)

Mira la firma de la función (línea 36):

```typescript
export function calculatePrice(
  cabin: Pick<Cabin, ...>, // Input 1: Datos de la cabaña (precio base, capacidad)
  startDate: string,       // Input 2: Fecha llegada
  endDate: string,         // Input 3: Fecha salida
  partySize: number,       // Input 4: Cuántas personas
  jacuzziDays: string[],   // Input 5: Días de jacuzzi
  towelsCount: number      // Input 6: Toallas
): PriceBreakdown {        // Output: El desglose definido arriba
```

### Paso 3: La Lógica (El Razonamiento)

Vamos línea por línea de cómo "piensa" el código:

1.  **Calcular el tiempo (L47-50):**
    *   Convierte los textos de fecha (`"2023-01-01"`) a objetos Fecha reales.
    *   Calcula la diferencia: `nights = differenceInDays(end, start)`.
    *   *Validación:* Si `nights < 1`, lanza un error. (No puedes reservar 0 noches).

2.  **Precio Base (L62):**
    *   `basePrice = cabin.base_price * nights`. Simple multiplicación.

3.  **Personas Extra (L65-67):**
    *   Aquí hay lógica interesante: `Math.max(0, partySize - includedGuests)`.
    *   Si vienen 2 personas y el incluido es 4: `2 - 4 = -2`. `Math.max(0, -2)` es 0. No cobra extra.
    *   Si vienen 6 personas y el incluido es 4: `6 - 4 = 2`. Cobra por 2 extras.

4.  **Sumar todo (L76):**
    *   `subtotal = basePrice + extraPeoplePrice + jacuzziPrice + towelsPrice`.

5.  **Retornar (L79):**
    *   Devuelve el objeto que cumple con la interfaz `PriceBreakdown`.

### Ejercicio Mental
Intenta seguir el flujo con estos datos:
*   Precio base: $100
*   Noches: 2
*   Personas: 3 (incluidas 2, extra $20)

1.  `nights` = 2.
2.  `basePrice` = 100 * 2 = 200.
3.  `extraPeople` = 3 - 2 = 1.
4.  `extraPeoplePrice` = 1 * 20 * 2 (noches) = 40.
5.  `total` = 200 + 40 = 240.

---

## 5. Cómo practicar y aprender más

Para dominar esto, te recomiendo este flujo de estudio:

1.  **Lee el código:** Ve a `packages/core/src/lib/utils/pricing.ts` y lee la función `calculatePrice`. Intenta entender cada línea.
2.  **Rompe cosas:** Cambia algo pequeño. Por ejemplo, haz que el precio de las toallas sea gratis (0).
3.  **Crea una función nueva:** Intenta crear una función simple en un archivo nuevo, por ejemplo `calculadora.ts`.
    *   Crea una interfaz `Operacion` { a: number, b: number, tipo: 'suma' | 'resta' }.
    *   Crea una función que reciba esa interfaz y devuelva el resultado.

### Resumen
La programación no es magia, es **instrucciones paso a paso**. TypeScript solo nos ayuda a asegurar que las "piezas" (datos) encajen bien antes de construir.

¡Mucho éxito en tu estudio!
