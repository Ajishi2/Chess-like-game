const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Define initial game state and move history
let gameState = initializeGameState();
let moveHistory = [];

// Function to initialize or reset the game state
function initializeGameState() {
    const initialState = {
        playerA: [
            { name: 'A-P1', position: [0, 0], player: 'A' },
            { name: 'A-P2', position: [0, 1], player: 'A' },
            { name: 'A-H1', position: [0, 2], player: 'A' },
            { name: 'A-H2', position: [0, 3], player: 'A' },
            { name: 'A-P3', position: [0, 4], player: 'A' },
        ],
        playerB: [
            { name: 'B-P1', position: [4, 0], player: 'B' },
            { name: 'B-P2', position: [4, 1], player: 'B' },
            { name: 'B-H1', position: [4, 2], player: 'B' },
            { name: 'B-H2', position: [4, 3], player: 'B' },
            { name: 'B-P3', position: [4, 4], player: 'B' },
        ],
        currentTurn: 'A',
        grid: Array.from({ length: 5 }, () => Array(5).fill(null))
    };

    initializeGrid(initialState);
    return initialState;
}

// Initialize grid with game pieces
function initializeGrid(state) {
    state.grid = Array.from({ length: 5 }, () => Array(5).fill(null));

    state.playerA.forEach(piece => {
        const [row, col] = piece.position;
        state.grid[row][col] = piece;
    });

    state.playerB.forEach(piece => {
        const [row, col] = piece.position;
        state.grid[row][col] = piece;
    });
}

function checkGameOver() {
    const piecesA = gameState.grid.flat().filter(piece => piece && piece.player === 'A').length;
    const piecesB = gameState.grid.flat().filter(piece => piece && piece.player === 'B').length;

    if (piecesA === 0) {
        io.emit('gameOver', 'B'); // Player B wins
        return true;
    }

    if (piecesB === 0) {
        io.emit('gameOver', 'A'); // Player A wins
        return true;
    }

    return false;
}

function isValidMove(character, oldRow, oldCol, newRow, newCol) {
    const piece = gameState.grid[oldRow][oldCol];
    if (!piece || piece.name !== character) return false;

    const rowDiff = Math.abs(newRow - oldRow);
    const colDiff = Math.abs(newCol - oldCol);

    // Check if move is within bounds
    if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) return false;

    if (piece.name.includes('P')) {
        // Pawn move: 1 block in any direction
        return (rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0));
    } else if (piece.name.includes('H1')) {
        // Hero1 move: 2 blocks straight
        return (rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2);
    } else if (piece.name.includes('H2')) {
        // Hero2 move: 2 blocks diagonally
        return (rowDiff === 2 && colDiff === 2);
    }

    return false;
}

function isPathClear(oldRow, oldCol, newRow, newCol) {
    const rowDiff = newRow - oldRow;
    const colDiff = newCol - oldCol;

    // Check if there are any pieces in the path for Hero1 and Hero2
    const stepRow = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
    const stepCol = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);
    let currentRow = oldRow + stepRow;
    let currentCol = oldCol + stepCol;

    while (currentRow !== newRow || currentCol !== newCol) {
        if (gameState.grid[currentRow][currentCol] !== null) {
            // Path is blocked by another piece
            return false;
        }
        currentRow += stepRow;
        currentCol += stepCol;
    }

    return true;
}

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    // Send initial game state and move history to the newly connected player
    socket.emit('gameState', gameState);
    socket.emit('moveHistory', moveHistory);

    socket.on('moveCharacter', (data) => {
        const { charInfo, oldRow, oldCol, newRow, newCol } = data;

        // Check if it's the current player's turn
        const currentPlayer = gameState.currentTurn;
        const piece = gameState.grid[oldRow][oldCol];
        if (!piece || piece.name !== charInfo || piece.player !== currentPlayer) {
            console.log('Invalid move or not your turn');
            return;
        }

        if (!isValidMove(charInfo, oldRow, oldCol, newRow, newCol) || !isPathClear(oldRow, oldCol, newRow, newCol)) {
            console.log('Invalid move');
            return;
        }

        // Capture logic: Check if the target position contains an opponent's piece
        const targetPiece = gameState.grid[newRow][newCol];
        let captureMessage = '';
        if (targetPiece && targetPiece.player !== currentPlayer) {
            captureMessage = ` (Captured ${targetPiece.name})`;
        }

        // Update gameState.grid with the new position
        gameState.grid[newRow][newCol] = piece;
        gameState.grid[oldRow][oldCol] = null;
        piece.position = [newRow, newCol];

        // Add to move history
        const moveEntry = `${piece.name}: ${charInfo}${captureMessage}`;
        moveHistory.push(moveEntry);

        // Toggle turn
        gameState.currentTurn = currentPlayer === 'A' ? 'B' : 'A';

        // Check for game over condition
        if (checkGameOver()) {
            io.emit('gameState', gameState);
            io.emit('moveHistory', moveHistory);
            return; // Do not continue with further processing if game is over
        }

        // Emit updated game state and move history to all clients
        io.emit('gameState', gameState);
        io.emit('moveHistory', moveHistory);
    });

    socket.on('newGame', () => {
        console.log('New game requested');
        gameState = initializeGameState(); // Reset the game state
        moveHistory = []; // Clear move history
        io.emit('gameState', gameState); // Send the new state to all clients
        io.emit('moveHistory', moveHistory); // Send empty move history
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
    });
});

const port = 5500;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});