const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initLoader() {
  const loader = $("#loader");
  const bar = $("#loaderBar");
  if (!loader || !bar) return;

  let progress = 0;
  const tick = window.setInterval(() => {
    progress = Math.min(100, progress + Math.random() * 18 + 9);
    bar.style.width = `${progress}%`;
    if (progress >= 100) {
      window.clearInterval(tick);
      window.setTimeout(() => loader.classList.add("hidden"), prefersReducedMotion ? 80 : 420);
    }
  }, prefersReducedMotion ? 20 : 120);
}

function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("reet-theme");
  if (saved) root.dataset.theme = saved;

  $("#themeToggle")?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("reet-theme", next);
    document.body.animate(
      [{ opacity: 0.82, filter: "blur(2px)" }, { opacity: 1, filter: "blur(0)" }],
      { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  });
}

function initCursor() {
  const cursor = $("#cursor");
  if (!cursor || prefersReducedMotion || matchMedia("(pointer: coarse)").matches) return;
  const dot = $("span", cursor);
  const ring = $("i", cursor);
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let rx = x;
  let ry = y;

  window.addEventListener("mousemove", (event) => {
    x = event.clientX;
    y = event.clientY;
    dot.style.transform = `translate(${x}px, ${y}px)`;
  });

  function frame() {
    rx += (x - rx) * 0.16;
    ry += (y - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(frame);
  }
  frame();

  $$("a, button, input, textarea, select, .work-card, .service-card, .person-card").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
}

function initSmoothScroll() {
  if (prefersReducedMotion || typeof Lenis === "undefined") return null;
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.92 });
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  return lenis;
}

function initScrollProgress(lenis) {
  const progress = $("#scrollProgress");
  if (!progress) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${Math.min(100, pct)}%`;
  };
  window.addEventListener("scroll", update, { passive: true });
  lenis?.on?.("scroll", ({ scroll, limit }) => {
    progress.style.width = `${limit ? (scroll / limit) * 100 : 0}%`;
  });
  update();
}

function initMenu(lenis) {
  const panel = $("#menuPanel");
  const open = $("#menuToggle");
  const close = $("#closeMenu");
  const setOpen = (state) => {
    panel?.classList.toggle("open", state);
    panel?.setAttribute("aria-hidden", String(!state));
  };

  open?.addEventListener("click", () => setOpen(true));
  close?.addEventListener("click", () => setOpen(false));
  $$(".menu-panel a, .dock a[href^='#']").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href?.startsWith("#")) return;
      const target = $(href);
      if (!target) return;
      event.preventDefault();
      setOpen(false);
      lenis ? lenis.scrollTo(target, { offset: -84 }) : target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function initReveal() {
  const elements = $$(".reveal");
  if (!elements.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  elements.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 6, 5) * 55}ms`;
    observer.observe(el);
  });
}

function initRoleSwitcher() {
  const role = $("#roleSwitcher");
  if (!role) return;
  const roles = ["UI/UX systems", "brand stories", "growth campaigns", "social identities", "web experiences"];
  let index = 0;
  setInterval(() => {
    index = (index + 1) % roles.length;
    role.animate([{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-10px)" }], { duration: 180, fill: "forwards" }).finished.then(() => {
      role.textContent = roles[index];
      role.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 260, fill: "forwards" });
    });
  }, 1900);
}

function initCounters() {
  const counters = $$("[data-count]");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count || 0);
      const start = performance.now();
      const duration = 1400;
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = `${Math.round(target * eased)}${t === 1 ? "+" : ""}`;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.45 });
  counters.forEach((counter) => observer.observe(counter));
}

function initWorkFilters() {
  const buttons = $$(".filters button");
  const cards = $$(".work-card");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      buttons.forEach((btn) => btn.classList.toggle("active", btn === button));
      cards.forEach((card) => {
        const visible = filter === "all" || card.dataset.category?.includes(filter);
        card.classList.toggle("hidden", !visible);
      });
    });
  });
}

function initCases() {
  const dialog = $("#caseDialog");
  const title = $("#caseDialogTitle");
  window.openCase = (name) => {
    if (title) title.textContent = name;
    if (dialog?.showModal) dialog.showModal();
  };
  $$(".open-case").forEach((button) => button.addEventListener("click", () => openCase(button.dataset.case || "Case Study")));
  $("#closeCase")?.addEventListener("click", () => dialog?.close());
}

function initTestimonials() {
  const el = $(".testimonialSwiper");
  if (!el || typeof Swiper === "undefined") return;
  new Swiper(el, {
    loop: true,
    speed: 750,
    autoplay: prefersReducedMotion ? false : { delay: 4200, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: true }
  });
}

function initMagnetic() {
  if (prefersReducedMotion || matchMedia("(pointer: coarse)").matches) return;
  $$(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.12}px, ${y * 0.22}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0, 0)";
    });
  });
}

function initParallax() {
  if (prefersReducedMotion) return;
  const item = $("[data-parallax]");
  if (!item) return;
  window.addEventListener("scroll", () => {
    const rect = item.getBoundingClientRect();
    const center = rect.top + rect.height / 2 - window.innerHeight / 2;
    item.style.transform = `translateY(${center * -0.025}px)`;
  }, { passive: true });
}

function initCanvas() {
  const canvas = $("#orbCanvas");
  if (!canvas || prefersReducedMotion) return;
  const ctx = canvas.getContext("2d");
  const dots = Array.from({ length: 58 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.8 + 0.4,
    vx: (Math.random() - 0.5) * 0.00055,
    vy: (Math.random() - 0.5) * 0.00055
  }));
  let pointer = { x: 0.5, y: 0.5 };

  function resize() {
    canvas.width = Math.floor(canvas.clientWidth * devicePixelRatio);
    canvas.height = Math.floor(canvas.clientHeight * devicePixelRatio);
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(pointer.x * w, pointer.y * h, 0, pointer.x * w, pointer.y * h, Math.min(w, h) * 0.65);
    glow.addColorStop(0, "rgba(199,155,82,.18)");
    glow.addColorStop(0.42, "rgba(111,127,77,.09)");
    glow.addColorStop(1, "rgba(109,38,57,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    dots.forEach((dot, index) => {
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x < 0 || dot.x > 1) dot.vx *= -1;
      if (dot.y < 0 || dot.y > 1) dot.vy *= -1;
      const x = dot.x * w;
      const y = dot.y * h;
      ctx.beginPath();
      ctx.arc(x, y, dot.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = index % 3 === 0 ? "rgba(199,155,82,.5)" : "rgba(255,247,232,.24)";
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (event) => {
    pointer = { x: event.clientX / innerWidth, y: event.clientY / innerHeight };
  }, { passive: true });
  resize();
  draw();
}

function initContactForm() {
  const form = $("#contactForm");
  const status = $("#formStatus");
  if (!form || !status) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "Message drafted. Reet will reply within 24-48 hours.";
    form.reset();
  });
}

function initEasterEgg() {
  let buffer = "";
  document.addEventListener("keydown", (event) => {
    buffer = `${buffer}${event.key.toLowerCase()}`.slice(-10);
    if (buffer.includes("reet")) {
      document.body.animate(
        [
          { filter: "saturate(1) contrast(1)" },
          { filter: "saturate(1.6) contrast(1.08)" },
          { filter: "saturate(1) contrast(1)" }
        ],
        { duration: 1000, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
    }
  });
  console.log("%cReet Mattu", "font: 700 40px serif; color: #c79b52;");
  console.log("Type 'reet' anywhere for a small hidden flourish.");
}

document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initTheme();
  initCursor();
  const lenis = initSmoothScroll();
  initScrollProgress(lenis);
  initMenu(lenis);
  initReveal();
  initRoleSwitcher();
  initCounters();
  initWorkFilters();
  initCases();
  initTestimonials();
  initMagnetic();
  initParallax();
  initCanvas();
  initContactForm();
  initEasterEgg();
});
