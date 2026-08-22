# Física y Química Arcade

Dos motores de juego —Tetris y Laberinto— con bancos curriculares intercambiables y feedback inmediato. La primera versión contiene 32 retos de formulación de compuestos binarios para 3.º ESO.

El Tetris dispone de modo de aula por equipos: el profesor configura entre 2 y 8 grupos y el tiempo total de cada turno, incluido el empleado en responder. El reloj solo se detiene automáticamente en los rebotes y dispone de control manual; el marcador registra respuestas correctas, los turnos cambian automáticamente al agotarse el tiempo o llegar a game over y los fallos abren rebotes alfabéticos sin revelar antes la solución.

La aplicación es estática: no necesita instalación, cuenta, servidor ni dependencias. Puede abrirse directamente con `index.html` o publicarse en GitHub Pages.

## Estructura

- `index.html`: interfaz.
- `style.css`: diseño adaptable a pantalla digital, ordenador y móvil.
- `game.js`: motores de juego, pausas, feedback y marcadores.
- `question-banks.js`: contenido curricular separado del juego.

Cada pregunta del banco declara su nivel, tipo, enunciado, cuatro opciones, solución correcta, explicación y regla de comprobación. Para introducir otro contenido de Física y Química se añade un banco con esa misma estructura, sin modificar los motores.
