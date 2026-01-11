// Game Constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;
const ROWS_FOR_QUESTION = 2;

// Tetromino colors (kid-friendly bright colors)
const COLORS = {
    I: '#00D4FF', // Cyan
    O: '#FFE135', // Yellow
    T: '#AA66CC', // Purple
    S: '#66BB6A', // Green
    Z: '#FF6B6B', // Red/Coral
    J: '#5C6BC0', // Blue
    L: '#FF9800'  // Orange
};

// Tetromino shapes
const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
};

// Game State
let board = [];
let currentPiece = null;
let currentPosition = { row: 0, col: 0 };
let nextPiece = null;
let score = 0;
let rowsCleared = 0;
let rowsSinceLastQuestion = 0;
let level = 1;
let isGameOver = false;
let isPaused = false;
let showQuestion = false;
let attemptsRemaining = 3;
let currentQuestion = null;
let gameLoop = null;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextPieceCanvas');
const nextCtx = nextCanvas.getContext('2d');

// DOM Elements
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const rowsDisplay = document.getElementById('rowsDisplay');
const attemptsDisplay = document.getElementById('attemptsDisplay');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScore = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const questionModal = document.getElementById('questionModal');
const questionText = document.getElementById('questionText');
const numeratorInput = document.getElementById('numeratorInput');
const denominatorInput = document.getElementById('denominatorInput');
const attemptsText = document.getElementById('attemptsText');
const submitAnswer = document.getElementById('submitAnswer');

// Touch controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const downBtn = document.getElementById('downBtn');
const rotateBtn = document.getElementById('rotateBtn');
const dropBtn = document.getElementById('dropBtn');
const pauseBtn = document.getElementById('pauseBtn');

// Sound elements
const soundToggle = document.getElementById('soundToggle');
const soundOn = document.getElementById('soundOn');
const soundOff = document.getElementById('soundOff');

// Music system using Web Audio API
class GameMusic {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.currentNote = 0;
        this.tempo = 140; // BPM
        this.nextNoteTime = 0;
        this.scheduleAheadTime = 0.1;
        this.timerID = null;
        this.masterGain = null;

        // Melody notes (frequencies in Hz) - A catchy retro game tune
        // Using a pentatonic scale for a pleasant sound
        this.melody = [
            // Bar 1
            { note: 659, duration: 0.5 },  // E5
            { note: 494, duration: 0.25 }, // B4
            { note: 523, duration: 0.25 }, // C5
            { note: 587, duration: 0.5 },  // D5
            { note: 523, duration: 0.25 }, // C5
            { note: 494, duration: 0.25 }, // B4
            // Bar 2
            { note: 440, duration: 0.5 },  // A4
            { note: 440, duration: 0.25 }, // A4
            { note: 523, duration: 0.25 }, // C5
            { note: 659, duration: 0.5 },  // E5
            { note: 587, duration: 0.25 }, // D5
            { note: 523, duration: 0.25 }, // C5
            // Bar 3
            { note: 494, duration: 0.75 }, // B4
            { note: 523, duration: 0.25 }, // C5
            { note: 587, duration: 0.5 },  // D5
            { note: 659, duration: 0.5 },  // E5
            // Bar 4
            { note: 523, duration: 0.5 },  // C5
            { note: 440, duration: 0.5 },  // A4
            { note: 440, duration: 0.5 },  // A4
            { note: 0, duration: 0.5 },    // Rest
            // Bar 5
            { note: 587, duration: 0.75 }, // D5
            { note: 698, duration: 0.25 }, // F5
            { note: 880, duration: 0.5 },  // A5
            { note: 784, duration: 0.25 }, // G5
            { note: 698, duration: 0.25 }, // F5
            // Bar 6
            { note: 659, duration: 0.75 }, // E5
            { note: 523, duration: 0.25 }, // C5
            { note: 659, duration: 0.5 },  // E5
            { note: 587, duration: 0.25 }, // D5
            { note: 523, duration: 0.25 }, // C5
            // Bar 7
            { note: 494, duration: 0.5 },  // B4
            { note: 494, duration: 0.25 }, // B4
            { note: 523, duration: 0.25 }, // C5
            { note: 587, duration: 0.5 },  // D5
            { note: 659, duration: 0.5 },  // E5
            // Bar 8
            { note: 523, duration: 0.5 },  // C5
            { note: 440, duration: 0.5 },  // A4
            { note: 440, duration: 0.5 },  // A4
            { note: 0, duration: 0.5 },    // Rest
        ];

        // Bass line
        this.bassLine = [
            { note: 165, duration: 1 },    // E3
            { note: 165, duration: 1 },    // E3
            { note: 110, duration: 1 },    // A2
            { note: 110, duration: 1 },    // A2
            { note: 147, duration: 1 },    // D3
            { note: 147, duration: 1 },    // D3
            { note: 165, duration: 1 },    // E3
            { note: 165, duration: 1 },    // E3
            { note: 147, duration: 1 },    // D3
            { note: 147, duration: 1 },    // D3
            { note: 131, duration: 1 },    // C3
            { note: 131, duration: 1 },    // C3
            { note: 123, duration: 1 },    // B2
            { note: 165, duration: 1 },    // E3
            { note: 110, duration: 1 },    // A2
            { note: 110, duration: 1 },    // A2
        ];
    }

    init() {
        if (this.audioContext) {
            // If already created, just try to resume if suspended
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

            // Try to resume immediately (needed for some mobile browsers)
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
            // Play melody
            const melodyNote = this.melody[this.currentNote % this.melody.length];
            const noteDuration = melodyNote.duration * secondsPerBeat;
            this.playNote(melodyNote.note, this.nextNoteTime, noteDuration, 'square', 0.2);

            // Play bass (every beat)
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

// Tetromino class
class Tetromino {
    constructor(type) {
        this.type = type;
        this.shape = SHAPES[type].map(row => [...row]);
        this.color = COLORS[type];
    }

    rotateClockwise() {
        const rows = this.shape.length;
        const cols = this.shape[0].length;
        const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                rotated[c][rows - 1 - r] = this.shape[r][c];
            }
        }

        const newPiece = new Tetromino(this.type);
        newPiece.shape = rotated;
        return newPiece;
    }

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

    static random() {
        const types = Object.keys(SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        return new Tetromino(type);
    }
}

// Fraction class
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

// Question Generator
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

// Game Functions
function initBoard() {
    board = Array(BOARD_HEIGHT).fill(null).map(() =>
        Array(BOARD_WIDTH).fill(null).map(() => ({ filled: false, color: null }))
    );
}

function canPlace(piece, position) {
    const cells = piece.getCells();
    for (const cell of cells) {
        const newRow = position.row + cell.row;
        const newCol = position.col + cell.col;

        if (newRow < 0 || newRow >= BOARD_HEIGHT) return false;
        if (newCol < 0 || newCol >= BOARD_WIDTH) return false;
        if (board[newRow][newCol].filled) return false;
    }
    return true;
}

function lockPiece() {
    const cells = currentPiece.getCells();
    for (const cell of cells) {
        const row = currentPosition.row + cell.row;
        const col = currentPosition.col + cell.col;
        if (row >= 0 && row < BOARD_HEIGHT && col >= 0 && col < BOARD_WIDTH) {
            board[row][col] = { filled: true, color: currentPiece.color };
        }
    }

    const cleared = clearRows();
    rowsCleared += cleared;
    rowsSinceLastQuestion += cleared;
    score += calculateScore(cleared, level);
    level = 1 + Math.floor(rowsCleared / 10);

    const shouldShowQuestion = rowsSinceLastQuestion >= ROWS_FOR_QUESTION;
    if (shouldShowQuestion) {
        rowsSinceLastQuestion = 0;
        showQuestionModal();
    }

    spawnNewPiece();
    updateDisplay();
}

function clearRows() {
    let cleared = 0;
    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
        if (board[row].every(cell => cell.filled)) {
            board.splice(row, 1);
            board.unshift(Array(BOARD_WIDTH).fill(null).map(() => ({ filled: false, color: null })));
            cleared++;
            row++;
        }
    }
    return cleared;
}

function calculateScore(rowsCleared, level) {
    const baseScore = [0, 100, 300, 500, 800][rowsCleared] || 0;
    return baseScore * level;
}

function spawnNewPiece() {
    currentPiece = nextPiece;
    nextPiece = Tetromino.random();
    currentPosition = { row: 0, col: Math.floor(BOARD_WIDTH / 2) - 1 };

    if (!canPlace(currentPiece, currentPosition)) {
        gameOver();
    }

    drawNextPiece();
}

function moveLeft() {
    if (isPaused || isGameOver || showQuestion) return;
    const newPosition = { row: currentPosition.row, col: currentPosition.col - 1 };
    if (canPlace(currentPiece, newPosition)) {
        currentPosition = newPosition;
        draw();
    }
}

function moveRight() {
    if (isPaused || isGameOver || showQuestion) return;
    const newPosition = { row: currentPosition.row, col: currentPosition.col + 1 };
    if (canPlace(currentPiece, newPosition)) {
        currentPosition = newPosition;
        draw();
    }
}

function moveDown() {
    if (isPaused || isGameOver || showQuestion) return;
    const newPosition = { row: currentPosition.row + 1, col: currentPosition.col };
    if (canPlace(currentPiece, newPosition)) {
        currentPosition = newPosition;
        draw();
    } else {
        lockPiece();
    }
}

function hardDrop() {
    if (isPaused || isGameOver || showQuestion) return;
    while (canPlace(currentPiece, { row: currentPosition.row + 1, col: currentPosition.col })) {
        currentPosition.row++;
    }
    lockPiece();
    draw();
}

function rotate() {
    if (isPaused || isGameOver || showQuestion) return;
    const rotated = currentPiece.rotateClockwise();

    if (canPlace(rotated, currentPosition)) {
        currentPiece = rotated;
        draw();
        return;
    }

    // Wall kicks
    for (const offset of [-1, 1, -2, 2]) {
        const kickPosition = { row: currentPosition.row, col: currentPosition.col + offset };
        if (canPlace(rotated, kickPosition)) {
            currentPiece = rotated;
            currentPosition = kickPosition;
            draw();
            return;
        }
    }
}

function togglePause() {
    if (isGameOver || showQuestion) return;
    isPaused = !isPaused;
    pauseOverlay.classList.toggle('hidden', !isPaused);

    if (isPaused) {
        gameMusic.pause();
    } else {
        gameMusic.resume();
    }
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    finalScore.textContent = score;
    gameOverOverlay.classList.remove('hidden');
    gameMusic.pause();
}

function showQuestionModal() {
    showQuestion = true;
    isPaused = true;
    currentQuestion = questionGenerator.generateQuestion(level);
    questionText.textContent = currentQuestion.getQuestionText();
    attemptsText.textContent = `Attempts remaining: ${attemptsRemaining}`;
    numeratorInput.value = '';
    denominatorInput.value = '';
    questionModal.classList.remove('hidden');
    numeratorInput.focus();
    gameMusic.pause();
}

function hideQuestionModal() {
    showQuestion = false;
    isPaused = false;
    currentQuestion = null;
    questionModal.classList.add('hidden');
    gameMusic.resume();
}

function submitAnswerHandler() {
    const num = parseInt(numeratorInput.value);
    const den = parseInt(denominatorInput.value);

    if (isNaN(num) || isNaN(den) || den === 0) {
        attemptsText.textContent = 'Please enter valid numbers (denominator cannot be 0)';
        return;
    }

    if (currentQuestion.checkAnswer(num, den)) {
        // Correct answer
        attemptsRemaining = 3;
        hideQuestionModal();
    } else {
        // Wrong answer
        attemptsRemaining--;
        if (attemptsRemaining <= 0) {
            hideQuestionModal();
            restartGame();
        } else {
            attemptsText.textContent = `Wrong! Attempts remaining: ${attemptsRemaining}`;
            numeratorInput.value = '';
            denominatorInput.value = '';
            numeratorInput.focus();
        }
    }
    updateDisplay();
}

function restartGame() {
    initBoard();
    currentPiece = Tetromino.random();
    nextPiece = Tetromino.random();
    currentPosition = { row: 0, col: Math.floor(BOARD_WIDTH / 2) - 1 };
    score = 0;
    rowsCleared = 0;
    rowsSinceLastQuestion = 0;
    level = 1;
    isGameOver = false;
    isPaused = false;
    showQuestion = false;
    attemptsRemaining = 3;
    currentQuestion = null;

    gameOverOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    questionModal.classList.add('hidden');

    updateDisplay();
    drawNextPiece();
    gameMusic.resume();
    startGameLoop();
}

function updateDisplay() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    rowsDisplay.textContent = rowsCleared;
    attemptsDisplay.textContent = attemptsRemaining;
}

function draw() {
    // Clear canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_WIDTH; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= BOARD_HEIGHT; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw board
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            if (board[row][col].filled) {
                drawCell(ctx, col, row, board[row][col].color);
            }
        }
    }

    // Draw current piece
    if (currentPiece && !isGameOver) {
        const cells = currentPiece.getCells();
        for (const cell of cells) {
            const row = currentPosition.row + cell.row;
            const col = currentPosition.col + cell.col;
            if (row >= 0) {
                drawCell(ctx, col, row, currentPiece.color);
            }
        }

        // Draw ghost piece (outline only)
        let ghostRow = currentPosition.row;
        while (canPlace(currentPiece, { row: ghostRow + 1, col: currentPosition.col })) {
            ghostRow++;
        }
        if (ghostRow !== currentPosition.row) {
            for (const cell of cells) {
                const row = ghostRow + cell.row;
                const col = currentPosition.col + cell.col;
                if (row >= 0) {
                    drawGhostCell(ctx, col, row, currentPiece.color);
                }
            }
        }
    }
}

function drawCell(context, col, row, color) {
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    const padding = 2;

    // Main cell
    context.fillStyle = color;
    context.fillRect(x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2);

    // Highlight
    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.fillRect(x + padding, y + padding, CELL_SIZE - padding * 2, 4);
    context.fillRect(x + padding, y + padding, 4, CELL_SIZE - padding * 2);

    // Shadow
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(x + CELL_SIZE - padding - 4, y + padding, 4, CELL_SIZE - padding * 2);
    context.fillRect(x + padding, y + CELL_SIZE - padding - 4, CELL_SIZE - padding * 2, 4);
}

function drawGhostCell(context, col, row, color) {
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    const padding = 2;

    // Draw outline only
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.globalAlpha = 0.4;
    context.strokeRect(x + padding + 1, y + padding + 1, CELL_SIZE - padding * 2 - 2, CELL_SIZE - padding * 2 - 2);
    context.globalAlpha = 1;
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.fillStyle = '#1a1a2e';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece) return;

    const cells = nextPiece.getCells();
    const minCol = Math.min(...cells.map(c => c.col));
    const maxCol = Math.max(...cells.map(c => c.col));
    const minRow = Math.min(...cells.map(c => c.row));
    const maxRow = Math.max(...cells.map(c => c.row));

    const pieceWidth = (maxCol - minCol + 1) * 25;
    const pieceHeight = (maxRow - minRow + 1) * 25;
    const offsetX = (nextCanvas.width - pieceWidth) / 2 - minCol * 25;
    const offsetY = (nextCanvas.height - pieceHeight) / 2 - minRow * 25;

    for (const cell of cells) {
        const x = offsetX + cell.col * 25;
        const y = offsetY + cell.row * 25;

        nextCtx.fillStyle = nextPiece.color;
        nextCtx.fillRect(x + 2, y + 2, 21, 21);

        nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        nextCtx.fillRect(x + 2, y + 2, 21, 3);
        nextCtx.fillRect(x + 2, y + 2, 3, 21);
    }
}

function startGameLoop() {
    clearInterval(gameLoop);
    const tick = () => {
        if (!isPaused && !isGameOver && !showQuestion) {
            moveDown();
        }
    };

    const getDelay = () => {
        const baseDelay = 800;
        const minDelay = 200;
        const speedReduction = (level - 1) * 50;
        return Math.max(minDelay, baseDelay - speedReduction);
    };

    const loop = () => {
        tick();
        draw();
        gameLoop = setTimeout(loop, getDelay());
    };

    gameLoop = setTimeout(loop, getDelay());
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveRight();
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveDown();
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotate();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }
});

restartButton.addEventListener('click', restartGame);
submitAnswer.addEventListener('click', submitAnswerHandler);

// Sound toggle
soundToggle.addEventListener('click', () => {
    // Initialize audio context on first click (required for mobile)
    gameMusic.init();
    const isMuted = gameMusic.toggle();
    soundToggle.setAttribute('data-muted', isMuted);
    soundOn.classList.toggle('hidden', isMuted);
    soundOff.classList.toggle('hidden', !isMuted);
});

// Start music on first user interaction (required by browsers, especially mobile)
let musicInitialized = false;

function startMusicOnInteraction(e) {
    if (musicInitialized) return;

    // Must initialize AudioContext inside a user gesture for mobile
    gameMusic.init();

    // Resume audio context if suspended (common on mobile)
    if (gameMusic.audioContext && gameMusic.audioContext.state === 'suspended') {
        gameMusic.audioContext.resume().then(() => {
            if (!gameMusic.isMuted) {
                gameMusic.start();
            }
        });
    } else {
        gameMusic.start();
    }

    musicInitialized = true;

    // Remove all listeners
    document.removeEventListener('click', startMusicOnInteraction);
    document.removeEventListener('keydown', startMusicOnInteraction);
    document.removeEventListener('touchstart', startMusicOnInteraction);
    document.removeEventListener('touchend', startMusicOnInteraction);
}

// Use multiple events to catch first interaction on any device
document.addEventListener('click', startMusicOnInteraction);
document.addEventListener('keydown', startMusicOnInteraction);
document.addEventListener('touchstart', startMusicOnInteraction);
document.addEventListener('touchend', startMusicOnInteraction);

// Allow Enter key to submit answer
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
        submitAnswerHandler();
    }
});

// Touch controls with improved handling
function setupTouchButton(button, action) {
    let intervalId = null;

    const startAction = (e) => {
        e.preventDefault();
        // Start music on first touch interaction
        startMusicOnInteraction();
        action();
        // For continuous actions (left, right, down), repeat while held
        if (action === moveLeft || action === moveRight || action === moveDown) {
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
        // Only handle click if not a touch event
        if (!e.sourceCapabilities || !e.sourceCapabilities.firesTouchEvents) {
            startMusicOnInteraction();
            action();
        }
    });
}

setupTouchButton(leftBtn, moveLeft);
setupTouchButton(rightBtn, moveRight);
setupTouchButton(downBtn, moveDown);
setupTouchButton(rotateBtn, rotate);
setupTouchButton(dropBtn, hardDrop);
setupTouchButton(pauseBtn, togglePause);

// Initialize game
initBoard();
currentPiece = Tetromino.random();
nextPiece = Tetromino.random();
currentPosition = { row: 0, col: Math.floor(BOARD_WIDTH / 2) - 1 };
updateDisplay();
drawNextPiece();
draw();
startGameLoop();
