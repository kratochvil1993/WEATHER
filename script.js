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

    function updateCurrentWeather(current) {
        // Update values
        tempElement.textContent = Math.round(current.temperature_2m);
        windElement.textContent = Math.round(current.wind_speed_10m);
        humidityElement.textContent = current.relative_humidity_2m;
        
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

        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;

        fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateCurrentWeather(data.current);
            updateForecast(data.daily);
            updateHourlyForecast(data.hourly);
            
            loadingElement.classList.add('d-none');
            contentElement.classList.remove('d-none');
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            loadingElement.classList.add('d-none');
            errorElement.classList.remove('d-none');
             document.querySelector('#forecast-content .spinner-border').parentElement.innerHTML = '<p class="text-center text-danger">Chyba načítání předpovědi</p>';
             document.querySelector('#hourly-content .spinner-border').parentElement.innerHTML = '<p class="text-center text-danger">Chyba načítání předpovědi</p>';
        });
    }
    
    // Event Listeners for Buttons
    function updateActiveButton(activeBtn) {
        [btnPlzen, btnZelRuda, btnCheznovice].forEach(btn => {
            if (btn === activeBtn) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    btnPlzen.addEventListener('click', () => {
        updateActiveButton(btnPlzen);
        fetchWeather(49.7475, 13.3776, 'Počasí v Plzni');
    });

    btnZelRuda.addEventListener('click', () => {
        updateActiveButton(btnZelRuda);
        fetchWeather(49.1356, 13.2366, 'Počasí Železná Ruda');
    });

    btnCheznovice.addEventListener('click', () => {
        updateActiveButton(btnCheznovice);
        fetchWeather(49.7789, 13.7854, 'Počasí v Cheznovicích');
    });

    // Search & Autocomplete Logic
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const suggestionsList = document.getElementById('suggestions-list');
    let debounceTimer;

    function handleSearch(term) {
        const query = term || searchInput.value.trim();
        if (!query) return;

        // Reset UI for search
        [btnPlzen, btnZelRuda, btnCheznovice].forEach(btn => btn.classList.remove('active'));
        
        // Hide suggestions
        suggestionsList.classList.add('d-none');

        // Fetch coordinates
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=cs&format=json`)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    const name = result.name;
                    const lat = result.latitude;
                    const lon = result.longitude;
                    
                    // Update input with full name if available or just name
                    searchInput.value = name; 
                    fetchWeather(lat, lon, `Počasí ${name}`);
                } else {
                    alert('Místo nebylo nalezeno. Zkuste to prosím znovu.');
                }
            })
            .catch(error => {
                console.error('Error fetching location:', error);
                alert('Chyba při vyhledávání místa.');
            });
    }

    // Debounce function
    function debounce(func, delay) {
        return function(...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Fetch Suggestions
    function fetchSuggestions(query) {
        if (query.length < 2) {
            suggestionsList.classList.add('d-none');
            suggestionsList.innerHTML = '';
            return;
        }

        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=cs&format=json`)
            .then(response => response.json())
            .then(data => {
                suggestionsList.innerHTML = '';
                if (data.results && data.results.length > 0) {
                    suggestionsList.classList.remove('d-none');
                    data.results.forEach(place => {
                        const item = document.createElement('div');
                        item.className = 'suggestion-item';
                        
                        // Construct details string (e.g., "District, Region, Country")
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
                            searchInput.value = place.name;
                            suggestionsList.classList.add('d-none');
                            fetchWeather(place.latitude, place.longitude, `Počasí ${place.name}`);
                             // Reset buttons
                            [btnPlzen, btnZelRuda, btnCheznovice].forEach(btn => btn.classList.remove('active'));
                        });

                        suggestionsList.appendChild(item);
                    });
                } else {
                    suggestionsList.classList.add('d-none');
                }
            })
            .catch(err => {
                console.error('Error fetching suggestions:', err);
            });
    }

    searchButton.addEventListener('click', () => handleSearch());
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
            suggestionsList.classList.add('d-none');
        }
    });

    searchInput.addEventListener('input', debounce((e) => {
        fetchSuggestions(e.target.value.trim());
    }, 300));

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.add('d-none');
        }
    });

    // Initial Fetch (Plzeň)
    fetchWeather(49.7475, 13.3776, 'Počasí v Plzni');
});
