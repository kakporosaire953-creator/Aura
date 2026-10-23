import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * La sculpture vivante d'Aura — trois rubans tissés en flamme (écho du
 * logo officiel), un ruban de lumière qui raconte le cheminement d'une
 * idée, et des connexions organiques entre particules. Un seul renderer,
 * pause hors écran, repli sans WebGL, budget réduit sur mobile.
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
    const mobile = window.innerWidth < 768;
    const largeur = host.clientWidth || 520;
    const hauteur = host.clientHeight || 520;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.setSize(largeur, hauteur);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, largeur / hauteur, 0.1, 60);
    camera.position.set(0, 0.15, 8.4);

    const groupe = new THREE.Group();
    scene.add(groupe);

    const geometries: THREE.BufferGeometry[] = [];
    const materiaux: THREE.Material[] = [];

    /* ---------- Les trois rubans-flamme (vert, or, feu) ---------- */
    const palettes: [THREE.Color, THREE.Color][] = [
      [new THREE.Color('#A5E838'), new THREE.Color('#2F9420')],
      [new THREE.Color('#F4E07A'), new THREE.Color('#EACB37')],
      [new THREE.Color('#FF9A3D'), new THREE.Color('#E85D00')],
    ];

    const rubans: THREE.Mesh[] = [];
    const segTube = mobile ? 140 : 220;

    for (let k = 0; k < 3; k++) {
      const phase = (k * Math.PI * 2) / 3;
      const pts: THREE.Vector3[] = [];
      const N = 42;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const y = -2.35 + 4.7 * t;
        const rayon = 1.62 * Math.pow(Math.sin(Math.PI * t), 0.82);
        const theta = phase + t * Math.PI * 2.15;
        pts.push(new THREE.Vector3(Math.cos(theta) * rayon, y, Math.sin(theta) * rayon * 0.82));
      }
      const courbe = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(courbe, segTube, 0.185, 12, false);

      const nbVerts = geo.attributes.position.count;
      const couleurs = new Float32Array(nbVerts * 3);
      const [c1, c2] = palettes[k];
      const tmp = new THREE.Color();
      const radial = 13;
      for (let i = 0; i < nbVerts; i++) {
        const t = Math.floor(i / radial) / segTube;
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
        clearcoat: mobile ? 0 : 0.65,
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

    /* ---------- Le ruban de lumière : le cheminement d'une idée ---------- */
    const ptsLumiere: THREE.Vector3[] = [];
    const NL = 36;
    for (let i = 0; i <= NL; i++) {
      const t = i / NL;
      ptsLumiere.push(
        new THREE.Vector3(
          -4.6 + 9.2 * t,
          -1.7 + 3.5 * Math.sin(t * Math.PI * 1.35) + 0.5 * Math.sin(t * 9.5),
          -1.2 + 2.1 * Math.sin(t * Math.PI * 2.1 + 0.7),
        ),
      );
    }
    const courbeLumiere = new THREE.CatmullRomCurve3(ptsLumiere);
    const geoLumiere = new THREE.TubeGeometry(courbeLumiere, mobile ? 90 : 150, 0.052, 8, false);
    const nbL = geoLumiere.attributes.position.count;
    const couleursL = new Float32Array(nbL * 3);
    const suite: THREE.Color[] = [new THREE.Color('#A5E838'), new THREE.Color('#EACB37'), new THREE.Color('#FF790D')];
    const tmpL = new THREE.Color();
    const radialL = 9;
    for (let i = 0; i < nbL; i++) {
      const t = Math.floor(i / radialL) / (mobile ? 90 : 150);
      const s = t * 2;
      if (s < 1) tmpL.copy(suite[0]).lerp(suite[1], s);
      else tmpL.copy(suite[1]).lerp(suite[2], s - 1);
      couleursL[i * 3] = tmpL.r;
      couleursL[i * 3 + 1] = tmpL.g;
      couleursL[i * 3 + 2] = tmpL.b;
    }
    geoLumiere.setAttribute('color', new THREE.BufferAttribute(couleursL, 3));
    const matLumiere = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rubanLumiere = new THREE.Mesh(geoLumiere, matLumiere);
    geometries.push(geoLumiere);
    materiaux.push(matLumiere);
    scene.add(rubanLumiere);

    /* ---------- Poussière de lumière ---------- */
    const NB = mobile ? 120 : 240;
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

    /* ---------- Connexions organiques entre particules proches ----------
       Constellation vivante — uniquement les voisines, jamais le
       « cerveau IA » générique. Statique dans le champ, vit avec lui. */
    if (!mobile) {
      const seuil = 1.15;
      const sommets: number[] = [];
      const couleursC: number[] = [];
      const limite = Math.min(NB, 110);
      for (let i = 0; i < limite; i++) {
        for (let j = i + 1; j < limite; j++) {
          const dx = positions[i * 3] - positions[j * 3];
          const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
          const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < seuil) {
            sommets.push(
              positions[i * 3],
              positions[i * 3 + 1],
              positions[i * 3 + 2],
              positions[j * 3],
              positions[j * 3 + 1],
              positions[j * 3 + 2],
            );
            const ci = paletteP[i % 3];
            const cj = paletteP[j % 3];
            couleursC.push(ci.r, ci.g, ci.b, cj.r, cj.g, cj.b);
          }
        }
      }
      if (sommets.length) {
        const geoC = new THREE.BufferGeometry();
        geoC.setAttribute('position', new THREE.Float32BufferAttribute(sommets, 3));
        geoC.setAttribute('color', new THREE.Float32BufferAttribute(couleursC, 3));
        const matC = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.17,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const connexions = new THREE.LineSegments(geoC, matC);
        geometries.push(geoC);
        materiaux.push(matC);
        points.add(connexions);
      }
    }

    /* ---------- Lumière ---------- */
    scene.add(new THREE.AmbientLight(0xfff6e0, 1.05));
    const lumChaud = new THREE.PointLight(0xffb347, 90, 30);
    lumChaud.position.set(4, 3, 5);
    scene.add(lumChaud);
    const lumVert = new THREE.PointLight(0x9be15d, 55, 26);
    lumVert.position.set(-5, -1.5, 4);
    scene.add(lumVert);

    /* ---------- Interaction / boucle ---------- */
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
        // Le ruban de lumière respire et dérive en sens inverse
        rubanLumiere.rotation.y = -brut * 0.07 + souris.x * 0.12;
        rubanLumiere.position.y = Math.sin(brut * 0.42) * 0.16;
        matLumiere.opacity = 0.5 + Math.sin(brut * 1.1) * 0.14;
      }
      renderer.render(scene, camera);
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
