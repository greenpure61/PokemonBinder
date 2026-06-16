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
    setMounted(true);
    // Start with sidebars closed on mobile
    if (window.innerWidth < 1024) {
      const s = useUIStore.getState();
      if (s.leftSidebarOpen) s.toggleLeftSidebar();
      if (s.rightSidebarOpen) s.toggleRightSidebar();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0a0e1a] overflow-hidden">
      {topNav}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left sidebar — desktop animated width */}
        <motion.aside
          initial={false}
          animate={{ width: leftOpen ? 320 : 0 }}
          transition={SPRING}
          className="hidden lg:block flex-shrink-0 overflow-hidden"
        >
          <div className="w-80 h-full flex flex-col border-r border-white/5">
            {leftSidebar}
          </div>
        </motion.aside>

        <main className="flex-1 flex flex-col overflow-hidden p-4 min-w-0 min-h-0">
          {children}
        </main>

        {/* Right sidebar — desktop animated width */}
        <motion.aside
          initial={false}
          animate={{ width: rightOpen ? 224 : 0 }}
          transition={SPRING}
          className="hidden lg:block flex-shrink-0 overflow-hidden"
        >
          <div className="w-56 h-full flex flex-col border-l border-white/5">
            {rightSidebar}
          </div>
        </motion.aside>

        {/* Mobile left overlay */}
        <AnimatePresence>
          {mounted && leftOpen && (
            <motion.div
              key="left-overlay"
              className="lg:hidden fixed inset-0 z-40 flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={toggleLeft}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={SPRING}
                className="relative z-10 w-72 bg-[#0d1220] border-r border-white/10 flex flex-col overflow-hidden shadow-2xl"
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
              className="lg:hidden fixed inset-0 z-40 flex justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={toggleRight}
              />
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={SPRING}
                className="relative z-10 w-72 bg-[#0d1220] border-l border-white/10 flex flex-col overflow-hidden shadow-2xl"
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
