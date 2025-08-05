export type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king" | null
export type PieceColor = "white" | "black" | null
export type GameMode = "local" | "ai"
export type GameState = "start" | "playing" | "stats" | "exit"
export type TimerMode = "none" | "blitz" | "rapid" | "classical" // New: Timer modes

export interface Piece {
  type: PieceType
  color: PieceColor
  hasMoved?: boolean // Added for castling rights
}

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
  piece: Piece
  captured?: Piece
  notation: string
  timestamp: number
  initialPieceHasMoved?: boolean // Store original hasMoved status for undo
  rookMove?: { from: Position; to: Position; piece: Piece } // For castling rook's move
  initialRookHasMoved?: boolean // Store original hasMoved status for castling rook
  isEnPassantCapture?: boolean // New: Flag to indicate if this was an en passant capture
  capturedPawnPosition?: Position // New: Store the actual position of the captured pawn for en passant undo
}

export interface GameStats {
  whiteCaptures: number
  blackCaptures: number
  totalMoves: number
  gameStartTime: number
  gameEndTime?: number
  winner?: PieceColor | "draw" | null
  reason?: string
  timerMode: TimerMode // New: Store the timer mode
  initialTime: number // New: Store the initial time per player in milliseconds
}
