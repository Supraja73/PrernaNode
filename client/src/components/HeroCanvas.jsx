import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext.jsx';

// A lightweight, dependency-free (no @react-three/fiber) particle "horizon" scene.
// Kept intentionally simple: no heavy postprocessing, so it stays smooth on modest hardware.
const HeroCanvas = () => {
  const mountRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0.4, 6);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const COUNT = window.innerWidth < 700 ? 700 : 1700;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const baseY = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);

    const palette = [
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0xec4899),
      new THREE.Color(0x22d3ee),
      new THREE.Color(0xf0b429),
    ];

    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 6;
      const x = Math.cos(angle) * radius * (0.6 + Math.random() * 0.6);
      const y = -2 + Math.random() * 4.2 - Math.abs(x) * 0.12;
      const z = (Math.random() - 0.5) * 6 - 2;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      baseY[i] = y;
      speeds[i] = 0.15 + Math.random() * 0.35;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: theme === 'dark' ? 0.9 : 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const onMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const posAttr = geo.attributes.position;
      for (let i = 0; i < COUNT; i++) {
        posAttr.array[i * 3 + 1] = baseY[i] + Math.sin(t * speeds[i] + i) * 0.18;
      }
      posAttr.needsUpdate = true;
      points.rotation.y = Math.sin(t * 0.05) * 0.06;

      targetX += (mouseX - targetX) * 0.03;
      targetY += (mouseY - targetY) * 0.03;
      camera.position.x = targetX * 0.6;
      camera.position.y = 0.4 - targetY * 0.3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      resizeObserver.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
};

export default HeroCanvas;
