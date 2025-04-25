//
// GLOBAL VARIABLES
//

const durationBase = 0.8;
const durationFast = 0.4;
const durationSlow = 1.4;
const easeBase = "power4.out";

//
// FUNCTION DECLARATIONS
//

function isMenuOpen() {
  const menu = document.querySelector(".nav_menu");
  return menu && menu.getAttribute("aria-hidden") === "false";
}

function navScroll() {
  const navComponent = document.querySelector(".nav_component");
  const navBorder = document.querySelector(".nav_border");

  if (!navComponent) return;

  let navHidden = false;
  let activeTween = null;

  ScrollTrigger.create({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      if (isMenuOpen()) {
        if (activeTween) activeTween.kill();
        gsap.set(navComponent, { y: "0%" });
        gsap.set(navBorder, { opacity: 1 });
        navHidden = false;
        return;
      }

      const scrollingUp = self.direction === -1;

      if (scrollingUp && navHidden) {
        if (activeTween) activeTween.kill();
        navHidden = false;

        activeTween = gsap.to([navComponent, navBorder], {
          y: "0%",
          opacity: 1,
          duration: durationBase,
          ease: easeBase,
          onComplete: () => {
            activeTween = null;
          },
        });
      } else if (!scrollingUp && !navHidden) {
        if (activeTween) activeTween.kill();
        navHidden = true;

        activeTween = gsap.to([navComponent, navBorder], {
          y: (i) => (i === 0 ? "-100%" : 0),
          opacity: (i) => (i === 1 ? 0 : 1),
          duration: durationBase,
          ease: easeBase,
          onComplete: () => {
            activeTween = null;
          },
        });
      }
    },
  });
}

function navOpen() {
  const hamburger = document.querySelector(".nav_hamburger");
  const lineTop = hamburger.querySelector(".is-top");
  const lineBottom = hamburger.querySelector(".is-bottom");
  const menu = document.querySelector(".nav_menu");
  const menuWrap = menu.querySelector(".menu_wrap");
  const items = menu.querySelectorAll(".menu-link_wrap");
  const overlay = document.querySelector(".nav_overlay");
  let menuOpen = false;

  hamburger.setAttribute("aria-expanded", "false");
  hamburger.setAttribute("aria-controls", "navigation-menu");
  menu.setAttribute("id", "navigation-menu");
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-hidden", "true");

  gsap.set(menu, { x: "100%" });

  let focusableElements;
  let firstFocusableElement;
  let lastFocusableElement;

  const updateFocusableElements = () => {
    focusableElements = menu.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusableElement = focusableElements[0];
    lastFocusableElement = focusableElements[focusableElements.length - 1];
  };

  const trapFocus = (e) => {
    if (menuOpen) {
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement.focus();
        } else if (
          !e.shiftKey &&
          document.activeElement === lastFocusableElement
        ) {
          e.preventDefault();
          firstFocusableElement.focus();
        }
      }

      if (e.key === "Escape") {
        closeMenu();
        hamburger.focus();
      }
    }
  };

  const menuAnim = gsap.timeline({
    paused: true,
    defaults: {
      duration: 0.6,
      ease: "power2.out",
    },
  });

  const openMenu = () => {
    updateFocusableElements();

    menuAnim
      .set(menu, { display: "flex" })
      .set(overlay, { display: "block" })
      .to(menu, { x: "0%" }, "<")
      .to(lineTop, { y: 6, rotate: -45, duration: durationFast }, "<")
      .to(lineBottom, { y: -6, rotate: 45, duration: durationFast }, "<")
      .from(
        items,
        {
          filter: "blur(4px)",
          y: "3rem",
          opacity: 0,
          stagger: 0.15,
        },
        "<0.4"
      )
      .play();

    menuOpen = true;
    hamburger.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");

    document.addEventListener("keydown", trapFocus);

    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }
  };

  const closeMenu = () => {
    menuAnim
      .to(menu, { x: "100%" })
      .to(lineTop, { y: 0, rotate: 0, duration: durationFast }, "<")
      .to(lineBottom, { y: 0, rotate: 0, duration: durationFast }, "<")
      .set(menu, { display: "none" })
      .set(overlay, { display: "none" })
      .play();

    menuOpen = false;
    hamburger.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");

    document.removeEventListener("keydown", trapFocus);
  };

  items.forEach((item) => {
    item.setAttribute("role", "menuitem");
  });

  hamburger.addEventListener("click", () => {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener("click", () => {
    closeMenu();
  });
}

function loadWistiaScript(callback) {
  if (window._wistiaLoaded) {
    callback?.();
    return;
  }

  window._wistiaLoaded = true;

  const script = document.createElement("script");
  script.src = "https://fast.wistia.com/assets/external/E-v1.js";
  script.async = true;

  script.onload = () => {
    callback?.();
  };

  document.head.appendChild(script);
}

function menuLinkHover() {
  const links = document.querySelectorAll('[data-menu="link"]');

  links.forEach((link) => {
    const linkText = link.querySelector(".menu-link_title");
    const circle = link.querySelector(".menu-link_circle");

    if (!linkText) return;

    const split = new SplitType(linkText, { types: "chars" });
    const chars = split.chars;

    gsap.set(chars, { autoAlpha: 1 });
    gsap.set(circle, { scale: 0.3, opacity: 0 });

    const enterTL = gsap.timeline({ paused: true });

    enterTL
      .to(
        chars,
        {
          autoAlpha: 0,
          duration: 0.01,
        },
        0
      )

      .to(
        chars,
        {
          autoAlpha: 1,
          duration: 0.01,
          stagger: 0.07,
          ease: "none",
        },
        ">"
      )

      .to(
        circle,
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" },
        "<"
      );

    const leaveTL = gsap.timeline({ paused: true });

    leaveTL
      .to(circle, { scale: 0.3, opacity: 0, duration: 0.2 }, 0)
      .set(chars, { autoAlpha: 1 }, 0);

    link.addEventListener("mouseenter", () => enterTL.restart());
    link.addEventListener("mouseleave", () => leaveTL.restart());
  });
}

function staggerHover() {
  const hovers = document.querySelectorAll('[data-hover="stagger"]');

  hovers.forEach((hover) => {
    const text = hover.querySelector('[data-hover="stagger-text"]');

    if (!text) return;

    hover.addEventListener("mouseenter", () => {
      scrambleText(text, 6, 50);
    });
  });
}

function anchorLinkHover() {
  const anchors = document.querySelectorAll('[data-hover="anchor"]');

  anchors.forEach((hover) => {
    const text = hover.querySelector('[data-hover="anchor-text"]');
    const bg = hover.querySelector('[data-hover="anchor-bg"]');

    if (!text || !bg) return;

    const originalText = text.textContent;
    let scrambleInterval = null;

    const tlIn = gsap.timeline({
      paused: true,
      defaults: {
        duration: durationFast,
        ease: easeBase,
      },
    });

    tlIn
      .call(
        () => {
          if (scrambleInterval) clearInterval(scrambleInterval);
          text.textContent = originalText;

          scrambleInterval = scrambleText(text, 6, 50);
        },
        null,
        0
      )
      .to(bg, { y: "0%" }, 0);

    hover.addEventListener("mouseenter", () => {
      const pillWidth = hover.offsetWidth;
      hover.style.width = `${pillWidth}px`;

      tlIn.restart();
    });

    hover.addEventListener("mouseleave", () => {
      if (scrambleInterval) clearInterval(scrambleInterval);
      text.textContent = originalText;

      gsap.to(bg, {
        y: "100%",
        duration: durationFast,
        ease: easeBase,
      });
    });
  });
}

function copyright() {
  const copyrightDate = document.querySelector(
    '[data-element="copyright-date"]'
  );

  if (copyrightDate) {
    const currentYear = new Date().getFullYear();
    copyrightDate.textContent = currentYear;
  }
}

function externalLinks() {
  const links = document.querySelectorAll('[data-link="external"]');

  if (!links.length) {
    return;
  }

  links.forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
}

function anchorLinks() {
  const links = document.querySelectorAll('.g_clickable[data-link="anchor"]');

  links.forEach((link) => {
    const href = link.getAttribute("href");
    link.setAttribute("href", `/#${href}`);
  });
}

function newsCardHover() {
  const cards = document.querySelectorAll(".news-card_wrap");
  const splits = [];

  function setupUnderlines(heading) {
    const lines = heading.querySelectorAll(".line");
    lines.forEach((line) => {
      // Avoid duplicate underlines if re-splitting
      if (!line.querySelector(".news-card_underline")) {
        const underline = document.createElement("div");
        underline.classList.add("news-card_underline");
        line.appendChild(underline);
        gsap.set(underline, { scaleX: 0, transformOrigin: "left center" });
      }
    });
  }

  cards.forEach((card) => {
    const heading = card.querySelector(".news-card_title");
    if (!heading) return;

    const split = new SplitType(heading, {
      types: "lines",
      tagName: "span",
    });

    splits.push({ split, heading });

    setupUnderlines(heading);

    card.addEventListener("mouseenter", () => {
      const lines = heading.querySelectorAll(".line");
      lines.forEach((line, i) => {
        const underline = line.querySelector(".news-card_underline");
        gsap.set(underline, { transformOrigin: "left center" });
        gsap.to(underline, {
          scaleX: 1,
          duration: durationBase,
          ease: easeBase,
          delay: i * 0.2,
        });
      });
    });

    card.addEventListener("mouseleave", () => {
      const lines = heading.querySelectorAll(".line");
      lines.forEach((line, i) => {
        const underline = line.querySelector(".news-card_underline");
        gsap.set(underline, { transformOrigin: "right center" });
        gsap.to(underline, {
          scaleX: 0,
          duration: durationBase,
          ease: easeBase,
          delay: i * 0.2,
        });
      });
    });
  });

  const handleResize = debounce(() => {
    splits.forEach(({ split, heading }) => {
      split.split();
      setupUnderlines(heading);
    });
  });

  const resizeObserver = new ResizeObserver(handleResize);
  cards.forEach((card) => {
    const heading = card.querySelector(".news-card_title");
    if (heading) resizeObserver.observe(heading);
  });
}

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

function footerLinkHover() {
  const links = document.querySelectorAll(".footer-link_wrap");

  links.forEach((link) => {
    const line = link.querySelector(".footer-link_line");

    gsap.set(line, { scaleX: 0, transformOrigin: "left center" });

    link.addEventListener("mouseenter", () => {
      link.classList.add("is-hovered");

      links.forEach((otherLink) => {
        if (otherLink !== link) {
          otherLink.classList.add("is-dimmed");
        }
      });

      gsap.set(line, { transformOrigin: "left center" });
      gsap.to(line, {
        scaleX: 1,
        duration: durationBase,
        ease: easeBase,
      });
    });

    link.addEventListener("mouseleave", () => {
      link.classList.remove("is-hovered");

      links.forEach((otherLink) => {
        otherLink.classList.remove("is-dimmed");
      });

      gsap.set(line, { transformOrigin: "right center" });
      gsap.to(line, {
        scaleX: 0,
        duration: durationBase,
        ease: easeBase,
      });
    });
  });
}

function floatingLabel() {
  document.querySelectorAll(".form_input").forEach(function (input) {
    input.addEventListener("focusout", function () {
      if (this.value.length > 0) {
        this.classList.add("focus-out");
      } else {
        this.classList.remove("focus-out");
      }
    });
  });
}

// SCROLL ANIMATIONS

const getRandomChar = () => {
  const chars = "!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  return chars[Math.floor(Math.random() * chars.length)];
};

const scrambleText = (target, frames = 12, delay = 70) => {
  const text = target.textContent;

  target.style.visibility = "visible";

  let frame = 0;

  const interval = setInterval(() => {
    let output = "";

    for (let i = 0; i < text.length; i++) {
      const revealIndex = Math.floor((frame / frames) * text.length);
      output += i < revealIndex ? text[i] : getRandomChar();
    }

    target.textContent = output;
    frame++;

    if (frame > frames) {
      clearInterval(interval);
      target.textContent = text;
    }
  }, delay);
};

function loader() {
  const nav = document.querySelector(".nav_component");
  const block = document.querySelector(".loader_block");
  const scramble = document.querySelector('[data-load="scramble"]');
  const heading = document.querySelector('[data-load="split-chars"]');
  const fades = document.querySelectorAll('[data-load="fade-up"]');

  if (!block) return;

  let splitText = [];
  let staggerAmount = 0.06;

  if (heading) {
    const isFast = heading.getAttribute("data-speed") === "fast";
    staggerAmount = isFast ? 0.03 : 0.06;

    const headlineSplit = new SplitType(heading, {
      types: "lines, chars",
      tagName: "span",
    });

    splitText = heading.querySelectorAll(".char");
    gsap.set(splitText, { autoAlpha: 0 });
  }

  let tl = gsap.timeline({
    defaults: {
      duration: durationSlow,
      ease: easeBase,
    },
  });

  if (nav) {
    tl.to(
      nav,
      {
        y: "0%",
      },
      "<0.4"
    );
  }

  tl.to(
    block,
    {
      opacity: 0,
      duration: 2.5,
    },
    "<0.3"
  );

  if (scramble) {
    tl.to(
      scramble,
      {
        duration: 0.1,
        onStart: () => scrambleText(scramble),
      },
      "<0.2"
    );
  }

  if (splitText.length) {
    tl.to(
      splitText,
      {
        autoAlpha: 1,
        stagger: staggerAmount,
        duration: 0.01,
        ease: "none",
      },
      "<0.1"
    );
  }

  if (fades.length) {
    tl.to(
      fades,
      {
        opacity: 1,
        filter: "blur(0px)",
        y: "0rem",
        stagger: 0.1,
      },
      "<0.2"
    );
  }
}

function fadeUp() {
  const fades = document.querySelectorAll('[data-scroll="fade-up"]');

  if (!fades.length) {
    return;
  }

  fades.forEach((fade) => {
    gsap.set(fade, { filter: "blur(6px)", opacity: 0, y: "4rem" });

    let fadeUp = gsap.timeline({
      scrollTrigger: {
        trigger: fade,
        start: "top bottom",
        toggleActions: "play none none reverse",
      },
      defaults: {
        duration: durationSlow,
        ease: easeBase,
      },
    });

    fadeUp.to(fade, {
      opacity: 1,
      filter: "blur(0px)",
      y: "0rem",
    });
  });
}

function textScramble() {
  const texts = document.querySelectorAll('[data-scroll="scramble"]');

  if (!texts.length) return;

  texts.forEach((target) => {
    gsap.timeline({
      scrollTrigger: {
        trigger: target,
        start: "top bottom+=50",
        onEnter: () => scrambleText(target),
      },
    });
  });
}

function splitChars() {
  const headings = document.querySelectorAll('[data-scroll="split-chars"]');

  if (!headings.length) return;

  headings.forEach((heading) => {
    const isFast = heading.getAttribute("data-speed") === "fast";
    const staggerAmount = isFast ? 0.03 : 0.06;

    const headlineSplit = new SplitType(heading, {
      types: "words, chars",
      tagName: "span",
    });

    const splitText = heading.querySelectorAll(".char");

    gsap.set(splitText, { autoAlpha: 0 });

    let splitAnim = gsap.timeline({
      scrollTrigger: {
        trigger: heading,
        start: "top bottom",
        toggleActions: "play none none reverse",
      },
      defaults: {
        duration: 0.01,
        ease: "power2.inOut",
      },
    });

    splitAnim.to(splitText, {
      autoAlpha: 1,
      stagger: staggerAmount,
    });
  });
}

function imageReveal() {
  const items = document.querySelectorAll(".image-grid_item");

  items.forEach((item) => {
    const image = item.querySelectorAll(".image-grid_image");
    const overlay = item.querySelectorAll(".image-grid_overlay");

    gsap.set(overlay, { height: "100%" });
    gsap.set(image, { scale: 1.3, filter: "blur(6px)" });

    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: item,
        start: "top bottom+=100",
        toggleActions: "play none none reverse",
      },
      defaults: {
        duration: durationSlow,
        ease: "power3.out",
      },
    });

    tl.to(overlay, {
      height: "0%",
    }).to(
      image,
      {
        scale: 1,
        filter: "blur(0px)",
      },
      "<0.2"
    );
  });
}

function textReveal() {
  const headings = document.querySelectorAll('[data-scroll="text-reveal"]');

  if (!headings.length) return;

  headings.forEach((heading) => {
    const split = new SplitType(heading, {
      types: "words, chars",
      tagName: "span",
    });

    const words = heading.querySelectorAll(".char");

    gsap.set(words, { opacity: 0.2 });

    gsap.to(words, {
      opacity: 1,
      stagger: 0.01,
      ease: easeBase,
      duration: durationSlow,
      scrollTrigger: {
        trigger: heading,
        start: "top 92%",
        toggleActions: "play none none reverse",
        scrub: 2,
      },
    });
  });
}

//
// FUNCTION INITS
//

isMenuOpen();
navScroll();
navOpen();
copyright();
externalLinks();
anchorLinks();
floatingLabel();
loader();
fadeUp();
textScramble();
splitChars();
imageReveal();
textReveal();

if (window.matchMedia("(min-width: 992px)").matches) {
  menuLinkHover();
  staggerHover();
  anchorLinkHover();
  newsCardHover();
  footerLinkHover();
}