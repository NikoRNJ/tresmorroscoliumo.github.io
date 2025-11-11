"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface Props {
  images: string[];
}

export const CabinGallery = ({ images }: Props) => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const slides = images.map((src) => ({ src }));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {images.map((image, idx) => (
          <button
            type="button"
            key={image}
            className="relative h-48 overflow-hidden rounded-2xl border transition hover:scale-[1.01]"
            onClick={() => {
              setIndex(idx);
              setOpen(true);
            }}
          >
            <Image
              src={image}
              alt={`Foto ${idx + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <Lightbox
        open={open}
        index={index}
        close={() => setOpen(false)}
        slides={slides}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
};
