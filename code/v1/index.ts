class Position {
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

}

class Editor {
  private content: string[];
  constructor() {
    this.content = [];
  }
  deleteBetween(start: Position, end: Position): void {
    // TODO
  }
  insertBetween(start: Position, end: Position, text: string): void {
    // TODO
  }
  deleteBefore(position: Position): void {
    // TODO
  }
  deleteAfter(position: Position): void {
    // TODO
  }
  getBetween(start: Position, end: Position): string {
    // TODO
    return "";
  }
}

class Cursor {
  start: Position;
  end: Position;
  constructor(start: Position = new Position(), end: Position = new Position()) {
    this.start = start;
    this.end = end;
  }
}

class Application {
  private editor: Editor;
  private clipboard: string;
  private cursor: Cursor;
  constructor() {
    this.editor = new Editor();
    this.clipboard = "";
    this.cursor = new Cursor();
  }

  onCopy(): void {
    // TODO
  }
  onPaste(): void {
    // TODO
  }
  onWrite(text: string): void {
    // TODO
  }
  onMoveCursor(position: Position): void {
    // TODO
  }
  onDelete(): void {
    // TODO
  }
  onMoveCursorStart(): void {
    // TODO
  }
  onMoveCursorEnd(): void {
    // TODO
  }

}