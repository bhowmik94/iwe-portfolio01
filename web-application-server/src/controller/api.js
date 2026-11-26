import { Hono } from "hono";
import Board, { START } from "../board.js";
import { FenError } from "../errors.js";
import {
  serializeBoard,
  serializeError,
  serializeFenError,
} from "../server-view/serialize.js";

const board = new Hono();
const SQUARE_PATTERN = /^[a-h][1-8]$/;

function errorResponse(error) {
  if (error instanceof FenError) {
    return Response.json(serializeFenError(error), { status: 400 });
  }
  return Response.json(serializeError(error), { status: 500 });
}

function serializePiece(piece) {
  return {
    letter: piece.letter,
    color: piece.color,
    name: piece.name,
    square: piece.square,
  };
}

board.get("/", (c) => {
  try {
    const fen = c.req.query("fen") ?? START;
    return Response.json(serializeBoard(Board.parse(fen)));
  } catch (error) {
    return errorResponse(error);
  }
});

board.get("/square", (c) => {
  const fen = c.req.query("fen") ?? START;
  const square = c.req.query("square");

  if (square === undefined) {
    return Response.json(
      serializeError(
        new Error(
          "Missing required query parameter 'square'; expected a square from a1 to h8.",
        ),
      ),
      { status: 400 },
    );
  }
  if (!SQUARE_PATTERN.test(square)) {
    return Response.json(
      serializeError(
        new Error(
          `Invalid square '${square}'; expected a square from a1 to h8.`,
        ),
      ),
      { status: 400 },
    );
  }

  try {
    const piece = Board.parse(fen).pieceAt(square);
    return Response.json(piece === null ? null : serializePiece(piece));
  } catch (error) {
    return errorResponse(error);
  }
});

board.get("/pieces", (c) => {
  const fen = c.req.query("fen") ?? START;
  const color = c.req.query("color");

  if (color !== undefined && color !== "white" && color !== "black") {
    return Response.json(
      serializeError(
        new Error(`Invalid color '${color}'; expected 'white' or 'black'.`),
      ),
      { status: 400 },
    );
  }

  try {
    const pieces = serializeBoard(Board.parse(fen)).pieces;
    return Response.json(
      color === undefined
        ? pieces
        : pieces.filter((piece) => piece.color === color),
    );
  } catch (error) {
    return errorResponse(error);
  }
});

const api = new Hono();
api.route("/board", board);

export default api;
