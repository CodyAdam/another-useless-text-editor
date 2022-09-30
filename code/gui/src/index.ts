
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
    this.camera.position.z = 700;

    // Init renderer.
    this.renderer = new WebGLRenderer({
      powerPreference: "low-power",
      antialias: false
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.render(this.scene, this.camera);
    // // uncomment if you want to use the animation loop
    // this.renderer.setAnimationLoop(() => this.animate()); 
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
    this.scene.add(this.cursor);

    this.app = new Application();
    this.app.addRenderListener(() => this.render());

    window.addEventListener('keydown', (e) => this.onKeyPress(e));

    this.gui = new GUI();
    const cursorFold = this.gui.addFolder("Cursor");
    cursorFold.add(this.cursor.position, 'x', -10, 10, .2)
    cursorFold.add(this.cursor.position, 'y', -10, 10, .2)
    cursorFold.add(this.cursor.position, 'z', -10, 10, .2)
    cursorFold.open();

    this.render();
    console.log(this);
  }

  private onKeyPress(e: KeyboardEvent) {
    console.log(e.key)
    if (e.key === 'Backspace') {
      this.app.onBackspace();
    } else if (e.key === "Delete") {
      this.app.onDelete();
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
    this.stats.begin();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  }

  /** Animates the scene */
  private animate() {
    this.stats.begin();

    this.text.rotation.x += 0.005;
    this.text.rotation.y += 0.001;

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
    const mesh = new Mesh(new BoxGeometry(10, 10, 10), material);
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
