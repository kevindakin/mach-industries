function heroVideo() {
    function initHeroWistia() {
      const hero = document.querySelector(".wistia_video-embed[data-wistia]");
      if (!hero) return;
  
      const videoId = hero.getAttribute("data-wistia");
      if (!videoId || hero.dataset.loaded === "true") return;
  
      hero.dataset.loaded = "true";
  
      // Remove the placeholder image
      const placeholder = hero.querySelector(".wistia_placeholder");
      if (placeholder) {
        placeholder.remove();
      }
  
      // Inject the Wistia player
      const embed = document.createElement("div");
      embed.className = `wistia_embed wistia_async_${videoId}`;
      embed.style.width = "100%";
      embed.style.height = "100%";
      embed.style.position = "relative";
  
      hero.appendChild(embed);
  
      window._wq = window._wq || [];
      _wq.push({
        id: videoId,
        options: {
          videoFoam: false,
          fitStrategy: "cover",
          roundedPlayer: 0,
          autoPlay: true,
          muted: true,
          endVideoBehavior: "loop",
          controlsVisibleOnLoad: false,
          playbar: false,
          fullscreenButton: false,
          volumeControl: false,
          playbackRateControl: false,
        },
      });
    }
  
    // Wait until page is interactive, then load Wistia script
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", deferWistiaInit);
    } else {
      deferWistiaInit();
    }
  
    function deferWistiaInit() {
      const lazy = () => loadWistiaScript(initHeroWistia);
  
      if ("requestIdleCallback" in window) {
        requestIdleCallback(lazy);
      } else {
        setTimeout(lazy, 200);
      }
    }
  }
  
  function scrollArrow() {
    const arrow = document.querySelector(".scroll_wrap");
  
    if (!arrow) return;
  
    gsap.to(arrow, {
      y: "-0.75rem",
      duration: 1.2,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
    });
  }
  
  heroVideo();
  scrollArrow();  