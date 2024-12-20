const submit = document.getElementById('submit');
const invalidInputMsg = document.getElementById('invalid-input-msg');
const alertMsg = document.getElementById('alert-msg');

// Event listener for the "Solve" button
submit.addEventListener('click', handleSolve);

function handleSolve() {
    const inputs = document.getElementsByTagName('input');
    const A = Array.from(inputs).map((input) => {
        const value = Number(input.value);
        if (!isNaN(value) && (value === 0 || (value >= 1 && value <= 9))) {
            input.style.color = value === 0 ? 'rgb(89, 89, 231)' : '#0056b3';
            return value;
        } else {
            invalidInputMsg.style.display = 'block';
            setTimeout(() => {
                invalidInputMsg.style.display = 'none';
            }, 3000); // Hide after 3 seconds
            return null;
        }
    });

    if (A.includes(null)) return;

    // Hide previous messages
    invalidInputMsg.style.display = 'none';
    alertMsg.style.display = 'none';

    // Convert 1D array to 2D board
    const board = [];
    while (A.length) board.push(A.splice(0, 9));

    // Validate and solve
    if (isBoardEmpty(board)) {
        alertMsg.style.display = 'block';
        setTimeout(() => {
            alertMsg.style.display = 'none';
        }, 3000);
        return;
    }

    if (solveSudoku(board, 9)) {
        displaySolution(board, inputs);
    } else {
        alert('No solution exists for the provided puzzle!');
    }
}

function isBoardEmpty(board) {
    return board.flat().reduce((sum, cell) => sum + cell, 0) === 0;
}

function isSafe(board, row, col, value) {
    // Check row, column, and subgrid
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
                        board[row][col] = 0; // Backtrack
                    }
                }
                return false; // Trigger backtracking
            }
        }
    }
    return true; // Solved
}

function displaySolution(board, inputs) {
    const flatBoard = board.flat();
    flatBoard.forEach((value, index) => {
        inputs[index].value = value;
        inputs[index].classList.add('animated');
        setTimeout(() => {
            inputs[index].classList.remove('animated');
        }, 1000); // Animation duration
    });
}