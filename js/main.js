/* ================================================
   TRANSPORTE Y TURISMO REYES — JavaScript Principal
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---- Año dinámico en el footer ----
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ---- Barra de progreso de scroll ----
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            progressBar.style.width = `${(scrollTop / docHeight) * 100}%`;
        }, { passive: true });
    }

    // ---- Header scroll effect ----
    const header = document.getElementById('header');
    const scrollTopBtn = document.getElementById('scrollTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ---- Mobile nav toggle ----
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        nav.classList.toggle('open');
    });

    document.querySelectorAll('.header__link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            nav.classList.remove('open');
        });
    });

    // ---- Active nav link on scroll ----
    const sections = document.querySelectorAll('section[id]');

    function updateActiveLink() {
        const scrollY = window.scrollY + 120;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollY >= top && scrollY < top + height) {
                document.querySelectorAll('.header__link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) link.classList.add('active');
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveLink, { passive: true });

    // ---- Hero Slider con SWIPE táctil ----
    const slides = document.querySelectorAll('.hero__slide');
    const dotsContainer = document.getElementById('heroDots');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    let currentSlide = 0;
    let slideInterval;
    let touchStartX = 0;
    let touchEndX = 0;

    // Crear dots
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('hero__dot');
        if (i === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => { goToSlide(i); resetInterval(); });
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.hero__dot');

    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = index;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() { goToSlide((currentSlide + 1) % slides.length); }
    function prevSlide() { goToSlide((currentSlide - 1 + slides.length) % slides.length); }

    nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
    prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });

    function startInterval() { slideInterval = setInterval(nextSlide, 6000); }
    function resetInterval() { clearInterval(slideInterval); startInterval(); }
    startInterval();

    // Swipe táctil para el slider
    const heroEl = document.querySelector('.hero');
    heroEl.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    heroEl.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) { nextSlide(); } else { prevSlide(); }
            resetInterval();
        }
    }, { passive: true });

    // Pausar slider al hover
    heroEl.addEventListener('mouseenter', () => clearInterval(slideInterval));
    heroEl.addEventListener('mouseleave', startInterval);

    // ---- Stats Counter Animation ----
    const statNumbers = document.querySelectorAll('.stats__number');
    let statsCounted = false;

    function animateCounters() {
        statNumbers.forEach(num => {
            const target = +num.getAttribute('data-target');
            const duration = 2200;
            const step = target / (duration / 16);
            let current = 0;
            const counter = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(counter);
                }
                num.textContent = Math.floor(current).toLocaleString('es-CL');
            }, 16);
        });
    }

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !statsCounted) {
                statsCounted = true;
                animateCounters();
            }
        }, { threshold: 0.4 });
        statsObserver.observe(statsSection);
    }

    // ---- Scroll Reveal Animation (con delays escalonados) ----
    // Elementos con reveal normal (abajo)
    const revealEls = document.querySelectorAll(
        '.about__container, .service-card, .fleet-card, .dest-card, .contact__form, .contact__socials, .history__card, .client-card, .clients__stats'
    );
    revealEls.forEach((el, i) => {
        el.classList.add('reveal');
        // Escalonar tarjetas hermanas
        const siblings = el.parentElement.querySelectorAll('.reveal');
        const idx = Array.from(siblings).indexOf(el);
        if (idx >= 1 && idx <= 5) el.classList.add(`reveal-delay-${idx}`);
    });

    // Elementos de info de contacto: desde la izquierda
    document.querySelectorAll('.contact__info-card').forEach(el => {
        el.classList.add('reveal-left');
    });

    // Observer unificado
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
        revealObserver.observe(el);
    });

    // ---- Photo Lightbox ----
    const photoLightbox = document.getElementById('photoLightbox');
    const photoLightboxImg = document.getElementById('photoLightboxImg');
    const photoLightboxClose = document.getElementById('photoLightboxClose');

    function openPhotoLightbox(src, alt) {
        photoLightboxImg.src = src;
        photoLightboxImg.alt = alt || '';
        photoLightbox.classList.add('open');
        photoLightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closePhotoLightbox() {
        photoLightbox.classList.remove('open');
        photoLightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => { photoLightboxImg.src = ''; }, 350);
    }

    document.querySelectorAll('[data-lightbox-src]').forEach(btn => {
        btn.addEventListener('click', () => openPhotoLightbox(btn.dataset.lightboxSrc, btn.dataset.lightboxAlt));
    });

    photoLightboxClose.addEventListener('click', closePhotoLightbox);
    photoLightbox.addEventListener('click', e => { if (e.target === photoLightbox) closePhotoLightbox(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && photoLightbox.classList.contains('open')) closePhotoLightbox();
    });

    // ---- Contact Form → WhatsApp ----
    const contactForm = document.getElementById('contactForm');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre   = document.getElementById('nombre').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const email    = document.getElementById('email').value.trim();
        const servicio = document.getElementById('servicio').value;
        const fecha    = document.getElementById('fecha').value;
        const pasajeros = document.getElementById('pasajeros').value;
        const mensaje  = document.getElementById('mensaje').value.trim();

        const lines = [
            '🚌 *Cotización — Transporte y Turismo Reyes*',
            '',
            `*Nombre:* ${nombre}`,
            `*Teléfono:* ${telefono}`,
        ];

        if (email)     lines.push(`*Email:* ${email}`);
        lines.push(`*Servicio:* ${servicio}`);
        if (fecha)     lines.push(`*Fecha del viaje:* ${fecha}`);
        if (pasajeros) lines.push(`*N° de pasajeros:* ${pasajeros}`);
        lines.push('', `*Detalle:* ${mensaje}`);

        const waMsg = lines.join('\n');
        window.open(`https://wa.me/56936363564?text=${encodeURIComponent(waMsg)}`, '_blank');
    });

    // ---- Smooth scroll ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ---- Tooltip en iconos de flota ----
    document.querySelectorAll('.fleet-card__info li').forEach(li => {
        li.style.cursor = 'default';
    });

    // ---- Botones de cotización de flota → WhatsApp ----
    document.querySelectorAll('.fleet-card').forEach(card => {
        const title = card.dataset.quoteTitle?.trim() || card.querySelector('h3')?.textContent?.trim();
        const button = card.querySelector('.btn--sm');

        if (!title || !button) return;

        const message = `Hola, estoy interesado/a en cotizar ${title}.`;
        button.href = `https://wa.me/56936363564?text=${encodeURIComponent(message)}`;
    });

});
