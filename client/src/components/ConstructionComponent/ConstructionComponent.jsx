import React from 'react'
// import GatitoEnTaza from '../../assets/img/GatitoEnTaza.png'
import Gatito1 from '../../assets/img/Gatito1.png'
import Gatito2 from '../../assets/img/Gatito2.png'
import Gatito3 from '../../assets/img/Gatito3.png'
import './constructionComponent.css'



export const ConstructionComponent = () => {

  let images = [Gatito1, Gatito2, Gatito3];
  let randomIndex = Math.floor(Math.random() * images.length);

  return (
    <div className="construction-container">
      <img 
        // src={GatitoEnTaza} 
        src={images[randomIndex]} 
        alt="Gatito en taza" 
        className="construction-image"
      />
      <h3 className="construction-title">Proximamente</h3>
      <h5 className="construction-subtitle">Disculpe las molestias</h5>
    </div>
  )
}
