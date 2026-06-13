"use client";

import { Suspense, useState } from "react";
import { useTexture, Html } from "@react-three/drei";
import * as THREE from "three";
import type { BinderPageWithSlots } from "@/types/binder";
import type { BinderLayout } from "@prisma/client";
import { getSlotPositions, PAGE_W, PAGE_H } from "@/lib/binderGeometry";
import { getSlotsPerPage } from "@/lib/utils";

const POCKET_BORDER = 0.02;

function PocketSlot({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <group>
      {/* Pocket seam */}
      <mesh position={[x, y, 0.0004]}>
        <planeGeometry args={[w + POCKET_BORDER * 2, h + POCKET_BORDER * 2]} />
        <meshStandardMaterial color="#8aa0c0" roughness={0.4} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* Pocket fill — clear plastic look */}
      <mesh position={[x, y, 0.0008]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#dce6f5" roughness={0.2} transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
}

function CardTexture3D({
  url, x, y, w, h, cardName,
}: {
  url: string; x: number; y: number; w: number; h: number; cardName: string;
}) {
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <group>
      {/* Pocket seam behind the card */}
      <mesh position={[x, y, 0.0004]}>
        <planeGeometry args={[w + POCKET_BORDER * 2, h + POCKET_BORDER * 2]} />
        <meshStandardMaterial color="#8aa0c0" roughness={0.4} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* Card face */}
      <mesh
        position={[x, y, 0.002]}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} />
        {hovered && cardName && (
          <Html position={[0, -h / 2 - 0.1, 0]} center zIndexRange={[0, 10]}>
            <div
              style={{
                background: "rgba(0,0,0,0.85)",
                color: "#fff",
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 4,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {cardName}
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
}

interface Props {
  page: BinderPageWithSlots | undefined;
  layout: BinderLayout;
}

export function BinderPage3D({ page, layout }: Props) {
  const slotCount = getSlotsPerPage(layout);
  const slotPositions = getSlotPositions(layout);

  return (
    <group>
      {/* Page — double-sided so the back shows as paper when flipping */}
      <mesh receiveShadow>
        <planeGeometry args={[PAGE_W, PAGE_H]} />
        <meshStandardMaterial color="#f5f1e8" roughness={0.9} metalness={0} side={THREE.DoubleSide} />
      </mesh>

      {Array.from({ length: slotCount }).map((_, i) => {
        const pos = slotPositions[i];
        const slot = page?.slots.find((s) => s.slotIndex === i);

        if (slot?.cardImageSmall) {
          return (
            <Suspense
              key={`${i}-${slot.cardImageSmall}`}
              fallback={<PocketSlot x={pos.x} y={pos.y} w={pos.w} h={pos.h} />}
            >
              <CardTexture3D
                url={slot.cardImageSmall}
                x={pos.x} y={pos.y} w={pos.w} h={pos.h}
                cardName={slot.cardName ?? ""}
              />
            </Suspense>
          );
        }
        return <PocketSlot key={i} x={pos.x} y={pos.y} w={pos.w} h={pos.h} />;
      })}
    </group>
  );
}
