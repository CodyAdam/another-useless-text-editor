import { Application } from './app';
import { Cursor } from './cursor';
import { Editor } from './editor';
import { Position } from './position';

abstract class Command {
  private name: string;
  constructor(name: string) {
    this.name = name;
  }

  abstract execute(): void;

  getName(): string {
    return this.name;
  }
}

export class DeleteCommand extends Command {
  private cur: Cursor;
  private edit: Editor;
  constructor(cur: Cursor, edit: Editor) {
    super('Delete');
    this.cur = cur;
    this.edit = edit;
  }
  execute(): void {
    if (this.cur.isSelection()){
      this.edit.deleteBetween(this.cur.getStart(), this.cur.getEnd());
      this.cur.setEnd(this.cur.getStart());
    } else {
      this.edit.deleteBefore(this.cur.getStart());
    }
  }
}

export class WriteCommand extends Command {
  private text: string;
  private cur: Cursor;
  private edit: Editor;
  constructor(cur: Cursor, edit: Editor, text: string) {
    super('Write');
    this.cur = cur;
    this.edit = edit;
    this.text = text;
  }
  execute(): void {
    if (this.cur.isSelection()) {
      this.edit.deleteBetween(this.cur.getStart(), this.cur.getEnd());
      this.cur.setEnd(this.cur.getStart());
    }
    this.edit.insertAt(this.cur.getStart(), this.text);
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
    this.app.setClipboard(newClip);
  }
}

export class PasteCommand extends Command {
  private cur: Cursor;
  private edit: Editor;
  private app: Application;
  constructor(cur: Cursor, edit: Editor, app: Application) {
    super('Paste');
    this.cur = cur;
    this.edit = edit;
    this.app = app;
  }
  execute(): void {
    const clip = this.app.getClipboard();
    if (this.cur.isSelection()) {
      this.edit.deleteBetween(this.cur.getStart(), this.cur.getEnd());
      this.cur.setEnd(this.cur.getStart());
    }
    this.edit.insertAt(this.cur.getStart(), clip);
  }
}

export class MoveCursorCommand extends Command {
  private cur: Cursor;
  private pos: Position;
  constructor(cur: Cursor, pos: Position) {
    super('MoveCursor');
    this.cur = cur;
    this.pos = pos;
  }
  execute(): void {
    this.cur.setStart(this.pos);
    this.cur.setEnd(this.pos);
  }
}

export class SupprCommand extends Command {
  private cur: Cursor;
  private edit: Editor;
  constructor(cur: Cursor, edit: Editor) {
    super('Suppr');
    this.cur = cur;
    this.edit = edit;
  }
  execute(): void {
    if (this.cur.isSelection()) {
      this.edit.deleteBetween(this.cur.getStart(), this.cur.getEnd());
      this.cur.setEnd(this.cur.getStart());
    } else {
      this.edit.deleteAfter(this.cur.getEnd());
    }
  }
}

export class MoveStartCursorCommand extends Command {
  private pos: Position;
  private cur: Cursor;
  constructor(cur: Cursor, pos: Position) {
    super('MoveStartCursor');
    this.cur = cur;
    this.pos = pos;
  }
  execute(): void {
    this.cur.setStart(this.pos);
  }
}

export class MoveEndCursorCommand extends Command {
  private pos: Position;
  private cur: Cursor;
  constructor(cur: Cursor, pos: Position) {
    super('MoveEndCursor');
    this.cur = cur;
    this.pos = pos;
  }
  execute(): void {
    this.cur.setEnd(this.pos);
  }
}
