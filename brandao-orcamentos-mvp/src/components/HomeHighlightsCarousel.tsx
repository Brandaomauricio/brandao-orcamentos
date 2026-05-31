"use client";

import { TouchEvent, useEffect, useState } from "react";

export type HomeHighlightSlide = {
  title: string;
  description: string;
  tag: string;
  actionLabel: string;
  href: string;
};

type HomeHighlightsCarouselProps = {
  slides: HomeHighlightSlide[];
  onAction: (href: string) => void;
  message?: string;
};

export function HomeHighlightsCarousel({ slides, onAction, message }: HomeHighlightsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  function showPrevious() {
    setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % slides.length);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX === null) return;

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const distance = touchStartX - touchEndX;

    if (Math.abs(distance) > 40) {
      if (distance > 0) showNext();
      else showPrevious();
    }

    setTouchStartX(null);
  }

  const activeSlide = slides[activeIndex];

  if (!activeSlide) return null;

  return (
    <section className="overflow-hidden rounded-[20px] border border-black/10 bg-graphite text-white shadow-soft">
      <div className="px-4 pt-4">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-wood">Destaque</p>
      </div>

      <div className="relative px-4 pb-4 pt-2" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <button
          type="button"
          onClick={showPrevious}
          aria-label="Destaque anterior"
          className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/20 text-lg font-black text-wood"
        >
          {"<"}
        </button>

        <article className="min-h-[176px] px-4 py-3">
          <span className="inline-block rounded-full bg-warning px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-graphite">
            {activeSlide.tag}
          </span>
          <h2 className="mt-3 min-h-[48px] text-[23px] font-black leading-6 text-white">{activeSlide.title}</h2>
          <p className="mt-2 line-clamp-2 min-h-[44px] text-[15.5px] leading-5 text-white/75">{activeSlide.description}</p>
          <button
            type="button"
            onClick={() => onAction(activeSlide.href)}
            className="mobile-action mobile-action-primary mt-4 block w-full text-center"
          >
            {activeSlide.actionLabel}
          </button>
        </article>

        <button
          type="button"
          onClick={showNext}
          aria-label="Próximo destaque"
          className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/20 text-lg font-black text-wood"
        >
          {">"}
        </button>

        <div className="mt-1 flex items-center justify-center gap-2" aria-label="Indicadores do destaque">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Mostrar destaque ${index + 1}: ${slide.title}`}
              className={`h-2 rounded-full transition-all ${activeIndex === index ? "w-6 bg-warning" : "w-2 bg-white/25"}`}
            />
          ))}
        </div>

        {message ? <div className="mt-3 rounded-xl bg-white/10 p-3 text-center text-xs font-black text-warning">{message}</div> : null}
      </div>
    </section>
  );
}
