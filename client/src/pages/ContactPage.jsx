import React, { useState } from "react";
import "../styles/CustomBar.css";
import "../styles/index.css";
import "../styles/App.css";
import "../components/FooterComponent/Footer.css";
import "./ContactPage.css";
import MetaData from "../components/ui/MetaData/MetaData";

import { NavBar } from "../components/CustomBarComponents/NavBar";
import { Header } from "../components/CustomBarComponents/Header";
import { Footer } from "../components/FooterComponent/Footer";

export const ContactPage = ({
  cartItems,
  itemCount,
  isCartOpen,
  onOpenCart,
  onCloseCart,
  onUpdateQuantity,
  onRemoveItem,
  onOpenAuthModal = null,
}) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now just simulate submission
    console.log("Contact form submitted", form);
    setStatus("Gracias — tu mensaje fue enviado.");
    setForm({ name: "", email: "", phone: "", message: "" });
    setTimeout(() => setStatus(null), 5000);
  };

  return (
    <>
      <MetaData title="Contacto - CatFecito" />
      <Header
        cartItems={cartItems}
        itemCount={itemCount}
        isCartOpen={isCartOpen}
        onOpenCart={onOpenCart}
        onCloseCart={onCloseCart}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
        onOpenAuthModal={onOpenAuthModal}
      />
      <NavBar />

      <main className="contact-page container">
        <section className="contact-hero">
          <h1>Contacto</h1>
          <p>¿Tenés una consulta? Escribinos y te respondemos a la brevedad.</p>
        </section>

        <section className="contact-grid">
          <form className="contact-form" onSubmit={handleSubmit}>
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Tu nombre"
              value={form.name}
              onChange={handleChange}
              required
            />

            <label htmlFor="email">Correo</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@ejemplo.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="phone">Teléfono</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(00) 1234-5678"
              value={form.phone}
              onChange={handleChange}
            />

            <label htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              name="message"
              rows="5"
              placeholder="Escribe tu consulta aquí"
              value={form.message}
              onChange={handleChange}
              required
            />

            <button type="submit" className="cf-btn-primary">Enviar</button>

            {status && <p className="contact-status">{status}</p>}
          </form>

          <aside className="contact-info">
            <h3>Contacto</h3>
            <p>
              <strong>WhatsApp:</strong>
              <a href="https://wa.me/5491123456789" target="_blank" rel="noreferrer"> +54 9 11 2345 6789</a>
            </p>

            <p>
              <strong>Correo:</strong>
              <a href="mailto:info@catfecito.com"> info@catfecito.com</a>
            </p>

            <p>
              <strong>Dirección:</strong>
              <span> Av. Siempre Viva 742, Buenos Aires, Argentina</span>
            </p>

            <div className="contact-hours">
              <h4>Horario de atención</h4>
              <p>Lun - Vie: 9:00 - 18:00</p>
              <p>Sáb: 10:00 - 14:00</p>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default ContactPage;
