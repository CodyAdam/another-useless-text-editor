import { Cursor } from './cursor';
import { Position } from './position';

export class Editor {
  private cur: Cursor
  private content: string[];
  constructor(cur: Cursor) {
    this.cur = cur;
    this.content = [""];
    console.log("Editor loaded!");
  }
  deleteBetween(start: Position, end: Position): void {
    if(start.getLine()> end.getLine() || (start.getLine() === end.getLine() && start.getCol()> end.getCol())){
      const tmp = start;
      start = end;
      end = tmp;
    }
    const length = end.getLine() - start.getLine() + 1;
    if (length === 1) {
      const line = this.content[start.getLine()];
      this.content[start.getLine()] = getBefore(line, start.getCol()) + getAfter(line, end.getCol());
    }
    else {
      const firstPart = getBefore(this.content[start.getLine()], start.getCol());
      const lastPart = getAfter(this.content[end.getLine()], end.getCol());
      this.content.splice(start.getLine(), length, firstPart + lastPart);
    }
  }
  deleteBefore(position: Position): void {
    const x = position.getCol();
    const y = position.getLine();
    const line = this.content[y];
    this.content[y] = getBefore(line, x - 1) + getAfter(line, x);
    if (x === 0 && y > 0) {
      this.cur.setStart(this.getEndLinePos(y - 1));
      this.cur.setEnd(this.getEndLinePos(y - 1));
    } else if (x > 0){
      this.cur.setStart(new Position(y, x - 1));
      this.cur.setEnd(new Position(y, x - 1));
    }
  }
  deleteAfter(position: Position): void {
    const line = this.content[position.getLine()];
    const x = position.getCol();
    this.content[position.getLine()] = getBefore(line, x) + getAfter(line, x + 1);
  }
  getBetween(start: Position, end: Position): string {
    if(start.getLine()> end.getLine() || (start.getLine() === end.getLine() && start.getCol()> end.getCol())){
      const tmp = start;
      start = end;
      end = tmp;
    }
    const allLines = this.content.slice(start.getLine(), end.getLine() + 1);
    if (allLines.length === 1) {
      return getBetween(allLines[0], start.getCol(), end.getCol());
    } else {
      allLines[0] = getAfter(allLines[0], start.getCol());
      allLines[allLines.length - 1] = getBefore(allLines[allLines.length - 1], end.getCol());
      return allLines.join('\n');
    }
  }

  insertAt(pos: Position, text: string): void {
    const line = this.content[pos.getLine()];
    const toAdd:string[] = text.split('\n');
    if (toAdd.length === 1) {
      this.content[pos.getLine()] = getBefore(line, pos.getCol()) + text + getAfter(line, pos.getCol());
      //move cursor to end of inserted text
      this.cur.setStart(new Position(pos.getLine(), pos.getCol() + text.length));
      this.cur.setEnd(new Position(pos.getLine(), pos.getCol() + text.length));
    }
    else {
      this.content.splice(pos.getLine(), 1, getBefore(line, pos.getCol()) + toAdd[0], ...toAdd.slice(1, toAdd.length - 1), toAdd[toAdd.length - 1] + getAfter(line, pos.getCol()));
      //move cursor to end of inserted text 
      this.cur.setStart(new Position(pos.getLine() + toAdd.length - 1, toAdd[toAdd.length - 1].length));
      this.cur.setEnd(new Position(pos.getLine() + toAdd.length - 1, toAdd[toAdd.length - 1].length));
    }
  }

  getEndLinePos(line: number): Position {
    return new Position(line, this.content[line].length);
  }

  getStartLinePos(line: number): Position {
    return new Position(line, 0);
  }


  getContent(): string {
    return this.content.join('\n');
  }

  clampedPosition(pos: Position): Position {
    const x = pos.getCol();
    const y = pos.getLine();
    const line = this.content[y];
    if (x < 0) {
      return new Position(y, 0);
    }
    if (x > line.length) {
      return new Position(y, line.length);
    }
    return pos;
  }
}


// Helper function 

function getBetween(string: string, indexStart: number, indexEnd: number): string {
  return string.substring(indexStart, indexEnd);
}

function getAfter(text: string, index: number): string {
  if (index < 0)
    return text;
  return text.slice(index);
}

function getBefore(text: string, index: number): string {
  if (index < 0)
    return "";
  return text.slice(0, index);
}