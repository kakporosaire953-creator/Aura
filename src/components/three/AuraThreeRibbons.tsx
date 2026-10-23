/**
 * Aura Three — sculpture de rubans organiques en 3D (Three.js).
 *
 * Pièce décorative « Aura Light » : des rubans vert → jaune → orange tournent
 * lentement autour de la marque. NE REMPLACE JAMAIS le logo officiel — la
 * scène est un environnement lumineux qui l'accompagne.
 *
 * Performance : DPR plafonné, pause hors-écran / onglet caché, une seule image
 * fixe en prefers-reduced-motion.
 */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AuraThreeRibbonsProps {
  className?: string;
  /** Rotation initiale (radians) pour varier les compositions */
  phase?: number;
  /** Opacité globale de la scène */
  opacity?: number;
  /** Accélère doucement la rotation au survol (activé par défaut) */
  interactive?: boolean;
}

function buildRibbonCurve(radius: number, height: number, twist: number, phase: number) {
  const points: THREE.Vector3[] = [];
  const segments = 140;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2 + phase;
    const r = radius * (1 + 0.22 * Math.sin(t * Math.PI * 2 * 2 + phase));
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * r,
        Math.sin(t * Math.PI * 2 + phase) * height * 0.5 +
          Math.sin(t * Math.PI * 6 + phase) * 0.12,
        Math.sin(angle) * r * 0.72
      )
    );
  }
  return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.6);
}

function applyRibbonGradient(geometry: THREE.TubeGeometry, from: THREE.Color, to: THREE.Color) {
  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const t = (i / positions.count) * 2 % 1;
    color.copy(from).lerp(to, t);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

export const AuraThreeRibbons: React.FC<AuraThreeRibbonsProps> = ({
  className = '',
  phase = 0,
  opacity = 1,
  interactive = true,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const width = host.clientWidth || 480;
    const height = host.clientHeight || 480;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      // WebGL indisponible : la scène décorative est ignorée sans casser la page
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 60);
    camera.position.set(0, 0.25, 5.4);

    // Lumières chaleureuses (identité Aura)
    scene.add(new THREE.AmbientLight(0xfff6e6, 1.05));
    const keyLight = new THREE.DirectionalLight(0xfff2cf, 2.1);
    keyLight.position.set(3.2, 4.2, 4.5);
    scene.add(keyLight);
    const greenFill = new THREE.PointLight(0x8ccb4a, 22, 18);
    greenFill.position.set(-3.4, 1.4, 2.6);
    scene.add(greenFill);
    const orangeRim = new THREE.PointLight(0xff790d, 16, 16);
    orangeRim.position.set(2.8, -1.6, -2.2);
    scene.add(orangeRim);

    const group = new THREE.Group();
    scene.add(group);

    const palette: Array<[number, number]> = [
      [0x078348, 0x8ccb4a],
      [0x8ccb4a, 0xeacb37],
      [0xeacb37, 0xff790d],
    ];
    const ribbons: THREE.Mesh[] = [];
    palette.forEach(([fromHex, toHex], i) => {
      const curve = buildRibbonCurve(1.32 + i * 0.34, 1.15 + i * 0.22, 2 + i, phase + i * 1.7);
      const geometry = new THREE.TubeGeometry(curve, 220, 0.085 + i * 0.028, 14, true);
      applyRibbonGradient(geometry, new THREE.Color(fromHex), new THREE.Color(toHex));
      const material = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.32,
        metalness: 0.06,
        clearcoat: 0.85,
        clearcoatRoughness: 0.28,
        transparent: true,
        opacity: 0.92 - i * 0.1,
        emissive: new THREE.Color(fromHex),
        emissiveIntensity: 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = 0.35 + i * 0.42;
      mesh.rotation.z = -0.2 + i * 0.35;
      ribbons.push(mesh);
      group.add(mesh);
    });

    // Particules fines (poussière lumineuse)
    const particleCount = 110;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 6.4;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 4.6;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4.2;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf3d52e,
      size: 0.028,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    if (interactive && !reducedMotion) {
      host.addEventListener('pointermove', onPointerMove);
    }

    let inView = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );
    observer.observe(host);

    let frameId = 0;
    const clock = new THREE.Clock();
    let elapsed = 0;

    const renderFrame = () => {
      renderer.render(scene, camera);
    };

    const tick = () => {
      frameId = window.requestAnimationFrame(tick);
      if (document.hidden || !inView) return;

      const delta = Math.min(clock.getDelta(), 0.06);
      elapsed += delta;

      group.rotation.y += delta * 0.16;
      group.rotation.x = Math.sin(elapsed * 0.22) * 0.08;
      group.position.y = Math.sin(elapsed * 0.5) * 0.12;
      particles.rotation.y -= delta * 0.05;

      ribbons.forEach((mesh, i) => {
        mesh.rotation.y += delta * (0.05 + i * 0.03) * (i % 2 === 0 ? 1 : -1);
      });

      camera.position.x += (pointerX * 0.55 - camera.position.x) * 0.045;
      camera.position.y += (0.25 - pointerY * 0.4 - camera.position.y) * 0.045;
      camera.lookAt(0, 0, 0);

      renderFrame();
    };

    if (reducedMotion) {
      renderFrame();
    } else {
      clock.start();
      tick();
    }

    const resizeObserver = new ResizeObserver(() => {
      const w = host.clientWidth || width;
      const h = host.clientHeight || height;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderFrame();
    });
    resizeObserver.observe(host);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      ribbons.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [phase, interactive]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
    />
  );
};
