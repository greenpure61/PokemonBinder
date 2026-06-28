"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/uiStore";

interface Props {
  topNav: React.ReactNode;
  leftSidebar: React.ReactNode;
  children: React.ReactNode;
  rightSidebar: React.ReactNode;
}

const SPRING = { type: "spring" as const, stiffness: 380, damping: 38 };

export function EditorLayout({ topNav, leftSidebar, children, rightSidebar }: Props) {
  const leftOpen = useUIStore((s) => s.leftSidebarOpen);
  const rightOpen = useUIStore((s) => s.rightSidebarOpen);
  const toggleLeft = useUIStore((s) => s.toggleLeftSidebar);
  const toggleRight = useUIStore((s) => s.toggleRightSidebar);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Render-after-mount guard so mobile overlays don't flash before we close them.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Start with sidebars closed on mobile
    if (window.innerWidth < 1024) {
      const s = useUIStore.getState();
      if (s.leftSidebarOpen) s.toggleLeftSidebar();
      if (s.rightSidebarOpen) s.toggleRightSidebar();
    }
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {topNav}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left sidebar — desktop animated width */}
        <motion.aside
          initial={false}
          animate={{ width: leftOpen ? 320 : 0 }}
          transition={SPRING}
          className="hidden flex-shrink-0 overflow-hidden lg:block"
        >
          <div className="flex h-full w-80 flex-col border-r border-border bg-surface">{leftSidebar}</div>
        </motion.aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4">{children}</main>

        {/* Right sidebar — desktop animated width */}
        <motion.aside
          initial={false}
          animate={{ width: rightOpen ? 224 : 0 }}
          transition={SPRING}
          className="hidden flex-shrink-0 overflow-hidden lg:block"
        >
          <div className="flex h-full w-56 flex-col border-l border-border bg-surface">{rightSidebar}</div>
        </motion.aside>

        {/* Mobile left overlay */}
        <AnimatePresence>
          {mounted && leftOpen && (
            <motion.div
              key="left-overlay"
              className="fixed inset-0 z-40 flex lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={toggleLeft} />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={SPRING}
                className="relative z-10 flex w-72 flex-col overflow-hidden border-r border-border bg-surface shadow-xl"
              >
                {leftSidebar}
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile right overlay */}
        <AnimatePresence>
          {mounted && rightOpen && (
            <motion.div
              key="right-overlay"
              className="fixed inset-0 z-40 flex justify-end lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={toggleRight} />
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={SPRING}
                className="relative z-10 flex w-72 flex-col overflow-hidden border-l border-border bg-surface shadow-xl"
              >
                {rightSidebar}
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
