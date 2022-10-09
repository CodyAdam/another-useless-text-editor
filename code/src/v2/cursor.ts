import { Position } from './position';


//  | is the cursor
//  
//  in the example below, the cursor is at the pos (line 0, col 1) 
//  a|bc 
//
//  in the example below, the cursor is at the pos (line 0, col 0) 
//  |abc 

export class Cursor {
  private start: Position;
  private end: Position;
  constructor(start: Position = new Position(), end: Position = new Position()) {
    this.start = start;
    this.end = end;
  }

  isSelection(): boolean {
    return !this.start.isEqual(this.end);
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

  copy(other: Cursor): void {
    this.setStart(Position.from(other.getStart()));
    this.setEnd(Position.from(other.getEnd()));
  }

  static from(other: Cursor) : Cursor {
    return new Cursor(Position.from(other.start), Position.from(other.end));
  }
}
