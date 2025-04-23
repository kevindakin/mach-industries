function numberText() {
    const wrap = document.querySelector(".products_list");
    const numbers = wrap.querySelectorAll(".overline_text");
  
    numbers.forEach((number, i) => {
      const index = i + 1;
      number.textContent = index < 10 ? `0${index}` : `${index}`;
    });
  }
  
  function productVideos() {
    loadWistiaScript(() => {
      window._wq = window._wq || [];
  
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
  
            const el = entry.target;
            const videoId = el.getAttribute("data-wistia");
  
            if (!videoId) return;
  
            // Avoid re-processing
            if (el.dataset.loaded === "true") return;
            el.dataset.loaded = "true";
  
            const embed = document.createElement("div");
            embed.className = `wistia_embed wistia_async_${videoId}`;
            embed.style.width = "100%";
            embed.style.height = "100%";
            embed.style.position = "relative";
  
            el.appendChild(embed);
  
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
  
            obs.unobserve(el);
          });
        },
        {
          rootMargin: "500px 0px",
          threshold: 0.1,
        }
      );
  
      document
        .querySelectorAll(".wistia_product-video[data-wistia]")
        .forEach((el) => {
          observer.observe(el);
        });
    });
  }
  
  numberText();
  productVideos();  