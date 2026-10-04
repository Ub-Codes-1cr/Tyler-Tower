import * as THREE from 'three';

export class UltronBrainCore {
  constructor(scene, position = new THREE.Vector3(0, 1.5, 0)) {
    this.scene = scene;
    this.position = position;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.name = "UltronBrainCore";

    // Earth-like planetary axial tilt (~23.4 degrees)
    this.rotationAxis = new THREE.Vector3(0.397, 0.917, 0.0).normalize();
    this.baseRotationSpeed = 0.045; // Stately, continuous revolution

    this.initGeometries();
    this.scene.add(this.group);
  }

  initGeometries() {
    // 1. OUTER ENERGY LATTICE: Icosahedron Wireframe
    const icoGeom = new THREE.IcosahedronGeometry(14.8, 3);
    const wireframeGeom = new THREE.WireframeGeometry(icoGeom);
    this.latticeMat = new THREE.LineBasicMaterial({
      color: 0x00D2FF,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.outerLattice = new THREE.LineSegments(wireframeGeom, this.latticeMat);
    this.group.add(this.outerLattice);

    // 2. PLANETARY ARBITRARY LATITUDE/LONGITUDE BANDS
    this.ringGroup = new THREE.Group();
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x0072FF,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    const latitudes = [-5, -3, -1, 1, 3, 5];
    latitudes.forEach(lat => {
      const radiusAtLat = Math.cos((lat / 6) * (Math.PI / 2)) * 14.8;
      const yPos = Math.sin((lat / 6) * (Math.PI / 2)) * 14.8;
      const circleGeom = new THREE.BufferGeometry();
      const points = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radiusAtLat, yPos, Math.sin(theta) * radiusAtLat));
      }
      circleGeom.setFromPoints(points);
      const ringLine = new THREE.Line(circleGeom, ringMat);
      this.ringGroup.add(ringLine);
    });
    this.group.add(this.ringGroup);

    // 3. INTERNAL HIGH-DENSITY NUCLEUS (Plasma Core)
    const nucleusGeom = new THREE.SphereGeometry(7.2, 32, 32);
    this.nucleusMat = new THREE.MeshBasicMaterial({
      color: 0x0A1931,
      transparent: true,
      opacity: 0.92
    });
    this.nucleusMesh = new THREE.Mesh(nucleusGeom, this.nucleusMat);
    this.group.add(this.nucleusMesh);

    // 4. ATMOSPHERIC AURA SPRITE (Ultron Blue Glow Halo)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0, 210, 255, 0.85)');
    grad.addColorStop(0.35, 'rgba(0, 114, 255, 0.35)');
    grad.addColorStop(0.7, 'rgba(10, 25, 49, 0.1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const haloTexture = new THREE.CanvasTexture(canvas);
    const haloMat = new THREE.SpriteMaterial({
      map: haloTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.haloSprite = new THREE.Sprite(haloMat);
    this.haloSprite.scale.set(42, 42, 1);
    this.group.add(this.haloSprite);

    // Register picking target for hover engine
    this.nucleusMesh.userData = {
      kind: 'brain',
      name: 'THE ULTRON CORE',
      sub: 'Central Intelligence Matrix',
      hint: 'click to open knowledge graph (G)'
    };
  }

  tick(dt, isHovered = false) {
    // Task 32: Bind Ultron Core Spin Speed to Active Task Load (0.045 rad/s idle to 0.08 rad/s under load)
    let activeTaskMultiplier = 1.0;
    try {
      if (window.CC && window.CC.tasks && typeof window.CC.tasks.activeTaskCount === 'function') {
        const count = window.CC.tasks.activeTaskCount();
        if (count > 0) activeTaskMultiplier = 1.0 + Math.min(count * 0.15, 1.2);
      }
    } catch (e) {}

    const speed = (isHovered ? this.baseRotationSpeed * 0.25 : this.baseRotationSpeed) * activeTaskMultiplier;
    this.group.rotateOnAxis(this.rotationAxis, speed * dt);

    // Modulate lattice intensity slightly for synthetic living pulse
    const pulse = Math.sin(performance.now() * 0.003) * 0.15;
    this.latticeMat.opacity = isHovered ? 0.95 : (0.75 + pulse);
  }

  setTheme(isDark) {
    if (isDark) {
      this.latticeMat.color.setHex(0x00F5D4);
      this.nucleusMat.color.setHex(0x040D1A);
    } else {
      this.latticeMat.color.setHex(0x00D2FF);
      this.nucleusMat.color.setHex(0x0A1931);
    }
  }
}
