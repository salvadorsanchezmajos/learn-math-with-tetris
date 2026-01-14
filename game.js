// ============================================================================
// GAME MANAGER - Handles menu and game switching
// ============================================================================

let currentGame = null; // 'tetris' or 'pacman'

// Menu elements
const gameMenu = document.getElementById('gameMenu');
const gameContainer = document.getElementById('gameContainer');
const playTetrisBtn = document.getElementById('playTetris');
const playPacmanBtn = document.getElementById('playPacman');
const backToMenuBtn = document.getElementById('backToMenu');
const gameTitle = document.getElementById('gameTitle');

// ============================================================================
// SHARED MUSIC SYSTEM
// ============================================================================

class GameMusic {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.currentNote = 0;
        this.tempo = 140;
        this.nextNoteTime = 0;
        this.scheduleAheadTime = 0.1;
        this.timerID = null;
        this.masterGain = null;

        // Melody notes
        this.melody = [
            { note: 659, duration: 0.5 }, { note: 494, duration: 0.25 },
            { note: 523, duration: 0.25 }, { note: 587, duration: 0.5 },
            { note: 523, duration: 0.25 }, { note: 494, duration: 0.25 },
            { note: 440, duration: 0.5 }, { note: 440, duration: 0.25 },
            { note: 523, duration: 0.25 }, { note: 659, duration: 0.5 },
            { note: 587, duration: 0.25 }, { note: 523, duration: 0.25 },
            { note: 494, duration: 0.75 }, { note: 523, duration: 0.25 },
            { note: 587, duration: 0.5 }, { note: 659, duration: 0.5 },
            { note: 523, duration: 0.5 }, { note: 440, duration: 0.5 },
            { note: 440, duration: 0.5 }, { note: 0, duration: 0.5 },
            { note: 587, duration: 0.75 }, { note: 698, duration: 0.25 },
            { note: 880, duration: 0.5 }, { note: 784, duration: 0.25 },
            { note: 698, duration: 0.25 }, { note: 659, duration: 0.75 },
            { note: 523, duration: 0.25 }, { note: 659, duration: 0.5 },
            { note: 587, duration: 0.25 }, { note: 523, duration: 0.25 },
            { note: 494, duration: 0.5 }, { note: 494, duration: 0.25 },
            { note: 523, duration: 0.25 }, { note: 587, duration: 0.5 },
            { note: 659, duration: 0.5 }, { note: 523, duration: 0.5 },
            { note: 440, duration: 0.5 }, { note: 440, duration: 0.5 },
            { note: 0, duration: 0.5 }
        ];

        this.bassLine = [
            { note: 165, duration: 1 }, { note: 165, duration: 1 },
            { note: 110, duration: 1 }, { note: 110, duration: 1 },
            { note: 147, duration: 1 }, { note: 147, duration: 1 },
            { note: 165, duration: 1 }, { note: 165, duration: 1 },
            { note: 147, duration: 1 }, { note: 147, duration: 1 },
            { note: 131, duration: 1 }, { note: 131, duration: 1 },
            { note: 123, duration: 1 }, { note: 165, duration: 1 },
            { note: 110, duration: 1 }, { note: 110, duration: 1 }
        ];
    }

    init() {
        if (this.audioContext) {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            return;
        }

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3;

            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playNote(frequency, startTime, duration, type = 'square', gainValue = 0.3) {
        if (!this.audioContext || frequency === 0) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(gainValue, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.9);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    scheduler() {
        const secondsPerBeat = 60.0 / this.tempo;

        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            const melodyNote = this.melody[this.currentNote % this.melody.length];
            const noteDuration = melodyNote.duration * secondsPerBeat;
            this.playNote(melodyNote.note, this.nextNoteTime, noteDuration, 'square', 0.2);

            const bassIndex = Math.floor(this.currentNote / 2) % this.bassLine.length;
            if (this.currentNote % 2 === 0) {
                const bassNote = this.bassLine[bassIndex];
                this.playNote(bassNote.note, this.nextNoteTime, secondsPerBeat * 0.8, 'triangle', 0.25);
            }

            this.nextNoteTime += noteDuration;
            this.currentNote++;
        }

        this.timerID = setTimeout(() => this.scheduler(), 25);
    }

    start() {
        if (this.isPlaying || this.isMuted) return;

        this.init();

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.currentNote = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
    }

    toggle() {
        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            this.stop();
        } else {
            this.start();
        }

        return this.isMuted;
    }

    pause() {
        if (this.isPlaying) {
            this.stop();
        }
    }

    resume() {
        if (!this.isMuted && !this.isPlaying) {
            this.start();
        }
    }
}

const gameMusic = new GameMusic();

// Sound controls
const soundToggle = document.getElementById('soundToggle');
const soundOn = document.getElementById('soundOn');
const soundOff = document.getElementById('soundOff');

soundToggle.addEventListener('click', () => {
    gameMusic.init();
    const isMuted = gameMusic.toggle();
    soundToggle.setAttribute('data-muted', isMuted);
    soundOn.classList.toggle('hidden', isMuted);
    soundOff.classList.toggle('hidden', !isMuted);
});

function startMusicOnInteraction() {
    gameMusic.init();

    if (gameMusic.audioContext && gameMusic.audioContext.state === 'suspended') {
        gameMusic.audioContext.resume().then(() => {
            if (!gameMusic.isMuted && !gameMusic.isPlaying) {
                gameMusic.start();
            }
        });
    } else if (!gameMusic.isMuted && !gameMusic.isPlaying) {
        gameMusic.start();
    }
}

// ============================================================================
// SHARED MATH QUESTION SYSTEM
// ============================================================================

const questionModal = document.getElementById('questionModal');
const questionText = document.getElementById('questionText');
const numeratorInput = document.getElementById('numeratorInput');
const denominatorInput = document.getElementById('denominatorInput');
const attemptsText = document.getElementById('attemptsText');
const submitAnswer = document.getElementById('submitAnswer');

class Fraction {
    constructor(numerator, denominator) {
        this.numerator = numerator;
        this.denominator = denominator;
    }

    simplify() {
        const g = this.gcd(Math.abs(this.numerator), Math.abs(this.denominator));
        const sign = (this.numerator < 0) !== (this.denominator < 0) ? -1 : 1;
        return new Fraction(
            sign * Math.abs(this.numerator) / g,
            Math.abs(this.denominator) / g
        );
    }

    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    }

    toString() {
        return `${this.numerator}/${this.denominator}`;
    }
}

class FractionQuestionGenerator {
    generateQuestion(level) {
        let difficulty;
        if (level <= 2) difficulty = 'EASY';
        else if (level <= 5) difficulty = 'MEDIUM';
        else if (level <= 8) difficulty = 'HARD';
        else difficulty = 'EXPERT';

        const operation = this.selectOperation(difficulty);
        const [fraction1, fraction2] = this.generateFractions(difficulty, operation);
        const answer = this.calculateAnswer(fraction1, fraction2, operation);

        return {
            fraction1,
            fraction2,
            operation,
            correctAnswer: answer,
            getQuestionText: function() {
                const symbols = { ADD: '+', SUBTRACT: '-', MULTIPLY: '×', DIVIDE: '÷' };
                return `${this.fraction1.numerator}/${this.fraction1.denominator} ${symbols[this.operation]} ${this.fraction2.numerator}/${this.fraction2.denominator} = ?`;
            },
            checkAnswer: function(num, den) {
                if (den === 0) return false;
                const userAnswer = new Fraction(num, den).simplify();
                const correct = this.correctAnswer.simplify();
                return userAnswer.numerator === correct.numerator &&
                       userAnswer.denominator === correct.denominator;
            }
        };
    }

    selectOperation(difficulty) {
        if (difficulty === 'EASY') {
            return Math.random() < 0.5 ? 'ADD' : 'SUBTRACT';
        } else if (difficulty === 'MEDIUM') {
            const r = Math.floor(Math.random() * 3);
            return ['ADD', 'SUBTRACT', 'MULTIPLY'][r];
        } else {
            const ops = ['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'];
            return ops[Math.floor(Math.random() * ops.length)];
        }
    }

    generateFractions(difficulty, operation) {
        switch (difficulty) {
            case 'EASY': return this.generateEasyFractions(operation);
            case 'MEDIUM': return this.generateMediumFractions(operation);
            case 'HARD': return this.generateHardFractions(operation);
            case 'EXPERT': return this.generateExpertFractions(operation);
            default: return this.generateEasyFractions(operation);
        }
    }

    generateEasyFractions(operation) {
        const denominators = [2, 3, 4, 5, 6];
        const denominator = denominators[Math.floor(Math.random() * denominators.length)];
        let num1 = Math.floor(Math.random() * denominator) + 1;
        let num2 = Math.floor(Math.random() * denominator) + 1;

        if (operation === 'SUBTRACT' && num1 < num2) {
            num2 = Math.floor(Math.random() * num1) + 1;
        }

        return [new Fraction(num1, denominator), new Fraction(num2, denominator)];
    }

    generateMediumFractions(operation) {
        if (operation === 'ADD' || operation === 'SUBTRACT') {
            const baseDenoms = [2, 3, 4, 5, 6];
            const baseDenom = baseDenoms[Math.floor(Math.random() * baseDenoms.length)];
            const denom1 = baseDenom;
            const denom2 = Math.random() < 0.5 ? baseDenom : baseDenom * 2;

            let num1 = Math.floor(Math.random() * denom1) + 1;
            let num2 = Math.floor(Math.random() * denom2) + 1;

            if (operation === 'SUBTRACT') {
                const val1 = num1 / denom1;
                const val2 = num2 / denom2;
                if (val1 < val2) {
                    num2 = Math.floor(Math.random() * Math.max(1, Math.floor(val1 * denom2))) + 1;
                }
            }

            return [new Fraction(num1, denom1), new Fraction(num2, denom2)];
        } else {
            const denoms = [2, 3, 4, 5];
            const denom1 = denoms[Math.floor(Math.random() * denoms.length)];
            const denom2 = denoms[Math.floor(Math.random() * denoms.length)];
            const num1 = Math.floor(Math.random() * denom1) + 1;
            const num2 = Math.floor(Math.random() * denom2) + 1;

            return [new Fraction(num1, denom1), new Fraction(num2, denom2)];
        }
    }

    generateHardFractions(operation) {
        let denom1 = Math.floor(Math.random() * 8) + 2;
        let denom2 = Math.floor(Math.random() * 8) + 2;
        let num1 = Math.floor(Math.random() * 9) + 1;
        let num2 = Math.floor(Math.random() * 9) + 1;

        if (operation === 'SUBTRACT') {
            const val1 = num1 / denom1;
            const val2 = num2 / denom2;
            if (val1 < val2) {
                return [new Fraction(num2, denom2), new Fraction(num1, denom1)];
            }
        }

        return [new Fraction(num1, denom1), new Fraction(num2, denom2)];
    }

    generateExpertFractions(operation) {
        let denom1 = Math.floor(Math.random() * 11) + 2;
        let denom2 = Math.floor(Math.random() * 11) + 2;
        let num1 = Math.floor(Math.random() * 12) + 1;
        let num2 = Math.floor(Math.random() * 12) + 1;

        if (operation === 'SUBTRACT') {
            const val1 = num1 / denom1;
            const val2 = num2 / denom2;
            if (val1 < val2) {
                return [new Fraction(num2, denom2), new Fraction(num1, denom1)];
            }
        }

        return [new Fraction(num1, denom1), new Fraction(num2, denom2)];
    }

    calculateAnswer(f1, f2, operation) {
        let numerator, denominator;

        switch (operation) {
            case 'ADD':
                numerator = f1.numerator * f2.denominator + f2.numerator * f1.denominator;
                denominator = f1.denominator * f2.denominator;
                break;
            case 'SUBTRACT':
                numerator = f1.numerator * f2.denominator - f2.numerator * f1.denominator;
                denominator = f1.denominator * f2.denominator;
                break;
            case 'MULTIPLY':
                numerator = f1.numerator * f2.numerator;
                denominator = f1.denominator * f2.denominator;
                break;
            case 'DIVIDE':
                numerator = f1.numerator * f2.denominator;
                denominator = f1.denominator * f2.numerator;
                break;
        }

        return new Fraction(numerator, denominator);
    }
}

const questionGenerator = new FractionQuestionGenerator();

// Submit answer handlers
numeratorInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (numeratorInput.value) {
            denominatorInput.focus();
        }
    }
});

denominatorInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitAnswer.click();
    }
});

// ============================================================================
// TETRIS GAME
// ============================================================================

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;
const ROWS_FOR_QUESTION = 2;

const COLORS = {
    I: '#00D4FF', O: '#FFE135', T: '#AA66CC', S: '#66BB6A',
    Z: '#FF6B6B', J: '#5C6BC0', L: '#FF9800'
};

const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
};

class TetrisGame {
    constructor() {
        this.board = [];
        this.currentPiece = null;
        this.currentPosition = { row: 0, col: 0 };
        this.nextPiece = null;
        this.score = 0;
        this.rowsCleared = 0;
        this.rowsSinceLastQuestion = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.showQuestion = false;
        this.attemptsRemaining = 3;
        this.currentQuestion = null;
        this.gameLoop = null;

        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPieceCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        // DOM elements
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.rowsDisplay = document.getElementById('rowsDisplay');
        this.attemptsDisplay = document.getElementById('attemptsDisplay');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.finalScore = document.getElementById('finalScore');
        this.restartButton = document.getElementById('restartButton');

        // Controls
        this.leftBtn = document.getElementById('leftBtn');
        this.rightBtn = document.getElementById('rightBtn');
        this.downBtn = document.getElementById('downBtn');
        this.rotateBtn = document.getElementById('rotateBtn');
        this.dropBtn = document.getElementById('dropBtn');
        this.pauseBtn = document.getElementById('pauseBtn');

        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (currentGame !== 'tetris') return;
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.moveRight();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.moveDown();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotate();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
            }
        });

        this.restartButton.addEventListener('click', () => this.restart());

        this.setupTouchButton(this.leftBtn, () => this.moveLeft());
        this.setupTouchButton(this.rightBtn, () => this.moveRight());
        this.setupTouchButton(this.downBtn, () => this.moveDown());
        this.setupTouchButton(this.rotateBtn, () => this.rotate());
        this.setupTouchButton(this.dropBtn, () => this.hardDrop());
        this.setupTouchButton(this.pauseBtn, () => this.togglePause());

        submitAnswer.addEventListener('click', () => this.submitAnswerHandler());
    }

    setupTouchButton(button, action) {
        let intervalId = null;

        const startAction = (e) => {
            e.preventDefault();
            startMusicOnInteraction();
            action();
            if (action === this.moveLeft.bind(this) || action === this.moveRight.bind(this) || action === this.moveDown.bind(this)) {
                intervalId = setInterval(action, 100);
            }
        };

        const stopAction = (e) => {
            e.preventDefault();
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        button.addEventListener('touchstart', startAction);
        button.addEventListener('touchend', stopAction);
        button.addEventListener('touchcancel', stopAction);
        button.addEventListener('click', (e) => {
            if (!e.sourceCapabilities || !e.sourceCapabilities.firesTouchEvents) {
                startMusicOnInteraction();
                action();
            }
        });
    }

    initBoard() {
        this.board = Array(BOARD_HEIGHT).fill(null).map(() =>
            Array(BOARD_WIDTH).fill(null).map(() => ({ filled: false, color: null }))
        );
    }

    createTetromino(type) {
        return {
            type: type,
            shape: SHAPES[type].map(row => [...row]),
            color: COLORS[type],

            rotateClockwise() {
                const rows = this.shape.length;
                const cols = this.shape[0].length;
                const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        rotated[c][rows - 1 - r] = this.shape[r][c];
                    }
                }

                const newPiece = { ...this };
                newPiece.shape = rotated;
                return newPiece;
            },

            getCells() {
                const cells = [];
                for (let r = 0; r < this.shape.length; r++) {
                    for (let c = 0; c < this.shape[r].length; c++) {
                        if (this.shape[r][c] === 1) {
                            cells.push({ row: r, col: c });
                        }
                    }
                }
                return cells;
            }
        };
    }

    randomTetromino() {
        const types = Object.keys(SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        return this.createTetromino(type);
    }

    canPlace(piece, position) {
        const cells = piece.getCells();
        for (const cell of cells) {
            const newRow = position.row + cell.row;
            const newCol = position.col + cell.col;

            if (newRow < 0 || newRow >= BOARD_HEIGHT) return false;
            if (newCol < 0 || newCol >= BOARD_WIDTH) return false;
            if (this.board[newRow][newCol].filled) return false;
        }
        return true;
    }

    lockPiece() {
        const cells = this.currentPiece.getCells();
        for (const cell of cells) {
            const row = this.currentPosition.row + cell.row;
            const col = this.currentPosition.col + cell.col;
            if (row >= 0 && row < BOARD_HEIGHT && col >= 0 && col < BOARD_WIDTH) {
                this.board[row][col] = { filled: true, color: this.currentPiece.color };
            }
        }

        const cleared = this.clearRows();
        this.rowsCleared += cleared;
        this.rowsSinceLastQuestion += cleared;
        this.score += this.calculateScore(cleared, this.level);
        this.level = 1 + Math.floor(this.rowsCleared / 10);

        const shouldShowQuestion = this.rowsSinceLastQuestion >= ROWS_FOR_QUESTION;
        if (shouldShowQuestion) {
            this.rowsSinceLastQuestion = 0;
            this.showQuestionModal();
        }

        this.spawnNewPiece();
        this.updateDisplay();
    }

    clearRows() {
        let cleared = 0;
        for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell.filled)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(BOARD_WIDTH).fill(null).map(() => ({ filled: false, color: null })));
                cleared++;
                row++;
            }
        }
        return cleared;
    }

    calculateScore(rowsCleared, level) {
        const baseScore = [0, 100, 300, 500, 800][rowsCleared] || 0;
        return baseScore * level;
    }

    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.randomTetromino();
        this.currentPosition = { row: 0, col: Math.floor(BOARD_WIDTH / 2) - 1 };

        if (!this.canPlace(this.currentPiece, this.currentPosition)) {
            this.gameOver();
        }

        this.drawNextPiece();
    }

    moveLeft() {
        if (this.isPaused || this.isGameOver || this.showQuestion) return;
        const newPosition = { row: this.currentPosition.row, col: this.currentPosition.col - 1 };
        if (this.canPlace(this.currentPiece, newPosition)) {
            this.currentPosition = newPosition;
            this.draw();
        }
    }

    moveRight() {
        if (this.isPaused || this.isGameOver || this.showQuestion) return;
        const newPosition = { row: this.currentPosition.row, col: this.currentPosition.col + 1 };
        if (this.canPlace(this.currentPiece, newPosition)) {
            this.currentPosition = newPosition;
            this.draw();
        }
    }

    moveDown() {
        if (this.isPaused || this.isGameOver || this.showQuestion) return;
        const newPosition = { row: this.currentPosition.row + 1, col: this.currentPosition.col };
        if (this.canPlace(this.currentPiece, newPosition)) {
            this.currentPosition = newPosition;
            this.draw();
        } else {
            this.lockPiece();
        }
    }

    hardDrop() {
        if (this.isPaused || this.isGameOver || this.showQuestion) return;
        while (this.canPlace(this.currentPiece, { row: this.currentPosition.row + 1, col: this.currentPosition.col })) {
            this.currentPosition.row++;
        }
        this.lockPiece();
        this.draw();
    }

    rotate() {
        if (this.isPaused || this.isGameOver || this.showQuestion) return;
        const rotated = this.currentPiece.rotateClockwise();

        if (this.canPlace(rotated, this.currentPosition)) {
            this.currentPiece = rotated;
            this.draw();
            return;
        }

        for (const offset of [-1, 1, -2, 2]) {
            const kickPosition = { row: this.currentPosition.row, col: this.currentPosition.col + offset };
            if (this.canPlace(rotated, kickPosition)) {
                this.currentPiece = rotated;
                this.currentPosition = kickPosition;
                this.draw();
                return;
            }
        }
    }

    togglePause() {
        if (this.isGameOver || this.showQuestion) return;
        this.isPaused = !this.isPaused;
        this.pauseOverlay.classList.toggle('hidden', !this.isPaused);

        if (this.isPaused) {
            gameMusic.pause();
        } else {
            gameMusic.resume();
        }
    }

    gameOver() {
        this.isGameOver = true;
        clearTimeout(this.gameLoop);
        this.finalScore.textContent = this.score;
        this.gameOverOverlay.classList.remove('hidden');
        gameMusic.pause();
    }

    showQuestionModal() {
        this.showQuestion = true;
        this.isPaused = true;
        this.currentQuestion = questionGenerator.generateQuestion(this.level);
        questionText.textContent = this.currentQuestion.getQuestionText();
        attemptsText.textContent = `Attempts remaining: ${this.attemptsRemaining}`;
        numeratorInput.value = '';
        denominatorInput.value = '';
        questionModal.classList.remove('hidden');
        numeratorInput.focus();
        gameMusic.pause();
    }

    hideQuestionModal() {
        this.showQuestion = false;
        this.isPaused = false;
        this.currentQuestion = null;
        questionModal.classList.add('hidden');
        gameMusic.resume();
    }

    submitAnswerHandler() {
        const num = parseInt(numeratorInput.value);
        const den = parseInt(denominatorInput.value);

        if (isNaN(num) || isNaN(den) || den === 0) {
            attemptsText.textContent = 'Please enter valid numbers (denominator cannot be 0)';
            return;
        }

        if (this.currentQuestion.checkAnswer(num, den)) {
            this.attemptsRemaining = 3;
            this.hideQuestionModal();
        } else {
            this.attemptsRemaining--;
            if (this.attemptsRemaining <= 0) {
                this.hideQuestionModal();
                this.restart();
            } else {
                attemptsText.textContent = `Wrong! Attempts remaining: ${this.attemptsRemaining}`;
                numeratorInput.value = '';
                denominatorInput.value = '';
                numeratorInput.focus();
            }
        }
        this.updateDisplay();
    }

    restart() {
        this.initBoard();
        this.currentPiece = this.randomTetromino();
        this.nextPiece = this.randomTetromino();
        this.currentPosition = { row: 0, col: Math.floor(BOARD_WIDTH / 2) - 1 };
        this.score = 0;
        this.rowsCleared = 0;
        this.rowsSinceLastQuestion = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.showQuestion = false;
        this.attemptsRemaining = 3;
        this.currentQuestion = null;

        this.gameOverOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        questionModal.classList.add('hidden');

        this.updateDisplay();
        this.drawNextPiece();
        gameMusic.resume();
        this.startGameLoop();
    }

    updateDisplay() {
        this.scoreDisplay.textContent = this.score;
        this.levelDisplay.textContent = this.level;
        this.rowsDisplay.textContent = this.rowsCleared;
        this.attemptsDisplay.textContent = this.attemptsRemaining;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= BOARD_WIDTH; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * CELL_SIZE, 0);
            this.ctx.lineTo(i * CELL_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= BOARD_HEIGHT; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * CELL_SIZE);
            this.ctx.lineTo(this.canvas.width, i * CELL_SIZE);
            this.ctx.stroke();
        }

        // Draw board
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            for (let col = 0; col < BOARD_WIDTH; col++) {
                if (this.board[row][col].filled) {
                    this.drawCell(this.ctx, col, row, this.board[row][col].color);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece && !this.isGameOver) {
            const cells = this.currentPiece.getCells();
            for (const cell of cells) {
                const row = this.currentPosition.row + cell.row;
                const col = this.currentPosition.col + cell.col;
                if (row >= 0) {
                    this.drawCell(this.ctx, col, row, this.currentPiece.color);
                }
            }

            // Draw ghost piece
            let ghostRow = this.currentPosition.row;
            while (this.canPlace(this.currentPiece, { row: ghostRow + 1, col: this.currentPosition.col })) {
                ghostRow++;
            }
            if (ghostRow !== this.currentPosition.row) {
                for (const cell of cells) {
                    const row = ghostRow + cell.row;
                    const col = this.currentPosition.col + cell.col;
                    if (row >= 0) {
                        this.drawGhostCell(this.ctx, col, row, this.currentPiece.color);
                    }
                }
            }
        }
    }

    drawCell(context, col, row, color) {
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;
        const padding = 2;

        context.fillStyle = color;
        context.fillRect(x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2);

        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(x + padding, y + padding, CELL_SIZE - padding * 2, 4);
        context.fillRect(x + padding, y + padding, 4, CELL_SIZE - padding * 2);

        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.fillRect(x + CELL_SIZE - padding - 4, y + padding, 4, CELL_SIZE - padding * 2);
        context.fillRect(x + padding, y + CELL_SIZE - padding - 4, CELL_SIZE - padding * 2, 4);
    }

    drawGhostCell(context, col, row, color) {
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;
        const padding = 2;

        context.strokeStyle = color;
        context.lineWidth = 2;
        context.globalAlpha = 0.4;
        context.strokeRect(x + padding + 1, y + padding + 1, CELL_SIZE - padding * 2 - 2, CELL_SIZE - padding * 2 - 2);
        context.globalAlpha = 1;
    }

    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        this.nextCtx.fillStyle = '#1a1a2e';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!this.nextPiece) return;

        const cells = this.nextPiece.getCells();
        const minCol = Math.min(...cells.map(c => c.col));
        const maxCol = Math.max(...cells.map(c => c.col));
        const minRow = Math.min(...cells.map(c => c.row));
        const maxRow = Math.max(...cells.map(c => c.row));

        const pieceWidth = (maxCol - minCol + 1) * 25;
        const pieceHeight = (maxRow - minRow + 1) * 25;
        const offsetX = (this.nextCanvas.width - pieceWidth) / 2 - minCol * 25;
        const offsetY = (this.nextCanvas.height - pieceHeight) / 2 - minRow * 25;

        for (const cell of cells) {
            const x = offsetX + cell.col * 25;
            const y = offsetY + cell.row * 25;

            this.nextCtx.fillStyle = this.nextPiece.color;
            this.nextCtx.fillRect(x + 2, y + 2, 21, 21);

            this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.nextCtx.fillRect(x + 2, y + 2, 21, 3);
            this.nextCtx.fillRect(x + 2, y + 2, 3, 21);
        }
    }

    startGameLoop() {
        clearTimeout(this.gameLoop);
        const tick = () => {
            if (!this.isPaused && !this.isGameOver && !this.showQuestion) {
                this.moveDown();
            }
        };

        const getDelay = () => {
            const baseDelay = 800;
            const minDelay = 200;
            const speedReduction = (this.level - 1) * 50;
            return Math.max(minDelay, baseDelay - speedReduction);
        };

        const loop = () => {
            tick();
            this.draw();
            this.gameLoop = setTimeout(loop, getDelay());
        };

        this.gameLoop = setTimeout(loop, getDelay());
    }

    start() {
        this.initBoard();
        this.currentPiece = this.randomTetromino();
        this.nextPiece = this.randomTetromino();
        this.currentPosition = { row: 0, col: Math.floor(BOARD_WIDTH / 2) - 1 };
        this.updateDisplay();
        this.drawNextPiece();
        this.draw();
        this.startGameLoop();
        gameMusic.resume();
    }

    stop() {
        clearTimeout(this.gameLoop);
        gameMusic.pause();
    }
}

// ============================================================================
// PAC-MAN GAME
// ============================================================================

const TILE_SIZE = 20;
const MAZE_COLS = 28;
const MAZE_ROWS = 31;

// Classic Pac-Man maze layout (0=wall, 1=dot, 2=power pellet, 3=empty, 4=ghost house)
const MAZE_LAYOUT = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,2,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,2,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,3,0,0,3,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,3,0,0,3,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,3,3,3,3,3,3,3,3,3,3,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,3,0,0,0,4,4,0,0,0,3,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,3,0,4,4,4,4,4,4,0,3,0,0,1,0,0,0,0,0,0],
    [3,3,3,3,3,3,1,3,3,3,0,4,4,4,4,4,4,0,3,3,3,1,3,3,3,3,3,3],
    [0,0,0,0,0,0,1,0,0,3,0,4,4,4,4,4,4,0,3,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,3,0,0,0,0,0,0,0,0,3,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,3,3,3,3,3,3,3,3,3,3,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,3,0,0,0,0,0,0,0,0,3,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,3,0,0,0,0,0,0,0,0,3,0,0,1,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,2,1,1,0,0,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,0,0,1,1,2,0],
    [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
    [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
    [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

class PacManGame {
    constructor() {
        this.canvas = document.getElementById('pacmanCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.pacman = { x: 14, y: 23, dir: 0, nextDir: 0, mouthOpen: 0 }; // 0=right,1=down,2=left,3=up
        this.ghosts = [];
        this.maze = [];
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.attemptsRemaining = 3;
        this.isPaused = false;
        this.isGameOver = false;
        this.showQuestion = false;
        this.currentQuestion = null;
        this.gameLoop = null;

        this.totalDots = 0;
        this.dotsEaten = 0;
        this.lastMathBreak = 0; // Track progress for math breaks

        this.powerMode = false;
        this.powerModeTimer = 0;
        this.fruit = null;

        // DOM elements
        this.scoreDisplay = document.getElementById('pacmanScoreDisplay');
        this.levelDisplay = document.getElementById('pacmanLevelDisplay');
        this.livesDisplay = document.getElementById('livesDisplay');
        this.attemptsDisplay = document.getElementById('pacmanAttemptsDisplay');
        this.pauseOverlay = document.getElementById('pacmanPauseOverlay');
        this.gameOverOverlay = document.getElementById('pacmanGameOverOverlay');
        this.finalScore = document.getElementById('pacmanFinalScore');
        this.restartButton = document.getElementById('pacmanRestartButton');

        // Controls
        this.leftBtn = document.getElementById('pacmanLeftBtn');
        this.rightBtn = document.getElementById('pacmanRightBtn');
        this.upBtn = document.getElementById('pacmanUpBtn');
        this.downBtn = document.getElementById('pacmanDownBtn');
        this.pauseBtn = document.getElementById('pacmanPauseBtn');

        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (currentGame !== 'pacman') return;
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.pacman.nextDir = 2;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.pacman.nextDir = 0;
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.pacman.nextDir = 3;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.pacman.nextDir = 1;
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
            }
        });

        this.restartButton.addEventListener('click', () => this.restart());

        this.setupTouchButton(this.leftBtn, () => this.pacman.nextDir = 2);
        this.setupTouchButton(this.rightBtn, () => this.pacman.nextDir = 0);
        this.setupTouchButton(this.upBtn, () => this.pacman.nextDir = 3);
        this.setupTouchButton(this.downBtn, () => this.pacman.nextDir = 1);
        this.setupTouchButton(this.pauseBtn, () => this.togglePause());

        submitAnswer.addEventListener('click', () => this.submitAnswerHandler());
    }

    setupTouchButton(button, action) {
        const startAction = (e) => {
            e.preventDefault();
            startMusicOnInteraction();
            action();
        };

        button.addEventListener('touchstart', startAction);
        button.addEventListener('click', (e) => {
            if (!e.sourceCapabilities || !e.sourceCapabilities.firesTouchEvents) {
                startMusicOnInteraction();
                action();
            }
        });
    }

    initMaze() {
        this.maze = MAZE_LAYOUT.map(row => [...row]);
        this.totalDots = 0;
        this.dotsEaten = 0;
        this.lastMathBreak = 0;

        for (let row of this.maze) {
            for (let cell of row) {
                if (cell === 1 || cell === 2) this.totalDots++;
            }
        }
    }

    initGhosts() {
        const colors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB851'];
        const names = ['Blinky', 'Pinky', 'Inky', 'Clyde'];
        this.ghosts = [];

        for (let i = 0; i < 4; i++) {
            this.ghosts.push({
                x: 13 + i,  // Whole tile position
                y: 14,      // Whole tile position
                dir: 0,
                color: colors[i],
                name: names[i],
                mode: 'scatter', // scatter, chase, frightened
                scatterTarget: { x: i * 9, y: i % 2 === 0 ? 0 : 30 },
                modeTimer: 0
            });
        }
    }

    canMove(x, y) {
        // Allow tunnel wrapping
        if (y < 0 || y >= MAZE_ROWS) return false;

        // Check center point - most important
        let checkX = x;
        if (checkX < 0) checkX = MAZE_COLS - 1;
        if (checkX >= MAZE_COLS) checkX = 0;

        const centerCell = this.maze[Math.floor(y)][Math.floor(checkX)];
        if (centerCell === 0) return false;

        // Check corners with smaller margin
        const margin = 0.3;
        const positions = [
            [x - margin, y - margin],
            [x + margin, y - margin],
            [x - margin, y + margin],
            [x + margin, y + margin]
        ];

        for (let [px, py] of positions) {
            // Handle wrapping
            if (px < 0) px = MAZE_COLS - 1;
            if (px >= MAZE_COLS) px = 0;
            if (py < 0 || py >= MAZE_ROWS) continue;

            const cell = this.maze[Math.floor(py)][Math.floor(px)];
            if (cell === 0) return false;
        }

        return true;
    }

    movePacman() {
        const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // right, down, left, up
        const speed = 0.15;

        // Get current grid position
        const gridX = Math.round(this.pacman.x);
        const gridY = Math.round(this.pacman.y);

        // Try to turn if player wants to change direction
        if (this.pacman.nextDir !== this.pacman.dir) {
            const [ndx, ndy] = dirs[this.pacman.nextDir];
            let checkX = gridX + ndx;
            let checkY = gridY + ndy;

            // Handle wrap
            if (checkX < 0) checkX = MAZE_COLS - 1;
            if (checkX >= MAZE_COLS) checkX = 0;

            // Check if we can go that way (not a wall)
            if (checkY >= 0 && checkY < MAZE_ROWS && this.maze[checkY][checkX] !== 0) {
                this.pacman.dir = this.pacman.nextDir;
            }
        }

        // Move in current direction
        const [dx, dy] = dirs[this.pacman.dir];
        let newX = this.pacman.x + dx * speed;
        let newY = this.pacman.y + dy * speed;

        // Lock to corridor centerline - critical for proper alignment
        if (dx !== 0) {
            // Moving horizontally - lock Y to integer (center of row)
            newY = Math.round(this.pacman.y);
        } else if (dy !== 0) {
            // Moving vertically - lock X to integer (center of column)
            newX = Math.round(this.pacman.x);
        }

        // Check if we're entering a new tile - use floor/ceil based on direction
        let checkX, checkY;
        if (dx > 0) {
            checkX = Math.ceil(newX);  // Check tile to the right
        } else if (dx < 0) {
            checkX = Math.floor(newX);  // Check tile to the left
        } else {
            checkX = Math.round(newX);  // Not moving horizontally
        }

        if (dy > 0) {
            checkY = Math.ceil(newY);  // Check tile below
        } else if (dy < 0) {
            checkY = Math.floor(newY);  // Check tile above
        } else {
            checkY = Math.round(newY);  // Not moving vertically
        }

        // Handle wrap
        if (checkX < 0) checkX = MAZE_COLS - 1;
        if (checkX >= MAZE_COLS) checkX = 0;

        // Only move if not hitting a wall
        if (checkY >= 0 && checkY < MAZE_ROWS && this.maze[checkY][checkX] !== 0) {
            this.pacman.x = newX;
            this.pacman.y = newY;

            // Handle tunnel wrap
            if (this.pacman.x < -0.5) this.pacman.x = MAZE_COLS - 0.5;
            if (this.pacman.x >= MAZE_COLS - 0.5) this.pacman.x = -0.5;
        }
        // If hitting a wall, just don't move - stay at current position

        // Check for dots - use round to get the tile we're on
        const cellX = Math.round(this.pacman.x);
        const cellY = Math.round(this.pacman.y);

        if (cellX >= 0 && cellX < MAZE_COLS && cellY >= 0 && cellY < MAZE_ROWS) {
            if (this.maze[cellY][cellX] === 1) {
                this.maze[cellY][cellX] = 3;
                this.score += 10;
                this.dotsEaten++;
                this.checkMathBreak();
            } else if (this.maze[cellY][cellX] === 2) {
                this.maze[cellY][cellX] = 3;
                this.score += 50;
                this.dotsEaten++;
                this.powerMode = true;
                this.powerModeTimer = 200;
                this.ghosts.forEach(g => g.mode = 'frightened');
                this.checkMathBreak();
            }
        }

        // Check level complete
        if (this.dotsEaten >= this.totalDots) {
            this.nextLevel();
        }

        this.pacman.mouthOpen = (this.pacman.mouthOpen + 1) % 20;
    }

    checkMathBreak() {
        const threshold1 = Math.floor(this.totalDots / 3);
        const threshold2 = Math.floor(this.totalDots * 2 / 3);
        const threshold3 = this.totalDots;

        if (this.lastMathBreak === 0 && this.dotsEaten >= threshold1) {
            this.lastMathBreak = 1;
            this.showQuestionModal();
        } else if (this.lastMathBreak === 1 && this.dotsEaten >= threshold2) {
            this.lastMathBreak = 2;
            this.showQuestionModal();
        } else if (this.lastMathBreak === 2 && this.dotsEaten >= threshold3) {
            this.lastMathBreak = 3;
            this.showQuestionModal();
        }
    }

    moveGhosts() {
        if (this.powerMode) {
            this.powerModeTimer--;
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;
                this.ghosts.forEach(g => g.mode = 'scatter');
            }
        }

        for (let ghost of this.ghosts) {
            // Simple AI: move towards target
            let target;
            if (ghost.mode === 'frightened') {
                target = { x: Math.random() * MAZE_COLS, y: Math.random() * MAZE_ROWS };
            } else if (ghost.mode === 'chase') {
                target = { x: this.pacman.x, y: this.pacman.y };
            } else {
                target = ghost.scatterTarget;
            }

            const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
            let bestDir = ghost.dir;
            let bestDist = Infinity;

            // Get ghost's current grid position
            const ghostGridX = Math.round(ghost.x);
            const ghostGridY = Math.round(ghost.y);

            // Try all 4 directions
            for (let i = 0; i < 4; i++) {
                const [dx, dy] = dirs[i];
                let checkX = ghostGridX + dx;
                let checkY = ghostGridY + dy;

                // Handle wrap
                if (checkX < 0) checkX = MAZE_COLS - 1;
                if (checkX >= MAZE_COLS) checkX = 0;

                // Check if this direction is valid (not a wall)
                if (checkY >= 0 && checkY < MAZE_ROWS && this.maze[checkY][checkX] !== 0) {
                    const dist = Math.hypot(checkX - target.x, checkY - target.y);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestDir = i;
                    }
                }
            }

            ghost.dir = bestDir;
            const [dx, dy] = dirs[ghost.dir];
            const speed = ghost.mode === 'frightened' ? 0.08 : 0.12;

            let newGhostX = ghost.x + dx * speed;
            let newGhostY = ghost.y + dy * speed;

            // Lock to corridor centerline - critical for proper alignment
            if (dx !== 0) {
                // Moving horizontally - lock Y to integer (center of row)
                newGhostY = Math.round(ghost.y);
            } else if (dy !== 0) {
                // Moving vertically - lock X to integer (center of column)
                newGhostX = Math.round(ghost.x);
            }

            // Check if we're entering a new tile - use floor/ceil based on direction
            let checkX, checkY;
            if (dx > 0) {
                checkX = Math.ceil(newGhostX);
            } else if (dx < 0) {
                checkX = Math.floor(newGhostX);
            } else {
                checkX = Math.round(newGhostX);
            }

            if (dy > 0) {
                checkY = Math.ceil(newGhostY);
            } else if (dy < 0) {
                checkY = Math.floor(newGhostY);
            } else {
                checkY = Math.round(newGhostY);
            }

            // Handle wrap
            if (checkX < 0) checkX = MAZE_COLS - 1;
            if (checkX >= MAZE_COLS) checkX = 0;

            // Only move if not hitting a wall
            if (checkY >= 0 && checkY < MAZE_ROWS && this.maze[checkY][checkX] !== 0) {
                ghost.x = newGhostX;
                ghost.y = newGhostY;

                // Handle tunnel wrap
                if (ghost.x < -0.5) ghost.x = MAZE_COLS - 0.5;
                if (ghost.x >= MAZE_COLS - 0.5) ghost.x = -0.5;
            }
            // If hitting a wall, just don't move - stay at current position

            // Check collision with pacman
            const dist = Math.hypot(ghost.x - this.pacman.x, ghost.y - this.pacman.y);
            if (dist < 0.5) {
                if (ghost.mode === 'frightened') {
                    this.score += 200;
                    ghost.x = 14;
                    ghost.y = 14;
                    ghost.mode = 'scatter';
                } else {
                    this.loseLife();
                }
            }

            // Mode switching
            ghost.modeTimer++;
            if (ghost.mode === 'scatter' && ghost.modeTimer > 200) {
                ghost.mode = 'chase';
                ghost.modeTimer = 0;
            } else if (ghost.mode === 'chase' && ghost.modeTimer > 200) {
                ghost.mode = 'scatter';
                ghost.modeTimer = 0;
            }
        }
    }

    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.pacman.x = 14.5;
            this.pacman.y = 23.5;
            this.pacman.dir = 0;
            this.pacman.nextDir = 0;
            this.initGhosts();
        }
    }

    nextLevel() {
        this.level++;
        this.initMaze();
        this.pacman.x = 14;
        this.pacman.y = 23;
        this.pacman.dir = 0;
        this.pacman.nextDir = 0;
        this.initGhosts();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw maze with better visuals
        for (let row = 0; row < MAZE_ROWS; row++) {
            for (let col = 0; col < MAZE_COLS; col++) {
                const cell = this.maze[row][col];
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;

                if (cell === 0) {
                    // Draw walls with borders
                    this.ctx.fillStyle = '#1B1BA5';
                    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                    // Add blue border effect
                    this.ctx.strokeStyle = '#2D2DFF';
                    this.ctx.lineWidth = 2;

                    // Check neighbors to draw borders
                    const hasTop = row > 0 && this.maze[row - 1][col] !== 0;
                    const hasBottom = row < MAZE_ROWS - 1 && this.maze[row + 1][col] !== 0;
                    const hasLeft = col > 0 && this.maze[row][col - 1] !== 0;
                    const hasRight = col < MAZE_COLS - 1 && this.maze[row][col + 1] !== 0;

                    this.ctx.beginPath();
                    if (hasTop) {
                        this.ctx.moveTo(x, y);
                        this.ctx.lineTo(x + TILE_SIZE, y);
                    }
                    if (hasBottom) {
                        this.ctx.moveTo(x, y + TILE_SIZE);
                        this.ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
                    }
                    if (hasLeft) {
                        this.ctx.moveTo(x, y);
                        this.ctx.lineTo(x, y + TILE_SIZE);
                    }
                    if (hasRight) {
                        this.ctx.moveTo(x + TILE_SIZE, y);
                        this.ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
                    }
                    this.ctx.stroke();
                } else if (cell === 1) {
                    // Draw dots with glow
                    this.ctx.shadowBlur = 5;
                    this.ctx.shadowColor = '#FFB897';
                    this.ctx.fillStyle = '#FFB897';
                    this.ctx.beginPath();
                    this.ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                } else if (cell === 2) {
                    // Draw power pellets with pulsing glow
                    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
                    this.ctx.shadowBlur = 10 * pulse;
                    this.ctx.shadowColor = '#FFE135';
                    this.ctx.fillStyle = '#FFE135';
                    this.ctx.beginPath();
                    this.ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 6 * pulse, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
            }
        }

        // Draw Pac-Man - convert grid position to pixel position
        const px = this.pacman.x * TILE_SIZE + TILE_SIZE / 2;
        const py = this.pacman.y * TILE_SIZE + TILE_SIZE / 2;

        // Pac-Man glow
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#FFFF00';
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();

        const mouthAngle = this.pacman.mouthOpen < 10 ? 0.3 : 0.05;
        const startAngle = this.pacman.dir * Math.PI / 2 + mouthAngle;
        const endAngle = this.pacman.dir * Math.PI / 2 + Math.PI * 2 - mouthAngle;

        // Draw centered on tile
        this.ctx.arc(px, py, TILE_SIZE / 2 - 1, startAngle, endAngle);
        this.ctx.lineTo(px, py);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw ghosts with improved visuals
        for (let ghost of this.ghosts) {
            const gx = ghost.x * TILE_SIZE + TILE_SIZE / 2;
            const gy = ghost.y * TILE_SIZE + TILE_SIZE / 2;

            // Ghost body
            const ghostColor = ghost.mode === 'frightened' ?
                (this.powerModeTimer > 60 ? '#3636FF' : (this.powerModeTimer % 20 < 10 ? '#3636FF' : '#FFF')) :
                ghost.color;

            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = ghostColor;
            this.ctx.fillStyle = ghostColor;
            this.ctx.beginPath();

            // Round top - draw centered on tile
            this.ctx.arc(gx, gy, TILE_SIZE / 2 - 1, Math.PI, 0);

            // Wavy bottom
            const waveOffset = (Date.now() / 100 + ghost.x) % 20 < 10 ? 0 : 2;
            this.ctx.lineTo(gx + TILE_SIZE / 2 - 1, gy + TILE_SIZE / 2 - 1 - waveOffset);
            this.ctx.lineTo(gx + TILE_SIZE * 0.25, gy + TILE_SIZE * 0.25 - waveOffset);
            this.ctx.lineTo(gx, gy + TILE_SIZE / 2 - 1 - waveOffset);
            this.ctx.lineTo(gx - TILE_SIZE * 0.25, gy + TILE_SIZE * 0.25 - waveOffset);
            this.ctx.lineTo(gx - TILE_SIZE / 2 + 1, gy + TILE_SIZE / 2 - 1 - waveOffset);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Ghost eyes
            if (ghost.mode !== 'frightened' || this.powerModeTimer <= 60) {
                // White of eyes
                this.ctx.fillStyle = '#FFF';
                this.ctx.beginPath();
                this.ctx.arc(gx - 3, gy - 2, 3, 0, Math.PI * 2);
                this.ctx.arc(gx + 3, gy - 2, 3, 0, Math.PI * 2);
                this.ctx.fill();

                // Pupils (looking in direction of movement)
                this.ctx.fillStyle = '#0000FF';
                const pupilOffsetX = ghost.dir === 0 ? 1 : ghost.dir === 2 ? -1 : 0;
                const pupilOffsetY = ghost.dir === 1 ? 1 : ghost.dir === 3 ? -1 : 0;
                this.ctx.beginPath();
                this.ctx.arc(gx - 3 + pupilOffsetX, gy - 2 + pupilOffsetY, 1.5, 0, Math.PI * 2);
                this.ctx.arc(gx + 3 + pupilOffsetX, gy - 2 + pupilOffsetY, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Frightened face
                this.ctx.fillStyle = '#FFF';
                this.ctx.fillRect(gx + 5, gy + 9, 2, 4);
                this.ctx.fillRect(gx + 13, gy + 9, 2, 4);
                this.ctx.fillRect(gx + 7, gy + 13, 6, 2);
            }
        }
    }

    togglePause() {
        if (this.isGameOver || this.showQuestion) return;
        this.isPaused = !this.isPaused;
        this.pauseOverlay.classList.toggle('hidden', !this.isPaused);

        if (this.isPaused) {
            gameMusic.pause();
        } else {
            gameMusic.resume();
        }
    }

    gameOver() {
        this.isGameOver = true;
        clearTimeout(this.gameLoop);
        this.finalScore.textContent = this.score;
        this.gameOverOverlay.classList.remove('hidden');
        gameMusic.pause();
    }

    showQuestionModal() {
        this.showQuestion = true;
        this.isPaused = true;
        this.currentQuestion = questionGenerator.generateQuestion(this.level);
        questionText.textContent = this.currentQuestion.getQuestionText();
        attemptsText.textContent = `Attempts remaining: ${this.attemptsRemaining}`;
        numeratorInput.value = '';
        denominatorInput.value = '';
        questionModal.classList.remove('hidden');
        numeratorInput.focus();
        gameMusic.pause();
    }

    hideQuestionModal() {
        this.showQuestion = false;
        this.isPaused = false;
        this.currentQuestion = null;
        questionModal.classList.add('hidden');
        gameMusic.resume();
    }

    submitAnswerHandler() {
        const num = parseInt(numeratorInput.value);
        const den = parseInt(denominatorInput.value);

        if (isNaN(num) || isNaN(den) || den === 0) {
            attemptsText.textContent = 'Please enter valid numbers (denominator cannot be 0)';
            return;
        }

        if (this.currentQuestion.checkAnswer(num, den)) {
            this.attemptsRemaining = 3;
            this.hideQuestionModal();
        } else {
            this.attemptsRemaining--;
            if (this.attemptsRemaining <= 0) {
                this.hideQuestionModal();
                this.restart();
            } else {
                attemptsText.textContent = `Wrong! Attempts remaining: ${this.attemptsRemaining}`;
                numeratorInput.value = '';
                denominatorInput.value = '';
                numeratorInput.focus();
            }
        }
        this.updateDisplay();
    }

    restart() {
        this.initMaze();
        this.initGhosts();
        this.pacman = { x: 14, y: 23, dir: 0, nextDir: 0, mouthOpen: 0 };
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.attemptsRemaining = 3;
        this.isPaused = false;
        this.isGameOver = false;
        this.showQuestion = false;
        this.currentQuestion = null;
        this.powerMode = false;
        this.powerModeTimer = 0;

        this.gameOverOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        questionModal.classList.add('hidden');

        this.updateDisplay();
        gameMusic.resume();
        this.startGameLoop();
    }

    updateDisplay() {
        this.scoreDisplay.textContent = this.score;
        this.levelDisplay.textContent = this.level;
        this.livesDisplay.textContent = this.lives;
        this.attemptsDisplay.textContent = this.attemptsRemaining;
    }

    startGameLoop() {
        clearTimeout(this.gameLoop);

        const loop = () => {
            if (!this.isPaused && !this.isGameOver && !this.showQuestion) {
                this.movePacman();
                this.moveGhosts();
            }
            this.draw();
            this.gameLoop = setTimeout(loop, 1000 / 30); // 30 FPS
        };

        this.gameLoop = setTimeout(loop, 1000 / 30);
    }

    start() {
        this.initMaze();
        this.initGhosts();

        // Reset Pac-Man position - center of tile
        this.pacman = { x: 14, y: 23, dir: 0, nextDir: 0, mouthOpen: 0 };
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.isPaused = false;
        this.isGameOver = false;

        this.updateDisplay();
        this.draw();
        this.startGameLoop();
        gameMusic.resume();
    }

    stop() {
        clearTimeout(this.gameLoop);
        gameMusic.pause();
    }
}

// ============================================================================
// MENU SYSTEM
// ============================================================================

let tetrisGame = null;
let pacmanGame = null;

playTetrisBtn.addEventListener('click', () => {
    startMusicOnInteraction();
    startGame('tetris');
});

playPacmanBtn.addEventListener('click', () => {
    startMusicOnInteraction();
    startGame('pacman');
});

backToMenuBtn.addEventListener('click', () => {
    returnToMenu();
});

function startGame(gameType) {
    currentGame = gameType;
    gameMenu.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    if (gameType === 'tetris') {
        gameTitle.textContent = 'Learn Math with Tetris';
        document.getElementById('tetrisGame').classList.remove('hidden');
        document.getElementById('tetrisControls').classList.remove('hidden');
        document.getElementById('pacmanGame').classList.add('hidden');
        document.getElementById('pacmanControls').classList.add('hidden');

        if (pacmanGame) pacmanGame.stop();
        if (!tetrisGame) tetrisGame = new TetrisGame();
        tetrisGame.start();
    } else {
        gameTitle.textContent = 'Learn Math with Pac-Man';
        document.getElementById('tetrisGame').classList.add('hidden');
        document.getElementById('tetrisControls').classList.add('hidden');
        document.getElementById('pacmanGame').classList.remove('hidden');
        document.getElementById('pacmanControls').classList.remove('hidden');

        if (tetrisGame) tetrisGame.stop();
        if (!pacmanGame) pacmanGame = new PacManGame();
        pacmanGame.start();
    }
}

function returnToMenu() {
    if (tetrisGame) tetrisGame.stop();
    if (pacmanGame) pacmanGame.stop();

    gameContainer.classList.add('hidden');
    gameMenu.classList.remove('hidden');
    currentGame = null;

    // Hide all overlays
    document.getElementById('pauseOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('pacmanPauseOverlay').classList.add('hidden');
    document.getElementById('pacmanGameOverOverlay').classList.add('hidden');
    questionModal.classList.add('hidden');
}
