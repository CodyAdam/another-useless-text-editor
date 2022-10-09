import { Application } from './app';
import { Cursor } from './cursor';
import { Editor } from './editor';
import { Position } from './position';

export abstract class Command {
  private name: string;
  constructor(name: string) {
    this.name = name;
  }

  abstract execute(): void;

  getName(): string {
    return this.name;
  }
  setName(name: string): void {
    this.name = name;
  }
}

export class WriteCommand extends Command {
  private text: string;
  private cur: Cursor;
  private edit: Editor;
  constructor(cur: Cursor, edit: Editor, text: string) {
    super(`${text.length>1 ? "Paste": "Write"} "${text.replace(/\n/g, "\\n")}"`);
    this.cur = cur;
    this.edit = edit;
    this.text = text;
  }
  execute(): void {
    // ORDER START END
    let start = this.cur.getStart()
    let end = this.cur.getEnd();
    if (end.isBefore(start)) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    // DELETE SELECTION
    if (this.cur.isSelection()) {
      this.edit.deleteBetween(start, end);
      this.cur.setEnd(start);
    }

    // WHRITE
    const textByLines = this.text.split("\n");
    this.edit.insertAt(this.cur.getStart(), this.text);

    //MOVE CURSOR
    if (textByLines.length == 1)
      this.cur.setStart(new Position(start.getLine(), start.getCol() + textByLines[0].length))
    else
      this.cur.setStart(new Position(start.getLine() + textByLines.length - 1, textByLines[textByLines.length - 1].length))
    this.cur.setEnd(this.cur.getStart())
  }
}

export class BackspaceCommand extends Command {
  private cur: Cursor;
  private edit: Editor;
  private deletedText: string | null;
  constructor(cur: Cursor, edit: Editor) {
    super(`Delete`);
    this.cur = cur;
    this.edit = edit;
    this.deletedText = null;
  }
  execute(): void {
    // ORDER START END
    let start = this.cur.getStart()
    let end = this.cur.getEnd();
    if (end.isBefore(start)) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    // DELETE SELECTION OR PREVIOUS CHAR
    if (!this.cur.isSelection()) {
      const x = start.getCol();
      const y = start.getLine();9
      if (x > 0)
        start = new Position(start.getLine(), start.getCol() - 1);
      else if (y > 0)
        start = this.edit.getEndLinePos(y - 1);
    }
    this.deletedText = this.edit.getBetween(start, end);
    this.setName(`Delete "${this.deletedText.replace(/\n/g, "\\n")}"`);
    this.edit.deleteBetween(start, end);

    // UPDATE CURSOR
    this.cur.setStart(start);
    this.cur.setEnd(start);
  }
}


export class DeleteCommand extends Command {
  private cur: Cursor;
  private edit: Editor;
  private deletedText: string | null;
  constructor(cur: Cursor, edit: Editor) {
    super(`Delete`);
    this.cur = cur;
    this.edit = edit;
    this.deletedText = null;
  }
  execute(): void {
    // ORDER START END
    let start = this.cur.getStart()
    let end = this.cur.getEnd();
    if (end.isBefore(start)) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    // DELETE SELECTION OR PREVIOUS CHAR
    if (!this.cur.isSelection()) {
      const x = start.getCol();
      const y = start.getLine();
      if (x < this.edit.getEndLinePos(y).getCol())
        end = new Position(start.getLine(), start.getCol() + 1);
      else if (y < this.edit.getLineCount() - 1)
        end = this.edit.getStartLinePos(y + 1);
    }
    this.deletedText = this.edit.getBetween(start, end);
    this.setName(`Delete "${this.deletedText.replace(/\n/g, "\\n")}"`);
    this.edit.deleteBetween(start, end);

    // UPDATE CURSOR
    this.cur.setStart(start);
    this.cur.setEnd(start);
  }
}


export class CopyCommand extends Command {
  private cur: Cursor;
  private edit: Editor;
  private app: Application;
  constructor(cur: Cursor, edit: Editor, app: Application) {
    super('Copy');
    this.cur = cur;
    this.edit = edit;
    this.app = app;
  }
  execute(): void {
    const newClip = this.edit.getBetween(this.cur.getStart(), this.cur.getEnd());
    this.setName(`Copy "${newClip}"`)
    this.app.setClipboard(newClip);
  }
}

export class MoveCursorCommand extends Command {
  private cur: Cursor;
  private pos: Position;
  constructor(cur: Cursor, pos: Position) {
    super('Move cursor');
    this.cur = cur;
    this.pos = pos;
  }
  execute(): void {
    this.cur.setStart(this.pos);
    this.cur.setEnd(this.pos);
    this.setName(`Move to ${this.pos.toString()}`)
  }
}

export class MoveStartCursorCommand extends Command {
  private pos: Position;
  private cur: Cursor;
  constructor(cur: Cursor, pos: Position) {
    super('Move start cursor');
    this.cur = cur;
    this.pos = pos;
  }
  execute(): void {
    this.cur.setStart(this.pos);
    this.setName(`Move to ${this.pos.toString()}`)
  }
}

export class MoveEndCursorCommand extends Command {
  private pos: Position;
  private cur: Cursor;
  constructor(cur: Cursor, pos: Position) {
    super('Move end cursor');
    this.cur = cur;
    this.pos = pos;
  }
  execute(): void {
    this.cur.setEnd(this.pos);
    this.setName(`Move end to ${this.pos.toString()}`)
  }
}
