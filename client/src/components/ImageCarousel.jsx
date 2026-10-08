import React, { useState } from 'react';

const ImageCarousel = ({ images = [], video, alt = '' }) => {
  const [index, setIndex] = useState(0);
  const slides = images || [];

  if (!slides.length && !video) return null;

  const showArrows = slides.length > 1;

  return (
    <div className="relative rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 aspect-[4/3]">
      {video?.url ? (
        <video
          src={video.url}
          controls
          preload="metadata"
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={slides[index]?.url}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      )}

      {!video?.url && showArrows && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i === 0 ? slides.length - 1 : i - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i === slides.length - 1 ? 0 : i + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur"
            aria-label="Next image"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
