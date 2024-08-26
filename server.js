const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let gameState = initializeGameState();
let moveHistory = [];

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
        io.emit('gameOver', 'B'); 
        return true;
    }

    if (piecesB === 0) {
        io.emit('gameOver', 'A'); 
        return true;
    }

    return false;
}

function isValidMove(character, oldRow, oldCol, newRow, newCol) {
    const piece = gameState.grid[oldRow][oldCol];
    if (!piece || piece.name !== character) return false;

    const rowDiff = Math.abs(newRow - oldRow);
    const colDiff = Math.abs(newCol - oldCol);

    
    if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) return false;

    if
        return (rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0));
    } else if (piece.name.includes('H1')) {
 
        return (rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2);
    } else if (piece.name.includes('H2')) {
        
        return (rowDiff === 2 && colDiff === 2);
    }

    return false;
}

function isPathClear(oldRow, oldCol, newRow, newCol) {
    const rowDiff = newRow - oldRow;
    const colDiff = newCol - oldCol;

    const stepRow = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
    const stepCol = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);
    let currentRow = oldRow + stepRow;
    let currentCol = oldCol + stepCol;

    while (currentRow !== newRow || currentCol !== newCol) {
        if (gameState.grid[currentRow][currentCol] !== null) {
           
            return false;
        }
        currentRow += stepRow;
        currentCol += stepCol;
    }

    return true;
}

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

   
    socket.emit('gameState', gameState);
    socket.emit('moveHistory', moveHistory);

    socket.on('moveCharacter', (data) => {
        const { charInfo, oldRow, oldCol, newRow, newCol } = data;

        
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

        const targetPiece = gameState.grid[newRow][newCol];
        let captureMessage = '';
        if (targetPiece && targetPiece.player !== currentPlayer) {
            captureMessage = ` (Captured ${targetPiece.name})`;
        }

     
        gameState.grid[newRow][newCol] = piece;
        gameState.grid[oldRow][oldCol] = null;
        piece.position = [newRow, newCol];

        const moveEntry = `${piece.name}: ${charInfo}${captureMessage}`;
        moveHistory.push(moveEntry);

      
        gameState.currentTurn = currentPlayer === 'A' ? 'B' : 'A';

   
        if (checkGameOver()) {
            io.emit('gameState', gameState);
            io.emit('moveHistory', moveHistory);
            return; 
        }

     
        io.emit('gameState', gameState);
        io.emit('moveHistory', moveHistory);
    });

    socket.on('newGame', () => {
        console.log('New game requested');
        gameState = initializeGameState(); 
        moveHistory = [];
        io.emit('gameState', gameState); 
        io.emit('moveHistory', moveHistory); 
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
    });
});

const port = 5500;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
