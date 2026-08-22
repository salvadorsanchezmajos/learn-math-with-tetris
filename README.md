# Física y Química Arcade

Dos motores de juego —Tetris y Laberinto— con bancos curriculares intercambiables y feedback inmediato. La primera versión contiene 32 retos de formulación de compuestos binarios para 3.º ESO.

La aplicación es estática: no necesita instalación, cuenta, servidor ni dependencias. Puede abrirse directamente con `index.html` o publicarse en GitHub Pages.

## Estructura

- `index.html`: interfaz.
- `style.css`: diseño adaptable a pantalla digital, ordenador y móvil.
- `game.js`: motores de juego, pausas, feedback y marcadores.
- `question-banks.js`: contenido curricular separado del juego.

Cada pregunta del banco declara su nivel, tipo, enunciado, cuatro opciones, solución correcta, explicación y regla de comprobación. Para introducir otro contenido de Física y Química se añade un banco con esa misma estructura, sin modificar los motores.

