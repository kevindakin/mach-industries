function logoReveal() {
    const wrappers = document.querySelectorAll(".logo-reveal_wrap");
  
    wrappers.forEach((wrapper) => {
      const svg = wrapper.querySelector(".logo-reveal_svg");
      const gradients = svg.querySelectorAll('[id^="logo-gradient-"]');
  
      gsap.set(gradients, {
        attr: {
          x1: "-1000%",
          y1: "-1000%",
          x2: "100%",
          y2: "100%",
        },
      });
  
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: svg,
          start: "top bottom",
          toggleActions: "play none none reverse",
        },
        defaults: {
          duration: durationSlow,
          ease: easeBase,
        },
      });
  
      tl.to(gradients, {
        attr: {
          x1: "0%",
          y1: "0%",
          x2: "100%",
          y2: "100%",
        },
        stagger: 0.4,
      });
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
  
  logoReveal();
  
  if (window.matchMedia("(min-width: 992px)").matches) {
    logoHover();
  }  