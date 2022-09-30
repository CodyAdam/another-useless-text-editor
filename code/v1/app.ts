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
    console.log("\nLoading application...");
    this.editor = new Editor();
    this.clipboard = "";
    this.cursor = new Cursor();
    this.render();
    console.log("Application successfully loaded!\n\n");
  }

  onCopy(): void {
    const command = new CopyCommand(this.cursor, this.editor, this)
    command.execute();
    console.log(command.getName());
    
  }
  onPaste(): void {
    const command = new PasteCommand(this.cursor, this.editor, this)
    command.execute();
    console.log(command.getName());
    this.render();
  }
  onWrite(text: string): void {
    const command = new WriteCommand(this.cursor, this.editor, text)
    command.execute();
    console.log(command.getName());
    this.render();
  }
  onBackspace(): void {
    const command = new BackspaceCommand(this.cursor, this.editor)
    command.execute();
    console.log(command.getName());
    this.render();
  }
  onMoveCursor(position: Position): void {
    const command = new MoveCursorCommand(this.cursor, position)
    command.execute();
    console.log(command.getName());
    this.render();
  }
  onMoveStartCursor(pos : Position): void {
    const command = new MoveStartCursorCommand(this.cursor, pos)
    command.execute();
    console.log(command.getName());
    this.render();
  }
  onMoveEndCursor(pos : Position): void {
    const command = new MoveEndCursorCommand(this.cursor, pos)
    command.execute();
    console.log(command.getName());
    this.render();
  }
  onDelete(): void {
    const command = new DeleteCommand(this.cursor, this.editor)
    command.execute();
    console.log(command.getName());
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
    console.log("Rendered!");
  }
}

