function thesisReveal() {
    const headings = document.querySelectorAll('[data-scroll="text-reveal"]');
  
    if (!headings.length) return;
  
    const isDesktop = window.matchMedia("(min-width: 992px)").matches;
    const offset = isDesktop ? 500 : 200;
  
    headings.forEach((heading) => {
      const split = new SplitType(heading, {
        types: "words, chars",
        tagName: "span",
      });
  
      const chars = heading.querySelectorAll(".char");
  
      gsap.set(chars, { opacity: 0.1 });
  
      gsap.to(chars, {
        opacity: 1,
        stagger: 0.01,
        ease: easeBase,
        duration: durationSlow,
        scrollTrigger: {
          trigger: heading,
          start: `top+=${offset} bottom`,
          end: `bottom+=${offset} bottom`,
          toggleActions: "play none none reverse",
          scrub: 1,
        },
      });
    });
  }
  
  thesisReveal();  