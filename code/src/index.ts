
import {
  Scene,
  Color,
  Mesh,
  MeshNormalMaterial,
  MeshMatcapMaterial,
  MeshLambertMaterial,
  BoxGeometry,
  PerspectiveCamera,
  WebGLRenderer,
  OrthographicCamera,
  MeshPhongMaterial,
  AmbientLightProbe,
  PointLight,
  Vector3,
  Clock,
  AmbientLight,
  DirectionalLight,
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

type Char = {
  text: string,
  mesh: Mesh,
  seen: boolean
}

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

  public text: Map<Position, Char>;

  public cursorStart: Mesh;
  public cursorEnd: Mesh;

  public font: Font;

  public app: Application;

  public gui: GUI;

  public lastText: string;

  public modifiers: { shift: boolean, ctrl: boolean };

  public animateCursor: Boolean;
  public animateCamera: Boolean;
  public animateSelection: Boolean;

  public pointLightEnd: PointLight;
  public pointLightStart: PointLight;

  public cache: Map<string, Mesh>
  public clock: Clock;

  constructor() {
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


    this.clock = new Clock();
    this.clock.start();
    this.font = new Font(font);

    this.cursorStart = this.createCursorMesh();
    this.cursorStart.position.set(0, 30, 10);
    this.cursorEnd = this.createCursorMesh();
    this.cursorEnd.position.set(0, 30, 10);
    this.animateCursor = true;
    this.animateSelection = true;
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

    this.text = new Map();
    this.cache = new Map();

    this.pointLightStart = new PointLight(0xad00ff, 1, 800);
    this.pointLightEnd = new PointLight(0xff2e2e, 1, 800);
    this.pointLightEnd.position.set(0, 0, 100);
    this.pointLightStart.position.set(0, 0, 100);
    this.scene.add(this.pointLightEnd);
    this.scene.add(this.pointLightStart);
    const ambient = new DirectionalLight(0x694c76, 1);
    this.scene.add(ambient);


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
        this.camera.position.x = this.cursorEnd.position.x;
        this.camera.position.y = this.cursorEnd.position.y;
        this.camera.position.z = 1000;
        this.camera.lookAt(this.cursorEnd.position);
        this.render();
      }
    }, "reset").name('reset position').onChange(() => this.render())
    cameraFold.add(this, "animateCamera").name('animate').onChange(() => this.render());
    cameraFold.open();
    const selectionFold = this.gui.addFolder("Selection");
    selectionFold.add(this, "animateSelection").name('animate').onChange(() => this.render());
    selectionFold.open();
  }


  private onKeyPress(e: KeyboardEvent) {
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
        }
      }
      else
        this.app.onWrite(e.key);
    }
  }

  /** Renders the scene */
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
          char.mesh.rotation.set(.2, 0.1, 0.2);
          const material = new MeshPhongMaterial();
          char.mesh.material = material;
        }
        else {
          char.mesh.rotation.set(0, 0, 0);
          char.mesh.material = new MeshNormalMaterial();
        }
      });
    }


    if (this.animateCamera) {
      const center = new Vector3();
      const count = this.text.size;
      if (count > 0) {
        this.text.forEach((char, pos) => {
          center.add(char.mesh.position);
        });
        center.divideScalar(count);
        if (center) {
          this.controls.target.setX(center.x);
          this.controls.target.setY(center.y);
        }
      }
    }



    this.stats.begin();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  }

  /** Animates the scene */
  private animate() {
    if (!this.animateCamera && !this.animateCursor && !this.animateSelection)
      return;
    this.stats.begin();

    if (this.animateCamera) {
      this.camera.position.setX(lerp(this.camera.position.x, this.cursorEnd.position.x, 0.01))
      this.camera.position.setY(lerp(this.camera.position.y, this.cursorEnd.position.y, 0.01))
      this.controls.update();
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
    }

    if (this.animateSelection) {
      this.text.forEach((char, pos) => {
        if (this.isSelected(pos)) {
          const posOffset =  + 30*Math.sin(char.mesh.position.x/100 + char.mesh.position.y/100 + 5*this.clock.getElapsedTime());
          char.mesh.position.setY(-pos.getLine() * H + posOffset);
          const rotationOffset = 0.1*Math.sin(char.mesh.position.x/100 + 5*this.clock.getElapsedTime());  
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
}

new Main();