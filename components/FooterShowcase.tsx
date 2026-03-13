"use client";

import { motion } from "framer-motion";
import {
  FiSearch,
  FiLayers,
  FiCheckCircle,
  FiCode,
  FiTrendingUp,
} from "react-icons/fi";
import Carousel from "./Carousel";

const FEATURE_ITEMS = [
  {
    title: "Pick Any Topic",
    description:
      "Type anything you're curious about. Our AI breaks it down into simple, clear explanations.",
    icon: <FiSearch className="carousel-icon" />,
    id: 1,
  },
  {
    title: "5 Depth Levels",
    description:
      "Start simple like you're 10. Go deeper at your own pace — all the way to expert.",
    icon: <FiLayers className="carousel-icon" />,
    id: 2,
  },
  {
    title: "Interactive Quizzes",
    description:
      "Test what you learned with AI-generated quizzes. Earn XP for every correct answer.",
    icon: <FiCheckCircle className="carousel-icon" />,
    id: 3,
  },
  {
    title: "Math & Code",
    description:
      "Specialized modes for mathematics and programming with tailored explanations.",
    icon: <FiCode className="carousel-icon" />,
    id: 4,
  },
  {
    title: "Track Progress",
    description:
      "Build streaks, earn badges, climb the leaderboard. Learning has never been this fun.",
    icon: <FiTrendingUp className="carousel-icon" />,
    id: 5,
  },
];

export default function FooterShowcase() {
  return (
    <motion.section
      className="w-full flex flex-col items-center mt-20 mb-8 sm:mb-4 px-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Section heading */}
      <div className="text-center mb-8">
        <motion.h2
          className="font-display text-3xl sm:text-4xl text-white/80 mb-2"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          How It Works
        </motion.h2>
        <motion.p
          className="text-white/25 text-sm font-sans tracking-wide"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Everything you need to learn anything
        </motion.p>
      </div>

      {/* Carousel */}
      <div style={{ height: "260px", position: "relative" }}>
        <Carousel
          items={FEATURE_ITEMS}
          baseWidth={300}
          autoplay={true}
          autoplayDelay={4000}
          pauseOnHover={true}
          loop={true}
          round={false}
        />
      </div>
    </motion.section>
  );
}
