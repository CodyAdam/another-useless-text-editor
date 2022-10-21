
import {
  Scene,
  Color,
  Mesh,
  MeshNormalMaterial,
  BoxGeometry,
  PerspectiveCamera,
  WebGLRenderer,
  MeshPhongMaterial,
  PointLight,
  Vector3,
  Clock,
  AmbientLight,
  DirectionalLight,
  MOUSE,
} from "three";
import { TextGeometry } from './utils/TextGeometry';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "stats.js";
import { Font } from './utils/FontLoader';
import Application from "./v2";
import { GUI } from 'dat.gui'
import font from "./fonts/600.json"
import { Position } from './v2/position';
import { lerp } from 'three/src/math/MathUtils';

const H = 152;
const W = 72.25;
const CUR_X_OFFSET = 0;
const CUR_Y_OFFSET = 30;

type Char = {
  text: string,
  mesh: Mesh,
  seen: boolean
}

class Main {
  /** The scene */
  public scene: Scene = new Scene();

  /** The camera */
  public camera: PerspectiveCamera;

  /** The renderer */
  public renderer: WebGLRenderer = new WebGLRenderer({
    powerPreference: "low-power",
    antialias: true
  });

  /** The orbit controls */
  public controls: OrbitControls;

  /** The stats */
  public stats: Stats = new Stats();

  public text: Map<Position, Char> = new Map();

  public cursorStart: Mesh = this.createCursorMesh();
  public cursorEnd: Mesh = this.createCursorMesh();

  public font: Font = new Font(font);

  public app: Application = new Application();

  public gui: GUI;

  public lastText: string;

  public modifiers = {
    shift: false,
    ctrl: false
  };
  public mouseButtons = {
    left: false,
    right: false,
    middle: false
  };

  public animateCursor: Boolean = true;
  public autoMove: Boolean = true;
  public animateSelection: Boolean = true;
  public animateWrite: Boolean = true;
  public animateDelete: Boolean = true;

  public pointLightEnd: PointLight = new PointLight(0x03fc52, 5, 700);
  public pointLightStart: PointLight = new PointLight(0xff0000, 5, 700);

  public cache: Map<string, Mesh> = new Map();
  public clock: Clock = new Clock(true);

  public historyDom: HTMLElement | null;

  public macro = {
    info: document.getElementById("macro-info"),
    start: document.getElementById("macro-start"),
    end: document.getElementById("macro-end"),
    play: document.getElementById("macro-play"),
    list: document.getElementById("macro"),
  }

  constructor() {
    // Init scene. 
    this.scene.background = new Color("#191919");


    // Init camera.
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new PerspectiveCamera(50, aspect, 1, 100000);
    this.camera.position.z = 1000;

    // Init renderer.
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setAnimationLoop(() => this.animate());
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener("resize", () => this.onResize());

    // Init stats.
    document.body.appendChild(this.stats.dom);

    // Init orbit controls.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();
    this.controls.addEventListener("change", () => this.render());

    this.cursorStart.position.set(0, 30, 10);
    this.cursorEnd.position.set(0, 30, 10);
    this.scene.add(this.cursorStart);
    this.scene.add(this.cursorEnd)
    this.historyDom = document.getElementById("history");

    window.addEventListener('keydown', (e) => this.onKeyPress(e));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift')
        this.modifiers.shift = true;
      if (e.key === "Control" || e.key === "Command")
        this.modifiers.ctrl = true;
    })
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift')
        this.modifiers.shift = false;
      if (e.key === "Control" || e.key === "Command")
        this.modifiers.ctrl = false;
    })
    window.addEventListener('mousedown', (e) => {
      if (e.button === MOUSE.LEFT)
        this.mouseButtons.left = true;
      if (e.button === MOUSE.RIGHT)
        this.mouseButtons.right = true;
      if (e.button === MOUSE.MIDDLE)
        this.mouseButtons.middle = true;
    })
    window.addEventListener('mouseup', (e) => {
      if (e.button === MOUSE.LEFT)
        this.mouseButtons.left = false;
      if (e.button === MOUSE.RIGHT)
        this.mouseButtons.right = false;
      if (e.button === MOUSE.MIDDLE)
        this.mouseButtons.middle = false;
    })

    this.createGui();


    this.pointLightStart.position.set(0, 0, 500);
    this.scene.add(this.pointLightStart);
    this.pointLightEnd.position.set(0, 0, 500);
    this.scene.add(this.pointLightEnd);
    const directionnal = new DirectionalLight(0xfcd703, .8);
    directionnal.position.set(0, 1, 1);
    this.scene.add(directionnal);
    const ambient = new AmbientLight(0xe39cff, 0.2);
    this.scene.add(ambient);

    this.app.addRenderListener(() => this.render());
    this.app.onWrite("Another useless\ntext editor!");
    this.app.onMoveStartCursor(new Position(0, 15));
    this.app.onMoveEndCursor(new Position(0, 8));

    // MACROS
    this.macro.start?.addEventListener("click", () => {
      this.app.onStartRecordingMacro();
      this.updateMacroUI();
    })
    this.macro.end?.addEventListener("click", () => {
      this.app.onStopRecordingMacro();
      this.updateMacroUI();
    })
    this.macro.play?.addEventListener("click", () => {
      this.app.onPlayMacro();
      this.updateMacroUI();
    })

    this.render();
    console.log(this);
  }

  private createGui() {
    this.gui = new GUI();

    const perfFold = this.gui.addFolder("Performance");
    perfFold.add({
      low: () => {
        this.animateCursor = false; this.autoMove = false; this.animateSelection = false;
        this.text.forEach((char, pos) => {
          char.mesh.position.setY(-pos.getLine() * H);
          char.mesh.rotation.set(0, 0, 0);
        });
        this.render();
      }
    }, "low").name("Performance : Low")
    perfFold.add({ low: () => { this.animateCursor = true; this.autoMove = true; this.animateSelection = true } }, "low").name("Performance : High")

    perfFold.open();
    const cursorFold = this.gui.addFolder("Cursor");
    cursorFold.add(this.cursorStart.scale, 'x', 1, 100, .1).name('scale x').onChange(() => { this.cursorEnd.scale.x = this.cursorStart.scale.x; this.render() });
    cursorFold.add(this.cursorStart.scale, 'y', .1, 5, .1).name('scale y').onChange(() => { this.cursorEnd.scale.y = this.cursorStart.scale.y; this.render() });
    cursorFold.add(this.cursorStart.scale, 'z', 1, 5, .1).name('scale z').onChange(() => { this.cursorEnd.scale.z = this.cursorStart.scale.z; this.render() });
    cursorFold.add(this, "animateCursor").name('animate').onChange(() => this.render());
    const cameraFold = this.gui.addFolder("Camera");
    cameraFold.add({
      reset: () => {
        this.camera.position.x = this.cursorEnd.position.x;
        this.camera.position.y = this.cursorEnd.position.y;
        this.camera.position.z = 1000;
        this.camera.lookAt(this.cursorEnd.position);
        this.render();
      }
    }, "reset").name('reset position').onChange(() => this.render())
    cameraFold.add(this, "autoMove").name('automatic').onChange(() => this.render());
    const selectionFold = this.gui.addFolder("Selection");
    selectionFold.add(this, "animateSelection").name('animate').onChange(() => this.render());
  }

  private onKeyPress(e: KeyboardEvent) {
    e.preventDefault();
    if (e.key === "Home") {
      const current = this.app.getCursor().getEnd()
      if (this.modifiers.shift) {
        this.app.onMoveEndCursor(this.app.getEditor().getStartLinePos(current.getLine()));
      }
      else this.app.onMoveCursor(this.app.getEditor().getStartLinePos(current.getLine()));
    }
    if (e.key === "End") {
      const current = this.app.getCursor().getEnd()
      if (this.modifiers.shift) {
        this.app.onMoveEndCursor(this.app.getEditor().getEndLinePos(current.getLine()));
      }
      else this.app.onMoveCursor(this.app.getEditor().getEndLinePos(current.getLine()));
    }
    if (e.key === "PageUp") {
      const current = this.app.getCursor().getEnd()
      if (this.modifiers.shift)
        this.app.onMoveEndCursor(new Position(0, current.getCol()));
      else this.app.onMoveCursor(new Position(0, current.getCol()));
    }
    if (e.key === "PageDown") {
      const current = this.app.getCursor().getEnd()
      const endIndex = this.app.getEditor().getLineCount() - 1;
      if (this.modifiers.shift) this.app.onMoveEndCursor(new Position(endIndex, current.getCol()));
      else this.app.onMoveCursor(new Position(endIndex, current.getCol()));
    }
    if (e.key === 'Backspace') {
      this.app.onBackspace();
    } else if (e.key === "Delete") {
      this.app.onDelete();
    }
    else if (e.key === "ArrowLeft") {
      const current = this.app.getCursor().getEnd()
      if (this.modifiers.shift) {
        this.app.onMoveEndCursor(new Position(current.getLine(), current.getCol() - 1))
      }
      else this.app.onMoveCursor(new Position(current.getLine(), current.getCol() - 1));
    }
    else if (e.key === "ArrowRight") {
      const current = this.app.getCursor().getEnd()
      if (this.modifiers.shift) {
        this.app.onMoveEndCursor(new Position(current.getLine(), current.getCol() + 1))
      }
      else this.app.onMoveCursor(new Position(current.getLine(), current.getCol() + 1));
    }
    else if (e.key === "ArrowUp") {
      const current = this.app.getCursor().getEnd()
      if (this.modifiers.shift) {
        this.app.onMoveEndCursor(new Position(current.getLine() - 1, current.getCol()))
      }
      else this.app.onMoveCursor(new Position(current.getLine() - 1, current.getCol()));
    }
    else if (e.key === "ArrowDown") {
      const current = this.app.getCursor().getEnd()
      if (this.modifiers.shift) {
        this.app.onMoveEndCursor(new Position(current.getLine() + 1, current.getCol()))
      }
      else this.app.onMoveCursor(new Position(current.getLine() + 1, current.getCol()));
    }
    else if (e.key === "Enter") {
      this.app.onWrite("\n");
    }
    else if (e.key.length === 1) {
      if (this.modifiers.ctrl) {
        if (e.key === "c")
          this.app.onCopy();
        else if (e.key === "v")
          this.app.onPaste();
        else if (e.key === "x")
          this.app.onCut();
        else if (e.key === "a") {
          this.app.onMoveStartCursor(new Position(0, 0));
          this.app.onMoveEndCursor(new Position(99999, 99999));
        } else if (e.key === "z") {
          this.app.onUndo();
        } else if (e.key === "y") {
          this.app.onRedo();
        }
      }
      else
        this.app.onWrite(e.key);
    }
    this.updateMacroUI();
  }

  private render() {
    //Update the text

    const content = this.app.getEditor().getContent();
    if (this.lastText !== content.join('\n')) {
      this.lastText = content.join('\n');
      this.text.forEach((char, pos) => {
        char.seen = false;
      });
      content.forEach((line, y) => {
        line.split('').forEach((char, x) => {
          const pos = new Position(y, x);
          const charObj = this.text.get(pos);
          if (charObj) {
            if (charObj.text !== char) {
              this.scene.remove(charObj.mesh);
              const newCharObj = this.getCharMesh(char);
              this.text.set(pos, { text: char, mesh: newCharObj, seen: true });
            }
            charObj.seen = true;
          }
          else {
            const charObj = this.getCharMesh(char).clone();
            charObj.position.setX(x * W);
            charObj.position.setY(-y * H);
            this.text.set(pos, { text: char, mesh: charObj, seen: true });
            this.scene.add(charObj);
          }
        });
      });

      this.text.forEach((char, pos) => {
        if (!char.seen) {
          this.scene.remove(char.mesh);
          this.text.delete(pos);
        }
      });

    }

    //Update the cursor
    if (!this.animateCursor) {
      const startCur = this.app.getCursor().getStart();
      const endCur = this.app.getCursor().getEnd();
      this.cursorStart.position.setX(startCur.getCol() * W + CUR_X_OFFSET);
      this.cursorStart.position.setY(-startCur.getLine() * H + CUR_Y_OFFSET);
      this.cursorEnd.position.setX(endCur.getCol() * W + CUR_X_OFFSET);
      this.cursorEnd.position.setY(-endCur.getLine() * H + CUR_Y_OFFSET);
      // update light position on cursor
      this.pointLightEnd.position.setX(this.cursorEnd.position.x)
      this.pointLightEnd.position.setY(this.cursorEnd.position.y)
      this.pointLightStart.position.setX(this.cursorStart.position.x)
      this.pointLightStart.position.setY(this.cursorStart.position.y)
    }


    if (!this.animateSelection) {
      this.text.forEach((char, pos) => {
        if (this.isSelected(pos)) {
          const posOffset = + 10 * Math.sin(char.mesh.position.x / 100 + char.mesh.position.y / 100);
          char.mesh.position.setY(-pos.getLine() * H + posOffset);
          const rotationOffset = 0.1 * Math.sin(char.mesh.position.x / 100);
          char.mesh.rotation.set(rotationOffset, rotationOffset, rotationOffset);
          const material = new MeshPhongMaterial();
          char.mesh.material = material;
        }
        else {
          char.mesh.position.setY(-pos.getLine() * H);
          char.mesh.rotation.set(0, 0, 0);
          char.mesh.material = new MeshNormalMaterial();
        }
      });
    }

    //update history list
    if (this.historyDom) {
      const history = this.app.getFormatedHistory().reverse();
      let text = "";
      history.forEach((command, index) => {
        if (command.done)
          text += command.name.substring(0, 30) + (command.name.length > 29 ? "..." : "") + "<br/>";
        else
          text += `<span class=\"text-gray-500\">${command.name.substring(0, 30) + (command.name.length > 29 ? "..." : "")}</span><br/>`
      })
      this.historyDom.innerHTML = text;
    }

    this.stats.begin();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  }

  private animate() {
    if (!this.autoMove && !this.animateCursor && !this.animateSelection)
      return;
    const dt = this.clock.getDelta();
    this.stats.begin();

    if (this.autoMove && !this.mouseButtons.left && !this.mouseButtons.right && !this.mouseButtons.middle) {
      this.camera.position.setX(lerp(this.camera.position.x, this.cursorEnd.position.x, 0.01))
      this.camera.position.setY(lerp(this.camera.position.y, this.cursorEnd.position.y, 0.01))
      this.controls.update();

      let max = new Vector3();
      const zero = new Vector3(0, 0, 0);
      const count = this.text.size;
      if (count > 0) {
        this.text.forEach((char, pos) => {
          if (char.mesh.position.distanceTo(zero) > max.distanceTo(zero))
            max = char.mesh.position.clone();
        });
        max.divideScalar(2);
        this.controls.target.setX(lerp(this.controls.target.x, max.x, 0.01));
        this.controls.target.setY(lerp(this.controls.target.y, max.y, 0.01));
        this.controls.target.setZ(0);
      }
    }
    if (this.animateCursor) {
      const startCur = this.app.getCursor().getStart();
      const endCur = this.app.getCursor().getEnd();
      this.cursorStart.position.setX(lerp(this.cursorStart.position.x, startCur.getCol() * W + CUR_X_OFFSET, 0.2))
      this.cursorStart.position.setY(lerp(this.cursorStart.position.y, -startCur.getLine() * H + CUR_Y_OFFSET, 0.2))
      this.cursorEnd.position.setX(lerp(this.cursorEnd.position.x, endCur.getCol() * W + CUR_X_OFFSET, 0.2))
      this.cursorEnd.position.setY(lerp(this.cursorEnd.position.y, -endCur.getLine() * H + CUR_Y_OFFSET, 0.2))
      // update light position on cursor
      this.pointLightEnd.position.setX(this.cursorEnd.position.x)
      this.pointLightEnd.position.setY(this.cursorEnd.position.y)
      this.pointLightStart.position.setX(this.cursorStart.position.x)
      this.pointLightStart.position.setY(this.cursorStart.position.y)

      this.pointLightEnd.intensity = this.pointLightStart.position.distanceTo(this.pointLightEnd.position) / 1000;
      this.pointLightStart.intensity = this.pointLightStart.position.distanceTo(this.pointLightEnd.position) / 1000;
      this.pointLightEnd.distance = this.pointLightStart.position.distanceTo(this.pointLightEnd.position);
      this.pointLightStart.distance = this.pointLightStart.position.distanceTo(this.pointLightEnd.position);
    }

    if (this.animateSelection) {
      this.text.forEach((char, pos) => {
        if (this.isSelected(pos)) {
          const posOffset = + 10 * Math.sin(char.mesh.position.x / 100 + char.mesh.position.y / 100 + 4 * this.clock.getElapsedTime());
          char.mesh.position.setY(-pos.getLine() * H + posOffset);
          const rotationOffset = 0.1 * Math.sin(char.mesh.position.x / 100 + 5 * this.clock.getElapsedTime());
          char.mesh.rotation.set(rotationOffset, rotationOffset, rotationOffset);
          const material = new MeshPhongMaterial();
          char.mesh.material = material;
        }
        else {
          char.mesh.position.setY(-pos.getLine() * H);
          char.mesh.rotation.set(0, 0, 0);
          char.mesh.material = new MeshNormalMaterial();
        }
      });
    }

    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  }

  private onResize() {
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.render();
  }

  private createCursorMesh() {
    const material = new MeshNormalMaterial();
    material.opacity = 0.7;
    material.transparent = true;
    const mesh = new Mesh(new BoxGeometry(10, 135, 100), material);
    return mesh;
  }

  private getCharMesh(char: string): Mesh {
    if (this.cache.has(char)) return this.cache.get(char)!;
    const material = new MeshNormalMaterial();
    const mesh = new Mesh(this.geometryFromText(char), material);
    this.cache.set(char, mesh);
    return mesh;
  }

  private geometryFromText(text: string) {
    return new TextGeometry(text, {
      font: this.font,
      size: 80,
      height: 20,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 8,
      bevelSize: 3,
      bevelOffset: 1,
      bevelSegments: 5,
    });
  }

  private isSelected(pos: Position): boolean {
    let start = this.app.getCursor().getStart();
    let end = this.app.getCursor().getEnd();
    if (start.getLine() > end.getLine() || (start.getLine() === end.getLine() && start.getCol() > end.getCol())) {
      const tmp = start;
      start = end;
      end = tmp;
    }
    return (pos.isAfter(start) || pos.isEqual(start)) && (pos.isBefore(end));
  }

  private updateMacroUI() {
    if (!this.macro || !this.macro.list || !this.macro.info || !this.macro.start || !this.macro.end) return;
    const { isRecording, length, list } = this.app.getMacroInfo();
    if (!isRecording) {
      if (length == 0) {
        this.macro.info.innerHTML = "No macro recorded";
      } else if (length > 0) {
        this.macro.info.innerHTML = `Current macro has ${length} commands`;
      }
      this.macro.end.style.display = "none";
      this.macro.start.style.display = "block";
    } else {
      this.macro.info.innerHTML = `Recording macro... ${length} commands`;
      this.macro.end.style.display = "block";
      this.macro.start.style.display = "none";
    }
    let text = "";
    list.reverse();
    list.forEach((name, index) => {
      text += `${name.substring(0, 30) + (name.length > 29 ? "..." : "")}<br/>`
    })
    this.macro.list.innerHTML = text;
  }
}

new Main();