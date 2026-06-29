<script>
  const socialLinks = [
    { name: 'Facebook', icon: 'fa-brands fa-facebook', url: 'https://www.facebook.com/TiendaBavaria/?locale=es_LA', color: '#1877F2' },
    { name: 'Instagram', icon: 'fa-brands fa-instagram', url: 'https://www.instagram.com/tiendadebavaria/', color: '#E4405F' },
    { name: 'X / Twitter', icon: 'fa-brands fa-x-twitter', url: 'https://x.com/BAVARIA_OFICIAL?lang=es', color: '#000000' }
  ];

  const mapUrl = 'https://www.google.com/maps/place/TIENDA+LA+CIGARRA+-+JUAN+PABLO+II/@1.2311094,-77.2750922,18z/data=!3m1!4b1!4m6!3m5!1s0x8e2ed3007f92a433:0x69cce903568eb0b9!8m2!3d1.2311094!4d-77.2738047!16s%2Fg%2F11xp3mv6cj?authuser=0&entry=ttu&g_ep=EgoyMDI2MDYyMS4wIKXMDSoASAFQAw%3D%3D';
</script>

<footer class="footer">
  <div class="footer-grid">

    <div class="footer-section">
      <h3><i class="fa-solid fa-store"></i> Tienda La Cigarra</h3>
      <p class="tagline">Tu tienda de barrio de confianza desde el 2000.</p>
      <p class="description">Especialidades, Abarrotes, Cervezas y Víveres.</p>
    </div>

    <div class="footer-section">
      <h3><i class="fa-solid fa-location-dot"></i> Ubicación</h3>
      <p>Juan Pablo II, Pasto, Nariño, Colombia</p>
      <a href={mapUrl} target="_blank" rel="noopener noreferrer" class="map-link">
        <i class="fa-solid fa-map-location-dot"></i> Ver en Google Maps
      </a>
      <div class="map-container">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.9!2d-77.2738047!3d1.2311094!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2ed3007f92a433%3A0x69cce903568eb0b9!2sTIENDA%20LA%20CIGARRA%20-%20JUAN%20PABLO%20II!5e0!3m2!1ses!2sco!4v1719000000000!5m2!1ses!2sco"
          width="100%"
          height="180"
          style="border:0; border-radius: 8px;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Ubicación Tienda La Cigarra"
        ></iframe>
      </div>
    </div>

    <div class="footer-section">
      <h3><i class="fa-solid fa-share-nodes"></i> Redes Sociales</h3>
      <div class="social-links">
        {#each socialLinks as social}
          <a href={social.url} target="_blank" rel="noopener noreferrer" class="social-link" style="--social-color: {social.color}">
            <i class={social.icon}></i>
            <span>{social.name}</span>
          </a>
        {/each}
      </div>
    </div>

  </div>

  <div class="footer-bottom">
    <p>Tienda La Cigarra &copy; 2026 — Sistema de Gestión de Inventario</p>
  </div>
</footer>

<style>
  .footer {
    background: #110F0F;
    color: #d1d5db;
    padding: 2.5rem 1.5rem 0;
    margin-top: 2rem;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .footer-section h3 {
    color: #F2C12E;
    font-size: 1rem;
    margin: 0 0 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .footer-section p {
    font-size: 0.85rem;
    line-height: 1.6;
    margin: 0 0 0.5rem;
    color: #9ca3af;
  }

  .tagline {
    color: #d1d5db !important;
    font-weight: 500;
  }

  .description {
    font-size: 0.8rem !important;
  }

  .map-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(242,193,46,0.1);
    border: 1px solid rgba(242,193,46,0.3);
    color: #F2C12E;
    padding: 0.45rem 0.85rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
    margin-bottom: 0.75rem;
  }

  .map-link:hover {
    background: rgba(242,193,46,0.2);
    border-color: #F2C12E;
  }

  .map-container {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .social-links {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .social-link {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: #d1d5db;
    text-decoration: none;
    padding: 0.6rem 0.85rem;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.2s;
    font-size: 0.9rem;
  }

  .social-link i {
    color: var(--social-color);
    font-size: 1.2rem;
    width: 24px;
    text-align: center;
  }

  .social-link:hover {
    background: rgba(255,255,255,0.05);
    border-color: var(--social-color);
    color: white;
  }

  .footer-bottom {
    margin-top: 2rem;
    padding: 1.25rem 0;
    border-top: 1px solid rgba(255,255,255,0.1);
    text-align: center;
  }

  .footer-bottom p {
    margin: 0;
    font-size: 0.8rem;
    color: #6b7280;
  }

  @media (min-width: 768px) {
    .footer { padding: 3rem 2rem 0; }
    .footer-grid { grid-template-columns: repeat(3, 1fr); gap: 2.5rem; }
    .social-links { flex-direction: column; }
  }
</style>
