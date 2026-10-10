function visualVideo() {
    const options = {
      videoFoam: false,
      fitStrategy: "cover",
      roundedPlayer: 0,
      autoPlay: true,
      muted: true,
      endVideoBehavior: "loop",
      controlsVisibleOnLoad: false,
      playbar: false,
      playButton: false,
      fullscreenButton: false,
      volumeControl: false,
      playbackRateControl: false,
      doNotTrack: true,
    };
  
    function mountVideo(el) {
      if (el.dataset.loaded === "true") return;
  
      const videoId = el.getAttribute("data-wistia");
      if (!videoId) return;
  
      el.dataset.loaded = "true";
  
      const embed = document.createElement("div");
      embed.className = `wistia_embed wistia_async_${videoId}`;
      embed.style.width = "100%";
      embed.style.height = "100%";
      embed.style.position = "relative";
  
      el.appendChild(embed);
  
      window._wq = window._wq || [];
      window._wq.push({
        id: videoId,
        options,
        onReady(video) {
          // Components can share a media ID, so onReady fires for every
          // matching embed. Only claim the one in this container.
          if (video.container !== embed && !embed.contains(video.container)) return;
  
          el.closest(".visual_main_frame")?.classList.add("is-loaded");
        },
      });
    }
  
    function init() {
      const els = [
        ...document.querySelectorAll(".visual_main_embed[data-wistia]"),
      ].filter((el) => !el.dataset.scriptInitialized);
  
      if (!els.length) return;
  
      els.forEach((el) => (el.dataset.scriptInitialized = "true"));
  
      loadWistiaScript(() => {
        const observer = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              mountVideo(entry.target);
              obs.unobserve(entry.target);
            });
          },
          { rootMargin: "500px 0px" }
        );
  
        els.forEach((el) => observer.observe(el));
      });
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
  
  visualVideo();