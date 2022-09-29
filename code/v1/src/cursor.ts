import { Position } from './position';

export class Cursor {
  private start: Position;
  private end: Position;
  constructor(start: Position = new Position(), end: Position = new Position()) {
    this.start = start;
    this.end = end;
  }
  isSelection(): boolean {
    // TODO
    return false;
  }

  getStart(): Position {
    return this.start;
  }
  getEnd(): Position {
    return this.end;
  }
  setStart(start: Position): void {
    this.start = start;
  }
  setEnd(end: Position): void {
    this.end = end;
  }
  getSelectionLength(): number {
    // TODO
    return 0;
  }
}
