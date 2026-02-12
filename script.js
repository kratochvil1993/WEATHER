document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tempElement = document.getElementById('temperature');
    const conditionElement = document.getElementById('condition');
    const windElement = document.getElementById('wind-speed');
    const humidityElement = document.getElementById('humidity');
    const iconElement = document.getElementById('weather-icon');
    const dateElement = document.getElementById('last-updated');
    const cityTitleElement = document.querySelector('h1.fw-light');
    
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('weather-data');
    const errorElement = document.getElementById('error-message');

    const forecastTabs = document.getElementById('forecast-tabs');
    const forecastContent = document.getElementById('forecast-content');
    
    const hourlyTabs = document.getElementById('hourly-tabs');
    const hourlyContent = document.getElementById('hourly-content');

    const btnPlzen = document.getElementById('btn-plzen');
    const btnZelRuda = document.getElementById('btn-zel-ruda');
    const btnCheznovice = document.getElementById('btn-cheznovice');

    const sunriseElement = document.getElementById('sunrise');
    const sunsetElement = document.getElementById('sunset');
    const moonPhaseElement = document.getElementById('moon-phase');
    const moonIconElement = document.getElementById('moon-icon');

    // WMO Weather Codes mapping to Bootstrap Icons and Czech descriptions
    const weatherCodes = {
        0: { icon: 'bi-sun', desc: 'Jasno' },
        1: { icon: 'bi-sun', desc: 'Hlavně jasno' },
        2: { icon: 'bi-cloud-sun', desc: 'Polojasno' },
        3: { icon: 'bi-cloud', desc: 'Zataženo' },
        45: { icon: 'bi-cloud-fog', desc: 'Mlha' },
        48: { icon: 'bi-cloud-fog2', desc: 'Mrznoucí mlha' },
        51: { icon: 'bi-cloud-drizzle', desc: 'Slabé mrholení' },
        53: { icon: 'bi-cloud-drizzle', desc: 'Mrholení' },
        55: { icon: 'bi-cloud-drizzle-fill', desc: 'Silné mrholení' },
        61: { icon: 'bi-cloud-rain', desc: 'Slabý déšť' },
        63: { icon: 'bi-cloud-rain-fill', desc: 'Déšť' },
        65: { icon: 'bi-cloud-rain-heavy-fill', desc: 'Silný déšť' },
        71: { icon: 'bi-cloud-snow', desc: 'Slabé sněžení' },
        73: { icon: 'bi-cloud-snow', desc: 'Sněžení' },
        75: { icon: 'bi-cloud-snow-fill', desc: 'Silné sněžení' },
        80: { icon: 'bi-cloud-rain', desc: 'Přeháňky' },
        81: { icon: 'bi-cloud-rain-fill', desc: 'Silné přeháňky' },
        82: { icon: 'bi-cloud-rain-heavy-fill', desc: 'Průtrž mračen' },
        95: { icon: 'bi-cloud-lightning', desc: 'Bouřka' },
        96: { icon: 'bi-cloud-lightning-rain', desc: 'Bouřka s kroupami' },
        99: { icon: 'bi-cloud-lightning-rain-fill', desc: 'Silná bouřka s kroupami' }
    };

    // Background Image Mapping
    const weatherBackgrounds = {
        0: 'images/sunny.jpg',
        1: 'images/sunny.jpg',
        2: 'images/partly_cloudy.jpg',
        3: 'images/cloudy.jpg',
        45: 'images/cloudy.jpg',
        48: 'images/cloudy.jpg',
        51: 'images/rain.jpg',
        53: 'images/rain.jpg',
        55: 'images/rain.jpg',
        61: 'images/rain.jpg',
        63: 'images/rain.jpg',
        65: 'images/rain.jpg',
        71: 'images/snow.jpg',
        73: 'images/snow.jpg',
        75: 'images/snow.jpg',
        77: 'images/snow.jpg',
        80: 'images/rain.jpg',
        81: 'images/rain.jpg',
        82: 'images/rain.jpg',
        85: 'images/snow.jpg',
        86: 'images/snow.jpg',
        95: 'images/hail.jpg',
        96: 'images/hail.jpg',
        99: 'images/hail.jpg'
    };

    function updateBackground(code) {
        const bgContainer = document.querySelector('.video-background');
        const imagePath = weatherBackgrounds[code] || 'images/partly_cloudy.jpg'; // Fallback
        
        // Preload image to avoid flickering
        const img = new Image();
        img.src = imagePath;
        img.onload = () => {
             bgContainer.style.backgroundImage = `url('${imagePath}')`;
        };
    }

    function getWeatherInfo(code) {
        return weatherCodes[code] || { icon: 'bi-question-circle', desc: 'Neznámé' };
    }

    function updateCurrentWeather(current, daily) {
        // Update values
        tempElement.textContent = Math.round(current.temperature_2m);
        windElement.textContent = Math.round(current.wind_speed_10m);
        humidityElement.textContent = current.relative_humidity_2m;

        // Astronomy data
        if (daily && daily.sunrise && daily.sunset) {
            const sunriseDate = new Date(daily.sunrise[0]);
            const sunsetDate = new Date(daily.sunset[0]);
            sunriseElement.textContent = sunriseDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
            sunsetElement.textContent = sunsetDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

            const moonInfo = getMoonPhase();
            moonPhaseElement.textContent = moonInfo.name;
            moonIconElement.className = `bi ${moonInfo.icon} fs-4 mb-1`;
        }
        
        // Update Date
        const now = new Date();
        dateElement.textContent = now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

        // Update Icon and Description
        const weatherInfo = getWeatherInfo(current.weather_code);
        
        iconElement.className = `bi ${weatherInfo.icon} display-1 mb-3`;
        conditionElement.textContent = weatherInfo.desc;

        // Update Background
        updateBackground(current.weather_code);
    }

    function getMoonPhase() {
        const lp = 2551443;
        const now = new Date();
        const newMoon = new Date(1970, 0, 7, 20, 35, 0);
        const phase = ((now.getTime() - newMoon.getTime()) / 1000) % lp;
        const phaseDays = Math.floor(phase / (24 * 3600)) + 1;

        if (phaseDays <= 1) return { name: 'Nov', icon: 'bi-moon' };
        if (phaseDays <= 6) return { name: 'Dorůstající srpek', icon: 'bi-moon' };
        if (phaseDays <= 8) return { name: 'První čtvrť', icon: 'bi-moon-stars' };
        if (phaseDays <= 13) return { name: 'Dorůstající měsíc', icon: 'bi-moon-stars-fill' };
        if (phaseDays <= 16) return { name: 'Úplněk', icon: 'bi-moon-fill' };
        if (phaseDays <= 21) return { name: 'Couvající měsíc', icon: 'bi-moon-stars-fill' };
        if (phaseDays <= 23) return { name: 'Poslední čtvrť', icon: 'bi-moon-stars' };
        if (phaseDays <= 28) return { name: 'Ubývající srpek', icon: 'bi-moon' };
        return { name: 'Nov', icon: 'bi-moon' };
    }

    function updateForecast(daily) {
        forecastTabs.innerHTML = '';
        forecastContent.innerHTML = '';

        const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

        daily.time.forEach((time, index) => {
            const date = new Date(time);
            const dayName = days[date.getDay()];
            const dayDate = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
            
            const isActive = index === 0 ? 'active' : '';
            const isShowActive = index === 0 ? 'show active' : '';

            // Create Tab
            const tabId = `day-${index}`;
            const tabItem = document.createElement('li');
            tabItem.className = 'nav-item';
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

            const contentItem = document.createElement('div');
            contentItem.className = `tab-pane fade ${isShowActive} h-100`;
            contentItem.id = tabId;
            contentItem.role = 'tabpanel';
            contentItem.setAttribute('aria-labelledby', `${tabId}-tab`);
            
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

    function updateHourlyForecast(hourly) {
        hourlyTabs.innerHTML = '';
        hourlyContent.innerHTML = '';
        
        const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
        
        // Helper to slice 24 hours
        for(let i=0; i<7; i++) {
            const startIndex = i * 24;
            const endIndex = startIndex + 24;
            
            // Get date from first hour of the chunk
            const firstHourTime = hourly.time[startIndex];
            const date = new Date(firstHourTime);
            const dayName = days[date.getDay()];
            
            // Generate shorter day name or just day if needed, keeping logic consistent
            // const dayDate = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });

            const isActive = i === 0 ? 'active' : '';
            const isShowActive = i === 0 ? 'show active' : '';

            // Create Tab
            const tabId = `hourly-day-${i}`;
            const tabItem = document.createElement('li');
            tabItem.className = 'nav-item';
            tabItem.innerHTML = `
                 <button class="nav-link ${isActive} d-flex flex-column align-items-center" id="${tabId}-tab" data-bs-toggle="pill" data-bs-target="#${tabId}" type="button" role="tab" aria-controls="${tabId}" aria-selected="${i === 0}">
                    <span class="fw-bold">${dayName}</span>
                </button>
            `;
            hourlyTabs.appendChild(tabItem);

            // Create Content
            const contentItem = document.createElement('div');
            contentItem.className = `tab-pane fade ${isShowActive}`;
            contentItem.id = tabId;
            contentItem.role = 'tabpanel';
            contentItem.setAttribute('aria-labelledby', `${tabId}-tab`);

            // Build scrollable list
            let hourlyHtml = '<div class="hourly-scroll d-flex">';
            
            const now = new Date();

            for(let j=startIndex; j<endIndex; j++) {
                const time = new Date(hourly.time[j]);
                
                // If it's the current day (index 0) and time is in past (more than 1 hour ago), skip
                // Logic: Show from current hour onwards.
                // Simple threshold: if timestamp < now - 1 hour, skip.
                if (i === 0 && time.getTime() < now.getTime() - 3600000) { 
                   continue;
                }

                const hour = time.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
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
            hourlyHtml += '</div>';
            
            contentItem.innerHTML = hourlyHtml;
            hourlyContent.appendChild(contentItem);
            
            // Enable drag scrolling for the new container
            const slider = contentItem.querySelector('.hourly-scroll');
            enableDragScroll(slider);
        }
    }

    function enableDragScroll(slider) {
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Scroll-fast
            slider.scrollLeft = scrollLeft - walk;
        });
    }

    function fetchWeather(lat, lon, title) {
        // Reset UI
        loadingElement.classList.remove('d-none');
        contentElement.classList.add('d-none');
        errorElement.classList.add('d-none');
        cityTitleElement.textContent = title;

        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;

        fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateCurrentWeather(data.current, data.daily);
            updateForecast(data.daily);
            updateHourlyForecast(data.hourly);
            
            loadingElement.classList.add('d-none');
            contentElement.classList.remove('d-none');

            // Initialize/Update Map
            initMap(lat, lon);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            loadingElement.classList.add('d-none');
            errorElement.classList.remove('d-none');
             document.querySelector('#forecast-content .spinner-border').parentElement.innerHTML = '<p class="text-center text-danger">Chyba načítání předpovědi</p>';
             document.querySelector('#hourly-content .spinner-border').parentElement.innerHTML = '<p class="text-center text-danger">Chyba načítání předpovědi</p>';
        });
    }
    

    // Event Listeners for Buttons (Only if they exist)
    function updateActiveButton(activeBtn) {
        [btnPlzen, btnZelRuda, btnCheznovice].forEach(btn => {
            if (btn) {
                if (btn === activeBtn) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }

    if (btnPlzen) {
        btnPlzen.addEventListener('click', () => {
            updateActiveButton(btnPlzen);
            fetchWeather(49.7475, 13.3776, 'Počasí v Plzni');
        });
    }

    if (btnZelRuda) {
        btnZelRuda.addEventListener('click', () => {
            updateActiveButton(btnZelRuda);
            fetchWeather(49.1356, 13.2366, 'Počasí Železná Ruda');
        });
    }

    if (btnCheznovice) {
        btnCheznovice.addEventListener('click', () => {
            updateActiveButton(btnCheznovice);
            fetchWeather(49.7789, 13.7854, 'Počasí v Cheznovicích');
        });
    }

    // Search logic for Index Page
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const suggestionsList = document.getElementById('suggestions-list');

    // Search logic for History Page (Teploty)
    const historySearchInput = document.getElementById('history-search-input');
    const historySearchButton = document.getElementById('history-search-button');
    const historySuggestionsList = document.getElementById('history-suggestions-list');

    // Search logic for Statistics Page
    const statsSearchInput = document.getElementById('stats-search-input');
    const statsSearchButton = document.getElementById('stats-search-button');
    const statsSuggestionsList = document.getElementById('stats-suggestions-list');
    
    let debounceTimer;
    let chartInstanceMean = null;
    let chartInstanceMax = null;
    let weatherMap = null;
    let radarLayer = null;

    let mapInitialized = false;

    function initMap(lat, lon) {
        const mapContainer = document.getElementById('weather-map');
        if (!mapContainer) return;
        
        if (weatherMap) {
            weatherMap.setView([lat, lon], 8);
            setTimeout(() => {
                weatherMap.invalidateSize();
                updateRadarLayer();
            }, 300);
            return;
        }

        // Use IntersectionObserver to initialize map only when it becomes visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !mapInitialized) {
                    mapInitialized = true;
                    
                    weatherMap = L.map('weather-map', {
                        minZoom: 4,
                        maxZoom: 10
                    }).setView([lat, lon], 6);

                    // Dark tile layer
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                        subdomains: 'abcd',
                        maxZoom: 20
                    }).addTo(weatherMap);

                    // Load radar after a delay to ensure map is properly sized
                    setTimeout(() => {
                        weatherMap.invalidateSize();
                        updateRadarLayer();
                    }, 300);
                    
                    observer.disconnect();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(mapContainer);
    }

    function updateRadarLayer() {
        if (!weatherMap) return;

        // Fetch latest RainViewer data
        fetch('https://api.rainviewer.com/public/weather-maps.json')
            .then(res => res.json())
            .then(data => {
                if (radarLayer) {
                    weatherMap.removeLayer(radarLayer);
                }

                // Use much older timestamp (6th from last) to ensure all tiles are available at all zoom levels
                // This prevents tiles from disappearing when zooming in
                const radarData = data.radar.past;
                const timeIndex = Math.max(0, radarData.length - 6);
                const latestTime = radarData[timeIndex].time;
                const radarUrl = `https://tilecache.rainviewer.com/v2/radar/${latestTime}/256/{z}/{x}/{y}/2/1_1.png`;

                console.log('Loading radar tiles from timestamp:', new Date(latestTime * 1000).toLocaleTimeString('cs-CZ'));
                console.log('Current map zoom level:', weatherMap.getZoom());
                console.log('Radar URL pattern:', radarUrl);

                radarLayer = L.tileLayer(radarUrl, {
                    opacity: 0.8,
                    maxZoom: 10,
                    maxNativeZoom: 6, // Match default zoom - tiles scale beyond this
                    minZoom: 4,
                    attribution: '&copy; <a href="https://www.rainviewer.com/api.html">RainViewer</a>'
                });

                radarLayer.on('tileerror', (error) => {
                    console.error('Tile load error at zoom', weatherMap.getZoom(), ':', error);
                });

                radarLayer.on('load', () => {
                    console.log('Radar layer loaded successfully at zoom', weatherMap.getZoom());
                });

                radarLayer.on('tileload', (e) => {
                    console.log('Tile loaded:', e.coords);
                });

                radarLayer.addTo(weatherMap);
                
                // Force redraw after adding layer
                setTimeout(() => {
                    if (weatherMap) weatherMap.invalidateSize();
                }, 100);
            })
            .catch(err => console.error('Error fetching radar data:', err));
    }

    function handleSearch(inputElement, isHistory = false) {
        const query = inputElement ? inputElement.value.trim() : '';
        if (!query) return;

        const suggestionsElement = isHistory ? historySuggestionsList : suggestionsList;
        
        // Hide suggestions
        if (suggestionsElement) suggestionsElement.classList.add('d-none');

        // Fetch coordinates
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=cs&format=json`)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    const name = result.name;
                    const lat = result.latitude;
                    const lon = result.longitude;
                    
                    // Update input
                    if (inputElement) inputElement.value = name; 

                    if (isHistory) {
                        fetchHistoricalData(lat, lon, name);
                    } else {
                        // Reset buttons on main page if needed
                        if (btnPlzen && btnZelRuda && btnCheznovice) {
                             [btnPlzen, btnZelRuda, btnCheznovice].forEach(btn => btn.classList.remove('active'));
                        }
                        fetchWeather(lat, lon, `Počasí ${name}`);
                    }
                } else {
                    alert('Místo nebylo nalezeno. Zkuste to prosím znovu.');
                }
            })
            .catch(error => {
                console.error('Error fetching location:', error);
                alert('Chyba při vyhledávání místa.');
            });
    }

    function fetchHistoricalData(lat, lon, name) {
        const chartCanvasMean = document.getElementById('temperatureChart');
        const chartCanvasMax = document.getElementById('maxTempChart');
        const loadingChart = document.getElementById('loading-chart');
        const errorChart = document.getElementById('error-chart');
        const titleElement = document.querySelector('h1.fw-light');

        if (!chartCanvasMean || !chartCanvasMax) return;

        titleElement.textContent = `Průměrné Teploty - ${name}`;
        loadingChart.classList.remove('d-none');
        errorChart.classList.add('d-none');
        chartCanvasMean.classList.add('d-none'); 
        chartCanvasMax.classList.add('d-none');

        // Fetch Data for 1993, 2000, 2023, 2024 and 2025
        // Using archive-api.open-meteo.com
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=1993-01-01&end_date=2025-12-31&daily=temperature_2m_mean,temperature_2m_max&timezone=auto`;

        fetch(url)
            .then(res => {
                if(!res.ok) throw new Error('Data fetch failed');
                return res.json();
            })
            .then(data => {
                loadingChart.classList.add('d-none');
                chartCanvasMean.classList.remove('d-none');
                chartCanvasMax.classList.remove('d-none');
                processAndRenderChart(data.daily);
            })
            .catch(err => {
                console.error(err);
                loadingChart.classList.add('d-none');
                errorChart.classList.remove('d-none');
            });
    }

    function processAndRenderChart(dailyData) {
        const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
        
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
                    if (tempMax > monthlyMaxes2025[month]) monthlyMaxes2025[month] = tempMax;
                } else if (year === 2024) {
                    if (tempMax > monthlyMaxes2024[month]) monthlyMaxes2024[month] = tempMax;
                } else if (year === 2023) {
                    if (tempMax > monthlyMaxes2023[month]) monthlyMaxes2023[month] = tempMax;
                } else if (year === 2000) {
                    if (tempMax > monthlyMaxes2000[month]) monthlyMaxes2000[month] = tempMax;
                } else if (year === 1993) {
                    if (tempMax > monthlyMaxes1993[month]) monthlyMaxes1993[month] = tempMax;
                }
            }
        });

        const calcAvg = (sums, counts) => sums.map((sum, i) => counts[i] > 0 ? (sum / counts[i]).toFixed(1) : null);
        const meanData2025 = calcAvg(monthlySums2025, monthlyCounts2025);
        const meanData2024 = calcAvg(monthlySums2024, monthlyCounts2024);
        const meanData2023 = calcAvg(monthlySums2023, monthlyCounts2023);
        const meanData2000 = calcAvg(monthlySums2000, monthlyCounts2000);
        const meanData1993 = calcAvg(monthlySums1993, monthlyCounts1993);

        // Clean up -Infinity if no data
        const cleanupMax = (arr) => arr.map(max => max === -Infinity ? null : max);
        const maxData2025 = cleanupMax(monthlyMaxes2025);
        const maxData2024 = cleanupMax(monthlyMaxes2024);
        const maxData2023 = cleanupMax(monthlyMaxes2023);
        const maxData2000 = cleanupMax(monthlyMaxes2000);
        const maxData1993 = cleanupMax(monthlyMaxes1993);

        // Render Mean Chart (White vs Cyan vs Purple vs Green vs Yellow) - 2025 vs 2024 vs 2023 vs 2000 vs 1993
        renderChart('temperatureChart', monthNames, [
            {
                label: '2025',
                data: meanData2025,
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: 'rgba(255,255,255,0.5)',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: '2024',
                data: meanData2024,
                borderColor: '#00bcd4', // Cyan
                backgroundColor: 'rgba(0, 188, 212, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#00bcd4',
                pointBorderColor: 'rgba(0, 188, 212, 0.5)',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: '2023',
                data: meanData2023,
                borderColor: '#9c27b0', // Purple
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#9c27b0',
                pointBorderColor: 'rgba(156, 39, 176, 0.5)',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: '2000',
                data: meanData2000,
                borderColor: '#4caf50', // Green
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#4caf50',
                pointBorderColor: 'rgba(76, 175, 80, 0.5)',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: '1993',
                data: meanData1993,
                borderColor: '#ffeb3b', // Yellow
                backgroundColor: 'rgba(255, 235, 59, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#ffeb3b',
                pointBorderColor: 'rgba(255, 235, 59, 0.5)',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            }
        ], 'mean');
        
        // Render Max Chart (Orange vs Cyan vs Purple vs Green vs Yellow) - 2025 vs 2024 vs 2023 vs 2000 vs 1993
        renderChart('maxTempChart', monthNames, [
            {
                label: '2025',
                data: maxData2025,
                borderColor: '#ff9e42', // Orange
                backgroundColor: 'rgba(255, 158, 66, 0.2)',
                borderWidth: 3,
                pointBackgroundColor: '#ff9e42',
                pointBorderColor: 'rgba(255, 158, 66, 0.5)',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: '2024',
                data: maxData2024,
                borderColor: '#00bcd4', // Cyan
                backgroundColor: 'rgba(0, 188, 212, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#00bcd4',
                pointBorderColor: 'rgba(0, 188, 212, 0.5)',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: '2023',
                data: maxData2023,
                borderColor: '#9c27b0', // Purple
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#9c27b0',
                pointBorderColor: 'rgba(156, 39, 176, 0.5)',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: '2000',
                data: maxData2000,
                borderColor: '#4caf50', // Green
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#4caf50',
                pointBorderColor: 'rgba(76, 175, 80, 0.5)',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: '1993',
                data: maxData1993,
                borderColor: '#ffeb3b', // Yellow
                backgroundColor: 'rgba(255, 235, 59, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#ffeb3b',
                pointBorderColor: 'rgba(255, 235, 59, 0.5)',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            }
        ], 'max');
    }

    function renderChart(canvasId, labels, datasets, type) {
         const ctx = document.getElementById(canvasId).getContext('2d');
         
         // Destroy existing instance based on type
         if (type === 'mean') {
             if (chartInstanceMean) chartInstanceMean.destroy();
         } else if (type === 'max') {
             if (chartInstanceMax) chartInstanceMax.destroy();
         }

         // Note: Canvas gradients need the context, so they are best handled inside the dataset config or here if simple.
         // For complexity, we pass simple colors in dataset config above.
         // If we strictly want the specific gradient from before, we'd need to recreate it here for each dataset opacity.
         // Given the requirements, solid colors/simple rgba fills are cleaner for multi-line.

         const newChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white', font: { family: 'Inter', size: 14 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        bodyFont: { family: 'Inter' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.7)', font: { family: 'Inter' } },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: 'rgba(255,255,255,0.7)', font: { family: 'Inter' } },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
         });

         if (type === 'mean') {
             chartInstanceMean = newChart;
         } else {
             chartInstanceMax = newChart;
         }
    }

    // Debounce function
    function debounce(func, delay) {
        return function(...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Fetch Suggestions
    function fetchSuggestions(query, isHistory = false) {
        const inputElement = isHistory ? historySearchInput : searchInput;
        const suggestionsElement = isHistory ? historySuggestionsList : suggestionsList;

        if (!suggestionsElement) return;
        
        if (query.length < 2) {
            suggestionsElement.classList.add('d-none');
            suggestionsElement.innerHTML = '';
            return;
        }

        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=cs&format=json`)
            .then(response => response.json())
            .then(data => {
                suggestionsElement.innerHTML = '';
                if (data.results && data.results.length > 0) {
                    suggestionsElement.classList.remove('d-none');
                    data.results.forEach(place => {
                        const item = document.createElement('div');
                        item.className = 'suggestion-item';
                        
                        let details = [];
                        if (place.admin2) details.push(place.admin2);
                        if (place.admin1) details.push(place.admin1);
                        if (place.country) details.push(place.country);
                        
                        const detailsStr = details.join(', ');

                        item.innerHTML = `
                            <span class="suggestion-name">${place.name}</span>
                            <span class="suggestion-details">${detailsStr}</span>
                        `;

                        item.addEventListener('click', () => {
                            if (inputElement) inputElement.value = place.name;
                            suggestionsElement.classList.add('d-none');
                            
                           if (isHistory) {
                               fetchHistoricalData(place.latitude, place.longitude, place.name);
                           } else {
                                fetchWeather(place.latitude, place.longitude, `Počasí ${place.name}`);
                                if (btnPlzen && btnZelRuda && btnCheznovice) {
                                    [btnPlzen, btnZelRuda, btnCheznovice].forEach(btn => btn.classList.remove('active'));
                                }
                           }
                        });

                        suggestionsElement.appendChild(item);
                    });
                } else {
                    suggestionsElement.classList.add('d-none');
                }
            })
            .catch(err => {
                console.error('Error fetching suggestions:', err);
            });
    }

    // Main Search Listeners
    if (searchButton) {
        searchButton.addEventListener('click', () => handleSearch(searchInput, false));
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch(searchInput, false);
        });

        searchInput.addEventListener('input', debounce((e) => {
            fetchSuggestions(e.target.value.trim(), false);
        }, 300));
    }

    // History Search Listeners (Teploty Page)
    if (historySearchButton) {
        historySearchButton.addEventListener('click', () => handleSearch(historySearchInput, true));
    }

    if (historySearchInput) {
        historySearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch(historySearchInput, true);
        });

        historySearchInput.addEventListener('input', debounce((e) => {
            fetchSuggestions(e.target.value.trim(), true);
        }, 300));
    }

    // Statistics Search Listeners (Statistiky Page)
    if (statsSearchButton) {
        statsSearchButton.addEventListener('click', () => handleSearch(statsSearchInput, 'stats'));
    }

    if (statsSearchInput) {
        statsSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch(statsSearchInput, 'stats');
        });

        statsSearchInput.addEventListener('input', debounce((e) => {
            fetchSuggestions(e.target.value.trim(), 'stats');
        }, 300));
    }

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
        // Main page suggestions
        if (searchInput && suggestionsList) {
            if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.classList.add('d-none');
            }
        }
        // History page suggestions
        if (historySearchInput && historySuggestionsList) {
            if (!historySearchInput.contains(e.target) && !historySuggestionsList.contains(e.target)) {
                historySuggestionsList.classList.add('d-none');
            }
        }
        // Statistics page suggestions
        if (statsSearchInput && statsSuggestionsList) {
            if (!statsSearchInput.contains(e.target) && !statsSuggestionsList.contains(e.target)) {
                statsSuggestionsList.classList.add('d-none');
            }
        }
    });

    // Side Menu Logic
    const menuToggle = document.getElementById('menu-toggle');
    const sidePanel = document.getElementById('side-panel');
    const menuClose = document.getElementById('menu-close');

    if (menuToggle && sidePanel && menuClose) {
        function toggleMenu() {
            sidePanel.classList.toggle('open');
        }

        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        menuClose.addEventListener('click', (e) => {
            e.stopPropagation();
            sidePanel.classList.remove('open');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (sidePanel.classList.contains('open') && !sidePanel.contains(e.target) && e.target !== menuToggle) {
                 sidePanel.classList.remove('open');
            }
        });
    }

    // Initial Fetch (Plzeň) - Only on main page if weather elements exist
    if (document.getElementById('weather-data')) {
        fetchWeather(49.7475, 13.3776, 'Počasí v Plzni');
    }
    
    // Initial Chart (Prague/Plzeň default) - Only on Teploty page
    if (document.getElementById('temperatureChart')) {
         // Default to Plzeň for consistency
         fetchHistoricalData(49.7475, 13.3776, 'Plzeň');
    }

    // ========== ADVANCED WEATHER DATA SECTION ==========
    // Chart instances for advanced data
    let uvChartInstance = null;

    let pressureChartInstance = null;
    let rainfallChartInstance = null;
    let windRoseChartInstance = null;

    // Helper function to get UV level and color
    function getUVLevel(uvIndex) {
        if (uvIndex < 3) return { level: 'Nízký', color: '#4caf50', bg: 'rgba(76, 175, 80, 0.2)' };
        if (uvIndex < 6) return { level: 'Mírný', color: '#ffeb3b', bg: 'rgba(255, 235, 59, 0.2)' };
        if (uvIndex < 8) return { level: 'Vysoký', color: '#ff9e42', bg: 'rgba(255, 158, 66, 0.2)' };
        if (uvIndex < 11) return { level: 'Velmi vysoký', color: '#f44336', bg: 'rgba(244, 67, 54, 0.2)' };
        return { level: 'Extrémní', color: '#9c27b0', bg: 'rgba(156, 39, 176, 0.2)' };
    }



    // Helper function to get wind direction name
    function getWindDirection(degrees) {
        const directions = ['S', 'SV', 'V', 'JV', 'J', 'JZ', 'Z', 'SZ'];
        const index = Math.round(((degrees % 360) / 45)) % 8;
        return directions[index];
    }

    // Fetch UV Index data
    function fetchUVIndex(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&timezone=auto&forecast_days=7`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.daily) {
                    const currentUV = data.daily.uv_index_max[0];
                    const uvLevel = getUVLevel(currentUV);
                    
                    document.getElementById('uv-current').textContent = currentUV.toFixed(1);
                    const levelBadge = document.getElementById('uv-level');
                    levelBadge.textContent = uvLevel.level;
                    levelBadge.style.backgroundColor = uvLevel.color;
                    
                    renderUVChart(data.daily);
                }
            })
            .catch(err => console.error('Error fetching UV data:', err));
    }

    // Render UV Chart
    function renderUVChart(dailyData) {
        const ctx = document.getElementById('uvChart');
        if (!ctx) return;

        if (uvChartInstance) uvChartInstance.destroy();

        const labels = dailyData.time.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });
        });

        uvChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'UV Index',
                    data: dailyData.uv_index_max,
                    borderColor: '#ff9e42',
                    backgroundColor: 'rgba(255, 158, 66, 0.2)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ff9e42',
                    pointRadius: 5,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }



    // Fetch Pressure data
    function fetchPressureData(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=pressure_msl&timezone=auto&forecast_days=7`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.hourly) {
                    const currentPressure = data.hourly.pressure_msl[0];
                    const pressureIn3Hours = data.hourly.pressure_msl[3];
                    
                    document.getElementById('pressure-current').textContent = `${Math.round(currentPressure)} hPa`;
                    
                    // Determine pressure trend
                    const trendIcon = document.getElementById('pressure-trend-icon');
                    const trendText = document.getElementById('pressure-trend-text');
                    const diff = pressureIn3Hours - currentPressure;
                    
                    if (diff > 1) {
                        trendIcon.className = 'bi bi-arrow-up-circle-fill fs-3 me-2 text-success';
                        trendText.textContent = 'Stoupající';
                    } else if (diff < -1) {
                        trendIcon.className = 'bi bi-arrow-down-circle-fill fs-3 me-2 text-danger';
                        trendText.textContent = 'Klesající';
                    } else {
                        trendIcon.className = 'bi bi-arrow-left-right fs-3 me-2 text-info';
                        trendText.textContent = 'Stabilní';
                    }
                    
                    renderPressureChart(data.hourly);
                }
            })
            .catch(err => console.error('Error fetching pressure data:', err));
    }

    // Render Pressure Chart
    function renderPressureChart(hourlyData) {
        const ctx = document.getElementById('pressureChart');
        if (!ctx) return;

        if (pressureChartInstance) pressureChartInstance.destroy();

        // Show every 6 hours for readability
        const labels = [];
        const pressureValues = [];
        for (let i = 0; i < Math.min(168, hourlyData.time.length); i += 6) {
            const d = new Date(hourlyData.time[i]);
            labels.push(d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit' }));
            pressureValues.push(hourlyData.pressure_msl[i]);
        }

        pressureChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tlak (hPa)',
                    data: pressureValues,
                    borderColor: '#9c27b0',
                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                    borderWidth: 3,
                    pointBackgroundColor: '#9c27b0',
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }

    // Fetch Rainfall data
    function fetchRainfallData(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&timezone=auto&past_days=30&forecast_days=1`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.daily) {
                    const todayRain = data.daily.precipitation_sum[data.daily.precipitation_sum.length - 1];
                    const monthRain = data.daily.precipitation_sum.reduce((sum, val) => sum + val, 0);
                    
                    document.getElementById('rain-today').textContent = `${todayRain.toFixed(1)} mm`;
                    document.getElementById('rain-month').textContent = `${monthRain.toFixed(1)} mm`;
                    
                    renderRainfallChart(data.daily);
                }
            })
            .catch(err => console.error('Error fetching rainfall data:', err));
    }

    // Render Rainfall Chart
    function renderRainfallChart(dailyData) {
        const ctx = document.getElementById('rainfallChart');
        if (!ctx) return;

        if (rainfallChartInstance) rainfallChartInstance.destroy();

        // Aggregate by week for last 30 days
        const weekLabels = [];
        const weekRainfall = [];
        const daysPerWeek = 7;
        
        for (let i = 0; i < dailyData.time.length; i += daysPerWeek) {
            const startDate = new Date(dailyData.time[i]);
            weekLabels.push(startDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }));
            
            let weekSum = 0;
            for (let j = i; j < Math.min(i + daysPerWeek, dailyData.time.length); j++) {
                weekSum += dailyData.precipitation_sum[j];
            }
            weekRainfall.push(weekSum);
        }

        rainfallChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekLabels,
                datasets: [{
                    label: 'Srážky (mm)',
                    data: weekRainfall,
                    backgroundColor: 'rgba(0, 188, 212, 0.6)',
                    borderColor: '#00bcd4',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }

    // Fetch Wind data
    function fetchWindData(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m&timezone=auto&past_days=7&forecast_days=1`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.hourly) {
                    renderWindRose(data.hourly);
                    
                    // Calculate average wind speed
                    const avgSpeed = data.hourly.wind_speed_10m.reduce((sum, val) => sum + val, 0) / data.hourly.wind_speed_10m.length;
                    document.getElementById('wind-avg-speed').textContent = `${avgSpeed.toFixed(1)} km/h`;
                    
                    // Find dominant direction
                    const directionCounts = {};
                    data.hourly.wind_direction_10m.forEach(dir => {
                        const dirName = getWindDirection(dir);
                        directionCounts[dirName] = (directionCounts[dirName] || 0) + 1;
                    });
                    
                    const dominantDir = Object.keys(directionCounts).reduce((a, b) => 
                        directionCounts[a] > directionCounts[b] ? a : b
                    );
                    document.getElementById('wind-dominant-direction').textContent = dominantDir;
                }
            })
            .catch(err => console.error('Error fetching wind data:', err));
    }

    // Render Wind Rose (Polar Chart)
    function renderWindRose(hourlyData) {
        const ctx = document.getElementById('windRoseChart');
        if (!ctx) return;

        if (windRoseChartInstance) windRoseChartInstance.destroy();

        // Aggregate wind data by direction sectors (8 directions)
        const directions = ['S', 'SV', 'V', 'JV', 'J', 'JZ', 'Z', 'SZ'];
        const directionSpeeds = Array(8).fill(0);
        const directionCounts = Array(8).fill(0);

        hourlyData.wind_direction_10m.forEach((dir, i) => {
            const index = Math.round(((dir % 360) / 45)) % 8;
            directionSpeeds[index] += hourlyData.wind_speed_10m[i];
            directionCounts[index]++;
        });

        // Calculate average speed for each direction
        const avgSpeeds = directionSpeeds.map((speed, i) => 
            directionCounts[i] > 0 ? speed / directionCounts[i] : 0
        );

        windRoseChartInstance = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: directions,
                datasets: [{
                    label: 'Průměrná rychlost větru (km/h)',
                    data: avgSpeeds,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 159, 64, 0.5)',
                        'rgba(0, 188, 212, 0.5)',
                        'rgba(76, 175, 80, 0.5)'
                    ],
                    borderColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 206, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(153, 102, 255)',
                        'rgb(255, 159, 64)',
                        'rgb(0, 188, 212)',
                        'rgb(76, 175, 80)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    r: {
                        ticks: { color: 'rgba(255,255,255,0.7)', backdropColor: 'transparent' },
                        grid: { color: 'rgba(255,255,255,0.2)' },
                        pointLabels: { color: 'rgba(255,255,255,0.9)', font: { size: 14 } }
                    }
                }
            }
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

    // Fetch Visibility data
    function fetchVisibility(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=visibility&timezone=auto&forecast_days=3`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.hourly) {
                    const currentVis = data.hourly.visibility[0] / 1000; // Convert m to km
                    document.getElementById('visibility-current').textContent = `${currentVis.toFixed(1)} km`;
                    
                    // Visibility levels
                    let level, color;
                    if (currentVis >= 10) {
                        level = 'Výborná';
                        color = '#4caf50';
                    } else if (currentVis >= 4) {
                        level = 'Dobrá';
                        color = '#ffeb3b';
                    } else if (currentVis >= 1) {
                        level = 'Mírná';
                        color = '#ff9e42';
                    } else {
                        level = 'Špatná';
                        color = '#f44336';
                    }
                    
                    const badge = document.getElementById('visibility-level');
                    badge.textContent = level;
                    badge.style.backgroundColor = color;
                    
                    renderVisibilityChart(data.hourly);
                }
            })
            .catch(err => console.error('Error fetching visibility data:', err));
    }

    function renderVisibilityChart(hourlyData) {
        const ctx = document.getElementById('visibilityChart');
        if (!ctx) return;
        if (visibilityChartInstance) visibilityChartInstance.destroy();

        const labels = [];
        const visValues = [];
        for (let i = 0; i < Math.min(48, hourlyData.time.length); i += 3) {
            const d = new Date(hourlyData.time[i]);
            labels.push(d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }));
            visValues.push(hourlyData.visibility[i] / 1000);
        }

        visibilityChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Viditelnost (km)',
                    data: visValues,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleColor: 'white', bodyColor: 'white' }
                },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    }

    // Fetch Dew Point data
    function fetchDewPoint(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=dewpoint_2m,temperature_2m&timezone=auto&forecast_days=3`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.hourly) {
                    const currentDew = data.hourly.dewpoint_2m[0];
                    const currentTemp = data.hourly.temperature_2m[0];
                    
                    document.getElementById('dewpoint-current').textContent = `${currentDew.toFixed(1)}°C`;
                    document.getElementById('actual-temp').textContent = currentTemp.toFixed(1);
                    
                    // Comfort levels based on dew point
                    let comfort, color;
                    if (currentDew < 10) {
                        comfort = 'Suché';
                        color = '#00bcd4';
                    } else if (currentDew < 13) {
                        comfort = 'Velmi příjemné';
                        color = '#4caf50';
                    } else if (currentDew < 16) {
                        comfort = 'Příjemné';
                        color = '#8bc34a';
                    } else if (currentDew < 18) {
                        comfort = 'Pohodlné';
                        color = '#ffeb3b';
                    } else if (currentDew < 21) {
                        comfort = 'Dusné';
                        color = '#ff9e42';
                    } else {
                        comfort = 'Velmi dusné';
                        color = '#f44336';
                    }
                    
                    const badge = document.getElementById('dewpoint-comfort');
                    badge.textContent = comfort;
                    badge.style.backgroundColor = color;
                    
                    renderDewPointChart(data.hourly);
                }
            })
            .catch(err => console.error('Error fetching dew point data:', err));
    }

    function renderDewPointChart(hourlyData) {
        const ctx = document.getElementById('dewpointChart');
        if (!ctx) return;
        if (dewpointChartInstance) dewpointChartInstance.destroy();

        const labels = [];
        const dewValues = [];
        const tempValues = [];
        for (let i = 0; i < Math.min(48, hourlyData.time.length); i += 3) {
            const d = new Date(hourlyData.time[i]);
            labels.push(d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }));
            dewValues.push(hourlyData.dewpoint_2m[i]);
            tempValues.push(hourlyData.temperature_2m[i]);
        }

        dewpointChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Rosný bod (°C)',
                    data: dewValues,
                    borderColor: '#00bcd4',
                    backgroundColor: 'rgba(0, 188, 212, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Teplota (°C)',
                    data: tempValues,
                    borderColor: '#ff9e42',
                    backgroundColor: 'rgba(255, 158, 66, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, labels: { color: 'rgba(255,255,255,0.9)' } },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleColor: 'white', bodyColor: 'white' }
                },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    }

    // Fetch Apparent Temperature data
    function fetchApparentTemp(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=apparent_temperature,temperature_2m&timezone=auto&forecast_days=3`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.hourly) {
                    const apparentTemp = data.hourly.apparent_temperature[0];
                    const realTemp = data.hourly.temperature_2m[0];
                    const diff = apparentTemp - realTemp;
                    
                    document.getElementById('apparent-temp-current').textContent = `${apparentTemp.toFixed(1)}°C`;
                    document.getElementById('real-temp').textContent = realTemp.toFixed(1);
                    document.getElementById('temp-difference').textContent = (diff >= 0 ? '+' : '') + diff.toFixed(1);
                    
                    renderApparentTempChart(data.hourly);
                }
            })
            .catch(err => console.error('Error fetching apparent temperature data:', err));
    }

    function renderApparentTempChart(hourlyData) {
        const ctx = document.getElementById('apparentTempChart');
        if (!ctx) return;
        if (apparentTempChartInstance) apparentTempChartInstance.destroy();

        const labels = [];
        const apparentValues = [];
        const realValues = [];
        for (let i = 0; i < Math.min(48, hourlyData.time.length); i += 3) {
            const d = new Date(hourlyData.time[i]);
            labels.push(d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }));
            apparentValues.push(hourlyData.apparent_temperature[i]);
            realValues.push(hourlyData.temperature_2m[i]);
        }

        apparentTempChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pocitová (°C)',
                    data: apparentValues,
                    borderColor: '#9c27b0',
                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Skutečná (°C)',
                    data: realValues,
                    borderColor: '#ff5722',
                    backgroundColor: 'rgba(255, 87, 34, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, labels: { color: 'rgba(255,255,255,0.9)' } },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleColor: 'white', bodyColor: 'white' }
                },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    }

    // Fetch Cloud Cover data
    function fetchCloudCover(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&timezone=auto&forecast_days=2`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.hourly) {
                    const cloudTotal = data.hourly.cloud_cover[0];
                    const cloudLow = data.hourly.cloud_cover_low[0];
                    const cloudMid = data.hourly.cloud_cover_mid[0];
                    const cloudHigh = data.hourly.cloud_cover_high[0];
                    
                    document.getElementById('cloud-cover-current').textContent = `${cloudTotal}%`;
                    document.getElementById('cloud-low').textContent = cloudLow;
                    document.getElementById('cloud-mid').textContent = cloudMid;
                    document.getElementById('cloud-high').textContent = cloudHigh;
                    
                    renderCloudCoverChart(data.hourly);
                }
            })
            .catch(err => console.error('Error fetching cloud cover data:', err));
    }

    function renderCloudCoverChart(hourlyData) {
        const ctx = document.getElementById('cloudCoverChart');
        if (!ctx) return;
        if (cloudCoverChartInstance) cloudCoverChartInstance.destroy();

        const labels = [];
        const cloudValues = [];
        for (let i = 0; i < Math.min(24, hourlyData.time.length); i += 2) {
            const d = new Date(hourlyData.time[i]);
            labels.push(d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }));
            cloudValues.push(hourlyData.cloud_cover[i]);
        }

        cloudCoverChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Oblačnost (%)',
                    data: cloudValues,
                    borderColor: '#607d8b',
                    backgroundColor: 'rgba(96, 125, 139, 0.3)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleColor: 'white', bodyColor: 'white' }
                },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { beginAtZero: true, max: 100, ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    }

    // Fetch Solar Radiation data
    function fetchSolarRadiation(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=shortwave_radiation,direct_radiation&timezone=auto&forecast_days=2`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.hourly) {
                    const currentSolar = data.hourly.shortwave_radiation[0];
                    const currentDirect = data.hourly.direct_radiation[0];
                    
                    document.getElementById('solar-current').textContent = `${Math.round(currentSolar)} W/m²`;
                    document.getElementById('solar-direct').textContent = Math.round(currentDirect);
                    
                    // Solar potential
                    let potential, color;
                    if (currentSolar > 800) {
                        potential = 'Výborná';
                        color = '#ffc107';
                    } else if (currentSolar > 400) {
                        potential = 'Dobrá';
                        color = '#ff9e42';
                    } else if (currentSolar > 100) {
                        potential = 'Mírná';
                        color = '#ff5722';
                    } else {
                        potential = 'Nízká';
                        color = '#607d8b';
                    }
                    
                    const badge = document.getElementById('solar-potential');
                    badge.textContent = potential;
                    badge.style.backgroundColor = color;
                    
                    renderSolarChart(data.hourly);
                }
            })
            .catch(err => console.error('Error fetching solar radiation data:', err));
    }

    function renderSolarChart(hourlyData) {
        const ctx = document.getElementById('solarChart');
        if (!ctx) return;
        if (solarChartInstance) solarChartInstance.destroy();

        const labels = [];
        const solarValues = [];
        for (let i = 0; i < Math.min(24, hourlyData.time.length); i += 1) {
            const d = new Date(hourlyData.time[i]);
            labels.push(d.toLocaleTimeString('cs-CZ', { hour: '2-digit' }));
            solarValues.push(hourlyData.shortwave_radiation[i]);
        }

        solarChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Záření (W/m²)',
                    data: solarValues,
                    backgroundColor: 'rgba(255, 193, 7, 0.6)',
                    borderColor: '#ffc107',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleColor: 'white', bodyColor: 'white' }
                },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    }

    // Fetch Snow Depth data
    function fetchSnowDepth(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=snowfall_sum&hourly=snow_depth&timezone=auto&forecast_days=7`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.hourly && data.daily) {
                    const currentSnowDepth = data.hourly.snow_depth[0];
                    const newSnow = data.daily.snowfall_sum[0];
                    
                    document.getElementById('snow-depth-current').textContent = currentSnowDepth > 0 ? `${currentSnowDepth.toFixed(0)} cm` : '0 cm';
                    document.getElementById('snow-new').textContent = newSnow > 0 ? `${newSnow.toFixed(1)} cm` : '0 cm';
                    
                    renderSnowChart(data.daily);
                }
            })
            .catch(err => console.error('Error fetching snow data:', err));
    }

    function renderSnowChart(dailyData) {
        const ctx = document.getElementById('snowChart');
        if (!ctx) return;
        if (snowChartInstance) snowChartInstance.destroy();

        const labels = dailyData.time.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric' });
        });

        snowChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sněžení (cm)',
                    data: dailyData.snowfall_sum,
                    backgroundColor: 'rgba(0, 188, 212, 0.6)',
                    borderColor: '#00bcd4',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleColor: 'white', bodyColor: 'white' }
                },
                scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    }

    // ========== STATISTICS PAGE HELPERS ==========

    function updateStatsDailySummary(daily) {
        const min = daily.temperature_2m_min[0];
        const max = daily.temperature_2m_max[0];
        const rain = daily.precipitation_sum[0];
        const uv = daily.uv_index_max[0];

        const tempMinEl = document.getElementById('stats-temp-min');
        const tempMaxEl = document.getElementById('stats-temp-max');
        const rainEl = document.getElementById('stats-rain-today');
        const uvMaxEl = document.getElementById('stats-uv-max');
        const uvLevelEl = document.getElementById('stats-uv-level');

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

    function renderStatsWeeklyChart(daily) {
        const ctx = document.getElementById('stats-weekly-chart');
        if (!ctx) return;
        if (statsWeeklyChartInstance) statsWeeklyChartInstance.destroy();

        const daysCount = Math.min(7, daily.time.length);
        const labels = [];
        const maxTemps = [];
        const minTemps = [];
        const rains = [];

        for (let i = 0; i < daysCount; i++) {
            const d = new Date(daily.time[i]);
            labels.push(d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric' }));
            maxTemps.push(daily.temperature_2m_max[i]);
            minTemps.push(daily.temperature_2m_min[i]);
            rains.push(daily.precipitation_sum[i]);
        }

        statsWeeklyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Max (°C)',
                        data: maxTemps,
                        borderColor: '#ff9e42',
                        backgroundColor: 'rgba(255, 158, 66, 0.2)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Min (°C)',
                        data: minTemps,
                        borderColor: '#00bcd4',
                        backgroundColor: 'rgba(0, 188, 212, 0.2)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Srážky (mm)',
                        data: rains,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'rgba(255,255,255,0.9)' } },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y1: {
                        position: 'right',
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    function renderStatsNormalChart(daily) {
        const ctx = document.getElementById('stats-normal-chart');
        if (!ctx) return;
        if (statsNormalChartInstance) statsNormalChartInstance.destroy();

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
            type: 'bar',
            data: {
                labels: ['Posledních 7 dní', 'Posledních 30 dní'],
                datasets: [{
                    label: 'Průměrná max. teplota (°C)',
                    data: [avg7, avg30],
                    backgroundColor: ['rgba(255, 158, 66, 0.7)', 'rgba(0, 188, 212, 0.7)'],
                    borderColor: ['#ff9e42', '#00bcd4'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }

    function renderStatsHistoryChart(daily) {
        const ctx = document.getElementById('stats-history-chart');
        if (!ctx) return;
        if (statsHistoryChartInstance) statsHistoryChartInstance.destroy();

        const len = daily.time.length;
        if (!len) return;

        const take = Math.min(30, len);
        const start = len - take;

        const labels = [];
        const meanTemps = [];
        const rains = [];

        for (let i = start; i < len; i++) {
            const d = new Date(daily.time[i]);
            labels.push(d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }));
            const min = daily.temperature_2m_min[i];
            const max = daily.temperature_2m_max[i];
            meanTemps.push((min + max) / 2);
            rains.push(daily.precipitation_sum[i]);
        }

        statsHistoryChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Průměrná teplota (°C)',
                        data: meanTemps,
                        borderColor: '#ffffff',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Srážky (mm)',
                        data: rains,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'rgba(255,255,255,0.9)' } },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y1: {
                        position: 'right',
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }



    // Initialize all advanced weather data
    function initAdvancedWeatherData(lat, lon, name) {
        const titleElement = document.querySelector('h1.fw-light');
        if (titleElement && titleElement.textContent.includes('Další meteorologická data')) {
            titleElement.textContent = `Další meteorologická data - ${name}`;
        }
        
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

    // Initialize Statistics page data
    function initStatsData(lat, lon, name) {
        const titleElement = document.querySelector('h1.fw-light');
        if (titleElement && titleElement.textContent.includes('Statistiky')) {
            titleElement.textContent = `📊 Statistiky & trendy - ${name}`;
        }

        const loadingEl = document.getElementById('stats-loading');
        const errorEl = document.getElementById('stats-error');
        if (loadingEl) loadingEl.classList.remove('d-none');
        if (errorEl) errorEl.classList.add('d-none');

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,uv_index_max&timezone=auto&past_days=30&forecast_days=7`;

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Data fetch failed');
                return res.json();
            })
            .then(data => {
                const daily = data.daily;
                if (!daily) throw new Error('Missing daily data');

                updateStatsDailySummary(daily);
                renderStatsWeeklyChart(daily);
                renderStatsNormalChart(daily);
                renderStatsHistoryChart(daily);

                if (loadingEl) loadingEl.classList.add('d-none');
            })
            .catch(err => {
                console.error('Error fetching stats data:', err);
                if (loadingEl) loadingEl.classList.add('d-none');
                if (errorEl) errorEl.classList.remove('d-none');
            });
    }

    // Search logic for Advanced Data Page
    const advancedSearchInput = document.getElementById('advanced-search-input');
    const advancedSearchButton = document.getElementById('advanced-search-button');
    const advancedSuggestionsList = document.getElementById('advanced-suggestions-list');

    if (advancedSearchButton) {
        advancedSearchButton.addEventListener('click', () => handleSearch(advancedSearchInput, 'advanced'));
    }

    if (advancedSearchInput) {
        advancedSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch(advancedSearchInput, 'advanced');
        });

        advancedSearchInput.addEventListener('input', debounce((e) => {
            fetchSuggestions(e.target.value.trim(), 'advanced');
        }, 300));
    }

    // Update handleSearch to support advanced & statistics pages
    const originalHandleSearch = handleSearch;
    handleSearch = function(inputElement, isHistory) {
        const query = inputElement ? inputElement.value.trim() : '';
        if (!query) return;

        const suggestionsElement =
            isHistory === 'advanced'
                ? advancedSuggestionsList
                : isHistory === 'stats'
                    ? statsSuggestionsList
                    : (isHistory ? historySuggestionsList : suggestionsList);
        
        // Hide suggestions
        if (suggestionsElement) suggestionsElement.classList.add('d-none');

        // Fetch coordinates
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=cs&format=json`)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    const name = result.name;
                    const lat = result.latitude;
                    const lon = result.longitude;
                    
                    // Update input
                    if (inputElement) inputElement.value = name; 

                    if (isHistory === 'advanced') {
                        initAdvancedWeatherData(lat, lon, name);
                    } else if (isHistory === 'stats') {
                        initStatsData(lat, lon, name);
                    } else if (isHistory) {
                        fetchHistoricalData(lat, lon, name);
                    } else {
                        // Reset buttons on main page if needed
                        if (btnPlzen && btnZelRuda && btnCheznovice) {
                             [btnPlzen, btnZelRuda, btnCheznovice].forEach(btn => btn.classList.remove('active'));
                        }
                        fetchWeather(lat, lon, `Počasí ${name}`);
                    }
                } else {
                    alert('Místo nebylo nalezeno. Zkuste to prosím znovu.');
                }
            })
            .catch(error => {
                console.error('Error fetching location:', error);
                alert('Chyba při vyhledávání místa.');
            });
    };

    // Update fetchSuggestions to support advanced & statistics pages
    const originalFetchSuggestions = fetchSuggestions;
    fetchSuggestions = function(query, isHistory) {
        const inputElement =
            isHistory === 'advanced'
                ? advancedSearchInput
                : isHistory === 'stats'
                    ? statsSearchInput
                    : (isHistory ? historySearchInput : searchInput);

        const suggestionsElement =
            isHistory === 'advanced'
                ? advancedSuggestionsList
                : isHistory === 'stats'
                    ? statsSuggestionsList
                    : (isHistory ? historySuggestionsList : suggestionsList);

        if (!suggestionsElement) return;
        
        if (query.length < 2) {
            suggestionsElement.classList.add('d-none');
            suggestionsElement.innerHTML = '';
            return;
        }

        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=cs&format=json`)
            .then(response => response.json())
            .then(data => {
                suggestionsElement.innerHTML = '';
                if (data.results && data.results.length > 0) {
                    suggestionsElement.classList.remove('d-none');
                    data.results.forEach(place => {
                        const item = document.createElement('div');
                        item.className = 'suggestion-item';
                        
                        let details = [];
                        if (place.admin2) details.push(place.admin2);
                        if (place.admin1) details.push(place.admin1);
                        if (place.country) details.push(place.country);
                        
                        const detailsStr = details.join(', ');

                        item.innerHTML = `
                            <span class="suggestion-name">${place.name}</span>
                            <span class="suggestion-details">${detailsStr}</span>
                        `;

                        item.addEventListener('click', () => {
                            if (inputElement) inputElement.value = place.name;
                            suggestionsElement.classList.add('d-none');
                            
                           if (isHistory === 'advanced') {
                               initAdvancedWeatherData(place.latitude, place.longitude, place.name);
                           } else if (isHistory === 'stats') {
                               initStatsData(place.latitude, place.longitude, place.name);
                           } else if (isHistory) {
                               fetchHistoricalData(place.latitude, place.longitude, place.name);
                           } else {
                                fetchWeather(place.latitude, place.longitude, `Počasí ${place.name}`);
                                if (btnPlzen && btnZelRuda && btnCheznovice) {
                                    [btnPlzen, btnZelRuda, btnCheznovice].forEach(btn => btn.classList.remove('active'));
                                }
                           }
                        });

                        suggestionsElement.appendChild(item);
                    });
                } else {
                    suggestionsElement.classList.add('d-none');
                }
            })
            .catch(err => {
                console.error('Error fetching suggestions:', err);
            });
    };

    // Close advanced suggestions on click outside
    document.addEventListener('click', (e) => {
        if (advancedSearchInput && advancedSuggestionsList) {
            if (!advancedSearchInput.contains(e.target) && !advancedSuggestionsList.contains(e.target)) {
                advancedSuggestionsList.classList.add('d-none');
            }
        }
    });

    // Initial load for Advanced Data page
    if (document.getElementById('advanced-content')) {
        initAdvancedWeatherData(49.7475, 13.3776, 'Plzeň');
    }

    // Initial load for Statistics page
    if (document.getElementById('stats-content')) {
        initStatsData(49.7475, 13.3776, 'Plzeň');
    }
});
