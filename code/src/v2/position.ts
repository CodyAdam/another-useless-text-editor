export class Position {
  private col: number;
  private line: number;
  constructor(line: number = 0, col: number = 0) {
    this.line = line;
    this.col = col;
  }
  getLine() {
    return this.line;
  }
  getCol() {
    return this.col;
  }

  toString() {
    return `(y:${this.line}, x:${this.col})`;
  }

  isAfter(other: Position) {
    return this.line > other.line || (this.line === other.line && this.col > other.col);
  }

  isBefore(other: Position) {
    return this.line < other.line || (this.line === other.line && this.col < other.col);
  }

  isEqual(other: Position) {
    return this.line === other.line && this.col === other.col;
  }
}