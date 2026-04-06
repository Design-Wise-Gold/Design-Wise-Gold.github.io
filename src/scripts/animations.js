import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// ─────────────────────────────────────────────
// INTRO CINEMATIC — Page load entrance
// Coreografía: navbar → left col → right col
// ─────────────────────────────────────────────
function playIntro() {
    // Estado inicial oculto de todos los actores
    gsap.set("#navbar",            { y: -80, opacity: 0 });
    gsap.set("#menu-desktop",      { opacity: 0 });
    gsap.set("#portal-toggle",     { opacity: 0, x: 20 });
    gsap.set("#hero-eyebrow",      { opacity: 0, y: 12 });
    gsap.set("#hero-h1",           { opacity: 0, y: 40, skewY: 2 });
    gsap.set("#hero-p",            { opacity: 0, y: 20 });
    gsap.set("#hero-cta",          { opacity: 0, y: 16 });
    gsap.set("#hero-right-label",  { opacity: 0, x: 30 });
    gsap.set("#hero-video-main",   { opacity: 0, scale: 0.96, y: 24 });
    gsap.set("#hero-card-1",       { opacity: 0, x: 40 });
    gsap.set("#hero-card-2",       { opacity: 0, x: 40 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl
        // — ACT 1: Navbar desciende —
        .to("#navbar", { y: 0, opacity: 1, duration: 0.9, ease: "power4.out" })

        // — Logo ya está, ahora entran los links del menú desktop —
        .to("#menu-desktop",  { opacity: 1, duration: 0.5 },              "-=0.4")
        .to("#portal-toggle", { opacity: 1, x: 0, duration: 0.5 },        "-=0.45")

        // — ACT 2: Columna izquierda — se revela de arriba a abajo —
        .to("#hero-eyebrow",  { opacity: 1, y: 0, duration: 0.55 },       "-=0.1")
        .to("#hero-h1",       { opacity: 1, y: 0, skewY: 0, duration: 0.75, ease: "expo.out" }, "-=0.35")
        .to("#hero-p",        { opacity: 1, y: 0, duration: 0.55 },       "-=0.4")
        .to("#hero-cta",      { opacity: 1, y: 0, duration: 0.5 },        "-=0.35")

        // — ACT 3: Columna derecha — entra desde la derecha simultáneamente con el CTA —
        .to("#hero-right-label", { opacity: 1, x: 0, duration: 0.5 },     "-=0.4")
        .to("#hero-video-main",  { opacity: 1, scale: 1, y: 0, duration: 0.75, ease: "expo.out" }, "-=0.35")
        .to("#hero-card-1",      { opacity: 1, x: 0, duration: 0.55 },    "-=0.5")
        .to("#hero-card-2",      { opacity: 1, x: 0, duration: 0.55 },    "-=0.4");
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
