let allJobs = [];
let listTemplate;

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

function applyFilters() {
  const normalize = (str) => (str || "").trim().toLowerCase();

  const searchInput = document.querySelector('[data-filter="search-input"]');
  const deptSelect = document.querySelector(
    '[data-filter="department-select"]'
  );
  const locSelect = document.querySelector('[data-filter="location-select"]');
  const resetEl = document.querySelector('[data-filter="reset"]');

  const searchTerm = normalize(searchInput?.value);
  const selectedDept = normalize(deptSelect?.value);
  const selectedLoc = normalize(locSelect?.value);

  const filtered = allJobs.filter((job) => {
    const jobTitle = normalize(job.title);
    const jobDept = normalize(job.department);
    const jobLocs = job.locations.map(normalize);

    const matchesSearch = !searchTerm || jobTitle.includes(searchTerm);
    const matchesDept = !selectedDept || jobDept === selectedDept;
    const matchesLoc = !selectedLoc || jobLocs.includes(selectedLoc);

    return matchesSearch && matchesDept && matchesLoc;
  });

  // Show reset button if any filters are active
  const hasActiveFilters = searchTerm || selectedDept || selectedLoc;
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
    const deptJobs = jobsByDept[department].sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    const listClone = listTemplate.cloneNode(true);
    const deptTitle = listClone.querySelector('[data-roles="department"]');
    const cardRef = listClone.querySelector('[data-roles="card"]');
    const layout = listClone.querySelector('[data-roles="layout"]');

    if (deptTitle) deptTitle.textContent = department;
    if (cardRef) cardRef.remove();
    if (!layout) return;

    deptJobs.forEach((job) => {
      const cardClone = cardRef.cloneNode(true);

      const setData = (role, text) => {
        const el = cardClone.querySelector(`[data-roles="${role}"]`);
        if (el) el.textContent = text || "";
      };

      const setLink = (url) => {
        const el = cardClone.querySelector('[data-roles="link"]');
        if (el) el.href = url;
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
      setLink(job.jobUrl);

      cardClone.setAttribute("data-filter", "card");
      cardClone.setAttribute(
        "data-filter-department",
        job.department || "Uncategorized"
      );
      cardClone.setAttribute("data-filter-location", job.locations.join(","));

      layout.appendChild(cardClone);
    });

    mainWrap.appendChild(listClone);
  });

  const emptyState = document.querySelector('[data-filter="empty"]');
  if (emptyState) {
    emptyState.classList.toggle("is-visible", jobs.length === 0);
  }

  fadeUp();
  if (window.ScrollTrigger) ScrollTrigger.refresh();
  if (window.matchMedia("(min-width: 992px)").matches) {
    roleCardHover();
  }
}

function openRoles() {
  const API_URL =
    "https://api.ashbyhq.com/posting-api/job-board/mach?includeCompensation=true";
  const API_KEY =
    "33248effcd0309d7edf86256bde7256e5bca0c5ef409afa1b89c1830ee6e0ba6";

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };

  const mainWrap = document.querySelector('[data-roles="wrap"]');
  const rawTemplate = mainWrap?.querySelector('[data-roles="list"]');
  if (rawTemplate) {
    listTemplate = rawTemplate.cloneNode(true);
    rawTemplate.remove();
  }

  fetch(API_URL, { headers })
    .then((res) => res.json())
    .then((data) => {
      const jobs = data.jobs || [];
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
          locations: locationsArr,
          employmentType: job.employmentType || "",
          compensation: job?.compensation?.compensationTierSummary || "",
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

      const debouncedFilter = debounce(applyFilters, 200);
      document
        .querySelector('[data-filter="search-input"]')
        ?.addEventListener("input", debouncedFilter);
      document
        .querySelector('[data-filter="department-select"]')
        ?.addEventListener("change", applyFilters);
      document
        .querySelector('[data-filter="location-select"]')
        ?.addEventListener("change", applyFilters);

      // Reset button click handler
      const resetBtn = document.querySelector('[data-filter="reset"]');
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          document.querySelector('[data-filter="search-input"]').value = "";
          document.querySelector('[data-filter="department-select"]').value =
            "";
          document.querySelector('[data-filter="location-select"]').value = "";
          resetBtn.classList.remove("is-visible");
          renderJobs(allJobs);
        });

        // Prevent Webflow filter form from submitting
        const filterForm = document.querySelector('[data-filter="form"]');
        if (filterForm) {
          filterForm.addEventListener("submit", (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
          });
        }
      }
    });
}

openRoles();