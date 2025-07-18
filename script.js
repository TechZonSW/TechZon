document.addEventListener('DOMContentLoaded', function() {

    // --------------------------------------------------------------------
    // DEL 1: KOD SOM SKA KÖRAS PÅ ALLA SIDOR
    // --------------------------------------------------------------------

    // Uppdaterar årtalet i footern
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Intersection Observer för fade-in-animationer på sektioner
    const sections = document.querySelectorAll('.content-section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Startar när 10% av sektionen är synlig
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Sluta observera när den väl är synlig
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // --------------------------------------------------------------------
    // DEL 2: KOD SOM BARA SKA KÖRAS PÅ REPARATIONSSIDAN
    // --------------------------------------------------------------------

    // Kontrollera först om vi är på en sida som har prisuträknaren
    const priceCalculatorSection = document.getElementById('price-checker-section');
    if (priceCalculatorSection) {
        const categorySelect = document.getElementById('category-select');
        const modelSelect = document.getElementById('model-select');
        const repairSelect = document.getElementById('repair-select');
        const priceDisplay = document.getElementById('price-display');
        let priceData = []; // Lagrar all data från prices.json

        // 1. Hämta prisdata från JSON-filen
        fetch('./prices.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Kunde inte ladda prislistan.');
                }
                return response.json();
            })
            .then(data => {
                priceData = data;
                populateCategories();
            })
            .catch(error => {
                console.error(error);
                priceDisplay.innerHTML = `<p style="color: red;">Ett fel uppstod vid laddning av priserna.</p>`;
            });

        // 2. Fyll den första dropdown-menyn med unika kategorier
        function populateCategories() {
            const categories = [...new Set(priceData.map(item => item.Kategori))];
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }

        // 3. När en kategori väljs, fyll modell-menyn
        categorySelect.addEventListener('change', function() {
            const selectedCategory = this.value;
            // Rensa och inaktivera underordnade menyer
            resetSelect(modelSelect, '2. Välj modell');
            resetSelect(repairSelect, '3. Välj reparation');
            priceDisplay.innerHTML = '<p>Vänligen gör dina val för att se ett pris.</p>';

            if (selectedCategory) {
                const models = [...new Set(priceData
                    .filter(item => item.Kategori === selectedCategory)
                    .map(item => item.Modell))];
                
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    modelSelect.appendChild(option);
                });
                modelSelect.disabled = false;
            }
        });
        
        // 4. När en modell väljs, fyll reparations-menyn
        modelSelect.addEventListener('change', function() {
            const selectedModel = this.value;
            resetSelect(repairSelect, '3. Välj reparation');
            priceDisplay.innerHTML = '<p>Vänligen gör dina val för att se ett pris.</p>';

            if (selectedModel) {
                const repairs = priceData
                    .filter(item => item.Modell === selectedModel)
                    .map(item => item.Reparationstyp);

                repairs.forEach(repair => {
                    const option = document.createElement('option');
                    option.value = repair;
                    option.textContent = repair;
                    repairSelect.appendChild(option);
                });
                repairSelect.disabled = false;
            }
        });

        // 5. När en reparation väljs, visa priset
        repairSelect.addEventListener('change', function() {
            const selectedCategory = categorySelect.value;
            const selectedModel = modelSelect.value;
            const selectedRepair = this.value;

            if (selectedRepair) {
                const result = priceData.find(item => 
                    item.Kategori === selectedCategory && 
                    item.Modell === selectedModel && 
                    item.Reparationstyp === selectedRepair
                );
                
                if (result) {
                    priceDisplay.innerHTML = `<h3>Prisförslag: <span>${result.Pris} kr</span></h3>`;
                }
            } else {
                priceDisplay.innerHTML = '<p>Vänligen gör dina val för att se ett pris.</p>';
            }
        });

        // Hjälpfunktion för att återställa en dropdown
        function resetSelect(selectElement, defaultText) {
            selectElement.innerHTML = ''; // Rensa alla options
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = defaultText;
            selectElement.appendChild(defaultOption);
            selectElement.disabled = true;
        }
    }
    // --------------------------------------------------------------------
    // DEL 3: KOD SOM BARA SKA KÖRAS PÅ TILLBEHÖRSSIDAN
    // --------------------------------------------------------------------
    
    const accessoriesPage = document.getElementById('accessories-page');
    if (accessoriesPage) {
        const grid = document.getElementById('accessories-grid');
        const deviceFilter = document.getElementById('device-filter');
        const categoryFilter = document.getElementById('category-filter');
        let allAccessories = [];
    
        // 1. Hämta produktdata
        fetch('./accessories.json')
            .then(response => { if (!response.ok) throw new Error('Kunde inte ladda tillbehör.'); return response.json(); })
            .then(data => {
                allAccessories = data;
                
                // KORRIGERING: Ny, korrekt startsekvens
                populateDeviceFilter();
                updateCategoryFilter(allAccessories); // Fyll kategorifiltret med ALLA kategorier från start
                renderProducts(allAccessories); // Visa ALLA produkter från start
            })
            .catch(error => { console.error(error); grid.innerHTML = `<p style="text-align:center; color:red;">Kunde inte ladda produkterna.</p>`; });
    
        // 2. Fyll det första filtret med unika ENHETSTYPER
        function populateDeviceFilter() {
            deviceFilter.innerHTML = '<option value="alla">Alla enhetstyper</option>';
            const devices = [...new Set(allAccessories.map(item => item.Enhetstyp))];
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device;
                option.textContent = device;
                deviceFilter.appendChild(option);
            });
        }
    
        // 3. Uppdatera det andra filtret (Kategori) baserat på vald enhetstyp
        function updateCategoryFilter(products) {
            categoryFilter.innerHTML = '<option value="alla">Alla kategorier</option>';
            const categories = [...new Set(products.map(item => item.Kategori))];
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
    
        // 4. Huvudfunktion för att applicera båda filtren och rendera produkter
        function applyFilters() {
            const selectedDevice = deviceFilter.value;
            const selectedCategory = categoryFilter.value;
    
            // Filtrera först baserat på enhetstyp
            let filteredByDevice = allAccessories;
            if (selectedDevice !== 'alla') {
                filteredByDevice = allAccessories.filter(p => p.Enhetstyp === selectedDevice);
            }
            
            // Filtrera sedan resultatet baserat på kategori
            let finalFilter = filteredByDevice;
            if (selectedCategory !== 'alla') {
                finalFilter = filteredByDevice.filter(p => p.Kategori === selectedCategory);
            }
    
            renderProducts(finalFilter);
        }
        
        // 5. Rendera produktkorten
        function renderProducts(products) {
            grid.innerHTML = '';
            if (products.length === 0) {
                grid.innerHTML = `<p style="text-align:center; margin-top:20px;">Inga produkter matchade ditt val.</p>`;
                return;
            }
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <img src="${product.BildURL}" alt="${product.Namn}">
                    <div class="product-card-content">
                        <h4>${product.Namn}</h4>
                        <p>${product.Beskrivning}</p>
                        <p class="price">${product.Pris} kr</p>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    
        // 6. Lyssna på ändringar i filtren
        deviceFilter.addEventListener('change', function() {
            const selectedDevice = this.value;
            let productsForCategoryFilter = allAccessories;
            if (selectedDevice !== 'alla') {
                productsForCategoryFilter = allAccessories.filter(p => p.Enhetstyp === selectedDevice);
            }
            // Uppdatera kategorifiltret och kör sedan huvudfiltreringen
            updateCategoryFilter(productsForCategoryFilter);
            applyFilters();
        });
    
        categoryFilter.addEventListener('change', applyFilters);
    }

    // --------------------------------------------------------------------
    // DEL 4: KOD SOM BARA SKA KÖRAS PÅ BEGAGNAT-SIDAN
    // --------------------------------------------------------------------
    
    const usedProductsPage = document.getElementById('used-products-page');
    if (usedProductsPage) {
        const grid = document.getElementById('used-products-grid');
        const deviceFilter = document.getElementById('device-filter');
        const conditionFilter = document.getElementById('condition-filter');
        let allUsedProducts = [];
    
        // 1. Hämta produktdata
        fetch('./used-products.json')
            .then(response => { if (!response.ok) throw new Error('Kunde inte ladda begagnade produkter.'); return response.json(); })
            .then(data => {
                allUsedProducts = data;
                populateFilters();
                renderProducts(allUsedProducts); // Visa alla från start
            })
            .catch(error => { console.error(error); grid.innerHTML = `<p style="text-align:center; color:red;">Kunde inte ladda produkterna.</p>`; });
    
        // 2. Fyll båda filtren med unika värden
        function populateFilters() {
            // Fyll Enhetstyp-filter
            deviceFilter.innerHTML = '<option value="alla">Alla enhetstyper</option>';
            const devices = [...new Set(allUsedProducts.map(item => item.Enhetstyp))];
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device;
                option.textContent = device;
                deviceFilter.appendChild(option);
            });
    
            // Fyll Skick-filter
            conditionFilter.innerHTML = '<option value="alla">Alla skick</option>';
            // Ordna skick i en logisk ordning
            const conditions = ["Nyskick", "Mycket bra skick", "Bra skick"];
            const availableConditions = [...new Set(allUsedProducts.map(item => item.Skick))];
            conditions.forEach(condition => {
                if(availableConditions.includes(condition)) {
                    const option = document.createElement('option');
                    option.value = condition;
                    option.textContent = condition;
                    conditionFilter.appendChild(option);
                }
            });
        }
    
        // 3. Huvudfunktion för att applicera filter
        function applyFilters() {
            const selectedDevice = deviceFilter.value;
            const selectedCondition = conditionFilter.value;
            let filteredProducts = allUsedProducts;
    
            if (selectedDevice !== 'alla') {
                filteredProducts = filteredProducts.filter(p => p.Enhetstyp === selectedDevice);
            }
    
            if (selectedCondition !== 'alla') {
                filteredProducts = filteredProducts.filter(p => p.Skick === selectedCondition);
            }
    
            renderProducts(filteredProducts);
        }
    
        // 4. Rendera produktkorten
        function renderProducts(products) {
            grid.innerHTML = '';
            if (products.length === 0) {
                grid.innerHTML = `<p style="text-align:center; margin-top:20px;">Inga produkter matchade ditt val.</p>`;
                return;
            }
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card used-product-card'; // Extra klass för specifik styling
                // Lägg till en klass för skicket för att kunna färgsätta
                const conditionClass = product.Skick.toLowerCase().replace(/\s+/g, '-');
                card.innerHTML = `
                    <div class="used-product-image">
                        <img src="${product.BildURL}" alt="${product.Namn}">
                        <span class="condition-badge ${conditionClass}">${product.Skick}</span>
                    </div>
                    <div class="product-card-content">
                        <h4>${product.Namn}</h4>
                        <ul class="product-specs">
                            <li><strong>Färg:</strong> ${product.Färg}</li>
                            <li><strong>Lagring:</strong> ${product.Lagring}</li>
                        </ul>
                        <p>${product.Beskrivning}</p>
                        <p class="price">${product.Pris} kr</p>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    
        // 5. Lyssna på ändringar i båda filtren
        deviceFilter.addEventListener('change', applyFilters);
        conditionFilter.addEventListener('change', applyFilters);
    }

    // --------------------------------------------------------------------
    // DEL 5: KOD SOM BARA SKA KÖRAS PÅ VÄRDERINGS-SIDAN
    // --------------------------------------------------------------------
    const valuationPage = document.getElementById('valuation-page');
    if (valuationPage) {
        const form = document.getElementById('valuation-form');
        const steps = Array.from(form.querySelectorAll('.form-step'));
        const nextBtns = form.querySelectorAll('.next-btn');
        const prevBtns = form.querySelectorAll('.prev-btn');
        const progressBarSteps = document.querySelectorAll('.progress-bar-step');
        const feedbackDiv = document.getElementById('form-feedback');
        let currentStep = 0;
    
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0eh2H6eK4x2N2otZxPtifF787O35w6Z3jX7FNzcKX3-aT-ksgo_LZ4YxahCeHtkH4/exec"; // <-- KLISTRA IN DIN URL HÄR!
    
        nextBtns.forEach(button => {
            button.addEventListener('click', () => {
                if (validateStep(currentStep)) {
                    currentStep++;
                    updateFormSteps();
                }
            });
        });
    
        prevBtns.forEach(button => {
            button.addEventListener('click', () => {
                currentStep--;
                updateFormSteps();
            });
        });
    
        function updateFormSteps() {
            steps.forEach((step, index) => {
                step.classList.toggle('active', index === currentStep);
            });
            updateProgressBar();
        }
        
        function updateProgressBar() {
            progressBarSteps.forEach((step, index) => {
                if (index < currentStep) {
                    step.classList.add('completed');
                    step.classList.remove('active');
                } else if (index === currentStep) {
                    step.classList.add('active');
                    step.classList.remove('completed');
                } else {
                    step.classList.remove('active', 'completed');
                }
            });
        }
    
        function validateStep(stepIndex) {
            const currentStepDiv = steps[stepIndex];
            const inputs = currentStepDiv.querySelectorAll('input[required], select[required]');
            let isValid = true;
            for (const input of inputs) {
                if (!input.value) {
                    input.style.borderColor = 'red';
                    isValid = false;
                } else {
                    input.style.borderColor = '#ccc';
                }
            }
            return isValid;
        }
    
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!validateStep(currentStep)) return;
            
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Skickar...';
    
            fetch(SCRIPT_URL, { method: 'POST', body: new FormData(form) })
                .then(response => response.json())
                .then(data => {
                    if (data.result === 'success') {
                        currentStep++;
                        form.style.display = 'none'; // Göm formuläret
                        feedbackDiv.innerHTML = `<h3>Tack för din förfrågan!</h3><p>Vi har tagit emot din information och återkommer med ett personligt prisförslag till din e-post inom 24 timmar (vardagar).</p>`;
                        feedbackDiv.className = 'success';
                        updateFormSteps();
                    } else {
                        throw new Error(data.error || 'Okänt fel');
                    }
                })
                .catch(error => {
                    feedbackDiv.innerHTML = `<h3>Ett fel uppstod</h3><p>Kunde inte skicka din förfrågan. Vänligen försök igen senare eller kontakta oss direkt.</p><p><small>Fel: ${error.message}</small></p>`;
                    feedbackDiv.className = 'error';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Få min värdering';
                });
        });
    
        updateFormSteps(); // Initiera första steget
    }

    // --------------------------------------------------------------------
    // DEL 6: KOD SOM BARA SKA KÖRAS PÅ KONTAKT-SIDAN
    // --------------------------------------------------------------------
    const contactPageForm = document.getElementById('contact-page-form');
    if (contactPageForm) {
        const feedbackDiv = document.getElementById('contact-form-feedback');
        // ANVÄND DIN NYA URL FÖR KONTAKT-FORMULÄRET HÄR!
        const SCRIPT_URL_CONTACT = "https://script.google.com/macros/s/AKfycbxC5gtgKz2DIJUQ9AIPPs6uzu7RZBnBC3mNfx68FML9Etx0EMjP153ynM9-_jcun6R1/exec"; // <-- KLISTRA IN DIN URL HÄR!
    
        contactPageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = contactPageForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Skickar...';
    
            fetch(SCRIPT_URL_CONTACT, { method: 'POST', body: new FormData(contactPageForm) })
                .then(response => response.json())
                .then(data => {
                    if (data.result === 'success') {
                        contactPageForm.style.display = 'none'; // Göm formuläret
                        feedbackDiv.innerHTML = `<h3>Tack för ditt meddelande!</h3><p>Vi har tagit emot din förfrågan och återkommer så snart vi kan.</p>`;
                        feedbackDiv.className = 'success';
                    } else {
                        throw new Error(data.error || 'Okänt fel');
                    }
                })
                .catch(error => {
                    feedbackDiv.innerHTML = `<h3>Ett fel uppstod</h3><p>Kunde inte skicka ditt meddelande. Vänligen försök igen senare eller kontakta oss direkt.</p>`;
                    feedbackDiv.className = 'error';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Skicka Förfrågan';
                });
        });
    }

    // --------------------------------------------------------------------
    // DEL 7: KOD SOM BARA SKA KÖRAS PÅ SPÅRA-REPARATION-SIDAN (SLUTGILITG VERSION)
    // --------------------------------------------------------------------
    const trackingForm = document.getElementById('trackingForm');
    if (trackingForm) {
        const repairCodeInput = document.getElementById('repairCodeInput');
        const statusContainer = document.getElementById('statusContainer');
    
        trackingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            statusContainer.innerHTML = `<p class="loading">Söker efter din reparation...</p>`;
    
            const code = repairCodeInput.value.trim().toUpperCase();
    
            fetch(`/.netlify/functions/getRepairStatus?code=${code}`)
                .then(response => {
                    if (!response.ok) {
                        // Hanterar nätverksfel, t.ex. 404 om funktionen inte hittas
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // KORRIGERING: Ny, robust kontroll.
                    // Kontrollerar om det returnerade objektet har nyckeln 'repair_code'.
                    // Om inte, betyder det att funktionen lyckades men inte hittade en match.
                    if (data && data.repair_code) {
                        displayStatus(data);
                    } else {
                        // Detta är det troliga scenariot: funktionen returnerade ett tomt objekt.
                        throw new Error('Code not found in database');
                    }
                })
                .catch(error => {
                    console.error("Felsökningsinfo:", error); // Behåller loggning för säkerhets skull
                    statusContainer.innerHTML = `<p class="error-message">Koden hittades inte. Kontrollera och försök igen.</p>`;
                });
        });
    
        function displayStatus(data) {
            statusContainer.innerHTML = ''; 
    
            const title = document.createElement('h3');
            title.textContent = `Status för: ${data.device_name}`;
            statusContainer.appendChild(title);
    
            const timeline = document.createElement('ul');
            timeline.className = 'status-timeline';
            
            // Hanterar Firebase Timestamps på ett säkert sätt
            const statusUpdates = data.status_history.map(entry => {
                const text = Object.keys(entry)[0];
                const timestampData = entry[text];
                
                if (timestampData && typeof timestampData._seconds === 'number') {
                    const timestamp = new Date(timestampData._seconds * 1000);
                    return { text, timestamp };
                } else {
                    // Denna fallback är viktig om datan kommer i ett annat format
                    return { text, timestamp: new Date(timestampData) };
                }
            });
    
            statusUpdates.sort((a, b) => b.timestamp - a.timestamp);
            
            statusUpdates.forEach((status, index) => {
                const item = document.createElement('li');
                if (index === 0) {
                    item.className = 'active';
                }
    
                const text = document.createElement('p');
                text.className = 'status-text';
                text.textContent = status.text;
    
                const timestampElement = document.createElement('p');
                timestampElement.className = 'status-timestamp';
                timestampElement.textContent = status.timestamp.toLocaleString('sv-SE', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });
    
                item.appendChild(text);
                item.appendChild(timestampElement);
                timeline.appendChild(item);
            });
    
            statusContainer.appendChild(timeline);
        }
    }

    // --------------------------------------------------------------------
    // DEL 8: KOD FÖR ADMIN-PORTALEN (NY, FÖRBÄTTRAD VERSION)
    // --------------------------------------------------------------------
    const loginView = document.getElementById('loginView');
    if (loginView) {
        // --- Referenser till HTML-element ---
        const dashboardView = document.getElementById('dashboardView');
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginError = document.getElementById('loginError');
        const navCasesBtn = document.getElementById('navCasesBtn');
        const navScanBtn = document.getElementById('navScanBtn');
        const casesView = document.getElementById('casesView');
        const scanView = document.getElementById('scanView');
        const showCreateViewBtn = document.getElementById('showCreateViewBtn');
        const repairsList = document.getElementById('repairsList');
        const repairDetailView = document.getElementById('repairDetailView');
        const createRepairView = document.getElementById('createRepairView');
        const selectCasePrompt = document.getElementById('selectCasePrompt');
        const createRepairForm = document.getElementById('createRepairForm');
        const updateStatusForm = document.getElementById('updateStatusForm');
    
        // --- State-variabler (appens minne) ---
        let jwtToken = sessionStorage.getItem('techzon_jwt') || null;
        let allRepairs = [];
        let activeRepair = null;
    
        // --- Funktioner ---
    
        function switchMainView(viewToShow) {
            casesView.style.display = 'none';
            scanView.style.display = 'none';
            navCasesBtn.classList.remove('active');
            navScanBtn.classList.remove('active');
    
            if (viewToShow === 'cases') {
                casesView.style.display = 'block';
                navCasesBtn.classList.add('active');
            } else if (viewToShow === 'scan') {
                scanView.style.display = 'block';
                navScanBtn.classList.add('active');
            }
        }
    
        function switchDetailView(viewToShow) {
            repairDetailView.style.display = 'none';
            createRepairView.style.display = 'none';
            selectCasePrompt.style.display = 'none';
    
            if (viewToShow === 'detail') repairDetailView.style.display = 'block';
            else if (viewToShow === 'create') createRepairView.style.display = 'block';
            else selectCasePrompt.style.display = 'block';
        }
        
        function populateRepairsList() {
            repairsList.innerHTML = '';
            if (allRepairs.length === 0) {
                repairsList.innerHTML = `<li class="empty-list">Inga pågående ärenden.</li>`;
                return;
            }
            allRepairs.forEach(repair => {
                const item = document.createElement('li');
                item.className = 'repair-list-item';
                if (activeRepair && repair.id === activeRepair.id) {
                    item.classList.add('active');
                }
                item.dataset.id = repair.id;
                item.innerHTML = `
                    <p class="item-device">${repair.device_name}</p>
                    <p class="item-customer">${repair.customer_name}</p>
                    <span class="item-code">${repair.repair_code}</span>
                `;
                item.addEventListener('click', () => handleSelectRepair(repair.id));
                repairsList.appendChild(item);
            });
        }
    
        function handleSelectRepair(repairId) {
            activeRepair = allRepairs.find(r => r.id === repairId);
            if (!activeRepair) return;
    
            document.querySelectorAll('.repair-list-item').forEach(el => el.classList.remove('active'));
            document.querySelector(`.repair-list-item[data-id="${repairId}"]`).classList.add('active');
            
            document.getElementById('activeDeviceName').textContent = activeRepair.device_name;
            document.getElementById('activeCustomerName').textContent = activeRepair.customer_name;
            document.getElementById('activeRepairCode').textContent = activeRepair.repair_code;
            
            const statusList = document.getElementById('activeStatusList');
            statusList.innerHTML = '';
            if (activeRepair.status_history) {
                activeRepair.status_history
                    .sort((a, b) => (b.timestamp._seconds || 0) - (a.timestamp._seconds || 0))
                    .forEach(status => {
                        const li = document.createElement('li');
                        li.innerHTML = `<p class="status-text">${status.status}</p><p class="status-timestamp">${new Date(status.timestamp._seconds * 1000).toLocaleString('sv-SE')}</p>`;
                        statusList.appendChild(li);
                    });
            }
            
            switchDetailView('detail');
        }
        
        async function initializeDashboard() {
            try {
                const response = await fetch('/.netlify/functions/getRepairs', {
                    headers: { 'Authorization': `Bearer ${jwtToken}` }
                });
                if (!response.ok) throw new Error('Kunde inte hämta ärenden.');
                allRepairs = await response.json();
                populateRepairsList();
                switchDetailView('prompt');
            } catch (error) {
                alert(error.message);
            }
        }
    
        // --- Event Listeners ---
    
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            loginError.textContent = '';
            
            try {
                const response = await fetch('/.netlify/functions/adminLogin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                if (!response.ok) throw new Error('Fel användarnamn eller lösenord.');
                const data = await response.json();
                jwtToken = data.token;
                sessionStorage.setItem('techzon_jwt', jwtToken);
                document.getElementById('dashboardView').style.display = 'block';
                document.getElementById('loginView').style.display = 'none';
                await initializeDashboard();
            } catch (error) {
                loginError.textContent = error.message;
            }
        });
    
        logoutBtn.addEventListener('click', () => {
            jwtToken = null;
            activeRepair = null;
            allRepairs = [];
            sessionStorage.removeItem('techzon_jwt');
            document.getElementById('loginForm').reset();
            document.getElementById('loginView').style.display = 'flex';
            document.getElementById('dashboardView').style.display = 'none';
        });
        
        navCasesBtn.addEventListener('click', () => switchMainView('cases'));
        navScanBtn.addEventListener('click', () => switchMainView('scan'));
        showCreateViewBtn.addEventListener('click', () => switchDetailView('create'));
    
        createRepairForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const deviceName = document.getElementById('deviceName').value;
            const customerName = document.getElementById('customerName').value;
            const customerPhone = document.getElementById('customerPhone').value;
            const submitButton = createRepairForm.querySelector('button');
            submitButton.disabled = true;
            submitButton.textContent = 'Skapar...';
    
            try {
                const response = await fetch('/.netlify/functions/createRepair', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}`},
                    body: JSON.stringify({ deviceName, customerName, customerPhone })
                });
                if (!response.ok) throw new Error('Kunde inte skapa ärende.');
                const newRepair = await response.json();
                allRepairs.unshift(newRepair);
                populateRepairsList();
                handleSelectRepair(newRepair.id);
                createRepairForm.reset();
            } catch (error) {
                alert(error.message);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Skapa Ärende';
            }
        });
    
        updateStatusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newStatusInput = document.getElementById('newStatusInput');
            const newStatus = newStatusInput.value.trim();
            const action = e.submitter.dataset.action;
            
            if (!newStatus || !activeRepair) return;
            
            const button = e.submitter;
            button.disabled = true;
    
            try {
                // 1. Spara alltid den nya statusen
                const updateResponse = await fetch('/.netlify/functions/updateRepairStatus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}`},
                    body: JSON.stringify({ repairId: activeRepair.id, newStatus: newStatus })
                });
                if (!updateResponse.ok) throw new Error('Kunde inte spara status.');
                
                // Uppdatera lokala datan och UI direkt för snabb feedback
                const newStatusEntry = { status: newStatus, timestamp: { _seconds: Date.now() / 1000 } };
                activeRepair.status_history.unshift(newStatusEntry);
                handleSelectRepair(activeRepair.id);
                newStatusInput.value = '';
    
                // 2. Skicka SMS om den knappen trycktes
                if (action === 'sms') {
                    const smsMessage = `Hej ${activeRepair.customer_name}! Ny status för din reparation (${activeRepair.device_name}): ${newStatus}. Mvh TechZon`;
                    const smsResponse = await fetch('/.netlify/functions/sendSms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}`},
                        body: JSON.stringify({ repairId: activeRepair.id, message: smsMessage })
                    });
                    if (!smsResponse.ok) throw new Error('Status sparades, men SMS kunde inte skickas.');
                    alert('Status sparad och SMS skickat!');
                } else {
                    alert('Status sparad!');
                }
            } catch (error) {
                alert(error.message);
            } finally {
                button.disabled = false;
            }
        });
        
        // Initialisering vid sidladdning
        if (jwtToken) {
            document.getElementById('dashboardView').style.display = 'block';
            document.getElementById('loginView').style.display = 'none';
            initializeDashboard();
        }
    }
});
