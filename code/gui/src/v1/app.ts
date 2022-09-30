import {
  CopyCommand,
  BackspaceCommand,
  MoveCursorCommand,
  MoveEndCursorCommand,
  MoveStartCursorCommand,
  PasteCommand,
  DeleteCommand,
  WriteCommand
} from './commands';
import { Cursor } from './cursor';
import { Editor } from './editor';
import { Position } from './position';

export class Application {
  private editor: Editor;
  private clipboard: string;
  private cursor: Cursor;
  private listeners: (() => void)[] = [];
  constructor() {
    console.log("\nLoading application... vclamp");
    this.clipboard = "";
    this.cursor = new Cursor();
    this.editor = new Editor(this.cursor);
    this.render();
    this.onWrite("Hello World!")
    console.log("Application successfully loaded!\n\n");
  }

  onCopy(): void {
    const command = new CopyCommand(this.cursor, this.editor, this)
    command.execute();

  }
  onPaste(): void {
    const command = new PasteCommand(this.cursor, this.editor, this)
    command.execute();
    this.render();
  }
  onWrite(text: string): void {
    const command = new WriteCommand(this.cursor, this.editor, text)
    command.execute();
    this.render();
  }
  onBackspace(): void {
    const command = new BackspaceCommand(this.cursor, this.editor)
    command.execute();
    this.render();
  }
  onMoveCursor(pos: Position): void {
    const command = new MoveCursorCommand(this.cursor, this.editor.clampedPosition(pos))
    command.execute();
    this.render();
  }
  onMoveStartCursor(pos: Position): void {
    const command = new MoveStartCursorCommand(this.cursor, this.editor.clampedPosition(pos))
    command.execute();
    this.render();
  }
  onMoveEndCursor(pos: Position): void {
    const command = new MoveEndCursorCommand(this.cursor, this.editor.clampedPosition(pos))
    command.execute();
    this.render();
  }
  onDelete(): void {
    const command = new DeleteCommand(this.cursor, this.editor)
    command.execute();
    this.render();
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

  addRenderListener(listener: () => void): void {
    this.listeners.push(listener);
  }
  render(): void {
    this.listeners.forEach(listener => listener());
  }
}

