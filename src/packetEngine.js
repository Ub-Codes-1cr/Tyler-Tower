import * as THREE from 'three';

export class VectorPacketEngine {
  constructor(scene, maxPackets = 128) {
    this.scene = scene;
    this.pool = [];
    this.activePackets = [];

    const geom = new THREE.SphereGeometry(0.32, 8, 8);
    for (let i = 0; i < maxPackets; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00D2FF,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.pool.push(mesh);
    }
  }

  dispatch(origin, destination, colorHex = 0x00D2FF, speed = 32.0, onArrival = null) {
    const mesh = this.pool.pop();
    if (!mesh) return;

    mesh.material.color.setHex(colorHex);
    mesh.material.opacity = 1.0;
    mesh.visible = true;

    this.activePackets.push({
      mesh,
      origin: origin.clone(),
      destination: destination.clone(),
      progress: 0.0,
      distance: origin.distanceTo(destination),
      speed,
      onArrival
    });
  }

  tick(dt) {
    for (let i = this.activePackets.length - 1; i >= 0; i--) {
      const p = this.activePackets[i];
      p.progress += (p.speed * dt) / Math.max(p.distance, 0.001);

      if (p.progress >= 1.0) {
        p.mesh.visible = false;
        p.mesh.material.opacity = 0.0;
        this.pool.push(p.mesh);
        this.activePackets.splice(i, 1);
        if (p.onArrival) p.onArrival();
      } else {
        p.mesh.position.lerpVectors(p.origin, p.destination, p.progress);
        // Subtle sinusoidal pulse elevation
        p.mesh.position.y = 0.28 + Math.sin(p.progress * Math.PI) * 0.45;
      }
    }
  }
}
