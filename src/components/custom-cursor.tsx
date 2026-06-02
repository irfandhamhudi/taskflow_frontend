import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const mouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const mouseLeave = () => {
      setIsVisible(false);
    };

    const mouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "button" ||
        target.tagName.toLowerCase() === "a" ||
        target.closest("button") ||
        target.closest("a") ||
        target.getAttribute("role") === "button" ||
        target.classList.contains("cursor-pointer") ||
        target.closest(".cursor-pointer")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseleave", mouseLeave);
    window.addEventListener("mouseenter", mouseEnter);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseleave", mouseLeave);
      window.removeEventListener("mouseenter", mouseEnter);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isVisible]);

  // Don't render on touch devices
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  const variants = {
    default: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        mass: 0.1,
        stiffness: 300,
        damping: 20,
      },
    },
    hover: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      scale: 1.8,
      opacity: 0.5,
      transition: {
        type: "spring",
        mass: 0.1,
        stiffness: 300,
        damping: 20,
      },
    },
  };

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          body, button, a, [role="button"], select, .cursor-pointer {
            cursor: none !important;
          }
        }
      `}</style>
      
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Inner Dot */}
            <motion.div
              className="pointer-events-none fixed top-0 left-0 z-[9999] h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--primary)" }}
              animate={{
                x: mousePosition.x - 4,
                y: mousePosition.y - 4,
                opacity: 1,
              }}
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                type: "tween",
                ease: "linear",
                duration: 0,
              }}
            />
            {/* Outer Ring */}
            <motion.div
              className="pointer-events-none fixed top-0 left-0 z-[9998] h-8 w-8 rounded-full border-2"
              style={{ 
                borderColor: "var(--primary)",
                backgroundColor: "color-mix(in srgb, var(--primary), transparent 90%)" 
              }}
              variants={variants}
              animate={isHovering ? "hover" : "default"}
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
            />

          </>
        )}
      </AnimatePresence>
    </>
  );
};
