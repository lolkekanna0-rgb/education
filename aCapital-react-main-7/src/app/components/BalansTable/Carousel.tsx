"use client";

import Image from "next/image";
import { useRef } from "react";
import styles from "./Carousel.module.scss";

type CarouselProps = {
  items: { id: number; title: string; img: string }[];
};

export default function Carousel({ items }: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const next = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: 320, behavior: "smooth" });
  };

  const prev = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: -320, behavior: "smooth" });
  };

  return (
    <div className={styles.carousel}>
      <button onClick={prev} className={`${styles.arrow} ${styles.left}`}>
        ‹
      </button>

      <div ref={containerRef} className={styles.track}>
        {items.map((item) => (
          <div key={item.id} className={styles.card}>
            <Image src={item.img} alt={item.title} width={320} height={160} />
          </div>
        ))}
      </div>

      <button onClick={next} className={`${styles.arrow} ${styles.right}`}>
        ›
      </button>
    </div>
  );
}
