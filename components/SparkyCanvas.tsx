"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function SparkyCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.offsetWidth || 340;
    const h = canvas.offsetHeight || 420;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(36, w / h, 0.1, 50);
    cam.position.set(0, 0.3, 8.2);

    /* ── Lighting — clay Spline-style ── */
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 8, 5); key.castShadow = true; scene.add(key);
    const fill = new THREE.DirectionalLight(0x34d399, 0.55);
    fill.position.set(-5, 0, 4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0x6ee7b7, 0.35);
    rim.position.set(0, -5, -3); scene.add(rim);
    // Extra warm back light for depth
    const back = new THREE.DirectionalLight(0xfbbf24, 0.2);
    back.position.set(0, 3, -6); scene.add(back);

    /* ── Helper factories ── */
    function mat(col: string | number, rough = 0.88) {
      return new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: 0.04 });
    }
    function sphere(r: number, col: string | number, rough?: number) {
      return new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32), mat(col, rough));
    }
    function blob(sx: number, sy: number, sz: number, col: string | number) {
      const m = sphere(1, col); m.scale.set(sx, sy, sz); return m;
    }

    /* ── Sparky — emerald + gold crown, arm raised ── */
    const C1 = "#34d399", C2 = "#059669", GOLD = "#fbbf24", DARK = "#022c22";
    const fig = new THREE.Group();

    const body = blob(0.85, 1.1, 0.75, C2);                           fig.add(body);
    const head = sphere(0.65, C1);  head.position.y = 1.62;           fig.add(head);

    // Gold star eyes (octahedra)
    const eyeL = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), mat(GOLD, 0.3));
    eyeL.position.set(-0.2, 1.7, 0.57); eyeL.rotation.z = 0.785;     fig.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.set(0.2, 1.7, 0.57);     fig.add(eyeR);

    // Smile dots
    const smL = sphere(0.065, DARK); smL.position.set(-0.16, 1.5, 0.6);  fig.add(smL);
    const smR = sphere(0.065, DARK); smR.position.set(0.16, 1.5, 0.6);   fig.add(smR);

    // Crown base (torus)
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.1, 12, 40), mat(GOLD, 0.3));
    crown.position.y = 2.38; crown.rotation.x = Math.PI / 2;          fig.add(crown);
    // Crown points (5 spheres)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const pt = sphere(0.115, GOLD, 0.25);
      pt.position.set(Math.cos(a) * 0.37, 2.62, Math.sin(a) * 0.37); fig.add(pt);
    }
    // Crown centre gem (aqua octahedron)
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), mat("#a5f3fc", 0.2));
    gem.position.set(0, 2.72, 0);                                       fig.add(gem);

    // Arms — left raised triumphantly, right relaxed
    const aL = blob(0.22, 0.72, 0.22, C1); aL.position.set(-1, 0.72, 0); aL.rotation.z = 0.9; fig.add(aL);
    const aR = blob(0.22, 0.65, 0.22, C1); aR.position.set(1, 0.12, 0);  aR.rotation.z = -0.35; fig.add(aR);

    // Legs
    const lL = blob(0.26, 0.72, 0.26, C2); lL.position.set(-0.33, -1.3, 0); fig.add(lL);
    const lR = blob(0.26, 0.72, 0.26, C2); lR.position.set(0.33, -1.3, 0);  fig.add(lR);

    // Floating gold octahedra (stars)
    const starMat = mat(GOLD, 0.25);
    const starData: { mesh: THREE.Mesh; phaseOffset: number; baseY: number }[] = [];
    [[1.55, 0.6, 0.2], [-1.52, 0.35, 0.1], [1.12, -0.45, 0.5], [-0.92, 1.1, 0.3]].forEach((pos, i) => {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.11 + i * 0.02), starMat.clone());
      s.position.set(pos[0], pos[1], pos[2]);
      fig.add(s);
      starData.push({ mesh: s, phaseOffset: i * 1.7, baseY: pos[1] });
    });

    // Ground shadow
    const shadow = blob(1.1, 0.06, 1.1, "#030609");
    shadow.position.y = -2.12;
    (shadow.material as THREE.MeshStandardMaterial).transparent = true;
    (shadow.material as THREE.MeshStandardMaterial).opacity = 0.35;
    fig.add(shadow);

    scene.add(fig);

    /* ── Entry pop-in ── */
    fig.scale.set(0, 0, 0);
    fig.rotation.y = -0.3;
    let entryT = 0;
    const ENTRY_DUR = 0.9;

    /* ── Mouse tracking ── */
    let mx = 0, my = 0;
    function onMove(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      mx = ((clientX - rect.left) / rect.width - 0.5) * 2;
      my = -((clientY - rect.top) / rect.height - 0.5) * 2;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    let last = performance.now();
    let animId: number;

    function animate(now: number) {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      /* Entry spring */
      if (entryT < 1) {
        entryT = Math.min(entryT + dt / ENTRY_DUR, 1);
        const ease = 1 - Math.pow(1 - entryT, 3);
        const overshoot = entryT < 0.7
          ? ease * 1.15
          : 1 + (1 - entryT) * 0.08 * Math.sin((entryT - 0.7) * Math.PI * 5);
        fig.scale.setScalar(overshoot);
        fig.rotation.y = -0.3 + entryT * 0.3;
      }

      /* Idle float */
      fig.position.y = Math.sin(t * 0.9) * 0.06;
      fig.rotation.y += (mx * 0.35 - fig.rotation.y) * 0.04;
      fig.rotation.x += (-my * 0.12 - fig.rotation.x) * 0.04;

      /* Star orbits */
      starData.forEach(({ mesh, phaseOffset, baseY }) => {
        mesh.rotation.x = t * 1.1 + phaseOffset;
        mesh.rotation.z = t * 0.8 + phaseOffset;
        mesh.position.y = baseY + Math.sin(t * 1.3 + phaseOffset) * 0.08;
      });

      /* Gem pulse */
      const gemPulse = 0.85 + Math.sin(t * 2.2) * 0.15;
      gem.scale.setScalar(gemPulse);

      renderer.render(scene, cam);
    }

    animId = requestAnimationFrame(animate);

    /* ── Resize ── */
    const ro = new ResizeObserver(() => {
      if (!canvas) return;
      const nw = canvas.offsetWidth, nh = canvas.offsetHeight;
      renderer.setSize(nw, nh);
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      ro.disconnect();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={{ display: "block" }} />;
}
