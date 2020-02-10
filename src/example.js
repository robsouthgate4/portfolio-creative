// const {
//     WebGLRenderer, Scene, PerspectiveCamera,
//     MeshBasicMaterial, Mesh, Color, TextureLoader, Clock,
//     Vector3, PlaneBufferGeometry, ShaderMaterial,
//   } = THREE;
  
//   const {
//     EffectComposer, RenderPass, BloomPass, Pass,
//   } = POSTPROCESSING;
  
//   const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);
  
//   const clock = new Clock();
  
//   const COLORS = [
//     '#446AB3',
//     '#E36980',
//     '#1FC6A6',
//   ];
  
//   /* ---- METABALL CUSTOM PASS ---- */
//   const metaballShader = {
//     uniforms: {
//       tDiffuse: { value: null },
//     },
//     vertexShader: [
//       "varying vec2 vUv;",
//       "void main() {",
//         "vUv = uv;",
//         "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
//       "}"
//     ].join( "\n" ),
//     fragmentShader: [
//       "uniform sampler2D tDiffuse;",
//       "varying vec2 vUv;",
//       "void main() {",
//         "vec4 currentScreen = texture2D(tDiffuse, vUv);",
//         "gl_FragColor = vec4(currentScreen.xyz * 1.5, currentScreen.w) * max(sign(currentScreen.w - 0.8), 0.0);",
//       "}"
//     ].join( "\n" )
//   }
  
//   class MetaballPass extends Pass {
//     constructor() {
//       super();
//       this.name = 'MetaballPass';
//       this.needsSwap = true;
//       this.material = new ShaderMaterial(metaballShader);
//       this.quad.material = this.material;
//     }
//     render(renderer, readBuffer, writeBuffer) {
//       this.material.uniforms.tDiffuse.value = readBuffer.texture;
//       renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);
//     }
//   }
  
//   /* ---- CORE ---- */

//   let windowWidth = window.innerWidth;
//   let windowHeight = window.innerHeight;

//   class Webgl {

//     constructor(w, h) {

//       this.meshCount = 0;
//       this.meshListeners = [];
//       this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
//       this.renderer.setPixelRatio(window.devicePixelRatio);
//       this.scene = new Scene();
//       this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
//       this.camera.position.set(0, 0, 10);
//       this.dom = this.renderer.domElement;
//       this._composer = false;
//       this._passes = {};
//       this.initPostprocessing();
//       this.update = this.update.bind(this);
//       this.resize = this.resize.bind(this);
//       this.resize(w, h); // set render size

//     }
//     add(mesh) {

//       this.scene.add(mesh);
//       if (!mesh.update) return;
//       this.meshListeners.push(mesh.update);
//       this.meshCount++;

//     }
//     update() {

//       let i = this.meshCount;
//       while (--i >= 0) {
//         this.meshListeners[i].apply(this, null);
//       }
//       this._composer.render(clock.getDelta());

//     }
//     resize(w, h) {

//       this.camera.aspect = w / h;
//       this.camera.updateProjectionMatrix();
//       this.renderer.setSize(w, h);
//       this._composer.setSize(w, h);

//     }
  
//     initPostprocessing() {

//       this._composer = new EffectComposer(this.renderer, {
//         // stencilBuffer: true,
//         // depthTexture: true,
//       });

//       // PASSES
//       const renderPass = new RenderPass(this.scene, this.camera);
//       // renderPass.renderToScreen = true;
//       this._composer.addPass(renderPass);
  
//       const incrustationPass = new MetaballPass();
//       this._composer.addPass(incrustationPass);
  
//       const bloomPass = new BloomPass({
//         // intensity: 1,
//         // resolution: 0.9,
//         kernelSize: 4,
//         // distinction: 2,
//       });

//       bloomPass.renderToScreen = true;
//       this._composer.addPass(bloomPass);
//     }
//   }
//   const webgl = new Webgl(windowWidth, windowHeight);
//   document.body.appendChild(webgl.dom);
  
//   /* ---- CREATING ZONE ---- */
//   const fragMetaball = `
//   uniform vec3 color;
//   varying vec2 vUv;
//   float drawGradientArc(vec2 center, vec2 currentPosition, float scale) {
//     float dist = distance(center, currentPosition) * (2.0 / scale);
//     return 1.0 - dist;
//   }
//   void main() {
//     vec2 center = vec2(0.5, 0.5);
//     float alpha = drawGradientArc(center, vUv, 1.0);
//     gl_FragColor = vec4(vec3(0.0), alpha);
//   }`;
//   const vertMetaball = `
//   varying vec2 vUv;
//   void main() {
//     vUv = uv;
//     vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
//     gl_Position = projectionMatrix * mvPosition;
//   }`;

  
//   class Bubble extends Mesh {
//     constructor() {
//       const geom = new PlaneBufferGeometry(1, 1, 1, 1);
//       const material = new ShaderMaterial({
//         vertexShader: vertMetaball,
//         fragmentShader: fragMetaball,
//         uniforms: {
//           color: { type: 'c', value: new Color(COLORS[Math.floor(Math.random() * COLORS.length)]) },
//         },
//         transparent: true,
//         depthWrite: false,
//       });
//       super(geom, material);
  
//       this.update = this.update.bind(this);
//     }
//     update() {}
//   }
  
//   // START
//   const bubbles = [];
//   for (let i = 0; i < 100; i++) {
//     const bubble = new Bubble();
//     bubble.scale.multiplyScalar(getRandomFloat(1, 1.3))
//     bubbles.push(bubble);
//     bubble.position.set(
//       getRandomFloat(-4, 4),
//       getRandomFloat(-3, 3),
//       getRandomFloat(-4, 4),
//     );
//     webgl.add(bubble);
//   }
  
  
//   /* ---- CREATING ZONE END ---- */
//   class CameraMouseControl {
//     constructor(camera) {
//       this.t = 0;
//       this.speed = 0.03;
//       this.camera = camera;
//       this.lookAt = new Vector3();
//       this.position = { x: 0, y: 0 };
//       this.handleMouseMove = this.handleMouseMove.bind(this);
//       this.update = this.update.bind(this);
//       document.body.addEventListener('mousemove', this.handleMouseMove);
//     }
//     handleMouseMove(event) {
//       this.speed = ((event.clientX / window.innerWidth) - 0.5);
//       this.position.y = (((event.clientY / window.innerHeight) - 0.5) * 5);
//     }
//     update() {
//       this.t += 0.04 * this.speed;
//        // Position
//        this.camera.position.x = Math.cos(this.t) * 10;
//        this.camera.position.z = Math.sin(this.t) * 10;
//        this.camera.rotation.z = 10.3;
//       // this.camera.position.x += (this.position.x - this.camera.position.x) * 0.1;
//       this.camera.position.y += (this.position.y - this.camera.position.y) * 0.1;
//       for (let i = 0; i < bubbles.length; i++) {
//         bubbles[i].lookAt(this.camera.position)
//       }
//       this.camera.lookAt(this.lookAt);
//     }
//   }
//   const cameraControl = new CameraMouseControl(webgl.camera);

//   /* ---- ON RESIZE ---- */
//   function onResize() {
//     windowWidth = window.innerWidth;
//     windowHeight = window.innerHeight;
//     webgl.resize(windowWidth, windowHeight);
//   }

//   window.addEventListener('resize', onResize);
//   window.addEventListener('orientationchange', onResize);


//   /* ---- LOOP ---- */
//   function _loop() {
//       webgl.update();
//         cameraControl.update();
//       requestAnimationFrame(_loop);
//   }
//   _loop();
  