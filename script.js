// Register Service Worker with clean error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('SW registration bypassed:', err);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const isDesktop = window.matchMedia("(min-width: 901px)").matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  // 1. DESKTOP MAGNETIC CURSOR (Only runs on mouse devices)
  const cursorDot = document.getElementById("cursor-dot");
  const cursorRing = document.getElementById("cursor-ring");

  if (isDesktop && isFinePointer && cursorDot && cursorRing) {
    window.addEventListener("mousemove", (e) => {
      cursorDot.style.left = `${e.clientX}px`;
      cursorDot.style.top = `${e.clientY}px`;
      setTimeout(() => {
        cursorRing.style.left = `${e.clientX}px`;
        cursorRing.style.top = `${e.clientY}px`;
      }, 35);
    });

    document.querySelectorAll("a, button, .peak-node, .mob-pill, input, select, textarea").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursorRing.style.width = "48px";
        cursorRing.style.height = "48px";
        cursorRing.style.borderColor = "#E9692A";
        cursorRing.style.backgroundColor = "rgba(233, 105, 42, 0.12)";
      });
      el.addEventListener("mouseleave", () => {
        cursorRing.style.width = "32px";
        cursorRing.style.height = "32px";
        cursorRing.style.borderColor = "rgba(233, 105, 42, 0.5)";
        cursorRing.style.backgroundColor = "transparent";
      });
    });
  }

  // 2. REVEAL OBSERVER ENGINE
  const revealElements = () => {
    const revealEls = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      revealEls.forEach(el => el.classList.add("active"));
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px", threshold: 0.08 });
    revealEls.forEach(el => observer.observe(el));
  };

  // 3. PRELOADER SEQUENCE
  const preloader = document.getElementById("preloader");
  const preloaderAlt = document.getElementById("preloader-alt");
  const zoneStatus = document.getElementById("zone-status");
  const routeActive = document.getElementById("route-active");
  const climberSprite = document.getElementById("climber-sprite");
  const summitBeacon = document.getElementById("summit-beacon");
  const loaderBar = document.getElementById("loader-bar");
  const ecgCanvas = document.getElementById("ecg-canvas");

  let alt = 1500;
  const targetAlt = 8849;
  const duration = 1600;
  const interval = 25;
  const step = Math.ceil((targetAlt - 1500) / (duration / interval));

  let ecgTimer = null;
  if (ecgCanvas && ecgCanvas.getContext) {
    const ecgCtx = ecgCanvas.getContext("2d");
    let ecgOffset = 0;
    ecgTimer = setInterval(() => {
      ecgCtx.clearRect(0, 0, ecgCanvas.width, ecgCanvas.height);
      ecgCtx.strokeStyle = "#E9692A";
      ecgCtx.lineWidth = 1.5;
      ecgCtx.beginPath();
      for (let x = 0; x < ecgCanvas.width; x++) {
        let y = 10;
        const phase = (x + ecgOffset) % 60;
        if (phase > 24 && phase < 30) y = 3;
        else if (phase >= 30 && phase < 36) y = 17;
        if (x === 0) ecgCtx.moveTo(x, y);
        else ecgCtx.lineTo(x, y);
      }
      ecgCtx.stroke();
      ecgOffset += 3;
    }, 30);
  }

  const dismissPreloader = () => {
    if (ecgTimer) clearInterval(ecgTimer);
    if (preloader && !preloader.classList.contains("slide-up")) {
      preloader.classList.add("slide-up");
      setTimeout(revealElements, 150);
    } else {
      revealElements();
    }
  };

  // Fail-safe to avoid preloader freezing on mobile devices
  const failSafeTimer = setTimeout(dismissPreloader, 2400);

  const altTimer = setInterval(() => {
    alt += step;
    if (alt >= targetAlt) {
      alt = targetAlt;
      clearInterval(altTimer);
      clearTimeout(failSafeTimer);
      if (zoneStatus) {
        zoneStatus.textContent = "SEVEN SUMMITS READY";
        zoneStatus.style.color = "#10B981";
      }
      if (climberSprite) climberSprite.style.opacity = "0";
      if (summitBeacon) summitBeacon.classList.add("show");
      setTimeout(dismissPreloader, 350);
    }

    const progressRatio = Math.min((alt - 1500) / (targetAlt - 1500), 1);
    if (routeActive) routeActive.style.strokeDashoffset = 600 - (600 * progressRatio);
    if (climberSprite) {
      climberSprite.style.left = `${20 + (240 * progressRatio)}px`;
      climberSprite.style.top = `${170 - (140 * progressRatio)}px`;
    }
    if (preloaderAlt) preloaderAlt.textContent = alt.toLocaleString();
    if (loaderBar) loaderBar.style.width = `${progressRatio * 100}%`;
  }, interval);

  // 4. SCROLL ALTIMETER STRIP
  const hudFill = document.getElementById("hudFill");
  const hudIndicator = document.getElementById("hudIndicator");
  const hudAltNum = document.getElementById("hudAltNum");
  const waypoints = document.querySelectorAll(".hud-waypoint");
  const mobAltNum = document.getElementById("mobAltNum");
  const mobStripFill = document.getElementById("mobStripFill");

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollMax > 0 ? Math.min(Math.max(window.scrollY / scrollMax, 0), 1) : 0;
        const percentage = progress * 100;
        const scrollElevation = Math.floor(1500 + progress * (8849 - 1500));

        if (isDesktop && hudFill && hudIndicator && hudAltNum) {
          hudFill.style.height = `${percentage}%`;
          hudIndicator.style.bottom = `${percentage}%`;
          hudAltNum.textContent = scrollElevation.toLocaleString();

          waypoints.forEach(wp => {
            const bottomPercent = parseFloat(wp.style.bottom);
            const text = wp.querySelector(".wp-text");
            if (text) {
              text.style.opacity = (percentage >= bottomPercent - 2) ? "1" : "0.4";
            }
          });
        }

        if (!isDesktop && mobAltNum && mobStripFill) {
          mobAltNum.textContent = scrollElevation.toLocaleString();
          mobStripFill.style.width = `${percentage}%`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // 5. METRICS OBSERVER
  const metricsBar = document.getElementById("metrics-bar");
  if (metricsBar) {
    let triggered = false;
    const mObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !triggered) {
        triggered = true;
        document.querySelectorAll(".counter").forEach(c => {
          const target = +c.getAttribute("data-target") || 0;
          let count = 0;
          const inc = Math.max(target / 24, 1);
          const update = () => {
            count += inc;
            if (count < target) {
              c.innerText = Math.ceil(count);
              requestAnimationFrame(update);
            } else {
              c.innerText = target;
            }
          };
          update();
        });
      }
    }, { threshold: 0.15 });
    mObserver.observe(metricsBar);
  }

  // 6. SEVEN CONTINENTS DATA ENGINE
  const peakData = {
    elbrus: {
      continent: "Europe // Mt. Elbrus",
      alt: "5,642 M",
      window: "Completed Milestone",
      status: "Verified Continental Summit ✓",
      desc: "Baljeet successfully summitted Mt. Elbrus, marking the initial European milestone in the Seven Continents property arc."
    },
    kilimanjaro: {
      continent: "Africa // Mt. Kilimanjaro",
      alt: "5,895 M",
      window: "Completed Milestone",
      status: "Verified Continental Summit ✓",
      desc: "Africa's highest summit completed. Demonstrated consistent physiological readiness across continental elevations."
    },
    aconcagua: {
      continent: "South America // Mt. Aconcagua",
      alt: "6,961 M",
      window: "Jan–Feb 2027",
      status: "Phase 1: Next Objective",
      desc: "Southern summer window in Argentina. Serves as altitude maintenance, technical acclimatization, and first major activation milestone for Beyond the Summit partners."
    },
    everest: {
      continent: "Asia // Mt. Everest",
      alt: "8,849 M",
      window: "Apr–May 2027",
      status: "Phase 2: Flagship Activation",
      desc: "Tibet/Nepal border. The primary media and brand activation window of the campaign, putting the tricolour on top of the world."
    },
    denali: {
      continent: "North America // Mt. Denali",
      alt: "6,190 M",
      window: "June–July 2027",
      status: "Phase 3: High Arctic Window",
      desc: "Alaska, USA. Arctic summer season featuring intense technical ice, sub-zero winds, and high-endurance sled hauling."
    },
    carstensz: {
      continent: "Oceania // Carstensz Pyramid",
      alt: "4,884 M",
      window: "Nov–Dec 2027",
      status: "Phase 5: Technical Rock Face",
      desc: "Papua, Oceania. Austral summer window requiring remote jungle access, helicopter logistics, and steep rock climbing."
    },
    vinson: {
      continent: "Antarctica // Vinson Massif",
      alt: "4,892 M",
      window: "Jan–Feb 2028",
      status: "Phase 6: Continental Finale",
      desc: "Antarctica austral summer. The culmination of the 24–30 month campaign cycle, completing the Seven Continents property."
    }
  };

  const updatePeakView = (peakKey) => {
    const card = document.getElementById("peakDetailCard");
    const data = peakData[peakKey];
    if (!data) return;

    if (card) card.style.opacity = "0";
    setTimeout(() => {
      const elContinent = document.getElementById("peakContinent");
      const elAlt = document.getElementById("peakAlt");
      const elWindow = document.getElementById("peakWindow");
      const elStatus = document.getElementById("peakStatus");
      const elDesc = document.getElementById("peakDesc");

      if (elContinent) elContinent.textContent = data.continent;
      if (elAlt) elAlt.textContent = data.alt;
      if (elWindow) elWindow.textContent = data.window;
      if (elStatus) elStatus.textContent = data.status;
      if (elDesc) elDesc.textContent = data.desc;

      if (card) card.style.opacity = "1";
    }, 120);
  };

  document.querySelectorAll(".peak-node").forEach(node => {
    node.addEventListener("click", () => {
      document.querySelectorAll(".peak-node").forEach(n => n.classList.remove("active"));
      node.classList.add("active");
      updatePeakView(node.getAttribute("data-peak"));
    });
  });

  document.querySelectorAll(".mob-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".mob-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      updatePeakView(pill.getAttribute("data-peak"));
    });
  });

  // 7. CAROUSEL NAVIGATION
  const igCarousel = document.getElementById("igCarousel");
  const slideLeft = document.getElementById("slideLeft");
  const slideRight = document.getElementById("slideRight");
  if (slideLeft && slideRight && igCarousel) {
    slideLeft.addEventListener("click", () => igCarousel.scrollBy({ left: -280, behavior: 'smooth' }));
    slideRight.addEventListener("click", () => igCarousel.scrollBy({ left: 280, behavior: 'smooth' }));
  }

  // 8. MOBILE DRAWER NAVIGATION
  const mobileToggle = document.getElementById("mobile-toggle");
  const navLinks = document.getElementById("nav-links");
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("active");
      mobileToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    document.querySelectorAll(".nav-links a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        mobileToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        document.body.style.overflow = '';
      });
    });
  }
});