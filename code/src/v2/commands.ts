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

abstract class UndoableCommand extends Command {
  protected deletedText: string;

  constructor(name: string) {
    super(name);
    this.deletedText = '';
  }

  abstract undo(): void;
  
}

export class BackspaceCommand extends UndoableCommand {
  private cur: Cursor;
  private edit: Editor;
  private startPositon: Position;
  constructor(cur: Cursor, edit: Editor) {
    super('Delete');
    this.cur = cur;
    this.edit = edit;
    this.startPositon = this.cur.getStart();
  }
  execute(): void {
    console.log('Backspace ' + this.cur.getStart().toString());
    if (this.cur.isSelection()){
      this.deletedText = this.edit.getBetween(this.cur.getStart(), this.cur.getEnd());
      this.edit.deleteBetween(this.cur.getStart(), this.cur.getEnd());
      this.cur.setEnd(this.cur.getStart());
    } else {
      const curstartcol = this.cur.getStart().getCol();
      const curstartrow = this.cur.getStart().getLine();
      this.deletedText = this.edit.getBetween(this.cur.getStart(), this.edit.clampedPosition(new Position(curstartrow, curstartcol - 1)));
      this.edit.deleteBefore(this.cur.getStart());
    }
  }

   undo(): void {
    //TODO
    console.log('Undo Backspace ' + this.cur.getStart().toString());
    this.edit.insertAt(this.startPositon, this.deletedText);
  }
}

export class WriteCommand extends UndoableCommand {
  private text: string;
  private cur: Cursor;
  private edit: Editor;
  private startPositon: Position;
  constructor(cur: Cursor, edit: Editor, text: string) {
    super('Write');
    this.cur = cur;
    this.edit = edit;
    this.text = text;
    this.startPositon = this.cur.getStart();
  }
  execute(): void {
    console.log('Write ' + this.cur.getStart().toString() + ' ' + this.text);
    if (this.cur.isSelection()) {
      this.deletedText = this.edit.getBetween(this.cur.getStart(), this.cur.getEnd());
      this.edit.deleteBetween(this.cur.getStart(), this.cur.getEnd());
      this.cur.setEnd(this.cur.getStart());
    }
    this.edit.insertAt(this.cur.getStart(), this.text);
  }

   undo(): void {
    //TODO
    console.log('Undo Write ' + this.cur.getStart().toString() + ' ' + this.text);
    this.edit.deleteBefore(this.startPositon);
    this.edit.insertAt(this.startPositon, this.deletedText);
  }
}


export class DeleteCommand extends UndoableCommand {
  private cur: Cursor;
  private edit: Editor;
  private startPositon: Position;
  constructor(cur: Cursor, edit: Editor) {
    super('Delete');
    this.cur = cur;
    this.edit = edit;
    this.startPositon = this.cur.getStart();
  }
  execute(): void {
    console.log('Delete ' + this.cur.getStart().toString());
    if (this.cur.isSelection()) {
      this.deletedText = this.edit.getBetween(this.cur.getStart(), this.cur.getEnd());
      this.edit.deleteBetween(this.cur.getStart(), this.cur.getEnd());
      this.cur.setEnd(this.cur.getStart());
    } else {
      const curstartcol = this.cur.getStart().getCol();
      const curstartrow = this.cur.getStart().getLine();
      this.deletedText = this.edit.getBetween(this.cur.getStart(), this.edit.clampedPosition(new Position(curstartrow, curstartcol + 1)));
      this.edit.deleteAfter(this.cur.getEnd());
    }
  }

  undo(): void {
    //TODO
    console.log('Undo Delete ' + this.cur.getStart().toString());
    this.edit.insertAt(this.startPositon, this.deletedText);
  }
}

export class PasteCommand extends UndoableCommand {
  private cur: Cursor;
  private edit: Editor;
  private app: Application;
  private startPositon: Position;
  private endPosition: Position;
  constructor(cur: Cursor, edit: Editor, app: Application) {
    super('Paste');
    this.cur = cur;
    this.edit = edit;
    this.app = app;
    this.startPositon = this.cur.getStart();
    this.endPosition = this.cur.getEnd();
  }
  execute(): void {
    const clip = this.app.getClipboard();
    console.log('Paste ' + this.cur.getStart().toString() + ' ' + clip);
    if (this.cur.isSelection()) {
      this.deletedText = this.edit.getBetween(this.cur.getStart(), this.cur.getEnd());
      this.edit.deleteBetween(this.cur.getStart(), this.cur.getEnd());
      this.cur.setEnd(this.cur.getStart());
    }
    this.edit.insertAt(this.cur.getStart(), clip);
    this.endPosition = this.cur.getEnd();
  }

  undo(): void {
    //TODO
    console.log('Undo Paste ' + this.cur.getStart().toString() + ' ' + this.app.getClipboard());
    this.edit.deleteBetween(this.startPositon, this.endPosition);
    this.edit.insertAt(this.startPositon, this.deletedText);
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
    console.log('Copy ' + this.cur.getStart().toString() + ' ' + this.cur.getEnd().toString() + ' ' + newClip);
    
    this.app.setClipboard(newClip);
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
    console.log('MoveCursor ' + this.cur.getStart().toString() + ' ' + this.pos.toString());
    this.cur.setStart(this.pos);
    this.cur.setEnd(this.pos);
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
    console.log('MoveStartCursor ' + this.cur.getStart().toString() + ' ' + this.pos.toString());
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
    console.log('MoveEndCursor ' + this.cur.getEnd().toString() + ' ' + this.pos.toString());
    this.cur.setEnd(this.pos);
  }
}
