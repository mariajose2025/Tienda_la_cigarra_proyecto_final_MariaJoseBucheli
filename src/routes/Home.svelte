<script>
  import { link } from 'svelte-spa-router';
</script>

<div class="home-container">
  <header class="hero">
    <img src="/logo.png" alt="Tienda La Cigarra" class="hero-logo" />
    <h1>Tienda La Cigarra</h1>
    <p class="hero-subtitle">Tu tienda de barrio de confianza</p>
    <p class="hero-tagline"><i class="fa-solid fa-store"></i> Especialidades - Abarrotes - Cervezas - Víveres</p>

    <div class="hero-actions">
      <a href="/login" use:link class="btn-primary"><i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión</a>
      <a href="/nosotros" use:link class="btn-secondary"><i class="fa-solid fa-circle-info"></i> Conócenos</a>
    </div>
  </header>

  <section class="features">
    <h2>¿Qué ofrecemos?</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-solid fa-cart-shopping"></i></div>
        <h3>Productos Frescos</h3>
        <p>Amplia variedad de productos de calidad para tu día a día.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-solid fa-dollar-sign"></i></div>
        <h3>Buenos Precios</h3>
        <p>Precios justos y accesibles para toda la comunidad.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-solid fa-location-dot"></i></div>
        <h3>Cerca de Ti</h3>
        <p>Tu tienda de barrio, siempre a la mano.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-solid fa-clock"></i></div>
        <h3>Desde 2000</h3>
        <p>Más de 25 años sirviendo a nuestra comunidad con amor y dedicación.</p>
      </div>
    </div>
  </section>

  <section class="categories-section">
    <h2>Nuestras Categorías</h2>
    <div class="categories-grid">
      <div class="cat-item"><i class="fa-solid fa-beer-mug-empty"></i> Cervezas</div>
      <div class="cat-item"><i class="fa-solid fa-bottle-water"></i> Bebidas</div>
      <div class="cat-item"><i class="fa-solid fa-candy-cane"></i> Dulcería</div>
      <div class="cat-item"><i class="fa-solid fa-bread-slice"></i> Abarrotes</div>
      <div class="cat-item"><i class="fa-solid fa-cheese"></i> Lácteos</div>
      <div class="cat-item"><i class="fa-solid fa-broom"></i> Higiene</div>
    </div>
  </section>

  <section class="credit-section">
    <div class="credit-content">
      <i class="fa-solid fa-file-invoice-dollar"></i>
      <div>
        <h3>Sistema de Fiados</h3>
        <p>¿Necesitas llevar productos a crédito? Registra tus fiados de forma digital y controla lo que te deben.</p>
      </div>
    </div>
  </section>

  <footer class="home-footer">
    <img src="/logo.png" alt="La Cigarra" class="footer-logo" />
    <p>Tienda La Cigarra &copy; 2026 — Sistema de Gestión</p>
  </footer>
</div>

<style>
  .home-container { min-height: 100vh; }

  .hero {
    background: linear-gradient(135deg, #B31A1A 0%, #8B1A1A 50%, #110F0F 100%);
    color: white;
    text-align: center;
    padding: 4rem 1.5rem 3rem;
  }

  .hero-logo {
    max-width: 200px;
    height: auto;
    margin-bottom: 1.5rem;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  .hero h1 { font-size: 2.2rem; margin: 0; letter-spacing: 2px; }
  .hero-subtitle { font-size: 1.1rem; opacity: 0.9; margin-top: 0.5rem; }
  .hero-tagline {
    font-size: 0.85rem; opacity: 0.7; margin-top: 0.35rem;
    letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }

  .hero-actions {
    display: flex; flex-direction: column; gap: 0.75rem;
    margin-top: 2rem; max-width: 300px; margin-left: auto; margin-right: auto;
  }

  .btn-primary {
    background: #F2C12E; color: #110F0F;
    padding: 0.9rem 2rem; border-radius: 10px; font-weight: 700;
    font-size: 1rem; text-align: center; transition: transform 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .btn-primary:hover { transform: translateY(-2px); }

  .btn-secondary {
    background: transparent; color: white;
    border: 2px solid rgba(242,193,46,0.5);
    padding: 0.85rem 2rem; border-radius: 10px; font-weight: 600;
    font-size: 1rem; text-align: center; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .btn-secondary:hover { border-color: #F2C12E; background: rgba(242,193,46,0.1); }

  .features { padding: 3rem 1.5rem; text-align: center; }
  .features h2 { font-size: 1.4rem; color: #110F0F; margin-bottom: 1.5rem; }

  .features-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 1rem; max-width: 600px; margin: 0 auto;
  }

  .feature-card {
    background: white; border-radius: 12px; padding: 1.25rem 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-top: 3px solid #C49A45;
  }

  .feature-icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: #FEF3C7; color: #C49A45; display: flex;
    align-items: center; justify-content: center;
    font-size: 1.2rem; margin: 0 auto 0.75rem;
  }

  .feature-card h3 { font-size: 0.9rem; color: #110F0F; margin: 0 0 0.35rem; }
  .feature-card p { font-size: 0.8rem; color: #6b7280; margin: 0; line-height: 1.4; }

  .categories-section { background: #F8F5F0; padding: 2.5rem 1.5rem; text-align: center; }
  .categories-section h2 { font-size: 1.3rem; color: #110F0F; margin-bottom: 1.25rem; }

  .categories-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem; max-width: 500px; margin: 0 auto;
  }

  .cat-item {
    background: white; padding: 1rem 0.5rem; border-radius: 10px;
    font-size: 0.8rem; font-weight: 600; color: #110F0F;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  }

  .cat-item i { font-size: 1.3rem; color: #B31A1A; }

  .credit-section {
    padding: 2rem 1.5rem; background: #110F0F;
  }

  .credit-content {
    display: flex; align-items: center; gap: 1rem;
    max-width: 500px; margin: 0 auto;
  }

  .credit-content > i {
    font-size: 2.5rem; color: #F2C12E; flex-shrink: 0;
  }

  .credit-content h3 { margin: 0 0 0.35rem; color: #F2C12E; font-size: 1.1rem; }
  .credit-content p { margin: 0; color: #9ca3af; font-size: 0.85rem; line-height: 1.5; }

  .home-footer {
    background: #1a1a1a; color: #9ca3af;
    text-align: center; padding: 2rem 1.5rem; font-size: 0.85rem;
    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  }

  .footer-logo { height: 50px; border-radius: 8px; opacity: 0.8; }

  @media (min-width: 768px) {
    .hero { padding: 5rem 2rem 4rem; }
    .hero h1 { font-size: 2.8rem; }
    .hero-actions { flex-direction: row; justify-content: center; max-width: none; }
    .features-grid { grid-template-columns: repeat(4, 1fr); max-width: 800px; }
    .categories-grid { grid-template-columns: repeat(6, 1fr); max-width: 700px; }
    .credit-content { max-width: 600px; }
  }
</style>
