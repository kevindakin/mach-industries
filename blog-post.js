function footnotes() {
  const mainText = document.querySelector('[data-footnote="main"]');
  const footnotesContainer = document.querySelector('[data-footnote="text"]');
  const tooltip = document.querySelector('[data-footnote="tooltip"]');

  if (!mainText || !footnotesContainer || !tooltip) return;

  document.body.appendChild(tooltip);

  const footnoteLinks = mainText.querySelectorAll("a:has(sup)");
  const footnoteItems = footnotesContainer.querySelectorAll("ol li");
  const isDesktop = window.matchMedia("(min-width: 992px)").matches;

  // Generate IDs and update links
  footnoteLinks.forEach((link, index) => {
    const footnoteId = `footnote-${index + 1}`;

    if (footnoteItems[index]) {
      footnoteItems[index].id = footnoteId;
    }

    link.href = `#${footnoteId}`;

    // Tooltip functionality
    if (isDesktop) {
      let hoverTimeout;
      let hideTimeout;

      link.addEventListener("mouseenter", (e) => {
        clearTimeout(hideTimeout);

        hoverTimeout = setTimeout(() => {
          if (footnoteItems[index]) {
            const footnoteText = footnoteItems[index].textContent;
            tooltip.textContent = footnoteText;

            tooltip.style.display = "block";
            tooltip.style.opacity = "0";
            tooltip.style.visibility = "hidden";

            const linkRect = link.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            const fontSize = parseFloat(getComputedStyle(link).fontSize);
            let top = linkRect.top - tooltipRect.height - fontSize * 0.5;
            let left =
              linkRect.left + linkRect.width / 2 - tooltipRect.width / 2;

            // Collision detection
            if (top < 20) {
              top = linkRect.bottom + fontSize * 0.5;
            }

            if (left < 10) {
              left = 10;
            } else if (left + tooltipRect.width > window.innerWidth - 10) {
              left = window.innerWidth - tooltipRect.width - 10;
            }

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
            tooltip.style.visibility = "visible";

            gsap.to(tooltip, {
              opacity: 1,
              duration: 0.2,
              ease: "power2.out",
            });
          }
        }, 400);
      });

      link.addEventListener("mouseleave", () => {
        clearTimeout(hoverTimeout);

        hideTimeout = setTimeout(() => {
          gsap.to(tooltip, {
            opacity: 0,
            duration: 0.2,
            ease: "power2.out",
            onComplete: () => {
              tooltip.style.display = "none";
            },
          });
        }, 300);
      });
    }
  });
}

function socialShare() {
  const linkShareButtons = document.querySelectorAll('[data-share="link"]');

  const handleLinkCopy = async (button) => {
    const currentUrl = window.location.href;
    const copyIcon = button.querySelector('[data-share="copy"]');
    const copiedIcon = button.querySelector('[data-share="copied"]');
    const tooltip = button.querySelector('[data-share="tooltip"]');

    try {
      await navigator.clipboard.writeText(currentUrl);

      if (copyIcon && copiedIcon) {
        copiedIcon.style.display = "block";
        setTimeout(() => {
          copiedIcon.classList.add("is-open");
        }, 10);
      }

      if (tooltip) {
        tooltip.style.display = "block";
        setTimeout(() => {
          tooltip.classList.add("is-open");
        }, 10);
      }

      setTimeout(() => {
        if (copyIcon && copiedIcon) {
          copiedIcon.classList.remove("is-open");
          tooltip.classList.remove("is-open");

          setTimeout(() => {
            copiedIcon.style.display = "none";
            tooltip.style.display = "none";
          }, 300);
        }
      }, 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  linkShareButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      handleLinkCopy(button);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  footnotes();
  socialShare();
});