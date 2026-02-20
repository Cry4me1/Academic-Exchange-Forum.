import React, { useEffect } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';

interface AcademicSnakeProps {
  isActive: boolean;
  onClick: () => void;
}

export const AcademicSnake: React.FC<AcademicSnakeProps> = ({ isActive, onClick }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (isActive) {
      controls.start('visible');
    } else {
      controls.start('hidden');
    }
  }, [isActive, controls]);

  // Path for a stylized snake forming a loose "S" or "&" shape around a quill/book metaphor
  const snakePath = "M150,400 C150,400 100,350 120,300 C140,250 250,250 280,300 C310,350 250,450 180,450 C110,450 80,350 100,250 C120,150 250,100 300,120 C350,140 380,200 350,250";

  const draw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { type: "spring", duration: 2.5, bounce: 0 },
        opacity: { duration: 0.01 }
      }
    }
  };

  const scalePulse: Variants = {
    idle: { scale: 1 },
    hover: { scale: 1.05, filter: "drop-shadow(0px 0px 8px rgba(212, 175, 55, 0.6))" }
  };

  return (
    <motion.div
      className="relative cursor-pointer w-full h-full flex justify-center items-center"
      onClick={onClick}
      whileHover="hover"
      initial="idle"
      animate="idle"
      variants={scalePulse}
    >
      <svg
        viewBox="0 0 500 600"
        className="w-full h-full max-w-[600px] max-h-[700px] drop-shadow-2xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#FEE174" />
            <stop offset="100%" stopColor="#B4941F" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Decorative Background Elements - Abstract Book Pages */}
        <motion.path
          d="M100,500 L400,500 L420,480 L120,480 Z"
          fill="#330000"
          opacity="0.1"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 0.1 }}
          transition={{ delay: 0.5 }}
        />
        <motion.path
          d="M100,480 L400,480 L420,460 L120,460 Z"
          fill="#550000"
          opacity="0.1"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 0.1 }}
          transition={{ delay: 0.7 }}
        />

        {/* The Snake Body */}
        <motion.path
          d={snakePath}
          fill="transparent"
          stroke="url(#gold-gradient)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={draw}
          initial="hidden"
          animate={controls}
          filter="url(#glow)"
        />

        {/* Snake Scales Texture (Masked overlay) */}
        <motion.path
          d={snakePath}
          fill="transparent"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="18"
          strokeDasharray="4 8"
          variants={draw}
          initial="hidden"
          animate={controls}
        />

        {/* Snake Head Details */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ delay: 2.2, duration: 0.5 }}
        >
          {/* Head Shape */}
          <circle cx="350" cy="250" r="15" fill="url(#gold-gradient)" />
          {/* Eye */}
          <circle cx="355" cy="246" r="2" fill="#8B0000" />
          {/* Tongue */}
          <path d="M362,255 L370,260 L362,265" stroke="#8B0000" strokeWidth="2" fill="transparent" />
        </motion.g>

        {/* Text changed to Chinese "乙巳大吉" */}
        <motion.text
          x="250"
          y="180"
          textAnchor="middle"
          fill="#8B0000"
          fontFamily="serif"
          fontWeight="bold"
          fontSize="28"
          letterSpacing="0.2em"
          initial={{ opacity: 0, y: 10 }}
          animate={isActive ? { opacity: 0.8, y: 0 } : { opacity: 0 }}
          transition={{ delay: 2.5, duration: 1 }}
        >
          乙巳大吉
        </motion.text>
      </svg>
    </motion.div>
  );
};