import { Position } from './position';

export class Editor {
  private content: string[];
  constructor() {
    this.content = [];
  }
  deleteBetween(start: Position, end: Position): void {
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
  insertAt(pos: Position, text: string): void {
    // TODO
  }
}