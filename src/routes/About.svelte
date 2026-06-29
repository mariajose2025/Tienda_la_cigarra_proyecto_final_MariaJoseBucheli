<script>
  import { link } from 'svelte-spa-router';
</script>

<div class="about-container">
  <div class="about-card">
    <div class="about-header">
      <img src="/logo.png" alt="Tienda La Cigarra" class="about-logo" />
      <h1>La Cigarra</h1>
      <p class="tagline">Sistema de Tienda de Barrio</p>
    </div>

    <section class="about-section">
      <h2><i class="fa-solid fa-bullseye"></i> Misión</h2>
      <p>
        Proporcionar a las microempresas del sector alimentario una herramienta tecnológica
        eficiente y accesible que permita optimizar la gestión de inventarios, el control de
        ventas diarias y la toma de decisiones informadas, contribuyendo al crecimiento
        sostenible de cada negocio.
      </p>
    </section>

    <section class="about-section">
      <h2><i class="fa-solid fa-eye"></i> Visión</h2>
      <p>
        Ser la plataforma líder en soluciones tecnológicas para la gestión de micronegocios
        en Colombia, reconocida por su facilidad de uso, impacto positivo en la
        productividad y contribución a la formalización y modernización del comercio local.
      </p>
    </section>

    <section class="about-section">
      <h2><i class="fa-solid fa-circle-info"></i> ¿Qué es La Cigarra?</h2>
      <p>
        La Cigarra es un sistema de información web mobile-first diseñado específicamente para
        la gestión de inventarios y control de ventas diarias en tiendas de barrio y pequeños
        establecimientos comerciales. Nuestra plataforma permite:
      </p>
      <ul>
        <li><i class="fa-solid fa-check"></i> Control completo del inventario con alertas automáticas</li>
        <li><i class="fa-solid fa-check"></i> Registro ágil de compras y ventas</li>
        <li><i class="fa-solid fa-check"></i> Gestión de proveedores y clasificación de productos</li>
        <li><i class="fa-solid fa-check"></i> Sistema de fiados y crédito para clientes</li>
        <li><i class="fa-solid fa-check"></i> Reportes en tiempo real desde cualquier dispositivo móvil</li>
        <li><i class="fa-solid fa-check"></i> Control de acceso por roles para administradores y vendedores</li>
      </ul>
    </section>

    <section class="about-section">
      <h2><i class="fa-solid fa-code"></i> Desarrollado por</h2>
      <p>
        Proyecto de Grado — Técnico en Sistemas<br>
        Instituto: Cinar Sistemas<br>
        Estudiante: María José Bucheli Martinez<br>
        Año: 2026
      </p>
    </section>

    <div class="about-footer">
      <p>Versión 1.0 — Fase 1</p>
    </div>
  </div>
</div>

<style>
  .about-container {
    padding: 1.25rem;
    padding-top: 5rem;
    min-height: 100vh;
    background: #f3f4f6;
  }

  .about-card {
    background: white;
    border-radius: 16px;
    padding: 2rem 1.5rem;
    max-width: 600px;
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  }

  .about-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .about-logo {
    max-width: 220px;
    height: auto;
    margin-bottom: 1rem;
    border-radius: 12px;
  }

  .about-header h1 {
    font-size: 2rem;
    color: #B31A1A;
    margin: 0;
    letter-spacing: 2px;
  }

  .tagline {
    color: #6b7280;
    font-size: 0.95rem;
    margin-top: 0.35rem;
  }

  .about-section { margin-bottom: 1.5rem; }

  .about-section h2 {
    font-size: 1.1rem;
    color: #B31A1A;
    margin-bottom: 0.5rem;
    padding-bottom: 0.35rem;
    border-bottom: 2px solid #FEE2E2;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .about-section h2 i { color: #C49A45; }

  .about-section p {
    color: #374151;
    line-height: 1.6;
    font-size: 0.95rem;
  }

  .about-section ul {
    list-style: none;
    padding: 0;
    margin: 0.75rem 0 0 0;
  }

  .about-section li {
    padding: 0.4rem 0;
    padding-left: 1.5rem;
    position: relative;
    color: #374151;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .about-section li i {
    color: #22c55e;
    font-size: 0.8rem;
    position: absolute;
    left: 0;
  }

  .about-footer {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
    color: #9ca3af;
    font-size: 0.8rem;
  }
</style>
