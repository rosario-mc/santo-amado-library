'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Lang = 'en' | 'es'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
})

const translations: Record<string, Record<Lang, string>> = {
  // ---- Home Page ----
  'home.welcomeBack': { en: 'Welcome back, {name}!', es: '\u00a1Bienvenido, {name}!' },
  'home.subtitle': { en: 'Your personal library and games collection!', es: '\u00a1Tu biblioteca y colecci\u00f3n de juegos!' },
  'home.readyAdventure': { en: "Hey {name}! Ready for today's adventure?", es: '\u00a1Hola {name}! \u00bfListo para la aventura de hoy?' },
  'home.whatToDo': { en: 'WHAT DO YOU WANT TO DO?', es: '\u00bfQU\u00c9 QUIERES HACER?' },
  'home.browseBooks': { en: 'BROWSE BOOKS', es: 'VER LIBROS' },
  'home.browseBooksDesc': { en: 'Read your favorite stories!', es: '\u00a1Lee tus historias favoritas!' },
  'home.playGames': { en: 'PLAY GAMES', es: 'JUGAR' },
  'home.playGamesDesc': { en: 'Learn while having fun!', es: '\u00a1Aprende mientras te diviertes!' },
  'home.activityPages': { en: 'ACTIVITY PAGES', es: 'ACTIVIDADES' },
  'home.activityPagesDesc': { en: 'Print and play!', es: '\u00a1Imprime y juega!' },
  'home.upload': { en: 'UPLOAD', es: 'SUBIR' },
  'home.uploadDesc': { en: 'Add new books & activities', es: 'Agregar libros y actividades' },
  'home.pageTurn': { en: 'Every adventure starts with a page turn!', es: '\u00a1Toda aventura comienza al pasar una p\u00e1gina!' },
  'home.madeWithLove': { en: 'Made with love for Santorio & Amado', es: 'Hecho con amor para Santorio & Amado' },

  // ---- Profiles Page ----
  'profiles.whosPlaying': { en: "WHO'S PLAYING? 🎮", es: '¿QUIÉN JUEGA? 🎮' },
  'profiles.loading': { en: 'Loading Profiles...', es: 'Cargando Perfiles...' },
  'profiles.noProfiles': { en: 'No Profiles in library yet', es: 'Aún no hay perfiles en la biblioteca' },
  'profiles.age': { en: 'Age: {age}', es: 'Edad: {age}' },

  // ---- Global UI ----
  'marquee': {
    en: 'BOOKS \u2022 GAMES \u2022 ADVENTURE \u2022 LEARN \u2022 PLAY \u2022 EXPLORE \u2022 READ \u2022 FUN \u2022 ',
    es: 'LIBROS \u2022 JUEGOS \u2022 AVENTURA \u2022 APRENDER \u2022 JUGAR \u2022 EXPLORAR \u2022 LEER \u2022 DIVERSI\u00d3N \u2022 ',
  },
  'switchProfile': { en: 'Switch Profile', es: 'Cambiar Perfil' },
  'footer.dedication': { en: 'For Santorio & Amado', es: 'Para Santorio & Amado' },
  'backToGames': { en: 'Back to Games \ud83c\udfae', es: 'Volver a Juegos \ud83c\udfae' },
  'chooseYourGame': { en: 'CHOOSE YOUR GAME', es: 'ELIGE TU JUEGO' },
  'loading': { en: 'Loading...', es: 'Cargando...' },

  // ---- Power-up labels (GameHeader) ----
  'powerUp.rainbow': { en: '\ud83c\udf08 Rainbow Power!', es: '\ud83c\udf08 \u00a1Poder Arco\u00edris!' },
  'powerUp.extraLife': { en: '\ud83d\udc9a Extra Life!', es: '\ud83d\udc9a \u00a1Vida Extra!' },
  'powerUp.fireFlower': { en: '\ud83d\udd25 Fire Flower!', es: '\ud83d\udd25 \u00a1Flor de Fuego!' },
  'powerUp.star': { en: '\u2b50 Star Power!', es: '\u2b50 \u00a1Poder Estrella!' },
  'powerUp.mushroom': { en: '\ud83c\udf44 Powered Up!', es: '\ud83c\udf44 \u00a1Poder Activado!' },

  // ---- Overlay labels (MarioOverlays) ----
  'overlay.powerUp': { en: 'POWER UP!', es: '\u00a1PODER!' },
  'overlay.starPower': { en: 'STAR POWER!', es: '\u00a1PODER ESTRELLA!' },
  'overlay.fireFlower': { en: 'FIRE FLOWER!', es: '\u00a1FLOR DE FUEGO!' },
  'overlay.extraLife': { en: 'EXTRA LIFE!', es: '\u00a1VIDA EXTRA!' },
  'overlay.rainbowPower': { en: 'RAINBOW POWER!', es: '\u00a1PODER ARCO\u00cdRIS!' },
  'overlay.plusOneLife': { en: '+1 Life!', es: '\u00a1+1 Vida!' },
  'gameOver': { en: 'GAME OVER', es: 'FIN DEL JUEGO' },
  'dontGiveUp': { en: "Don't give up! You can do it!", es: '\u00a1No te rindas! \u00a1T\u00fa puedes!' },
  'tryAgainButton': { en: 'Try Again! \ud83c\udf44', es: '\u00a1Otra Vez! \ud83c\udf44' },

  // ---- Game titles ----
  'game.addition.title': { en: 'Rocket Launch! \ud83d\ude80', es: '\u00a1Lanzamiento Cohete! \ud83d\ude80' },
  'game.subtraction.title': { en: 'Submarine Dive! \ud83d\udc20', es: '\u00a1Submarino! \ud83d\udc20' },
  'game.counting.title': { en: 'Garden Harvest! \ud83c\udf3b', es: '\u00a1Cosecha del Jard\u00edn! \ud83c\udf3b' },
  'game.typing.title': { en: 'Pirate Ship! \ud83c\udff4\u200d\u2620\ufe0f', es: '\u00a1Barco Pirata! \ud83c\udff4\u200d\u2620\ufe0f' },
  'game.scramble.title': { en: 'Jungle Swing! \ud83d\udc12', es: '\u00a1Selva! \ud83d\udc12' },
  'game.matching.title': { en: 'Treasure Cave! \ud83d\udc8e', es: '\u00a1Cueva del Tesoro! \ud83d\udc8e' },
  'game.simon.title': { en: 'Disco Floor! \ud83e\udea9', es: '\u00a1Pista de Baile! \ud83e\udea9' },
  'game.colorMix.title': { en: 'Potion Lab! \ud83e\uddd9', es: '\u00a1Laboratorio! \ud83e\uddd9' },
  'game.shapes.title': { en: 'Robot Factory! \ud83e\udd16', es: '\u00a1F\u00e1brica Robot! \ud83e\udd16' },
  'game.animals.title': { en: 'Safari Jeep! \ud83e\udd81', es: '\u00a1Safari! \ud83e\udd81' },
  'game.oddOneOut.title': { en: 'Space Station! \ud83d\udef8', es: '\u00a1Estaci\u00f3n Espacial! \ud83d\udef8' },
  'game.writing.title': { en: 'Sky Writer! \u2708\ufe0f', es: '\u00a1Escritor del Cielo! \u2708\ufe0f' },
  'game.mathRun.title': { en: 'Math Run! \ud83c\udfc3', es: '\u00a1Carrera Matem\u00e1tica! \ud83c\udfc3' },

  // ---- Game index card titles & descriptions ----
  'index.addition.title': { en: 'ADDING FUN', es: 'SUMAR' },
  'index.addition.desc': { en: 'Practice adding numbers together!', es: '\u00a1Practica sumar n\u00fameros!' },
  'index.subtraction.title': { en: 'TAKE AWAY', es: 'RESTAR' },
  'index.subtraction.desc': { en: 'Practice subtraction with visual dots!', es: '\u00a1Practica la resta con puntos!' },
  'index.counting.title': { en: 'COUNTING', es: 'CONTAR' },
  'index.counting.desc': { en: 'Count the objects on screen!', es: '\u00a1Cuenta los objetos en pantalla!' },
  'index.typing.title': { en: 'TYPE IT!', es: '\u00a1ESCR\u00cdBELO!' },
  'index.typing.desc': { en: 'Listen and type the word!', es: '\u00a1Escucha y escribe la palabra!' },
  'index.scramble.title': { en: 'SCRAMBLE', es: 'REVOLTIJO' },
  'index.scramble.desc': { en: 'Unscramble letters to make a word!', es: '\u00a1Ordena las letras para formar la palabra!' },
  'index.matching.title': { en: 'MATCH IT!', es: '\u00a1EMPAREJAR!' },
  'index.matching.desc': { en: 'Find the matching pairs!', es: '\u00a1Encuentra las parejas!' },
  'index.simon.title': { en: 'SIMON SAYS', es: 'SIM\u00d3N DICE' },
  'index.simon.desc': { en: 'Remember and repeat the pattern!', es: '\u00a1Recuerda y repite el patr\u00f3n!' },
  'index.colorMix.title': { en: 'COLOR MIX', es: 'MEZCLA COLORES' },
  'index.colorMix.desc': { en: 'Mix colors and guess the result!', es: '\u00a1Mezcla colores y adivina el resultado!' },
  'index.shapes.title': { en: 'SHAPES', es: 'FORMAS' },
  'index.shapes.desc': { en: 'Identify different shapes!', es: '\u00a1Identifica las formas!' },
  'index.animals.title': { en: 'ANIMAL SOUNDS', es: 'SONIDOS ANIMALES' },
  'index.animals.desc': { en: 'Guess the animal from its sound!', es: '\u00a1Adivina el animal por su sonido!' },
  'index.oddOneOut.title': { en: 'ODD ONE OUT', es: 'EL INTRUSO' },
  'index.oddOneOut.desc': { en: "Find what doesn't belong!", es: '\u00a1Encuentra lo que no pertenece!' },
  'index.writing.title': { en: 'WRITE IT!', es: '\u00a1A ESCRIBIR!' },
  'index.writing.desc': { en: 'Trace and practice writing letters!', es: '\u00a1Traza y practica las letras!' },
  'index.mathRun.title': { en: 'MATH RUN', es: 'CARRERA MATEM\u00c1TICA' },
  'index.mathRun.desc': { en: 'Run, jump, and solve math!', es: '\u00a1Corre, salta y resuelve!' },

  // ---- Per-game prompts ----
  'whatIs': { en: 'What is...', es: '\u00bfCu\u00e1nto es...?' },
  'tryAgain': { en: 'Try again! \ud83d\udcaa', es: '\u00a1Otra vez! \ud83d\udcaa' },
  'oops': { en: 'Oops! \ud83d\udcaa', es: '\u00a1Ups! \ud83d\udcaa' },
  'countAgain': { en: 'Count again! \ud83d\udcaa', es: '\u00a1Cuenta otra vez! \ud83d\udcaa' },
  'notQuite': { en: 'Not quite! Try again! \ud83d\udcaa', es: '\u00a1Casi! \u00a1Otra vez! \ud83d\udcaa' },
  'tryAnother': { en: 'Try another! \ud83e\udd14', es: '\u00a1Prueba otro! \ud83e\udd14' },
  'listenAgain': { en: 'Listen again! \ud83d\udc42', es: '\u00a1Escucha de nuevo! \ud83d\udc42' },
  'notThatOne': { en: 'Not that one! \ud83e\udd14', es: '\u00a1Ese no! \ud83e\udd14' },
  'oopsWatch': { en: 'Oops! Watch again!', es: '\u00a1Ups! \u00a1Mira otra vez!' },

  // ---- Addition ----
  'addition.instruction': { en: 'Tap to steer the rocket! Solve addition to fly higher!', es: '\u00a1Toca para mover el cohete! \u00a1Resuelve sumas para volar m\u00e1s alto!' },

  // ---- Subtraction ----
  'subtraction.instruction': { en: 'Tap to release bubbles! Solve subtraction to dive deeper!', es: '\u00a1Toca para soltar burbujas! \u00a1Resuelve restas para bajar m\u00e1s!' },

  // ---- Counting ----
  'counting.howMany': { en: 'How many {emoji} do you see?', es: '\u00bfCu\u00e1ntos {emoji} ves?' },
  'counting.instruction': { en: 'Tap to scatter butterflies! Count the items!', es: '\u00a1Toca para espantar mariposas! \u00a1Cuenta los objetos!' },

  // ---- Typing ----
  'typing.prompt': { en: 'Type the word!', es: '\u00a1Escribe la palabra!' },
  'typing.hearAgain': { en: 'Hear it again \ud83d\udd0a', es: 'Escuchar de nuevo \ud83d\udd0a' },
  'typing.splash': { en: 'SPLASH! \ud83c\udf0a', es: '\u00a1SPLASH! \ud83c\udf0a' },
  'typing.instruction': { en: 'Tap for a splash! Type words to sail to treasure islands!', es: '\u00a1Toca para salpicar! \u00a1Escribe palabras para navegar a las islas!' },

  // ---- Word Scramble ----
  'scramble.prompt': { en: 'Unscramble the word!', es: '\u00a1Ordena la palabra!' },
  'scramble.undo': { en: 'Undo \u21a9\ufe0f', es: 'Deshacer \u21a9\ufe0f' },
  'scramble.instruction': { en: 'Tap to swing to the next vine! Unscramble words to keep going!', es: '\u00a1Toca para columpiarte! \u00a1Ordena las palabras para continuar!' },

  // ---- Matching ----
  'matching.howManyPairs': { en: 'How many pairs do you want to find?', es: '\u00bfCu\u00e1ntas parejas quieres encontrar?' },
  'matching.4pairs': { en: '4 Pairs', es: '4 Parejas' },
  'matching.6pairs': { en: '6 Pairs', es: '6 Parejas' },
  'matching.8pairs': { en: '8 Pairs', es: '8 Parejas' },
  'matching.allFound': { en: 'All {totalPairs} pairs found in {moves} moves!', es: '\u00a1{totalPairs} parejas en {moves} movimientos!' },
  'matching.playAgain': { en: 'Play Again \ud83d\udd04', es: 'Jugar de Nuevo \ud83d\udd04' },
  'matching.changeSize': { en: 'Change Size \ud83d\udd22', es: 'Cambiar Tama\u00f1o \ud83d\udd22' },
  'matching.status': { en: 'Matches: {matches}/{totalPairs} \u2014 Moves: {moves}', es: 'Parejas: {matches}/{totalPairs} \u2014 Turnos: {moves}' },

  // ---- Simon Says ----
  'simon.watchPattern': { en: 'Watch the pattern, then repeat it!', es: '\u00a1Mira el patr\u00f3n y rep\u00edtelo!' },
  'simon.start': { en: 'Start! \ud83d\ude80', es: '\u00a1Empezar! \ud83d\ude80' },
  'simon.playAgain': { en: 'Play Again! \ud83d\udd04', es: '\u00a1Otra vez! \ud83d\udd04' },
  'simon.watchCarefully': { en: 'Watch carefully...', es: 'Observa bien...' },
  'simon.yourTurn': { en: 'Your turn! ({current}/{total})', es: '\u00a1Tu turno! ({current}/{total})' },
  'simon.instruction': { en: 'Watch the disco floor light up, then repeat the pattern!', es: '\u00a1Mira las luces de la pista y repite el patr\u00f3n!' },
  'simon.gameOverRounds': { en: 'Game Over! You got {rounds} rounds!', es: '\u00a1Fin! \u00a1Llegaste a {rounds} rondas!' },
  'simon.round': { en: 'Round: {round}', es: 'Ronda: {round}' },

  // ---- Color Mix ----
  'colorMix.prompt': { en: 'Mix the colors!', es: '\u00a1Mezcla los colores!' },
  'colorMix.instruction': { en: 'Tap the cauldron for bubbles! Mix the right colors!', es: '\u00a1Toca el caldero! \u00a1Mezcla los colores correctos!' },

  // ---- Color names ----
  'color.Red': { en: 'Red', es: 'Rojo' },
  'color.Yellow': { en: 'Yellow', es: 'Amarillo' },
  'color.Blue': { en: 'Blue', es: 'Azul' },
  'color.White': { en: 'White', es: 'Blanco' },
  'color.Green': { en: 'Green', es: 'Verde' },
  'color.Orange': { en: 'Orange', es: 'Naranja' },
  'color.Purple': { en: 'Purple', es: 'Morado' },
  'color.Pink': { en: 'Pink', es: 'Rosa' },
  'color.Light Blue': { en: 'Light Blue', es: 'Celeste' },
  'color.Brown': { en: 'Brown', es: 'Marr\u00f3n' },
  'color.Light Yellow': { en: 'Light Yellow', es: 'Amarillo Claro' },

  // ---- Shape names ----
  'shape.Circle': { en: 'Circle', es: 'C\u00edrculo' },
  'shape.Square': { en: 'Square', es: 'Cuadrado' },
  'shape.Triangle': { en: 'Triangle', es: 'Tri\u00e1ngulo' },
  'shape.Star': { en: 'Star', es: 'Estrella' },
  'shape.Diamond': { en: 'Diamond', es: 'Diamante' },
  'shape.Heart': { en: 'Heart', es: 'Coraz\u00f3n' },
  'shapes.prompt': { en: 'What shape is this?', es: '\u00bfQu\u00e9 forma es esta?' },
  'shapes.instruction': { en: 'Tap to move the robot arm! Name the shapes!', es: '\u00a1Toca para mover el brazo! \u00a1Nombra las formas!' },

  // ---- Animal names ----
  'animal.Cow': { en: 'Cow', es: 'Vaca' },
  'animal.Cat': { en: 'Cat', es: 'Gato' },
  'animal.Dog': { en: 'Dog', es: 'Perro' },
  'animal.Duck': { en: 'Duck', es: 'Pato' },
  'animal.Pig': { en: 'Pig', es: 'Cerdo' },
  'animal.Rooster': { en: 'Rooster', es: 'Gallo' },
  'animal.Sheep': { en: 'Sheep', es: 'Oveja' },
  'animal.Horse': { en: 'Horse', es: 'Caballo' },
  'animal.Lion': { en: 'Lion', es: 'Le\u00f3n' },
  'animal.Frog': { en: 'Frog', es: 'Rana' },
  'animal.Owl': { en: 'Owl', es: 'B\u00faho' },
  'animal.Snake': { en: 'Snake', es: 'Serpiente' },

  // ---- Animal sounds ----
  'sound.Moo!': { en: 'Moo!', es: '\u00a1Muuu!' },
  'sound.Meow!': { en: 'Meow!', es: '\u00a1Miau!' },
  'sound.Woof!': { en: 'Woof!', es: '\u00a1Guau!' },
  'sound.Quack!': { en: 'Quack!', es: '\u00a1Cuac!' },
  'sound.Oink!': { en: 'Oink!', es: '\u00a1Oinc!' },
  'sound.Cock-a-doodle-doo!': { en: 'Cock-a-doodle-doo!', es: '\u00a1Quiquiriqu\u00ed!' },
  'sound.Baa!': { en: 'Baa!', es: '\u00a1Bee!' },
  'sound.Neigh!': { en: 'Neigh!', es: '\u00a1Iiih!' },
  'sound.Roar!': { en: 'Roar!', es: '\u00a1Grrr!' },
  'sound.Ribbit!': { en: 'Ribbit!', es: '\u00a1Croac!' },
  'sound.Hoot!': { en: 'Hoot!', es: '\u00a1Uh\u00fa!' },
  'sound.Hiss!': { en: 'Hiss!', es: '\u00a1Sss!' },

  'animals.prompt': { en: 'Which animal says...', es: 'Qu\u00e9 animal dice...' },
  'animals.hearIt': { en: 'Hear it! \ud83d\udd0a', es: '\u00a1Escuchar! \ud83d\udd0a' },
  'animals.honk': { en: 'HONK! \ud83d\udcef', es: '\u00a1HONK! \ud83d\udcef' },
  'animals.instruction': { en: 'Tap to honk! Match the animal to its sound!', es: '\u00a1Toca para tocar bocina! \u00a1Relaciona el animal con su sonido!' },

  // ---- Odd One Out ----
  'oddOneOut.prompt': { en: "Which one doesn't belong? Tap it!", es: '\u00bfCu\u00e1l no pertenece? \u00a1T\u00f3calo!' },
  'oddOneOut.instruction': { en: "Tap the item that doesn't belong!", es: '\u00a1Toca el que no pertenece!' },

  // Puzzle explanations
  'explain.car_fruit': { en: 'A car is not a fruit!', es: '\u00a1Un carro no es una fruta!' },
  'explain.flower_animal': { en: 'A flower is not an animal!', es: '\u00a1Una flor no es un animal!' },
  'explain.balloon_vehicle': { en: 'A balloon is not a vehicle!', es: '\u00a1Un globo no es un veh\u00edculo!' },
  'explain.guitar_food': { en: 'A guitar is not food!', es: '\u00a1Una guitarra no es comida!' },
  'explain.dog_sea': { en: 'A dog is not a sea creature!', es: '\u00a1Un perro no es un animal marino!' },
  'explain.cake_sport': { en: 'Cake is not a sport!', es: '\u00a1Un pastel no es un deporte!' },
  'explain.cat_weather': { en: 'A cat is not weather!', es: '\u00a1Un gato no es clima!' },
  'explain.elephant_insect': { en: 'An elephant is not an insect!', es: '\u00a1Un elefante no es un insecto!' },
  'explain.fire_flower': { en: 'Fire is not a flower!', es: '\u00a1El fuego no es una flor!' },
  'explain.pizza_tree': { en: 'Pizza is not a tree!', es: '\u00a1La pizza no es un \u00e1rbol!' },
  'explain.snake_bird': { en: 'A snake is not a bird!', es: '\u00a1Una serpiente no es un p\u00e1jaro!' },
  'explain.music_tool': { en: 'Music is not a tool!', es: '\u00a1La m\u00fasica no es una herramienta!' },

  // ---- Writing ----
  'writing.traceMode': { en: 'Trace Mode', es: 'Modo Trazar' },
  'writing.freeWrite': { en: 'Free Write', es: 'Escritura Libre' },
  'writing.clear': { en: 'Clear \ud83e\uddf9', es: 'Borrar \ud83e\uddf9' },
  'writing.skip': { en: 'Skip \u27a1\ufe0f', es: 'Saltar \u27a1\ufe0f' },
  'writing.traceGuide': { en: 'Trace the letter in the sky with smoke!', es: '\u00a1Traza la letra en el cielo con humo!' },
  'writing.freeGuide': { en: 'Write the letter with your smoke trail!', es: '\u00a1Escribe la letra con tu estela de humo!' },

  // ---- Math Run ----
  'mathRun.instruction': { en: 'Tap or press Space to jump! Solve the math to keep running!', es: '\u00a1Toca o presiona Espacio para saltar! \u00a1Resuelve para seguir corriendo!' },

  // ---- Matching card names ----
  'card.dog': { en: 'dog', es: 'perro' },
  'card.cat': { en: 'cat', es: 'gato' },
  'card.frog': { en: 'frog', es: 'rana' },
  'card.butterfly': { en: 'butterfly', es: 'mariposa' },
  'card.turtle': { en: 'turtle', es: 'tortuga' },
  'card.octopus': { en: 'octopus', es: 'pulpo' },
  'card.dinosaur': { en: 'dinosaur', es: 'dinosaurio' },
  'card.elephant': { en: 'elephant', es: 'elefante' },
  'card.fox': { en: 'fox', es: 'zorro' },
  'card.penguin': { en: 'penguin', es: 'ping\u00fcino' },
  'card.rainbow': { en: 'rainbow', es: 'arco\u00edris' },
  'card.star': { en: 'star', es: 'estrella' },
}

// ---- Cheers ----

const CHEERS_EN = [
  'Great job! \u2b50', 'Amazing! \ud83c\udf1f', 'You did it! \ud83c\udf89', 'Awesome! \ud83e\udd95',
  'Super star! \ud83d\udcab', 'Wow! \ud83c\udf08', 'Fantastic! \ud83c\udf8a', 'Way to go! \ud83d\ude80',
  'Wahoo! \ud83e\ude99', "Let's-a go! \ud83c\udf44", 'Mamma mia! \ud83c\udf1f', 'Here we go! \ud83e\ude99',
  'Yahoo! \u2b50', 'Okey-dokey! \ud83c\udf44', 'Power up! \ud83d\udca5', 'Super! \ud83c\udf1f',
]

const CHEERS_ES = [
  '\u00a1Muy bien! \u2b50', '\u00a1Incre\u00edble! \ud83c\udf1f', '\u00a1Lo lograste! \ud83c\udf89', '\u00a1Genial! \ud83e\udd95',
  '\u00a1S\u00faper estrella! \ud83d\udcab', '\u00a1Wow! \ud83c\udf08', '\u00a1Fant\u00e1stico! \ud83c\udf8a', '\u00a1As\u00ed se hace! \ud83d\ude80',
  '\u00a1Wahoo! \ud83e\ude99', '\u00a1Vamos! \ud83c\udf44', '\u00a1Mamma mia! \ud83c\udf1f', '\u00a1All\u00e1 vamos! \ud83e\ude99',
  '\u00a1Yahoo! \u2b50', '\u00a1Okey-dokey! \ud83c\udf44', '\u00a1Poder! \ud83d\udca5', '\u00a1S\u00faper! \ud83c\udf1f',
]

export function randomCheer(lang: Lang = 'en'): string {
  const cheers = lang === 'es' ? CHEERS_ES : CHEERS_EN
  return cheers[Math.floor(Math.random() * cheers.length)]
}

export function speakWord(word: string, lang: Lang = 'en') {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.rate = 0.8
  utterance.pitch = 1.1
  utterance.lang = lang === 'es' ? 'es-ES' : 'en-US'
  window.speechSynthesis.speak(utterance)
}

// ---- Provider ----

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved === 'en' || saved === 'es') setLangState(saved)
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
  }, [])

  const t = useCallback((key: string): string => {
    const entry = translations[key]
    if (!entry) return key
    return entry[lang] ?? entry.en ?? key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
