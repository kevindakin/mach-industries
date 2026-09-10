function footerReveal() {
  const footer = document.querySelector(".footer_fixed_wrap");
  if (!footer) return;

  const gradients = footer.querySelectorAll('[id^="logo-gradient-"]');
  const gradientsIn = { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let ctx;

  const build = () => {
    if (ctx) ctx.revert();

    // Static mode must be applied before measuring the trigger start.
    const fits = footer.offsetHeight <= window.innerHeight;
    footer.classList.toggle("is-static", !fits);

    ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(gradients, { attr: gradientsIn });
        return;
      }

      gsap.set(gradients, {
        attr: { x1: "-1000%", y1: "-1000%", x2: "100%", y2: "100%" },
      });

      const tl = gsap.timeline({
        paused: true,
        defaults: { duration: 2, ease: easeBase },
      });

      if (fits) {
        gsap.set(footer, { opacity: 0, y: "-5%" });
        tl.to(footer, { opacity: 1, y: "0%" }, 0);
      }

      tl.to(gradients, { attr: gradientsIn, stagger: 0.3 }, fits ? 0.1 : 0);

      ScrollTrigger.create(
        fits
          ? {
              start: () =>
                ScrollTrigger.maxScroll(window) -
                Math.min(footer.offsetHeight, window.innerHeight) * 0.8,
              end: () => ScrollTrigger.maxScroll(window),
              invalidateOnRefresh: true,
              onEnter: () => tl.play(),
              onLeaveBack: () => tl.reverse(),
            }
          : {
              // Footer is in normal flow — trigger off the element itself.
              trigger: footer.querySelector(".logo-reveal_svg"),
              start: "top 85%",
              invalidateOnRefresh: true,
              onEnter: () => tl.play(),
              onLeaveBack: () => tl.reverse(),
            }
      );
    }, footer);
  };

  build();

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      build();
      ScrollTrigger.refresh();
    }, 200);
  });
}

function logoHover() {
  const svg = document.querySelector(".logo-reveal_svg");
  const paths = svg.querySelectorAll('path[fill^="url(#logo-gradient-"]');

  const parent = svg.parentElement;
  parent.style.position = "relative";

  paths.forEach((path) => {
    const rect = path.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    const left = rect.left - svgRect.left;
    const top = rect.top - svgRect.top;

    const overlay = document.createElement("div");
    overlay.classList.add("logo-reveal_bounding");
    overlay.style.position = "absolute";
    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.zIndex = 2;
    overlay.style.pointerEvents = "auto";
    overlay.style.background = "transparent";

    overlay._targetPath = path;

    parent.appendChild(overlay);

    overlay.addEventListener("mouseenter", () => {
      paths.forEach((otherPath) => {
        if (otherPath !== overlay._targetPath) {
          gsap.to(otherPath, {
            opacity: 0.5,
            duration: durationSlow,
            ease: easeBase,
          });
        }
      });
    });

    overlay.addEventListener("mouseleave", () => {
      gsap.to(paths, {
        opacity: 1,
        duration: durationSlow,
        ease: easeBase,
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  footerReveal();

  if (window.matchMedia("(min-width: 992px)").matches) {
    logoHover();
  }
});