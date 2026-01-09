import React, { useState } from 'react';
import './Banner.css';
import { useNavigate } from 'react-router-dom';

// --- Importa tus imágenes y logo aquí ---
// Asegúrate de que las rutas sean correctas
import bannerBackground from '../../assets/img/gato-portada.png'; // La imagen principal con el café
import catImg from '../../assets/img/cat.png'; // Segunda imagen para el slider
import logoSvg from '../../assets/img/Group.svg'; // El logo en formato SVG

export const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  
  // Array de objetos para definir cada slide
  const slides = [
    { 
      src: bannerBackground, 
      alt: "Banner principal con café y arte de gato",
      // Contenido que se superpondrá a la imagen
      content: {
        logo: logoSvg,
        text: "Descubre el sabor único de nuestro café artesanal, preparado con los granos más selectos para tu paladar.",
        buttonText: "COMPRAR",
      }
    },
    { 
      src: catImg, 
      alt: "Banner secundario" 
    },
    // Puedes agregar más slides si lo necesitas
    // { src: otraImagen, alt: "Tercer banner" }
  ];

  const totalSlides = slides.length;

  const showSlide = (index) => {
    const normalizedIndex = ((index % totalSlides) + totalSlides) % totalSlides;
    setCurrentSlide(normalizedIndex);
  };

  const nextSlide = (e) => {
    e?.stopPropagation();
    showSlide(currentSlide + 1);
  };

  const prevSlide = (e) => {
    e?.stopPropagation();
    showSlide(currentSlide - 1);
  };

  const goToSlide = (index) => {
    showSlide(index);
  };
  
  // Descomenta este bloque si quieres que el slider cambie automáticamente
  /*
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [currentSlide]);
  */

  return (
    <div className="hero-slider">
      <div className="slider-images">
        {/* Mapeo de las imágenes de fondo del slider */}
        {slides.map((slide, index) => (
          <img
            key={index}
            src={slide.src}
            alt={slide.alt}
            className={index === currentSlide ? 'active' : ''}
          />
        ))}
        
        {/* Renderiza el contenido superpuesto solo si el slide activo lo tiene */}
        {slides[currentSlide].content && (
          <div className="slide-content">
            <img src={slides[currentSlide].content.logo} alt="Logo Catfecito" className="logo" />
            <p className="text">{slides[currentSlide].content.text}</p>
            <button
              className="buy-button"
              onClick={() => navigate('/products')}
            >
              {slides[currentSlide].content.buttonText}
            </button>
          </div>
        )}
        
        {/* Controles del Slider */}
        <button className="prev" onClick={prevSlide}>
          &#10094;
        </button>
        <button className="next" onClick={nextSlide}>
          &#10095;
        </button>
        
        <div className="slider-dots">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};