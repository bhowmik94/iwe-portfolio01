import { describe, expect, test } from "bun:test";
import Board from "../src/board.js";
import { FenError } from "../src/errors.js";
import { START } from "../src/board.js";

describe("Board.parse", () => {
  test("parses a starting position and exposes its pieces and fields", () => {
    const board = Board.parse(START);
    expect(board.sideToMove).toBe("white");
    expect(board.castlingRights).toEqual({
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true },
    });
    expect(board.enPassantSquare).toBe("-");
    expect(board.halfmoveClock).toBe(0);
    expect(board.fullmoveNumber).toBe(1);
    expect(board.pieces).toHaveLength(32);
    expect(board.pieces[0][0]).toBe("a8");
    expect(board.pieces.at(-1)[0]).toBe("h1");
    expect(board.pieceAt("e1").letter).toBe("K");
    expect(board.pieceAt("e5")).toBeNull();
    expect(board.isStartPosition()).toBe(true);
    expect(board.toFen()).toBe(START);
  });

  test("accepts trimmed input and preserves the original FEN for serialization", () => {
    const input = ` ${START} `;
    expect(Board.parse(input).toFen()).toBe(input);
  });

  test("parses black to move, partial castling rights, en passant, and counters", () => {
    const board = Board.parse("8/8/8/4p3/8/8/8/8 b Qq e6 12 34");
    expect(board.sideToMove).toBe("black");
    expect(board.castlingRights.white.queenside).toBe(true);
    expect(board.castlingRights.black.queenside).toBe(true);
    expect(board.castlingRights.white.kingside).toBe(false);
    expect(board.enPassantSquare).toBe("e6");
    expect(board.halfmoveClock).toBe(12);
    expect(board.fullmoveNumber).toBe(34);
    expect(board.isStartPosition()).toBe(false);
  });

  test.each([
    ["", 0],
    ["8/8/8/8/8/8/8/8  w - - 0 1", 16],
    ["4/8/8/8/8/8/8/8 w - - 0 1", 1],
    ["44/8/8/8/8/8/8/8 w - - 0 1", 1],
    ["9/8/8/8/8/8/8/8 w - - 0 1", 0],
    ["8/8/8/8/8/8/8/7X w - - 0 1", 15],
    ["8/8/8/8/8/8/8/8 x - - 0 1", 16],
    ["8/8/8/8/8/8/8/8 w KK - 0 1", 19],
    ["8/8/8/8/8/8/8/8 w KQkqK - 0 1", 22],
    ["8/8/8/8/8/8/8/8 w - z9 0 1", 20],
    ["8/8/8/8/8/8/8/8 w - - 01 1", 22],
    ["8/8/8/8/8/8/8/8 w - - 1.5 1", 22],
    ["8/8/8/8/8/8/8/8 w - - -1 1", 22],
    ["8/8/8/8/8/8/8/8 w - - 0 0", 24],
  ])("rejects malformed FEN %j", (fen, expectedAt) => {
    try {
      Board.parse(fen);
      throw new Error("Expected Board.parse to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(FenError);
      expect(error.at).toBe(expectedAt);
      expect(error).toHaveProperty("length");
      expect(error).toHaveProperty("expected");
      expect(error).toHaveProperty("found");
    }
  });

  test("rejects invalid square names while returning null for valid empty squares", () => {
    const board = Board.parse("8/8/8/8/8/8/8/8 w - - 0 1");
    expect(board.pieceAt("e5")).toBeNull();
    expect(() => board.pieceAt("z9")).toThrow(RangeError);
    expect(() => board.pieceAt("e9")).toThrow(RangeError);
  });

  test("shows a caret marker under the offending FEN character", () => {
    const fen = "8/8/8/8/8/8/8/8 w KK - 0 1";
    let error;
    try {
      Board.parse(fen);
    } catch (caught) {
      error = caught;
    }

    const offendingIndex = fen.indexOf("KK") + 1;
    expect(error).toBeInstanceOf(FenError);
    expect(error.at).toBe(offendingIndex);
    expect(error.marker).toBe(" ".repeat(offendingIndex) + "^");
    expect(error.message).toContain(`\n  ${fen}\n  ${error.marker}`);
  });
});
