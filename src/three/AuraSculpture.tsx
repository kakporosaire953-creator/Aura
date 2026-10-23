import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * La sculpture vivante d'Aura — trois rubans tissés en flamme,
 * écho direct du logo officiel (vert, or, feu), avec poussière
 * de lumière. Sans WebGL, la scène s'efface silencieusement.
 */
export const AuraSculpture: React.FC = () => {
  const hote = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hote.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      return;
    }

    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const largeur = host.clientWidth || 520;
    const hauteur = host.clientHeight || 520;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(largeur, hauteur);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, largeur / hauteur, 0.1, 60);
    camera.position.set(0, 0.15, 8.4);

    const groupe = new THREE.Group();
    scene.add(groupe);

    // --- Trois rubans en spirale flamme (vert, or, feu) ---
    const palettes: [THREE.Color, THREE.Color][] = [
      [new THREE.Color('#A5E838'), new THREE.Color('#2F9420')],
      [new THREE.Color('#F4E07A'), new THREE.Color('#EACB37')],
      [new THREE.Color('#FF9A3D'), new THREE.Color('#E85D00')],
    ];

    const geometries: THREE.BufferGeometry[] = [];
    const materiaux: THREE.Material[] = [];
    const rubans: THREE.Mesh[] = [];

    for (let k = 0; k < 3; k++) {
      const phase = (k * Math.PI * 2) / 3;
      const pts: THREE.Vector3[] = [];
      const N = 42;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const y = -2.35 + 4.7 * t;
        const rayon = 1.62 * Math.pow(Math.sin(Math.PI * t), 0.82);
        const theta = phase + t * Math.PI * 2.15;
        pts.push(
          new THREE.Vector3(
            Math.cos(theta) * rayon,
            y,
            Math.sin(theta) * rayon * 0.82,
          ),
        );
      }
      const courbe = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(courbe, 220, 0.185, 14, false);

      // Couleurs en dégradé le long du ruban
      const nbVerts = geo.attributes.position.count;
      const couleurs = new Float32Array(nbVerts * 3);
      const [c1, c2] = palettes[k];
      const tmp = new THREE.Color();
      const radial = 15; // (radialSegments + 1)
      for (let i = 0; i < nbVerts; i++) {
        const t = Math.floor(i / radial) / 220;
        tmp.copy(c1).lerp(c2, Math.min(1, Math.max(0, t)));
        couleurs[i * 3] = tmp.r;
        couleurs[i * 3 + 1] = tmp.g;
        couleurs[i * 3 + 2] = tmp.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(couleurs, 3));

      const mat = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.36,
        metalness: 0.06,
        clearcoat: 0.65,
        clearcoatRoughness: 0.3,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.y = k * 0.22;
      geometries.push(geo);
      materiaux.push(mat);
      rubans.push(mesh);
      groupe.add(mesh);
    }

    // --- Poussière de lumière ---
    const NB = 240;
    const positions = new Float32Array(NB * 3);
    const couleursP = new Float32Array(NB * 3);
    const paletteP = [new THREE.Color('#A5E838'), new THREE.Color('#EACB37'), new THREE.Color('#FF790D')];
    for (let i = 0; i < NB; i++) {
      const r = 2.2 + Math.random() * 3.4;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 6.2;
      positions[i * 3] = Math.cos(a) * r * 0.72;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(a) * r * 0.5 - 0.4;
      const c = paletteP[i % 3];
      couleursP[i * 3] = c.r;
      couleursP[i * 3 + 1] = c.g;
      couleursP[i * 3 + 2] = c.b;
    }
    const geoP = new THREE.BufferGeometry();
    geoP.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geoP.setAttribute('color', new THREE.BufferAttribute(couleursP, 3));
    const matP = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geoP, matP);
    geometries.push(geoP);
    materiaux.push(matP);
    scene.add(points);

    // --- Lumière ---
    scene.add(new THREE.AmbientLight(0xfff6e0, 1.05));
    const lumChaud = new THREE.PointLight(0xffb347, 90, 30);
    lumChaud.position.set(4, 3, 5);
    scene.add(lumChaud);
    const lumVert = new THREE.PointLight(0x9be15d, 55, 26);
    lumVert.position.set(-5, -1.5, 4);
    scene.add(lumVert);

    // --- Interaction / boucle ---
    const souris = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      souris.x = (e.clientX / window.innerWidth - 0.5) * 2;
      souris.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduit) window.addEventListener('pointermove', onPointer, { passive: true });

    let visible = true;
    const obs = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.02 });
    obs.observe(host);

    const horloge = new THREE.Clock();
    let brut = 0;

    const dessiner = () => {
      const dt = horloge.getDelta();
      if (visible && !document.hidden && !reduit) {
        brut += dt;
        groupe.rotation.y = brut * 0.14 + souris.x * 0.34;
        groupe.rotation.x = Math.sin(brut * 0.32) * 0.1 + souris.y * 0.18;
        points.rotation.y = -brut * 0.05;
        rubans.forEach((m, i) => {
          m.rotation.y = i * 0.22 + Math.sin(brut * 0.5 + i * 1.7) * 0.16;
        });
      }
      renderer.render(scene, camera);
      if (!reduit) brut = brut; // conserve le temps
    };

    if (reduit) {
      dessiner();
    } else {
      renderer.setAnimationLoop(dessiner);
    }

    const onResize = () => {
      const w = host.clientWidth || 520;
      const h = host.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(host);

    return () => {
      renderer.setAnimationLoop(null);
      obs.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      geometries.forEach((g) => g.dispose());
      materiaux.forEach((m) => m.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hote} className="scene-canevas" aria-hidden />;
};
