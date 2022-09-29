import {
  CopyCommand,
  DeleteCommand,
  MoveCursorCommand,
  MoveEndCursorCommand,
  MoveStartCursorCommand,
  PasteCommand,
  SupprCommand,
  WriteCommand
} from './commands';
import { Cursor } from './cursor';
import { Editor } from './editor';
import { Position } from './position';

export class Application {
  private editor: Editor;
  private clipboard: string;
  private cursor: Cursor;
  constructor() {
    this.editor = new Editor();
    this.clipboard = "";
    this.cursor = new Cursor();
    this.render();
  }

  onCopy(): void {
    new CopyCommand(this.cursor, this.editor, this).execute();
  }
  onPaste(): void {
    new PasteCommand(this.cursor, this.editor, this).execute();
  }
  onWrite(text: string): void {
    new WriteCommand(this.cursor, this.editor, text).execute();
  }
  onDelete(): void {
    new DeleteCommand(this.cursor, this.editor).execute();
  }
  onMoveCursor(position: Position): void {
    new MoveCursorCommand(this.cursor, position).execute();
  }
  onMoveStartCursor(pos : Position): void {
    new MoveStartCursorCommand(this.cursor, pos).execute();
  }
  onMoveEndCursor(pos : Position): void {
    new MoveEndCursorCommand(this.cursor, pos).execute();
  }
  onSuppr(): void {
    new SupprCommand(this.cursor, this.editor).execute();
  }

  // GETTERS
  getEditor(): Editor {
    return this.editor;
  }
  getClipboard(): string {
    return this.clipboard;
  }
  getCursor(): Cursor {
    return this.cursor;
  }

  setClipboard(clip: string): void {
    this.clipboard = clip;
  }

  render(): void {
    // TODO
  }
}

