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
const challengeNow = document.getElementById('challengeNow');
const teamCountInput = document.getElementById('teamCountInput');
const turnTimeInput = document.getElementById('turnTimeInput');
const referenceRateInput = document.getElementById('referenceRateInput');
const referenceRateHint = document.getElementById('referenceRateHint');

function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
}

function clampDecimal(value, min, max, fallback) {
    if (String(value).trim() === '') return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.round(Math.min(max, Math.max(min, parsed)) * 10) / 10;
}

function formatReferenceCount(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

function updateReferenceRateHint(turnSeconds, referenceRate) {
    const referenceCorrect = referenceRate * turnSeconds / 60;
    referenceRateHint.textContent = `Con ${turnSeconds} s: ${formatReferenceCount(referenceCorrect)} aciertos propios equivalen a 9,5.`;
}

function getTeamConfig() {
    const config = {
        teamCount: clampNumber(teamCountInput.value, 2, 8, 4),
        turnSeconds: clampNumber(turnTimeInput.value, 30, 600, 120),
        referenceRate: clampDecimal(referenceRateInput.value, 0.1, 10, 3)
    };
    teamCountInput.value = config.teamCount;
    turnTimeInput.value = config.turnSeconds;
    referenceRateInput.value = config.referenceRate;
    updateReferenceRateHint(config.turnSeconds, config.referenceRate);
    try {
        localStorage.setItem('fyqTetrisTeamConfig', JSON.stringify(config));
    } catch (error) {
        // La configuración seguirá funcionando aunque el navegador bloquee el almacenamiento.
    }
    return config;
}

try {
    const savedConfig = JSON.parse(localStorage.getItem('fyqTetrisTeamConfig'));
    if (savedConfig) {
        teamCountInput.value = clampNumber(savedConfig.teamCount, 2, 8, 4);
        turnTimeInput.value = clampNumber(savedConfig.turnSeconds, 30, 600, 120);
        referenceRateInput.value = clampDecimal(savedConfig.referenceRate, 0.1, 10, 3);
    }
} catch (error) {
    // Se mantienen los valores iniciales del formulario.
}

teamCountInput.addEventListener('change', getTeamConfig);
turnTimeInput.addEventListener('change', getTeamConfig);
referenceRateInput.addEventListener('change', getTeamConfig);
getTeamConfig();

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

        // Tetris melody
        this.tetrisMelody = [
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
        const melody = this.tetrisMelody;

        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            const melodyNote = melody[this.currentNote % melody.length];
            const noteDuration = melodyNote.duration * secondsPerBeat;
            this.playNote(melodyNote.note, this.nextNoteTime, noteDuration, 'square', 0.2);

            // Play bass for Tetris
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

    playWakka() {
        if (!this.audioContext || this.isMuted) return;

        const now = this.audioContext.currentTime;

        // Create the classic "wakka" sound - a short beep
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'square';  // Square wave for classic sound
        oscillator.frequency.setValueAtTime(200, now);  // Low frequency

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + 0.06);
    }

    playFeedback(isCorrect) {
        if (this.isMuted) return;
        this.init();
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const notes = isCorrect ? [523, 659, 784] : [330, 247];
        notes.forEach((note, index) => {
            this.playNote(note, now + index * 0.1, 0.18, isCorrect ? 'sine' : 'sawtooth', 0.22);
        });
    }

    start() {
        // Don't start music for Pac-Man
        if (currentGame === 'pacman') return;

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

function initAudioContext() {
    gameMusic.init();
    if (gameMusic.audioContext && gameMusic.audioContext.state === 'suspended') {
        gameMusic.audioContext.resume();
    }
}

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
// SHARED PHYSICS & CHEMISTRY QUESTION SYSTEM
// ============================================================================

const questionModal = document.getElementById('questionModal');
const questionText = document.getElementById('questionText');
const questionKind = document.getElementById('questionKind');
const questionLevel = document.getElementById('questionLevel');
const answerChoices = document.getElementById('answerChoices');
const feedbackPanel = document.getElementById('feedbackPanel');
const feedbackTitle = document.getElementById('feedbackTitle');
const reboundInfo = document.getElementById('reboundInfo');
const solutionDetails = document.getElementById('solutionDetails');
const correctAnswerText = document.getElementById('correctAnswerText');
const explanationText = document.getElementById('explanationText');
const ruleText = document.getElementById('ruleText');
const continueChallenge = document.getElementById('continueChallenge');

const activeBank = QUESTION_BANKS.formulacion_binaria;
let activeChallengeGame = null;
let challengeResolved = false;
let challengePhase = 'answering';

class CurriculumQuestionGenerator {
    constructor(bank) {
        this.bank = bank;
        this.seen = new Set();
    }

    generateQuestion(answeredCount) {
        const curriculumLevel = Math.min(4, 1 + Math.floor(answeredCount / 3));
        let available = this.bank.questions.filter(question =>
            question.level <= curriculumLevel && !this.seen.has(question.id)
        );

        if (available.length === 0) {
            this.seen.clear();
            available = this.bank.questions.filter(question => question.level <= curriculumLevel);
        }

        const source = available[Math.floor(Math.random() * available.length)];
        this.seen.add(source.id);

        const options = this.shuffle([...source.options]);
        return {
            ...source,
            options,
            correctIndex: options.indexOf(source.correct)
        };
    }

    reset() {
        this.seen.clear();
    }

    shuffle(items) {
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }
}

const questionGenerator = new CurriculumQuestionGenerator(activeBank);

function openChemistryChallenge(game) {
    activeChallengeGame = game;
    challengeResolved = false;
    challengePhase = 'answering';
    game.showQuestion = true;
    game.isPaused = true;
    game.currentQuestion = questionGenerator.generateQuestion(game.chemistryAnswered);

    questionKind.textContent = game.currentQuestion.kind;
    questionLevel.textContent = `Nivel ${game.currentQuestion.level}`;
    questionText.textContent = game.currentQuestion.prompt;
    feedbackPanel.classList.add('hidden');
    feedbackPanel.classList.remove('is-wrong');
    reboundInfo.classList.add('hidden');
    solutionDetails.classList.remove('hidden');
    continueChallenge.classList.add('hidden');
    continueChallenge.textContent = 'Continuar partida';
    answerChoices.replaceChildren();

    game.currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'answer-choice';
        button.dataset.index = index;

        const letter = document.createElement('span');
        letter.className = 'answer-letter';
        letter.textContent = String.fromCharCode(65 + index);

        const answer = document.createElement('span');
        answer.textContent = option;
        button.append(letter, answer);
        button.addEventListener('click', () => resolveChemistryChallenge(index));
        answerChoices.appendChild(button);
    });

    questionModal.classList.remove('hidden');
    document.body.classList.toggle('team-challenge-open', typeof game.openReboundRound === 'function');
    challengeNow.disabled = true;
    answerChoices.querySelector('button')?.focus();
    gameMusic.pause();
}

function resolveChemistryChallenge(selectedIndex) {
    if (!activeChallengeGame || challengePhase !== 'answering') return;

    challengeResolved = true;
    const game = activeChallengeGame;
    const question = game.currentQuestion;
    const isCorrect = selectedIndex === question.correctIndex;
    game.chemistryAnswered++;
    if (isCorrect) game.chemistryCorrect++;
    game.pendingChemistryReward = isCorrect && typeof game.applyChemistryReward === 'function';

    [...answerChoices.children].forEach((button, index) => {
        button.disabled = true;
        if (index === selectedIndex && !isCorrect) button.classList.add('wrong');
    });

    game.updateDisplay();

    if (isCorrect) {
        if (typeof game.awardActiveTeamPoint === 'function') game.awardActiveTeamPoint();
        const teamLabel = typeof game.getActiveTeamLabel === 'function' ? game.getActiveTeamLabel() : null;
        revealChemistrySolution({
            isCorrect: true,
            title: teamLabel ? `¡Correcto! Un punto para el equipo ${teamLabel}.` : '¡Correcto!'
        });
        return;
    }

    gameMusic.playFeedback(false);
    if (typeof game.openReboundRound === 'function') {
        challengePhase = 'rebound';
        const order = game.openReboundRound((winnerLabel) => {
            revealChemistrySolution({
                isCorrect: true,
                title: `¡Rebote para el equipo ${winnerLabel}!`
            });
        });
        feedbackTitle.textContent = 'Respuesta incorrecta: se abre el turno de rebotes.';
        reboundInfo.textContent = `Orden de respuesta: ${order.join(' → ')}. Pulsa +1 junto al primer equipo que acierte.`;
        feedbackPanel.classList.add('is-wrong');
        feedbackPanel.classList.remove('hidden');
        reboundInfo.classList.remove('hidden');
        solutionDetails.classList.add('hidden');
        continueChallenge.textContent = 'Nadie acierta: mostrar solución';
        continueChallenge.classList.remove('hidden');
        return;
    }

    revealChemistrySolution({
        isCorrect: false,
        title: 'No exactamente. Comprueba la regla:'
    });
}

function revealChemistrySolution({ isCorrect, title }) {
    if (!activeChallengeGame) return;

    challengePhase = 'solution';
    const game = activeChallengeGame;
    const question = game.currentQuestion;
    [...answerChoices.children].forEach((button, index) => {
        if (index === question.correctIndex) button.classList.add('correct');
    });

    if (typeof game.closeReboundRound === 'function') game.closeReboundRound();
    feedbackTitle.textContent = title;
    correctAnswerText.textContent = question.correct;
    explanationText.textContent = question.solution;
    ruleText.textContent = question.rule;
    feedbackPanel.classList.toggle('is-wrong', !isCorrect);
    feedbackPanel.classList.remove('hidden');
    reboundInfo.classList.add('hidden');
    solutionDetails.classList.remove('hidden');
    continueChallenge.textContent = 'Continuar partida';
    continueChallenge.classList.remove('hidden');
    if (isCorrect) gameMusic.playFeedback(true);
    continueChallenge.focus();
}

function finishChallengePause(game) {
    const remainsPaused = Boolean(game.isClockManuallyPaused);
    game.isPaused = remainsPaused;
    if (game.pauseOverlay) game.pauseOverlay.classList.toggle('hidden', !remainsPaused);
    if (game.pauseBtn) game.pauseBtn.textContent = remainsPaused ? 'Reanudar juego' : 'Pausa';
    challengeNow.disabled = remainsPaused;
    if (remainsPaused) {
        gameMusic.pause();
    } else {
        gameMusic.resume();
    }
}

function cancelChemistryChallengeForTurnEnd(game) {
    if (activeChallengeGame !== game) return;

    game.showQuestion = false;
    game.currentQuestion = null;
    game.pendingChemistryReward = false;
    questionModal.classList.add('hidden');
    document.body.classList.remove('team-challenge-open');
    activeChallengeGame = null;
    challengeResolved = false;
    challengePhase = 'answering';
}

function closeChemistryChallenge() {
    if (!activeChallengeGame || challengePhase !== 'solution') return;

    const game = activeChallengeGame;
    game.showQuestion = false;
    game.currentQuestion = null;
    questionModal.classList.add('hidden');
    document.body.classList.remove('team-challenge-open');
    activeChallengeGame = null;
    challengeResolved = false;
    challengePhase = 'answering';

    if (game.pendingChemistryReward && typeof game.applyChemistryReward === 'function') {
        challengeNow.disabled = true;
        game.applyChemistryReward(() => {
            finishChallengePause(game);
        });
    } else {
        finishChallengePause(game);
    }
}

function handleChallengeContinue() {
    if (challengePhase === 'rebound') {
        revealChemistrySolution({
            isCorrect: false,
            title: 'Nadie acierta. Comprueba la regla:'
        });
        return;
    }
    closeChemistryChallenge();
}

continueChallenge.addEventListener('click', handleChallengeContinue);

document.addEventListener('keydown', (event) => {
    if (questionModal.classList.contains('hidden')) return;

    if (challengeResolved && event.key === 'Enter') {
        event.preventDefault();
        handleChallengeContinue();
        return;
    }

    const key = event.key.toUpperCase();
    const answerIndex = ['1', '2', '3', '4'].indexOf(event.key) >= 0
        ? Number(event.key) - 1
        : ['A', 'B', 'C', 'D'].indexOf(key);

    if (challengePhase === 'answering' && answerIndex >= 0) {
        event.preventDefault();
        resolveChemistryChallenge(answerIndex);
    }
});

// ============================================================================
// TETRIS GAME
// ============================================================================

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;
const ROWS_FOR_QUESTION = 2;
const LINE_CLEAR_OBSERVE_MS = 1100;
const REWARD_FLASH_MS = 420;
const REWARD_TOTAL_MS = 1650;
const TEAM_TURN_TRANSITION_MS = 1700;

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
        this.chemistryCorrect = 0;
        this.chemistryAnswered = 0;
        this.currentQuestion = null;
        this.gameLoop = null;
        this.questionDelayTimer = null;
        this.rewardFlashTimer = null;
        this.rewardEndTimer = null;
        this.isQuestionTransition = false;
        this.isRewardTransition = false;
        this.pendingChemistryReward = false;
        this.bonusFlashActive = false;
        this.teams = [];
        this.activeTeamIndex = 0;
        this.turnDurationMs = 120000;
        this.referenceRatePerMinute = 3;
        this.turnRemainingMs = this.turnDurationMs;
        this.turnClockInterval = null;
        this.lastTurnClockTick = null;
        this.turnTransitionTimer = null;
        this.isTurnTransition = false;
        this.reboundOpen = false;
        this.reboundAwardCallback = null;
        this.isClockManuallyPaused = false;

        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPieceCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        // DOM elements
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.rowsDisplay = document.getElementById('rowsDisplay');
        this.chemistryScoreDisplay = document.getElementById('chemistryScoreDisplay');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.finalScore = document.getElementById('finalScore');
        this.finalChemistryScore = document.getElementById('finalChemistryScore');
        this.restartButton = document.getElementById('restartButton');
        this.rewardToast = document.getElementById('rewardToast');
        this.rewardToastText = document.getElementById('rewardToastText');
        this.activeTeamLabel = document.getElementById('activeTeamLabel');
        this.turnTimer = document.getElementById('turnTimer');
        this.turnClockToggle = document.getElementById('turnClockToggle');
        this.teamScoreboard = document.getElementById('teamScoreboard');
        this.reboundBanner = document.getElementById('reboundBanner');
        this.turnOverlay = document.getElementById('turnOverlay');
        this.turnEndReason = document.getElementById('turnEndReason');
        this.turnEndTitle = document.getElementById('turnEndTitle');
        this.nextTeamText = document.getElementById('nextTeamText');

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
        this.turnClockToggle.addEventListener('click', () => this.toggleTurnClock());

        // Canvas touch/click controls
        this.setupCanvasControls();
    }

    setupCanvasControls() {
        const handleCanvasInput = (e) => {
            if (currentGame !== 'tetris' || this.isPaused || this.isGameOver || this.showQuestion) return;

            e.preventDefault();
            startMusicOnInteraction();

            const rect = this.canvas.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

            // Get current piece position in pixels
            const pieceX = (this.currentPosition.col + 2) * CELL_SIZE; // Approximate center
            const pieceY = (this.currentPosition.row + 1) * CELL_SIZE;

            // Determine direction based on touch/click position relative to piece
            const dx = x - pieceX;
            const dy = y - pieceY;

            // Use absolute values to determine primary direction
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal movement
                if (dx < 0) {
                    this.moveLeft();
                } else {
                    this.moveRight();
                }
            } else {
                // Vertical movement
                if (dy < 0) {
                    this.rotate(); // Tap above to rotate
                } else {
                    this.moveDown(); // Tap below to move down
                }
            }
        };

        this.canvas.addEventListener('click', handleCanvasInput);
        this.canvas.addEventListener('touchstart', handleCanvasInput);
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

    getActiveTeamLabel() {
        return this.teams[this.activeTeamIndex]?.label || 'A';
    }

    awardActiveTeamPoint() {
        const team = this.teams[this.activeTeamIndex];
        if (!team) return;
        team.score++;
        team.directCorrect++;
        this.renderTeamHud();
    }

    calculateTeamGrade(team) {
        const referenceCorrect = this.referenceRatePerMinute
            * (this.turnDurationMs / 60000)
            * team.turnsStarted;
        const directBase = referenceCorrect > 0 && team.directCorrect > 0
            ? 10 * (1 - Math.pow(20, -team.directCorrect / referenceCorrect))
            : 0;
        const reboundBonus = Math.min(2, 0.5 * team.reboundCorrect);
        return Math.min(10, directBase + reboundBonus);
    }

    formatTeamGrade(team) {
        return this.calculateTeamGrade(team).toFixed(1).replace('.', ',');
    }

    getReboundOrderIndices() {
        return this.teams.slice(1).map((_, offset) =>
            (this.activeTeamIndex + offset + 1) % this.teams.length
        );
    }

    openReboundRound(onAward) {
        this.reboundOpen = true;
        this.reboundAwardCallback = onAward;
        this.isClockManuallyPaused = true;
        const order = this.getReboundOrderIndices();
        this.renderTeamHud();
        return order.map(index => this.teams[index].label);
    }

    awardReboundPoint(teamIndex) {
        const eligible = this.getReboundOrderIndices();
        if (!this.reboundOpen || !eligible.includes(teamIndex)) return;

        const winner = this.teams[teamIndex];
        winner.score++;
        winner.reboundCorrect++;
        const callback = this.reboundAwardCallback;
        this.reboundOpen = false;
        this.reboundAwardCallback = null;
        this.renderTeamHud();
        if (callback) callback(winner.label);
    }

    closeReboundRound() {
        this.reboundOpen = false;
        this.reboundAwardCallback = null;
        this.renderTeamHud();
    }

    renderTeamHud() {
        const activeLabel = this.getActiveTeamLabel();
        this.activeTeamLabel.textContent = `Equipo ${activeLabel}`;
        this.teamScoreboard.replaceChildren();

        const reboundOrder = this.reboundOpen ? this.getReboundOrderIndices() : [];
        this.teams.forEach((team, index) => {
            const card = document.createElement('div');
            card.className = 'team-score-card';
            if (index === this.activeTeamIndex) card.classList.add('is-active');
            if (reboundOrder.includes(index)) card.classList.add('is-rebound');

            const letter = document.createElement('span');
            letter.className = 'team-letter';
            letter.textContent = team.label;

            const points = document.createElement('span');
            points.className = 'team-points';
            const value = document.createElement('strong');
            value.textContent = team.score;
            const caption = document.createElement('small');
            caption.textContent = `Propios ${team.directCorrect} · Rebotes ${team.reboundCorrect}`;
            const grade = document.createElement('span');
            grade.className = 'team-grade';
            grade.textContent = `Nota prov. ${this.formatTeamGrade(team)}`;
            points.append(value, caption, grade);
            card.title = `Equipo ${team.label}: ${team.score} aciertos; nota provisional ${this.formatTeamGrade(team)}`;

            const awardButton = document.createElement('button');
            awardButton.type = 'button';
            awardButton.className = 'award-point-btn';
            awardButton.textContent = '+1';
            awardButton.title = `Dar el punto de rebote al equipo ${team.label}`;
            awardButton.disabled = !this.reboundOpen || index === this.activeTeamIndex;
            awardButton.addEventListener('click', () => this.awardReboundPoint(index));

            card.append(letter, points, awardButton);
            this.teamScoreboard.appendChild(card);
        });

        if (this.reboundOpen) {
            const orderText = reboundOrder.map(index => this.teams[index].label).join(' → ');
            this.reboundBanner.textContent = `REBOTES · Orden: ${orderText}`;
            this.reboundBanner.classList.remove('hidden');
        } else {
            this.reboundBanner.classList.add('hidden');
        }
        this.renderTurnTimer();
    }

    renderTurnTimer() {
        const totalSeconds = Math.max(0, Math.ceil(this.turnRemainingMs / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        this.turnTimer.textContent = `${String(minutes).padStart(2, '0')}:${seconds}`;
        const isStopped = this.reboundOpen || this.isClockManuallyPaused;
        this.turnTimer.classList.toggle('is-paused', isStopped);
        this.turnTimer.classList.toggle('is-warning', !isStopped && totalSeconds <= 10 && totalSeconds > 0);
        this.turnClockToggle.disabled = this.isTurnTransition || this.reboundOpen;
        this.turnClockToggle.setAttribute('aria-pressed', String(isStopped));
        this.turnClockToggle.textContent = this.reboundOpen
            ? 'Detenido: rebote'
            : this.isClockManuallyPaused
                ? 'Reanudar reloj'
                : 'Detener reloj';
    }

    isTurnClockRunning() {
        return currentGame === 'tetris'
            && !this.isGameOver
            && !this.isTurnTransition
            && !this.reboundOpen
            && !this.isClockManuallyPaused;
    }

    toggleTurnClock() {
        if (this.isGameOver || this.isTurnTransition || this.reboundOpen) return;

        this.isClockManuallyPaused = !this.isClockManuallyPaused;
        const canControlGame = !this.showQuestion && !this.isQuestionTransition && !this.isRewardTransition;
        if (canControlGame) {
            this.isPaused = this.isClockManuallyPaused;
            this.pauseOverlay.classList.toggle('hidden', !this.isPaused);
            this.pauseBtn.textContent = this.isPaused ? 'Reanudar juego' : 'Pausa';
        }

        if (this.isClockManuallyPaused) {
            gameMusic.pause();
        } else if (canControlGame) {
            gameMusic.resume();
        }
        this.renderTurnTimer();
    }

    startTurnClock() {
        clearInterval(this.turnClockInterval);
        this.lastTurnClockTick = performance.now();
        this.turnClockInterval = setInterval(() => {
            const now = performance.now();
            const elapsed = now - this.lastTurnClockTick;
            this.lastTurnClockTick = now;
            if (!this.isTurnClockRunning()) return;

            this.turnRemainingMs = Math.max(0, this.turnRemainingMs - elapsed);
            this.renderTurnTimer();
            if (this.turnRemainingMs <= 0) this.endTeamTurn('time');
        }, 100);
    }

    endTeamTurn(reason) {
        if (this.isTurnTransition) return;

        cancelChemistryChallengeForTurnEnd(this);
        this.clearTransientEffects();
        this.closeReboundRound();
        this.isTurnTransition = true;
        this.isGameOver = true;
        this.isPaused = true;
        this.renderTurnTimer();
        clearTimeout(this.gameLoop);
        const finishedLabel = this.getActiveTeamLabel();
        const nextIndex = (this.activeTeamIndex + 1) % this.teams.length;
        const nextLabel = this.teams[nextIndex].label;
        this.turnEndReason.textContent = reason === 'gameOver' ? 'GAME OVER' : 'TIEMPO AGOTADO';
        this.turnEndTitle.textContent = `Fin del turno del equipo ${finishedLabel}`;
        this.nextTeamText.textContent = `A continuación: equipo ${nextLabel}`;
        this.turnOverlay.classList.remove('hidden');
        challengeNow.disabled = true;
        gameMusic.pause();

        clearTimeout(this.turnTransitionTimer);
        this.turnTransitionTimer = setTimeout(() => {
            this.turnTransitionTimer = null;
            this.startTeamTurn(nextIndex);
        }, TEAM_TURN_TRANSITION_MS);
    }

    startTeamTurn(teamIndex) {
        clearTimeout(this.gameLoop);
        this.clearTransientEffects();
        this.activeTeamIndex = teamIndex;
        this.teams[teamIndex].turnsStarted++;
        this.turnRemainingMs = this.turnDurationMs;
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
        this.isTurnTransition = false;
        this.isClockManuallyPaused = false;
        this.chemistryCorrect = 0;
        this.chemistryAnswered = 0;
        this.currentQuestion = null;
        this.turnOverlay.classList.add('hidden');
        this.gameOverOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        this.pauseBtn.textContent = 'Pausa';
        challengeNow.disabled = false;
        this.lastTurnClockTick = performance.now();
        this.renderTeamHud();
        this.updateDisplay();
        this.drawNextPiece();
        this.draw();
        this.startGameLoop();
        gameMusic.resume();
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
        }

        this.spawnNewPiece();
        this.updateDisplay();
        this.draw();

        if (shouldShowQuestion && !this.isGameOver) {
            this.scheduleQuestionAfterLineClear();
        }
    }

    scheduleQuestionAfterLineClear() {
        clearTimeout(this.questionDelayTimer);
        this.isPaused = true;
        this.isQuestionTransition = true;
        challengeNow.disabled = true;

        this.questionDelayTimer = setTimeout(() => {
            this.questionDelayTimer = null;
            this.isQuestionTransition = false;
            if (currentGame === 'tetris' && !this.isGameOver) {
                this.showQuestionModal();
            }
        }, LINE_CLEAR_OBSERVE_MS);
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
        this.toggleTurnClock();
    }

    gameOver() {
        this.endTeamTurn('gameOver');
    }

    showQuestionModal() {
        clearTimeout(this.questionDelayTimer);
        this.questionDelayTimer = null;
        this.isQuestionTransition = false;
        openChemistryChallenge(this);
    }

    applyChemistryReward(onComplete) {
        const bonusPoints = this.calculateScore(1, this.level);
        this.pendingChemistryReward = false;
        this.isPaused = true;
        this.isRewardTransition = true;
        this.bonusFlashActive = true;
        this.rewardToastText.textContent = `Respuesta correcta: línea base eliminada · +${bonusPoints} puntos.`;
        this.rewardToast.classList.remove('hidden');
        this.draw();

        clearTimeout(this.rewardFlashTimer);
        clearTimeout(this.rewardEndTimer);

        this.rewardFlashTimer = setTimeout(() => {
            this.board.splice(BOARD_HEIGHT - 1, 1);
            this.board.unshift(Array(BOARD_WIDTH).fill(null).map(() => ({ filled: false, color: null })));
            this.rowsCleared += 1;
            this.score += bonusPoints;
            this.level = 1 + Math.floor(this.rowsCleared / 10);
            this.bonusFlashActive = false;
            this.updateDisplay();
            this.draw();
        }, REWARD_FLASH_MS);

        this.rewardEndTimer = setTimeout(() => {
            this.rewardToast.classList.add('hidden');
            this.isRewardTransition = false;
            this.rewardFlashTimer = null;
            this.rewardEndTimer = null;
            onComplete();
        }, REWARD_TOTAL_MS);
    }

    clearTransientEffects() {
        clearTimeout(this.questionDelayTimer);
        clearTimeout(this.rewardFlashTimer);
        clearTimeout(this.rewardEndTimer);
        this.questionDelayTimer = null;
        this.rewardFlashTimer = null;
        this.rewardEndTimer = null;
        this.isQuestionTransition = false;
        this.isRewardTransition = false;
        this.pendingChemistryReward = false;
        this.bonusFlashActive = false;
        this.rewardToast.classList.add('hidden');
    }

    restart() {
        this.startTeamTurn(this.activeTeamIndex);
    }

    updateDisplay() {
        this.scoreDisplay.textContent = this.score;
        this.levelDisplay.textContent = this.level;
        this.rowsDisplay.textContent = this.rowsCleared;
        this.chemistryScoreDisplay.textContent = this.formatChemistryScore(false);
    }

    formatChemistryScore(includePercent) {
        const base = `${this.chemistryCorrect}/${this.chemistryAnswered}`;
        if (!includePercent || this.chemistryAnswered === 0) return base;
        const percent = Math.round(this.chemistryCorrect / this.chemistryAnswered * 100);
        return `${base} (${percent} %)`;
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

        if (this.bonusFlashActive) {
            const baseY = (BOARD_HEIGHT - 1) * CELL_SIZE;
            this.ctx.fillStyle = 'rgba(85, 223, 128, 0.62)';
            this.ctx.fillRect(0, baseY, this.canvas.width, CELL_SIZE);
            this.ctx.strokeStyle = '#effff4';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(2, baseY + 2, this.canvas.width - 4, CELL_SIZE - 4);
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

    start(config = {}) {
        clearTimeout(this.gameLoop);
        clearTimeout(this.turnTransitionTimer);
        clearInterval(this.turnClockInterval);
        this.clearTransientEffects();
        const teamCount = Math.min(8, Math.max(2, Number(config.teamCount) || 4));
        const turnSeconds = Math.min(600, Math.max(30, Number(config.turnSeconds) || 120));
        const referenceRate = Math.min(10, Math.max(0.1, Number(config.referenceRate) || 3));
        this.teams = Array.from({ length: teamCount }, (_, index) => ({
            label: String.fromCharCode(65 + index),
            score: 0,
            directCorrect: 0,
            reboundCorrect: 0,
            turnsStarted: 0
        }));
        this.turnDurationMs = turnSeconds * 1000;
        this.referenceRatePerMinute = referenceRate;
        this.activeTeamIndex = 0;
        questionGenerator.reset();
        this.startTurnClock();
        this.startTeamTurn(0);
    }

    stop() {
        clearTimeout(this.gameLoop);
        clearTimeout(this.turnTransitionTimer);
        clearInterval(this.turnClockInterval);
        this.turnTransitionTimer = null;
        this.turnClockInterval = null;
        this.closeReboundRound();
        this.clearTransientEffects();
        this.turnOverlay.classList.add('hidden');
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

        this.pacman = { x: 14, y: 22.5, dir: 0, nextDir: 0, mouthOpen: 0 }; // 0=right,1=down,2=left,3=up
        this.ghosts = [];
        this.maze = [];
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.chemistryCorrect = 0;
        this.chemistryAnswered = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.showQuestion = false;
        this.currentQuestion = null;
        this.gameLoop = null;

        this.totalDots = 0;
        this.dotsEaten = 0;
        this.lastMathBreak = 0; // Track progress for curriculum breaks
        this.lastDotEaten = null; // Track last dot eaten to prevent duplicate sounds

        this.powerMode = false;
        this.powerModeTimer = 0;
        this.fruit = null;

        // DOM elements
        this.scoreDisplay = document.getElementById('pacmanScoreDisplay');
        this.levelDisplay = document.getElementById('pacmanLevelDisplay');
        this.livesDisplay = document.getElementById('livesDisplay');
        this.chemistryScoreDisplay = document.getElementById('pacmanChemistryScoreDisplay');
        this.pauseOverlay = document.getElementById('pacmanPauseOverlay');
        this.gameOverOverlay = document.getElementById('pacmanGameOverOverlay');
        this.finalScore = document.getElementById('pacmanFinalScore');
        this.finalChemistryScore = document.getElementById('pacmanFinalChemistryScore');
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

        // Canvas touch/click controls
        this.setupCanvasControls();
    }

    setupCanvasControls() {
        const handleCanvasInput = (e) => {
            if (currentGame !== 'pacman' || this.isPaused || this.isGameOver || this.showQuestion) return;

            e.preventDefault();
            initAudioContext();

            const rect = this.canvas.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

            // Get Pac-Man position in pixels
            const pacmanX = this.pacman.x * TILE_SIZE + TILE_SIZE / 2;
            const pacmanY = this.pacman.y * TILE_SIZE + TILE_SIZE / 2;

            // Determine direction based on touch/click position relative to Pac-Man
            const dx = x - pacmanX;
            const dy = y - pacmanY;

            // Use absolute values to determine primary direction
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal movement
                if (dx < 0) {
                    this.pacman.nextDir = 2; // Left
                } else {
                    this.pacman.nextDir = 0; // Right
                }
            } else {
                // Vertical movement
                if (dy < 0) {
                    this.pacman.nextDir = 3; // Up
                } else {
                    this.pacman.nextDir = 1; // Down
                }
            }
        };

        this.canvas.addEventListener('click', handleCanvasInput);
        this.canvas.addEventListener('touchstart', handleCanvasInput);
    }

    setupTouchButton(button, action) {
        const startAction = (e) => {
            e.preventDefault();
            initAudioContext();
            action();
        };

        button.addEventListener('touchstart', startAction);
        button.addEventListener('click', (e) => {
            if (!e.sourceCapabilities || !e.sourceCapabilities.firesTouchEvents) {
                initAudioContext();
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
                personality: i, // 0=Blinky(aggressive), 1=Pinky(ambush), 2=Inky(flank), 3=Clyde(patrol)
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

        // Handle tunnel wrap for collision check
        let wrappedCheckX = checkX;
        if (wrappedCheckX < 0) wrappedCheckX = MAZE_COLS - 1;
        if (wrappedCheckX >= MAZE_COLS) wrappedCheckX = 0;

        // Only move if not hitting a wall (use wrapped coordinates for check)
        if (checkY >= 0 && checkY < MAZE_ROWS && this.maze[checkY][wrappedCheckX] !== 0) {
            this.pacman.x = newX;
            this.pacman.y = newY;

            // Handle tunnel wrap for position
            if (this.pacman.x < 0) this.pacman.x += MAZE_COLS;
            if (this.pacman.x >= MAZE_COLS) this.pacman.x -= MAZE_COLS;
        }
        // If hitting a wall, just don't move - stay at current position

        // Check for dots - use round to get the tile we're on
        const cellX = Math.round(this.pacman.x);
        const cellY = Math.round(this.pacman.y);

        if (cellX >= 0 && cellX < MAZE_COLS && cellY >= 0 && cellY < MAZE_ROWS) {
            const dotKey = `${cellX},${cellY}`;

            if (this.maze[cellY][cellX] === 1) {
                // Only play sound if this is a new dot
                if (this.lastDotEaten !== dotKey) {
                    gameMusic.playWakka();
                    this.lastDotEaten = dotKey;
                }
                this.maze[cellY][cellX] = 3;
                this.score += 10;
                this.dotsEaten++;
                this.checkMathBreak();
            } else if (this.maze[cellY][cellX] === 2) {
                // Only play sound if this is a new power pellet
                if (this.lastDotEaten !== dotKey) {
                    gameMusic.playWakka();
                    this.lastDotEaten = dotKey;
                }
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
                this.ghosts.forEach(g => g.mode = 'chase');
            }
        }

        // Difficulty scaling: 50% at level 1, 100% at level 5+
        const difficultyFactor = Math.min(1.0, 0.5 + (this.level - 1) * 0.125);

        for (let ghost of this.ghosts) {
            // Smart AI: each ghost has unique behavior (scales with level)
            let target;
            if (ghost.mode === 'frightened') {
                // Run away from Pac-Man
                const awayX = ghost.x + (ghost.x - this.pacman.x) * 2;
                const awayY = ghost.y + (ghost.y - this.pacman.y) * 2;
                target = { x: awayX, y: awayY };
            } else if (ghost.mode === 'chase') {
                // Each ghost has unique chase behavior (simplified at lower levels)
                // At lower levels, add randomness to make ghosts less accurate
                const useAdvancedAI = Math.random() < difficultyFactor;

                if (useAdvancedAI) {
                    switch (ghost.personality) {
                        case 0: // Blinky (red) - directly chases Pac-Man
                            target = { x: this.pacman.x, y: this.pacman.y };
                            break;
                        case 1: // Pinky (pink) - ambushes 4 tiles ahead of Pac-Man
                            const dirs = [[4, 0], [0, 4], [-4, 0], [0, -4]];
                            const [pdx, pdy] = dirs[this.pacman.dir];
                            target = { x: this.pacman.x + pdx, y: this.pacman.y + pdy };
                            break;
                        case 2: // Inky (cyan) - flanks using Blinky's position
                            const blinky = this.ghosts[0];
                            const pivotX = this.pacman.x + (this.pacman.dir === 0 ? 2 : this.pacman.dir === 2 ? -2 : 0);
                            const pivotY = this.pacman.y + (this.pacman.dir === 1 ? 2 : this.pacman.dir === 3 ? -2 : 0);
                            target = { x: pivotX + (pivotX - blinky.x), y: pivotY + (pivotY - blinky.y) };
                            break;
                        case 3: // Clyde (orange) - chases when far, scatters when close
                            const distToPacman = Math.hypot(ghost.x - this.pacman.x, ghost.y - this.pacman.y);
                            if (distToPacman > 8) {
                                target = { x: this.pacman.x, y: this.pacman.y };
                            } else {
                                target = ghost.scatterTarget;
                            }
                            break;
                    }
                } else {
                    // Simple chase: just go directly to Pac-Man (used more at lower levels)
                    target = { x: this.pacman.x, y: this.pacman.y };
                }
            } else {
                target = ghost.scatterTarget;
            }

            const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
            let bestDir = ghost.dir;
            let bestDist = Infinity;
            const oppositeDir = (ghost.dir + 2) % 4; // Prevent 180-degree turns

            // Get ghost's current grid position
            const ghostGridX = Math.round(ghost.x);
            const ghostGridY = Math.round(ghost.y);

            // Try all 4 directions
            for (let i = 0; i < 4; i++) {
                // No-reverse rule: only enforced at higher difficulty levels
                const allowReverse = difficultyFactor < 0.75; // Allow reverse at levels 1-2
                if (i === oppositeDir && ghost.mode !== 'frightened' && !allowReverse) continue;

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
            // Speed scales with difficulty: 50% slower at level 1, full speed at level 5+
            const maxSpeed = 0.15;
            const minSpeed = 0.08;
            const baseSpeed = ghost.mode === 'frightened' ? 0.08 : (minSpeed + (maxSpeed - minSpeed) * difficultyFactor);
            const speed = ghost.personality === 0 ? baseSpeed * 1.1 : baseSpeed; // Blinky is slightly faster

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

            // Handle tunnel wrap for collision check
            let wrappedCheckX = checkX;
            if (wrappedCheckX < 0) wrappedCheckX = MAZE_COLS - 1;
            if (wrappedCheckX >= MAZE_COLS) wrappedCheckX = 0;

            // Only move if not hitting a wall (use wrapped coordinates for check)
            if (checkY >= 0 && checkY < MAZE_ROWS && this.maze[checkY][wrappedCheckX] !== 0) {
                ghost.x = newGhostX;
                ghost.y = newGhostY;

                // Handle tunnel wrap for position
                if (ghost.x < 0) ghost.x += MAZE_COLS;
                if (ghost.x >= MAZE_COLS) ghost.x -= MAZE_COLS;
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

            // Dynamic mode switching based on distance and game state (scales with difficulty)
            if (ghost.mode !== 'frightened') {
                ghost.modeTimer++;
                const distToPacman = Math.hypot(ghost.x - this.pacman.x, ghost.y - this.pacman.y);

                // Aggression scales with level
                // Level 1: 200 scatter, 200 chase (balanced)
                // Level 5: 100 scatter, 300 chase (very aggressive)
                const scatterTime = 200 - (100 * difficultyFactor);
                const chaseTime = 200 + (100 * difficultyFactor);
                const detectionRange = 10 + (5 * (1 - difficultyFactor)); // Wider at lower levels

                if (ghost.mode === 'scatter') {
                    // Switch to chase sooner if close to Pac-Man or after time limit
                    if (distToPacman < detectionRange || ghost.modeTimer > scatterTime) {
                        ghost.mode = 'chase';
                        ghost.modeTimer = 0;
                    }
                } else if (ghost.mode === 'chase') {
                    // Chase for longer at higher levels
                    if (ghost.modeTimer > chaseTime) {
                        ghost.mode = 'scatter';
                        ghost.modeTimer = 0;
                    }
                }
            }
        }
    }

    loseLife() {
        this.lives--;
        this.updateDisplay();
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.pacman.x = 14.5;
            this.pacman.y = 22.5;
            this.pacman.dir = 0;
            this.pacman.nextDir = 0;
            this.initGhosts();
        }
    }

    nextLevel() {
        this.level++;
        this.initMaze();
        this.pacman.x = 14;
        this.pacman.y = 22.5;
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
        this.pauseBtn.textContent = this.isPaused ? 'Continuar' : 'Pausa';

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
        this.finalChemistryScore.textContent = this.formatChemistryScore(true);
        this.gameOverOverlay.classList.remove('hidden');
        gameMusic.pause();
    }

    showQuestionModal() {
        openChemistryChallenge(this);
    }

    restart() {
        this.initMaze();
        this.initGhosts();
        this.pacman = { x: 14, y: 22.5, dir: 0, nextDir: 0, mouthOpen: 0 };
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.chemistryCorrect = 0;
        this.chemistryAnswered = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.showQuestion = false;
        this.currentQuestion = null;
        this.powerMode = false;
        this.powerModeTimer = 0;

        this.gameOverOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        questionModal.classList.add('hidden');
        this.pauseBtn.textContent = 'Pausa';

        this.updateDisplay();
        gameMusic.resume();
        this.startGameLoop();
    }

    updateDisplay() {
        this.scoreDisplay.textContent = this.score;
        this.levelDisplay.textContent = this.level;
        this.livesDisplay.textContent = this.lives;
        this.chemistryScoreDisplay.textContent = this.formatChemistryScore(false);
    }

    formatChemistryScore(includePercent) {
        const base = `${this.chemistryCorrect}/${this.chemistryAnswered}`;
        if (!includePercent || this.chemistryAnswered === 0) return base;
        const percent = Math.round(this.chemistryCorrect / this.chemistryAnswered * 100);
        return `${base} (${percent} %)`;
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
        clearTimeout(this.gameLoop);
        this.initMaze();
        this.initGhosts();

        // Reset Pac-Man position - center of tile
        this.pacman = { x: 14, y: 22.5, dir: 0, nextDir: 0, mouthOpen: 0 };
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.chemistryCorrect = 0;
        this.chemistryAnswered = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.showQuestion = false;
        this.currentQuestion = null;
        this.gameOverOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        this.pauseBtn.textContent = 'Pausa';

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

challengeNow.addEventListener('click', () => {
    const game = currentGame === 'tetris' ? tetrisGame : pacmanGame;
    if (!game || game.isPaused || game.isGameOver || game.showQuestion) return;
    game.showQuestionModal();
});

playTetrisBtn.addEventListener('click', () => {
    startMusicOnInteraction();
    startGame('tetris');
});

playPacmanBtn.addEventListener('click', () => {
    initAudioContext();
    startGame('pacman');
});

backToMenuBtn.addEventListener('click', () => {
    returnToMenu();
});

function startGame(gameType) {
    currentGame = gameType;
    gameMenu.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    challengeNow.disabled = false;

    if (gameType === 'tetris') {
        gameTitle.textContent = 'Tetris químico · Formulación binaria';
        document.getElementById('tetrisGame').classList.remove('hidden');
        document.getElementById('tetrisControls').classList.remove('hidden');
        document.getElementById('pacmanGame').classList.add('hidden');
        document.getElementById('pacmanControls').classList.add('hidden');

        if (!gameMusic.isPlaying && !gameMusic.isMuted) {
            gameMusic.start();
        }
        if (pacmanGame) pacmanGame.stop();
        if (!tetrisGame) tetrisGame = new TetrisGame();
        tetrisGame.start(getTeamConfig());
    } else {
        gameTitle.textContent = 'Laberinto químico · Formulación binaria';
        document.getElementById('tetrisGame').classList.add('hidden');
        document.getElementById('tetrisControls').classList.add('hidden');
        document.getElementById('pacmanGame').classList.remove('hidden');
        document.getElementById('pacmanControls').classList.remove('hidden');

        gameMusic.stop();
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
    document.body.classList.remove('team-challenge-open');
    challengeNow.disabled = false;
    activeChallengeGame = null;
    challengeResolved = false;
    challengePhase = 'answering';
}
