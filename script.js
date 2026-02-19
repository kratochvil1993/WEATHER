document.addEventListener("DOMContentLoaded", () => {
  // Register Service Worker for PWA
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
      //.register("./app/weather/sw.js")  
      .register("/sw.js")
        .then((registration) => {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope,
          );
        })
        .catch((err) => {
          console.log("ServiceWorker registration failed: ", err);
        });
    });
  }

  // Inject blobs into .glass containers
  document.querySelectorAll('.glass').forEach(glass => {
    if (!glass.querySelector('.glass-blob')) {
      const blob = document.createElement('div');
      blob.className = 'glass-blob';
      // Randomize animation delay to make them "random"
      blob.style.animationDelay = `${Math.random() * -20}s`;
      blob.style.animationDuration = `${15 + Math.random() * 10}s`;
      glass.appendChild(blob);

      // Mouse Interaction for Blobs
      glass.addEventListener('mousemove', (e) => {
        const rect = glass.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate offset (max ~80px move)
        const moveX = (x / rect.width - 0.5) * 160;
        const moveY = (y / rect.height - 0.5) * 160;

        blob.style.setProperty('--tx', `${moveX}px`);
        blob.style.setProperty('--ty', `${moveY}px`);
        blob.style.setProperty('--hover-s', '1.5');
        blob.style.opacity = '0.5';
      });

      glass.addEventListener('mouseleave', () => {
        blob.style.setProperty('--tx', '0px');
        blob.style.setProperty('--ty', '0px');
        blob.style.setProperty('--hover-s', '1');
        blob.style.opacity = '0.25';
      });
    }
  });

  // Sidebar Magic Indicator
  const sideNav = document.querySelector('.side-panel .nav');
  if (sideNav) {
    const indicator = document.createElement('div');
    indicator.className = 'nav-pill-blob';
    sideNav.appendChild(indicator);

    const updateIndicator = () => {
      const activeLink = sideNav.querySelector('.active-link');
      if (activeLink) {
        indicator.style.top = `${activeLink.offsetTop}px`;
        indicator.style.height = `${activeLink.offsetHeight}px`;
        indicator.style.opacity = '1';
      }
    };

    // Initial position
    setTimeout(updateIndicator, 100);

    // Update on hover for "sliding" effect
    const links = sideNav.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        indicator.style.top = `${link.offsetTop}px`;
        indicator.style.height = `${link.offsetHeight}px`;
        indicator.style.opacity = '1';
      });
    });

    // Return to active on leave
    sideNav.addEventListener('mouseleave', updateIndicator);
  }

  // Base locations configuration
  const baseLocations = {
    plzen: {
      lat: 49.7475,
      lon: 13.3776,
      name: "Plzeň",
    },
    krimice: {
      lat: 49.758,
      lon: 13.317,
      name: "Křimice",
    },
    cheznovice: {
      lat: 49.7789,
      lon: 13.7854,
      name: "Cheznovice",
    },
  };
  renderLocationButtons(); // Initialize location buttons immediately
  const stickyNav = document.querySelector(".sticky-nav");
  if (stickyNav) {
      // Create sentinel element 1px above sticky nav
      const sentinel = document.createElement("div");
      sentinel.className = "sticky-sentinel";
      // Position absolute just above the sticky element's *intended* stuck position
      // Or just place it before the nav in flow.
      // The trick: when sentinel scrolls out of view (top -1px), nav is stuck.
      // But simpler: Sentinel top: -1px relative to sticky container? No.
      
      // Let's use a simpler approach: Just a sentinel <div> inserted *before* the nav.
      // When sentinel rect.bottom < 70 (header height), then nav is stuck.
      
      stickyNav.parentNode.insertBefore(sentinel, stickyNav);
      
      const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
              // If sentinel is NOT intersecting (scrolled past top), adding stuck
              // But sentinel is 0px height, so this is tricky.
              // Let's rely on bounding client rect for robust check
              if (entry.boundingClientRect.top < 70) {
                  stickyNav.classList.add("is-stuck");
                  // Always keep centered as per user request
              } else {
                  stickyNav.classList.remove("is-stuck");
              }
          });
      }, {
          threshold: [0, 1],
          rootMargin: "-71px 0px 0px 0px" // Trigger when element hits header bottom (approx 70px)
      });
      
      observer.observe(sentinel);
  }

  // --- DOM Elements ---
  // DOM Elements
  const tempElement = document.getElementById("temperature");
  const conditionElement = document.getElementById("condition");
  const windElement = document.getElementById("wind-speed");
  const humidityElement = document.getElementById("humidity");
  const iconElement = document.getElementById("weather-icon");
  const dateElement = document.getElementById("last-updated");
  const cityTitleElement = document.querySelector("h1.fw-light");

  const loadingElement = document.getElementById("loading");
  const contentElement = document.getElementById("weather-data");
  const errorElement = document.getElementById("error-message");

  const forecastTabs = document.getElementById("forecast-tabs");
  const forecastContent = document.getElementById("forecast-content");

  const hourlyTabs = document.getElementById("hourly-tabs");
  const hourlyContent = document.getElementById("hourly-content");

  const btnPlzen = document.getElementById("btn-plzen");
  const btnKrimice = document.getElementById("btn-krimice");
  const btnCheznovice = document.getElementById("btn-cheznovice");
  
  const btnPlzenHist = document.getElementById("btn-plzen-hist");
  const btnKrimiceHist = document.getElementById("btn-krimice-hist");
  const btnCheznoviceHist = document.getElementById("btn-cheznovice-hist");

  const btnPlzenAdv = document.getElementById("btn-plzen-adv");
  const btnKrimiceAdv = document.getElementById("btn-krimice-adv");
  const btnCheznoviceAdv = document.getElementById("btn-cheznovice-adv");
  
  const btnPlzenStats = document.getElementById("btn-plzen-stats");
  const btnKrimiceStats = document.getElementById("btn-krimice-stats");
  const btnCheznoviceStats = document.getElementById("btn-cheznovice-stats");

  const sunriseElement = document.getElementById("sunrise");
  const sunsetElement = document.getElementById("sunset");
  const moonPhaseElement = document.getElementById("moon-phase");
  const moonIconElement = document.getElementById("moon-icon");



  /**
   * Načte vlastní uložené lokace z localStorage
   * @returns {Array} Pole objektů vlastních lokací
   */
  function getCustomLocations() {
    const stored = localStorage.getItem("customLocations");
    try {
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse custom locations", e);
      return [];
    }
  }

  /**
   * Uloží vlastní lokaci (přidá na konec)
   * @param {Object} location - Objekt s name, lat, lon
   */
  function addCustomLocation(location) {
    const locations = getCustomLocations();
    // Check for duplicates by name
    if (
      !locations.some(
        (l) => l.name.toLowerCase() === location.name.toLowerCase(),
      ) &&
      !baseLocations[location.name.toLowerCase()] // Check against base locations too (simple check)
    ) {
      locations.push(location);
      localStorage.setItem("customLocations", JSON.stringify(locations));
      renderLocationButtons(); // Re-render buttons
    } else {
      alert("Tato lokace již je uložena.");
    }
  }

  /**
   * Odstraní vlastní lokaci podle indexu
   * @param {number} index - Index v poli customLocations
   */
  function removeCustomLocation(index) {
    if (confirm("Opravdu chcete odebrat tuto lokaci?")) {
      const locations = getCustomLocations();
      locations.splice(index, 1);
      localStorage.setItem("customLocations", JSON.stringify(locations));
      
      // If we deleted the currently active location, switch to Plzeň
      const saved = localStorage.getItem("weatherLocation");
      if (saved && saved.startsWith("custom-") && parseInt(saved.split("-")[1]) === index) {
          saveLocation("plzen");
      }
      
      renderLocationButtons();
    }
  }

  /**
   * Vykreslí všechna tlačítka lokací (základní + vlastní) do všech skupin tlačítek
   */
  function renderLocationButtons() {
    const groups = document.querySelectorAll('.btn-group[aria-label="Location Selection"]');
    const customLocs = getCustomLocations();
    const activeKey = loadStoredLocation();

    groups.forEach((group) => {
      group.innerHTML = ""; // Clear current buttons

      // 1. Render Base Locations
      Object.keys(baseLocations).forEach((key) => {
        const loc = baseLocations[key];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn btn-glass ${activeKey === key ? "active" : ""}`;
        btn.dataset.key = key;
        btn.dataset.lat = loc.lat;
        btn.dataset.lon = loc.lon;
        btn.textContent = loc.name;
        
        btn.addEventListener("click", () => handleLocationClick(key, loc));
        
        group.appendChild(btn);
      });

      // 2. Render Custom Locations
      customLocs.forEach((loc, index) => {
        const key = `custom-${index}`;
        
        // Wrapper for button to position delete trigger nicely if needed, 
        // but for btn-group bootstrap style, appending button directly is best.
        // We will handle delete via contextmenu (right click) for simplicity and elegance.
        
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn btn-glass ${activeKey === key ? "active" : ""}`;
        btn.dataset.key = key;
        btn.dataset.lat = loc.lat;
        btn.dataset.lon = loc.lon;
        btn.dataset.customIndex = index;
        btn.dataset.customIndex = index;
        // Add name and delete badge
        btn.innerHTML = `${loc.name} <span class="ms-2 badge bg-danger rounded-circle p-1 delete-loc" title="Odstranit" style="font-size: 0.6em; vertical-align: middle;"><i class="bi bi-x"></i></span>`;
        
        // Handle click (both select and delete checks)
        btn.addEventListener("click", (e) => {
            // Check if delete badge was clicked
            if (e.target.closest(".delete-loc")) {
                e.stopPropagation();
                removeCustomLocation(index);
                return;
            }
            handleLocationClick(key, loc);
        });

        group.appendChild(btn);
      });
    });
  }

  /**
   * Společná funkce pro kliknutí na tlačítko lokace
   */
  function handleLocationClick(key, loc) {
      saveLocation(key);
      renderLocationButtons(); // Update active state visually immediately
      
      // Determine context and fetch data
      // Determine context and fetch data
      // Determine context and fetch data
      const isAdvanced = document.getElementById("advanced-content");
      const isStats = document.getElementById("stats-content");
      const isHistory = document.getElementById("temperatureChart"); // Teploty page has this chart
      const isTimeMachine = document.getElementById("time-machine-content");
      const isAstro = document.getElementById("astro-content");

      if (isAdvanced) {
          initAdvancedWeatherData(loc.lat, loc.lon, loc.name);
      } else if (isStats) {
          initStatsData(loc.lat, loc.lon, loc.name);
      } else if (isTimeMachine) {
          initTimeMachineData(loc.lat, loc.lon, loc.name);
      } else if (isAstro) {
          initAstroData(loc.lat, loc.lon, loc.name);
      } else if (isHistory) {
          fetchHistoricalData(loc.lat, loc.lon, loc.name);
      } else {
          // Index page
          fetchWeather(loc.lat, loc.lon, `Počasí ${loc.name}`);
      }
      
      // Update UI for My Location button (deactivate it if we clicked something else)
      updateMyLocationButtonState(key === 'geolocation');

      // Deactivate search inputs
      const searchInputs = document.querySelectorAll('.glass-input');
      searchInputs.forEach(input => input.classList.remove('active'));
  }

  /**
   * Uloží vybranou lokaci do localStorage
   * @param {string} key - Klíč lokace (plzen, krimice, cheznovice, geolocation)
   */
  function saveLocation(key) {
    localStorage.setItem("weatherLocation", key);
  }

  /**
   * Načte uloženou lokaci z localStorage
   * @returns {string} Klíč uložené lokace nebo 'plzen'
   */
  function loadStoredLocation() {
    const saved = localStorage.getItem("weatherLocation");
    
    // Check specific keys first
    if (saved === 'geolocation') return 'geolocation';
    
    // Validate if saved key exists in base or custom
    if (baseLocations[saved]) return saved;
    if (saved && saved.startsWith("custom-")) {
        const index = parseInt(saved.split("-")[1]);
        const customs = getCustomLocations();
        if (customs[index]) return saved;
    }
    
    // Check if it's a search result (not in base or custom buttons)
    if (saved === "search-result") return "search-result";

    return "plzen";
  }

  /**
   * Helper to update My Location button visual state
   */
  function updateMyLocationButtonState(isActive) {
      const btn = document.getElementById("current-location-btn");
      if (btn) {
          if (isActive) {
              btn.classList.add("active");
              btn.classList.remove("text-white"); // Remove utility class that might conflict with active style
          } else {
              btn.classList.remove("active");
              btn.classList.add("text-white");
          }
      }
  }

  // WMO Weather Codes mapping to Bootstrap Icons and Czech descriptions
  const weatherCodes = {
    0: { icon: "bi-sun", desc: "Jasno" },
    1: { icon: "bi-sun", desc: "Hlavně jasno" },
    2: { icon: "bi-cloud-sun", desc: "Polojasno" },
    3: { icon: "bi-cloud", desc: "Zataženo" },
    45: { icon: "bi-cloud-fog", desc: "Mlha" },
    48: { icon: "bi-cloud-fog2", desc: "Mrznoucí mlha" },
    51: { icon: "bi-cloud-drizzle", desc: "Slabé mrholení" },
    53: { icon: "bi-cloud-drizzle", desc: "Mrholení" },
    55: { icon: "bi-cloud-drizzle-fill", desc: "Silné mrholení" },
    61: { icon: "bi-cloud-rain", desc: "Slabý déšť" },
    63: { icon: "bi-cloud-rain-fill", desc: "Déšť" },
    65: { icon: "bi-cloud-rain-heavy-fill", desc: "Silný déšť" },
    71: { icon: "bi-cloud-snow", desc: "Slabé sněžení" },
    73: { icon: "bi-cloud-snow", desc: "Sněžení" },
    75: { icon: "bi-cloud-snow-fill", desc: "Silné sněžení" },
    80: { icon: "bi-cloud-rain", desc: "Přeháňky" },
    81: { icon: "bi-cloud-rain-fill", desc: "Silné přeháňky" },
    82: { icon: "bi-cloud-rain-heavy-fill", desc: "Průtrž mračen" },
    95: { icon: "bi-cloud-lightning", desc: "Bouřka" },
    96: { icon: "bi-cloud-lightning-rain", desc: "Bouřka s kroupami" },
    99: {
      icon: "bi-cloud-lightning-rain-fill",
      desc: "Silná bouřka s kroupami",
    },
  };

  // Background Image Mapping
  const weatherBackgrounds = {
    0: "images/sunny.jpg",
    1: "images/sunny.jpg",
    2: "images/partly_cloudy.jpg",
    3: "images/cloudy.jpg",
    45: "images/cloudy.jpg",
    48: "images/cloudy.jpg",
    51: "images/rain.jpg",
    53: "images/rain.jpg",
    55: "images/rain.jpg",
    61: "images/rain.jpg",
    63: "images/rain.jpg",
    65: "images/rain.jpg",
    71: "images/snow.jpg",
    73: "images/snow.jpg",
    75: "images/snow.jpg",
    77: "images/snow.jpg",
    80: "images/rain.jpg",
    81: "images/rain.jpg",
    82: "images/rain.jpg",
    85: "images/snow.jpg",
    86: "images/snow.jpg",
    95: "images/hail.jpg",
    96: "images/hail.jpg",
    99: "images/hail.jpg",
  };

  /**
   * Synchronizuje barevné téma a pozadí podle aktuálního počasí (pro podstránky)
   * @param {number} lat - Zeměpisná šířka
   * @param {number} lon - Zeměpisná délka
   */
  function syncAmbientWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.current) {
          updateTheme(data.current.temperature_2m);
          updateBackground(data.current.weather_code);
        }
      })
      .catch((err) => console.error("Error syncing ambient weather:", err));
  }

  /**
   * Aktualizuje obrázek pozadí podle kódu počasí
   * @param {number} code - WMO kód počasí
   */
  function updateBackground(code) {
    const bgContainer = document.querySelector(".video-background");
    const imagePath = weatherBackgrounds[code] || "images/partly_cloudy.jpg"; // Fallback

    // Preload image to avoid flickering
    const img = new Image();
    img.src = imagePath;
    img.onload = () => {
      bgContainer.style.backgroundImage = `url('${imagePath}')`;
    };
  }

  /**
   * Vrací informace o počasí (ikonu a popis) podle WMO kódu
   * @param {number} code - WMO kód počasí
   * @returns {Object} Objekt s ikonou a popisem počasí
   */
  function getWeatherInfo(code) {
    return (
      weatherCodes[code] || { icon: "bi-question-circle", desc: "Neznámé" }
    );
  }

  /**
   * Aktualizuje aktuální údaje o počasí na stránce
   * @param {Object} current - Aktuální data počasí z API
   * @param {Object} daily - Denní data počasí z API
   */
  function updateCurrentWeather(current, daily) {
    // Update values
    tempElement.textContent = Math.round(current.temperature_2m);
    windElement.textContent = Math.round(current.wind_speed_10m);
    humidityElement.textContent = current.relative_humidity_2m;

    // Astronomy data
    if (daily && daily.sunrise && daily.sunset) {
      const sunriseDate = new Date(daily.sunrise[0]);
      const sunsetDate = new Date(daily.sunset[0]);
      sunriseElement.textContent = sunriseDate.toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
      });
      sunsetElement.textContent = sunsetDate.toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const moonInfo = getMoonPhase();
      moonPhaseElement.textContent = moonInfo.name;
      moonIconElement.className = `bi ${moonInfo.icon} fs-4 mb-1`;
    }

    // Update Date
    const now = new Date();
    dateElement.textContent = now.toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Update Icon and Description
    const weatherInfo = getWeatherInfo(current.weather_code);

    iconElement.className = `bi ${weatherInfo.icon} display-1 mb-3`;
    conditionElement.textContent = weatherInfo.desc;

    // Update Background
    updateBackground(current.weather_code);
    
    // Update Theme based on temperature
    updateTheme(current.temperature_2m);
  }

  /**
   * Dynamicky mění barevné téma aplikace podle teploty
   * @param {number} temperature - Teplota v °C
   */
  function updateTheme(temperature) {
    let theme = {};

    if (temperature < 0) {
      // Mráz: Ledově modrá
      theme = {
        start: "#2c3e50",
        end: "#4ca1af",
        shadow: "rgba(76, 161, 175, 0.4)",
        hover: "rgba(76, 161, 175, 0.2)",
        active: "rgba(76, 161, 175, 0.3)",
        accent: "#a8e6cf", // Ice Mint
        glow: "rgba(168, 230, 207, 0.6)",
        blob1: "#a8e6cf",
        blob2: "#2c3e50"
      };
    } else if (temperature < 10) {
      // Chladno: Standardní modrá (Default)
      theme = {
        start: "#1e3c72",
        end: "#2a5298",
        shadow: "rgba(31, 38, 135, 0.37)",
        hover: "rgba(255, 255, 255, 0.2)",
        active: "rgba(255, 255, 255, 0.3)",
        accent: "#ffffff",
        glow: "rgba(255, 255, 255, 0.2)",
        blob1: "#00E582",
        blob2: "#2a5298"
      };
    } else if (temperature < 20) {
        // Jaro: Svěží zelená
        theme = {
          start: "#134E5E",
          end: "#71B280",
          shadow: "rgba(19, 78, 94, 0.4)",
          hover: "rgba(113, 178, 128, 0.2)",
          active: "rgba(113, 178, 128, 0.3)",
          accent: "#d4fc79", // Light Lime
          glow: "rgba(212, 252, 121, 0.5)",
          blob1: "#d4fc79",
          blob2: "#134E5E"
        };
    } else if (temperature < 30) {
      // Teplo: Slunečná oranžová
      theme = {
        start: "#F2994A",
        end: "#F2C94C",
        shadow: "rgba(242, 153, 74, 0.4)",
        hover: "rgba(242, 201, 76, 0.2)",
        active: "rgba(242, 201, 76, 0.3)",
        accent: "#ffe259", // Sun Yellow
        glow: "rgba(255, 226, 89, 0.6)",
        blob1: "#ffe259",
        blob2: "#F2994A"
      };
    } else {
      // Horko: Sytá červená
      theme = {
        start: "#FF416C",
        end: "#FF4B2B",
        shadow: "rgba(255, 65, 108, 0.4)",
        hover: "rgba(255, 75, 43, 0.2)",
        active: "rgba(255, 75, 43, 0.3)",
        accent: "#ff9966", // Hot Orange
        glow: "rgba(255, 153, 102, 0.7)",
        blob1: "#ff9966",
        blob2: "#FF416C"
      };
    }

    const root = document.documentElement;
    root.style.setProperty('--bg-gradient-start', theme.start);
    root.style.setProperty('--bg-gradient-end', theme.end);
    root.style.setProperty('--glass-shadow', theme.shadow);
    root.style.setProperty('--glass-hover-bg', theme.hover);
    root.style.setProperty('--active-bg', theme.active);
    root.style.setProperty('--glass-accent', theme.accent);
    root.style.setProperty('--glow-color', theme.glow);
    root.style.setProperty('--blob-color-1', theme.blob1);
    root.style.setProperty('--blob-color-2', theme.blob2);
  }

  /**
   * Vypočítá fázi měsíce a vrací její název a ikonu
   * @returns {Object} Objekt s názvem fáze měsíce a ikonou
   */
  function getMoonPhase() {
    const lp = 2551443;
    const now = new Date();
    const newMoon = new Date(1970, 0, 7, 20, 35, 0);
    const phase = ((now.getTime() - newMoon.getTime()) / 1000) % lp;
    const phaseDays = Math.floor(phase / (24 * 3600)) + 1;

    if (phaseDays <= 1) return { name: "Nov", icon: "bi-moon" };
    if (phaseDays <= 6) return { name: "Dorůstající srpek", icon: "bi-moon" };
    if (phaseDays <= 8) return { name: "První čtvrť", icon: "bi-moon-stars" };
    if (phaseDays <= 13)
      return { name: "Dorůstající měsíc", icon: "bi-moon-stars-fill" };
    if (phaseDays <= 16) return { name: "Úplněk", icon: "bi-moon-fill" };
    if (phaseDays <= 21)
      return { name: "Couvající měsíc", icon: "bi-moon-stars-fill" };
    if (phaseDays <= 23)
      return { name: "Poslední čtvrť", icon: "bi-moon-stars" };
    if (phaseDays <= 28) return { name: "Ubývající srpek", icon: "bi-moon" };
    return { name: "Nov", icon: "bi-moon" };
  }

  /**
   * Aktualizuje předpověď počasí na 7 dní s kartami a ikonami
   * @param {Object} daily - Denní data počasí z API
   */
  function updateForecast(daily) {
    forecastTabs.innerHTML = "";
    forecastContent.innerHTML = "";

    const days = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];

    daily.time.forEach((time, index) => {
      const date = new Date(time);
      const dayName = days[date.getDay()];
      const dayDate = date.toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "numeric",
      });

      const isActive = index === 0 ? "active" : "";
      const isShowActive = index === 0 ? "show active" : "";

      // Create Tab
      const tabId = `day-${index}`;
      const tabItem = document.createElement("li");
      tabItem.className = "nav-item";
      tabItem.innerHTML = `
                <button class="nav-link ${isActive} d-flex flex-column align-items-center" id="${tabId}-tab" data-bs-toggle="pill" data-bs-target="#${tabId}" type="button" role="tab" aria-controls="${tabId}" aria-selected="${index === 0}">
                    <span class="fw-bold">${dayName}</span>
                    <span class="small opacity-75">${dayDate}</span>
                </button>
            `;
      forecastTabs.appendChild(tabItem);

      // Create Content
      const code = daily.weather_code[index];
      const info = getWeatherInfo(code);
      const maxTemp = Math.round(daily.temperature_2m_max[index]);
      const minTemp = Math.round(daily.temperature_2m_min[index]);

      const contentItem = document.createElement("div");
      contentItem.className = `tab-pane fade ${isShowActive} h-100`;
      contentItem.id = tabId;
      contentItem.role = "tabpanel";
      contentItem.setAttribute("aria-labelledby", `${tabId}-tab`);

      contentItem.innerHTML = `
                <div class="d-flex flex-column align-items-center justify-content-center h-100 py-4 animation-fade-in">
                    <i class="bi ${info.icon} forecast-icon mb-3"></i>
                    <h3 class="fw-light mb-3">${info.desc}</h3>
                    <div class="d-flex align-items-center gap-4">
                        <div class="text-center">
                            <span class="small text-uppercase opacity-75 d-block">Max</span>
                            <span class="forecast-temp">${maxTemp}°</span>
                        </div>
                        <div class="text-white-50 fs-1">/</div>
                        <div class="text-center">
                            <span class="small text-uppercase opacity-75 d-block">Min</span>
                            <span class="fs-2 fw-light opacity-75">${minTemp}°</span>
                        </div>
                    </div>
                </div>
            `;
      forecastContent.appendChild(contentItem);
    });
  }

  /**
   * Aktualizuje hodinovou předpověď počasí pro dalších 7 dní
   * @param {Object} hourly - Hodinová data počasí z API
   */
  function updateHourlyForecast(hourly) {
    hourlyTabs.innerHTML = "";
    hourlyContent.innerHTML = "";

    const days = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];

    // Helper to slice 24 hours
    for (let i = 0; i < 7; i++) {
      const startIndex = i * 24;
      const endIndex = startIndex + 24;

      // Get date from first hour of the chunk
      const firstHourTime = hourly.time[startIndex];
      const date = new Date(firstHourTime);
      const dayName = days[date.getDay()];

      // Generate shorter day name or just day if needed, keeping logic consistent
      // const dayDate = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });

      const isActive = i === 0 ? "active" : "";
      const isShowActive = i === 0 ? "show active" : "";

      // Create Tab
      const tabId = `hourly-day-${i}`;
      const tabItem = document.createElement("li");
      tabItem.className = "nav-item";
      tabItem.innerHTML = `
                 <button class="nav-link ${isActive} d-flex flex-column align-items-center" id="${tabId}-tab" data-bs-toggle="pill" data-bs-target="#${tabId}" type="button" role="tab" aria-controls="${tabId}" aria-selected="${i === 0}">
                    <span class="fw-bold">${dayName}</span>
                </button>
            `;
      hourlyTabs.appendChild(tabItem);

      // Create Content
      const contentItem = document.createElement("div");
      contentItem.className = `tab-pane fade ${isShowActive}`;
      contentItem.id = tabId;
      contentItem.role = "tabpanel";
      contentItem.setAttribute("aria-labelledby", `${tabId}-tab`);

      // Build scrollable list
      let hourlyHtml = '<div class="hourly-scroll d-flex">';

      const now = new Date();

      for (let j = startIndex; j < endIndex; j++) {
        const time = new Date(hourly.time[j]);

        // If it's the current day (index 0) and time is in past (more than 1 hour ago), skip
        // Logic: Show from current hour onwards.
        // Simple threshold: if timestamp < now - 1 hour, skip.
        if (i === 0 && time.getTime() < now.getTime() - 3600000) {
          continue;
        }

        const hour = time.toLocaleTimeString("cs-CZ", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const temp = Math.round(hourly.temperature_2m[j]);
        const code = hourly.weather_code[j];
        const info = getWeatherInfo(code);
        const wind = Math.round(hourly.wind_speed_10m[j]);

        hourlyHtml += `
                    <div class="hourly-item text-center flex-shrink-0">
                        <span class="d-block small text-white-50 mb-2">${hour}</span>
                        <i class="bi ${info.icon} fs-2 mb-2 d-block"></i>
                        <span class="d-block fw-bold fs-5 mb-1">${temp}°</span>
                        <span class="d-block small text-white-50"><i class="bi bi-wind"></i> ${wind}</span>
                    </div>
                `;
      }
      hourlyHtml += "</div>";

      contentItem.innerHTML = hourlyHtml;
      hourlyContent.appendChild(contentItem);

      // Enable drag scrolling for the new container
      const slider = contentItem.querySelector(".hourly-scroll");
      enableDragScroll(slider);
    }
  }

  /**
   * Povolí horizontální tažení (drag scroll) na prvku
   * @param {HTMLElement} slider - Prvek, na kterém se má tažení povolit
   */
  function enableDragScroll(slider) {
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener("mousedown", (e) => {
      isDown = true;
      slider.classList.add("active");
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener("mouseleave", () => {
      isDown = false;
      slider.classList.remove("active");
    });

    slider.addEventListener("mouseup", () => {
      isDown = false;
      slider.classList.remove("active");
    });

    slider.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // Scroll-fast
      slider.scrollLeft = scrollLeft - walk;
    });
  }

  /**
   * Generuje doporučení oblečení podle pocitové teploty a srážek
   * @param {Object} current - Aktuální data
   */
  function updateOutfitRecommendation(current) {
    const temp = current.apparent_temperature;
    const precip = current.precipitation;
    const isRaining = precip > 0.5;
    const wind = current.wind_speed_10m;

    const iconEl = document.getElementById("outfit-icon");
    const textEl = document.getElementById("outfit-text");

    let icon = "bi-person-arms-up"; // Default
    let text = "Počasí vypadá dobře.";

    if (isRaining) {
      if (temp < 10) {
        icon = "bi-umbrella-fill";
        text = "Vezmi si pláštěnku a teplé oblečení, je sychravo.";
      } else {
        icon = "bi-umbrella";
        text = "Nezapomeň deštník, venku prší.";
      }
    } else if (temp < 0) {
      icon = "bi-snow2";
      text = "Krutá zima! Zimní bunda, čepice a rukavice jsou nutnost.";
    } else if (temp < 10) {
      icon = "bi-person-standing-dress"; // coat approximation icon
      text = "Je chladno, vezmi si kabát nebo teplejší bundu.";
    } else if (temp < 18) {
      icon = "bi-arrow-up-right-circle"; // hoodie/sweatshirt abstraction
      if (wind > 20) {
         text = "Fouká vítr, mikina nebo větrovka se bude hodit.";
      } else {
         text = "Dnes to vidím na mikinu nebo lehkou bundu.";
      }
    } else if (temp < 25) {
      icon = "bi-emoji-sunglasses";
      text = "Příjemně teplo, tričko a džíny jsou ideální.";
    } else {
      icon = "bi-sun-fill";
      text = "Horko! Kraťasy, tílko a nezapomeň na pitný režim.";
    }

    // Set content and animate
    iconEl.className = `bi ${icon} display-4`;
    textEl.textContent = text;
    
    // Add entrance animation
    const card = document.getElementById("outfit-card");
    card.classList.remove("fade-in");
    void card.offsetWidth; // trigger reflow
    card.classList.add("fade-in");
  }

  /**
   * Vykreslí graf srážek pro příští hodinu (4 intervaly po 15 min)
   * @param {Object} minutely15 - Data z API (minutely_15)
   */
  function updatePrecipitationGraph(minutely15) {
    // New wrapper element logic
    const wrapper = document.getElementById("precip-section-wrapper");
    // Inner elements are now inside the wrapper basically, but IDs are unique so querySelector/getElementById works
    const chart = document.getElementById("precip-chart");
    const labels = document.getElementById("precip-labels");

    // Check availability
    if (!minutely15 || !minutely15.precipitation || !wrapper) {
      if (wrapper) wrapper.classList.add("d-none");
      return;
    }

    // --- TIME FIX LOGIC ---
    // API returns times as ISO strings (e.g. "2023-10-27T10:00") in the requested timezone or UTC.
    // Since we used timezone=auto, they should be relatively local, BUT comparing strings is risky.
    // Better strategy: Find the first time slot that is > (now - 15 minutes).
    // We want to show "Current" slot + 3 future ones.
    
    const nowMs = Date.now();
    let startIndex = -1;

    // Iterate to find the nearest slot
    for (let i = 0; i < minutely15.time.length; i++) {
        const t = new Date(minutely15.time[i]).getTime();
        // If time is within the last 15 minutes or in future, take it
        // (Step is 15 mins = 900000 ms)
        if (t >= nowMs - 900000) {
            startIndex = i;
            break;
        }
    }
    
    // Safety check
    if (startIndex === -1 || startIndex + 4 > minutely15.time.length) {
      wrapper.classList.add("d-none");
      return;
    }

    // Extract next 4 quarters (1 hour)
    const precips = minutely15.precipitation.slice(startIndex, startIndex + 4);
    const times = minutely15.time.slice(startIndex, startIndex + 4);

    // Show wrapper
    wrapper.classList.remove("d-none");
    chart.innerHTML = "";
    labels.innerHTML = "";

    // Find max for scaling (min 1mm for visibility in graph, if all 0 then scale doesn't matter much)
    const maxVal = Math.max(...precips, 1.0);

    precips.forEach((amount, i) => {
      // 1. Bar
      const height = (amount / maxVal) * 100;
      
      const barContainer = document.createElement("div");
      barContainer.className = "d-flex flex-column align-items-center justify-content-end position-relative";
      barContainer.style.width = "20%"; // Spacing
      barContainer.style.height = "100%";

      // Value label on top of bar if > 0
      const valLabel = amount > 0 ? `<span class="small mb-1 fw-bold text-warning">${amount} mm</span>` : "";
      
      // Bar visual - Blue if rain, faint gray line if dry to show "active" status
      // We use a minimum height of 4px for "dry" just to show the baseline
      const isRain = amount > 0;
      // const bgColor = isRain ? "#4fc3f7" : "rgba(255,255,255,0.1)"; 
      // Use gradient for rain
      const bgStyle = isRain ? "background: linear-gradient(to top, #4fc3f7, #6ff7ff);" : "background: rgba(255,255,255,0.1);";
      const hPercent = isRain ? Math.max(height, 5) : 1; // 1% height for 0 rain (baseline)

      barContainer.innerHTML = `
        ${valLabel}
        <div class="w-100 rounded-top" style="height: ${hPercent}%; ${bgStyle} transition: height 1s; box-shadow: ${isRain ? '0 0 10px rgba(79, 195, 247, 0.5)' : 'none'}"></div>
        ${isRain ? '<i class="bi bi-cloud-drizzle-fill text-info mt-2 position-absolute" style="bottom: -25px; opacity:0.8"></i>' : ''} 
      `;
      chart.appendChild(barContainer);

      // 2. Time Label
      const tDate = new Date(times[i]);
      const tStr = tDate.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
      
      const labelDiv = document.createElement("div");
      labelDiv.className = "text-center";
      labelDiv.style.width = "20%"; 
      labelDiv.innerHTML = `<span class="fw-light small">${tStr}</span>`;
      labels.appendChild(labelDiv);
    });
  }

  /**
   * Aktualizuje sekci Chytrá doporučení (Lifestyle)
   * @param {Object} current - Aktuální data
   * @param {Object} daily - Denní data
   * @param {Object} hourly - Hodinová data pro vývoj (migréna)
   */
  function updateLifestyle(current, daily, hourly) {
    // Helper for updating status
    const setStatus = (id, valid, text = null, warning = false) => {
      const el = document.querySelector(`#${id} .status-icon`);
      if (!el) return;

      const card = document.getElementById(id);
      
      if (warning) {
        el.textContent = "⚠️";
        if (card) card.title = "Pozor / Výstraha";
      } else if (valid) {
        el.textContent = "✅";
        if (card) card.title = "Ideální podmínky";
      } else {
        el.textContent = "❌";
        if (card) card.title = "Nevhodné podmínky";
      }

      // Optional text update if element exists (for future expansion or tooltips)
      // For now we rely on icons and static labels mostly,
      // but we could add dynamic sub-labels if HTML structure supports it.
    };

    // Prepare data
    const temp = current.temperature_2m;
    const wind = current.wind_speed_10m;
    const precip = current.precipitation;
    const isRaining = precip > 0.5;
    const humidity = current.relative_humidity_2m;
    const clouds = current.cloud_cover; 
    
    // --- PŮVODNÍ ---

    // 1. Running (Běhání)
    // Good: Temp 5-25, Wind < 30, No heavy rain
    const runOk = !isRaining && temp >= 5 && temp <= 25 && wind < 30;
    setStatus("lifestyle-running", runOk);

    // 2. Drying Laundry (Sušení prádla)
    // Good: No rain, Humidity < 60, Temp > 10
    const dryOk = !isRaining && humidity < 60 && temp > 10;
    setStatus("lifestyle-laundry", dryOk);

    // 3. Car Wash (Mytí auta)
    // Warning if rain tomorrow. Bad if rain today.
    const rainToday = daily.precipitation_sum[0];
    const rainTomorrow = daily.precipitation_sum[1];
    const probTomorrow = daily.precipitation_probability_max[1];

    let carValid = true;
    let carWarn = false;

    if (rainToday > 0.5) {
      carValid = false; 
    } else if (rainTomorrow > 1.5 || probTomorrow > 50) {
      carWarn = true; 
    }
    setStatus("lifestyle-car", carValid, null, carWarn);

    // 4. Stargazing (Pozorování hvězd)
    // Good: Cloud cover < 30, Moon phase near New Moon
    const moon = getMoonPhase();
    const isDarkMoon = moon.name === "Nov" || moon.name.includes("srpek");
    const starsOk = clouds < 30 && isDarkMoon;
    setStatus("lifestyle-stars", starsOk);

    // --- NOVÉ ---

    // 5. UV / Opalování (lifestyle-uv)
    // Logic: UV > 3 Warning (Sunscreen needed), UV > 6 High danger
    const uvMax = daily.uv_index_max ? daily.uv_index_max[0] : 0;
    let uvValid = true;
    let uvWarn = false;
    
    // Pro opalování chceme slunce (UV aspoň trochu), ale ne extrém
    if (uvMax < 2) {
        uvValid = false; // Moc nízko na opalování
    } else if (uvMax >= 6) {
        uvWarn = true; // Pozor, spálíš se
    }
    setStatus("lifestyle-uv", uvValid, null, uvWarn);


    // 6. Větrání (lifestyle-ventilation)
    // Logic: Humidity < 70, Temp diff ok? Check simple: Humidity low = good. Low pollen (complex).
    // Simple: Humidity < 60 is great. Humidity > 80 bad.
    const ventOk = humidity < 75 && !isRaining;
    setStatus("lifestyle-ventilation", ventOk);

    // 7. Migréna / Hlava (lifestyle-migraine)
    // Logic: Change in pressure > 2hPa in last 3 hours OR rapid temp change.
    // Using hourly surface_pressure.
    let headacheRisk = false;
    if (hourly && hourly.surface_pressure) {
        // Find current hour index
        const now = new Date();
        const currentHourIndex = hourly.time.findIndex(t => new Date(t).getTime() >= now.getTime() - 3600000); // approx
        
        if (currentHourIndex >= 3) {
            const pNow = hourly.surface_pressure[currentHourIndex];
            const pPrev = hourly.surface_pressure[currentHourIndex - 3];
            if (Math.abs(pNow - pPrev) > 3) {
                headacheRisk = true;
            }
        }
    }
    // "Valid" here means "No Risk". So risk = ❌ (valid=false)
    setStatus("lifestyle-migraine", !headacheRisk, null, headacheRisk); // Warning if risk? Or just X based on connection.
    // Let's say: Valid (Check) = No Headache. Invalid (Cross) = Headache Risk.
    
    // 8. Zalévání zahrady (lifestyle-garden)
    // Logic: Water if no rain today AND temp > 20. Don't water if rain expected.
    // Warning: Don't water, rain coming.
    // Valid: Go water.
    let gardenAction = false;
    if (rainToday < 1 && rainTomorrow < 1 && temp > 15) {
        gardenAction = true;
    }
    setStatus("lifestyle-garden", gardenAction);

    // 9. Komáři (lifestyle-mosquito)
    // Logic: Humid (>70) + Warm (>15).
    const mosquitoRisk = humidity > 70 && temp > 15;
    // Valid = No mosquitoes.
    setStatus("lifestyle-mosquito", !mosquitoRisk, null, mosquitoRisk);

    // 10. Grilování (lifestyle-bbq)
    const bbqOk = !isRaining && wind < 20 && temp > 15;
    setStatus("lifestyle-bbq", bbqOk);

    // 11. Kolo (lifestyle-cycling)
    const bikeOk = !isRaining && wind < 25 && temp > 5 && temp < 30;
    setStatus("lifestyle-cycling", bikeOk);

    // 12. Venčení psa (lifestyle-dog)
    // Warning if > 28°C (pavement hot) or heavy rain.
    let dogOk = true;
    let dogWarn = false;
    if (temp > 28) dogWarn = true; // Hot
    if (isRaining && precip > 2) dogOk = false; // Heavy rain
    setStatus("lifestyle-dog", dogOk, null, dogWarn);

    // 13. Soláry (lifestyle-solar)
    // Logic: Sunshine duration > X
    const sunSeconds = daily.sunshine_duration ? daily.sunshine_duration[0] : 0;
    const sunHours = sunSeconds / 3600;
    const solarOk = sunHours > 5;
    setStatus("lifestyle-solar", solarOk);

    // 14. Mytí oken (lifestyle-window)
    // Logic: No rain today OR tomorrow.
    const windowOk = rainToday < 0.1 && rainTomorrow < 0.1;
    setStatus("lifestyle-window", windowOk);
  }

  /**
   * Stáhne aktuální a předpovědní data počasí z Open-Meteo API
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   * @param {string} title - Název místa k zobrazení
   */
  function fetchWeather(lat, lon, title) {
    // Reset UI
    loadingElement.classList.remove("d-none");
    contentElement.classList.add("d-none");
    errorElement.classList.add("d-none");
    cityTitleElement.textContent = title;

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,cloud_cover,surface_pressure&minutely_15=precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max,sunshine_duration&hourly=temperature_2m,weather_code,wind_speed_10m,surface_pressure,relative_humidity_2m&timezone=auto`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        updateCurrentWeather(data.current, data.daily);
        updateForecast(data.daily);
        updateHourlyForecast(data.hourly);
        updateLifestyle(data.current, data.daily, data.hourly);
        updateOutfitRecommendation(data.current);
        updatePrecipitationGraph(data.minutely_15);

        loadingElement.classList.add("d-none");
        contentElement.classList.remove("d-none");

        // Initialize/Update Map
        // Initialize/Update Map
        initMap(lat, lon, title);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
        loadingElement.classList.add("d-none");
        errorElement.classList.remove("d-none");
        document.querySelector(
          "#forecast-content .spinner-border",
        ).parentElement.innerHTML =
          '<p class="text-center text-danger">Chyba načítání předpovědi</p>';
        document.querySelector(
          "#hourly-content .spinner-border",
        ).parentElement.innerHTML =
          '<p class="text-center text-danger">Chyba načítání předpovědi</p>';
      });
  }

  /**
   * Aktualizuje aktivní stav tlačítek pro výběr místa
   * @param {HTMLElement} activeBtn - Tlačítko, které má být aktivní
   */
  function updateActiveButton(activeBtn) {
    [btnPlzen, btnKrimice, btnCheznovice].forEach((btn) => {
      if (btn) {
        if (btn === activeBtn) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      }
    });
  }

  function updateActiveButtonHist(activeBtn) {
    [btnPlzenHist, btnKrimiceHist, btnCheznoviceHist].forEach((btn) => {
      if (btn) {
        if (btn === activeBtn) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      }
    });
  }

  function updateActiveButtonAdv(activeBtn) {
    [btnPlzenAdv, btnKrimiceAdv, btnCheznoviceAdv].forEach((btn) => {
      if (btn) {
        if (btn === activeBtn) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      }
    });
  }

  function updateActiveButtonStats(activeBtn) {
    [btnPlzenStats, btnKrimiceStats, btnCheznoviceStats].forEach((btn) => {
      if (btn) {
        if (btn === activeBtn) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      }
    });
  }

  // Render buttons initially
  renderLocationButtons();

  // Remove old individual listeners - functionality is now centralized in renderLocationButtons
  // The old code blocks for btnPlzen, btnKrimice... etc are removed.

  // Search logic for Index Page
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const suggestionsList = document.getElementById("suggestions-list");
  const currentLocationBtn = document.getElementById("current-location-btn");

  if (currentLocationBtn) {
    currentLocationBtn.addEventListener("click", () => {
      console.log("GPS Button clicked");
      if (navigator.geolocation) {
        // Show loading state on button
        const originalText = currentLocationBtn.innerHTML;
        console.log("Original text captured:", originalText);
        
        currentLocationBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Zjišťuji...';
        currentLocationBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("GPS Success");
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Restore button state IMMEDIATELY (UX optimization)
            // Use hardcoded content to avoid restoring a potential spinner if state was corrupted
            const defaultContent = '<i class="bi bi-geo-alt-fill me-1"></i> Moje poloha';
            currentLocationBtn.innerHTML = defaultContent;
            currentLocationBtn.disabled = false;
            updateMyLocationButtonState(true);
            console.log("Button reset command executed");
            
            // 1. Immediately fetch data with generic name for speed
            // Save temporary state
            const geoData = { lat: lat, lon: lon, name: "Vaše poloha" };
            localStorage.setItem("geoData", JSON.stringify(geoData));
            
            // Trigger update immediately
            console.log("Calling handleLocationClick");
            handleLocationClick('geolocation', geoData);

            // 2. Perform Reverse Geocoding in background
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1&accept-language=cs`)
                .then(response => response.json())
                .then(data => {
                    const address = data.address;
                    const locationName = address.city || address.town || address.village || address.suburb || address.municipality || "Vaše poloha";
                    
                    // Update stored data with real name
                    geoData.name = locationName;
                    localStorage.setItem("geoData", JSON.stringify(geoData));
                    
                    // Refresh view with new name if we are still on geolocation
                    if (loadStoredLocation() === 'geolocation') {
                         handleLocationClick('geolocation', geoData);
                    }
                })
                .catch(err => {
                    console.error("Reverse geocoding failed:", err);
                });
          },
          (error) => {
            console.error("Geolocation error:", error);
            
            // Restore button state IMMEDIATELY
            const defaultContent = '<i class="bi bi-geo-alt-fill me-1"></i> Moje poloha';
            currentLocationBtn.innerHTML = defaultContent;
            currentLocationBtn.disabled = false;
            
            // Ensure main loader is hidden if it was shown
            const loadingSpinner = document.getElementById("loading");
            if (loadingSpinner) loadingSpinner.classList.add("d-none");

            let msg = "Nepodařilo se zjistit polohu.";
            if (error.code === error.PERMISSION_DENIED) {
                msg = "Povolte prosím přístup k poloze v prohlížeči.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                msg = "Poloha není dostupná. Zkontrolujte GPS/síť.";
            } else if (error.code === error.TIMEOUT) {
                msg = "Vypršel časový limit pro zjištění polohy.";
            }
            
            // Use setTimeout to allow UI to repaint before alert blocks
            setTimeout(() => alert(msg), 50);
          },
          {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 0
          }
        );
      } else {
        alert("Váš prohlížeč nepodporuje geolokaci.");
      }
    });
  }

  // Search logic for History Page (Teploty)
  const historySearchInput = document.getElementById("history-search-input");
  const historySearchButton = document.getElementById("history-search-button");
  const historySuggestionsList = document.getElementById(
    "history-suggestions-list",
  );

  // Search logic for Statistics Page
  const statsSearchInput = document.getElementById("stats-search-input");
  const statsSearchButton = document.getElementById("stats-search-button");
  const statsSuggestionsList = document.getElementById(
    "stats-suggestions-list",
  );

  let debounceTimer;
  let chartInstanceMean = null;
  let chartInstanceMax = null;
  let weatherMap = null;
  let radarLayer = null;
  let satelliteLayer = null;
  let layerControl = null;
  let currentMarker = null;

  // Animation globals
  let animationTimer = null;
  let radarLayers = []; // Array of { timestamp, layerObject }
  let currentFrameIndex = 0;
  let isPlaying = false;

  let mapInitialized = false;

  // --- INITIALIZATION LOGIC ---
  
  // --- AUTO REFRESH LOGIC ---
  let lastFetchTime = Date.now();
  const REFRESH_THRESHOLD = 10 * 60 * 1000; // 10 minut

  function refreshWeatherData() {
      // Update timestamp
      lastFetchTime = Date.now();

      // Animation for button
      const refreshBtn = document.getElementById("refresh-button");
      if (refreshBtn) {
          const icon = refreshBtn.querySelector("i");
          if (icon) {
              icon.classList.add("spin-animation");
              // Remove animation after 1s (visual feedback)
              setTimeout(() => {
                  icon.classList.remove("spin-animation");
              }, 1000);
          }
      }

      // Check what location to load
      const savedKey = loadStoredLocation();
      
      // Wrap initialization in try-catch to ensure UI keeps working even if storage data is corrupted
      try {
          if (savedKey === 'geolocation') {
              const geoDataString = localStorage.getItem("geoData");
              if (geoDataString) {
                  try {
                      const geoData = JSON.parse(geoDataString);
                      handleLocationClick('geolocation', geoData);
                  } catch(e) {
                      console.error("Error parsing geoData", e);
                      handleLocationClick("plzen", baseLocations["plzen"]);
                  }
              } else {
                 handleLocationClick("plzen", baseLocations["plzen"]); 
              }
          } else if (savedKey === 'search-result') {
              // Handle persisted search result
              const searchDataString = localStorage.getItem("lastSearchData");
              if (searchDataString) {
                  const searchData = JSON.parse(searchDataString);
                  // Set input value
                  const inputId = document.getElementById("advanced-content") ? "advanced-search-input" :
                                  document.getElementById("stats-content") ? "stats-search-input" :
                                  document.getElementById("temperatureChart") ? "history-search-input" :
                                  "search-input";
                  const input = document.getElementById(inputId);
                  if (input) input.value = searchData.name;
                  
                  // Deactivate all buttons
                  const groups = document.querySelectorAll('.btn-group[aria-label="Location Selection"] button');
                  groups.forEach(btn => btn.classList.remove("active"));
                  
                  // Trigger load
                  if (document.getElementById("advanced-content")) {
                       initAdvancedWeatherData(searchData.lat, searchData.lon, searchData.name);
                  } else if (document.getElementById("stats-content")) {
                       initStatsData(searchData.lat, searchData.lon, searchData.name);
                  } else if (document.getElementById("temperatureChart")) {
                       fetchHistoricalData(searchData.lat, searchData.lon, searchData.name);
                  } else {
                       fetchWeather(searchData.lat, searchData.lon, `Počasí ${searchData.name}`);
                  }
                  if (input) input.classList.add("active");
              } else {
                   handleLocationClick("plzen", baseLocations["plzen"]);
              }
          } else if (savedKey.startsWith("custom-")) {
              const index = parseInt(savedKey.split("-")[1]);
              const customs = getCustomLocations();
              if (customs[index]) {
                   handleLocationClick(savedKey, customs[index]);
              } else {
                   handleLocationClick("plzen", baseLocations["plzen"]);
              }
          } else {
              // Base location
              const loc = baseLocations[savedKey] || baseLocations["plzen"]; // Default fallback
              handleLocationClick(savedKey, loc);
          }
      } catch (initError) {
          console.error("Initialization error:", initError);
          // Last resort fallback
          try {
              handleLocationClick("plzen", baseLocations["plzen"]);
          } catch (e) { console.error("Critical fallback error", e); }
      }
  }



  // Helper pro kontrolu stáří dat
  function checkAndRefreshIfNeeded() {
      const now = Date.now();
      const age = now - lastFetchTime;
      // Pokud jsou data starší než threshold (10 min)
      if (age > REFRESH_THRESHOLD) {
          console.log(`Data jsou stará ${Math.round(age/1000)}s - spouštím refresh.`);
          refreshWeatherData();
      }
  }

  // 1. Kontrola při návratu do aplikace (Visibility API)
  document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
          checkAndRefreshIfNeeded();
      }
  });

  // 2. Pravidelný interval (každých 10 minut když je aplikace otevřená)
  setInterval(() => {
      checkAndRefreshIfNeeded();
  }, REFRESH_THRESHOLD); 


  // Validace a přidání event listeneru pro tlačítko aktualizace
  const refreshButton = document.getElementById("refresh-button");
  if (refreshButton) {
      refreshButton.addEventListener("click", (e) => {
          e.preventDefault();
          refreshWeatherData();
      });
  }
  
  // Note: Old individual render logic removed in favor of unified initialization above.

  /**
   * Inicializuje interaktivní mapu s radarovými daty a vrstvami
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   * @param {string} name - Název místa pro marker
   */
  /**
   * Inicializuje interaktivní mapu s radarovými daty, vrstvami a animací
   * @param {number} lat
   * @param {number} lon
   * @param {string} name
   */
  function initMap(lat, lon, name = "Vybraná lokalita") {
    const mapContainer = document.getElementById("weather-map");
    if (!mapContainer) return;

    if (weatherMap) {
      weatherMap.setView([lat, lon], 8);
      
      // Update marker
      if (currentMarker) weatherMap.removeLayer(currentMarker);
      currentMarker = L.marker([lat, lon]).addTo(weatherMap)
          .bindPopup(name);

      setTimeout(() => {
        weatherMap.invalidateSize();
        // Re-init animation if needed or just let it run
        // For simplicity, we restart data fetch to ensure fresh location context if needed
        initRadarAnimation();
      }, 300);
      return;
    }

    // Build Controls UI
    if (!document.getElementById("map-controls")) {
        const controlsHTML = `
            <div id="map-controls" class="map-controls glass d-flex align-items-center gap-3 p-2">
                <button id="map-play-pause" class="btn btn-sm btn-glass icon-only">
                    <i class="bi bi-play-fill"></i>
                </button>
                <div class="flex-grow-1 position-relative">
                    <input type="range" id="map-progress" class="form-range" min="0" max="0" value="0" step="1">
                    <div class="d-flex justify-content-between small text-white-50 mt-1">
                         <span id="map-time-start">--:--</span>
                         <span id="map-time-current" class="fw-bold text-white">--:--</span>
                         <span id="map-time-end">--:--</span>
                    </div>
                </div>
            </div>
        `;
        // Insert controls AFTER the map container (or inside a wrapper)
        // Check if wrapper exists, if not create one or append to parent
        const parent = mapContainer.parentElement;
        // Easier: append inside the parent container below the map
        const controlsContainer = document.createElement("div");
        controlsContainer.innerHTML = controlsHTML;
        parent.appendChild(controlsContainer.firstElementChild);
        
        // Bind events
        document.getElementById("map-play-pause").addEventListener("click", togglePlayPause);
        document.getElementById("map-progress").addEventListener("input", (e) => {
            pauseAnimation();
            showFrame(parseInt(e.target.value));
        });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !mapInitialized) {
            mapInitialized = true;

            weatherMap = L.map("weather-map", {
              minZoom: 4,
              maxZoom: 10,
              scrollWheelZoom: false // Disable scroll zoom
            }).setView([lat, lon], 6);

            // Base Layers
            const darkLayer = L.tileLayer(
              "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              { attribution: '&copy; OpenStreetMap & CARTO', subdomains: "abcd", maxZoom: 20, zIndex: 0 }
            ).addTo(weatherMap);

            const lightLayer = L.tileLayer(
              "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
              { attribution: '&copy; OpenStreetMap & CARTO', subdomains: "abcd", maxZoom: 20, zIndex: 0 }
            );

            const baseMaps = { "Tmavý": darkLayer, "Světlý": lightLayer };
            const overlayMaps = {}; 
            
            // We will add radar layer dynamically to control but manage it manually for animation
            layerControl = L.control.layers(baseMaps, overlayMaps).addTo(weatherMap);

            currentMarker = L.marker([lat, lon]).addTo(weatherMap)
                .bindPopup(name);

            setTimeout(() => {
              weatherMap.invalidateSize();
              initRadarAnimation();
            }, 300);

            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(mapContainer);
  }

  /**
   * Načte data z RainVieweru a připraví animaci (Past + Nowcast)
   */
  function initRadarAnimation() {
      if (!weatherMap) return;
      
      // Cleanup existing
      pauseAnimation();
      radarLayers.forEach(frame => {
          if (weatherMap.hasLayer(frame.layer)) weatherMap.removeLayer(frame.layer);
          // Remove from control if present (we don't add frames to control usually to avoid clutter)
      });
      radarLayers = [];

      fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then(res => res.json())
      .then(data => {
          // Combine past and nowcast
          // Adjust logic: RainViewer satellite is separate. We focus on Radar animation here.
          let frames = [];
          if (data.radar && data.radar.past) frames = frames.concat(data.radar.past);
          if (data.radar && data.radar.nowcast) frames = frames.concat(data.radar.nowcast);
          
          if (frames.length === 0) return;

          // Prepare layers (hidden by default)
          frames.forEach(frame => {
              const layer = L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${frame.time}/256/{z}/{x}/{y}/2/1_1.png`, {
                  opacity: 0.8,
                  maxZoom: 10,
                  maxNativeZoom: 6,
                  minZoom: 4,
                  attribution: 'RainViewer',
                  zIndex: 100 // Ensure radar is always on top of base maps
              });
              
              // Preload tiles trick: add to map then set opacity 0? 
              // Or just rely on browser cache. Let's just create objects.
              radarLayers.push({
                  time: frame.time,
                  layer: layer
              });
          });

          // Setup Slider
          const slider = document.getElementById("map-progress");
          if (slider) {
              slider.min = 0;
              slider.max = radarLayers.length - 1;
              slider.value = radarLayers.length - 1; // Default to latest (usually last past or first nowcast?)
              // Let's default to last "past" frame, or the very last frame.
              // Usually users want to see "now".
              // "now" is the last element of 'past' array.
              let nowIndex = data.radar.past ? data.radar.past.length - 1 : 0;
              currentFrameIndex = nowIndex;
              slider.value = nowIndex;
          }
          
          updateTimeDisplay();
          
          // Show initial frame
          showFrame(currentFrameIndex);

          // Auto-play? Maybe just let user click play.
          // Or play once then stop.
      })
      .catch(err => console.error("Error init radar animation:", err));
  }

  function showFrame(index) {
      if (index < 0 || index >= radarLayers.length) return;
      
      // Remove all radar layers
      radarLayers.forEach(frame => {
          if (weatherMap.hasLayer(frame.layer)) weatherMap.removeLayer(frame.layer);
      });
      
      // Add current
      const frame = radarLayers[index];
      if (frame) {
          frame.layer.addTo(weatherMap);
      }
      
      currentFrameIndex = index;
      
      // Sync slider
      const slider = document.getElementById("map-progress");
      if (slider) slider.value = index;
      
      updateTimeDisplay();
  }

  function updateTimeDisplay() {
      if (radarLayers.length === 0) return;
      
      const startEl = document.getElementById("map-time-start");
      const endEl = document.getElementById("map-time-end");
      const currentEl = document.getElementById("map-time-current");
      
      const first = new Date(radarLayers[0].time * 1000);
      const last = new Date(radarLayers[radarLayers.length - 1].time * 1000);
      const current = new Date(radarLayers[currentFrameIndex].time * 1000);
      
      if (startEl) startEl.textContent = first.toLocaleTimeString("cs-CZ", {hour: '2-digit', minute:'2-digit'});
      if (endEl) endEl.textContent = last.toLocaleTimeString("cs-CZ", {hour: '2-digit', minute:'2-digit'});
      if (currentEl) currentEl.textContent = current.toLocaleTimeString("cs-CZ", {hour: '2-digit', minute:'2-digit'});
  }

  function togglePlayPause() {
      if (isPlaying) {
          pauseAnimation();
      } else {
          playAnimation();
      }
  }

  function playAnimation() {
      if (isPlaying) return;
      isPlaying = true;
      
      const btn = document.getElementById("map-play-pause");
      if (btn) btn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      
      animationTimer = setInterval(() => {
          let next = currentFrameIndex + 1;
          if (next >= radarLayers.length) next = 0; // Loop
          showFrame(next);
      }, 500); // 500ms per frame
  }

  function pauseAnimation() {
      isPlaying = false;
      clearInterval(animationTimer);
      const btn = document.getElementById("map-play-pause");
      if (btn) btn.innerHTML = '<i class="bi bi-play-fill"></i>';
  }

  let lastSearchedLocation = null;

  /**
   * Zpracuje vyhledávání místa a načte jeho počasí
   * @param {HTMLElement} inputElement - Input pole s názvem místa
   * @param {boolean|string} isHistory - Zda se jedná o historickou stránku
   */
  function handleSearch(inputElement, isHistory = false) {
    const query = inputElement ? inputElement.value.trim() : "";
    if (!query) return;

    const suggestionsElement =
      isHistory === "advanced"
        ? advancedSuggestionsList
        : isHistory === "stats"
          ? statsSuggestionsList
          : isHistory
            ? historySuggestionsList
            : suggestionsList;

    // Hide suggestions
    if (suggestionsElement) suggestionsElement.classList.add("d-none");

    // Fetch coordinates
    fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=cs&format=json`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const name = result.name;
          const lat = result.latitude;
          const lon = result.longitude;

          // Store for "Add Location" feature
          lastSearchedLocation = { name, lat, lon };
          enableAddButton(isHistory);

          // Update input
          if (inputElement) inputElement.value = name;

          if (isHistory) {
            if (isHistory === "advanced") {
                initAdvancedWeatherData(lat, lon, name);
            } else if (isHistory === "stats") {
                initStatsData(lat, lon, name);
            } else if (isHistory === "time-machine") {
                initTimeMachineData(lat, lon, name);
            } else if (isHistory === "astro") {
                initAstroData(lat, lon, name);
            } else {
                fetchHistoricalData(lat, lon, name);
            }
          } else {
            // Reset buttons on main page if needed
            if (btnPlzen && btnKrimice && btnCheznovice) {
              [btnPlzen, btnKrimice, btnCheznovice].forEach((btn) =>
                btn.classList.remove("active"),
              );
            }
            fetchWeather(lat, lon, `Počasí ${name}`);
          }
        } else {
          alert("Místo nebylo nalezeno. Zkuste to prosím znovu.");
        }
      })
      .catch((error) => {
        console.error("Error fetching location:", error);
        alert("Chyba při vyhledávání místa.");
      });
  }

  /**
   * Stáhne historická teplotní data a vykreslí grafy
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   * @param {string} name - Název místa
   */
  function fetchHistoricalData(lat, lon, name) {
    const chartCanvasMean = document.getElementById("temperatureChart");
    const chartCanvasMax = document.getElementById("maxTempChart");
    const loadingChart = document.getElementById("loading-chart");
    const errorChart = document.getElementById("error-chart");
    const titleElement = document.querySelector("h1.fw-light");

    if (!chartCanvasMean || !chartCanvasMax) return;

    titleElement.textContent = `Průměrné Teploty - ${name}`;
    loadingChart.classList.remove("d-none");
    errorChart.classList.add("d-none");
    chartCanvasMean.classList.add("d-none");
    chartCanvasMax.classList.add("d-none");

    // Sync ambient weather (theme and background) for current location
    syncAmbientWeather(lat, lon);

    // Fetch Data for 1993, 2000, 2023, 2024 and 2025
    // Using archive-api.open-meteo.com
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=1993-01-01&end_date=2025-12-31&daily=temperature_2m_mean,temperature_2m_max&timezone=auto`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Data fetch failed");
        return res.json();
      })
      .then((data) => {
        loadingChart.classList.add("d-none");
        chartCanvasMean.classList.remove("d-none");
        chartCanvasMax.classList.remove("d-none");
        processAndRenderChart(data.daily);
      })
      .catch((err) => {
        console.error(err);
        loadingChart.classList.add("d-none");
        errorChart.classList.remove("d-none");
      });
  }

  /**
   * Zpracuje a vykreslí historické teplotní grafy
   * @param {Object} dailyData - Denní historická data
   */
  function processAndRenderChart(dailyData) {
    const monthNames = [
      "Leden",
      "Únor",
      "Březen",
      "Duben",
      "Květen",
      "Červen",
      "Červenec",
      "Srpen",
      "Září",
      "Říjen",
      "Listopad",
      "Prosinec",
    ];

    // Arrays for Mean Temps (2025, 2024, 2023, 2000, 1993)
    const monthlySums2025 = new Array(12).fill(0);
    const monthlyCounts2025 = new Array(12).fill(0);
    const monthlySums2024 = new Array(12).fill(0);
    const monthlyCounts2024 = new Array(12).fill(0);
    const monthlySums2023 = new Array(12).fill(0);
    const monthlyCounts2023 = new Array(12).fill(0);
    const monthlySums2000 = new Array(12).fill(0);
    const monthlyCounts2000 = new Array(12).fill(0);
    const monthlySums1993 = new Array(12).fill(0);
    const monthlyCounts1993 = new Array(12).fill(0);

    // Arrays for Max Temps (2025, 2024, 2023, 2000 & 1993)
    const monthlyMaxes2025 = new Array(12).fill(-Infinity);
    const monthlyMaxes2024 = new Array(12).fill(-Infinity);
    const monthlyMaxes2023 = new Array(12).fill(-Infinity);
    const monthlyMaxes2000 = new Array(12).fill(-Infinity);
    const monthlyMaxes1993 = new Array(12).fill(-Infinity);

    dailyData.time.forEach((dateStr, index) => {
      const date = new Date(dateStr);
      const month = date.getMonth(); // 0-11
      const year = date.getFullYear();

      const tempMean = dailyData.temperature_2m_mean[index];
      const tempMax = dailyData.temperature_2m_max[index];

      // Process Mean
      if (tempMean !== null && tempMean !== undefined) {
        if (year === 2025) {
          monthlySums2025[month] += tempMean;
          monthlyCounts2025[month]++;
        } else if (year === 2024) {
          monthlySums2024[month] += tempMean;
          monthlyCounts2024[month]++;
        } else if (year === 2023) {
          monthlySums2023[month] += tempMean;
          monthlyCounts2023[month]++;
        } else if (year === 2000) {
          monthlySums2000[month] += tempMean;
          monthlyCounts2000[month]++;
        } else if (year === 1993) {
          monthlySums1993[month] += tempMean;
          monthlyCounts1993[month]++;
        }
      }

      // Process Max
      if (tempMax !== null && tempMax !== undefined) {
        if (year === 2025) {
          if (tempMax > monthlyMaxes2025[month])
            monthlyMaxes2025[month] = tempMax;
        } else if (year === 2024) {
          if (tempMax > monthlyMaxes2024[month])
            monthlyMaxes2024[month] = tempMax;
        } else if (year === 2023) {
          if (tempMax > monthlyMaxes2023[month])
            monthlyMaxes2023[month] = tempMax;
        } else if (year === 2000) {
          if (tempMax > monthlyMaxes2000[month])
            monthlyMaxes2000[month] = tempMax;
        } else if (year === 1993) {
          if (tempMax > monthlyMaxes1993[month])
            monthlyMaxes1993[month] = tempMax;
        }
      }
    });

    const calcAvg = (sums, counts) =>
      sums.map((sum, i) =>
        counts[i] > 0 ? (sum / counts[i]).toFixed(1) : null,
      );
    const meanData2025 = calcAvg(monthlySums2025, monthlyCounts2025);
    const meanData2024 = calcAvg(monthlySums2024, monthlyCounts2024);
    const meanData2023 = calcAvg(monthlySums2023, monthlyCounts2023);
    const meanData2000 = calcAvg(monthlySums2000, monthlyCounts2000);
    const meanData1993 = calcAvg(monthlySums1993, monthlyCounts1993);

    // Clean up -Infinity if no data
    const cleanupMax = (arr) =>
      arr.map((max) => (max === -Infinity ? null : max));
    const maxData2025 = cleanupMax(monthlyMaxes2025);
    const maxData2024 = cleanupMax(monthlyMaxes2024);
    const maxData2023 = cleanupMax(monthlyMaxes2023);
    const maxData2000 = cleanupMax(monthlyMaxes2000);
    const maxData1993 = cleanupMax(monthlyMaxes1993);

    // Render Mean Chart (White vs Cyan vs Purple vs Green vs Yellow) - 2025 vs 2024 vs 2023 vs 2000 vs 1993
    renderChart(
      "temperatureChart",
      monthNames,
      [
        {
          label: "2025",
          data: meanData2025,
          borderColor: "#ffffff",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 3,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "rgba(255,255,255,0.5)",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
        {
          label: "2024",
          data: meanData2024,
          borderColor: "#00bcd4", // Cyan
          backgroundColor: "rgba(0, 188, 212, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#00bcd4",
          pointBorderColor: "rgba(0, 188, 212, 0.5)",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
        {
          label: "2023",
          data: meanData2023,
          borderColor: "#9c27b0", // Purple
          backgroundColor: "rgba(156, 39, 176, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#9c27b0",
          pointBorderColor: "rgba(156, 39, 176, 0.5)",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
        {
          label: "2000",
          data: meanData2000,
          borderColor: "#4caf50", // Green
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#4caf50",
          pointBorderColor: "rgba(76, 175, 80, 0.5)",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
        {
          label: "1993",
          data: meanData1993,
          borderColor: "#ffeb3b", // Yellow
          backgroundColor: "rgba(255, 235, 59, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#ffeb3b",
          pointBorderColor: "rgba(255, 235, 59, 0.5)",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
      ],
      "mean",
    );

    // Render Max Chart (Orange vs Cyan vs Purple vs Green vs Yellow) - 2025 vs 2024 vs 2023 vs 2000 vs 1993
    renderChart(
      "maxTempChart",
      monthNames,
      [
        {
          label: "2025",
          data: maxData2025,
          borderColor: "#ff9e42", // Orange
          backgroundColor: "rgba(255, 158, 66, 0.2)",
          borderWidth: 3,
          pointBackgroundColor: "#ff9e42",
          pointBorderColor: "rgba(255, 158, 66, 0.5)",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
        {
          label: "2024",
          data: maxData2024,
          borderColor: "#00bcd4", // Cyan
          backgroundColor: "rgba(0, 188, 212, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#00bcd4",
          pointBorderColor: "rgba(0, 188, 212, 0.5)",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
        {
          label: "2023",
          data: maxData2023,
          borderColor: "#9c27b0", // Purple
          backgroundColor: "rgba(156, 39, 176, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#9c27b0",
          pointBorderColor: "rgba(156, 39, 176, 0.5)",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
        {
          label: "2000",
          data: maxData2000,
          borderColor: "#4caf50", // Green
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#4caf50",
          pointBorderColor: "rgba(76, 175, 80, 0.5)",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
        {
          label: "1993",
          data: maxData1993,
          borderColor: "#ffeb3b", // Yellow
          backgroundColor: "rgba(255, 235, 59, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#ffeb3b",
          pointBorderColor: "rgba(255, 235, 59, 0.5)",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
        },
      ],
      "max",
    );
  }

  /**
   * Vykreslí graf s použitím Chart.js knihovny
   * @param {string} canvasId - ID canvas prvku
   * @param {Array<string>} labels - Popisky os X
   * @param {Array<Object>} datasets - Datové sady grafu
   * @param {string} type - Typ grafu ('mean' nebo 'max')
   */
  function renderChart(canvasId, labels, datasets, type) {
    const ctx = document.getElementById(canvasId).getContext("2d");

    // Destroy existing instance if any (search by canvas ID to be robust)
    const existingChart = Chart.getChart(document.getElementById(canvasId));
    if (existingChart) existingChart.destroy();

    // Note: Canvas gradients need the context, so they are best handled inside the dataset config or here if simple.
    // For complexity, we pass simple colors in dataset config above.

    const newChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "white", font: { family: "Inter", size: 14 } },
          },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
            bodyFont: { family: "Inter" },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "rgba(255,255,255,0.7)",
              font: { family: "Inter" },
            },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: {
              color: "rgba(255,255,255,0.7)",
              font: { family: "Inter" },
            },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });

    if (type === "mean") {
        chartInstanceMean = newChart;
    } else if (type === "max") {
        chartInstanceMax = newChart;
    }
  }

  /**
   * Vytvoří debounced verzi funkce, která se spustí až po určité prodlevě
   * @param {Function} func - Funkce k zavolání
   * @param {number} delay - Prodleva v milisekundách
   * @returns {Function} Debounced funkce
   */
  function debounce(func, delay) {
    return function (...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Stáhne a zobrazí návrhy míst na základě zadaného textu
   * @param {string} query - Dotaz pro hledání místa
   * @param {boolean|string} isHistory - Typ stránky (false = hlavní, true = historie, 'stats'/'advanced' = ostatní)
   */
  function fetchSuggestions(query, isHistory = false) {
    const inputElement = isHistory ? historySearchInput : searchInput;
    const suggestionsElement = isHistory
      ? historySuggestionsList
      : suggestionsList;

    if (!suggestionsElement) return;

    if (query.length < 2) {
      suggestionsElement.classList.add("d-none");
      suggestionsElement.innerHTML = "";
      return;
    }

    fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=cs&format=json`,
    )
      .then((response) => response.json())
      .then((data) => {
        suggestionsElement.innerHTML = "";
        if (data.results && data.results.length > 0) {
          suggestionsElement.classList.remove("d-none");
          data.results.forEach((place) => {
            const item = document.createElement("div");
            item.className = "suggestion-item";

            let details = [];
            if (place.admin2) details.push(place.admin2);
            if (place.admin1) details.push(place.admin1);
            if (place.country) details.push(place.country);

            const detailsStr = details.join(", ");

            item.innerHTML = `
                            <span class="suggestion-name">${place.name}</span>
                            <span class="suggestion-details">${detailsStr}</span>
                        `;

            item.addEventListener("click", () => {
              if (inputElement) inputElement.value = place.name;
              suggestionsElement.classList.add("d-none");

              if (isHistory) {
                if (isHistory === "advanced") {
                  initAdvancedWeatherData(place.latitude, place.longitude, place.name);
                } else if (isHistory === "stats") {
                  initStatsData(place.latitude, place.longitude, place.name);
                } else if (isHistory === "time-machine") {
                  initTimeMachineData(place.latitude, place.longitude, place.name);
                } else if (isHistory === "astro") {
                  initAstroData(place.latitude, place.longitude, place.name);
                } else {
                  fetchHistoricalData(place.latitude, place.longitude, place.name);
                }
              } else {
                fetchWeather(
                  place.latitude,
                  place.longitude,
                  `Počasí ${place.name}`,
                );
                if (btnPlzen && btnKrimice && btnCheznovice) {
                  [btnPlzen, btnKrimice, btnCheznovice].forEach((btn) =>
                    btn.classList.remove("active"),
                  );
                }
              }
            });

            suggestionsElement.appendChild(item);
          });
        } else {
          suggestionsElement.classList.add("d-none");
        }
      })
      .catch((err) => {
        console.error("Error fetching suggestions:", err);
      });
  }

  // Main Search Listeners
  if (searchButton) {
    searchButton.addEventListener("click", () =>
      handleSearch(searchInput, false),
    );
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch(searchInput, false);
    });

    searchInput.addEventListener(
      "input",
      debounce((e) => {
        fetchSuggestions(e.target.value.trim(), false);
      }, 300),
    );
  }

  // History Search Listeners (Teploty Page)
  if (historySearchButton) {
    historySearchButton.addEventListener("click", () =>
      handleSearch(historySearchInput, true),
    );
  }

  if (historySearchInput) {
    historySearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch(historySearchInput, true);
    });

    historySearchInput.addEventListener(
      "input",
      debounce((e) => {
        fetchSuggestions(e.target.value.trim(), true);
      }, 300),
    );
  }

  // Statistics Search Listeners (Statistiky Page)
  if (statsSearchButton) {
    statsSearchButton.addEventListener("click", () =>
      handleSearch(statsSearchInput, "stats"),
    );
  }

  if (statsSearchInput) {
    statsSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch(statsSearchInput, "stats");
    });

    statsSearchInput.addEventListener(
      "input",
      debounce((e) => {
        fetchSuggestions(e.target.value.trim(), "stats");
      }, 300),
    );
  }

  // Close suggestions on click outside
  document.addEventListener("click", (e) => {
    // Main page suggestions
    if (searchInput && suggestionsList) {
      if (
        !searchInput.contains(e.target) &&
        !suggestionsList.contains(e.target)
      ) {
        suggestionsList.classList.add("d-none");
      }
    }
    // History page suggestions
    if (historySearchInput && historySuggestionsList) {
      if (
        !historySearchInput.contains(e.target) &&
        !historySuggestionsList.contains(e.target)
      ) {
        historySuggestionsList.classList.add("d-none");
      }
    }
    // Statistics page suggestions
    if (statsSearchInput && statsSuggestionsList) {
      if (
        !statsSearchInput.contains(e.target) &&
        !statsSuggestionsList.contains(e.target)
      ) {
        statsSuggestionsList.classList.add("d-none");
      }
    }
  });



  /**
   * Helper to get location object from key
   */
  function getLocationData(key) {
      if (key === "search-result") {
          const stored = localStorage.getItem("lastSearchData");
          try {
              return stored ? JSON.parse(stored) : baseLocations["plzen"];
          } catch (e) {
              return baseLocations["plzen"];
          }
      }
      
      if (baseLocations[key]) return baseLocations[key];
      if (key && key.startsWith("custom-")) {
          const index = parseInt(key.split("-")[1]);
          const customs = getCustomLocations();
          return customs[index];
      }
      return baseLocations["plzen"]; // Fallback
  }

  // Initial Fetch (Plzeň) - Only on main page if weather elements exist
  if (document.getElementById("weather-data")) {
    const saved = loadStoredLocation();
    const loc = getLocationData(saved);
    if (loc) {
        fetchWeather(loc.lat, loc.lon, `Počasí ${loc.name}`);
    }
  }

  // Initial Chart (Prague/Plzeň default) - Only on Teploty page
  if (document.getElementById("temperatureChart")) {
    const saved = loadStoredLocation();
    const loc = getLocationData(saved);
    if (loc) {
        fetchHistoricalData(loc.lat, loc.lon, loc.name);
    }
  }

  // ========== ADVANCED WEATHER DATA SECTION ==========
  // Chart instances for advanced data
  let uvChartInstance = null;

  let pressureChartInstance = null;
  let rainfallChartInstance = null;
  let windRoseChartInstance = null;

  // Helper function to get UV level and color
  /**
   * Vrací úroveň UV záření a odpovídající barvu
   * @param {number} uvIndex - Index UV záření
   * @returns {Object} Objekt s úrovní a barvou
   */
  function getUVLevel(uvIndex) {
    if (uvIndex < 3)
      return { level: "Nízký", color: "#4caf50", bg: "rgba(76, 175, 80, 0.2)" };
    if (uvIndex < 6)
      return {
        level: "Mírný",
        color: "#ffeb3b",
        bg: "rgba(255, 235, 59, 0.2)",
      };
    if (uvIndex < 8)
      return {
        level: "Vysoký",
        color: "#ff9e42",
        bg: "rgba(255, 158, 66, 0.2)",
      };
    if (uvIndex < 11)
      return {
        level: "Velmi vysoký",
        color: "#f44336",
        bg: "rgba(244, 67, 54, 0.2)",
      };
    return {
      level: "Extrémní",
      color: "#9c27b0",
      bg: "rgba(156, 39, 176, 0.2)",
    };
  }

  /**
   * Vrací název směru větru na základě stupňů
   * @param {number} degrees - Úhel v stupních (0-360)
   * @returns {string} Název směru (S, SV, V, JV, J, JZ, Z, SZ)
   */
  function getWindDirection(degrees) {
    const directions = ["S", "SV", "V", "JV", "J", "JZ", "Z", "SZ"];
    const index = Math.round((degrees % 360) / 45) % 8;
    return directions[index];
  }

  /**
   * Stáhne a zobrazí data UV záření pro příštích 7 dní
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   */
  function fetchUVIndex(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&timezone=auto&forecast_days=7`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.daily) {
          const currentUV = data.daily.uv_index_max[0];
          const uvLevel = getUVLevel(currentUV);

          document.getElementById("uv-current").textContent =
            currentUV.toFixed(1);
          const levelBadge = document.getElementById("uv-level");
          levelBadge.textContent = uvLevel.level;
          levelBadge.style.backgroundColor = uvLevel.color;

          renderUVChart(data.daily);
        }
      })
      .catch((err) => console.error("Error fetching UV data:", err));
  }

  /**
   * Vykreslí graf UV index
   * @param {Object} dailyData - Denní data UV indexu
   */
  function renderUVChart(dailyData) {
    const ctx = document.getElementById("uvChart");
    if (!ctx) return;

    if (uvChartInstance) uvChartInstance.destroy();

    const labels = dailyData.time.map((date) => {
      const d = new Date(date);
      return d.toLocaleDateString("cs-CZ", {
        weekday: "short",
        day: "numeric",
        month: "numeric",
      });
    });

    uvChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "UV Index",
            data: dailyData.uv_index_max,
            borderColor: "#ff9e42",
            backgroundColor: "rgba(255, 158, 66, 0.2)",
            borderWidth: 3,
            pointBackgroundColor: "#ff9e42",
            pointRadius: 5,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  /**
   * Stáhne a zobrazí data atmosférického tlaku
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   */
  function fetchPressureData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=pressure_msl&timezone=auto&forecast_days=7`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.hourly) {
          const currentPressure = data.hourly.pressure_msl[0];
          const pressureIn3Hours = data.hourly.pressure_msl[3];

          document.getElementById("pressure-current").textContent =
            `${Math.round(currentPressure)} hPa`;

          // Determine pressure trend
          const trendIcon = document.getElementById("pressure-trend-icon");
          const trendText = document.getElementById("pressure-trend-text");
          const diff = pressureIn3Hours - currentPressure;

          if (diff > 1) {
            trendIcon.className =
              "bi bi-arrow-up-circle-fill fs-3 me-2 text-success";
            trendText.textContent = "Stoupající";
          } else if (diff < -1) {
            trendIcon.className =
              "bi bi-arrow-down-circle-fill fs-3 me-2 text-danger";
            trendText.textContent = "Klesající";
          } else {
            trendIcon.className = "bi bi-arrow-left-right fs-3 me-2 text-info";
            trendText.textContent = "Stabilní";
          }

          renderPressureChart(data.hourly);
        }
      })
      .catch((err) => console.error("Error fetching pressure data:", err));
  }

  /**
   * Vykreslí graf atmosférického tlaku
   * @param {Object} hourlyData - Hodinová data tlaku
   */
  function renderPressureChart(hourlyData) {
    const ctx = document.getElementById("pressureChart");
    if (!ctx) return;

    if (pressureChartInstance) pressureChartInstance.destroy();

    // Show every 6 hours for readability
    const labels = [];
    const pressureValues = [];
    for (let i = 0; i < Math.min(168, hourlyData.time.length); i += 6) {
      const d = new Date(hourlyData.time[i]);
      labels.push(
        d.toLocaleDateString("cs-CZ", {
          day: "numeric",
          month: "numeric",
          hour: "2-digit",
        }),
      );
      pressureValues.push(hourlyData.pressure_msl[i]);
    }

    pressureChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tlak (hPa)",
            data: pressureValues,
            borderColor: "#9c27b0",
            backgroundColor: "rgba(156, 39, 176, 0.2)",
            borderWidth: 3,
            pointBackgroundColor: "#9c27b0",
            pointRadius: 4,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  /**
   * Stáhne a zobrazí data srážek za posledních 30 dní
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   */
  function fetchRainfallData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&timezone=auto&past_days=30&forecast_days=1`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.daily) {
          const todayRain =
            data.daily.precipitation_sum[
              data.daily.precipitation_sum.length - 1
            ];
          const monthRain = data.daily.precipitation_sum.reduce(
            (sum, val) => sum + val,
            0,
          );

          document.getElementById("rain-today").textContent =
            `${todayRain.toFixed(1)} mm`;
          document.getElementById("rain-month").textContent =
            `${monthRain.toFixed(1)} mm`;

          renderRainfallChart(data.daily);
        }
      })
      .catch((err) => console.error("Error fetching rainfall data:", err));
  }

  /**
   * Vykreslí graf srážek
   * @param {Object} dailyData - Denní data srážek
   */
  function renderRainfallChart(dailyData) {
    const ctx = document.getElementById("rainfallChart");
    if (!ctx) return;

    if (rainfallChartInstance) rainfallChartInstance.destroy();

    // Aggregate by week for last 30 days
    const weekLabels = [];
    const weekRainfall = [];
    const daysPerWeek = 7;

    for (let i = 0; i < dailyData.time.length; i += daysPerWeek) {
      const startDate = new Date(dailyData.time[i]);
      weekLabels.push(
        startDate.toLocaleDateString("cs-CZ", {
          day: "numeric",
          month: "numeric",
        }),
      );

      let weekSum = 0;
      for (
        let j = i;
        j < Math.min(i + daysPerWeek, dailyData.time.length);
        j++
      ) {
        weekSum += dailyData.precipitation_sum[j];
      }
      weekRainfall.push(weekSum);
    }

    rainfallChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: weekLabels,
        datasets: [
          {
            label: "Srážky (mm)",
            data: weekRainfall,
            backgroundColor: "rgba(0, 188, 212, 0.6)",
            borderColor: "#00bcd4",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  /**
   * Stáhne a zobrazí data o větru
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   */
  function fetchWindData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m&timezone=auto&past_days=7&forecast_days=1`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.hourly) {
          renderWindRose(data.hourly);

          // Calculate average wind speed
          const avgSpeed =
            data.hourly.wind_speed_10m.reduce((sum, val) => sum + val, 0) /
            data.hourly.wind_speed_10m.length;
          document.getElementById("wind-avg-speed").textContent =
            `${avgSpeed.toFixed(1)} km/h`;

          // Find dominant direction
          const directionCounts = {};
          data.hourly.wind_direction_10m.forEach((dir) => {
            const dirName = getWindDirection(dir);
            directionCounts[dirName] = (directionCounts[dirName] || 0) + 1;
          });

          const dominantDir = Object.keys(directionCounts).reduce((a, b) =>
            directionCounts[a] > directionCounts[b] ? a : b,
          );
          document.getElementById("wind-dominant-direction").textContent =
            dominantDir;
        }
      })
      .catch((err) => console.error("Error fetching wind data:", err));
  }

  /**
   * Vykreslí polární diagram (wind rose) ukazující direkcí větru
   * @param {Object} hourlyData - Hodinová data větru
   */
  function renderWindRose(hourlyData) {
    const ctx = document.getElementById("windRoseChart");
    if (!ctx) return;

    if (windRoseChartInstance) windRoseChartInstance.destroy();

    // Aggregate wind data by direction sectors (8 directions)
    const directions = ["S", "SV", "V", "JV", "J", "JZ", "Z", "SZ"];
    const directionSpeeds = Array(8).fill(0);
    const directionCounts = Array(8).fill(0);

    hourlyData.wind_direction_10m.forEach((dir, i) => {
      const index = Math.round((dir % 360) / 45) % 8;
      directionSpeeds[index] += hourlyData.wind_speed_10m[i];
      directionCounts[index]++;
    });

    // Calculate average speed for each direction
    const avgSpeeds = directionSpeeds.map((speed, i) =>
      directionCounts[i] > 0 ? speed / directionCounts[i] : 0,
    );

    windRoseChartInstance = new Chart(ctx, {
      type: "polarArea",
      data: {
        labels: directions,
        datasets: [
          {
            label: "Průměrná rychlost větru (km/h)",
            data: avgSpeeds,
            backgroundColor: [
              "rgba(255, 99, 132, 0.5)",
              "rgba(54, 162, 235, 0.5)",
              "rgba(255, 206, 86, 0.5)",
              "rgba(75, 192, 192, 0.5)",
              "rgba(153, 102, 255, 0.5)",
              "rgba(255, 159, 64, 0.5)",
              "rgba(0, 188, 212, 0.5)",
              "rgba(76, 175, 80, 0.5)",
            ],
            borderColor: [
              "rgb(255, 99, 132)",
              "rgb(54, 162, 235)",
              "rgb(255, 206, 86)",
              "rgb(75, 192, 192)",
              "rgb(153, 102, 255)",
              "rgb(255, 159, 64)",
              "rgb(0, 188, 212)",
              "rgb(76, 175, 80)",
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          r: {
            ticks: {
              color: "rgba(255,255,255,0.7)",
              backdropColor: "transparent",
            },
            grid: { color: "rgba(255,255,255,0.2)" },
            pointLabels: { color: "rgba(255,255,255,0.9)", font: { size: 14 } },
          },
        },
      },
    });
  }

  // ========== EXTENDED METEOROLOGICAL DATA ==========
  // Additional chart instances
  let visibilityChartInstance = null;
  let dewpointChartInstance = null;
  let apparentTempChartInstance = null;
  let cloudCoverChartInstance = null;
  let solarChartInstance = null;
  let snowChartInstance = null;

  // Statistics page chart instances
  let statsWeeklyChartInstance = null;
  let statsNormalChartInstance = null;
  let statsHistoryChartInstance = null;

  /**
   * Stáhne a zobrazí data viditelnosti
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   */
  function fetchVisibility(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=visibility&timezone=auto&forecast_days=3`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.hourly) {
          const currentVis = data.hourly.visibility[0] / 1000; // Convert m to km
          document.getElementById("visibility-current").textContent =
            `${currentVis.toFixed(1)} km`;

          // Visibility levels
          let level, color;
          if (currentVis >= 10) {
            level = "Výborná";
            color = "#4caf50";
          } else if (currentVis >= 4) {
            level = "Dobrá";
            color = "#ffeb3b";
          } else if (currentVis >= 1) {
            level = "Mírná";
            color = "#ff9e42";
          } else {
            level = "Špatná";
            color = "#f44336";
          }

          const badge = document.getElementById("visibility-level");
          badge.textContent = level;
          badge.style.backgroundColor = color;

          renderVisibilityChart(data.hourly);
        }
      })
      .catch((err) => console.error("Error fetching visibility data:", err));
  }

  /**
   * Vykreslí graf viditelnosti
   * @param {Object} hourlyData - Hodinová data viditelnosti
   */
  function renderVisibilityChart(hourlyData) {
    const ctx = document.getElementById("visibilityChart");
    if (!ctx) return;
    if (visibilityChartInstance) visibilityChartInstance.destroy();

    const labels = [];
    const visValues = [];
    for (let i = 0; i < Math.min(48, hourlyData.time.length); i += 3) {
      const d = new Date(hourlyData.time[i]);
      labels.push(
        d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
      );
      visValues.push(hourlyData.visibility[i] / 1000);
    }

    visibilityChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Viditelnost (km)",
            data: visValues,
            borderColor: "#4caf50",
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  /**
   * Stáhne a zobrazí data rosného bodu
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   */
  function fetchDewPoint(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=dewpoint_2m,temperature_2m&timezone=auto&forecast_days=3`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.hourly) {
          const currentDew = data.hourly.dewpoint_2m[0];
          const currentTemp = data.hourly.temperature_2m[0];

          document.getElementById("dewpoint-current").textContent =
            `${currentDew.toFixed(1)}°C`;
          document.getElementById("actual-temp").textContent =
            currentTemp.toFixed(1);

          // Comfort levels based on dew point
          let comfort, color;
          if (currentDew < 10) {
            comfort = "Suché";
            color = "#00bcd4";
          } else if (currentDew < 13) {
            comfort = "Velmi příjemné";
            color = "#4caf50";
          } else if (currentDew < 16) {
            comfort = "Příjemné";
            color = "#8bc34a";
          } else if (currentDew < 18) {
            comfort = "Pohodlné";
            color = "#ffeb3b";
          } else if (currentDew < 21) {
            comfort = "Dusné";
            color = "#ff9e42";
          } else {
            comfort = "Velmi dusné";
            color = "#f44336";
          }

          const badge = document.getElementById("dewpoint-comfort");
          badge.textContent = comfort;
          badge.style.backgroundColor = color;

          renderDewPointChart(data.hourly);
        }
      })
      .catch((err) => console.error("Error fetching dew point data:", err));
  }

  /**
   * Vykreslí graf rosného bodu a teploty
   * @param {Object} hourlyData - Hodinová data rosného bodu a teploty
   */
  function renderDewPointChart(hourlyData) {
    const ctx = document.getElementById("dewpointChart");
    if (!ctx) return;
    if (dewpointChartInstance) dewpointChartInstance.destroy();

    const labels = [];
    const dewValues = [];
    const tempValues = [];
    for (let i = 0; i < Math.min(48, hourlyData.time.length); i += 3) {
      const d = new Date(hourlyData.time[i]);
      labels.push(
        d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
      );
      dewValues.push(hourlyData.dewpoint_2m[i]);
      tempValues.push(hourlyData.temperature_2m[i]);
    }

    dewpointChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Rosný bod (°C)",
            data: dewValues,
            borderColor: "#00bcd4",
            backgroundColor: "rgba(0, 188, 212, 0.2)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
          {
            label: "Teplota (°C)",
            data: tempValues,
            borderColor: "#ff9e42",
            backgroundColor: "rgba(255, 158, 66, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: "rgba(255,255,255,0.9)" } },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  /**
   * Stáhne a zobrazí data pocitové teploty
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   */
  function fetchApparentTemp(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=apparent_temperature,temperature_2m&timezone=auto&forecast_days=3`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.hourly) {
          const apparentTemp = data.hourly.apparent_temperature[0];
          const realTemp = data.hourly.temperature_2m[0];
          const diff = apparentTemp - realTemp;

          document.getElementById("apparent-temp-current").textContent =
            `${apparentTemp.toFixed(1)}°C`;
          document.getElementById("real-temp").textContent =
            realTemp.toFixed(1);
          document.getElementById("temp-difference").textContent =
            (diff >= 0 ? "+" : "") + diff.toFixed(1);

          renderApparentTempChart(data.hourly);
          
          // Update Theme based on real temperature (propagating theme to Advanced Data page)
          updateTheme(realTemp);
        }
      })
      .catch((err) =>
        console.error("Error fetching apparent temperature data:", err),
      );
  }

  /**
   * Vykreslí graf pocitové a skutečné teploty
   * @param {Object} hourlyData - Hodinová data teploty
   */
  function renderApparentTempChart(hourlyData) {
    const ctx = document.getElementById("apparentTempChart");
    if (!ctx) return;
    if (apparentTempChartInstance) apparentTempChartInstance.destroy();

    const labels = [];
    const apparentValues = [];
    const realValues = [];
    for (let i = 0; i < Math.min(48, hourlyData.time.length); i += 3) {
      const d = new Date(hourlyData.time[i]);
      labels.push(
        d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
      );
      apparentValues.push(hourlyData.apparent_temperature[i]);
      realValues.push(hourlyData.temperature_2m[i]);
    }

    apparentTempChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Pocitová (°C)",
            data: apparentValues,
            borderColor: "#9c27b0",
            backgroundColor: "rgba(156, 39, 176, 0.2)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
          {
            label: "Skutečná (°C)",
            data: realValues,
            borderColor: "#ff5722",
            backgroundColor: "rgba(255, 87, 34, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: "rgba(255,255,255,0.9)" } },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  /**
   * Stáhne a zobrazí data o oblačnosti
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   */
  function fetchCloudCover(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&timezone=auto&forecast_days=2`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.hourly) {
          const cloudTotal = data.hourly.cloud_cover[0];
          const cloudLow = data.hourly.cloud_cover_low[0];
          const cloudMid = data.hourly.cloud_cover_mid[0];
          const cloudHigh = data.hourly.cloud_cover_high[0];

          document.getElementById("cloud-cover-current").textContent =
            `${cloudTotal}%`;
          document.getElementById("cloud-low").textContent = cloudLow;
          document.getElementById("cloud-mid").textContent = cloudMid;
          document.getElementById("cloud-high").textContent = cloudHigh;

          renderCloudCoverChart(data.hourly);
        }
      })
      .catch((err) => console.error("Error fetching cloud cover data:", err));
  }

  /**
   * Vykreslí graf oblačnosti
   * @param {Object} hourlyData - Hodinová data oblačnosti
   */
  function renderCloudCoverChart(hourlyData) {
    const ctx = document.getElementById("cloudCoverChart");
    if (!ctx) return;
    if (cloudCoverChartInstance) cloudCoverChartInstance.destroy();

    const labels = [];
    const cloudValues = [];
    for (let i = 0; i < Math.min(24, hourlyData.time.length); i += 2) {
      const d = new Date(hourlyData.time[i]);
      labels.push(
        d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
      );
      cloudValues.push(hourlyData.cloud_cover[i]);
    }

    cloudCoverChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Oblačnost (%)",
            data: cloudValues,
            borderColor: "#607d8b",
            backgroundColor: "rgba(96, 125, 139, 0.3)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  /**
   * Stáhne a zobrazí data sluneční radiace
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   */
  function fetchSolarRadiation(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=shortwave_radiation,direct_radiation&timezone=auto&forecast_days=2`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.hourly) {
          const currentSolar = data.hourly.shortwave_radiation[0];
          const currentDirect = data.hourly.direct_radiation[0];

          document.getElementById("solar-current").textContent =
            `${Math.round(currentSolar)} W/m²`;
          document.getElementById("solar-direct").textContent =
            Math.round(currentDirect);

          // Solar potential
          let potential, color;
          if (currentSolar > 800) {
            potential = "Výborná";
            color = "#ffc107";
          } else if (currentSolar > 400) {
            potential = "Dobrá";
            color = "#ff9e42";
          } else if (currentSolar > 100) {
            potential = "Mírná";
            color = "#ff5722";
          } else {
            potential = "Nízká";
            color = "#607d8b";
          }

          const badge = document.getElementById("solar-potential");
          badge.textContent = potential;
          badge.style.backgroundColor = color;

          renderSolarChart(data.hourly);
        }
      })
      .catch((err) =>
        console.error("Error fetching solar radiation data:", err),
      );
  }

  /**
   * Vykreslí graf sluneční radiace
   * @param {Object} hourlyData - Hodinová data radiace
   */
  function renderSolarChart(hourlyData) {
    const ctx = document.getElementById("solarChart");
    if (!ctx) return;
    if (solarChartInstance) solarChartInstance.destroy();

    const labels = [];
    const solarValues = [];
    for (let i = 0; i < Math.min(24, hourlyData.time.length); i += 1) {
      const d = new Date(hourlyData.time[i]);
      labels.push(d.toLocaleTimeString("cs-CZ", { hour: "2-digit" }));
      solarValues.push(hourlyData.shortwave_radiation[i]);
    }

    solarChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Záření (W/m²)",
            data: solarValues,
            backgroundColor: "rgba(255, 193, 7, 0.6)",
            borderColor: "#ffc107",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  /**
   * Stáhne a zobrazí data o sněhu
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   */
  function fetchSnowDepth(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=snowfall_sum&hourly=snow_depth&timezone=auto&forecast_days=7`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.hourly && data.daily) {
          const currentSnowDepth = data.hourly.snow_depth[0];
          const newSnow = data.daily.snowfall_sum[0];

          document.getElementById("snow-depth-current").textContent =
            currentSnowDepth > 0 ? `${currentSnowDepth.toFixed(0)} cm` : "0 cm";
          document.getElementById("snow-new").textContent =
            newSnow > 0 ? `${newSnow.toFixed(1)} cm` : "0 cm";

          renderSnowChart(data.daily);
        }
      })
      .catch((err) => console.error("Error fetching snow data:", err));
  }

  /**
   * Vykreslí graf sněžení
   * @param {Object} dailyData - Denní data sněhu
   */
  function renderSnowChart(dailyData) {
    const ctx = document.getElementById("snowChart");
    if (!ctx) return;
    if (snowChartInstance) snowChartInstance.destroy();

    const labels = dailyData.time.map((date) => {
      const d = new Date(date);
      return d.toLocaleDateString("cs-CZ", {
        weekday: "short",
        day: "numeric",
      });
    });

    snowChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Sněžení (cm)",
            data: dailyData.snowfall_sum,
            backgroundColor: "rgba(0, 188, 212, 0.6)",
            borderColor: "#00bcd4",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  /**
   * Aktualizuje denní shrnutí statistik počasí
   * @param {Object} daily - Denní data počasí
   */
  function updateStatsDailySummary(daily) {
    const min = daily.temperature_2m_min[0];
    const max = daily.temperature_2m_max[0];
    const rain = daily.precipitation_sum[0];
    const uv = daily.uv_index_max[0];

    const tempMinEl = document.getElementById("stats-temp-min");
    const tempMaxEl = document.getElementById("stats-temp-max");
    const rainEl = document.getElementById("stats-rain-today");
    const uvMaxEl = document.getElementById("stats-uv-max");
    const uvLevelEl = document.getElementById("stats-uv-level");

    if (tempMinEl) tempMinEl.textContent = `${min.toFixed(1)}°C`;
    if (tempMaxEl) tempMaxEl.textContent = `${max.toFixed(1)}°C`;
    if (rainEl) rainEl.textContent = `${rain.toFixed(1)} mm`;

    if (uvMaxEl && uvLevelEl) {
      uvMaxEl.textContent = uv.toFixed(1);
      const level = getUVLevel(uv);
      uvLevelEl.textContent = level.level;
      uvLevelEl.style.backgroundColor = level.color;
    }
  }

  /**
   * Vykreslí týdenní graf statistik
   * @param {Object} daily - Denní data počasí
   */
  function renderStatsWeeklyChart(daily) {
    const ctx = document.getElementById("stats-weekly-chart");
    if (!ctx) return;
    
    // Robust destroy: check if chart exists on canvas
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    const daysCount = Math.min(7, daily.time.length);
    const labels = [];
    const maxTemps = [];
    const minTemps = [];
    const rains = [];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(daily.time[i]);
      labels.push(
        d.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric" }),
      );
      maxTemps.push(daily.temperature_2m_max[i]);
      minTemps.push(daily.temperature_2m_min[i]);
      rains.push(daily.precipitation_sum[i]);
    }

    statsWeeklyChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Max (°C)",
            data: maxTemps,
            borderColor: "#ff9e42",
            backgroundColor: "rgba(255, 158, 66, 0.2)",
            borderWidth: 3,
            tension: 0.4,
            fill: true,
          },
          {
            label: "Min (°C)",
            data: minTemps,
            borderColor: "#00bcd4",
            backgroundColor: "rgba(0, 188, 212, 0.2)",
            borderWidth: 2,
            tension: 0.4,
            fill: false,
          },
          {
            label: "Srážky (mm)",
            data: rains,
            borderColor: "#4caf50",
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "rgba(255,255,255,0.9)" } },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y1: {
            position: "right",
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  /**
   * Vykreslí graf normálních teplot
   * @param {Object} daily - Denní data počasí
   */
  function renderStatsNormalChart(daily) {
    const ctx = document.getElementById("stats-normal-chart");
    if (!ctx) return;
    
    // Robust destroy
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    const len = daily.time.length;
    if (!len) return;

    const last7Count = Math.min(7, len);
    const last30Count = Math.min(30, len);

    let sum7 = 0;
    for (let i = 0; i < last7Count; i++) {
      sum7 += daily.temperature_2m_max[i];
    }
    const avg7 = sum7 / last7Count;

    let sum30 = 0;
    for (let i = 0; i < last30Count; i++) {
      sum30 += daily.temperature_2m_max[i];
    }
    const avg30 = sum30 / last30Count;

    statsNormalChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Posledních 7 dní", "Posledních 30 dní"],
        datasets: [
          {
            label: "Průměrná max. teplota (°C)",
            data: [avg7, avg30],
            backgroundColor: [
              "rgba(255, 158, 66, 0.7)",
              "rgba(0, 188, 212, 0.7)",
            ],
            borderColor: ["#ff9e42", "#00bcd4"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  /**
   * Vykreslí istorický graf poslední 30 dnů
   * @param {Object} daily - Denní data počasí
   */
  function renderStatsHistoryChart(daily) {
    const ctx = document.getElementById("stats-history-chart");
    if (!ctx) return;
    
    // Robust destroy
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    const len = daily.time.length;
    if (!len) return;

    const take = Math.min(30, len);
    const start = len - take;

    const labels = [];
    const meanTemps = [];
    const rains = [];

    for (let i = start; i < len; i++) {
      const d = new Date(daily.time[i]);
      labels.push(
        d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" }),
      );
      const min = daily.temperature_2m_min[i];
      const max = daily.temperature_2m_max[i];
      meanTemps.push((min + max) / 2);
      rains.push(daily.precipitation_sum[i]);
    }

    statsHistoryChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Průměrná teplota (°C)",
            data: meanTemps,
            borderColor: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.15)",
            borderWidth: 3,
            tension: 0.4,
            fill: true,
          },
          {
            label: "Srážky (mm)",
            data: rains,
            borderColor: "#4caf50",
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "rgba(255,255,255,0.9)" } },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y1: {
            position: "right",
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  /**
   * Inicializuje všechna pokročilá meteorologická data
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   * @param {string} name - Název místa
   */
  function initAdvancedWeatherData(lat, lon, name) {
    const titleElement = document.querySelector("h1.fw-light");
    if (
      titleElement &&
      titleElement.textContent.includes("Další meteorologická data")
    ) {
      titleElement.textContent = `Další meteorologická data - ${name}`;
    }

    syncAmbientWeather(lat, lon);

    // Original 5 sections
    fetchUVIndex(lat, lon);

    fetchPressureData(lat, lon);
    fetchRainfallData(lat, lon);
    fetchWindData(lat, lon);

    // New 7 sections
    fetchVisibility(lat, lon);
    fetchDewPoint(lat, lon);
    fetchApparentTemp(lat, lon);
    fetchCloudCover(lat, lon);
    fetchSolarRadiation(lat, lon);
    fetchSnowDepth(lat, lon);
  }

  /**
   * Inicializuje data pro stránku statistik
   * @param {number} lat - Zeměpisná šírka
   * @param {number} lon - Zeměpisná délka
   * @param {string} name - Název místa
   */
  function initStatsData(lat, lon, name) {
    const titleElement = document.querySelector("h1.fw-light");
    if (titleElement && titleElement.textContent.includes("Statistiky")) {
      titleElement.textContent = `📊 Statistiky & trendy - ${name}`;
    }

    const loadingEl = document.getElementById("stats-loading");
    const errorEl = document.getElementById("stats-error");
    if (loadingEl) loadingEl.classList.remove("d-none");
    if (errorEl) errorEl.classList.add("d-none");

    syncAmbientWeather(lat, lon);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,uv_index_max&timezone=auto&past_days=30&forecast_days=7`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Data fetch failed");
        return res.json();
      })
      .then((data) => {
        const daily = data.daily;
        if (!daily) throw new Error("Missing daily data");

        updateStatsDailySummary(daily);
        renderStatsWeeklyChart(daily);
        renderStatsNormalChart(daily);
        renderStatsHistoryChart(daily);

        if (loadingEl) loadingEl.classList.add("d-none");
      })
      .catch((err) => {
        console.error("Error fetching stats data:", err);
        if (loadingEl) loadingEl.classList.add("d-none");
        if (errorEl) errorEl.classList.remove("d-none");
      });
  }

  // Search logic for Advanced Data Page
  const advancedSearchInput = document.getElementById("advanced-search-input");
  const advancedSearchButton = document.getElementById(
    "advanced-search-button",
  );
  const advancedSuggestionsList = document.getElementById(
    "advanced-suggestions-list",
  );

  if (advancedSearchButton) {
    advancedSearchButton.addEventListener("click", () =>
      handleSearch(advancedSearchInput, "advanced"),
    );
  }

  if (advancedSearchInput) {
    advancedSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch(advancedSearchInput, "advanced");
    });

    advancedSearchInput.addEventListener(
      "input",
      debounce((e) => {
        fetchSuggestions(e.target.value.trim(), "advanced");
      }, 300),
    );
  }

  // Update handleSearch to support advanced & statistics pages
  const originalHandleSearch = handleSearch;
  handleSearch = function (inputElement, isHistory) {
    const query = inputElement ? inputElement.value.trim() : "";
    if (!query) return;

    const suggestionsElement =
      isHistory === "advanced"
        ? advancedSuggestionsList
        : isHistory === "stats"
          ? statsSuggestionsList
          : isHistory === "time-machine"
            ? timeMachineSuggestionsList
            : isHistory
              ? historySuggestionsList
              : suggestionsList;

    // Hide suggestions
    if (suggestionsElement) suggestionsElement.classList.add("d-none");

    // Fetch coordinates
    fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=cs&format=json`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const name = result.name;
          const lat = result.latitude;
          const lon = result.longitude;

          // Save search result state
          const searchData = { name: name, lat: lat, lon: lon };
          localStorage.setItem("lastSearchData", JSON.stringify(searchData));
          saveLocation("search-result");
          
          // Update UI state properly
          renderLocationButtons();

          // Update input
          if (inputElement) {
              inputElement.value = name;
              inputElement.classList.add("active");
          }

          // Trigger data load
          if (isHistory === "advanced") {
            initAdvancedWeatherData(lat, lon, name);
          } else if (isHistory === "stats") {
            initStatsData(lat, lon, name);
          } else if (isHistory === "time-machine") {
            initTimeMachineData(lat, lon, name);
          } else if (isHistory === "astro") {
            initAstroData(lat, lon, name);
          } else if (isHistory) {
            fetchHistoricalData(lat, lon, name);
          } else {
            fetchWeather(lat, lon, `Počasí ${name}`);
          }
        } else {
          alert("Místo nebylo nalezeno. Zkuste to prosím znovu.");
        }
      })
      .catch((error) => {
        console.error("Error fetching location:", error);
        alert("Chyba při vyhledávání místa.");
      });
  };

  // Update fetchSuggestions to support advanced & statistics pages
  const originalFetchSuggestions = fetchSuggestions;
  fetchSuggestions = function (query, isHistory) {
    const inputElement =
      isHistory === "advanced"
        ? advancedSearchInput
        : isHistory === "stats"
          ? statsSearchInput
          : isHistory === "time-machine"
            ? timeMachineSearchInput
            : isHistory === "astro"
              ? astroSearchInput
              : isHistory
                ? historySearchInput
                : searchInput;

    const suggestionsElement =
      isHistory === "advanced"
        ? advancedSuggestionsList
        : isHistory === "stats"
          ? statsSuggestionsList
          : isHistory === "time-machine"
            ? timeMachineSuggestionsList
            : isHistory === "astro"
              ? astroSuggestionsList
              : isHistory
                ? historySuggestionsList
                : suggestionsList;

    if (!suggestionsElement) return;

    if (query.length < 2) {
      suggestionsElement.classList.add("d-none");
      suggestionsElement.innerHTML = "";
      return;
    }

    fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=cs&format=json`,
    )
      .then((response) => response.json())
      .then((data) => {
        suggestionsElement.innerHTML = "";
        if (data.results && data.results.length > 0) {
          suggestionsElement.classList.remove("d-none");
          data.results.forEach((place) => {
            const item = document.createElement("div");
            item.className = "suggestion-item";

            let details = [];
            if (place.admin2) details.push(place.admin2);
            if (place.admin1) details.push(place.admin1);
            if (place.country) details.push(place.country);

            const detailsStr = details.join(", ");

            item.innerHTML = `
                            <span class="suggestion-name">${place.name}</span>
                            <span class="suggestion-details">${detailsStr}</span>
                        `;

            item.addEventListener("click", () => {
              if (inputElement) {
                  inputElement.value = place.name;
                  inputElement.classList.add("active");
              }
              suggestionsElement.classList.add("d-none");
              
              // Store for "Add Location" feature
              lastSearchedLocation = { name: place.name, lat: place.latitude, lon: place.longitude };
              enableAddButton(isHistory);

              // Persist search state
              const searchData = { name: place.name, lat: place.latitude, lon: place.longitude };
              localStorage.setItem("lastSearchData", JSON.stringify(searchData));
              saveLocation("search-result");
              
              // Update UI state properly
              renderLocationButtons();

              // Trigger data load
              if (isHistory === "advanced") {
                initAdvancedWeatherData(place.latitude, place.longitude, place.name);
              } else if (isHistory === "stats") {
                initStatsData(place.latitude, place.longitude, place.name);
              } else if (isHistory === "time-machine") {
                initTimeMachineData(place.latitude, place.longitude, place.name);
              } else if (isHistory === "astro") {
                initAstroData(place.latitude, place.longitude, place.name);
              } else if (isHistory) {
                fetchHistoricalData(place.latitude, place.longitude, place.name);
              } else {
                fetchWeather(place.latitude, place.longitude, `Počasí ${place.name}`);
              }
            });

            suggestionsElement.appendChild(item);
          });
        } else {
          suggestionsElement.classList.add("d-none");
        }
      })
      .catch((err) => {
        console.error("Error fetching suggestions:", err);
      });
  };

  // Close advanced suggestions on click outside
  document.addEventListener("click", (e) => {
    if (advancedSearchInput && advancedSuggestionsList) {
      if (
        !advancedSearchInput.contains(e.target) &&
        !advancedSuggestionsList.contains(e.target)
      ) {
        advancedSuggestionsList.classList.add("d-none");
      }
    }
  });

  // Initial load for Advanced Data page
  if (document.getElementById("advanced-content")) {
    const saved = loadStoredLocation();
    const loc = getLocationData(saved);
    if (loc) {
        initAdvancedWeatherData(loc.lat, loc.lon, loc.name);
    }
  }

  // Initial load for Statistics page
  if (document.getElementById("stats-content")) {
    const saved = loadStoredLocation();
    const loc = getLocationData(saved);
    if (loc) {
        initStatsData(loc.lat, loc.lon, loc.name);
    }
  }
  // Logic for "Add Location" Button
  function enableAddButton(isHistory) {
      let btnId;
      if (isHistory === "advanced") btnId = "add-loc-advanced";
      else if (isHistory === "stats") btnId = "add-loc-stats";
      else if (isHistory === "time-machine") btnId = "add-loc-time";
      else if (isHistory === "astro") btnId = "add-loc-astro";
      else if (isHistory === true) btnId = "add-loc-hist";
      else btnId = "add-loc-main";
      
      const btn = document.getElementById(btnId);
      if (btn) btn.disabled = false;
  }
  
  function setupAddLocationButton(buttonId) {
      const btn = document.getElementById(buttonId);
      if (btn) {
          btn.addEventListener("click", () => {
              if (lastSearchedLocation) {
                  addCustomLocation(lastSearchedLocation);
                  btn.disabled = true; // Disable after adding
              }
          });
      }
  }
  
  // Setup all add buttons
  setupAddLocationButton("add-loc-main");
  setupAddLocationButton("add-loc-hist");
  setupAddLocationButton("add-loc-stats");
  setupAddLocationButton("add-loc-advanced");

  // --- Time Machine Logic ---
  let timeMachineChartInstance = null;
  const timeMachineSearchInput = document.getElementById(
    "time-machine-search-input",
  );
  const timeMachineSearchButton = document.getElementById(
    "time-machine-search-button",
  );
  const timeMachineSuggestionsList = document.getElementById(
    "time-machine-suggestions-list",
  );
  const historyDateInput = document.getElementById("history-date");

  // Search Listeners
  if (timeMachineSearchButton) {
    timeMachineSearchButton.addEventListener("click", () =>
      handleSearch(timeMachineSearchInput, "time-machine"),
    );
  }

  if (timeMachineSearchInput) {
    timeMachineSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch(timeMachineSearchInput, "time-machine");
    });

    timeMachineSearchInput.addEventListener(
      "input",
      debounce((e) => {
        fetchSuggestions(e.target.value.trim(), "time-machine");
      }, 300),
    );
  }

  // Close suggestions on click outside
  document.addEventListener("click", (e) => {
    if (timeMachineSearchInput && timeMachineSuggestionsList) {
      if (
        !timeMachineSearchInput.contains(e.target) &&
        !timeMachineSuggestionsList.contains(e.target)
      ) {
        timeMachineSuggestionsList.classList.add("d-none");
      }
    }
  });

  // Date Change Listener
  if (historyDateInput) {
    // Set default date to 1 year ago if empty
    if (!historyDateInput.value) {
      const today = new Date();
      const lastYear = new Date(
        today.getFullYear() - 1,
        today.getMonth(),
        today.getDate(),
      );
      historyDateInput.value = lastYear.toISOString().split("T")[0];
    }

    historyDateInput.addEventListener("change", () => {
      const saved = loadStoredLocation();
      const loc = getLocationData(saved);
      if (loc) {
        fetchTimeMachineData(loc.lat, loc.lon, historyDateInput.value);
      }
    });
  }

  /**
   * Inicializuje Stroj Času
   */
  function initTimeMachineData(lat, lon, name) {
    syncAmbientWeather(lat, lon);
    
    const titleElement = document.querySelector("h1.fw-light");
    if (titleElement && titleElement.textContent.includes("Stroj Času")) {
      // Just in case we want to update title
    }

    // Default date if not set
    if (historyDateInput && !historyDateInput.value) {
      const today = new Date();
      const lastYear = new Date(
        today.getFullYear() - 1,
        today.getMonth(),
        today.getDate(),
      );
      historyDateInput.value = lastYear.toISOString().split("T")[0];
    }
    
    if (historyDateInput) {
        fetchTimeMachineData(lat, lon, historyDateInput.value);
    }
  }

  /**
   * Stáhne a porovná data pro Stroj Času
   */
  function fetchTimeMachineData(lat, lon, dateString) {
    const loadingEl = document.getElementById("time-machine-loading");
    if (loadingEl) loadingEl.classList.remove("d-none");

    // Fetch Historical Data
    const histUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateString}&end_date=${dateString}&hourly=temperature_2m&timezone=auto`;

    // Fetch Current Forecast (for comparison)
    const currentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto&forecast_days=1`;

    Promise.all([
      fetch(histUrl).then((res) => res.json()),
      fetch(currentUrl).then((res) => res.json()),
    ])
      .then(([histData, currentData]) => {
        if (!histData.hourly || !currentData.hourly) {
          throw new Error("Incomplete data");
        }

        renderTimeMachineChart(histData.hourly, currentData.hourly, dateString);
        updateTimeMachineSummary(histData.hourly, currentData.hourly, dateString);

        if (loadingEl) loadingEl.classList.add("d-none");
      })
      .catch((err) => {
        console.error("Error fetching time machine data:", err);
        if (loadingEl) loadingEl.classList.add("d-none");
        alert("Nepodařilo se načíst historická data pro toto datum.");
      });
  }

  function updateTimeMachineSummary(histHourly, currentHourly, dateString) {
      // Calculate avg temp for "daytime" (e.g., 8:00 - 20:00) or daily max
      const getMax = (arr) => Math.max(...arr);
      
      const histMax = getMax(histHourly.temperature_2m);
      const currentMax = getMax(currentHourly.temperature_2m);

      document.getElementById("historical-temp-display").textContent = `${histMax.toFixed(1)}°C`;
      document.getElementById("current-temp-display").textContent = `${currentMax.toFixed(1)}°C`;
      
      const dateObj = new Date(dateString);
      document.getElementById("historical-date-display").textContent = dateObj.toLocaleDateString("cs-CZ");

      const diff = currentMax - histMax;
      const diffDisplay = document.getElementById("difference-display");
      
      if (diff > 1) {
          diffDisplay.innerHTML = `Dnes je o <span class="fw-bold text-warning">${diff.toFixed(1)}°C tepleji</span> než tehdy. 🔥`;
      } else if (diff < -1) {
          diffDisplay.innerHTML = `Dnes je o <span class="fw-bold text-info">${Math.abs(diff).toFixed(1)}°C chladněji</span> než tehdy. ❄️`;
      } else {
          diffDisplay.innerHTML = `Teploty jsou <span class="fw-bold">téměř stejné</span> jako tehdy. ⚖️`;
      }
  }

  function renderTimeMachineChart(histHourly, currentHourly, dateString) {
    const ctx = document.getElementById("timeMachineChart");
    if (!ctx) return;
    
    // Robust destroy
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    const labels = [];
    // Assume 24 hours
    for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
    }

    // Prepare data arrays (slice first 24h just in case)
    const histTemps = histHourly.temperature_2m.slice(0, 24);
    const currentTemps = currentHourly.temperature_2m.slice(0, 24);
    
    // Determine year for label
    const histYear = new Date(dateString).getFullYear();

    timeMachineChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Dnešní teplota (°C)",
            data: currentTemps,
            borderColor: "#ffffff",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6
          },
          {
            label: `Teplota ${histYear} (°C)`,
            data: histTemps,
            borderColor: "#0dcaf0", // Cyan/Info
            backgroundColor: "rgba(13, 202, 240, 0.05)",
            borderWidth: 3,
            borderDash: [5, 5],
            tension: 0.4,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 6
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
          legend: { labels: { color: "rgba(255,255,255,0.9)" } },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.8)",
            titleColor: "white",
            bodyColor: "white",
            callbacks: {
                title: (context) => {
                    return `${context[0].label} hodin`;
                }
            }
          },
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });
  }

  // Initial Check for Time Machine Page
  if (document.getElementById("time-machine-content")) {
    const saved = loadStoredLocation();
    const loc = getLocationData(saved);
    if (loc) {
        initTimeMachineData(loc.lat, loc.lon, loc.name);
    }
  }


  // --- Astro & UFO Logic ---
  const astroSearchInput = document.getElementById("astro-search-input");
  const astroSearchButton = document.getElementById("astro-search-button");
  const astroSuggestionsList = document.getElementById("astro-suggestions-list");

  // Search Listeners
  if (astroSearchButton) {
    astroSearchButton.addEventListener("click", () =>
      handleSearch(astroSearchInput, "astro"),
    );
  }

  if (astroSearchInput) {
    astroSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch(astroSearchInput, "astro");
    });

    astroSearchInput.addEventListener(
      "input",
      debounce((e) => {
        fetchSuggestions(e.target.value.trim(), "astro");
      }, 300),
    );
  }

  // Close suggestions on click outside
  document.addEventListener("click", (e) => {
    if (astroSearchInput && astroSuggestionsList) {
      if (
        !astroSearchInput.contains(e.target) &&
        !astroSuggestionsList.contains(e.target)
      ) {
        astroSuggestionsList.classList.add("d-none");
      }
    }
  });

  /**
   * Inicializuje Astro data
   */
  function initAstroData(lat, lon, name) {
    const titleElement = document.querySelector("h1.display-5");
    if (titleElement && titleElement.textContent.includes("Pozorování")) {
      // Could update title if needed
    }

    syncAmbientWeather(lat, lon);

    // 1. Star Visibility (Cloud Cover + Moon)
    fetchStarVisibility(lat, lon);

    // 2. Aurora (KP Index)
    fetchAuroraForecast(lat, lon);

    // 3. ISS Tracker
    initISSTracker(lat, lon);
  }

  function fetchStarVisibility(lat, lon) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover,visibility&daily=sunrise,sunset&timezone=auto&forecast_days=1`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
            if(!data.hourly) return;
            
            // Get current hour index
            const now = new Date();
            const hourIndex = now.getHours(); // Simple approx
            
            const cloudCover = data.hourly.cloud_cover[hourIndex];
            const visibility    = data.hourly.visibility[hourIndex] / 1000; // km
            
            // Moon Phase Calculation (re-use existing helper or approx)
            const moonInfo = getMoonPhase(); 
            // We need approximate illumination %
            // New Moon = 0%, Full Moon = 100%
            // getMoonPhase returns name/icon. Let's do a quick calc again or map names to %
            let moonIllumination = 50; // default
            if(moonInfo.name === "Nov") moonIllumination = 0;
            if(moonInfo.name === "Úplněk") moonIllumination = 100;
            if(moonInfo.name.includes("srpek")) moonIllumination = 25;
            if(moonInfo.name.includes("čtvrť")) moonIllumination = 50;
            if(moonInfo.name.includes("měsíc")) moonIllumination = 75;

            // Algorithm for Star Visibility Score (0-100)
            // 1. Cloud Cover is the biggest factor (invert: 0 clouds = 100 score)
            // 2. Visibility: higher is better
            // 3. Moon: New Moon is best (0%), Full moon washes out stars (100%)
            
            let score = 100 - cloudCover;
            
            // Penalize for moon light (only if few clouds)
            if (score > 50) {
                // If it's clear, moon matters. If cloudy, moon doesn't matter.
                score -= (moonIllumination * 0.2); // Moon can take away up to 20%
            }
            
            // Bonus for great visibility
            if (visibility > 20) score += 5;
            
            // Clamp
            score = Math.max(0, Math.min(100, Math.round(score)));
            
            // Start updating UI
            document.getElementById("star-score").textContent = `${score}%`;
            document.getElementById("astro-cloud").textContent = `${cloudCover}%`;
            document.getElementById("astro-moon").textContent = `${moonIllumination}%`;
            document.getElementById("astro-visibility").textContent = `${visibility.toFixed(1)} km`;
            
            const verdictEl = document.getElementById("star-verdict");
            if(score > 80) {
                verdictEl.textContent = "Fantastické podmínky! 🔭";
                verdictEl.style.color = "#4caf50";
            } else if (score > 60) {
                verdictEl.textContent = "Dobré podmínky. ✨";
                verdictEl.style.color = "#8bc34a";
            } else if (score > 40) {
                verdictEl.textContent = "Ušlo by to. ☁️";
                verdictEl.style.color = "#ffc107";
            } else {
                verdictEl.textContent = "Zůstaň doma, není vidět nic. 🚫";
                verdictEl.style.color = "#f44336";
            }

        })
        .catch(err => console.error("Star Viz Error", err));
  }

  function fetchAuroraForecast(lat, lon) {
      // Using NOAA SWPC estimated KP or similar public JSON
      // This URL often works for current observations
      const url = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json";
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
            // Data is array of objects { time_tag, kp_index, ... }
            // Get last entry
            if(data && data.length > 0) {
                const latest = data[data.length - 1];
                const kp = latest.kp_index;
                
                document.getElementById("astro-kp").textContent = kp.toFixed(1);
                
                // Update bar (KP goes roughly 0-9)
                const pct = (kp / 9) * 100;
                const bar = document.getElementById("kp-bar");
                bar.style.width = `${pct}%`;
                
                if(kp < 4) {
                    bar.className = "progress-bar bg-success";
                    document.getElementById("astro-aurora-text").textContent = "Klid. Polární záře není pravděpodobná.";
                } else if (kp < 6) {
                    bar.className = "progress-bar bg-warning";
                    document.getElementById("astro-aurora-text").textContent = "Zvýšená aktivita! Možná viditelnost na severním obzoru.";
                } else {
                    bar.className = "progress-bar bg-danger";
                    document.getElementById("astro-aurora-text").textContent = "GEOMAGNETICKÁ BOUŘE! 🚨 Sledujte oblohu!";
                }
            }
        })
        .catch(err => {
            console.error("Aurora API Error", err);
            document.getElementById("astro-kp").textContent = "?";
            document.getElementById("astro-aurora-text").textContent = "Data nedostupná.";
        });
  }

  let issMap = null;
  let issMarker = null;

  function initISSTracker(lat, lon) {
      // 1. Init Leaflet Map if not exists
      if(!issMap && document.getElementById("iss-map")) {
          issMap = L.map("iss-map").setView([0, 0], 3);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
              subdomains: 'abcd',
              maxZoom: 19
          }).addTo(issMap);
          
          const issIcon = L.icon({
              iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
              iconSize: [50, 30],
              iconAnchor: [25, 15],
          });
          
          issMarker = L.marker([0, 0], {icon: issIcon}).addTo(issMap);
      }

      // 2. Fetch Position Loop
      function updateISSPosition() {
          if(!document.getElementById("iss-map")) return; // Stop if left page
          
          fetch("https://api.wheretheiss.at/v1/satellites/25544")
            .then(res => res.json())
            .then(data => {
                const { latitude, longitude } = data;
                
                document.getElementById("iss-lat").textContent = latitude.toFixed(4);
                document.getElementById("iss-lon").textContent = longitude.toFixed(4);
                
                if(issMap && issMarker) {
                    issMarker.setLatLng([latitude, longitude]);
                    issMap.panTo([latitude, longitude]);
                }
            })
            .catch(err => console.error("ISS Error", err));
      }
      
      // Initial call
      updateISSPosition();
      // Interval
      // Clear previous interval if exists? ideally yes but for simplicity...
      // Let's just set one and hope user refreshes or we handle cleanup strictly in SPA, 
      // but here we are persistent.
      if(window.issInterval) clearInterval(window.issInterval);
      window.issInterval = setInterval(updateISSPosition, 5000);
  }

  // Initial Check for Astro Page
  if (document.getElementById("astro-content")) {
    const saved = loadStoredLocation();
    const loc = getLocationData(saved);
    if (loc) {
        initAstroData(loc.lat, loc.lon, loc.name);
    }
  }

  setupAddLocationButton("add-loc-astro");

  // Initial load
  refreshWeatherData();
});
