"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, ContactShadows } from "@react-three/drei";
import { useBinderStore } from "@/store/binderStore";
import { BinderMesh } from "./BinderMesh";
import { BinderSpread3D } from "./BinderSpread3D";
import { BinderCanvasError } from "./BinderCanvasError";

export function BinderCanvas() {
  const binder = useBinderStore((s) => s.binder);
  if (!binder) return null;

  return (
    <BinderCanvasError>
    <Canvas
      camera={{ position: [0, 0.6, 9], fov: 40 }}
      shadows
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0c1020"]} />

      {/* Key light — warm, from upper-right */}
      <directionalLight
        position={[5, 8, 6]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        color="#fff6e8"
      />
      {/* Fill light — cool, from left */}
      <directionalLight position={[-5, 3, 4]} intensity={0.55} color="#c8deff" />
      {/* Soft ambient */}
      <ambientLight intensity={0.3} />
      {/* Subtle rim from behind/below for depth */}
      <pointLight position={[0, -3, -3]} intensity={0.4} color="#4466cc" />

      <Suspense fallback={null}>
        <Environment preset="studio" />
        <BinderMesh coverColor={binder.coverColor} />
        <BinderSpread3D binder={binder} />
        <ContactShadows
          position={[0, -2.3, 0]}
          opacity={0.45}
          scale={14}
          blur={2.8}
          far={4.5}
          color="#00001a"
        />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI * 0.78}
        minDistance={4.5}
        maxDistance={14}
        target={[0, 0, 0]}
      />
    </Canvas>
    </BinderCanvasError>
  );
}
