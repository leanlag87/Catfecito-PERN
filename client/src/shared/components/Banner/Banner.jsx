import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import "./Banner.css";
import bannerBackground from "../../../assets/img/gato-portada.png";
import catImg from "../../../assets/img/cat.png";
import logoSvg from "../../../assets/img/Group.svg";

const AUTOPLAY_MS = 5000;
const ENABLE_AUTOPLAY = false;

const SLIDES = [
  {
    src: bannerBackground,
    alt: "Banner principal con café y arte de gato",
    content: {
      logo: logoSvg,
      text: "Descubre el sabor único de nuestro café artesanal, preparado con los granos más selectos para tu paladar.",
      buttonText: "COMPRAR",
    },
  },
  {
    src: catImg,
    alt: "Banner secundario",
  },
];

export const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const totalSlides = SLIDES.length;
  const shopRoute = ROUTES.SHOP || "/products";

  const normalizeIndex = useCallback(
    (index) => ((index % totalSlides) + totalSlides) % totalSlides,
    [totalSlides],
  );

  const goToSlide = useCallback(
    (index) => setCurrentSlide(normalizeIndex(index)),
    [normalizeIndex],
  );

  const nextSlide = useCallback(
    (e) => {
      e?.stopPropagation?.();
      setCurrentSlide((prev) => normalizeIndex(prev + 1));
    },
    [normalizeIndex],
  );

  const prevSlide = useCallback(
    (e) => {
      e?.stopPropagation?.();
      setCurrentSlide((prev) => normalizeIndex(prev - 1));
    },
    [normalizeIndex],
  );

  useEffect(() => {
    if (!ENABLE_AUTOPLAY || totalSlides <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentSlide((prev) => normalizeIndex(prev + 1));
    }, AUTOPLAY_MS);

    return () => window.clearInterval(interval);
  }, [normalizeIndex, totalSlides]);

  const activeSlide = useMemo(() => SLIDES[currentSlide], [currentSlide]);

  return (
    <div className="hero-slider">
      <div className="slider-images">
        {SLIDES.map((slide, index) => (
          <img
            key={slide.alt}
            src={slide.src}
            alt={slide.alt}
            className={index === currentSlide ? "active" : ""}
          />
        ))}

        {activeSlide?.content && (
          <div className="slide-content">
            <img
              src={activeSlide.content.logo}
              alt="Logo Catfecito"
              className="logo"
            />
            <p className="text">{activeSlide.content.text}</p>
            <button className="buy-button" onClick={() => navigate(shopRoute)}>
              {activeSlide.content.buttonText}
            </button>
          </div>
        )}

        <button
          className="prev"
          onClick={prevSlide}
          aria-label="Slide anterior"
        >
          &#10094;
        </button>
        <button
          className="next"
          onClick={nextSlide}
          aria-label="Siguiente slide"
        >
          &#10095;
        </button>

        <div className="slider-dots">
          {SLIDES.map((slide, index) => (
            <button
              key={`${slide.alt}-dot`}
              type="button"
              className={`dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
