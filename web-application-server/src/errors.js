class FenError extends Error {
  constructor(fen, { at, length = 1, expected, found = null }) {
    const shown = found === null ? "the end of the FEN" : `"${found}"`;
    const marker = " ".repeat(at) + "^".repeat(length);
    super(
      `Invalid FEN: expected ${expected} at index ${at}, but found ${shown} in "${fen}"`,
    );
    this.name = "FenError";
    this.fen = fen;
    this.at = at;
    this.length = length;
    this.expected = expected;
    this.found = found ?? "the end of the FEN";
    this.marker = marker;
  }
}

export { FenError };

