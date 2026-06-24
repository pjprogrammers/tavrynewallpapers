"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";

if (typeof console !== "undefined") {
  const _warn = console.warn;
  let suppressed = false;
  console.warn = (...args) => {
    if (!suppressed && typeof args[0] === "string" && args[0].includes("THREE.Clock")) {
      suppressed = true;
      return;
    }
    _warn(...args);
  };
}

const PARTICLE_COUNT = 1800;
const PRIMARY = new THREE.Color("#00e0a2");
const SECONDARY = new THREE.Color("#4260ec");
const ACCENT = new THREE.Color("#ffffff");

function ParticleField({ scrollY, fadeProgress }: { scrollY: React.MutableRefObject<number>; fadeProgress: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const scrollOffset = useRef(0);
  const currentOpacity = useRef(0.85);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const cols = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 3 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.cos(phi);
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const t = Math.random();
      const c = t < 0.45 ? PRIMARY.clone() : t < 0.8 ? SECONDARY.clone() : ACCENT.clone();
      c.multiplyScalar(0.5 + Math.random() * 0.5);
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }

    return [pos, cols];
  }, []);

  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!meshRef.current) return;

    targetRotation.current.y += (mouse.current.x * 0.5 - targetRotation.current.y) * 0.005;
    targetRotation.current.x += (-mouse.current.y * 0.3 - targetRotation.current.x) * 0.005;

    meshRef.current.rotation.y = state.clock.elapsedTime * 0.012 + targetRotation.current.y;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.006) * 0.08 + targetRotation.current.x;

    const scrollNormalized = scrollY.current / Math.max(window.innerHeight, 1);
    scrollOffset.current += (scrollNormalized * 1.2 - scrollOffset.current) * 0.04;
    meshRef.current.position.y = scrollOffset.current;

    const sizes = meshRef.current.geometry.attributes.size;
    if (sizes) {
      const array = sizes.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        array[i] = 0.03 + Math.sin(state.clock.elapsedTime * (0.3 + (i % 5) * 0.1) + i * 0.01) * 0.02 + 0.02;
      }
      sizes.needsUpdate = true;
    }

    if (materialRef.current) {
      const target = (1 - fadeProgress.current) * 0.85;
      currentOpacity.current += (target - currentOpacity.current) * 0.04;
      materialRef.current.opacity = currentOpacity.current;
    }
  });

  const sizeArray = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i] = 0.03 + Math.random() * 0.06;
    }
    return arr;
  }, []);

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          args={[positions, 3]}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          args={[colors, 3]}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={PARTICLE_COUNT}
          args={[sizeArray, 1]}
          array={sizeArray}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.06}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function HeroParticles() {
  const scrollY = useRef(0);
  const fadeProgress = useRef(0);
  const targetOffset = useRef(0);

  useEffect(() => {
    const getSectionTop = () => {
      const isDesktop = window.innerWidth >= 1024;
      const sectionId = isDesktop ? "featured-section-title" : "categories-section-title";
      const el = document.getElementById(sectionId);
      if (el) {
        const section = el.closest("section");
        if (section) return section.offsetTop;
      }
      return 0;
    };

    targetOffset.current = getSectionTop();

    const applyFade = () => {
      if (targetOffset.current > 0) {
        const vh = window.innerHeight;
        const startFade = targetOffset.current - vh * 0.7;
        const endFade = targetOffset.current + vh * 0.3;
        const raw = (window.scrollY - startFade) / (endFade - startFade);
        fadeProgress.current = raw <= 0 ? 0 : raw >= 1 ? 1 : raw;
      }
    };

    const handleScroll = () => {
      scrollY.current = window.scrollY;
      applyFade();
    };

    const handleResize = () => {
      targetOffset.current = getSectionTop();
      applyFade();
    };

    applyFade();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.8, ease: "easeOut" }}
      className="hero-particles"
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <ParticleField scrollY={scrollY} fadeProgress={fadeProgress} />
      </Canvas>
    </motion.div>
  );
}
