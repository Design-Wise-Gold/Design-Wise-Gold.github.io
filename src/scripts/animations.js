import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// ─────────────────────────────────────────────
// INTRO CINEMATIC — Modern preloader + page reveal
// Splash logo → smooth reveal → navbar → hero
// ─────────────────────────────────────────────


function playIntro() {
    const splash        = document.querySelector("#logo-splash");
    const splashSvg     = document.querySelector("#logo-splash-svg");
    const splashLetters = document.querySelectorAll(".splash-letter");
    const logoTop       = document.querySelector("#logo__top");
    const logoLink      = document.querySelector("#logo-link");

    // Estado inicial oculto de todos los actores
    gsap.set("#navbar",            { y: -60, opacity: 0 });
    gsap.set("#menu-desktop",      { opacity: 0 });
    gsap.set(".menu-item",         { opacity: 0, y: -100 });
    gsap.set("#portal-toggle",     { opacity: 0, x: 20 });
    gsap.set("#hero-eyebrow",      { opacity: 0, y: 12 });
    gsap.set("#hero-h1",           { opacity: 0, y: 40, skewY: 2 });
    gsap.set("#hero-p",            { opacity: 0, y: 20 });
    gsap.set("#hero-cta",          { opacity: 0, y: 16 });
    gsap.set("#hero-right-label",  { opacity: 0, x: 30 });
    gsap.set("#hero-video-main",   { opacity: 0, scale: 0.96, y: 24 });
    gsap.set("#hero-card-1",       { opacity: 0, x: 40 });
    gsap.set("#hero-card-2",       { opacity: 0, x: 40 });

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    if (splashSvg && splashLetters.length > 0) {
        // Revelar contenedor SVG general suavemente pero escalado
        gsap.set(splashSvg, { opacity: 1, scale: 0.4 });
        // Ocultar letras inicialmente
        gsap.set(splashLetters, { opacity: 0, y: 10 });

        tl
            // ── OLA DE LETRAS Y DESTELLO ACCENT ──
            .to(splashLetters, {
                keyframes: [
                    // Suben, aparecen, destello accent
                    { opacity: 1, y: -8, fill: "#FAD906", duration: 0.4, ease: "power2.out" },
                    // Bajan a su posición, vuelven a blanco puro
                    { y: 0, fill: "#F2F4FF", duration: 0.4, ease: "power2.inOut" }
                ],
                stagger: 0.08, // Crea la ola izquierda -> derecha
            })
            // ── Pausa para leerlo ──
            .to(splashSvg, { duration: 0.3 }) 
            // ── Salida cinematográfica del logo completo ──
            .to(splashSvg, {
                opacity: 0,
                scale: 1.2,
                duration: 0.6,
                ease: "power2.inOut",
            })
            // ── Quitar el fondo negro ──
            .to(splash, {
                opacity: 0,
                duration: 0.5,
                ease: "power2.inOut",
                onComplete: () => {
                    if (splash) splash.style.display = "none";
                }
            }, "-=0.3");
    } else {
        // En caso de que se pierda el SVG, el splash sale para no tapar la web
        tl.to(splash, { opacity: 0, duration: 0.5, onComplete: () => { if (splash) splash.style.display = "none"; } });
    }

    tl
        // ── Navbar slides down gently ──
        .to("#navbar", {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.3")

        // ── Menu links appear ──
        .to("#menu-desktop",  {  opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.4")
        .to(".menu-item",     {  opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.2 }, "-=0.4")
        .to("#portal-toggle", { opacity: 1, x: 0, duration: 0.6 },              "-=0.4")

        // ── Hero left column — staggered reveal ──
        .to("#hero-eyebrow",  { opacity: 1, y: 0, duration: 0.6 },       "-=0.2")
        .to("#hero-h1",       { opacity: 1, y: 0, skewY: 0, duration: 0.9, ease: "expo.out" }, "-=0.4")
        .to("#hero-p",        { opacity: 1, y: 0, duration: 0.6 },       "-=0.5")
        .to("#hero-cta",      { opacity: 1, y: 0, duration: 0.55 },      "-=0.4")

        // ── Hero right column — slides in ──
        .to("#hero-right-label", { opacity: 1, x: 0, duration: 0.55 },   "-=0.5")
        .to("#hero-video-main",  { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "expo.out" }, "-=0.4")
        .to("#hero-card-1",      { opacity: 1, x: 0, duration: 0.6 },    "-=0.55")
        .to("#hero-card-2",      { opacity: 1, x: 0, duration: 0.6 },    "-=0.45");

    // ── Desktop hover: white → accent gold ──
    if (logoLink && logoTop) {
        logoLink.addEventListener("mouseenter", () => {
            gsap.to(logoTop, { duration: 0.3, ease: "power2.out"});
        });
        logoLink.addEventListener("mouseleave", () => {
            gsap.to(logoTop, { duration: 0.3, ease: "power2.out" });
        });
    }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", playIntro);


// ─────────────────────────────────────────────
// NAVBAR — Hide on scroll down, show on scroll up
// ─────────────────────────────────────────────
const navbar = document.querySelector("#navbar");

if (navbar) {
    ScrollTrigger.create({
        start: "top -80",
        end: 99999,
        onUpdate: (self) => {
            if (self.direction === 1) {
                gsap.to(navbar, { y: -100, duration: 0.4, ease: "power2.out" });
            } else {
                gsap.to(navbar, { y: 0, duration: 0.5, ease: "power2.out" });
            }
        }
    });
}

// ─────────────────────────────────────────────
// ACCESS PORTAL PANEL — slide in from right
// ─────────────────────────────────────────────
const portalToggle = document.querySelector("#portal-toggle");
const portalPanel  = document.querySelector("#portal-panel");
const portalClose  = document.querySelector("#portal-close");

let portalOpen = false;

function openPortal() {
    portalOpen = true;
    portalPanel.style.pointerEvents = "auto";
    gsap.fromTo(
        portalPanel,
        { x: "100%" },
        { x: "0%", duration: 0.55, ease: "power4.out" }
    );
}

function closePortal() {
    portalOpen = false;
    gsap.to(portalPanel, {
        x: "100%",
        duration: 0.4,
        ease: "power4.in",
        onComplete: () => { portalPanel.style.pointerEvents = "none"; }
    });
}

if (portalToggle && portalPanel) {
    portalToggle.addEventListener("click", () => {
        portalOpen ? closePortal() : openPortal();
    });
}

if (portalClose) {
    portalClose.addEventListener("click", closePortal);
}


// ─────────────────────────────────────────────
// MOBILE MENU — Toggle with GSAP animation
// ─────────────────────────────────────────────
const menuToggle = document.querySelector("#menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const menuItems = document.querySelectorAll(".mobile-menu-item");
const menuCta   = document.querySelector(".mobile-menu-cta");
const line1     = document.querySelector("#burger-line-1");
const line2     = document.querySelector("#burger-line-2");

// GSAP controla toda la posición — establecer estado inicial de hamburguesa
if (line1 && line2) {
    gsap.set(line1, { y: -5 });
    gsap.set(line2, { y:  5 });
}

let menuOpen = false;

// Timeline para el menú (se crea una sola vez)
const menuTl = gsap.timeline({ paused: true });

menuTl
    // 1. Revelar el overlay con clip-path de arriba hacia abajo
    .to(mobileMenu, {
        clipPath: "inset(0 0 0% 0)",
        duration: 0.6,
        ease: "power4.inOut",
        pointerEvents: "auto",
        onStart: () => {
            mobileMenu.style.pointerEvents = "auto";
        },
    })
    // 2. Entrar los ítems de menú uno por uno (stagger elegante)
    .fromTo(
        menuItems,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.45, ease: "power3.out" },
        "-=0.25"
    )
    // 3. Entrar el botón de Access Portal al final
    .fromTo(
        menuCta,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" },
        "-=0.15"
    );

function openMenu() {
    menuOpen = true;
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden"; // evita scroll de fondo

    // Animar burger → X: mover ambas líneas al centro y rotar
    gsap.to(line1, { y: 0, rotate: 45,  duration: 0.35, ease: "power2.inOut" });
    gsap.to(line2, { y: 0, rotate: -45, duration: 0.35, ease: "power2.inOut" });

    menuTl.play();
}

function closeMenu() {
    menuOpen = false;
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";

    // Revertir burger al estado de hamburguesa
    gsap.to(line1, { rotate: 0, y: -5, duration: 0.3, ease: "power2.inOut" });
    gsap.to(line2, { rotate: 0, y:  5, duration: 0.3, ease: "power2.inOut" });

    // Cerrar overlay
    gsap.to(mobileMenu, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.5,
        ease: "power4.inOut",
        onComplete: () => {
            mobileMenu.style.pointerEvents = "none";
            // Reset para próxima apertura
            menuTl.pause(0);
        },
    });
}

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        menuOpen ? closeMenu() : openMenu();
    });
}

// Cerrar menú al hacer click en cualquier link del menú móvil
document.querySelectorAll(".mobile-menu-link").forEach((link) => {
    link.addEventListener("click", () => {
        if (menuOpen) closeMenu();
    });
});

// ─────────────────────────────────────────────
// HERO EXIT & ECOSYSTEM ENTRANCE — Cinematic Scroll
// ─────────────────────────────────────────────
const heroHeader = document.querySelector("#hero-header");
const ecosystemSection = document.querySelector("#ecosystem");

if (heroHeader && ecosystemSection) {
    // 1. Hero Exit (Reverse order of entrance, tied to scroll)
    const tlHeroExit = gsap.timeline({
        scrollTrigger: {
            trigger: heroHeader,
            start: "top top", // When top of hero hits viewport top
            end: "60% top", // Termina cuando el 60% del hero haya pasado. Todo ocurre mucho antes y visible.
            scrub: 1, // Smooth scrubbing
        }
    });

    tlHeroExit
        // Congregamos la salida: ambas columnas se van "juntas" casi al mismo tiempo pero escalonadas
        // Derecha
        .to(["#hero-card-2", "#hero-card-1"], { y: -80, opacity: 0, duration: 1 }, 0)
        .to("#hero-video-main",  { y: -80, opacity: 0, duration: 1 }, 0.1)
        .to("#hero-right-label", { y: -80, opacity: 0, duration: 1 }, 0.2)
        // Izquierda (cta, p, h1, span)
        .to("#hero-cta",         { y: -40, opacity: 0, duration: 1 }, 0.15)
        .to("#hero-p",           { y: -40, opacity: 0, duration: 1 }, 0.25)
        .to("#hero-h1",          { y: -40, opacity: 0, duration: 1 }, 0.35)
        .to("#hero-eyebrow",     { y: -40, opacity: 0, duration: 1 }, 0.45);


    // 2. Ecosystem Cinematic Entrance & Pinned Scroll
    const ecoRight = document.querySelector("#ecosystem-right");
    const ecoCards = gsap.utils.toArray("#ecosystem-left > *");

    // Set initial state before scrolling
    gsap.set("#eco-h2", { opacity: 0, x: 50 });
    gsap.set("#eco-p", { opacity: 0, x: 50 });
    gsap.set(ecoCards, { opacity: 0, y: 100 });

    // Animación de entrada de los textos fijos (derecha) al salir del Hero
    gsap.to(["#eco-h2", "#eco-p"], {
        opacity: 1, 
        x: 0, 
        duration: 1, 
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ecosystemSection,
            start: "top 75%", // Se revela a medida que bajamos del Hero
            toggleActions: "play none none reverse"
        }
        
    });

    // Animación y Pin adaptativo Desktop vs Mobile
    const mm = gsap.matchMedia();

    // --- DESKTOP: Toda la sección se queda fija mientras las tarjetas rotan ---
    mm.add("(min-width: 1024px)", () => {
        // Bajamos las opacidades iniciales de las tarjetas para la animación
        gsap.set(ecoCards, { opacity: 0, y: 40 });

        // Timeline atado al scroll (Fija la sección)
        const tlEcosystem = gsap.timeline({
            scrollTrigger: {
                trigger: ecosystemSection,
                start: "top top",       // Parará justo cuando llene la pantalla
                end: "+=3500",          // Le damos un largo receso de scroll ficticio (3500px)
                pin: true,
                scrub: 1,               // Scrub muy suave
            }
        });

        // Recorremos las tarjetas para animar su Entrada, Pausa y Salida
        ecoCards.forEach((card, i) => {
            // 1. Entrada de la tarjeta
            tlEcosystem.to(card, {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power2.out"
            });

            // 2. Tiempo de espera visible mientras sigues escroleando
            tlEcosystem.to({}, { duration: 1.5 });

            // 3. Salida de la tarjeta (todas desaparecen excepto la última)
            if (i !== ecoCards.length - 1) {
                tlEcosystem.to(card, {
                    opacity: 0,
                    y: -40,
                    duration: 1,
                    ease: "power2.in"
                });
            }
        });
    });

    // --- MOBILE: Animación tradicional fluyendo de abajo hacia arriba ---
    mm.add("(max-width: 1023px)", () => {
        gsap.set(ecoCards, { opacity: 0, y: 50 });
        ecoCards.forEach((card) => {
            gsap.to(card, {
                opacity: 1,
                y: 0,
                ease: "none",
                scrollTrigger: {
                    trigger: card,
                    start: "top 95%",
                    end: "center center",
                    scrub: 2,
                }
            });
        });
    });
}


