const API_URL = "https://mach-greenhouse-jobs.misty-meadow-faf8.workers.dev";

const TEAM_SELECT_SEL = '[data-filter="team-select"]';
const TEAM_SUBHEAD_SEL = '[data-roles="team"]';
const TEAM_WRAPPER_SEL = ".form_field-block";

// Greenhouse source-tracking params. Captured on landing, re-appended to
// every apply link so attribution survives navigation between pages.
const TRACKED_PARAMS = ["gh_src", "ccuid"];

let allJobs = [];
let listTemplate;

// Stash tracking params from the current URL. Runs before render so the
// values are available when apply links are built.
function captureTrackingParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    TRACKED_PARAMS.forEach((key) => {
      const value = params.get(key);
      if (value) sessionStorage.setItem(key, value);
    });
  } catch (err) {
    // Private browsing / storage disabled — tracking degrades, page works.
    console.warn("[Jobs] Could not persist tracking params:", err);
  }
}

// Re-attach stored tracking params to a Greenhouse apply URL.
function withTracking(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    TRACKED_PARAMS.forEach((key) => {
      const value = sessionStorage.getItem(key);
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function roleCardHover() {
  const cards = document.querySelectorAll(".role-card_wrap");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.classList.add("is-hovered");
      cards.forEach((otherCard) => {
        if (otherCard !== card) {
          otherCard.classList.add("is-dimmed");
        }
      });
    });
    card.addEventListener("mouseleave", () => {
      card.classList.remove("is-hovered");
      cards.forEach((otherCard) => {
        otherCard.classList.remove("is-dimmed");
      });
    });
  });
}

function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function populateSelect(el, options, label) {
  const select = document.querySelector(el);
  if (!select) return;
  select.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = label;
  select.appendChild(allOption);

  options.sort().forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}

function parseLocations(rawLocations) {
  return rawLocations
    .flatMap((loc) => loc.split("|"))
    .map((loc) => loc.trim())
    .filter(Boolean);
}

// Return the distinct, non-empty team names for jobs in a given department.
function teamsForDepartment(department) {
  const set = new Set();
  allJobs.forEach((job) => {
    if (job.department === department && job.team) set.add(job.team);
  });
  return Array.from(set);
}

// Show/hide + (re)populate the team dropdown based on the selected
// department. The dropdown only appears once a specific department is
// chosen, and lists only that department's teams (the dependent behavior
// the client asked for). Hidden + cleared when no department is selected.
function syncTeamSelect(selectedDeptValue) {
  const teamSelect = document.querySelector(TEAM_SELECT_SEL);
  if (!teamSelect) {
    console.warn(`[Jobs] Team select ${TEAM_SELECT_SEL} not found.`);
    return;
  }

  // The wrapper (.form_field-block) is what CSS hides via :has(). Show/hide
  // that, not the select. Clearing inline display lets the CSS rule hide it;
  // setting "flex" overrides the CSS to show it.
  const wrapper = teamSelect.closest(TEAM_WRAPPER_SEL);

  const hide = () => {
    teamSelect.value = "";
    if (wrapper) wrapper.style.display = "";
  };

  if (!selectedDeptValue) {
    hide();
    return;
  }

  const teams = teamsForDepartment(selectedDeptValue);
  if (teams.length === 0) {
    hide();
    return;
  }

  populateSelect(TEAM_SELECT_SEL, teams, "All Teams");
  if (wrapper) wrapper.style.display = "flex";
}

function applyFilters() {
  const normalize = (str) => (str || "").trim().toLowerCase();

  const searchInput = document.querySelector('[data-filter="search-input"]');
  const deptSelect = document.querySelector(
    '[data-filter="department-select"]'
  );
  const locSelect = document.querySelector('[data-filter="location-select"]');
  const teamSelect = document.querySelector(TEAM_SELECT_SEL);
  const resetEl = document.querySelector('[data-filter="reset"]');

  const searchTerm = normalize(searchInput?.value);
  const selectedDept = normalize(deptSelect?.value);
  const selectedLoc = normalize(locSelect?.value);
  // Team only applies when a department is selected (the dropdown is
  // hidden otherwise). If hidden/empty, selectedTeam is "" and ignored.
  const selectedTeam = normalize(teamSelect?.value);

  const filtered = allJobs.filter((job) => {
    const jobTitle = normalize(job.title);
    const jobDept = normalize(job.department);
    const jobTeam = normalize(job.team);
    const jobLocs = job.locations.map(normalize);

    const matchesSearch = !searchTerm || jobTitle.includes(searchTerm);
    const matchesDept = !selectedDept || jobDept === selectedDept;
    const matchesLoc = !selectedLoc || jobLocs.includes(selectedLoc);
    const matchesTeam = !selectedTeam || jobTeam === selectedTeam;

    return matchesSearch && matchesDept && matchesLoc && matchesTeam;
  });

  // Show reset button if any filters are active
  const hasActiveFilters =
    searchTerm || selectedDept || selectedLoc || selectedTeam;
  if (resetEl) {
    resetEl.classList.toggle("is-visible", hasActiveFilters);
  }

  renderJobs(filtered);
}

function renderJobs(jobs) {
  const mainWrap = document.querySelector('[data-roles="wrap"]');
  if (!mainWrap || !listTemplate) return;

  mainWrap.innerHTML = "";

  const jobsByDept = jobs.reduce((acc, job) => {
    const dept = job.department || "Uncategorized";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(job);
    return acc;
  }, {});

  const sortedDepts = Object.keys(jobsByDept).sort();

  sortedDepts.forEach((department) => {
    const deptJobs = jobsByDept[department];

    const listClone = listTemplate.cloneNode(true);
    const deptTitle = listClone.querySelector('[data-roles="department"]');
    const cardRef = listClone.querySelector('[data-roles="card"]');
    const teamRef = listClone.querySelector(TEAM_SUBHEAD_SEL);
    const layout = listClone.querySelector('[data-roles="layout"]');

    if (deptTitle) deptTitle.textContent = department;
    // Pull the reference nodes out of the template before we clone them.
    if (cardRef) cardRef.remove();
    if (teamRef) teamRef.remove();
    if (!layout) return;

    // Group this department's jobs by team. Teamless jobs go under "".
    const jobsByTeam = deptJobs.reduce((acc, job) => {
      const team = job.team || "";
      if (!acc[team]) acc[team] = [];
      acc[team].push(job);
      return acc;
    }, {});

    // Render teamless jobs first (no subhead), then named teams A–Z.
    const teamKeys = Object.keys(jobsByTeam).sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return a.localeCompare(b);
    });

    const renderCard = (job) => {
      const cardClone = cardRef.cloneNode(true);

      const setData = (role, text) => {
        const el = cardClone.querySelector(`[data-roles="${role}"]`);
        if (el) el.textContent = text || "";
      };

      const setLink = (url, title) => {
        const el = cardClone.querySelector('[data-roles="link"]');
        if (el) {
          el.href = withTracking(url);
          el.setAttribute("aria-label", `View ${title}`);
        }
      };

      const locationsText = job.locations.join(" | ");
      const employmentTypeFormatted = job.employmentType
        ? job.employmentType.replace(/([a-z])([A-Z])/g, "$1 $2")
        : "";
      const totalComp = job?.compensation || "";

      setData("title", job.title);
      setData("location", locationsText);
      setData("employment", employmentTypeFormatted);
      setData("total-compensation", totalComp);
      setLink(job.jobUrl, job.title);

      // Greenhouse exposes no employment type. Hide the "•" separator so
      // the info row doesn't end in a dangling bullet.
      const divider = cardClone.querySelector('[data-roles="divider"]');
      if (divider) {
        divider.style.display = employmentTypeFormatted ? "" : "none";
      }

      cardClone.setAttribute("data-filter", "card");
      cardClone.setAttribute(
        "data-filter-department",
        job.department || "Uncategorized"
      );
      cardClone.setAttribute("data-filter-team", job.team || "");
      cardClone.setAttribute("data-filter-location", job.locations.join(","));

      layout.appendChild(cardClone);
    };

    teamKeys.forEach((team) => {
      // Insert a team subhead before the team's cards (skip for teamless).
      if (team && teamRef) {
        const teamClone = teamRef.cloneNode(true);
        teamClone.textContent = team;
        layout.appendChild(teamClone);
      }

      jobsByTeam[team]
        .sort((a, b) => a.title.localeCompare(b.title))
        .forEach(renderCard);
    });

    mainWrap.appendChild(listClone);
  });

  const emptyState = document.querySelector('[data-filter="empty"]');
  if (emptyState) {
    emptyState.classList.toggle("is-visible", jobs.length === 0);
  }

  if (typeof fadeUp === "function") fadeUp();
  if (window.ScrollTrigger) ScrollTrigger.refresh();
  if (window.matchMedia("(min-width: 992px)").matches) {
    roleCardHover();
  }
}

function showErrorState() {
  const emptyState = document.querySelector('[data-filter="empty"]');
  if (emptyState) emptyState.classList.add("is-visible");
}

// Lightweight skeleton shown while jobs load, so the page doesn't look
// empty/broken during the fetch. Inline styles keep it independent of
// the Webflow classes. renderJobs() clears it via mainWrap.innerHTML = "".
function showLoadingState(mainWrap, count = 6) {
  const skeletons = Array.from({ length: count })
    .map(
      () => `
      <div style="height:64px;border-radius:8px;margin-bottom:12px;
        background:linear-gradient(90deg,
          rgba(255,255,255,0.04) 25%,
          rgba(255,255,255,0.09) 37%,
          rgba(255,255,255,0.04) 63%);
        background-size:400% 100%;
        animation:jobsShimmer 1.4s ease infinite;"></div>`
    )
    .join("");

  mainWrap.innerHTML = `
    <style>
      @keyframes jobsShimmer {
        0% { background-position: 100% 50%; }
        100% { background-position: 0 50%; }
      }
    </style>
    ${skeletons}`;
}

function openRoles() {
  const mainWrap = document.querySelector('[data-roles="wrap"]');
  const rawTemplate = mainWrap?.querySelector('[data-roles="list"]');

  // If the markup hooks are missing, nothing can render — surface it
  // instead of failing silently (common after a Webflow class rename).
  if (!mainWrap) {
    console.error('[Jobs] Missing [data-roles="wrap"] container.');
    return;
  }
  if (!rawTemplate) {
    console.error('[Jobs] Missing [data-roles="list"] template inside wrap.');
    return;
  }

  listTemplate = rawTemplate.cloneNode(true);
  rawTemplate.remove();

  // Show skeleton immediately, before the network request starts.
  showLoadingState(mainWrap);

  fetch(API_URL)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Jobs API returned ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      // The Worker only emits published posts, so isListed is always true.
      // Kept as a defensive filter in case the shape changes upstream.
      const jobs = (data.jobs || []).filter((job) => job.isListed !== false);

      // Remove this line once you've confirmed it's working in prod
      console.info(`[Jobs] Loaded ${jobs.length} listed jobs.`);

      const departmentsSet = new Set();
      const locationsSet = new Set();

      allJobs = jobs.map((job) => {
        const rawLocations = [
          ...(job.location ? [job.location] : []),
          ...(job.secondaryLocations?.map((loc) => loc.location) || []),
        ];
        const locationsArr = parseLocations(rawLocations);

        locationsArr.forEach((loc) => locationsSet.add(loc));
        departmentsSet.add(job.department || "Uncategorized");

        return {
          title: job.title,
          department: job.department || "Uncategorized",
          team: job.team || "",
          locations: locationsArr,
          employmentType: job.employmentType || "",
          compensation: job?.compensation || "",
          jobUrl: job.jobUrl,
        };
      });

      populateSelect(
        '[data-filter="department-select"]',
        Array.from(departmentsSet),
        "All Departments"
      );
      populateSelect(
        '[data-filter="location-select"]',
        Array.from(locationsSet),
        "All Locations"
      );

      renderJobs(allJobs);

      // Team dropdown starts hidden until a department is chosen.
      syncTeamSelect("");

      const debouncedFilter = debounce(applyFilters, 200);
      document
        .querySelector('[data-filter="search-input"]')
        ?.addEventListener("input", debouncedFilter);

      // Department change: repopulate + show/hide the team dropdown for
      // the chosen department, then re-filter.
      document
        .querySelector('[data-filter="department-select"]')
        ?.addEventListener("change", (e) => {
          syncTeamSelect(e.target.value);
          applyFilters();
        });

      document
        .querySelector('[data-filter="location-select"]')
        ?.addEventListener("change", applyFilters);
      document
        .querySelector(TEAM_SELECT_SEL)
        ?.addEventListener("change", applyFilters);

      // Reset button click handler
      const resetBtn = document.querySelector('[data-filter="reset"]');
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          const search = document.querySelector('[data-filter="search-input"]');
          const dept = document.querySelector(
            '[data-filter="department-select"]'
          );
          const loc = document.querySelector('[data-filter="location-select"]');
          if (search) search.value = "";
          if (dept) dept.value = "";
          if (loc) loc.value = "";
          // Clear + hide the team dropdown (no department selected now).
          syncTeamSelect("");
          resetBtn.classList.remove("is-visible");
          renderJobs(allJobs);
        });
      }

      // Prevent the Webflow filter form from submitting/reloading
      const filterForm = document.querySelector('[data-filter="form"]');
      if (filterForm) {
        filterForm.addEventListener("submit", (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
        });
      }
    })
    .catch((err) => {
      console.error("[Jobs] Failed to load jobs:", err);
      showErrorState();
    });
}

document.addEventListener("DOMContentLoaded", () => {
  captureTrackingParams();
  openRoles();
});