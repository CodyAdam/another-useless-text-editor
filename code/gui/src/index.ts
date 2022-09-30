
import THREE, {
  Scene,
  Color,
  Mesh,
  MeshNormalMaterial,
  BoxGeometry,
  PerspectiveCamera,
  WebGLRenderer,
  OrthographicCamera,
} from "three";
import { TextGeometry } from './TextGeometry';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "stats.js";
import { Font } from './FontLoader';
import Application from "./v1";
import { GUI } from 'dat.gui'
import font from "./fonts/600.json"
import { Position } from './v1/position';
import { lerp } from 'three/src/math/MathUtils';

const H = 152;
const W = 72.25;
const CUR_X_OFFSET = 0;
const CUR_Y_OFFSET = 30;


class Main {
  /** The scene */
  public scene: Scene;

  /** The camera */
  public camera: PerspectiveCamera;

  /** The renderer */
  public renderer: WebGLRenderer;

  /** The orbit controls */
  public controls: OrbitControls;

  /** The stats */
  public stats: Stats;

  /** The cube mesh */
  public cube: Mesh;

  public text: Mesh;

  public cursorStart: Mesh;
  public cursorEnd: Mesh;

  public font: Font;

  public app: Application;

  public gui: GUI;

  public lastText: string;

  public modifiers: { shift: boolean, ctrl: boolean };

  public animateCursor: Boolean;
  public animateCamera: Boolean;

  constructor() {
    this.init();
  }

  /** Initialize the viewport */
  private init() {
    // Init scene. 
    this.scene = new Scene();
    this.scene.background = new Color("#191919");

    // Init camera.
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new PerspectiveCamera(50, aspect, 1, 100000);
    this.camera.position.z = 1000;
    this.animateCamera = true;

    // Init renderer.
    this.renderer = new WebGLRenderer({
      powerPreference: "low-power",
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.render(this.scene, this.camera);
    // // uncomment if you want to use the animation loop
    this.renderer.setAnimationLoop(() => this.animate());
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener("resize", () => this.onResize());

    // Init stats.
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    // Init orbit controls.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();
    this.controls.addEventListener("change", () => this.render());

    this.font = new Font(font);
    this.text = this.createTextMesh();
    this.scene.add(this.text);

    this.cursorStart = this.createCursorMesh();
    this.cursorStart.position.set(0, 30, 10);
    this.cursorEnd = this.createCursorMesh();
    this.cursorEnd.position.set(0, 30, 10);
    this.animateCursor = true;
    this.scene.add(this.cursorStart);
    this.scene.add(this.cursorEnd)

    this.app = new Application();
    this.app.addRenderListener(() => this.render());

    this.modifiers = {
      shift: false,
      ctrl: false
    }
    window.addEventListener('keydown', (e) => this.onKeyPress(e));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift')
        this.modifiers.shift = true;
      if (e.key === "Control")
        this.modifiers.ctrl = true;
    })
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift')
        this.modifiers.shift = false;
      if (e.key === "Control")
        this.modifiers.ctrl = false;
    })

    this.createGui();

    this.render();
    console.log(this);
  }

  private createGui() {
    this.gui = new GUI();
    const cursorFold = this.gui.addFolder("Cursor");
    cursorFold.add(this.cursorStart.scale, 'x', 1, 100, .1).name('scale x').onChange(() => { this.cursorEnd.scale.x = this.cursorStart.scale.x; this.render() });
    cursorFold.add(this.cursorStart.scale, 'y', .1, 5, .1).name('scale y').onChange(() => { this.cursorEnd.scale.y = this.cursorStart.scale.y; this.render() });
    cursorFold.add(this.cursorStart.scale, 'z', 1, 5, .1).name('scale z').onChange(() => { this.cursorEnd.scale.z = this.cursorStart.scale.z; this.render() });
    cursorFold.add(this, "animateCursor").name('animate').onChange(() => this.render());
    cursorFold.open();
    const cameraFold = this.gui.addFolder("Camera");
    cameraFold.add({
      reset: () => {
        this.camera.position.x = this.cursorStart.position.x;
        this.camera.position.y = this.cursorStart.position.y;
        this.camera.position.z = 1000;
        this.camera.lookAt(this.cursorStart.position);
        this.render();
      }
    }, "reset").name('reset position').onChange(() => this.render())
    cameraFold.add(this, "animateCamera").name('animate').onChange(() => this.render());
    cameraFold.open();
  }


  private onKeyPress(e: KeyboardEvent) {
    console.log(e.key);
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
          this.app.onMoveEndCursor(new Position(99999, 99999))
        }
      }
      else
        this.app.onWrite(e.key);
    }
  }

  /** Renders the scene */
  private render() {
    //Update the text
    const content = this.app.getEditor().getContent().join('\n');
    if (this.lastText !== content) {
      this.lastText = content;
      this.text.geometry = this.geometryFromText(content);
    }

    //Update the cursor
    if (!this.animateCursor) {
      const startCur = this.app.getCursor().getStart();
      const endCur = this.app.getCursor().getEnd();
      this.cursorStart.position.setX(startCur.getCol() * W + CUR_X_OFFSET);
      this.cursorStart.position.setY(-startCur.getLine() * H + CUR_Y_OFFSET);
      this.cursorEnd.position.setX(endCur.getCol() * W + CUR_X_OFFSET);
      this.cursorEnd.position.setY(-endCur.getLine() * H + CUR_Y_OFFSET);

    }

    const textCenter = this.text.geometry.boundingSphere?.center;
    if (textCenter) {
      this.controls.target.setX(textCenter.x);
      this.controls.target.setY(textCenter.y);
    }
    this.stats.begin();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  }

  /** Animates the scene */
  private animate() {
    if (!this.animateCamera && !this.animateCursor)
      return;
    this.stats.begin();

    if (this.animateCamera) {
      this.camera.position.setX(lerp(this.camera.position.x, this.cursorStart.position.x, 0.01))
      this.camera.position.setY(lerp(this.camera.position.y, this.cursorStart.position.y, 0.01))
      this.controls.update();
    }
    if (this.animateCursor) {
      const startCur = this.app.getCursor().getStart();
      const endCur = this.app.getCursor().getEnd();
      this.cursorStart.position.setX(lerp(this.cursorStart.position.x, startCur.getCol() * W + CUR_X_OFFSET, 0.2))
      this.cursorStart.position.setY(lerp(this.cursorStart.position.y, -startCur.getLine() * H + CUR_Y_OFFSET, 0.2))
      this.cursorEnd.position.setX(lerp(this.cursorEnd.position.x, endCur.getCol() * W + CUR_X_OFFSET, 0.2))
      this.cursorEnd.position.setY(lerp(this.cursorEnd.position.y, -endCur.getLine() * H + CUR_Y_OFFSET, 0.2))
    }
    this.renderer.render(this.scene, this.camera);

    this.stats.end();
  }

  /** On resize event */
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
    material.opacity = 0.8;
    material.transparent = true;
    const mesh = new Mesh(new BoxGeometry(10, 135, 100), material);
    return mesh;
  }

  private createTextMesh(text: string = "Default") {
    const material = new MeshNormalMaterial();
    const mesh = new Mesh(this.geometryFromText(text), material);
    return mesh;
  }

  private geometryFromText(text: string) {
    return new TextGeometry(text, {
      font: this.font,
      size: 80,
      height: 20,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 3,
      bevelSize: 3,
      bevelOffset: 1,
      bevelSegments: 5,
    });
  }
}




new Main();
