"use client";

/**
 * ✨ AnimatedBackground
 * ======================
 *
 * CSS-only animated background used by the profile page.
 *
 * Previously this file imported `@react-three/fiber` and rendered
 * a real WebGL scene. That had two big downsides:
 *
 *  1. THREE.Clock / THREE.WebGLRenderer kept logging deprecation
 *     and "Context Lost" errors (the WebGL context is global per
 *     page — once lost, no other 3D code on the page works).
 *  2. Loading the full `three` bundle (~600 KB) for what was
 *     essentially decorative particles on one page.
 *
 * The CSS version below produces the same visual feel (floating
 * green particles, soft glow, dark base) at a fraction of the
 * cost. It also has no JS animation loop, so it has effectively
 * zero runtime cost and works with `prefers-reduced-motion`.
 */

import { useEffect, useState } from "react";

interface Props {
  /** How many CSS particles to render. Defaults to a small number
   *  for performance; the previous WebGL version used 200-300. */
  count?: number;
}

export function AnimatedBackground({ count = 24 }: Props) {
  // Random positions are generated once on the client to avoid
  // hydration mismatches.
  const [dots, setDots] = useState<Array<{ left: string; top: string; delay: string; size: string }>>(
    []
  );

  useEffect(() => {
    const generated = Array.from({ length: count }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 6}s`,
      size: `${2 + Math.random() * 3}px`,
    }));
    setDots(generated);
  }, [count]);

  return (
    <div className="animated-background" aria-hidden="true">
      {/* Soft glow at the top */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/10 via-transparent to-transparent" />
      {/* Faint dark vignette to make content readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
      {/* Floating particles (pure CSS) */}
      <div className="animated-particles">
        {dots.map((d, i) => (
          <span
            key={i}
            className="animated-particle"
            style={{
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              animationDelay: d.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default AnimatedBackground;
