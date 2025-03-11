const submit = document.getElementById('submit');
const newGame = document.getElementById('new-game');
const hint = document.getElementById('hint');
const clear = document.getElementById('clear');
const themeBtn = document.getElementById('theme-btn');
const difficultySelect = document.getElementById('difficulty');
const invalidInputMsg = document.getElementById('invalid-input-msg');
const alertMsg = document.getElementById('alert-msg');
const timeDisplay = document.getElementById('time');
const solvedCount = document.getElementById('solved-count');
const bestTimeDisplay = document.getElementById('best-time');
const inputs = document.getElementsByTagName('input');

let gameTimer;
let seconds = 0;
let isGameActive = false;
let selectedCell = null;
let originalBoard = null;

let stats = JSON.parse(localStorage.getItem('sudokuStats')) || {
    solved: 0,
    bestTime: null
};

function init() {
    loadTheme();
    displayStats();
    setupEventListeners();
    setupKeyboardNavigation();
}

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeBtn.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function startTimer() {
    if (!isGameActive) {
        isGameActive = true;
        seconds = 0;
        updateTimer();
        gameTimer = setInterval(updateTimer, 1000);
    }
}

function stopTimer() {
    clearInterval(gameTimer);
    isGameActive = false;
}

function updateTimer() {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    seconds++;
}

function updateStats(solveTime) {
    stats.solved++;
    if (!stats.bestTime || solveTime < stats.bestTime) {
        stats.bestTime = solveTime;
    }
    localStorage.setItem('sudokuStats', JSON.stringify(stats));
    displayStats();
}

function displayStats() {
    solvedCount.textContent = stats.solved;
    bestTimeDisplay.textContent = stats.bestTime ? formatTime(stats.bestTime) : '--:--';
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function generatePuzzle() {
    const difficulty = difficultySelect.value;
    const emptySquares = {
        'easy': 30,
        'medium': 40,
        'hard': 50
    }[difficulty];

    const solved = generateSolvedGrid();
    const puzzle = [...solved];
    const indices = Array.from({length: 81}, (_, i) => i);
    
    for (let i = 0; i < emptySquares; i++) {
        const randomIndex = Math.floor(Math.random() * indices.length);
        const cellIndex = indices.splice(randomIndex, 1)[0];
        puzzle[cellIndex] = 0;
    }

    return { puzzle, solution: solved };
}

function generateSolvedGrid() {
    const grid = Array(81).fill(0);
    fillGrid(grid);
    return grid;
}

function fillGrid(grid) {
    for (let i = 0; i < 81; i++) {
        if (grid[i] === 0) {
            const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (const num of numbers) {
                if (isValidPlacement(grid, i, num)) {
                    grid[i] = num;
                    if (fillGrid(grid)) return true;
                    grid[i] = 0;
                }
            }
            return false;
        }
    }
    return true;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function isValidPlacement(grid, pos, num) {
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    // Check row
    for (let i = 0; i < 9; i++) {
        if (grid[row * 9 + i] === num) return false;
    }

    // Check column
    for (let i = 0; i < 9; i++) {
        if (grid[i * 9 + col] === num) return false;
    }

    // Check box
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[(boxRow + i) * 9 + (boxCol + j)] === num) return false;
        }
    }

    return true;
}

function startNewGame() {
    stopTimer();
    const { puzzle, solution } = generatePuzzle();
    originalBoard = solution;
    
    Array.from(inputs).forEach((input, index) => {
        input.value = puzzle[index] || '';
        input.readOnly = puzzle[index] !== 0;
        input.classList.toggle('read-only', puzzle[index] !== 0);
        input.classList.remove('invalid', 'highlighted');
    });

    startTimer();
}

function handleInput(e) {
    const input = e.target;
    const value = input.value;

    if (value && (value < 1 || value > 9)) {
        invalidInputMsg.style.display = 'block';
        input.classList.add('invalid');
        setTimeout(() => {
            invalidInputMsg.style.display = 'none';
            input.classList.remove('invalid');
        }, 2000);
        input.value = '';
        return;
    }

    if (!isGameActive && value) {
        startTimer();
    }

    validateBoard();
}

function validateBoard() {
    const currentBoard = Array.from(inputs).map(input => Number(input.value) || 0);
    const isComplete = !currentBoard.includes(0);
    
    if (isComplete) {
        const isCorrect = currentBoard.every((value, index) => value === originalBoard[index]);
        if (isCorrect) {
            stopTimer();
            updateStats(seconds - 1);
            alert('Congratulations! You solved the puzzle!');
        }
    }
}

function clearBoard() {
    if (confirm('Are you sure you want to clear the board?')) {
        Array.from(inputs).forEach(input => {
            if (!input.readOnly) {
                input.value = '';
                input.classList.remove('invalid', 'highlighted');
            }
        });
    }
}

function getHint() {
    if (!originalBoard) {
        alert('Start a new game to use hints!');
        return;
    }

    const emptyInputs = Array.from(inputs).filter(input => !input.readOnly && !input.value);
    if (emptyInputs.length === 0) return;

    const randomInput = emptyInputs[Math.floor(Math.random() * emptyInputs.length)];
    const index = Array.from(inputs).indexOf(randomInput);
    randomInput.value = originalBoard[index];
    randomInput.classList.add('highlighted');
    setTimeout(() => randomInput.classList.remove('highlighted'), 2000);

    validateBoard();
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', handleKeyPress);
    Array.from(inputs).forEach(input => {
        input.addEventListener('focus', () => {
            selectedCell = input;
        });
    });
}

function handleKeyPress(e) {
    if (!selectedCell) return;

    const currentIndex = Array.from(inputs).indexOf(selectedCell);
    let nextIndex;

    switch(e.key) {
        case 'ArrowUp':
            nextIndex = currentIndex - 9;
            break;
        case 'ArrowDown':
            nextIndex = currentIndex + 9;
            break;
        case 'ArrowLeft':
            nextIndex = currentIndex - 1;
            break;
        case 'ArrowRight':
            nextIndex = currentIndex + 1;
            break;
        case 'h':
        case 'H':
            e.preventDefault();
            getHint();
            return;
        case 'Delete':
        case 'Backspace':
            if (!selectedCell.readOnly) {
                selectedCell.value = '';
                validateBoard();
            }
            return;
        default:
            if (e.key >= '1' && e.key <= '9' && !selectedCell.readOnly) {
                selectedCell.value = e.key;
                validateBoard();
            }
            return;
    }

    if (nextIndex >= 0 && nextIndex < inputs.length) {
        inputs[nextIndex].focus();
        e.preventDefault();
    }
}

function setupEventListeners() {
    submit.addEventListener('click', handleSolve);
    newGame.addEventListener('click', startNewGame);
    hint.addEventListener('click', getHint);
    clear.addEventListener('click', clearBoard);
    themeBtn.addEventListener('click', toggleTheme);
    Array.from(inputs).forEach(input => {
        input.addEventListener('input', handleInput);
    });
}

function handleSolve() {
    const board = Array.from(inputs).map(input => {
        const value = Number(input.value);
        if (!isNaN(value) && (value === 0 || (value >= 1 && value <= 9))) {
            input.style.color = value === 0 ? 'var(--input-color)' : 'var(--input-color)';
            return value;
        } else {
            invalidInputMsg.style.display = 'block';
            setTimeout(() => {
                invalidInputMsg.style.display = 'none';
            }, 3000);
            return null;
        }
    });

    if (board.includes(null)) return;

    invalidInputMsg.style.display = 'none';
    alertMsg.style.display = 'none';

    const grid = [];
    while (board.length) grid.push(board.splice(0, 9));

    if (isBoardEmpty(grid)) {
        alertMsg.style.display = 'block';
        setTimeout(() => {
            alertMsg.style.display = 'none';
        }, 3000);
        return;
    }

    if (solveSudoku(grid, 9)) {
        displaySolution(grid, inputs);
        stopTimer();
        updateStats(seconds - 1);
    } else {
        alert('No solution exists for the provided puzzle!');
    }
}

function isBoardEmpty(board) {
    return board.flat().reduce((sum, cell) => sum + cell, 0) === 0;
}

function isSafe(board, row, col, value) {
    const sqrt = Math.sqrt(board.length);
    const boxRowStart = row - (row % sqrt);
    const boxColStart = col - (col % sqrt);

    return !board[row].includes(value) &&
        !board.some((row) => row[col] === value) &&
        !board.slice(boxRowStart, boxRowStart + sqrt)
              .flatMap((r) => r.slice(boxColStart, boxColStart + sqrt))
              .includes(value);
}

function solveSudoku(board, n) {
    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= n; num++) {
                    if (isSafe(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board, n)) return true;
                        board[row][col] = 0; 
                    }
                }
                return false; 
            }
        }
    }
    return true;
}

function displaySolution(board, inputs) {
    const flatBoard = board.flat();
    flatBoard.forEach((value, index) => {
        inputs[index].value = value;
        inputs[index].classList.add('animated');
        setTimeout(() => {
            inputs[index].classList.remove('animated');
        }, 1000); 
    });
}

init();
