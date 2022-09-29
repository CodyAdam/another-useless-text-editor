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
    return this.start.getLine() !== this.end.getLine() || this.start.getCol() !== this.end.getCol();
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
}
