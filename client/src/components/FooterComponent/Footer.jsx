import React from 'react'
import './Footer.css'
import logo from '../../assets/img/Group.svg'
import instagramIcon from '../../assets/img/instagram.svg'
import facebookIcon from '../../assets/img/facebook.svg'
import twitterIcon from '../../assets/img/twitterx.png'
import inicioImg from '../../assets/img/inicio.png'
import productosImg from '../../assets/img/productos.png'
import promocionesImg from '../../assets/img/promociones.png'
import contactoImg from '../../assets/img/contacto.png'
import faqImg from '../../assets/img/faq.png'
import entregaImg from '../../assets/img/entrega.png'
import devolucionesImg from '../../assets/img/devoluciones.png'

export const Footer = () => {
  return (
    <footer className="cf-footer">
      <div className="cf-footer-inner">
        <div className="cf-footer-brand">
          <img src={logo} alt="Catfecito" className="cf-footer-logo" />
          <p className="cf-footer-desc cf-footer-desc-full">CatFecito - Café con amor. Descubre y compra los mejores granos seleccionados.</p>
          <p className="cf-footer-desc cf-footer-desc-short">CatFecito - Café con amor.</p>
        </div>

        <div className="cf-footer-links">
            <div>
              <h4>Explorar</h4>
              <ul className="cf-explore-list">
                <li className="cf-explore-item">
                  <a href="/">
                    <span className="cf-explore-text">Inicio</span>
                    <img className="cf-explore-img" src={inicioImg} alt="Inicio" title="Inicio" />
                  </a>
                </li>

                <li className="cf-explore-item">
                  <a href="/products">
                    <span className="cf-explore-text">Productos</span>
                    <img className="cf-explore-img" src={productosImg} alt="Productos" title="Productos" />
                  </a>
                </li>

                <li className="cf-explore-item">
                  <a href="#">
                    <span className="cf-explore-text">Promociones</span>
                    <img className="cf-explore-img" src={promocionesImg} alt="Promociones" title="Promociones" />
                  </a>
                </li>

                <li className="cf-explore-item">
                  <a href="#">
                    <span className="cf-explore-text">Contacto</span>
                    <img className="cf-explore-img" src={contactoImg} alt="Contacto" title="Contacto" />
                  </a>
                </li>
              </ul>
            </div>

          <div>
            <h4>Soporte</h4>
            <ul className="cf-support-list">
              <li className="cf-support-item">
                <a href="#">
                  <span className="cf-support-text">Preguntas frecuentes</span>
                  <img className="cf-support-img" src={faqImg} alt="Preguntas frecuentes" title="Preguntas frecuentes" />
                </a>
              </li>

              <li className="cf-support-item">
                <a href="#">
                  <span className="cf-support-text">Envíos</span>
                  <img className="cf-support-img" src={entregaImg} alt="Envíos" title="Envíos" />
                </a>
              </li>

              <li className="cf-support-item">
                <a href="#">
                  <span className="cf-support-text">Devoluciones</span>
                  <img className="cf-support-img" src={devolucionesImg} alt="Devoluciones" title="Devoluciones" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4>Redes</h4>
            <div className="cf-socials">
              <a href="https://www.instagram.com/catfecitoARG/" target='_blank' aria-label="Instagram" ><img src={instagramIcon} alt="Instagram" /></a>
              <a href="https://www.facebook.com/catfecitoARG" target='_blank' aria-label="Facebook" ><img src={facebookIcon} alt="Facebook" /></a>
              <a href="https://twitter.com/catfecitoARG" target='_blank' aria-label="Twitter" ><img src={twitterIcon} alt="Twitter" /></a>
            </div>
          </div>
        </div>
      </div>

      <div className="cf-footer-bottom">
        <p>© {new Date().getFullYear()} CatFecito. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}

export default Footer
