/* ================================================
   TRANSPORTES Y TURISMO REYES — JavaScript Principal
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Enlaces compartidos antes de que cada seccion tuviera su propia pagina.
    if (document.body.classList.contains('site-home')) {
        const legacyLinks = {
            homenaje: 'homenaje.html',
            servicios: 'servicios.html',
            clientes: 'servicios.html#clientes',
            flota: 'flota.html',
            'otras-unidades': 'flota.html#otras-unidades',
            galeria: 'galeria.html',
            'santuario-cuna-de-prat': 'galeria.html#santuario-cuna-de-prat',
            actividades: 'actividades.html',
            video: 'actividades.html#video',
            preguntas: 'contacto.html#preguntas',
            contacto: 'contacto.html'
        };
        const followLegacyLink = () => {
            const fragment = window.location.hash.slice(1);
            if (Object.hasOwn(legacyLinks, fragment)) {
                window.location.replace(legacyLinks[fragment]);
                return true;
            }
            return false;
        };
        if (followLegacyLink()) return;
        window.addEventListener('hashchange', followLegacyLink);
    }

    // ---- Año dinámico en el footer ----
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ---- Años de trayectoria automáticos (desde el 10.10.2013) ----
    const today = new Date();

    function yearsSince(isoDate) {
        const [y, m, d] = isoDate.split('-').map(Number);
        let years = today.getFullYear() - y;
        const beforeAnniversary = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
        if (beforeAnniversary) years--;
        return years;
    }

    document.querySelectorAll('[data-years-since]').forEach(el => {
        el.textContent = yearsSince(el.dataset.yearsSince);
    });
    document.querySelectorAll('[data-current-year]').forEach(el => {
        el.textContent = today.getFullYear();
    });

    // ---- Aniversario automático ----
    // Cada año, la sección "Aniversario" aparece sola durante la semana del 10 de octubre
    // (del 6 al 19 de octubre). Para verla en otra fecha: agregar ?aniversario a la URL.
    const ANIVERSARIO_MES = 10;   // octubre
    const ANIVERSARIO_DESDE = 6;
    const ANIVERSARIO_HASTA = 19;
    const anniversarySection = document.getElementById('aniversario');
    const forceAnniversary = new URLSearchParams(window.location.search).has('aniversario');
    const isAnniversaryWeek = today.getMonth() + 1 === ANIVERSARIO_MES
        && today.getDate() >= ANIVERSARIO_DESDE
        && today.getDate() <= ANIVERSARIO_HASTA;

    if (anniversarySection && (isAnniversaryWeek || forceAnniversary)) {
        const years = yearsSince('2013-10-10');
        anniversarySection.hidden = false;

        const heroBadge = document.getElementById('heroBadge');
        if (heroBadge) heroBadge.textContent = `🎉 Celebramos ${years} años viajando contigo`;
    }

    // ---- Fecha mínima del formulario = hoy ----
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        const pad = n => String(n).padStart(2, '0');
        fechaInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    }

    // ---- Navegacion y submenus ----
    const header = document.getElementById('header');
    const navToggle = document.getElementById('navToggle');
    const navToggleLabel = navToggle.querySelector('.site-header__toggle-label');
    const nav = document.getElementById('nav');
    const navGroups = Array.from(nav.querySelectorAll('details'));
    const scrollTopBtn = document.getElementById('scrollTop');
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileNav = window.matchMedia('(max-width: 860px)');

    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: motionPreference.matches ? 'instant' : 'smooth' });
    });

    function setNavOpen(open) {
        nav.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggleLabel.textContent = open ? 'Cerrar' : 'Menú';
        if (!open) navGroups.forEach(group => { group.open = false; });
    }

    header.dataset.ready = '';
    navToggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
    mobileNav.addEventListener('change', () => setNavOpen(false));
    navGroups.forEach(group => {
        group.addEventListener('toggle', () => {
            if (group.open) navGroups.forEach(other => { if (other !== group) other.open = false; });
        });
    });
    nav.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (!link) return;
        if (link.pathname === window.location.pathname && link.hash) {
            const target = document.getElementById(link.hash.slice(1));
            if (target) {
                target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });
            }
        }
        setNavOpen(false);
    });
    document.addEventListener('click', event => {
        if (!header.contains(event.target) && (navToggle.getAttribute('aria-expanded') === 'true' || navGroups.some(group => group.open))) {
            setNavOpen(false);
        }
    });
    header.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        const group = event.target.closest('details[open]');
        if (group) {
            group.open = false;
            group.querySelector('summary').focus();
        } else if (nav.classList.contains('open')) {
            setNavOpen(false);
            navToggle.focus();
        }
    });

    // ---- Hero Slider con SWIPE táctil ----
    const heroEl = document.querySelector('.hero');
    if (heroEl) {
        const slides = document.querySelectorAll('.hero__slide');
        const dotsContainer = document.getElementById('heroDots');
        const prevBtn = document.getElementById('heroPrev');
        const nextBtn = document.getElementById('heroNext');
        const pauseBtn = document.getElementById('heroPause');
        const heroVideo = document.querySelector('.hero__video');
        const saveData = navigator.connection?.saveData;
        let currentSlide = 0;
        let slideInterval;
        let touchStartX = 0;
        let touchEndX = 0;
        let visible = false;
        let paused = motionPreference.matches;

        function updatePlayback() {
            const canPlay = visible && !document.hidden && !paused;
            clearInterval(slideInterval);
            if (canPlay && !heroEl.matches(':hover') && !heroEl.contains(document.activeElement)) {
                slideInterval = setInterval(nextSlide, 6000);
            }

            if (canPlay && !saveData && currentSlide === 0) {
                if (!heroVideo.hasAttribute('src')) heroVideo.src = heroVideo.dataset.src;
                heroVideo.play().catch(() => {});
            } else {
                heroVideo.pause();
            }
        }

        function updatePauseButton() {
            pauseBtn.setAttribute('aria-label', paused ? 'Reanudar carrusel' : 'Pausar carrusel');
            pauseBtn.firstElementChild.className = paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
        }

        // Crear dots
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('hero__dot');
            if (i === 0) dot.classList.add('active');
            dot.type = 'button';
            dot.setAttribute('aria-label', `Ir a la portada ${i + 1}`);
            if (i === 0) dot.setAttribute('aria-current', 'true');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.hero__dot');

        function goToSlide(index) {
            slides[currentSlide].classList.remove('active');
            slides[currentSlide].inert = true;
            dots[currentSlide].classList.remove('active');
            dots[currentSlide].removeAttribute('aria-current');
            currentSlide = index;
            const slide = slides[currentSlide];
            if (slide.dataset.background) slide.style.backgroundImage = `url("${slide.dataset.background}")`;
            slide.classList.add('active');
            slide.inert = false;
            dots[currentSlide].classList.add('active');
            dots[currentSlide].setAttribute('aria-current', 'true');
            if (currentSlide === 0 && heroVideo.readyState) heroVideo.currentTime = 0;
            updatePlayback();
        }

        function nextSlide() { goToSlide((currentSlide + 1) % slides.length); }
        function prevSlide() { goToSlide((currentSlide - 1 + slides.length) % slides.length); }

        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);
        pauseBtn.addEventListener('click', () => {
            paused = !paused;
            updatePauseButton();
            updatePlayback();
        });
        updatePauseButton();
        heroVideo.addEventListener('playing', () => heroVideo.classList.remove('hero__video--loading'), { once: true });
        new IntersectionObserver(([entry]) => {
            visible = entry.intersectionRatio >= 0.25;
            updatePlayback();
        }, { threshold: 0.25 }).observe(heroEl);
        document.addEventListener('visibilitychange', updatePlayback);
        motionPreference.addEventListener('change', () => {
            paused = motionPreference.matches;
            updatePauseButton();
            updatePlayback();
        });

        // Swipe táctil para el slider
        heroEl.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
        heroEl.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) { nextSlide(); } else { prevSlide(); }
            }
        }, { passive: true });

        // Pausar slider al hover
        heroEl.addEventListener('mouseenter', updatePlayback);
        heroEl.addEventListener('mouseleave', updatePlayback);
        heroEl.addEventListener('focusin', updatePlayback);
        heroEl.addEventListener('focusout', () => setTimeout(updatePlayback, 0));
    }

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
    if (!motionPreference.matches) {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.05 });

        revealEls.forEach(el => {
            if (el.getBoundingClientRect().top > window.innerHeight) {
                el.classList.add('reveal');
                revealObserver.observe(el);
            }
        });
    }

    // ---- Photo Lightbox ----
    const photoLightbox = document.getElementById('photoLightbox');
    const photoLightboxImg = document.getElementById('photoLightboxImg');
    const photoLightboxClose = document.getElementById('photoLightboxClose');
    const photoLightboxStage = document.getElementById('photoLightboxStage');
    const photoLightboxPrev = document.getElementById('photoLightboxPrev');
    const photoLightboxNext = document.getElementById('photoLightboxNext');
    const photoLightboxCaption = document.getElementById('photoLightboxCaption');
    const photoLightboxCounter = document.getElementById('photoLightboxCounter');
    if (photoLightbox) {
        let lightboxItems = [];
        let lightboxIndex = 0;
        let lightboxTrigger = null;

        // Las tarjetas de la galería también se abren en el visor
        document.querySelectorAll('.dest-card').forEach(card => {
            const img = card.querySelector('img');
            if (!img) return;
            const title = card.querySelector('h3')?.textContent?.trim();
            card.dataset.lightboxSrc = img.getAttribute('src');
            card.dataset.lightboxAlt = title ? `${title} — ${img.alt}` : img.alt;
            card.dataset.lightboxGroup = 'galeria';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Ver foto ampliada: ${img.alt}`);
        });

        function setLightboxZoom(zoomed, e) {
            photoLightboxStage.classList.toggle('zoomed', zoomed);
            if (zoomed && e) moveLightboxZoom(e);
            if (!zoomed) photoLightboxImg.style.transformOrigin = '';
        }

        function moveLightboxZoom(e) {
            const point = e.touches ? e.touches[0] : e;
            const rect = photoLightboxImg.getBoundingClientRect();
            const x = Math.min(Math.max((point.clientX - rect.left) / rect.width, 0), 1) * 100;
            const y = Math.min(Math.max((point.clientY - rect.top) / rect.height, 0), 1) * 100;
            photoLightboxImg.style.transformOrigin = `${x}% ${y}%`;
        }

        function showLightboxItem(index) {
            lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
            const item = lightboxItems[lightboxIndex];
            setLightboxZoom(false);
            photoLightboxImg.src = item.dataset.lightboxSrc;
            photoLightboxImg.alt = item.dataset.lightboxAlt || '';
            photoLightboxCaption.textContent = item.dataset.lightboxAlt || '';
            const multiple = lightboxItems.length > 1;
            photoLightboxCounter.textContent = multiple ? `${lightboxIndex + 1} / ${lightboxItems.length}` : '';
            photoLightboxPrev.hidden = !multiple;
            photoLightboxNext.hidden = !multiple;
        }

        function openPhotoLightbox(trigger) {
            const group = trigger.dataset.lightboxGroup;
            lightboxItems = group
                ? Array.from(document.querySelectorAll(`[data-lightbox-group="${group}"]`))
                : [trigger];
            lightboxTrigger = trigger;
            showLightboxItem(lightboxItems.indexOf(trigger));
            photoLightbox.classList.add('open');
            photoLightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            photoLightboxClose.focus();
        }

        function closePhotoLightbox() {
            photoLightbox.classList.remove('open');
            photoLightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            setLightboxZoom(false);
            if (lightboxTrigger) lightboxTrigger.focus({ preventScroll: true });
        }

        document.querySelectorAll('[data-lightbox-src]').forEach(trigger => {
            trigger.addEventListener('click', () => openPhotoLightbox(trigger));
            if (trigger.tagName !== 'BUTTON') {
                trigger.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPhotoLightbox(trigger); }
                });
            }
        });

        photoLightboxPrev.addEventListener('click', () => showLightboxItem(lightboxIndex - 1));
        photoLightboxNext.addEventListener('click', () => showLightboxItem(lightboxIndex + 1));
        photoLightboxClose.addEventListener('click', closePhotoLightbox);
        photoLightbox.addEventListener('click', e => {
            if (e.target === photoLightbox || e.target === photoLightboxStage) closePhotoLightbox();
        });

        // Zoom: tocar/clic en la foto acerca o aleja; al estar con zoom, mover el dedo o el mouse recorre la foto
        photoLightboxImg.addEventListener('click', e => {
            e.stopPropagation();
            if (lightboxSwiped) return;
            setLightboxZoom(!photoLightboxStage.classList.contains('zoomed'), e);
        });
        photoLightboxImg.addEventListener('mousemove', e => {
            if (photoLightboxStage.classList.contains('zoomed')) moveLightboxZoom(e);
        });

        // Deslizar para cambiar de foto (sin zoom) o recorrer la foto (con zoom)
        let lightboxTouchX = 0;
        let lightboxSwiped = false;
        photoLightboxStage.addEventListener('touchstart', e => {
            lightboxTouchX = e.touches[0].clientX;
            lightboxSwiped = false;
        }, { passive: true });
        photoLightboxStage.addEventListener('touchmove', e => {
            if (photoLightboxStage.classList.contains('zoomed')) {
                e.preventDefault();
                moveLightboxZoom(e);
            }
        }, { passive: false });
        photoLightboxStage.addEventListener('touchend', e => {
            if (photoLightboxStage.classList.contains('zoomed') || lightboxItems.length < 2) return;
            const diff = lightboxTouchX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                lightboxSwiped = true;
                showLightboxItem(lightboxIndex + (diff > 0 ? 1 : -1));
                setTimeout(() => { lightboxSwiped = false; }, 400);
            }
        });

        document.addEventListener('keydown', e => {
            if (!photoLightbox.classList.contains('open')) return;
            if (e.key === 'Escape') closePhotoLightbox();
            if (e.key === 'ArrowLeft' && lightboxItems.length > 1) showLightboxItem(lightboxIndex - 1);
            if (e.key === 'ArrowRight' && lightboxItems.length > 1) showLightboxItem(lightboxIndex + 1);
        });
    }

    // ---- Reels "Más Actividades" ----
    // Cada video se reproduce sin sonido al aparecer en pantalla y se pausa al salir (solo se descarga cuando se ve).
    // Al activar el sonido o reproducir uno, los demás se pausan.
    const reelVideos = Array.from(document.querySelectorAll('.activities__video'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    reelVideos.forEach(video => {
        const phone = video.closest('.activities__phone');
        const playBtn = phone.querySelector('.activities__play');
        const soundBtn = phone.querySelector('.activities__sound');
        const progress = phone.querySelector('.activities__progress span');
        let userPaused = false;

        const playReel = () => {
            reelVideos.forEach(other => { if (other !== video && !other.paused) other.pause(); });
            video.play().catch(() => {});
        };

        video.addEventListener('play', () => phone.classList.add('playing'));
        video.addEventListener('pause', () => phone.classList.remove('playing'));
        video.addEventListener('timeupdate', () => {
            if (video.duration) progress.style.width = `${(video.currentTime / video.duration) * 100}%`;
        });

        playBtn.addEventListener('click', () => { userPaused = false; playReel(); });
        video.addEventListener('click', () => {
            if (video.paused) { userPaused = false; playReel(); }
            else { userPaused = true; video.pause(); }
        });

        soundBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            const on = !video.muted;
            soundBtn.classList.toggle('on', on);
            soundBtn.setAttribute('aria-label', on ? 'Silenciar' : 'Activar sonido');
            soundBtn.querySelector('i').className = on ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            if (on && video.paused) { userPaused = false; playReel(); }
        });

        new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !userPaused && !reduceMotion) playReel();
                if (!entry.isIntersecting && !video.paused) video.pause();
            });
        }, { threshold: 0.6 }).observe(video);
    });

    // ---- Contact Form → WhatsApp ----
    const contactForm = document.getElementById('contactForm');

    if (contactForm) contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre   = document.getElementById('nombre').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const email    = document.getElementById('email').value.trim();
        const servicio = document.getElementById('servicio').value;
        const fecha    = document.getElementById('fecha').value;
        const pasajeros = document.getElementById('pasajeros').value;
        const mensaje  = document.getElementById('mensaje').value.trim();

        const lines = [
            '*Cotización — Transportes y Turismo Reyes*',
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

    // ---- Botones de servicios → WhatsApp ----
    document.querySelectorAll('.service-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent?.trim();
        const button = card.querySelector('.service-card__link');

        if (!title || !button) return;

        const message = `Hola, estoy interesado/a en consultar por ${title} con Transportes y Turismo Reyes.`;
        button.href = `https://wa.me/56936363564?text=${encodeURIComponent(message)}`;
    });

    // ---- Botones de cotización de flota → WhatsApp ----
    document.querySelectorAll('.fleet-card').forEach(card => {
        const title = card.dataset.quoteTitle?.trim() || card.querySelector('h3')?.textContent?.trim();
        const button = card.querySelector('.btn--sm');

        if (!title || !button) return;

        const message = `Hola, estoy interesado/a en cotizar el ${title} de Transportes y Turismo Reyes.`;
        button.href = `https://wa.me/56936363564?text=${encodeURIComponent(message)}`;
    });

    // ---- Página Galería: álbumes y filtros ----
    // Cada álbum tiene su propio enlace para poder compartirlo,
    // y el botón "atrás" del celular vuelve a la lista de álbumes.
    const galleryIndex = document.getElementById('galleryIndex');
    if (galleryIndex) {
        const albumViews = Array.from(document.querySelectorAll('.album-view'));
        const albumCards = Array.from(document.querySelectorAll('.album-card'));
        const filterButtons = Array.from(document.querySelectorAll('.gallery-filters button'));
        document.querySelector('.gallery-filters').hidden = false;

        function renderGallery(moveFocus = false) {
            const slug = window.location.hash.slice(1);
            const album = albumViews.find(view => view.dataset.album === slug);
            galleryIndex.hidden = Boolean(album);
            albumViews.forEach(view => { view.hidden = view !== album; });
            reelVideos.forEach(video => { if (!video.paused && video.closest('[hidden]')) video.pause(); });
            const pageTitle = album?.dataset.albumTitle;
            document.title = pageTitle
                ? `${pageTitle} | Galería · Transportes y Turismo Reyes`
                : 'Galería de Viajes y Actividades | Transportes y Turismo Reyes';
            if (album || moveFocus) window.scrollTo({ top: 0, behavior: 'instant' });
            if (moveFocus) {
                const heading = (album || galleryIndex).querySelector('h1, h2, h3');
                heading.setAttribute('tabindex', '-1');
                heading.focus({ preventScroll: true });
            }
        }

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
                albumCards.forEach(card => {
                    card.hidden = filter !== 'todo' && !card.dataset.categories.split(' ').includes(filter);
                });
            });
        });

        window.addEventListener('hashchange', () => renderGallery(true));
        renderGallery();
    }

});
