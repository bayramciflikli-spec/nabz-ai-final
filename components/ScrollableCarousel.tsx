"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface ScrollableCarouselProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** Otomatik kayma hızı (px/saniye) */
  speed?: number;
}

export function ScrollableCarousel({
  id = "carousel",
  children,
  className = "",
  contentClassName = "gap-6 py-4",
  speed = 80,
}: ScrollableCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const isTouchDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  const didDragRef = useRef(false);
  const dragThreshold = 8;
  const lastScrollRef = useRef(0);
  const mouseXRef = useRef<number | null>(null);
  const isHoveredRef = useRef(false);

  // Mouse pozisyonuna göre kayma + otomatik kayma
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const el = scrollRef.current;
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (el && !isDraggingRef.current && !isTouchDraggingRef.current) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 0) {
          const half = el.scrollWidth / 2;
          let scrollDelta = 0;

          if (isHoveredRef.current && mouseXRef.current !== null) {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const relX = mouseXRef.current - centerX;
            const zoneWidth = rect.width / 3;
            const hoverSpeedMult = 2.6;
            if (relX > zoneWidth) {
              scrollDelta = -speed * dt * hoverSpeedMult * Math.min(1, (relX - zoneWidth) / zoneWidth);
            } else if (relX < -zoneWidth) {
              scrollDelta = speed * dt * hoverSpeedMult * Math.min(1, (-zoneWidth - relX) / zoneWidth);
            } else {
              scrollDelta = (relX > 0 ? -1 : 1) * speed * dt * 0.55;
            }
          } else {
            scrollDelta = speed * dt;
          }

          let next = lastScrollRef.current + scrollDelta;
          if (next >= half) next -= half;
          if (next < 0) next += half;
          lastScrollRef.current = next;
          el.scrollLeft = next;
        }
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [speed]);

  useEffect(() => {
    const onGlobalMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    const onGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const el = scrollRef.current;
      if (!el) return;

      const dx = startXRef.current - e.clientX;
      if (Math.abs(dx) > dragThreshold) didDragRef.current = true;

      const half = el.scrollWidth / 2;
      let next = startScrollRef.current + dx;
      next = ((next % half) + half) % half;
      el.scrollLeft = next;
      lastScrollRef.current = next;
      startXRef.current = e.clientX;
      startScrollRef.current = next;
    };

    window.addEventListener("mouseup", onGlobalMouseUp);
    window.addEventListener("mousemove", onGlobalMouseMove);
    return () => {
      window.removeEventListener("mouseup", onGlobalMouseUp);
      window.removeEventListener("mousemove", onGlobalMouseMove);
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startScrollRef.current = scrollRef.current?.scrollLeft ?? 0;
    didDragRef.current = false;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const touchStartXRef = useRef(0);
  const touchStartScrollRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isTouchDraggingRef.current = true;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartScrollRef.current = scrollRef.current?.scrollLeft ?? 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    const x = e.touches[0].clientX;
    const dx = touchStartXRef.current - x;
    let next = touchStartScrollRef.current + dx;
    next = ((next % half) + half) % half;
    el.scrollLeft = next;
    lastScrollRef.current = next;
    touchStartXRef.current = x;
    touchStartScrollRef.current = next;
  }, []);

  const handleTouchEnd = useCallback(() => {
    isTouchDraggingRef.current = false;
  }, []);

  return (
    <div
      ref={scrollRef}
      className={`no-scrollbar overflow-x-auto overflow-y-hidden min-w-0 cursor-grab active:cursor-grabbing ${isDragging ? "cursor-grabbing" : ""} ${className}`}
      onMouseDown={handleMouseDown}
      onMouseUp={() => setIsDragging(false)}
      onMouseEnter={(e) => { isHoveredRef.current = true; mouseXRef.current = e.clientX; }}
      onMouseMove={(e) => { mouseXRef.current = e.clientX; }}
      onMouseLeave={() => { isHoveredRef.current = false; mouseXRef.current = null; }}
      onClickCapture={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
      }}
    >
      <div className={`flex flex-row flex-nowrap items-start w-max select-none ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}
