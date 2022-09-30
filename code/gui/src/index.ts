
import {
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
import Application from "../../v1";
import { GUI } from 'dat.gui'
import font from "./fonts/600.json"
import { Position } from '../../v1/position';
import { lerp } from 'three/src/math/MathUtils';

const H = 152;
const W = 72;
const CUR_X_OFFSET = 0;
const CUR_Y_OFFSET = 30;


class Main {
  /** The scene */
  public scene: Scene;

  /** The camera */
  public camera: PerspectiveCamera | OrthographicCamera;

  /** The renderer */
  public renderer: WebGLRenderer;

  /** The orbit controls */
  public controls: OrbitControls;

  /** The stats */
  public stats: Stats;

  /** The cube mesh */
  public cube: Mesh;

  public text: Mesh;

  public cursor: Mesh;

  public font: Font;

  public app: Application;

  public gui: GUI;

  public lastText: string;

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
    this.camera.position.z = 2000;

    // Init renderer.
    this.renderer = new WebGLRenderer({
      powerPreference: "low-power",
      antialias: false
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

    this.cursor = this.createCursorMesh();
    this.cursor.position.set(0, 30, 10);
    this.scene.add(this.cursor);

    this.app = new Application();
    this.app.addRenderListener(() => this.render());

    window.addEventListener('keydown', (e) => this.onKeyPress(e));

    this.createGui();

    this.render();
    console.log(this);
  }

  private createGui() {
    this.gui = new GUI();
    const cursorFold = this.gui.addFolder("Cursor");
    cursorFold.add(this.cursor.position, 'x', -1000, 1000, W).name('x').onChange((v) => {
      this.cursor.position.setX(v + CUR_X_OFFSET);
      this.render();
    });
    cursorFold.add(this.cursor.position, 'y', -1000, 1000, H).name('y').onChange((v) => {
      this.cursor.position.setY(v + CUR_Y_OFFSET);
      this.render();
    });
    cursorFold.add(this.cursor.scale, 'x', 1, 100, .1).name('scale x').onChange(() => this.render());
    cursorFold.add(this.cursor.scale, 'y', .1, 30, .1).name('scale y').onChange(() => this.render());
    cursorFold.add(this.cursor.scale, 'z', 1, 10, .1).name('scale z').onChange(() => this.render());
    cursorFold.open();
  }

  private onKeyPress(e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      this.app.onBackspace();
    } else if (e.key === "Delete") {
      this.app.onDelete();
    }
    else if (e.key === "ArrowLeft") {
      const current = this.app.getCursor().getStart()
      this.app.onMoveCursor(new Position(current.getLine(), current.getCol() - 1));
    }
    else if (e.key === "ArrowRight") {
      const current = this.app.getCursor().getStart()
      this.app.onMoveCursor(new Position(current.getLine(), current.getCol() + 1));
    }
    else if (e.key === "ArrowUp") {
      const current = this.app.getCursor().getStart()
      this.app.onMoveCursor(new Position(current.getLine() - 1, current.getCol()));
    }
    else if (e.key === "ArrowDown") {
      const current = this.app.getCursor().getStart()
      this.app.onMoveCursor(new Position(current.getLine() + 1, current.getCol()));
    }
    else if (e.key === "Enter") {
      this.app.onWrite("\n");
    }
    else if (e.key.length === 1) {
      this.app.onWrite(e.key);
    }

  }

  /** Renders the scene */
  private render() {
    //Update the text
    if (this.lastText !== this.app.getEditor().getContent()) {
      this.lastText = this.app.getEditor().getContent();
      this.text.geometry = this.geometryFromText(this.app.getEditor().getContent());
    }

    //Update the cursor
    const cursor = this.app.getCursor();
    const cursorPos = cursor.getStart();
    this.cursor.position.setX(cursorPos.getCol() * W + CUR_X_OFFSET);
    this.cursor.position.setY(-cursorPos.getLine() * H + CUR_Y_OFFSET);
    

    this.stats.begin();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  }

  /** Animates the scene */
  private animate() {
    this.stats.begin();

    this.camera.position.setX(lerp(this.camera.position.x, this.cursor.position.x, 0.1))
    this.camera.position.setY(lerp(this.camera.position.y, this.cursor.position.y, 0.1))
    this.camera.lookAt(this.cursor.position);

    this.controls.update();
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
      curveSegments: 3,
      bevelEnabled: true,
      bevelThickness: 7,
      bevelSize: 2,
      bevelOffset: 1,
      bevelSegments: 5
    });
  }
}




new Main();
