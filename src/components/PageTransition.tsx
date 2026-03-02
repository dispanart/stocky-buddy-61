import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [currentChildren, setCurrentChildren] = useState(children);
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== currentPath) {
      // Exit: fade out
      setIsVisible(false);
      const timeout = setTimeout(() => {
        setCurrentChildren(children);
        setCurrentPath(location.pathname);
        // Enter: fade in
        requestAnimationFrame(() => setIsVisible(true));
      }, 150);
      return () => clearTimeout(timeout);
    } else {
      setCurrentChildren(children);
    }
  }, [location.pathname, children]);

  // Initial mount fade in
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3"
      }`}
    >
      {currentChildren}
    </div>
  );
}
