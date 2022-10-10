import {
  CopyCommand,
  BackspaceCommand,
  MoveCursorCommand,
  MoveEndCursorCommand,
  MoveStartCursorCommand,
  DeleteCommand,
  WriteCommand,
  UndoableCommand,
  Command
} from './commands';
import { Cursor } from './cursor';
import { Editor } from './editor';
import { Position } from './position';

export class Application {
  private editor: Editor;
  private clipboard: string = "";
  private cursor: Cursor;
  private listeners: (() => void)[] = []; // called on render (used for the UI)
  private history: UndoableCommand[] = [];
  private historyIndex: number = 0;
  private macro: Command[] = [];
  private isRecordingMacro: boolean;
  constructor() {
    console.log("\nLoading application...");
    this.cursor = new Cursor();
    this.editor = new Editor();
    this.render();
    console.log("Application successfully loaded!\n\n");
  }

  onCopy(): void {
    const command = new CopyCommand(this.cursor, this.editor, this)
    if (this.isRecordingMacro)
      this.macro.push(command)
    command.execute();
  }
  onPaste(): void {
    const command = new WriteCommand(this.cursor, this.editor, this.clipboard)
    if (this.isRecordingMacro)
      this.macro.push(command)
    command.execute();
    this.addToHistory(command);
    this.render();
  }
  onWrite(text: string): void {
    const command = new WriteCommand(this.cursor, this.editor, text)
    if (this.isRecordingMacro)
      this.macro.push(command)
    command.execute();
    this.addToHistory(command);
    this.render();
  }
  onBackspace(): void {
    const command = new BackspaceCommand(this.cursor, this.editor)
    if (this.isRecordingMacro)
      this.macro.push(command)
    command.execute();
    this.addToHistory(command);
    this.render();
  }
  onDelete(): void {
    const command = new DeleteCommand(this.cursor, this.editor)
    if (this.isRecordingMacro)
      this.macro.push(command)
    command.execute();
    this.addToHistory(command);
    this.render();
  }
  onMoveCursor(pos: Position): void {
    const command = new MoveCursorCommand(this.cursor, this.editor.clampedPosition(pos))
    if (this.isRecordingMacro)
      this.macro.push(command)
    command.execute();
    this.render();
  }
  onMoveStartCursor(pos: Position): void {
    const command = new MoveStartCursorCommand(this.cursor, this.editor.clampedPosition(pos))
    if (this.isRecordingMacro)
      this.macro.push(command)
    command.execute();
    this.render();
  }
  onMoveEndCursor(pos: Position): void {
    const command = new MoveEndCursorCommand(this.cursor, this.editor.clampedPosition(pos))
    if (this.isRecordingMacro)
      this.macro.push(command)
    command.execute();
    this.render();
  }
  onCut(): void {
    const copyCommand = new CopyCommand(this.cursor, this.editor, this)
    if (this.isRecordingMacro)
      this.macro.push(copyCommand)
    copyCommand.execute();
    const deleteCommand = new DeleteCommand(this.cursor, this.editor)
    if (this.isRecordingMacro)
      this.macro.push(deleteCommand)
    deleteCommand.execute();
    this.addToHistory(deleteCommand);
    this.render();
  }

  onUndo(): void {
    if (this.historyIndex > 0) {
      this.history[--this.historyIndex].undo();
      this.render();
    }
  }

  onRedo(): void {
    if (this.historyIndex < this.history.length) {
      this.history[this.historyIndex++].execute();
      this.render();
    }
  }

  onStartRecordingMacro(): void {
    this.macro = [];
    this.isRecordingMacro = true;
  }

  onStopRecordingMacro(): void {
    this.isRecordingMacro = false;
  }

  onPlayMacro(): void {
    this.macro.forEach(command => {
      if (command instanceof UndoableCommand)
        this.addToHistory(command);
      command.execute()
    });
    this.render();
  }


  // For the UI to draw the history
  getFormatedHistory() {
    return this.history.map((command, index) => {
      return { name: command.getName(), done: index < this.historyIndex }
    })
  }

  // GETTERS
  getEditor(): Editor {
    return this.editor;
  }

  getClipboard(): string {
    return this.clipboard;
  }

  setClipboard(clip: string): void {
    navigator.clipboard.writeText(clip);
    this.clipboard = clip;
  }

  getCursor(): Cursor {
    return this.cursor;
  }

  getMacroInfo() {
    console.log(this.macro.length);

    return { isRecording: this.isRecordingMacro, length: this.macro.length, list: this.macro.map(command => command.getName()) }
  }

  addRenderListener(listener: () => void): void {
    this.listeners.push(listener);
  }
  private render(): void {
    this.listeners.forEach(listener => listener());
  }


  private addToHistory(command: UndoableCommand): void {
    // remove all commands after the current index
    this.history = this.history.slice(0, this.historyIndex);

    // add the commend at the current index
    this.history.push(command);
    this.historyIndex++;
  }
}

