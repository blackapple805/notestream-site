// src/components/ScrollReveal.jsx
import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

export default function ScrollReveal({ children, delay = 0, y = 40 }) {
  const ref = useRef(null);
  const controls = useAnimation();
  const inView = useInView(ref, { once: false, amount: 0.3 });

  useEffect(() => {
    if (inView) controls.start("visible");
    else controls.start("hidden");
  }, [inView, controls]);

  const variants = {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay, ease: "easeOut" },
    },
  };

  return (
    <motion.div ref={ref} initial="hidden" animate={controls} variants={variants}>
      {children}
    </motion.div>
  );
}
