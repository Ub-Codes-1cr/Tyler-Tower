// V3.1 — the real connector list for the office + V2 Dotted Vector System
import * as THREE from 'three';
import { MCP_LOGOS } from './mcplogos.js';
import { DEPT_KEYS } from './data.js';

// brand inks for shared looms (a shared connector is wired to four or more pods)
const INK = { notion: '#151414', gmail: '#EA4335', slack: '#4A154B', zapier: '#FF4F00', claude_ai_Google_Drive: '#1FA463', googledrive: '#1FA463', chrome: '#4285F4' }; // V3.2 (16 Sep): Chrome is wired to every pod
const norm = s => String(s).toLowerCase().replace(/^claude\.ai\s+/, '').replace(/[^a-z0-9]/g, '');
function hue(name) { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; }
export const inkOf = name => `hsl(${hue(name)} 52% 42%)`;

// a tile for a server we have no logo for: same white rounded square as the baked ones, the
// name's initials in a colour hashed from the name — stable across boots
export function tile(name) {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const x = c.getContext('2d');
  const r = 34;
  x.beginPath(); x.roundRect(1, 1, 158, 158, r); x.fillStyle = '#fff'; x.fill();
  x.lineWidth = 2; x.strokeStyle = 'rgba(28,26,23,0.10)'; x.stroke();
  const words = String(name).replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/);
  const ini = (words.length > 1 ? words[0][0] + words[1][0] : String(name).slice(0, 2)).toUpperCase();
  x.fillStyle = inkOf(name);
  x.font = `700 ${ini.length > 1 ? 64 : 76}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ini, 80, 86);
  return c.toDataURL('image/png');
}

export function fromSummary(m, agents) {
  const byDept = Object.fromEntries(DEPT_KEYS.map(k => [k, []]));
  const logos = {}, status = {}, shared = {}, names = {}, off = [];
  for (const s of m.servers || []) {
    const key = s.key || s.id;
    logos[key] = MCP_LOGOS[key] || { name: s.name, img: tile(s.name) };
    names[key] = s.name;
    status[key] = s.denied ? 'denied' : (s.allowed ? s.status : 'denied');
    // only a usable server is wired to pods; the rest sit in the strip, grey, unwired — nothing flows
    if (status[key] !== 'connected') { off.push(key); continue; }
    for (const d of s.depts || []) if (byDept[d] && !byDept[d].includes(key)) byDept[d].push(key);
    if ((s.depts || []).length >= 4) shared[key] = INK[key] || INK[norm(s.name)] || inkOf(s.name);
  }
  const agentTools = agents ? Object.fromEntries(agents.map(a => [a.id, (a.tools || []).map(t => {
    const n = norm(t); const hit = (m.servers || []).find(s => s.key === n || norm(s.name) === n || s.id === t); return hit ? (hit.key || hit.id) : n;
  })])) : null;
  return { live: true, byDept, logos, status, shared, names, off, agentTools, servers: m.servers || [], tools: !!m.tools, web: !!m.web };
}

export async function loadConnectors({ timeout = 25000 } = {}) {
  if (!location.protocol.startsWith('http')) return null;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
    const [m, a] = await Promise.all([fetch('/api/mcp', { signal: ctl.signal }).then(r => r.ok ? r.json() : null),
                                      fetch('/api/agents', { signal: ctl.signal }).then(r => r.ok ? r.json() : null).catch(() => null)]);
    clearTimeout(t);
    if (!m) return null;
    return fromSummary(m, a && a.agents);
  } catch { return null; }
}

// -----------------------------------------------------------------------------
// V2: Dotted Vector Connector Infrastructure System
// -----------------------------------------------------------------------------
export class DottedConnectorSystem {
  constructor(scene, brainPosition, pods = []) {
    this.scene = scene;
    this.brainPos = brainPosition || new THREE.Vector3(0, 1.5, 0);
    this.pods = pods;
    this.connectors = new Map(); // podId -> { primaryLine, subLines, mat, speed, offset }
    this.group = new THREE.Group();
    this.group.name = "DottedConnectorGrid";

    if (pods && pods.length > 0) {
      this.initNetwork();
    }
    this.scene.add(this.group);
  }

  initNetwork() {
    this.pods.forEach(pod => {
      const destination = pod.commandNodePos || pod.position || new THREE.Vector3(0, 0, 0);
      
      // Calculate radial departure point at the Orb's surface (r=14.8)
      const dir = new THREE.Vector3().subVectors(destination, this.brainPos);
      dir.y = 0; // Pure planar radial alignment
      if (dir.lengthSq() > 0) dir.normalize();

      const startPoint = new THREE.Vector3(
        this.brainPos.x + dir.x * 14.8,
        0.28, // Clean hovering altitude above ground plane
        this.brainPos.z + dir.z * 14.8
      );

      const endPoint = new THREE.Vector3(destination.x, 0.28, destination.z);

      // Primary Trunk: Main Dotted Vector
      const points = [startPoint, endPoint];
      const geom = new THREE.BufferGeometry().setFromPoints(points);

      const mat = new THREE.LineDashedMaterial({
        color: 0x4A5568, // Calm muted slate at rest
        dashSize: 1.4,
        gapSize: 0.9,
        scale: 1.0,
        transparent: true,
        opacity: 0.40,
        depthWrite: false
      });

      const primaryLine = new THREE.Line(geom, mat);
      primaryLine.computeLineDistances();
      this.group.add(primaryLine);

      // Secondary Fan-out Branches: To desk workstations on the pod platform
      const subLines = [];
      if (pod.desks && pod.desks.length > 0) {
        pod.desks.forEach(deskPos => {
          const subPoints = [
            new THREE.Vector3(destination.x, 0.28, destination.z),
            new THREE.Vector3(deskPos.x, 0.28, deskPos.z)
          ];
          const subGeom = new THREE.BufferGeometry().setFromPoints(subPoints);
          const subMat = new THREE.LineDashedMaterial({
            color: 0x4A5568,
            dashSize: 0.8,
            gapSize: 0.6,
            scale: 1.0,
            transparent: true,
            opacity: 0.25,
            depthWrite: false
          });
          const subLine = new THREE.Line(subGeom, subMat);
          subLine.computeLineDistances();
          this.group.add(subLine);
          subLines.push({ line: subLine, mat: subMat });
        });
      }

      this.connectors.set(pod.id || Math.random().toString(), {
        primaryLine,
        subLines,
        mat,
        baseColor: 0x4A5568,
        activeColor: 0x00D2FF, // Ultron Blue
        speed: 0.0,
        offset: 0.0
      });
    });
  }

  setPodStreamState(podId, state) {
    const conn = this.connectors.get(podId);
    if (!conn) return;

    switch (state) {
      case 'idle':
        conn.mat.color.setHex(conn.baseColor);
        conn.mat.opacity = 0.40;
        conn.speed = 0.0;
        conn.subLines.forEach(s => {
          s.mat.color.setHex(conn.baseColor);
          s.mat.opacity = 0.25;
        });
        break;

      case 'streaming': // Active outbound data packet dispatch
        conn.mat.color.setHex(conn.activeColor);
        conn.mat.opacity = 0.90;
        conn.speed = -6.5; // Flow outward from Orb to Desk
        conn.subLines.forEach(s => {
          s.mat.color.setHex(conn.activeColor);
          s.mat.opacity = 0.70;
        });
        break;

      case 'returning': // Result/task ingress returning to Core
        conn.mat.color.setHex(0xFFB703); // Warm amber gold
        conn.mat.opacity = 0.95;
        conn.speed = 6.5; // Flow inward to Core
        break;

      case 'error':
        conn.mat.color.setHex(0xC94F3D);
        conn.mat.opacity = 1.0;
        conn.speed = 0.0;
        break;
    }
  }

  tick(dt) {
    this.connectors.forEach(conn => {
      if (conn.speed !== 0.0) {
        conn.offset += conn.speed * dt;
        conn.mat.dashOffset = conn.offset;
        conn.subLines.forEach(s => {
          s.mat.dashOffset = conn.offset * 1.2;
        });
      }
    });
  }

  setTheme(isDark) {
    const defaultColor = isDark ? 0x718096 : 0x4A5568;
    this.connectors.forEach(conn => {
      conn.baseColor = defaultColor;
      if (conn.speed === 0.0) {
        conn.mat.color.setHex(defaultColor);
        conn.subLines.forEach(s => s.mat.color.setHex(defaultColor));
      }
    });
  }
}
