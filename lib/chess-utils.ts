import type { Piece, PieceColor, PieceType, Position, Move } from "@/lib/types"

export const PIECE_SYMBOLS = {
  white: {
    pawn: "♙",
    rook: "♖",
    knight: "♘",
    bishop: "♗",
    queen: "♕",
    king: "♔",
  },
  black: {
    pawn: "♟",
    rook: "♜",
    knight: "♞",
    bishop: "♝",
    queen: "♛",
    king: "♚",
  },
}

export const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 1000,
}

export function initializeBoard(): Piece[][] {
  const initialBoard: Piece[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill({ type: null, color: null }))

  // Place pawns
  for (let col = 0; col < 8; col++) {
    initialBoard[1][col] = { type: "pawn", color: "black", hasMoved: false }
    initialBoard[6][col] = { type: "pawn", color: "white", hasMoved: false }
  }

  // Place other pieces
  const backRow: PieceType[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"]
  for (let col = 0; col < 8; col++) {
    const pieceType = backRow[col]
    initialBoard[0][col] = { type: pieceType, color: "black", hasMoved: false }
    initialBoard[7][col] = { type: pieceType, color: "white", hasMoved: false }
  }

  return initialBoard
}

export function isValidMove(from: Position, to: Position, board: Piece[][]): boolean {
  if (to.row < 0 || to.row >= 8 || to.col < 0 || to.col >= 8) return false
  if (from.row === to.row && from.col === to.col) return false

  const fromPiece = board[from.row]?.[from.col]
  const toPiece = board[to.row]?.[to.col]

  if (!fromPiece || !fromPiece.type) return false
  if (toPiece && toPiece.color === fromPiece.color) return false

  const rowDiff = to.row - from.row
  const colDiff = to.col - from.col

  switch (fromPiece.type) {
    case "pawn": {
      const direction = fromPiece.color === "white" ? -1 : 1
      const startRow = fromPiece.color === "white" ? 6 : 1

      // Standard 1-square move
      if (colDiff === 0) {
        if (rowDiff === direction && !toPiece.type) return true
        // Standard 2-square move from starting position
        if (
          rowDiff === 2 * direction &&
          from.row === startRow &&
          !toPiece.type &&
          !board[from.row + direction][from.col].type
        )
          return true
      }
      // Standard diagonal capture
      else if (Math.abs(colDiff) === 1 && rowDiff === direction && toPiece.type) {
        return true
      }
      // En passant is handled in getLegalMoves, as it depends on the last move.
      return false
    }

    case "rook":
      return (rowDiff === 0 || colDiff === 0) && isPathClear(from, to, board)

    case "bishop":
      return Math.abs(rowDiff) === Math.abs(colDiff) && isPathClear(from, to, board)

    case "queen":
      return (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff)) && isPathClear(from, to, board)

    case "king":
      // For king, only allow 1-square moves here. Castling is handled in getLegalMoves.
      return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1

    case "knight":
      return (
        (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) || (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2)
      )

    default:
      return false
  }
}

export function isPathClear(from: Position, to: Position, board: Piece[][]): boolean {
  const rowStep = to.row > from.row ? 1 : to.row < from.row ? -1 : 0
  const colStep = to.col > from.col ? 1 : to.col < from.col ? -1 : 0

  let currentRow = from.row + rowStep
  let currentCol = from.col + colStep

  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow]?.[currentCol]?.type) return false
    currentRow += rowStep
    currentCol += colStep
  }

  return true
}

export function getKingPosition(board: Piece[][], color: PieceColor): Position | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c].type === "king" && board[r][c].color === color) {
        return { row: r, col: c }
      }
    }
  }
  return null
}

// Helper to check if a specific square is attacked by a given color
export function isSquareAttacked(board: Piece[][], row: number, col: number, attackingColor: PieceColor): boolean {
  const targetPos = { row, col }
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.type && piece.color === attackingColor) {
        // Create a temporary board to simulate the target square being empty
        // This is crucial for sliding pieces (Rook, Bishop, Queen) to correctly identify attacks
        const tempBoard = board.map((rowArr) => [...rowArr])
        tempBoard[targetPos.row][targetPos.col] = { type: null, color: null } // Pretend target is empty for attack check

        if (isValidMove({ row: r, col: c }, targetPos, tempBoard)) {
          return true
        }
      }
    }
  }
  return false
}

export function isKingInCheck(board: Piece[][], kingColor: PieceColor): boolean {
  const kingPos = getKingPosition(board, kingColor)
  if (!kingPos) return false // Should not happen in a valid game

  const opponentColor = kingColor === "white" ? "black" : "white"
  return isSquareAttacked(board, kingPos.row, kingPos.col, opponentColor)
}

export function getAllPotentialMoves(color: PieceColor, board: Piece[][]): Move[] {
  const moves: Move[] = []

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === color && piece.type) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            const from = { row, col }
            const to = { row: toRow, col: toCol }

            if (isValidMove(from, to, board)) {
              const captured = board[toRow][toCol]
              moves.push({
                from,
                to,
                piece,
                captured: captured.type ? captured : undefined,
                notation: `${piece.type}${String.fromCharCode(97 + col)}${8 - row}-${String.fromCharCode(97 + toCol)}${8 - toRow}`,
                timestamp: Date.now(),
                initialPieceHasMoved: piece.hasMoved, // Store initial hasMoved status
              })
            }
          }
        }
      }
    }
  }
  return moves
}

export function getLegalMoves(color: PieceColor, board: Piece[][], lastMove?: Move): Move[] {
  const potentialMoves = getAllPotentialMoves(color, board)
  const legalMoves: Move[] = []
  const opponentColor = color === "white" ? "black" : "white"

  // Add standard legal moves
  for (const move of potentialMoves) {
    const newBoard = board.map((row) => [...row])
    newBoard[move.to.row][move.to.col] = { ...newBoard[move.from.row][move.from.col], hasMoved: true }
    newBoard[move.from.row][move.from.col] = { type: null, color: null }

    if (!isKingInCheck(newBoard, color)) {
      legalMoves.push(move)
    }
  }

  // Add castling moves
  const kingPos = getKingPosition(board, color)
  if (kingPos && !board[kingPos.row][kingPos.col].hasMoved && !isKingInCheck(board, color)) {
    const kingRow = kingPos.row

    // Kingside Castling (0-0)
    const kingsideRookPos = { row: kingRow, col: 7 }
    const kingsideRook = board[kingsideRookPos.row][kingsideRookPos.col]
    if (
      kingsideRook &&
      kingsideRook.type === "rook" &&
      kingsideRook.color === color &&
      !kingsideRook.hasMoved &&
      !board[kingRow][5].type &&
      !board[kingRow][6].type && // Path clear
      !isSquareAttacked(board, kingRow, 5, opponentColor) && // Squares not attacked
      !isSquareAttacked(board, kingRow, 6, opponentColor)
    ) {
      legalMoves.push({
        from: kingPos,
        to: { row: kingRow, col: 6 }, // King's destination
        piece: board[kingPos.row][kingPos.col],
        notation: "O-O",
        timestamp: Date.now(),
        initialPieceHasMoved: board[kingPos.row][kingPos.col].hasMoved,
        rookMove: {
          from: kingsideRookPos,
          to: { row: kingRow, col: 5 },
          piece: kingsideRook,
        },
        initialRookHasMoved: kingsideRook.hasMoved,
      })
    }

    // Queenside Castling (0-0-0)
    const queensideRookPos = { row: kingRow, col: 0 }
    const queensideRook = board[queensideRookPos.row][queensideRookPos.col]
    if (
      queensideRook &&
      queensideRook.type === "rook" &&
      queensideRook.color === color &&
      !queensideRook.hasMoved &&
      !board[kingRow][1].type &&
      !board[kingRow][2].type &&
      !board[kingRow][3].type && // Path clear
      !isSquareAttacked(board, kingRow, 2, opponentColor) && // Squares not attacked
      !isSquareAttacked(board, kingRow, 3, opponentColor)
    ) {
      legalMoves.push({
        from: kingPos,
        to: { row: kingRow, col: 2 }, // King's destination
        piece: board[kingPos.row][kingPos.col],
        notation: "O-O-O",
        timestamp: Date.now(),
        initialPieceHasMoved: board[kingPos.row][kingPos.col].hasMoved,
        rookMove: {
          from: queensideRookPos,
          to: { row: kingRow, col: 3 },
          piece: queensideRook,
        },
        initialRookHasMoved: queensideRook.hasMoved,
      })
    }
  }

  // Add En Passant moves
  if (lastMove && lastMove.piece.type === "pawn" && Math.abs(lastMove.from.row - lastMove.to.row) === 2) {
    const movedPawnColor = lastMove.piece.color
    const movedPawnPos = lastMove.to
    const enPassantRank = movedPawnColor === "white" ? 3 : 4 // Rank where en passant can occur

    if (color === "white" && movedPawnPos.row === enPassantRank) {
      // Check white pawns that can capture en passant
      const whitePawnRow = 3 // White pawns are on rank 4 (index 3) for en passant
      if (kingPos.row === whitePawnRow) {
        // Only check if king is on the same rank as the pawn
        for (let col = 0; col < 8; col++) {
          const pawn = board[whitePawnRow][col]
          if (pawn.type === "pawn" && pawn.color === "white") {
            // Check if adjacent to the moved black pawn
            if (Math.abs(pawn.col - movedPawnPos.col) === 1) {
              const targetCol = movedPawnPos.col
              const targetRow = movedPawnPos.row - 1 // Square behind the captured pawn

              const enPassantMove: Move = {
                from: { row: whitePawnRow, col: col },
                to: { row: targetRow, col: targetCol },
                piece: pawn,
                captured: lastMove.piece, // The pawn that moved two squares
                notation: `e.p. ${String.fromCharCode(97 + col)}${8 - whitePawnRow}x${String.fromCharCode(97 + targetCol)}${8 - targetRow}`,
                timestamp: Date.now(),
                initialPieceHasMoved: pawn.hasMoved,
                isEnPassantCapture: true,
                capturedPawnPosition: movedPawnPos, // Store position of the captured pawn
              }

              // Simulate the move to check for king safety
              const tempBoard = board.map((rowArr) => [...rowArr])
              tempBoard[enPassantMove.to.row][enPassantMove.to.col] = { ...pawn, hasMoved: true }
              tempBoard[enPassantMove.from.row][enPassantMove.from.col] = { type: null, color: null }
              tempBoard[enPassantMove.capturedPawnPosition.row][enPassantMove.capturedPawnPosition.col] = {
                type: null,
                color: null,
              }

              if (!isKingInCheck(tempBoard, color)) {
                legalMoves.push(enPassantMove)
              }
            }
          }
        }
      }
    } else if (color === "black" && movedPawnPos.row === enPassantRank) {
      // Check black pawns that can capture en passant
      const blackPawnRow = 4 // Black pawns are on rank 5 (index 4) for en passant
      if (kingPos.row === blackPawnRow) {
        // Only check if king is on the same rank as the pawn
        for (let col = 0; col < 8; col++) {
          const pawn = board[blackPawnRow][col]
          if (pawn.type === "pawn" && pawn.color === "black") {
            // Check if adjacent to the moved white pawn
            if (Math.abs(pawn.col - movedPawnPos.col) === 1) {
              const targetCol = movedPawnPos.col
              const targetRow = movedPawnPos.row + 1 // Square behind the captured pawn

              const enPassantMove: Move = {
                from: { row: blackPawnRow, col: col },
                to: { row: targetRow, col: targetCol },
                piece: pawn,
                captured: lastMove.piece, // The pawn that moved two squares
                notation: `e.p. ${String.fromCharCode(97 + col)}${8 - blackPawnRow}x${String.fromCharCode(97 + targetCol)}${8 - targetRow}`,
                timestamp: Date.now(),
                initialPieceHasMoved: pawn.hasMoved,
                isEnPassantCapture: true,
                capturedPawnPosition: movedPawnPos, // Store position of the captured pawn
              }

              // Simulate the move to check for king safety
              const tempBoard = board.map((rowArr) => [...rowArr])
              tempBoard[enPassantMove.to.row][enPassantMove.to.col] = { ...pawn, hasMoved: true }
              tempBoard[enPassantMove.from.row][enPassantMove.from.col] = { type: null, color: null }
              tempBoard[enPassantMove.capturedPawnPosition.row][enPassantMove.capturedPawnPosition.col] = {
                type: null,
                color: null,
              }

              if (!isKingInCheck(tempBoard, color)) {
                legalMoves.push(enPassantMove)
              }
            }
          }
        }
      }
    }
  }

  return legalMoves
}

export function isCheckmate(board: Piece[][], color: PieceColor): boolean {
  return isKingInCheck(board, color) && getLegalMoves(color, board).length === 0
}

export function isStalemate(board: Piece[][], color: PieceColor): boolean {
  return !isKingInCheck(board, color) && getLegalMoves(color, board).length === 0
}

export function evaluateBoard(board: Piece[][]): number {
  let score = 0

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.type) {
        const value = PIECE_VALUES[piece.type]
        const multiplier = piece.color === "white" ? 1 : -1

        // Add positional bonuses
        let positionalBonus = 0
        if (piece.type === "pawn") {
          positionalBonus = piece.color === "white" ? (6 - row) * 0.1 : (row - 1) * 0.1
        } else if (piece.type === "knight" || piece.type === "bishop") {
          const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col)
          positionalBonus = (7 - centerDistance) * 0.1
        }

        score += (value + positionalBonus) * multiplier
      }
    }
  }
  return score
}

export function minimax(
  board: Piece[][],
  depth: number,
  isMaximizing: boolean,
  alpha = Number.NEGATIVE_INFINITY,
  beta = Number.POSITIVE_INFINITY,
  lastMove?: Move, // Pass lastMove to minimax for en passant
): number {
  if (depth === 0) {
    return evaluateBoard(board)
  }

  const color = isMaximizing ? "black" : "white"
  const moves = getLegalMoves(color, board, lastMove) // Pass lastMove to getLegalMoves

  if (moves.length === 0) {
    return isKingInCheck(board, color) ? (isMaximizing ? -10000 : 10000) : 0 // Checkmate or Stalemate
  }

  if (isMaximizing) {
    let maxEval = Number.NEGATIVE_INFINITY
    for (const move of moves) {
      const newBoard = board.map((row) => [...row])
      newBoard[move.to.row][move.to.col] = { ...newBoard[move.from.row][move.from.col], hasMoved: true }
      newBoard[move.from.row][move.from.col] = { type: null, color: null }

      // Apply rook move for castling in minimax evaluation
      if (move.rookMove) {
        const rook = newBoard[move.rookMove.from.row][move.rookMove.from.col]
        newBoard[move.rookMove.to.row][move.rookMove.to.col] = { ...rook, hasMoved: true }
        newBoard[move.rookMove.from.row][move.rookMove.from.col] = { type: null, color: null }
      }

      // Apply en passant capture in minimax evaluation
      if (move.isEnPassantCapture && move.capturedPawnPosition) {
        newBoard[move.capturedPawnPosition.row][move.capturedPawnPosition.col] = { type: null, color: null }
      }

      const eval_ = minimax(newBoard, depth - 1, false, alpha, beta, move) // Pass current move as lastMove for next depth
      maxEval = Math.max(maxEval, eval_)
      alpha = Math.max(alpha, eval_)

      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Number.POSITIVE_INFINITY
    for (const move of moves) {
      const newBoard = board.map((row) => [...row])
      newBoard[move.to.row][move.to.col] = { ...newBoard[move.from.row][move.from.col], hasMoved: true }
      newBoard[move.from.row][move.from.col] = { type: null, color: null }

      // Apply rook move for castling in minimax evaluation
      if (move.rookMove) {
        const rook = newBoard[move.rookMove.from.row][move.rookMove.from.col]
        newBoard[move.rookMove.to.row][move.rookMove.to.col] = { ...rook, hasMoved: true }
        newBoard[move.rookMove.from.row][move.rookMove.from.col] = { type: null, color: null }
      }

      // Apply en passant capture in minimax evaluation
      if (move.isEnPassantCapture && move.capturedPawnPosition) {
        newBoard[move.capturedPawnPosition.row][move.capturedPawnPosition.col] = { type: null, color: null }
      }

      const eval_ = minimax(newBoard, depth - 1, true, alpha, beta, move) // Pass current move as lastMove for next depth
      minEval = Math.min(minEval, eval_)
      beta = Math.min(beta, eval_)

      if (beta <= alpha) break
    }
    return minEval
  }
}

export function getBestMove(board: Piece[][], difficulty: number, lastMove?: Move): Move | null {
  const moves = getLegalMoves("black", board, lastMove) // Pass lastMove to getLegalMoves
  if (moves.length === 0) return null

  let bestMove = moves[0]
  let bestValue = Number.NEGATIVE_INFINITY

  const randomFactor = (4 - difficulty) * 0.2

  // Sort moves by capture value first (move ordering for better pruning)
  moves.sort((a, b) => {
    const aValue = a.captured ? PIECE_VALUES[a.captured.type!] : 0
    const bValue = b.captured ? PIECE_VALUES[b.captured.type!] : 0
    return bValue - aValue
  })

  for (const move of moves) {
    const newBoard = board.map((row) => [...row])
    newBoard[move.to.row][move.to.col] = { ...newBoard[move.from.row][move.from.col], hasMoved: true }
    newBoard[move.from.row][move.from.col] = { type: null, color: null }

    // Apply rook move for castling in AI's temporary board
    if (move.rookMove) {
      const rook = newBoard[move.rookMove.from.row][move.rookMove.from.col]
      newBoard[move.rookMove.to.row][move.rookMove.to.col] = { ...rook, hasMoved: true }
      newBoard[move.rookMove.from.row][move.rookMove.from.col] = { type: null, color: null }
    }

    // Apply en passant capture in AI's temporary board
    if (move.isEnPassantCapture && move.capturedPawnPosition) {
      newBoard[move.capturedPawnPosition.row][move.capturedPawnPosition.col] = { type: null, color: null }
    }

    let moveValue = minimax(newBoard, difficulty, false, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, move) // Pass current move as lastMove

    if (randomFactor > 0) {
      moveValue += (Math.random() - 0.5) * randomFactor * 100
    }

    if (moveValue > bestValue) {
      bestValue = moveValue
      bestMove = move
    }
  }
  return bestMove
}
