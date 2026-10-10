const WISTIA_OPTIONS = {
  videoFoam: false,
  fitStrategy: "cover",
  roundedPlayer: 0,
  autoPlay: false, // playback is controlled in syncPlayback()
  muted: true,
  endVideoBehavior: "loop",
  controlsVisibleOnLoad: false,
  playbar: false,
  playButton: false,
  bigPlayButton: false,
  playPauseNotifier: false,
  doNotTrack: true,
  seo: false
};

const FADE_DURATION = 0.8; // match durationSlow in global.js
const FADE_EASE = "power2.out"; // match easeBase in global.js

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const canHover = window.matchMedia("(hover: hover)").matches;

const players = new WeakMap(); // el -> Wistia player
const thumbs = new WeakMap(); // tab el -> thumbnail img
const hovered = new WeakSet();
let embedCount = 0;

function numberTabs() {
  document
    .querySelectorAll('[data-tabs="list"] .tab_product_number')
    .forEach((number, i) => {
      number.textContent = String(i + 1).padStart(2, "0");
    });
}

// Wistia can't return a player to its pre-play state, so overlay the
// thumbnail ourselves and fade it whenever playback stops.
function addThumb(el, video) {
  const media = video.data?.media;
  const src =
    media?.embedOptions?.stillUrl ||
    media?.assets
      ?.find((a) => a.type === "still_image")
      ?.url?.replace(/\.bin$/, ".jpg");
  if (!src) return;

  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.decoding = "async";
  img.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:1;transition:opacity 300ms ease;";

  el.appendChild(img);
  thumbs.set(el, img);
}

function showThumb(el, show) {
  const img = thumbs.get(el);
  if (img) img.style.opacity = show ? "1" : "0";
}

function syncPlayback(el, video) {
  const panel = el.closest('[data-tabs="panel"]');

  if (panel) {
    panel.classList.contains("is-active") ? video.play() : video.pause();
    return;
  }

  // Tab thumbnails only play while hovered, so they stay static on touch.
  if (hovered.has(el)) {
    video.time(0);
    video.play();
  } else {
    video.pause();
  }
}

function mountVideo(el) {
  if (!el || el.dataset.loaded === "true") return;

  const videoId = el.getAttribute("data-wistia");
  if (!videoId) return;

  el.dataset.loaded = "true";

  const embed = document.createElement("div");
  // Unique container id so options and onReady only touch this embed,
  // even when tabs and panels share a media ID.
  embed.id = `wistia-tab-${++embedCount}`;
  embed.className = `wistia_embed wistia_async_${videoId}`;
  embed.style.width = "100%";
  embed.style.height = "100%";
  embed.style.position = "relative";

  window._wq = window._wq || [];
  window._wq.push({
    id: embed.id,
    options: WISTIA_OPTIONS,
    onReady(video) {
      players.set(el, video);

      if (el.closest('[data-tabs="panel"]')) {
        // Panels reveal on first frame so the paused UI is never visible.
        video.bind("play", () => {
          el.classList.add("is-loaded");
          return video.unbind;
        });
      } else {
        addThumb(el, video);
        el.classList.add("is-loaded");
        video.bind("play", () => showThumb(el, false));
      }

      syncPlayback(el, video);
    },
  });

  el.appendChild(embed);
}

function eachPanelVideo(panel, fn) {
  if (!panel) return;
  panel.querySelectorAll(".panel_product_video[data-wistia]").forEach(fn);
}

function mountPanelVideos(panel) {
  eachPanelVideo(panel, (el) => mountVideo(el));
}

function playPanelVideos(panel) {
  eachPanelVideo(panel, (el) => players.get(el)?.play());
}

function pausePanelVideos(panel) {
  eachPanelVideo(panel, (el) => players.get(el)?.pause());
}

function tabHover() {
  if (!canHover) return;

  document.querySelectorAll(".tab_product_wrap").forEach((wrap) => {
    const el = wrap.querySelector(".tab_product_video[data-wistia]");
    if (!el) return;

    wrap.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      hovered.add(el);

      const video = players.get(el);
      if (!video) return;
      video.time(0);
      video.play();
    });

    wrap.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      hovered.delete(el);

      players.get(el)?.pause();
      showThumb(el, true);
    });
  });
}

function fadeInPanel(panel) {
  if (!panel) return;

  gsap.killTweensOf(panel);

  if (prefersReducedMotion) {
    gsap.set(panel, { opacity: 1, filter: "none", y: 0 });
    return;
  }

  gsap.fromTo(
    panel,
    { opacity: 0, filter: "blur(6px)", y: "4rem" },
    {
      opacity: 1,
      filter: "blur(0px)",
      y: "0rem",
      duration: FADE_DURATION,
      ease: FADE_EASE,
      // Blur is expensive over a playing video, so drop the filter
      // entirely once it lands rather than leaving blur(0px) painting.
      onComplete: () => gsap.set(panel, { clearProps: "filter,transform" }),
    }
  );
}

function scrollToContent() {
  const target = document.querySelector("#content");
  if (!target) return;

  const nav = document.querySelector(".nav_component");
  const offset = nav ? nav.offsetHeight : 0;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;

  // Native smooth scroll fights Lenis if it's running, so defer to it.
  if (window.lenis) {
    window.lenis.scrollTo(top, { immediate: prefersReducedMotion });
    return;
  }

  window.scrollTo({
    top,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

function productTabs() {
  const list = document.querySelector('[data-tabs="list"]');
  const panelWrap = document.querySelector('[data-tabs="panels"]');
  if (!list || !panelWrap) return;

  const links = [...list.querySelectorAll('[data-tabs="link"]')];
  const panels = [...panelWrap.querySelectorAll('[data-tabs="panel"]')];
  if (!links.length || !panels.length) return;

  const panelBySlug = new Map(panels.map((p) => [p.dataset.tab, p]));
  let activeSlug = null;

  function setActive(slug, { updateHash = true } = {}) {
    const panel = panelBySlug.get(slug);
    if (!panel || slug === activeSlug) return;

    if (activeSlug) pausePanelVideos(panelBySlug.get(activeSlug));

    links.forEach((link) => {
      const on = link.dataset.tab === slug;
      link.classList.toggle("is-active", on);
      link.setAttribute("aria-selected", on ? "true" : "false");
      link.tabIndex = on ? 0 : -1;
    });

    panels.forEach((p) => {
      const on = p.dataset.tab === slug;
      p.classList.toggle("is-active", on);
      if (!on) gsap.killTweensOf(p);
    });

    activeSlug = slug;

    // If the player isn't ready yet, syncPlayback() plays it in onReady.
    mountPanelVideos(panel);
    playPanelVideos(panel);
    fadeInPanel(panel);

    if (updateHash) history.replaceState(null, "", `#${slug}`);
  }

  // Menu links to /products#slug don't reload when already on this page.
  window.addEventListener("hashchange", () => {
    const slug = decodeURIComponent(location.hash.slice(1));
    if (!panelBySlug.has(slug)) return;
    setActive(slug, { updateHash: false });
    scrollToContent();
  });

  // Roles are set here rather than in Webflow, because the Designer
  // forces role="list"/"listitem" onto collection items.
  list.setAttribute("role", "tablist");
  links.forEach((link) => {
    const panel = panelBySlug.get(link.dataset.tab);
    if (!panel) return;

    const id = `panel-${link.dataset.tab}`;
    panel.id = id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `tab-${link.dataset.tab}`);

    link.id = `tab-${link.dataset.tab}`;
    link.setAttribute("role", "tab");
    link.setAttribute("aria-controls", id);
  });

  list.addEventListener("click", (e) => {
    const link = e.target.closest('[data-tabs="link"]');
    if (!link) return;
    e.preventDefault();
    setActive(link.dataset.tab);
    // Outside setActive so re-clicking the active tab still scrolls.
    scrollToContent();
  });

  list.addEventListener("keydown", (e) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;

    const i = links.findIndex((l) => l.dataset.tab === activeSlug);
    if (i === -1) return;
    e.preventDefault();

    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
        ? links.length - 1
        : e.key === "ArrowLeft"
        ? (i - 1 + links.length) % links.length
        : (i + 1) % links.length;

    // No scroll here, so arrow keys don't move the page out from
    // under the tab strip the user is navigating.
    setActive(links[next].dataset.tab);
    links[next].focus();
  });

  const fromHash = decodeURIComponent(location.hash.slice(1));
  const initial = panelBySlug.has(fromHash) ? fromHash : links[0].dataset.tab;
  setActive(initial, { updateHash: false });
}

function productVideos() {
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

    document
      .querySelectorAll(".tab_product_video[data-wistia]")
      .forEach((el) => observer.observe(el));

    tabHover();
    productTabs();
  });
}

numberTabs();
productVideos();