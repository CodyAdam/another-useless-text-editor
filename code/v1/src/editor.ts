import { Position } from './position';

export class Editor {
  private content: string[];
  constructor() {
    this.content = [];
  }
  deleteBetween(start: Position, end: Position): void {
    const allLinesIndexes = range(start.getLine(), end.getLine() + 1);
    if (allLinesIndexes.length === 1) {
        const line = this.content[start.getLine()];
        this.content[start.getLine()] = getBefore(line, start.getCol()) + getAfter(line, end.getCol());
    }
    else {
        const firstPart = getBefore(this.content[start.getLine()], start.getCol());
        const lastPart = getAfter(this.content[end.getLine()], end.getCol());
        this.content.splice( start.getLine(), allLinesIndexes.length, firstPart + lastPart);
    }
  }
  deleteBefore(position: Position): void {
    const line = this.content[position.getLine()];
        const x = position.getCol();
        this.content[position.getLine()] = getBefore(line, x - 1) + getAfter(line, x);
  }
  deleteAfter(position: Position): void {
    const line = this.content[position.getLine()];
    const x = position.getCol();
    this.content[position.getLine()] = getBefore(line, x) + getAfter(line, x + 1);
  }
  getBetween(start: Position, end: Position): string {
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
    // TODO
  }
}


// Helper function 

function range(start: number, end: number): number[] {
  const result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
}

function getBetween(string: string, indexStart: number, indexEnd: number): string {
  return string.substring(indexStart, indexEnd);
}

function getAfter(string: string, index: number): string {
  if (index < 0) 
    return string;
  return string.slice(index);
}

function getBefore(string: string, index: number): string {
  if (index < 0) 
    return "";
  return string.slice(0, index);
}