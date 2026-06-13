"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { PAGE_H, SPINE_W, COVER_W, COVER_H, COVER_THICK, LEFT_PAGE_X, RIGHT_PAGE_X } from "@/lib/binderGeometry";

const RING_COUNT = 4;
const RING_SPAN = PAGE_H * 0.72;
const PLATE_THICK = 0.03;

function useLeatherTexture(color: string) {
  const tex = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // Staggered diamond grid — simulates leatherette grain
    const sp = 19;
    ctx.lineWidth = 0.75;
    for (let row = -1; row <= Math.ceil(size / (sp * 0.62)) + 1; row++) {
      for (let col = -1; col <= Math.ceil(size / sp) + 1; col++) {
        const cx = col * sp + (row % 2 === 0 ? 0 : sp * 0.5);
        const cy = row * sp * 0.62;
        const r = 4.2;
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Subtle vignette toward edges
    const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.28, size / 2, size / 2, size * 0.72);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3.5, 4.5);
    return t;
  }, [color]);

  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function CoverStitch({ cx, w, h }: { cx: number; w: number; h: number }) {
  const inset = 0.1;
  const z = 0.003;
  const mat = <meshStandardMaterial color="#fff" transparent opacity={0.09} roughness={1} depthWrite={false} />;
  return (
    <group>
      <mesh position={[cx, h / 2 - inset, z]}><planeGeometry args={[w - inset * 2, 0.007]} />{mat}</mesh>
      <mesh position={[cx, -(h / 2 - inset), z]}><planeGeometry args={[w - inset * 2, 0.007]} />{mat}</mesh>
      <mesh position={[cx - w / 2 + inset, 0, z]}><planeGeometry args={[0.007, h - inset * 2]} />{mat}</mesh>
      <mesh position={[cx + w / 2 - inset, 0, z]}><planeGeometry args={[0.007, h - inset * 2]} />{mat}</mesh>
    </group>
  );
}

export function BinderMesh({ coverColor = "#1a1a2e" }: { coverColor?: string }) {
  const leatherTex = useLeatherTexture(coverColor);

  const ringYs = Array.from({ length: RING_COUNT }, (_, i) =>
    -RING_SPAN / 2 + (i / (RING_COUNT - 1)) * RING_SPAN
  );

  return (
    <group>
      {/* Spine */}
      <mesh castShadow position={[0, 0, -COVER_THICK / 2]}>
        <boxGeometry args={[SPINE_W, COVER_H, COVER_THICK]} />
        <meshStandardMaterial color={coverColor} map={leatherTex} roughness={0.65} metalness={0.06} />
      </mesh>

      {/* Left cover */}
      <mesh castShadow position={[LEFT_PAGE_X, 0, -COVER_THICK / 2]}>
        <boxGeometry args={[COVER_W, COVER_H, COVER_THICK]} />
        <meshStandardMaterial color={coverColor} map={leatherTex} roughness={0.7} metalness={0.03} />
      </mesh>
      <CoverStitch cx={LEFT_PAGE_X} w={COVER_W} h={COVER_H} />

      {/* Right cover */}
      <mesh castShadow position={[RIGHT_PAGE_X, 0, -COVER_THICK / 2]}>
        <boxGeometry args={[COVER_W, COVER_H, COVER_THICK]} />
        <meshStandardMaterial color={coverColor} map={leatherTex} roughness={0.7} metalness={0.03} />
      </mesh>
      <CoverStitch cx={RIGHT_PAGE_X} w={COVER_W} h={COVER_H} />

      {/* Ring mechanism plate */}
      <mesh castShadow position={[0, 0, PLATE_THICK / 2 + 0.006]}>
        <boxGeometry args={[SPINE_W * 0.72, PAGE_H * 0.84, PLATE_THICK]} />
        <meshStandardMaterial color="#2e2e2e" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Rings */}
      {ringYs.map((y, i) => (
        <mesh key={i} position={[0, y, PLATE_THICK + 0.015]} rotation-x={Math.PI / 2} castShadow>
          <torusGeometry args={[0.135, 0.022, 20, 56]} />
          <meshStandardMaterial color="#d0d0d0" metalness={0.97} roughness={0.04} envMapIntensity={1.5} />
        </mesh>
      ))}
    </group>
  );
}
