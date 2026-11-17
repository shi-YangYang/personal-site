"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color: string;
};

type Ring = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
};

type Spark = {
  x: number;
  y: number;
  life: number;
  color: string;
};

export function ClickRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let rings: Ring[] = [];
    let sparks: Spark[] = [];
    let raf = 0;
    let w = 0;
    let h = 0;
    let green = "52, 211, 153";
    const cyan = "34, 211, 238";
    const accent = "132, 204, 22";

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      const g = cs.getPropertyValue("--fx-particle-rgb").trim();
      if (g) green = g;
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const burst = (x: number, y: number) => {
      const palette = [green, green, green, cyan, accent];
      const count = 12 + Math.floor(Math.random() * 8);

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 2.5 + Math.random() * 6;
        const life = 1;
        particles.push({
          x,
          y,
          px: x,
          py: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          decay: 0.015 + Math.random() * 0.025,
          size: 1.2 + Math.random() * 2,
          color: palette[Math.floor(Math.random() * palette.length)],
        });
      }

      rings.push({ x, y, radius: 4, speed: 4.5, alpha: 0.7 });
      sparks.push({ x, y, life: 1, color: green });
    };

    const onClick = (e: MouseEvent) => {
      burst(e.clientX, e.clientY);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.px = p.x;
        p.py = p.y;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vy += 0.06;
        p.life -= p.decay;
        if (p.life <= 0) continue;

        ctx.strokeStyle = `rgba(${p.color}, ${p.life * 0.9})`;
        ctx.lineWidth = p.size;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      rings = rings.filter((r) => r.alpha > 0);
      for (const r of rings) {
        r.radius += r.speed;
        r.speed *= 0.96;
        r.alpha -= 0.035;
        ctx.strokeStyle = `rgba(${green}, ${r.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      sparks = sparks.filter((s) => s.life > 0);
      for (const s of sparks) {
        s.life -= 0.06;
        if (s.life <= 0) continue;
        ctx.fillStyle = `rgba(${s.color}, ${s.life})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3 + (1 - s.life) * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (particles.length || rings.length || sparks.length) {
        raf = requestAnimationFrame(tick);
      }
    };

    readColors();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("click", onClick);
    const themeObserver = new MutationObserver(readColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", onClick);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70]"
    />
  );
}
