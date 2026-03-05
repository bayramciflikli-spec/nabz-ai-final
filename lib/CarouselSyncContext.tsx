"use client";

import { createContext, useContext, useRef, useCallback, useEffect } from "react";

type CarouselId = string;

interface CarouselSyncContextValue {
  registerCarousel: (id: CarouselId, getRect: () => DOMRect | null) => void;
  unregisterCarousel: (id: CarouselId) => void;
  setPaused: (id: CarouselId, paused: boolean) => void;
  setMouseInCarousel: (id: CarouselId | null, clientX: number) => void;
  getScrollPhase: () => number;
  setScrollPhase: (phase: number) => void;
}

const CarouselSyncContext = createContext<CarouselSyncContextValue | null>(null);

export function useCarouselSync() {
  return useContext(CarouselSyncContext);
}

export function CarouselSyncProvider({ children }: { children: React.ReactNode }) {
  const phaseRef = useRef(0);
  const carouselsRef = useRef<Map<CarouselId, () => DOMRect | null>>(new Map());
  const mouseCarouselRef = useRef<CarouselId | null>(null);
  const mouseXRef = useRef(0);

  const registerCarousel = useCallback((id: CarouselId, getRect: () => DOMRect | null) => {
    carouselsRef.current.set(id, getRect);
  }, []);

  const unregisterCarousel = useCallback((id: CarouselId) => {
    carouselsRef.current.delete(id);
  }, []);

  const setPaused = useCallback((id: CarouselId, paused: boolean) => {
    // Pause state is per-carousel, stored in each carousel
    // This is just for future use if needed
  }, []);

  const setMouseInCarousel = useCallback((id: CarouselId | null, clientX: number) => {
    mouseCarouselRef.current = id;
    mouseXRef.current = clientX;
  }, []);

  const getScrollPhase = useCallback(() => phaseRef.current, []);

  const setScrollPhase = useCallback((phase: number) => {
    phaseRef.current = phase;
  }, []);

  useEffect(() => {
    const baseSpeed = 0.25;
    const tiltFactor = 0.35;

    const tick = () => {
      let mouseTilt = 0;
      if (mouseCarouselRef.current) {
        const getRect = carouselsRef.current.get(mouseCarouselRef.current);
        const rect = getRect?.();
        if (rect && rect.width > 0) {
          const centerX = rect.left + rect.width / 2;
          mouseTilt = (mouseXRef.current - centerX) / (rect.width / 2);
          mouseTilt = Math.max(-1, Math.min(1, mouseTilt));
        }
      }

      const delta = (baseSpeed + mouseTilt * tiltFactor) * 0.016;
      let next = phaseRef.current + delta;

      if (next >= 1) next -= 1;
      if (next < 0) next += 1;

      phaseRef.current = next;
    };

    let rafId: number;
    const loop = () => {
      tick();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, []);

  const value: CarouselSyncContextValue = {
    registerCarousel,
    unregisterCarousel,
    setPaused,
    setMouseInCarousel,
    getScrollPhase,
    setScrollPhase,
  };

  return (
    <CarouselSyncContext.Provider value={value}>
      {children}
    </CarouselSyncContext.Provider>
  );
}
