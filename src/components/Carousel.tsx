import React, { useEffect, useRef, useState } from "react";

type Props = {
  pictures: string[];
  height?: string;
  width?: string;
  pictureFit?: "cover" | "contain";
  customStyle?: string;
}

const fitTransformer = {
  cover: "object-cover",
  contain: "object-contain",
} as const;

const INITIAL_LOAD_PICTURES = 10;
const SEQUENTIAL_LOAD_PICTURES = 10;
const SCROLL_THRESHOLD_PERCENT = 0.5;

const Carousel = ({
  pictures,
  height = "h-full",
  width = "w-full",
  pictureFit = "cover",
  customStyle = "",
}: Props) => {
  const slideshowRef = useRef<HTMLDivElement>(null);
  const currentThreshold = useRef<number>(1);
  const timeoutRef = useRef<number | null>(null);
  const loadedPicturesSetRef = useRef(new Set<string>());
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - slideshowRef.current!.offsetLeft);
    setScrollLeft(slideshowRef.current!.scrollLeft);

    // Clear the timeout if another drag event starts
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    slideshowRef.current!.style.scrollSnapType = "none"; // Disable scroll snapping during drag
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - slideshowRef.current!.offsetLeft;
    const walk = (x - startX) * 2; // *2 to make the drag more pronounced
    slideshowRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    if (slideshowRef.current) {
      const containerWidth = slideshowRef.current.clientWidth;
      const currentScrollPosition = slideshowRef.current.scrollLeft;
      const pictureIndex = Math.round(currentScrollPosition / containerWidth);
      const snapTo = pictureIndex * containerWidth;

      slideshowRef.current.scrollTo({
        left: snapTo,
        behavior: "smooth",
      });

      // Use setTimeout to delay the reapplication of scrollSnapType
      timeoutRef.current = window.setTimeout(() => {
        if (slideshowRef.current) {
          slideshowRef.current.style.scrollSnapType = "x mandatory";
        }
      }, 600);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    // eslint-disable-next-line
  }, [isDragging, startX, scrollLeft]);

  const preloadPictures = (pictureUrls: string[]) => {
    pictureUrls.forEach((url) => {
      if (!loadedPicturesSetRef.current.has(url)) {
        const pic = new Image();
        pic.src = url;
        loadedPicturesSetRef.current.add(url);
      }
    });
  };

  useEffect(() => {
    if (pictures.length === 0) return;

    const fromStart = pictures.slice(0, INITIAL_LOAD_PICTURES);
    const fromEnd = pictures.slice(-INITIAL_LOAD_PICTURES);
    const combined = [...fromStart, ...fromEnd];
    preloadPictures(Array.from(new Set<string>(combined)));

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (slideshowRef.current && pictures.length > 0) {
      const pictureWidth =
        (slideshowRef.current.firstChild as HTMLElement)?.clientWidth || 0;
      slideshowRef.current.scrollLeft = pictureWidth;
    }

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const curr = slideshowRef.current;

    // Currently can pre-load only moving forward
    const handleScroll = () => {
      if (curr) {
        const currentScrollLeft = curr.scrollLeft;
        const containerWidth = curr.clientWidth;

        const shouldLoadMoreForwardPictures =
          curr.clientWidth *
          currentThreshold.current *
          INITIAL_LOAD_PICTURES *
          SCROLL_THRESHOLD_PERCENT <
          curr.scrollLeft;

        const hasAlreadyLooped =
          currentThreshold.current > pictures.length / SEQUENTIAL_LOAD_PICTURES;

        if (shouldLoadMoreForwardPictures && !hasAlreadyLooped) {
          const fromIndex = currentThreshold.current * SEQUENTIAL_LOAD_PICTURES;
          const toIndex =
            (currentThreshold.current + 1) * SEQUENTIAL_LOAD_PICTURES;

          const pictureUrls = pictures.slice(fromIndex, toIndex);

          preloadPictures(pictureUrls);

          currentThreshold.current++;
        }

        if (currentScrollLeft === (pictures.length + 1) * containerWidth) {
          curr.scrollLeft = containerWidth;
        } else if (currentScrollLeft === 0) {
          curr.scrollLeft = pictures.length * containerWidth;
        }
      }
    };

    curr?.addEventListener("scroll", handleScroll);
    return () => {
      curr?.removeEventListener("scroll", handleScroll);
    };
  }, [pictures]);

  const picClass = `${width} ${height} ${fitTransformer[pictureFit]} snap-always snap-start bg-gray-200 shrink-0 ${customStyle}`;

  return (
    <div
      ref={slideshowRef}
      className="flex snap-x snap-mandatory h-full w-full mx:auto overflow-x-auto overscroll-y-none cursor-pointer"
      onMouseDown={handleMouseDown}
    >
      <img
        src={pictures[pictures.length - 1]}
        alt="Duplicate Last"
        className={picClass}
        loading="lazy"
      />
      {pictures.map((picture, index) => (
        <img
          key={index}
          src={picture}
          alt={` ${index + 1}`}
          className={picClass}
          loading="lazy"
        />
      ))}
      <img
        src={pictures[0]}
        alt="Duplicate First"
        className={picClass}
        loading="lazy"
      />
    </div>
  );
};

export default Carousel;
