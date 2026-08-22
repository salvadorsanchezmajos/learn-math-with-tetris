// Bancos curriculares intercambiables. Los motores de juego no dependen del tema.
const QUESTION_BANKS = {
    formulacion_binaria: {
        id: 'formulacion_binaria',
        title: 'Formulación de compuestos binarios',
        shortTitle: 'Formulación binaria',
        course: '3.º ESO',
        scope: 'Compuestos iónicos y covalentes binarios. Sin peróxidos ni hidrácidos.',
        questions: [
            {
                id: 'fb01', level: 1, kind: 'Nombre → fórmula',
                prompt: '¿Cuál es la fórmula del óxido de sodio?',
                options: ['NaO', 'Na₂O', 'NaO₂', 'Na₂O₂'], correct: 'Na₂O',
                solution: 'El sodio forma Na⁺ y el oxígeno O²⁻. Hacen falta dos Na⁺ por cada O²⁻.',
                rule: 'Neutralidad: 2·(+1) + (−2) = 0.'
            },
            {
                id: 'fb02', level: 1, kind: 'Nombre → fórmula',
                prompt: '¿Cuál es la fórmula del cloruro de magnesio?',
                options: ['MgCl', 'Mg₂Cl', 'MgCl₂', 'Mg₂Cl₂'], correct: 'MgCl₂',
                solution: 'El magnesio forma Mg²⁺ y cada cloruro es Cl⁻. Se necesitan dos cloruros.',
                rule: 'Neutralidad: (+2) + 2·(−1) = 0.'
            },
            {
                id: 'fb03', level: 1, kind: 'Nombre → fórmula',
                prompt: '¿Cuál es la fórmula del óxido de calcio?',
                options: ['CaO', 'Ca₂O', 'CaO₂', 'Ca₂O₃'], correct: 'CaO',
                solution: 'Ca²⁺ y O²⁻ se compensan en proporción 1:1.',
                rule: 'Los subíndices deben reducirse a la proporción entera mínima.'
            },
            {
                id: 'fb04', level: 1, kind: 'Nombre → fórmula',
                prompt: '¿Cuál es la fórmula del sulfuro de aluminio?',
                options: ['AlS', 'Al₂S₃', 'Al₃S₂', 'AlS₃'], correct: 'Al₂S₃',
                solution: 'Al³⁺ y S²⁻ se neutralizan con 2 aluminios y 3 sulfuros.',
                rule: '2·(+3) + 3·(−2) = 0.'
            },
            {
                id: 'fb05', level: 1, kind: 'Fórmula → nombre',
                prompt: '¿Cómo se nombra K₂O?',
                options: ['Óxido de potasio', 'Dióxido de potasio', 'Óxido de dipotasio(II)', 'Peróxido de potasio'], correct: 'Óxido de potasio',
                solution: 'El potasio solo presenta +1 en estos compuestos; no necesita número romano.',
                rule: 'En nomenclatura de Stock, el número romano se omite si el elemento tiene una valencia habitual única.'
            },
            {
                id: 'fb06', level: 1, kind: 'Nombre → fórmula',
                prompt: '¿Cuál es la fórmula del hidruro de calcio?',
                options: ['CaH', 'Ca₂H', 'CaH₂', 'Ca₂H₃'], correct: 'CaH₂',
                solution: 'En un hidruro metálico, Ca es Ca²⁺ y H actúa como H⁻.',
                rule: 'Neutralidad: (+2) + 2·(−1) = 0.'
            },
            {
                id: 'fb07', level: 1, kind: 'Nombre → fórmula',
                prompt: '¿Cuál es la fórmula del nitruro de magnesio?',
                options: ['MgN', 'Mg₂N₃', 'Mg₃N₂', 'MgN₂'], correct: 'Mg₃N₂',
                solution: 'Mg²⁺ y N³⁻ requieren 3 magnesios y 2 nitruros.',
                rule: '3·(+2) + 2·(−3) = 0.'
            },
            {
                id: 'fb08', level: 1, kind: 'Fórmula → nombre',
                prompt: '¿Cómo se nombra AlF₃?',
                options: ['Fluoruro de aluminio', 'Fluoruro de aluminio(II)', 'Trifluoruro de aluminio(II)', 'Fluorato de aluminio'], correct: 'Fluoruro de aluminio',
                solution: 'Es fluoruro de aluminio. En Stock no hace falta indicar (III), porque el aluminio usa aquí +3.',
                rule: 'Los halógenos en sales binarias terminan en «-uro».'
            },
            {
                id: 'fb09', level: 2, kind: 'Fórmula → nombre Stock',
                prompt: '¿Cómo se nombra FeO?',
                options: ['Óxido de hierro(I)', 'Óxido de hierro(II)', 'Óxido de hierro(III)', 'Dióxido de hierro'], correct: 'Óxido de hierro(II)',
                solution: 'El oxígeno aporta −2; como hay un Fe, el hierro debe aportar +2.',
                rule: 'En Stock, la valencia variable se escribe con números romanos.'
            },
            {
                id: 'fb10', level: 2, kind: 'Fórmula → nombre Stock',
                prompt: '¿Cómo se nombra Fe₂O₃?',
                options: ['Óxido de hierro(II)', 'Óxido de hierro(III)', 'Trióxido de hierro', 'Óxido de hierro(VI)'], correct: 'Óxido de hierro(III)',
                solution: 'Los tres oxígenos suman −6; los dos hierros deben sumar +6, así que cada Fe es +3.',
                rule: '2·x + 3·(−2) = 0 ⇒ x = +3.'
            },
            {
                id: 'fb11', level: 2, kind: 'Nombre Stock → fórmula',
                prompt: '¿Cuál es la fórmula del cloruro de cobre(I)?',
                options: ['CuCl', 'CuCl₂', 'Cu₂Cl', 'Cu₂Cl₃'], correct: 'CuCl',
                solution: 'Cu⁺ y Cl⁻ se combinan en proporción 1:1.',
                rule: 'El número romano indica el número de oxidación del metal, no su subíndice.'
            },
            {
                id: 'fb12', level: 2, kind: 'Nombre Stock → fórmula',
                prompt: '¿Cuál es la fórmula del cloruro de cobre(II)?',
                options: ['CuCl', 'CuCl₂', 'Cu₂Cl', 'Cu₂Cl₂'], correct: 'CuCl₂',
                solution: 'Cu²⁺ necesita dos Cl⁻ para neutralizar la carga.',
                rule: 'Neutralidad: (+2) + 2·(−1) = 0.'
            },
            {
                id: 'fb13', level: 2, kind: 'Fórmula → nombre Stock',
                prompt: '¿Cómo se nombra PbS?',
                options: ['Sulfuro de plomo(I)', 'Sulfuro de plomo(II)', 'Sulfuro de plomo(IV)', 'Sulfato de plomo(II)'], correct: 'Sulfuro de plomo(II)',
                solution: 'El sulfuro es S²⁻; por tanto, el plomo es Pb²⁺.',
                rule: 'En un compuesto binario con azufre, se usa «sulfuro», no «sulfato».'
            },
            {
                id: 'fb14', level: 2, kind: 'Nombre Stock → fórmula',
                prompt: '¿Cuál es la fórmula del sulfuro de plomo(IV)?',
                options: ['PbS', 'Pb₂S', 'PbS₂', 'Pb₂S₄'], correct: 'PbS₂',
                solution: 'Pb⁴⁺ se neutraliza con dos S²⁻. La proporción mínima es 1:2.',
                rule: '(+4) + 2·(−2) = 0.'
            },
            {
                id: 'fb15', level: 2, kind: 'Fórmula → nombre Stock',
                prompt: '¿Cómo se nombra SnO₂?',
                options: ['Óxido de estaño(II)', 'Óxido de estaño(III)', 'Óxido de estaño(IV)', 'Peróxido de estaño'], correct: 'Óxido de estaño(IV)',
                solution: 'Dos oxígenos suman −4; el estaño debe ser +4.',
                rule: 'x + 2·(−2) = 0 ⇒ x = +4.'
            },
            {
                id: 'fb16', level: 2, kind: 'Nombre Stock → fórmula',
                prompt: '¿Cuál es la fórmula del cloruro de hierro(III)?',
                options: ['FeCl', 'FeCl₂', 'FeCl₃', 'Fe₃Cl'], correct: 'FeCl₃',
                solution: 'Fe³⁺ requiere tres aniones Cl⁻.',
                rule: 'El subíndice 3 pertenece al cloro porque son necesarios tres cloruros.'
            },
            {
                id: 'fb17', level: 3, kind: 'Fórmula → nombre sistemático',
                prompt: '¿Cómo se nombra CO₂ con prefijos?',
                options: ['Monóxido de carbono', 'Dióxido de carbono', 'Óxido de carbono(II)', 'Carbonato de oxígeno'], correct: 'Dióxido de carbono',
                solution: 'Hay dos átomos de oxígeno: se usa el prefijo «di-».',
                rule: 'En compuestos covalentes, los prefijos indican el número de átomos.'
            },
            {
                id: 'fb18', level: 3, kind: 'Fórmula → nombre sistemático',
                prompt: '¿Cómo se nombra CO con prefijos?',
                options: ['Monóxido de carbono', 'Dióxido de carbono', 'Óxido de carbono(IV)', 'Carbonuro de oxígeno'], correct: 'Monóxido de carbono',
                solution: 'Hay un átomo de oxígeno: «monóxido».',
                rule: 'La contracción habitual es «monóxido», no «monoóxido».'
            },
            {
                id: 'fb19', level: 3, kind: 'Fórmula → nombre sistemático',
                prompt: '¿Cómo se nombra N₂O₅?',
                options: ['Dióxido de pentanitrógeno', 'Pentóxido de dinitrógeno', 'Óxido de nitrógeno(II)', 'Nitrato de nitrógeno'], correct: 'Pentóxido de dinitrógeno',
                solution: 'Cinco oxígenos dan «pentóxido» y dos nitrógenos, «dinitrógeno».',
                rule: 'Los dos prefijos se leen directamente de los subíndices.'
            },
            {
                id: 'fb20', level: 3, kind: 'Nombre sistemático → fórmula',
                prompt: '¿Cuál es la fórmula del trióxido de azufre?',
                options: ['SO', 'SO₂', 'SO₃', 'S₃O'], correct: 'SO₃',
                solution: '«Trióxido» indica tres átomos de oxígeno; el azufre sin prefijo representa uno.',
                rule: 'Los prefijos se convierten directamente en subíndices.'
            },
            {
                id: 'fb21', level: 3, kind: 'Nombre sistemático → fórmula',
                prompt: '¿Cuál es la fórmula del tricloruro de fósforo?',
                options: ['PCl', 'PCl₂', 'PCl₃', 'P₃Cl'], correct: 'PCl₃',
                solution: '«Tri-» delante de cloruro indica tres átomos de cloro.',
                rule: 'El elemento citado después de «de» se escribe primero en la fórmula.'
            },
            {
                id: 'fb22', level: 3, kind: 'Nombre sistemático → fórmula',
                prompt: '¿Cuál es la fórmula del hexafluoruro de azufre?',
                options: ['SF₄', 'SF₅', 'SF₆', 'S₆F'], correct: 'SF₆',
                solution: '«Hexa-» indica seis átomos de flúor unidos a un átomo de azufre.',
                rule: 'Hexa = 6.'
            },
            {
                id: 'fb23', level: 3, kind: 'Fórmula → nombre sistemático',
                prompt: '¿Cómo se nombra N₂O₃?',
                options: ['Trióxido de dinitrógeno', 'Dióxido de trinitrógeno', 'Óxido de nitrógeno(II)', 'Nitrito de nitrógeno'], correct: 'Trióxido de dinitrógeno',
                solution: 'O₃ aporta «trióxido» y N₂ aporta «dinitrógeno».',
                rule: 'Los subíndices 3 y 2 originan los prefijos tri- y di-.'
            },
            {
                id: 'fb24', level: 3, kind: 'Fórmula → nombre sistemático',
                prompt: '¿Cómo se nombra SiCl₄?',
                options: ['Cloruro de silicio', 'Dicloruro de silicio', 'Tetracloruro de silicio', 'Clorato de silicio'], correct: 'Tetracloruro de silicio',
                solution: 'Hay cuatro átomos de cloro: se usa «tetra-».',
                rule: 'Tetra = 4.'
            },
            {
                id: 'fb25', level: 4, kind: 'Razona la fórmula',
                prompt: 'Fe³⁺ y O²⁻ forman un compuesto neutro. ¿Qué fórmula resulta?',
                options: ['FeO', 'Fe₂O₃', 'Fe₃O₂', 'FeO₃'], correct: 'Fe₂O₃',
                solution: 'El mínimo común múltiplo de 3 y 2 es 6: 2 Fe³⁺ aportan +6 y 3 O²⁻ aportan −6.',
                rule: 'Cruzar cargas es un atajo; la comprobación real es que la suma de cargas sea cero.'
            },
            {
                id: 'fb26', level: 4, kind: 'Número de oxidación',
                prompt: 'En FeCl₂, ¿qué número de oxidación tiene el hierro?',
                options: ['+1', '+2', '+3', '−2'], correct: '+2',
                solution: 'Cada Cl vale −1; dos cloruros suman −2, así que Fe debe ser +2.',
                rule: 'x + 2·(−1) = 0 ⇒ x = +2.'
            },
            {
                id: 'fb27', level: 4, kind: 'Número de oxidación',
                prompt: 'En Cu₂O, ¿qué número de oxidación tiene cada cobre?',
                options: ['+1', '+2', '+4', '−1'], correct: '+1',
                solution: 'El oxígeno vale −2. Los dos cobres suman +2; cada uno vale +1.',
                rule: '2·x + (−2) = 0 ⇒ x = +1.'
            },
            {
                id: 'fb28', level: 4, kind: 'Detecta el error',
                prompt: 'Un alumno escribe CaBr para el bromuro de calcio. ¿Cuál es la corrección?',
                options: ['Ca₂Br', 'CaBr₂', 'Ca₂Br₂', 'CaBr₃'], correct: 'CaBr₂',
                solution: 'Ca²⁺ necesita dos Br⁻. CaBr no sería eléctricamente neutro.',
                rule: '(+2) + 2·(−1) = 0.'
            },
            {
                id: 'fb29', level: 4, kind: 'Detecta el error',
                prompt: 'Un alumno obtiene Al₄O₆. ¿Qué fórmula debe escribir en proporción mínima?',
                options: ['AlO', 'Al₂O₃', 'Al₃O₂', 'Al₄O₆'], correct: 'Al₂O₃',
                solution: 'Al₄O₆ es neutra, pero sus subíndices se pueden dividir entre 2.',
                rule: 'La fórmula empírica usa la proporción entera más sencilla.'
            },
            {
                id: 'fb30', level: 4, kind: 'Detecta el error',
                prompt: 'Un alumno escribe Na₂Cl para el cloruro de sodio. ¿Qué fórmula es correcta?',
                options: ['NaCl', 'NaCl₂', 'Na₂Cl', 'Na₂Cl₂'], correct: 'NaCl',
                solution: 'Na⁺ y Cl⁻ se neutralizan uno a uno.',
                rule: 'No se cruzan números sin comprobar las cargas reales.'
            },
            {
                id: 'fb31', level: 4, kind: 'Número de oxidación',
                prompt: 'En SO₂, ¿qué número de oxidación tiene el azufre?',
                options: ['+2', '+4', '+6', '−2'], correct: '+4',
                solution: 'Dos oxígenos aportan −4; el azufre debe aportar +4.',
                rule: 'x + 2·(−2) = 0 ⇒ x = +4.'
            },
            {
                id: 'fb32', level: 4, kind: 'Número de oxidación',
                prompt: 'En N₂O₅, ¿qué número de oxidación tiene cada nitrógeno?',
                options: ['+2', '+3', '+5', '−5'], correct: '+5',
                solution: 'Cinco oxígenos suman −10; los dos nitrógenos suman +10, de modo que cada N vale +5.',
                rule: '2·x + 5·(−2) = 0 ⇒ x = +5.'
            }
        ]
    }
};
