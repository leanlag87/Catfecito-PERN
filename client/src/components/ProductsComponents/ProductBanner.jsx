import React from 'react';
import './ProductBanner.css';
import bannerImage from '../../assets/img/CoffeeBeans.jpeg';


export const ProductBanner = () => {
  return (
    <div className="coffee-banner">
      <div className="banner-image">
        <img 
          src={bannerImage}
          alt="Granos de café"
        />
      </div>
    </div>
  );
};