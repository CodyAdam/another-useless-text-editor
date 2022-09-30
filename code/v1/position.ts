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
}