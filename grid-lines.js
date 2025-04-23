function gridLines() {
    const sections = document.querySelectorAll(".grid_wrap");
  
    sections.forEach((section) => {
      const horizontals = section.querySelectorAll(".grid_border-horizontal");
      const verticals = section.querySelectorAll(".grid_border-vertical");
      const accents = section.querySelectorAll(".grid_accent");
  
      gsap.set(horizontals, { width: "0%" });
      gsap.set(verticals, { opacity: 0 });
      gsap.set(accents, { opacity: 0 });
  
      let tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
        defaults: {
          duration: 2,
          ease: "power4.inOut",
        },
      });
  
      tl.to(horizontals, {
        width: "100%",
        stagger: 0.1,
      })
        .to(
          verticals,
          {
            opacity: 1,
            stagger: 0.05,
          },
          "<"
        )
        .to(
          accents,
          {
            opacity: 1,
          },
          "<"
        );
    });
  }
  
  gridLines();  