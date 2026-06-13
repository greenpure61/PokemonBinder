"use client";

import { useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/three";
import { useBinderStore } from "@/store/binderStore";
import { BinderPage3D } from "./BinderPage3D";
import { PAGE_W, SPINE_W, LEFT_PAGE_X, RIGHT_PAGE_X } from "@/lib/binderGeometry";
import type { BinderWithPages, BinderPageWithSlots } from "@/types/binder";

interface Props {
  binder: BinderWithPages;
}

export function BinderSpread3D({ binder }: Props) {
  const currentSpreadIndex = useBinderStore((s) => s.currentSpreadIndex);
  const prevIndexRef = useRef(currentSpreadIndex);
  const isAnimatingRef = useRef(false);

  const [isFlipping, setIsFlipping] = useState(false);
  const [flipContent, setFlipContent] = useState<BinderPageWithSlots | undefined>(undefined);
  const [flipDir, setFlipDir] = useState<"forward" | "backward">("forward");

  const [{ rotY }, api] = useSpring(() => ({ rotY: 0 }));

  // Derive a Z-lift arc from rotY so the page lifts as it turns
  const posZ = rotY.to((r) => Math.sin(Math.abs(r)) * 0.55);

  useEffect(() => {
    const prev = prevIndexRef.current;
    if (prev === currentSpreadIndex || isAnimatingRef.current) return;

    const dir = currentSpreadIndex > prev ? "forward" : "backward";
    prevIndexRef.current = currentSpreadIndex;

    const turningPageIdx = dir === "forward"
      ? prev * 2 + 1
      : currentSpreadIndex * 2;

    setFlipContent(binder.pages[turningPageIdx]);
    setFlipDir(dir);
    setIsFlipping(true);
    isAnimatingRef.current = true;

    api.start({
      from: { rotY: 0 },
      to: { rotY: dir === "forward" ? -Math.PI : Math.PI },
      config: { mass: 1, tension: 210, friction: 26 },
      onRest: () => {
        setIsFlipping(false);
        isAnimatingRef.current = false;
        api.set({ rotY: 0 });
      },
    });
  }, [currentSpreadIndex, binder.pages, api]);

  const leftPage = binder.pages[currentSpreadIndex * 2];
  const rightPage = binder.pages[currentSpreadIndex * 2 + 1];
  const pivotX = flipDir === "forward" ? SPINE_W / 2 : -SPINE_W / 2;
  const pageOffsetX = flipDir === "forward" ? PAGE_W / 2 : -PAGE_W / 2;

  return (
    <group>
      <group position={[LEFT_PAGE_X, 0, 0]}>
        <BinderPage3D page={leftPage} layout={binder.pocketLayout} />
      </group>

      <group position={[RIGHT_PAGE_X, 0, 0]}>
        <BinderPage3D page={rightPage} layout={binder.pocketLayout} />
      </group>

      {isFlipping && (
        <animated.group position-x={pivotX} position-z={posZ}>
          <animated.group rotation-y={rotY}>
            <group position={[pageOffsetX, 0, 0]}>
              <BinderPage3D page={flipContent} layout={binder.pocketLayout} />
            </group>
          </animated.group>
        </animated.group>
      )}
    </group>
  );
}
