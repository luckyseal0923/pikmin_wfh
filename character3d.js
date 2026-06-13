(function initializeWalkingCharacter() {
  const THREE_URL = "https://esm.sh/three@0.169.0";
  const LOADER_URL = "https://esm.sh/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";
  const MODEL_URL = new URL("assets/character/nurse-walking.glb", window.location.href).href;

  window.WANFANG_3D_READY = Promise.all([
    import(THREE_URL),
    import(LOADER_URL)
  ]).then(([THREE, loaderModule]) => {
    const { GLTFLoader } = loaderModule;

    class WalkingCharacterOverlay extends google.maps.OverlayView {
      constructor(map, position) {
        super();
        this.position = position;
        this.heading = 0;
        this.container = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.model = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.frameId = null;
        this.loaded = false;
        this.ready = new Promise((resolve, reject) => {
          this.resolveReady = resolve;
          this.rejectReady = reject;
        });
        this.setMap(map);
      }

      onAdd() {
        this.container = document.createElement("div");
        this.container.className = "player-3d-overlay";
        Object.assign(this.container.style, {
          position: "absolute",
          width: "112px",
          height: "132px",
          pointerEvents: "none",
          transform: "translate(-56px, -116px)",
          overflow: "visible",
          zIndex: "30"
        });
        this.getPanes().overlayLayer.appendChild(this.container);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(26, 112 / 132, 0.01, 100);
        this.camera.position.set(0, 1.25, 5.7);
        this.camera.lookAt(0, 1.1, 0);

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(112, 132, false);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x63857b, 2.5));
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
        keyLight.position.set(3, 5, 4);
        this.scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0x8debd6, 1.6);
        fillLight.position.set(-4, 2, 2);
        this.scene.add(fillLight);

        const loader = new GLTFLoader();
        loader.load(MODEL_URL, (gltf) => {
            this.model = gltf.scene;
            const box = new THREE.Box3().setFromObject(this.model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const scale = 2.35 / Math.max(size.y, 0.001);
            this.model.scale.setScalar(scale);
            this.model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
            this.model.rotation.y = Math.PI;
            this.scene.add(this.model);

            if (gltf.animations.length) {
              this.mixer = new THREE.AnimationMixer(this.model);
              const action = this.mixer.clipAction(gltf.animations[0]);
              action.setLoop(THREE.LoopRepeat, Infinity);
              action.play();
            }
            this.loaded = true;
            this.container.dataset.loaded = "true";
            this.startRendering();
            this.resolveReady(this);
          }, undefined, this.rejectReady);
      }

      draw() {
        if (!this.container || !this.position) return;
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(
          new google.maps.LatLng(this.position.lat, this.position.lng)
        );
        if (!point) return;
        this.container.style.left = `${point.x}px`;
        this.container.style.top = `${point.y}px`;
      }

      setPosition(position) {
        this.position = position;
        this.draw();
      }

      setHeading(heading) {
        this.heading = Number.isFinite(heading) ? heading : 0;
        if (this.model) this.model.rotation.y = Math.PI - THREE.MathUtils.degToRad(this.heading);
      }

      startRendering() {
        if (this.frameId) return;
        const render = () => {
          this.frameId = requestAnimationFrame(render);
          const delta = Math.min(this.clock.getDelta(), 0.05);
          if (this.mixer) this.mixer.update(delta);
          if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
          }
        };
        render();
      }

      onRemove() {
        if (this.frameId) cancelAnimationFrame(this.frameId);
        this.frameId = null;
        if (this.renderer) this.renderer.dispose();
        if (this.container) this.container.remove();
        this.container = null;
      }
    }

    return {
      create(map, position) {
        return new WalkingCharacterOverlay(map, position);
      }
    };
  });
})();
