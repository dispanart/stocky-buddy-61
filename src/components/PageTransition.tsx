import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage("exit");
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage("enter");
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [children]);

  // Reset on location change
  useEffect(() => {
    setTransitionStage("enter");
  }, [location.pathname]);

  return (
    <div
      className={`transition-all duration-200 ease-out ${
        transitionStage === "enter"
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2"
      }`}
    >
      {displayChildren}
    </div>
  );
}
