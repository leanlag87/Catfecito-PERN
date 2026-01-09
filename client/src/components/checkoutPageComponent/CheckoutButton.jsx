import React, { useEffect, useRef, useState } from 'react';
import './CheckoutButton.css';

export const CheckoutButton = ({ preferenceId, onSuccess, onError }) => {
  const mpContainerRef = useRef(null);
  const walletInstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!preferenceId || !window.MercadoPago) {
      if (!window.MercadoPago) {
        setError('MercadoPago no está disponible');
        setIsLoading(false);
      }
      return;
    }

    console.log('[CheckoutButton] Inicializando con preferenceId:', preferenceId);

    let mounted = true;
    const containerElement = mpContainerRef.current;

    const initMercadoPago = async () => {
      try {
        const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || window.MP_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error('Clave pública de MercadoPago no configurada');
        }

        // Destruir instancia anterior si existe
        if (walletInstanceRef.current) {
          console.log('🗑️ Destruyendo instancia anterior');
          try {
            await walletInstanceRef.current.unmount();
          } catch (e) {
            console.warn('Error al destruir instancia anterior:', e);
          }
          walletInstanceRef.current = null;
        }

        // Limpiar contenedor
        if (containerElement) {
          containerElement.innerHTML = '';
        }

        if (!mounted) return;

        const mp = new window.MercadoPago(publicKey, { locale: "es-AR" });
        const bricks = mp.bricks();

        console.log('🔨 Creando brick de MercadoPago...');
        const walletInstance = await bricks.create("wallet", "mp-wallet-container", {
          initialization: {
            preferenceId: preferenceId,
          },
          customization: {
            texts: {
              action: 'pay',
              valueProp: 'security_safety',
            },
          },
          callbacks: {
            onReady: () => {
              if (mounted) {
                console.log("✅ Wallet de MercadoPago listo");
                setIsLoading(false);
              }
            },
            onSubmit: () => {
              if (mounted) {
                console.log("🔵 Usuario inició el pago");
                if (onSuccess) onSuccess();
              }
            },
            onError: (error) => {
              if (mounted) {
                console.error("❌ Error en Wallet brick:", error);
                setError('Error al cargar el botón de pago');
                setIsLoading(false);
                if (onError) onError(error);
              }
            },
          },
        });

        console.log("✅ Wallet instance creada");
        walletInstanceRef.current = walletInstance;

      } catch (err) {
        if (mounted) {
          console.error('❌ Error al inicializar MP:', err);
          setError('Error al cargar el botón de pago');
          setIsLoading(false);
          if (onError) onError(err);
        }
      }
    };

    initMercadoPago();

    // Cleanup
    return () => {
      mounted = false;
      
      if (walletInstanceRef.current) {
        console.log('🧹 Cleanup: destruyendo wallet');
        try {
          walletInstanceRef.current.unmount();
        } catch (err) {
          console.warn('Error en cleanup:', err);
        }
        walletInstanceRef.current = null;
      }
      
      if (containerElement) {
        containerElement.innerHTML = '';
      }
    };
  }, [preferenceId, onSuccess, onError]);

  if (error) {
    return (
      <div className="checkout-error">
        <p>❌ {error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-button-container">
      {isLoading && (
        <div className="checkout-loading">
          <div className="spinner"></div>
          <p>Cargando método de pago...</p>
        </div>
      )}
      <div 
        id="mp-wallet-container"
        ref={mpContainerRef}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};
