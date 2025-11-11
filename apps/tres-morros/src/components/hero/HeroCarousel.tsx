"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useCallback } from "react";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

interface Props {
  slides: HeroSlide[];
}

export const HeroCarousel = ({ slides }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-3xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide) => (
            <div
              className="relative min-w-0 flex-[0_0_100%]"
              key={slide.id}
            >
              <div className="relative h-[420px] w-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-8 left-8 max-w-md text-white">
                  <p className="text-sm uppercase tracking-[0.3em]">
                    {slide.subtitle}
                  </p>
                  <h3 className="text-3xl font-semibold">{slide.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-6">
        <button
          type="button"
          onClick={scrollPrev}
          className="pointer-events-auto rounded-full bg-white/70 p-3 text-slate-900 shadow"
          aria-label="Anterior"
        >
          ←
        </button>
        <button
          type="button"
          onClick={scrollNext}
          className="pointer-events-auto rounded-full bg-white/70 p-3 text-slate-900 shadow"
          aria-label="Siguiente"
        >
          →
        </button>
      </div>
    </div>
  );
};
