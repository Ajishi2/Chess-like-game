# Chess-like-game
# Chess-Like Game

## Overview

This project is a turn-based chess-like game with a 5x5 grid. It includes a client-side interface and a server-side backend using Node.js and Socket.io.

## Project Structure

- `public/index.html` - Contains the client-side code (HTML).
- `server.js` - Contains the server-side code (Node.js and Socket.io).
- `package.json` - Lists the project's dependencies and scripts.
- `package-lock.json` - Contains the exact version of installed dependencies.

## Features

- **Turn-Based Gameplay:** Players take turns moving their characters on a 5x5 grid.
- **Character Types:** Includes Pawn, Hero1, Hero2, and Hero3 with specific movement rules.
- **Real-Time Communication:** Uses Socket.io for real-time updates between clients and server.
- **Drag-and-Drop Functionality:** Allows for intuitive movement of characters.
- **Shows History:** Displays a history of moves made during the game, allowing players to review past actions.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/Ajishi2/Chess-like-game.git
Socket.io for real-time communication
Node.js for the server-side runtime
Usage
Play Against Another Player: Access the game in a browser and start a match with another player.
View Game History: Use the in-game history feature to review all moves made during the current session.
