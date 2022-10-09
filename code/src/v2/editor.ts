import { Cursor } from './cursor';
import { Position } from './position';

export class Editor {
  private content: string[];
  constructor() {
    this.content = [""];
    console.log("Editor loaded!");
  }
  deleteBetween(start: Position, end: Position): void {
    if (end.isBefore(start)) {
      const tmp = start;
      start = end;
      end = tmp;
    }
    const lineBetween = end.getLine() - start.getLine() + 1;
    if (lineBetween === 1) {
      const line = this.content[start.getLine()];
      this.content[start.getLine()] = getBefore(line, start.getCol()) + getAfter(line, end.getCol());
    }
    else {
      const firstPart = getBefore(this.content[start.getLine()], start.getCol());
      const lastPart = getAfter(this.content[end.getLine()], end.getCol());
      this.content.splice(start.getLine(), lineBetween, firstPart + lastPart);
    }
  }
  getBetween(start: Position, end: Position): string {
    if (end.isBefore(start)) {
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
    const toAdd: string[] = text.split('\n');
    if (toAdd.length === 1) {
      this.content[pos.getLine()] = getBefore(line, pos.getCol()) + text + getAfter(line, pos.getCol());
    }
    else {
      this.content.splice(pos.getLine(), 1, getBefore(line, pos.getCol()) + toAdd[0], ...toAdd.slice(1, toAdd.length - 1), toAdd[toAdd.length - 1] + getAfter(line, pos.getCol()));
    }
  }
  getEndLinePos(line: number): Position {
    return new Position(line, this.content[line].length);
  }
  getStartLinePos(line: number): Position {
    return new Position(line, 0);
  }
  getLineCount(): number {
    return this.content.length;
  }
  getContent(): string[] {
    return this.content;
  }
  clampedPosition(pos: Position): Position {
    let y = Math.max(Math.min(pos.getLine(), this.content.length - 1), 0);
    const line = this.content[y];
    let x = Math.max(Math.min(pos.getCol(), line.length), 0);
    return new Position(y, x);
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