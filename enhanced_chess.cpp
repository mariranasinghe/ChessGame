#include <SFML/Graphics.hpp>
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <random>
#include <chrono>

enum PieceType {
    EMPTY = 0,
    PAWN = 1,
    ROOK = 2,
    KNIGHT = 3,
    BISHOP = 4,
    QUEEN = 5,
    KING = 6
};

enum PieceColor {
    NONE = 0,
    WHITE = 1,
    BLACK = 2
};

enum GameMode {
    LOCAL_MULTIPLAYER = 0,
    VS_AI = 1
};

struct Piece {
    PieceType type;
    PieceColor color;
    
    Piece() : type(EMPTY), color(NONE) {}
    Piece(PieceType t, PieceColor c) : type(t), color(c) {}
};

struct Position {
    int row, col;
    Position(int r = -1, int c = -1) : row(r), col(c) {}
    bool operator==(const Position& other) const {
        return row == other.row && col == other.col;
    }
};

struct Move {
    Position from, to;
    Piece piece;
    Piece captured;
    int score;
    
    Move() : score(0) {}
    Move(Position f, Position t, Piece p, Piece c = Piece()) 
        : from(f), to(t), piece(p), captured(c), score(0) {}
};

class ChessGame {
private:
    Piece board[8][8];
    PieceColor currentPlayer;
    Position selectedSquare;
    bool pieceSelected;
    sf::RenderWindow window;
    sf::Font font;
    GameMode gameMode;
    int aiDifficulty; // 1-3 (Easy, Medium, Hard)
    bool isAIThinking;
    std::vector<Move> moveHistory;
    
    // Colors
    sf::Color lightSquare = sf::Color(240, 217, 181);
    sf::Color darkSquare = sf::Color(181, 136, 99);
    sf::Color selectedColor = sf::Color(255, 255, 0, 128);
    sf::Color lastMoveColor = sf::Color(0, 255, 0, 100);
    
    // Piece values for AI evaluation
    int pieceValues[7] = {0, 1, 5, 3, 3, 9, 1000}; // EMPTY, PAWN, ROOK, KNIGHT, BISHOP, QUEEN, KING

public:
    ChessGame() : currentPlayer(WHITE), selectedSquare(-1, -1), pieceSelected(false),
                  window(sf::VideoMode(1200, 800), "Enhanced Chess Game"),
                  gameMode(LOCAL_MULTIPLAYER), aiDifficulty(2), isAIThinking(false) {
        initializeBoard();
        if (!font.loadFromFile("arial.ttf")) {
            std::cout << "Warning: Could not load font file. Using default font." << std::endl;
        }
    }
    
    void initializeBoard() {
        // Clear board
        for (int i = 0; i < 8; i++) {
            for (int j = 0; j < 8; j++) {
                board[i][j] = Piece();
            }
        }
        
        // Place pawns
        for (int j = 0; j < 8; j++) {
            board[1][j] = Piece(PAWN, BLACK);
            board[6][j] = Piece(PAWN, WHITE);
        }
        
        // Place other pieces
        PieceType backRow[8] = {ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK};
        
        for (int j = 0; j < 8; j++) {
            board[0][j] = Piece(backRow[j], BLACK);
            board[7][j] = Piece(backRow[j], WHITE);
        }
    }
    
    bool isValidMove(int fromRow, int fromCol, int toRow, int toCol) {
        if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;
        
        Piece fromPiece = board[fromRow][fromCol];
        Piece toPiece = board[toRow][toCol];
        
        if (toPiece.color == fromPiece.color) return false;
        if (fromPiece.type == EMPTY) return false;
        
        int rowDiff = toRow - fromRow;
        int colDiff = toCol - fromCol;
        
        switch (fromPiece.type) {
            case PAWN: {
                int direction = (fromPiece.color == WHITE) ? -1 : 1;
                
                if (colDiff == 0) {
                    if (rowDiff == direction && toPiece.type == EMPTY) return true;
                    if (rowDiff == 2 * direction && toPiece.type == EMPTY && 
                        ((fromPiece.color == WHITE && fromRow == 6) || 
                         (fromPiece.color == BLACK && fromRow == 1))) return true;
                }
                else if (abs(colDiff) == 1 && rowDiff == direction && toPiece.type != EMPTY) {
                    return true;
                }
                return false;
            }
            
            case ROOK:
                if (rowDiff == 0 || colDiff == 0) {
                    return isPathClear(fromRow, fromCol, toRow, toCol);
                }
                return false;
                
            case BISHOP:
                if (abs(rowDiff) == abs(colDiff)) {
                    return isPathClear(fromRow, fromCol, toRow, toCol);
                }
                return false;
                
            case QUEEN:
                if (rowDiff == 0 || colDiff == 0 || abs(rowDiff) == abs(colDiff)) {
                    return isPathClear(fromRow, fromCol, toRow, toCol);
                }
                return false;
                
            case KING:
                return abs(rowDiff) <= 1 && abs(colDiff) <= 1;
                
            case KNIGHT:
                return (abs(rowDiff) == 2 && abs(colDiff) == 1) || 
                       (abs(rowDiff) == 1 && abs(colDiff) == 2);
                
            default:
                return false;
        }
    }
    
    bool isPathClear(int fromRow, int fromCol, int toRow, int toCol) {
        int rowStep = (toRow > fromRow) ? 1 : (toRow < fromRow) ? -1 : 0;
        int colStep = (toCol > fromCol) ? 1 : (toCol < fromCol) ? -1 : 0;
        
        int currentRow = fromRow + rowStep;
        int currentCol = fromCol + colStep;
        
        while (currentRow != toRow || currentCol != toCol) {
            if (board[currentRow][currentCol].type != EMPTY) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }
    
    std::vector<Move> getAllValidMoves(PieceColor color) {
        std::vector<Move> moves;
        
        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 8; col++) {
                if (board[row][col].color == color && board[row][col].type != EMPTY) {
                    for (int toRow = 0; toRow < 8; toRow++) {
                        for (int toCol = 0; toCol < 8; toCol++) {
                            if (isValidMove(row, col, toRow, toCol)) {
                                Move move(Position(row, col), Position(toRow, toCol), 
                                         board[row][col], board[toRow][toCol]);
                                moves.push_back(move);
                            }
                        }
                    }
                }
            }
        }
        
        return moves;
    }
    
    int evaluateBoard() {
        int score = 0;
        
        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 8; col++) {
                Piece piece = board[row][col];
                if (piece.type != EMPTY) {
                    int value = pieceValues[piece.type];
                    
                    // Add positional bonuses
                    if (piece.type == PAWN) {
                        value += (piece.color == WHITE) ? (6 - row) : (row - 1);
                    } else if (piece.type == KNIGHT || piece.type == BISHOP) {
                        // Encourage central positions
                        int centerDistance = abs(3.5 - row) + abs(3.5 - col);
                        value += (7 - centerDistance);
                    }
                    
                    score += (piece.color == WHITE) ? value : -value;
                }
            }
        }
        
        return score;
    }
    
    int minimax(int depth, bool isMaximizing, int alpha = -10000, int beta = 10000) {
        if (depth == 0) {
            return evaluateBoard();
        }
        
        PieceColor color = isMaximizing ? WHITE : BLACK;
        std::vector<Move> moves = getAllValidMoves(color);
        
        if (moves.empty()) {
            return isMaximizing ? -1000 : 1000;
        }
        
        if (isMaximizing) {
            int maxEval = -10000;
            for (const Move& move : moves) {
                makeTemporaryMove(move);
                int eval = minimax(depth - 1, false, alpha, beta);
                undoTemporaryMove(move);
                
                maxEval = std::max(maxEval, eval);
                alpha = std::max(alpha, eval);
                
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return maxEval;
        } else {
            int minEval = 10000;
            for (const Move& move : moves) {
                makeTemporaryMove(move);
                int eval = minimax(depth - 1, true, alpha, beta);
                undoTemporaryMove(move);
                
                minEval = std::min(minEval, eval);
                beta = std::min(beta, eval);
                
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return minEval;
        }
    }
    
    void makeTemporaryMove(const Move& move) {
        board[move.to.row][move.to.col] = board[move.from.row][move.from.col];
        board[move.from.row][move.from.col] = Piece();
    }
    
    void undoTemporaryMove(const Move& move) {
        board[move.from.row][move.from.col] = move.piece;
        board[move.to.row][move.to.col] = move.captured;
    }
    
    Move getBestMove() {
        std::vector<Move> moves = getAllValidMoves(BLACK);
        if (moves.empty()) return Move();
        
        Move bestMove = moves[0];
        int bestValue = 10000;
        
        // Add randomness for easier difficulties
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<> dis(-1.0, 1.0);
        
        double randomFactor = (3.0 - aiDifficulty) * 50.0;
        
        for (Move& move : moves) {
            makeTemporaryMove(move);
            int moveValue = minimax(aiDifficulty, true);
            undoTemporaryMove(move);
            
            // Add randomness for lower difficulties
            if (randomFactor > 0) {
                moveValue += dis(gen) * randomFactor;
            }
            
            if (moveValue < bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    void makeMove(int fromRow, int fromCol, int toRow, int toCol) {
        Move move(Position(fromRow, fromCol), Position(toRow, toCol), 
                 board[fromRow][fromCol], board[toRow][toCol]);
        
        board[toRow][toCol] = board[fromRow][fromCol];
        board[fromRow][fromCol] = Piece();
        
        moveHistory.push_back(move);
        currentPlayer = (currentPlayer == WHITE) ? BLACK : WHITE;
    }
    
    void undoLastMove() {
        if (moveHistory.empty()) return;
        
        Move lastMove = moveHistory.back();
        moveHistory.pop_back();
        
        board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
        
        currentPlayer = (currentPlayer == WHITE) ? BLACK : WHITE;
    }
    
    std::string getPieceSymbol(const Piece& piece) {
        if (piece.type == EMPTY) return " ";
        
        std::string symbols[7] = {"", "P", "R", "N", "B", "Q", "K"};
        return symbols[piece.type];
    }
    
    void handleClick(int mouseX, int mouseY) {
        // Check if click is on UI buttons
        if (mouseX > 800) {
            handleUIClick(mouseX, mouseY);
            return;
        }
        
        if (isAIThinking || (gameMode == VS_AI && currentPlayer == BLACK)) return;
        
        int col = mouseX / 100;
        int row = mouseY / 100;
        
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return;
        
        if (!pieceSelected) {
            if (board[row][col].type != EMPTY && board[row][col].color == currentPlayer) {
                selectedSquare = Position(row, col);
                pieceSelected = true;
            }
        } else {
            if (selectedSquare.row == row && selectedSquare.col == col) {
                pieceSelected = false;
                selectedSquare = Position(-1, -1);
            } else if (isValidMove(selectedSquare.row, selectedSquare.col, row, col)) {
                makeMove(selectedSquare.row, selectedSquare.col, row, col);
                pieceSelected = false;
                selectedSquare = Position(-1, -1);
            } else {
                if (board[row][col].type != EMPTY && board[row][col].color == currentPlayer) {
                    selectedSquare = Position(row, col);
                } else {
                    pieceSelected = false;
                    selectedSquare = Position(-1, -1);
                }
            }
        }
    }
    
    void handleUIClick(int mouseX, int mouseY) {
        // New Game button
        if (mouseX >= 820 && mouseX <= 920 && mouseY >= 50 && mouseY <= 90) {
            resetGame();
        }
        // Undo Move button
        else if (mouseX >= 820 && mouseX <= 920 && mouseY >= 100 && mouseY <= 140) {
            undoLastMove();
        }
        // Local Multiplayer button
        else if (mouseX >= 820 && mouseX <= 980 && mouseY >= 200 && mouseY <= 240) {
            gameMode = LOCAL_MULTIPLAYER;
            resetGame();
        }
        // VS AI button
        else if (mouseX >= 820 && mouseX <= 920 && mouseY >= 250 && mouseY <= 290) {
            gameMode = VS_AI;
            resetGame();
        }
        // AI Difficulty buttons
        else if (gameMode == VS_AI) {
            if (mouseX >= 820 && mouseX <= 870 && mouseY >= 320 && mouseY <= 360) {
                aiDifficulty = 1; // Easy
            }
            else if (mouseX >= 880 && mouseX <= 930 && mouseY >= 320 && mouseY <= 360) {
                aiDifficulty = 2; // Medium
            }
            else if (mouseX >= 940 && mouseX <= 990 && mouseY >= 320 && mouseY <= 360) {
                aiDifficulty = 3; // Hard
            }
        }
    }
    
    void resetGame() {
        initializeBoard();
        currentPlayer = WHITE;
        selectedSquare = Position(-1, -1);
        pieceSelected = false;
        isAIThinking = false;
        moveHistory.clear();
    }
    
    void makeAIMove() {
        if (gameMode != VS_AI || currentPlayer != BLACK || isAIThinking) return;
        
        isAIThinking = true;
        Move bestMove = getBestMove();
        
        if (bestMove.from.row != -1) {
            makeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
        }
        
        isAIThinking = false;
    }
    
    void draw() {
        window.clear(sf::Color::White);
        
        // Draw board
        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 8; col++) {
                sf::RectangleShape square(sf::Vector2f(100, 100));
                square.setPosition(col * 100, row * 100);
                
                // Alternate colors
                if ((row + col) % 2 == 0) {
                    square.setFillColor(lightSquare);
                } else {
                    square.setFillColor(darkSquare);
                }
                
                window.draw(square);
                
                // Highlight selected square
                if (pieceSelected && selectedSquare.row == row && selectedSquare.col == col) {
                    sf::RectangleShape highlight(sf::Vector2f(100, 100));
                    highlight.setPosition(col * 100, row * 100);
                    highlight.setFillColor(selectedColor);
                    window.draw(highlight);
                }
                
                // Highlight last move
                if (!moveHistory.empty()) {
                    Move lastMove = moveHistory.back();
                    if ((lastMove.from.row == row && lastMove.from.col == col) ||
                        (lastMove.to.row == row && lastMove.to.col == col)) {
                        sf::RectangleShape highlight(sf::Vector2f(100, 100));
                        highlight.setPosition(col * 100, row * 100);
                        highlight.setFillColor(lastMoveColor);
                        window.draw(highlight);
                    }
                }
                
                // Draw piece
                if (board[row][col].type != EMPTY) {
                    sf::Text pieceText;
                    pieceText.setFont(font);
                    pieceText.setString(getPieceSymbol(board[row][col]));
                    pieceText.setCharacterSize(60);
                    pieceText.setFillColor(board[row][col].color == WHITE ? sf::Color::White : sf::Color::Black);
                    
                    sf::FloatRect textBounds = pieceText.getLocalBounds();
                    pieceText.setPosition(
                        col * 100 + (100 - textBounds.width) / 2,
                        row * 100 + (100 - textBounds.height) / 2
                    );
                    
                    window.draw(pieceText);
                }
            }
        }
        
        // Draw UI
        drawUI();
        
        window.display();
    }
    
    void drawUI() {
        // Game status
        sf::Text statusText;
        statusText.setFont(font);
        std::string status = isAIThinking ? "AI is thinking..." : 
                           (currentPlayer == WHITE ? "White to move" : "Black to move");
        if (gameMode == VS_AI) {
            status += (currentPlayer == WHITE) ? " (You)" : " (AI)";
        }
        statusText.setString(status);
        statusText.setCharacterSize(24);
        statusText.setFillColor(sf::Color::Black);
        statusText.setPosition(820, 10);
        window.draw(statusText);
        
        // Buttons
        drawButton(820, 50, 100, 40, "New Game", sf::Color::Blue);
        drawButton(820, 100, 100, 40, "Undo Move", sf::Color::Gray);
        
        // Game mode buttons
        sf::Color localColor = (gameMode == LOCAL_MULTIPLAYER) ? sf::Color::Green : sf::Color::Gray;
        sf::Color aiColor = (gameMode == VS_AI) ? sf::Color::Green : sf::Color::Gray;
        
        drawButton(820, 200, 160, 40, "Local Multiplayer", localColor);
        drawButton(820, 250, 100, 40, "VS AI", aiColor);
        
        // AI difficulty buttons (only show when in AI mode)
        if (gameMode == VS_AI) {
            sf::Text diffText;
            diffText.setFont(font);
            diffText.setString("AI Difficulty:");
            diffText.setCharacterSize(18);
            diffText.setFillColor(sf::Color::Black);
            diffText.setPosition(820, 300);
            window.draw(diffText);
            
            sf::Color easyColor = (aiDifficulty == 1) ? sf::Color::Green : sf::Color::Gray;
            sf::Color mediumColor = (aiDifficulty == 2) ? sf::Color::Green : sf::Color::Gray;
            sf::Color hardColor = (aiDifficulty == 3) ? sf::Color::Green : sf::Color::Gray;
            
            drawButton(820, 320, 50, 40, "Easy", easyColor);
            drawButton(880, 320, 50, 40, "Med", mediumColor);
            drawButton(940, 320, 50, 40, "Hard", hardColor);
        }
        
        // Move history
        sf::Text historyTitle;
        historyTitle.setFont(font);
        historyTitle.setString("Move History:");
        historyTitle.setCharacterSize(20);
        historyTitle.setFillColor(sf::Color::Black);
        historyTitle.setPosition(820, 400);
        window.draw(historyTitle);
        
        int yPos = 430;
        int displayMoves = std::min(10, (int)moveHistory.size());
        for (int i = moveHistory.size() - displayMoves; i < moveHistory.size(); i++) {
            Move move = moveHistory[i];
            sf::Text moveText;
            moveText.setFont(font);
            
            std::string moveStr = std::to_string(i + 1) + ". " + 
                                 getPieceSymbol(move.piece) + 
                                 char('a' + move.from.col) + std::to_string(8 - move.from.row) + 
                                 "-" + char('a' + move.to.col) + std::to_string(8 - move.to.row);
            
            if (move.captured.type != EMPTY) {
                moveStr += " x" + getPieceSymbol(move.captured);
            }
            
            moveText.setString(moveStr);
            moveText.setCharacterSize(14);
            moveText.setFillColor(sf::Color::Black);
            moveText.setPosition(820, yPos);
            window.draw(moveText);
            
            yPos += 20;
        }
    }
    
    void drawButton(int x, int y, int width, int height, const std::string& text, sf::Color color) {
        sf::RectangleShape button(sf::Vector2f(width, height));
        button.setPosition(x, y);
        button.setFillColor(color);
        button.setOutlineThickness(2);
        button.setOutlineColor(sf::Color::Black);
        window.draw(button);
        
        sf::Text buttonText;
        buttonText.setFont(font);
        buttonText.setString(text);
        buttonText.setCharacterSize(16);
        buttonText.setFillColor(sf::Color::White);
        
        sf::FloatRect textBounds = buttonText.getLocalBounds();
        buttonText.setPosition(
            x + (width - textBounds.width) / 2,
            y + (height - textBounds.height) / 2
        );
        
        window.draw(buttonText);
    }
    
    void run() {
        while (window.isOpen()) {
            sf::Event event;
            while (window.pollEvent(event)) {
                if (event.type == sf::Event::Closed) {
                    window.close();
                }
                
                if (event.type == sf::Event::MouseButtonPressed) {
                    if (event.mouseButton.button == sf::Mouse::Left) {
                        handleClick(event.mouseButton.x, event.mouseButton.y);
                    }
                }
            }
            
            // Make AI move if it's AI's turn
            if (gameMode == VS_AI && currentPlayer == BLACK && !isAIThinking) {
                makeAIMove();
            }
            
            draw();
        }
    }
};

int main() {
    ChessGame game;
    game.run();
    return 0;
}
