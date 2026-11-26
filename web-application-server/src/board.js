import Piece from "./piece.js";
import { FenError } from "./errors.js";

export const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PIECE_LETTERS = "PNBRQKpnbrqk";
const SYMBOLS = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

class Board {
  #squares;

  constructor({
    squares,
    sideToMove,
    castlingRights,
    enPassantSquare,
    halfmoveClock,
    fullmoveNumber,
    fen,
  }) {
    this.#squares = squares;
    this.sideToMove = sideToMove;
    this.castlingRights = castlingRights;
    this.enPassantSquare = enPassantSquare;
    this.halfmoveClock = halfmoveClock;
    this.fullmoveNumber = fullmoveNumber;
    this.fen = fen;
  }

  static parse(fen) {
    if (typeof fen !== "string" || fen.length === 0) {
      throw new FenError(fen, {
        at: 0,
        length: 0,
        expected: "a non-empty FEN string",
        found: fen,
      });
    }

    const leading = fen.length - fen.trimStart().length;
    const trimmed = fen.trim();
    const fail = (at, expected, length = 1) => {
      throw new FenError(fen, { at, length, expected, found: fen[at] ?? null });
    };

    // Parse fields while retaining each field's offset in the original string.
    const fields = [];
    let fieldStart = 0;
    for (let i = 0; i <= trimmed.length; i++) {
      if (i === trimmed.length || trimmed[i] === " ") {
        if (i === fieldStart)
          fail(leading + i, "exactly one space between FEN fields");
        fields.push({
          value: trimmed.slice(fieldStart, i),
          at: leading + fieldStart,
        });
        fieldStart = i + 1;
      } else if (/\s/.test(trimmed[i])) {
        fail(leading + i, "a single space between FEN fields");
      }
    }
    if (fields.length !== 6) {
      if (fields.length < 6)
        fail(fen.length, "six space-separated FEN fields", 0);
      fail(
        fields[6].at,
        "the end of the FEN after six fields",
        fields[6].value.length,
      );
    }

    const [placement, side, castling, enPassant, halfmove, fullmove] = fields;
    const squares = new Map();
    const ranks = placement.value.split("/");
    let position = placement.at;
    if (ranks.length !== 8)
      fail(
        placement.at,
        "eight ranks separated by '/'",
        placement.value.length,
      );

    for (let r = 0; r < 8; r++) {
      const rankText = ranks[r];
      let fileIndex = 0;
      let previousWasDigit = false;
      for (let j = 0; j < rankText.length; j++) {
        const char = rankText[j];
        const at = position + j;
        if (char >= "1" && char <= "8") {
          if (previousWasDigit) fail(at, "a piece or '/' after a rank digit");
          fileIndex += Number(char);
          if (fileIndex > 8) fail(at, "a rank totaling exactly eight squares");
          previousWasDigit = true;
        } else if (PIECE_LETTERS.includes(char)) {
          if (fileIndex >= 8) fail(at, "a rank totaling exactly eight squares");
          const square = `${FILES[fileIndex]}${8 - r}`;
          squares.set(square, new Piece(char, square));
          fileIndex++;
          previousWasDigit = false;
        } else {
          fail(at, "a piece letter or a digit (1-8)");
        }
      }
      if (fileIndex !== 8)
        fail(
          position + rankText.length,
          "a rank totaling exactly eight squares",
          0,
        );
      position += rankText.length + (r < 7 ? 1 : 0);
    }

    if (side.value !== "w" && side.value !== "b")
      fail(side.at, "'w' or 'b'", side.value.length);

    const rights = {
      white: { kingside: false, queenside: false },
      black: { kingside: false, queenside: false },
    };
    if (castling.value !== "-") {
      let previousOrder = -1;
      for (let i = 0; i < castling.value.length; i++) {
        const char = castling.value[i];
        const order = "KQkq".indexOf(char);
        if (order < 0 || order <= previousOrder)
          fail(
            castling.at + i,
            "an ordered, non-repeating subsequence of 'KQkq'",
          );
        previousOrder = order;
        if (char === "K") rights.white.kingside = true;
        if (char === "Q") rights.white.queenside = true;
        if (char === "k") rights.black.kingside = true;
        if (char === "q") rights.black.queenside = true;
      }
    }

    if (enPassant.value !== "-" && !/^[a-h][1-8]$/.test(enPassant.value)) {
      fail(
        enPassant.at,
        "'-' or a valid square from a1 to h8",
        enPassant.value.length,
      );
    }

    const parseInteger = (field, minimum, expected) => {
      if (!/^(0|[1-9][0-9]*)$/.test(field.value))
        fail(field.at, expected, field.value.length);
      const value = Number(field.value);
      if (!Number.isSafeInteger(value) || value < minimum)
        fail(field.at, expected, field.value.length);
      return value;
    };

    return new Board({
      squares,
      sideToMove: side.value === "w" ? "white" : "black",
      castlingRights: rights,
      enPassantSquare: enPassant.value,
      halfmoveClock: parseInteger(
        halfmove,
        0,
        "a non-negative base-10 integer",
      ),
      fullmoveNumber: parseInteger(fullmove, 1, "a positive base-10 integer"),
      fen,
    });
  }

  get pieces() {
    const result = [];
    for (let rank = 8; rank >= 1; rank--) {
      for (const file of FILES) {
        const square = `${file}${rank}`;
        const piece = this.#squares.get(square);
        if (piece) result.push([square, piece]);
      }
    }
    return result;
  }

  pieceAt(square) {
    if (typeof square !== "string" || !/^[a-h][1-8]$/.test(square)) {
      throw new RangeError(`Invalid square name: ${String(square)}`);
    }
    return this.#squares.get(square) ?? null;
  }

  isStartPosition() {
    if (this.sideToMove !== "white" || this.#squares.size !== 32) return false;
    const expected = "RNBQKBNR";
    for (let i = 0; i < 8; i++) {
      if (this.pieceAt(`${FILES[i]}1`)?.letter !== expected[i]) return false;
      if (this.pieceAt(`${FILES[i]}2`)?.letter !== "P") return false;
      if (this.pieceAt(`${FILES[i]}7`)?.letter !== "p") return false;
      if (this.pieceAt(`${FILES[i]}8`)?.letter !== expected[i].toLowerCase())
        return false;
    }
    return true;
  }

  toFen() {
    return this.fen;
  }

  toString() {
    const rows = [];
    for (let rank = 8; rank >= 1; rank--) {
      const row = FILES.map(
        (file) => SYMBOLS[this.pieceAt(file + rank)?.letter] ?? "·",
      );
      rows.push(`${rank} ${row.join(" ")}`);
    }
    rows.push("  a b c d e f g h");
    return rows.join("\n");
  }
}

export default Board;
