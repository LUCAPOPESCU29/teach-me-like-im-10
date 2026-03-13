"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "./AuthProvider";

interface Props {
  slug: string;
  topicName: string;
  lang: string;
}

export default function BookmarkButton({ slug, topicName, lang }: Props) {
  const { data: dataLayer } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    dataLayer.isBookmarked(slug).then(setBookmarked);
  }, [slug, dataLayer]);

  async function toggle() {
    setAnimating(true);
    if (bookmarked) {
      await dataLayer.removeBookmark(slug);
      setBookmarked(false);
    } else {
      await dataLayer.addBookmark(slug, topicName, lang);
      setBookmarked(true);
    }
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <motion.button
      onClick={toggle}
      className="p-2 rounded-lg border border-white/10 hover:border-white/20 transition-all"
      whileTap={{ scale: 0.9 }}
      title={bookmarked ? "Remove bookmark" : "Bookmark topic"}
    >
      <motion.svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill={bookmarked ? "#f59e0b" : "none"}
        stroke={bookmarked ? "#f59e0b" : "rgba(255,255,255,0.3)"}
        strokeWidth={2}
        animate={animating ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </motion.svg>
    </motion.button>
  );
}
