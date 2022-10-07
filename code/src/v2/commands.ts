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

export abstract class UndoableCommand extends Command {
  constructor(name: string) {
    super(name);
  }
  abstract undo(): void;
}

export class BackspaceCommand extends UndoableCommand {
  private cur: Cursor;
  private edit: Editor;
  private startPositon: Position;
  private deletedText: string;
  constructor(cur: Cursor, edit: Editor) {
    super('Delete');
    this.cur = cur;
    this.edit = edit;
    this.deletedText = "";
    this.startPositon = this.cur.getStart();
  }
  execute(): void {
    console.log('Backspace ' + this.cur.getStart().toString());
    if (this.cur.isSelection()) {
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
  private deletedText: string | null;
  private beforeCur: Cursor | null;
  private afterPos: Position | null;
  constructor(cur: Cursor, edit: Editor, text: string) {
    super(`Write ${text}`);
    this.cur = cur;
    this.edit = edit;
    this.text = text;
    this.deletedText = null;
    this.beforeCur = null;
    this.afterPos = null;
  }
  execute(): void {
    // INIT CURSOR POS
    if (this.beforeCur)
      this.cur.copy(this.beforeCur);
    else
      this.beforeCur = Cursor.from(this.cur);

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
      this.deletedText = this.edit.getBetween(start, end);
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
    this.afterPos = this.cur.getStart()
  }

  undo(): void {
    if (!this.beforeCur || !this.afterPos) {
      console.error("undo called before execute")
      return
    }

    // ORDER START END
    let start = this.beforeCur.getStart()
    let end = this.beforeCur.getEnd();
    if (end.isBefore(start)) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    // DELETE AND WRITE
    this.edit.deleteBetween(start, this.afterPos);
    if (this.deletedText)
      this.edit.insertAt(start, this.deletedText);
    
    // SET PREVIOUS CURSOR
    this.cur.copy(this.beforeCur);
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
