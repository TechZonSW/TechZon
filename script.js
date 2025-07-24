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
    // DEL 7: KOD FÖR SPÅRA-REPARATION-SIDAN (OPTIMERAD FÖR ADMIN-DATA)
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
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    if (data && data.repair_code) {
                        displayStatus(data);
                    } else {
                        throw new Error('Code not found in database');
                    }
                })
                .catch(error => {
                    console.error("Felsökningsinfo:", error);
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
            
            // FÖRENKLAD KOD: Läser bara det nya, korrekta formatet { status: "...", timestamp: ... }
            const statusUpdates = data.status_history.map(entry => {
                const text = entry.status;
                const timestampData = entry.timestamp;
                
                let timestamp;
                if (timestampData && typeof timestampData._seconds === 'number') {
                    timestamp = new Date(timestampData._seconds * 1000);
                } else {
                    timestamp = new Date(timestampData); // Fallback
                }
                
                return { text, timestamp };
            });
    
            // Sortera alltid så att det senaste är först
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
    // DEL 8: KOD FÖR ADMIN-PORTALEN (MED ARKIVERING/RADERING)
    // --------------------------------------------------------------------
    const loginView = document.getElementById('loginView');
    if (loginView) {
        // --- Referenser till HTML-element ---
        const dashboardView = document.getElementById('dashboardView'),
            loginForm = document.getElementById('loginForm'),
            logoutBtn = document.getElementById('logoutBtn'),
            loginError = document.getElementById('loginError'),
            navActiveBtn = document.getElementById('navActiveBtn'),
            navArchivedBtn = document.getElementById('navArchivedBtn'),
            navScanBtn = document.getElementById('navScanBtn'),
            casesView = document.getElementById('casesView'),
            scanView = document.getElementById('scanView'),
            casesViewTitle = document.getElementById('casesViewTitle'),
            showCreateViewBtn = document.getElementById('showCreateViewBtn'),
            deleteSelectedBtn = document.getElementById('deleteSelectedBtn'),
            repairsList = document.getElementById('repairsList'),
            repairDetailView = document.getElementById('repairDetailView'),
            createRepairView = document.getElementById('createRepairView'),
            selectCasePrompt = document.getElementById('selectCasePrompt'),
            createRepairForm = document.getElementById('createRepairForm'),
            updateStatusForm = document.getElementById('updateStatusForm'),
            archiveCaseBtn = document.getElementById('archiveCaseBtn'),
            activeDeviceName = document.getElementById('activeDeviceName'),
            activeCustomerName = document.getElementById('activeCustomerName'),
            activeRepairCode = document.getElementById('activeRepairCode'),
            activeStatusList = document.getElementById('activeStatusList'),
            navStockBtn = document.getElementById('navStockBtn'),
            stockView = document.getElementById('stockView'),
            scanShortcutBtn = document.getElementById('scanShortcutBtn');
    
        // --- State-variabler (appens minne) ---
        let jwtToken = sessionStorage.getItem('techzon_jwt') || null;
        let allRepairs = [];
        let activeRepair = null;
        let currentCaseView = 'active'; // Håller reda på vilken vy vi är i
    
        // --- Funktioner ---
        function switchMainView(viewToShow) {
            [casesView, scanView, stockView].forEach(v => v.style.display = 'none');
            [navActiveBtn, navArchivedBtn, navScanBtn, navStockBtn].forEach(b => b.classList.remove('active'));

            if (viewToShow === 'scan') {
                scanView.style.display = 'block';
                navScanBtn.classList.add('active');
            } else if (viewToShow === 'stock') {
                stockView.style.display = 'block';
                navStockBtn.classList.add('active');
            } else { // 'cases'
                casesView.style.display = 'block';
                if (currentCaseView === 'active') navActiveBtn.classList.add('active');
                else navArchivedBtn.classList.add('active');
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
    
        async function fetchAndRenderRepairs(status = 'active') {
            currentCaseView = status;
            casesViewTitle.textContent = status === 'active' ? 'Pågående Ärenden' : 'Avslutade Ärenden';
            repairsList.innerHTML = `<li class="empty-list">Laddar ärenden...</li>`;
            switchDetailView('prompt');
            updateBulkActionUI();
    
            try {
                const response = await fetch(`/.netlify/functions/getRepairs?status=${status}`, {
                    headers: { 'Authorization': `Bearer ${jwtToken}` }
                });
                if (!response.ok) throw new Error('Kunde inte hämta ärenden.');
                allRepairs = await response.json();
                populateRepairsList();
            } catch (error) {
                repairsList.innerHTML = `<li class="empty-list error-message">${error.message}</li>`;
            }
        }
    
        function populateRepairsList() {
            repairsList.innerHTML = '';
            if (allRepairs.length === 0) {
                repairsList.innerHTML = `<li class="empty-list">Inga ${currentCaseView} ärenden hittades.</li>`;
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
                    <input type="checkbox" class="repair-checkbox" data-id="${repair.id}">
                    <div class="item-content">
                        <p class="item-device">${repair.device_name}</p>
                        <p class="item-customer">${repair.customer_name}</p>
                    </div>
                    <span class="item-code">${repair.repair_code}</span>
                `;
                item.querySelector('.item-content').addEventListener('click', () => handleSelectRepair(repair.id));
                item.querySelector('.repair-checkbox').addEventListener('change', updateBulkActionUI);
                repairsList.appendChild(item);
            });
        }
    
        function handleSelectRepair(repairId) {
            activeRepair = allRepairs.find(r => r.id === repairId);
            if (!activeRepair) return;
    
            document.querySelectorAll('.repair-list-item').forEach(el => el.classList.remove('active'));
            const activeListItem = document.querySelector(`.repair-list-item[data-id="${repairId}"]`);
            if(activeListItem) activeListItem.classList.add('active');
            
            activeDeviceName.textContent = activeRepair.device_name;
            activeCustomerName.textContent = activeRepair.customer_name;
            activeRepairCode.textContent = activeRepair.repair_code;
            
            activeStatusList.innerHTML = '';
            if (activeRepair.status_history) {
                const statusUpdates = (activeRepair.status_history || []).map(entry => {
                    const text = entry.status;
                    const timestamp = new Date((entry.timestamp._seconds || 0) * 1000);
                    return { text, timestamp };
                }).sort((a, b) => b.timestamp - a.timestamp);
    
                statusUpdates.forEach(status => {
                    const li = document.createElement('li');
                    li.innerHTML = `<p class="status-text">${status.text}</p><p class="status-timestamp">${status.timestamp.toLocaleString('sv-SE')}</p>`;
                    activeStatusList.appendChild(li);
                });
            }
            
            archiveCaseBtn.style.display = activeRepair.status === 'active' ? 'block' : 'none';
            switchDetailView('detail');
        }
        
        function updateBulkActionUI() {
            const selectedCount = document.querySelectorAll('.repair-checkbox:checked').length;
            deleteSelectedBtn.style.display = selectedCount > 0 ? 'inline-block' : 'none';
            deleteSelectedBtn.textContent = `Radera markerade (${selectedCount})`;
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
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ username, password })
                });
                if (!response.ok) throw new Error('Fel användarnamn eller lösenord.');
                const data = await response.json();
                jwtToken = data.token;
                sessionStorage.setItem('techzon_jwt', jwtToken);
                dashboardView.style.display = 'block';
                loginView.style.display = 'none';
                await fetchAndRenderRepairs('active');
            } catch (error) {
                loginError.textContent = error.message;
            }
        });
    
        logoutBtn.addEventListener('click', () => {
            jwtToken = null;
            activeRepair = null;
            allRepairs = [];
            sessionStorage.removeItem('techzon_jwt');
            loginForm.reset();
            createRepairForm.reset();
            updateStatusForm.reset();
            loginView.style.display = 'flex';
            dashboardView.style.display = 'none';
        });
            
        navActiveBtn.addEventListener('click', () => {
            switchMainView('cases');
            navArchivedBtn.classList.remove('active');
            navActiveBtn.classList.add('active');
            fetchAndRenderRepairs('active');
        });
    
        navArchivedBtn.addEventListener('click', () => {
            switchMainView('cases');
            navActiveBtn.classList.remove('active');
            navArchivedBtn.classList.add('active');
            fetchAndRenderRepairs('archived');
        });
    
        navScanBtn.addEventListener('click', () => switchMainView('scan'));
        navStockBtn.addEventListener('click', () => switchMainView('stock'));

        // NYTT KODBLOCK ATT LÄGGA TILL
        // Lyssna på knappen som finns INUTI skanner-vyn
        const startScannerBtn = document.getElementById('startScannerBtn');
        if (startScannerBtn) {
            startScannerBtn.addEventListener('click', () => {
                const scannerContainer = document.getElementById('scanner-container');
                const scanResult = document.getElementById('scanResult');
                
                // Kontrollera att elementen finns
                if (!scannerContainer || !scanResult) {
                    console.error("Skanner-element saknas i HTML.");
                    return;
                }
        
                scannerContainer.style.display = 'block';
                scanResult.innerHTML = '';
                
                // Kontrollera att biblioteket har laddats
                if (typeof Html5Qrcode === 'undefined') {
                    alert("Fel: Skanner-biblioteket (html5-qrcode.min.js) kunde inte laddas.");
                    return;
                }
        
                try {
                    const html5QrCode = new Html5Qrcode("scanner-container");
                    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                        // Stoppa skannern när en kod har hittats
                        html5QrCode.stop().then(() => {
                            scannerContainer.style.display = 'none';
                            scanResult.innerHTML = `<h4>Kod skannad!</h4><p>Kod: ${decodedText}</p><p>Här kommer info från backend att visas.</p>`;
                        }).catch(err => console.error("Fel vid stopp av skanner:", err));
                    };
        
                    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                    
                    // Starta skannern
                    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
                        .catch(err => {
                            console.error("Kunde inte starta skanner:", err);
                            scanResult.innerHTML = `<p class="error-message">Kunde inte starta kameran. Kontrollera webbläsarens behörigheter.</p>`;
                            scannerContainer.style.display = 'none';
                        });
                } catch (error) {
                    console.error("Ett oväntat fel inträffade vid start av skanner:", error);
                    alert("Ett oväntat fel inträffade. Se konsolen för mer info.");
                }
            });
        }
    
        showCreateViewBtn.addEventListener('click', () => {
            document.querySelectorAll('.repair-list-item').forEach(li => li.classList.remove('active'));
            activeRepair = null;
            switchDetailView('create');
        });
    
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
            const action = e.submitter.dataset.action; // Hämtar 'save' eller 'sms'
            
            if (!newStatus || !activeRepair) return;
            
            const button = e.submitter;
            const originalButtonText = button.textContent;
            button.disabled = true;
            button.textContent = 'Sparar...';
        
            try {
                // Steg 1: Anropa backend för att spara statusen
                const updateResponse = await fetch('/.netlify/functions/updateRepairStatus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}`},
                    body: JSON.stringify({ repairId: activeRepair.id, newStatus: newStatus })
                });
        
                if (!updateResponse.ok) {
                    // Om backend returnerar ett fel, visa det
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.message || 'Okänt fel vid uppdatering.');
                }
        
                // --- START PÅ NY, FÖRBÄTTRAD LOGIK ---
        
                // Steg 2: Uppdatera den lokala datan och UI:t direkt
                const newStatusEntry = {
                    status: newStatus,
                    // Skapa ett "äkta" timestamp-objekt lokalt för att matcha det gamla formatet
                    timestamp: { _seconds: Math.floor(Date.now() / 1000) } 
                };
                
                // Lägg till den nya statusen överst i vår lokala kopia av datan
                activeRepair.status_history.unshift(newStatusEntry);
        
                // Anropa samma funktion som ritar listan för att rita om den med den nya datan
                handleSelectRepair(activeRepair.id);
        
                newStatusInput.value = ''; // Rensa input-fältet
        
                // --- SLUT PÅ NY LOGIK ---
        
        
                // Steg 3: Skicka SMS om den knappen trycktes
                if (action === 'sms') {
                    button.textContent = 'Skickar SMS...';
                    const smsMessage = `Hej ${activeRepair.customer_name}, en uppdatering för din ${activeRepair.device_name}: "${newStatus}". Följ ditt ärende live på https://techzon.netlify.app/spara med koden: ${activeRepair.repair_code}. Mvh, TechZon`;
                    const smsResponse = await fetch('/.netlify/functions/sendSms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}`},
                        body: JSON.stringify({ repairId: activeRepair.id, message: smsMessage })
                    });
                    if (!smsResponse.ok) {
                        alert('Status sparades, men SMS kunde inte skickas.');
                    } else {
                        alert('Status sparad och SMS skickat!');
                    }
                }
        
            } catch (error) {
                alert(`Fel: ${error.message}`);
            } finally {
                // Återställ alltid knappen
                button.disabled = false;
                button.textContent = originalButtonText;
            }
        });
    
        deleteSelectedBtn.addEventListener('click', async () => {
            const checkedBoxes = document.querySelectorAll('.repair-checkbox:checked');
            const idsToDelete = Array.from(checkedBoxes).map(cb => cb.dataset.id);
            if (idsToDelete.length === 0 || !confirm(`Radera ${idsToDelete.length} ärende(n) permanent?`)) return;
            try {
                await fetch('/.netlify/functions/deleteRepairs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}`},
                    body: JSON.stringify({ repairIds: idsToDelete })
                });
                fetchAndRenderRepairs(currentCaseView);
            } catch (error) { alert(`Fel: ${error.message}`); }
        });
    
        archiveCaseBtn.addEventListener('click', async () => {
            if (!activeRepair || !confirm(`Avsluta och arkivera ärendet för ${activeRepair.device_name}?`)) return;
            try {
                await fetch('/.netlify/functions/archiveRepair', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}`},
                    body: JSON.stringify({ repairId: activeRepair.id })
                });
                fetchAndRenderRepairs('active');
            } catch (error) { alert(`Fel: ${error.message}`); }
        });


        // --- LOGIK FÖR LAGERHANTERING ---
        const stockSearchInput = document.getElementById('stockSearchInput');
        const stockFilterBar = document.getElementById('stock-filter-bar');
        const stockTableBody = document.getElementById('stock-table-body');
        const showCreateProductBtn = document.getElementById('showCreateProductBtn');
        const productModal = document.getElementById('productModalAdmin');
        const closeProductModalBtn = document.getElementById('closeProductModalBtn');
        const productForm = document.getElementById('productForm');
        const productModalTitle = document.getElementById('productModalTitle');
        const productIdInput = document.getElementById('productId');
        
        let allStockProducts = [];
        let currentStockFilter = 'allt';

        // NY HJÄLPFUNKTION: Plattar ut din komplexa JSON-data
        function flattenProducts(productBases, defaultCategory) {
            const flattened = [];
            productBases.forEach(base => {
                // Bestäm kategorin: antingen från bas-objektet eller från default-värdet
                const category = base.kategori_slug || defaultCategory;

                if (base.varianter && base.varianter.length > 0) {
                    base.varianter.forEach(variant => {
                        flattened.push({
                            id: variant.id,
                            name: `${base.namn} (${Object.values(variant.attribut).join(', ')})`,
                            category: category,
                            stock: 0
                        });
                    });
                } else {
                    // Detta hanterar enklare produkter som reservdelar och tillbehör
                    flattened.push({
                        id: base.id,
                        name: base.namn,
                        category: category,
                        stock: 0
                    });
                }
            });
            return flattened;
        }


        // NY HUVUDFUNKTION: Laddar all data när man går till lager-vyn
        async function initializeStockView() {
            stockTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Laddar produkter...</td></tr>`;

            try {
                // 1. Hämta all statisk produktdata från JSON-filer
                const [newRes, usedRes, accRes, spaRes] = await Promise.all([
                    fetch('./nya-enheter.json').then(res => res.json()),
                    fetch('./used-products.json').then(res => res.json()),
                    fetch('./accessories.json').then(res => res.json()), 
                    fetch('./reservdelar.json').then(res => res.json())
                ]);

                // KORRIGERING: Skicka med en default-kategori för varje filtyp
                const newProducts = flattenProducts(newRes, 'nytt');
                const usedProducts = flattenProducts(usedRes, 'andrahand');
                const accProducts = flattenProducts(accRes, 'tillbehor');
                const spaProducts = flattenProducts(spaRes, 'reservdel');
                
                const staticProducts = [...newProducts, ...usedProducts, ...accProducts, ...spaProducts];

                // 2. Hämta all dynamisk lagerdata från Firebase
                const stockResponse = await fetch('/.netlify/functions/getStockLevels', {
                    headers: { 'Authorization': `Bearer ${jwtToken}` }
                });
                if (!stockResponse.ok) throw new Error('Kunde inte hämta lagerdata från servern.');
                const stockLevels = await stockResponse.json();

                // 3. Kombinera datan
                allStockProducts = staticProducts.map(product => {
                    return {
                        ...product,
                        stock: stockLevels[product.id] || 0
                    };
                });

                // 4. Rita upp listan och filter
                renderStockList(allStockProducts);
                setupStockFilters();

            } catch (error) {
                console.error("Fel vid initiering av lagervyn:", error);
                stockTableBody.innerHTML = `<tr><td colspan="5" class="error-message">${error.message}</td></tr>`;
            }
        }


        function renderStockList(products) {
            stockTableBody.innerHTML = '';
            if (products.length === 0) {
                stockTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Inga produkter hittades.</td></tr>`;
                return;
            }
            products.forEach(p => {
                const row = document.createElement('tr');
                // Lägg till en klass om lagret är lågt
                const stockClass = p.stock <= (p.min_saldo || 0) ? 'stock-low' : 'stock-in-stock';
                
                row.innerHTML = `
                    <td><strong>${p.name}</strong></td>
                    <td><span class="category-tag category-${p.category}">${p.category}</span></td>
                    <td>${p.id}</td>
                    <td><span class="${stockClass}">${p.stock} st</span></td>
                    <td class="stock-list-actions">
                        <button data-id="${p.id}" class="edit-stock-btn" title="Redigera"><i class="ph ph-pencil-simple"></i></button>
                    </td>
                `;
                stockTableBody.appendChild(row);
            });
        }

        // NY FUNKTION: Skapar filterknapparna
        function setupStockFilters() {
            stockFilterBar.innerHTML = `
                <button class="stock-filter-btn active" data-filter="allt">Alla</button>
                <button class="stock-filter-btn" data-filter="nytt">Nya</button>
                <button class="stock-filter-btn" data-filter="andrahand">Andrahand</button>
                <button class="stock-filter-btn" data-filter="tillbehor">Tillbehör</button>
                <button class="stock-filter-btn" data-filter="reservdel">Reservdelar</button>
            `;
        }

        function applyStockFilters() {
            const searchTerm = stockSearchInput.value.toLowerCase();
            let filtered = allStockProducts;
            
            if (currentStockFilter !== 'allt') {
                filtered = filtered.filter(p => p.category === currentStockFilter);
            }
            if (searchTerm) {
                filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || p.sku.toLowerCase().includes(searchTerm));
            }
            
            renderStockList(filtered);
        }
        
        function openProductModalForEdit(productId) {
            const product = allStockProducts.find(p => p.id === productId);
            if (!product) return;
        
            productForm.reset();
            productModalTitle.textContent = 'Redigera Produkt';
            productIdInput.value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productIdSKU').value = product.sku;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productStock').value = product.stock;
            
            productModal.style.display = 'flex';
        }

        // --- Event listeners för lager-vyn ---

        // KORRIGERING: Byt ut din gamla navStockBtn-lyssnare mot denna
        navStockBtn.addEventListener('click', () => {
            switchMainView('stock');
            initializeStockView(); // Anropa den nya huvudfunktionen
        });
        
        stockFilterBar.addEventListener('click', (e) => {
            if(e.target.classList.contains('stock-filter-btn')) {
                document.querySelectorAll('.stock-filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentStockFilter = e.target.dataset.filter;
                applyStockFilters();
            }
        });
        
        stockSearchInput.addEventListener('input', applyStockFilters);
        
        // KORRIGERING: Event listener för "Åtgärder"-knappen
        stockTableBody.addEventListener('click', (e) => {
            const editButton = e.target.closest('.edit-stock-btn');
            if (editButton) {
                openProductModalForEdit(editButton.dataset.id);
            }
        });
        
        // Logik för modal
        showCreateProductBtn.addEventListener('click', () => {
            productForm.reset();
            productIdInput.value = '';
            productModalTitle.textContent = 'Skapa Ny Produkt';
            productModal.style.display = 'flex';
        });
        
        scanShortcutBtn.addEventListener('click', () => {
            switchMainView('scan'); // Byt till skannervyn
        });
        
        closeProductModalBtn.addEventListener('click', () => {
            productModal.style.display = 'none';
        });
        
        productModal.addEventListener('click', (e) => {
            // Stäng om man klickar utanför innehållet
            if (e.target === productModal) {
                productModal.style.display = 'none';
            }
        });
        
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = productIdInput.value;
            // Om 'id' finns, är det en uppdatering. Annars, en ny produkt.
            alert(`Produkt ${id ? 'uppdaterad' : 'sparad'}! (Simulering)`);
            productModal.style.display = 'none';
        });
    
        // --- Sidladdning ---
        if (jwtToken) {
            dashboardView.style.display = 'block';
            loginView.style.display = 'none';
            switchMainView('cases');
            fetchAndRenderRepairs('active');
        }
    }

    // --------------------------------------------------------------------
    // DEL 9: KOD FÖR E-BUTIKSSIDAN (/e-butik.html) - KORRIGERAD VERSION 4
    // --------------------------------------------------------------------
    const shopPage = document.getElementById('shop-page');
    if (shopPage) {
        // --- Referenser (oförändrat) ---
        const searchInput = document.getElementById('searchInput');
        const filtersContainer = document.getElementById('filters-container');
        const productGrid = document.getElementById('product-grid');
        const noResultsMessage = document.getElementById('no-results-message');
        
        // --- State (oförändrat) ---
        let allProducts = [];
        let priceSlider = null;
        let activeFilters = {
            kategori: [],
            marke: [],
            typ: [],
            price: { min: 0, max: 20000 }
        };
    
        // --- 1. INITIALISERING (UPPDATERAD LOGIK) ---
        async function initializeShop() {
            try {
                const [newDevices, usedDevices, accessories] = await Promise.all([
                    fetch('./nya-enheter.json').then(res => res.json()),
                    fetch('./used-products.json').then(res => res.json()),
                    fetch('./accessories.json').then(res => res.json())
                ]);
                
                // KORRIGERING: Vi slår ihop listorna direkt. Varje objekt representerar nu en "grundprodukt".
                // Varianten hanteras i render-funktionen.
                allProducts = [
                    ...newDevices,
                    ...usedDevices.map(p => ({...p, varianter: [p] })), // Säkerställ att de har en variant-array
                    ...accessories.map(p => ({...p, varianter: [p] }))
                ];
                
                populateFilters();
                parseUrlParams();
                applyFiltersAndSearch();
            } catch (error) {
                console.error("Kunde inte ladda produkter:", error);
                productGrid.innerHTML = '<p class="error-message">Ett fel uppstod vid laddning av produkter.</p>';
            }
        }

     // --- 2. FILTERS ---
        function populateFilters() {
            const kategorier = { 'nytt': 'Nya Enheter', 'andrahand': 'Andrahands Enheter', 'tillbehor': 'Tillbehör' };
            const marken = [...new Set(allProducts.map(p => p.marke).filter(Boolean))];
            const typer = [...new Set(allProducts.map(p => p.typ).filter(Boolean))];
    
            filtersContainer.innerHTML = `
                <div class="filter-group">
                    <h4>Kategori</h4>
                    <div class="filter-options">
                        ${Object.entries(kategorier).map(([slug, name]) => `
                            <label><input type="checkbox" data-filter="kategori" value="${slug}"> ${name}</label>
                        `).join('')}
                    </div>
                </div>
                <div class="filter-group">
                    <h4>Märke</h4>
                    <div class="filter-options">
                        ${marken.map(m => `
                            <label><input type="checkbox" data-filter="marke" value="${m.toLowerCase()}"> ${m}</label>
                        `).join('')}
                    </div>
                </div>
                <div class="filter-group">
                    <h4>Produkttyp</h4>
                    <div class="filter-options">
                        ${typer.map(t => `
                            <label><input type="checkbox" data-filter="typ" value="${t.toLowerCase()}"> ${t}</label>
                        `).join('')}
                    </div>
                </div>
                <div class="filter-group">
                    <h4>Pris</h4>
                    <div id="price-slider"></div>
                    <div id="price-values"><span id="min-price"></span><span id="max-price"></span></div>
                </div>
            `;
            
            const priceSliderElement = document.getElementById('price-slider');
            const minPriceLabel = document.getElementById('min-price');
            const maxPriceLabel = document.getElementById('max-price');
    
            // Kontrollera att noUiSlider är laddat
            if (typeof noUiSlider !== 'undefined') {
                priceSlider = noUiSlider.create(priceSliderElement, {
                    start: [0, 20000], connect: true, range: { min: 0, max: 20000 }, step: 100,
                    format: { to: value => Math.round(value) + ' kr', from: value => Number(value.replace(' kr', '')) }
                });
                
                priceSlider.on('update', ([min, max]) => { minPriceLabel.textContent = min; maxPriceLabel.textContent = max; });
                priceSlider.on('change', ([min, max]) => {
                    activeFilters.price.min = Number(min.replace(' kr', ''));
                    activeFilters.price.max = Number(max.replace(' kr', ''));
                    applyFiltersAndSearch();
                });
            }
        }
        
         function parseUrlParams() {
            const params = new URLSearchParams(window.location.search);
            params.forEach((value, key) => {
                if (activeFilters[key] !== undefined && Array.isArray(activeFilters[key])) {
                    const values = value.split(',');
                    activeFilters[key] = values;
                    
                    values.forEach(val => {
                        const checkbox = document.querySelector(`input[data-filter="${key}"][value="${val}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
            });
        }

        function applyFiltersAndSearch() {
            const searchTerm = searchInput.value.toLowerCase();
            
            const hasActiveFilters = activeFilters.kategori.length > 0 || 
                                     activeFilters.marke.length > 0 || 
                                     activeFilters.typ.length > 0 ||
                                     activeFilters.price.min > 0 ||
                                     activeFilters.price.max < 20000;
            clearFiltersBtn.style.display = hasActiveFilters ? 'block' : 'none';
        
            const filteredProducts = allProducts.filter(p => {
                const produktMarke = (p.marke || '').toLowerCase();
                const produktTyp = (p.typ || '').toLowerCase();
        
                // SÖKFILTER
                const matchesSearch = !searchTerm || 
                                      (p.namn && p.namn.toLowerCase().includes(searchTerm)) ||
                                      produktMarke.includes(searchTerm) ||
                                      produktTyp.includes(searchTerm);
                if (!matchesSearch) return false;
                
                // KATEGORIFILTER
                if (activeFilters.kategori.length > 0 && !activeFilters.kategori.includes(p.kategori_slug)) {
                    return false;
                }
                // MÄRKESFILTER
                if (activeFilters.marke.length > 0 && !activeFilters.marke.includes(produktMarke)) {
                    return false;
                }
        
                // TYP-FILTER (KORRIGERAD LOGIK)
                // Använder .some() för att se om produktens typ innehåller något av filterorden.
                // Detta gör att 'mobil' matchar 'mobiltelefon'.
                if (activeFilters.typ.length > 0) {
                    const typMatch = activeFilters.typ.some(filterTyp => produktTyp.includes(filterTyp));
                    if (!typMatch) {
                        return false;
                    }
                }
        
                // PRISFILTER
                const displayPrice = p.varianter[0].pris;
                if (displayPrice < activeFilters.price.min || displayPrice > activeFilters.price.max) {
                    return false;
                }
                
                // Om produkten klarade alla filter, inkludera den
                return true;
            });
            
            renderProducts(filteredProducts);
        }
        
        // --- 3. RENDERING (UPPDATERAD LOGIK) ---
        function renderProducts(products) {
            productGrid.innerHTML = '';
            noResultsMessage.style.display = products.length === 0 ? 'block' : 'none';
        
            products.forEach(p => {
                const displayVariant = p.varianter ? p.varianter[0] : p;
                if (!displayVariant) return;
        
                const card = document.createElement('div');
                card.className = 'product-card';
                
                const imageUrl = (displayVariant.media && displayVariant.media[0]?.url) || (displayVariant.bilder && displayVariant.bilder[0]) || 'bilder/testbild.png';
        
                // ---- NY, VILLKORLIG LOGIK FÖR ETIKETTEN ----
                let conditionBadgeHTML = '';
                if (p.kategori_slug === 'andrahand' && p.skick) {
                    // Skapa en CSS-vänlig klass från skicket (t.ex. "Mycket bra skick" -> "mycket-bra-skick")
                    const conditionClass = p.skick.toLowerCase().replace(/\s+/g, '-');
                    conditionBadgeHTML = `<span class="condition-badge ${conditionClass}">${p.skick}</span>`;
                }
        
                card.innerHTML = `
                    <a href="produkt.html?id=${displayVariant.id}" class="product-card-image-link">
                        <div class="product-card-image-wrapper">
                            <img src="${imageUrl}" alt="${p.namn}">
                            ${conditionBadgeHTML}
                        </div>
                    </a>
                    <div class="product-card-content">
                        <h4>${p.marke ? `${p.marke} ${p.namn}` : p.namn}</h4>
                        <p class="price">${displayVariant.pris} kr</p>
                        ${displayVariant.delbetalning_mojlig ? `<p class="price-installment">${displayVariant.delbetalning_pris}</p>` : ''}
                        <div class="product-card-buttons">
                            <a href="produkt.html?id=${displayVariant.id}"><button class="details-btn">Se detaljer</button></a>
                            <button class="add-to-cart-btn" data-id="${displayVariant.id}">Lägg i korg</button>
                        </div>
                    </div>
                `;
                productGrid.appendChild(card);
            });
        }
    
        // --- 4. EVENT LISTENERS ---
        searchInput.addEventListener('input', applyFiltersAndSearch);
    
        filtersContainer.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const filterType = e.target.dataset.filter;
                
                // Uppdatera state-objektet baserat på alla ikryssade boxar av den typen
                activeFilters[filterType] = Array.from(
                    document.querySelectorAll(`input[data-filter="${filterType}"]:checked`)
                ).map(cb => cb.value);
                
                applyFiltersAndSearch();
            }
        });

        // Funktion för att nollställa alla filter
        function clearAllFilters() {
            // Nollställ state-objektet
            activeFilters = { kategori: [], marke: [], typ: [], price: { min: 0, max: 20000 } };
            
            // Avmarkera alla checkboxar
            document.querySelectorAll('#filters-container input[type="checkbox"]').forEach(cb => cb.checked = false);
            
            // Nollställ sökfältet
            searchInput.value = '';
        
            // Nollställ pris-slidern
            if (priceSlider) {
                priceSlider.set([0, 20000]);
            }
            
            // Kör en ny sökning med de nollställda filtren
            applyFiltersAndSearch();
        }

        // Koppla funktionen till knappen
        clearFiltersBtn.addEventListener('click', clearAllFilters);
                
        productGrid.addEventListener('click', (e) => {
            const button = e.target.closest('button.details-btn');
            if (button) {
                openProductModal(button.dataset.id);
            }
            // Lägg till logik för 'add-to-cart-btn' här om du vill
        });
        
        // Starta allt
        initializeShop();
    }


    // --------------------------------------------------------------------
    // DEL 10: KOD FÖR PRODUKTSIDA (SLUTGILTIG, FELSÄKER VERSION)
    // --------------------------------------------------------------------
    const productPage = document.getElementById('product-page');
    if (productPage) {
        const contentWrapper = document.getElementById('product-content-wrapper');
        let allProductBases = [];
        let currentProductBase = null;
        let currentVariant = null;
        
        // --- 1. INITIALISERING ---
        async function initializeProductPage() {
            try {
                const params = new URLSearchParams(window.location.search);
                const variantId = params.get('id');
                if (!variantId) throw new Error('Produkt-ID saknas.');
    
                const [newDevices, usedDevices, accessories] = await Promise.all([
                    fetch('./nya-enheter.json').then(res => res.json()),
                    fetch('./used-products.json').then(res => res.json()),
                    fetch('./accessories.json').then(res => res.json())
                ]);
                
                allProductBases = [
                    ...newDevices,
                    ...usedDevices.map(p => ({...p, id_base: p.id, varianter: [p] })),
                    ...accessories.map(p => ({...p, id_base: p.id, varianter: [p] }))
                ];
                
                for (const p of allProductBases) {
                    const foundVariant = p.varianter.find(v => v.id === variantId);
                    if (foundVariant) {
                        currentProductBase = p;
                        currentVariant = foundVariant;
                        break;
                    }
                }
    
                if (!currentProductBase) throw new Error('Produkten kunde inte hittas.');
                
                renderProductPage();
            } catch (error) {
                contentWrapper.innerHTML = `<p class="error-message">${error.message}</p>`;
            }
        }
    
        // --- 2. HUVUDRENDERINGSFUNKTION (Körs bara en gång) ---
        function renderProductPage() {
            document.title = `${currentProductBase.namn} - TechZon Kalmar`;
    
            const variantOptions = {};
            if (currentProductBase.varianter.length > 1) {
                currentProductBase.varianter.forEach(v => {
                    for (const [key, value] of Object.entries(v.attribut)) {
                        if (!variantOptions[key]) variantOptions[key] = new Set();
                        variantOptions[key].add(value);
                    }
                });
            }
            
            contentWrapper.innerHTML = `
                <div class="product-page-layout">
                    <div class="pdp-gallery">
                        <div id="main-media-container"></div>
                        <ul class="pdp-thumbs-list" id="thumbs-list"></ul>
                    </div>
                    <div class="pdp-details">
                        <h1>${currentProductBase.namn}</h1>
                        <p class="description-short">${currentProductBase.beskrivning_kort || ''}</p>
                        <div id="variant-selectors">
                            ${Object.entries(variantOptions).map(([key, values]) => `
                                <div class="variant-selector">
                                    <label>${key}</label>
                                    <div class="variant-options" data-attribute="${key}">
                                        ${[...values].map(v => `<button type="button" class="variant-btn">${v}</button>`).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="pdp-price-section">
                            <p class="price"></p>
                            <p class="price-installment"></p>
                        </div>
                        <button class="pdp-buy-button">Lägg i varukorg</button>
                    </div>
                </div>
                <div class="pdp-long-info">
                    <h2>Beskrivning</h2>
                    <p>${currentProductBase.beskrivning_lang || currentProductBase.beskrivning || 'Mer information kommer snart.'}</p>
                    <h2>Specifikationer</h2>
                    <ul class="pdp-specs-list"></ul>
                </div>
            `;
            
            // Initiera UI och koppla på eventhanterare
            updateUI();
            setupEventListeners();
        }
    
        // HELA DENNA FUNKTION SKA ERSÄTTAS
    // --- 3. UI-UPPDATERING (MED FÖRFINAD INAKTIVERINGSLOGIK) ---
    function updateUI() {
        const media = currentVariant.media || (currentVariant.bilder ? currentVariant.bilder.map(url => ({ typ: 'bild', url })) : []);
        
        // Uppdatera galleri
        const thumbsList = document.getElementById('thumbs-list');
        thumbsList.innerHTML = media.map((item, index) => {
            const imageUrl = item.typ === 'video' ? 'bilder/testbild.png' : item.url;
            const videoIcon = item.typ === 'video' ? '<i class="ph-bold ph-play-circle thumb-video-icon"></i>' : '';
            return `<li data-index="${index}"><img src="${imageUrl}" alt="Thumbnail">${videoIcon}</li>`;
        }).join('');
        
        displayMedia(media[0]);
        if (thumbsList.firstChild) thumbsList.firstChild.classList.add('active');
    
        // Uppdatera pris, delbetalning och specifikationer
        contentWrapper.querySelector('.price').textContent = `${currentVariant.pris} kr`;
        const installmentP = contentWrapper.querySelector('.price-installment');
        if (installmentP) {
            installmentP.style.display = currentVariant.delbetalning_mojlig ? 'block' : 'none';
            if (currentVariant.delbetalning_mojlig) {
                installmentP.textContent = currentVariant.delbetalning_pris;
            }
        }
        const specsList = contentWrapper.querySelector('.pdp-specs-list');
        specsList.innerHTML = (currentVariant.specifikationer || []).map(spec => `<li><span>${spec.label}</span><strong>${spec.value}</strong></li>`).join('');
    
        // ---- NY, FÖRFINAD LOGIK FÖR KNAPPAR ----
        
        // 1. Hantera FÄRG-knapparna: Markera den valda, men inaktivera aldrig någon.
        const colorGroup = document.querySelector('.variant-options[data-attribute="Färg"]');
        if (colorGroup) {
            const selectedColor = currentVariant.attribut["Färg"];
            colorGroup.querySelectorAll('.variant-btn').forEach(btn => {
                btn.classList.toggle('selected', btn.textContent === selectedColor);
                btn.disabled = false; // Säkerställ att färgknappar aldrig är inaktiverade
                btn.classList.remove('disabled');
            });
        }
    
        // 2. Hantera LAGRING-knapparna: Markera den valda OCH inaktivera ogiltiga alternativ.
        const storageGroup = document.querySelector('.variant-options[data-attribute="Lagring"]');
        if (storageGroup) {
            const selectedColor = currentVariant.attribut["Färg"];
            const selectedStorage = currentVariant.attribut["Lagring"];
    
            // Hitta alla lagringsalternativ som finns för den valda färgen
            const availableStorages = new Set(
                currentProductBase.varianter
                    .filter(variant => variant.attribut["Färg"] === selectedColor)
                    .map(variant => variant.attribut["Lagring"])
            );
            
            storageGroup.querySelectorAll('.variant-btn').forEach(btn => {
                const storageValue = btn.textContent;
                
                // Markera den knapp som är aktiv
                btn.classList.toggle('selected', storageValue === selectedStorage);
                
                // Kontrollera om denna lagringsknapp är ett giltigt val för den valda färgen
                const isPossible = availableStorages.has(storageValue);
                
                // Inaktivera knappen om kombinationen inte finns
                btn.disabled = !isPossible;
                btn.classList.toggle('disabled', !isPossible);
            });
        }
        window.currentVariantForCart = currentVariant;
    }
        
        function displayMedia(mediaItem) {
            const mainMediaContainer = document.getElementById('main-media-container');
            if (!mediaItem) {
                mainMediaContainer.innerHTML = `<img src="bilder/testbild.png" alt="Bild saknas">`;
                return;
            }
            if (mediaItem.typ === 'video') {
                mainMediaContainer.innerHTML = `<video src="${mediaItem.url}" playsinline autoplay muted controls></video>`;
            } else {
                mainMediaContainer.innerHTML = `<img src="${mediaItem.url}" alt="${currentVariant.namn}">`;
            }
        }
    
        // HELA DENNA FUNKTION SKA ERSÄTTAS
    // --- 4. EVENT HANTERING (MED KORREKT FALLBACK OCH DISABLED-KONTROLL) ---
    function setupEventListeners() {
        contentWrapper.addEventListener('click', (e) => {
            const target = e.target;
            
            // Hantera klick på thumbnails
            const thumb = target.closest('.pdp-thumbs-list li');
            if (thumb) {
                const media = currentVariant.media || (currentVariant.bilder ? currentVariant.bilder.map(url => ({ typ: 'bild', url })) : []);
                const index = parseInt(thumb.dataset.index, 10);
                displayMedia(media[index]);
                document.querySelectorAll('.pdp-thumbs-list li').forEach(li => li.classList.remove('active'));
                thumb.classList.add('active');
                return;
            }
    
            // Hantera klick på variant-knappar
            const variantBtn = target.closest('.variant-btn');
            // KÖR BARA OM KNAPPEN FINNS, INTE ÄR INAKTIVERAD OCH INTE REDAN ÄR VALD
            if (variantBtn && !variantBtn.disabled && !variantBtn.classList.contains('selected')) {
                const attributeKey = variantBtn.parentElement.dataset.attribute;
                const attributeValue = variantBtn.textContent;
                
                const desiredAttributes = { ...currentVariant.attribut, [attributeKey]: attributeValue };
                
                // Steg 1: Försök hitta en exakt matchning
                let newVariant = currentProductBase.varianter.find(variant => 
                    JSON.stringify(variant.attribut) === JSON.stringify(desiredAttributes)
                );
                
                // Steg 2: Fallback - om exakt match inte finns (för att byta färg och behålla lagring t.ex.),
                // hitta den första bästa varianten som har det attribut användaren just klickade på.
                if (!newVariant) {
                    newVariant = currentProductBase.varianter.find(variant =>
                        variant.attribut[attributeKey] === attributeValue
                    );
                }
                
                if (newVariant) {
                    currentVariant = newVariant; // Uppdatera state
                    updateUI(); // Rita om hela UI:t baserat på det nya state
                }
            }
        });
    }
    
        // --- Starta allt ---
        initializeProductPage();
    }

    // --------------------------------------------------------------------
    // DEL 11: VARUKORG & KASSA (TOTAL Omskrivning)
    // --------------------------------------------------------------------
    
    class CartManager {
        constructor() {
            // Referenser till DOM-element
            this.cartIconCount = document.getElementById('cart-count');
            this.cartHoverItems = document.getElementById('cart-hover-items');
            this.checkoutPage = document.getElementById('checkout-page');
    
            // Appens state
            this.cart = JSON.parse(localStorage.getItem('techzon_cart')) || [];
            this.allProductsData = null;
    
            // Initiera allt
            this.initialize();
        }
    
        async initialize() {
            await this.fetchAllProducts(); // Ladda all produktdata
            this.updateCartUI();           // Rita ut UI baserat på sparad varukorg
            this.setupEventListeners();    // Koppla på lyssnare
        }
    
        // Hämtar och förbereder all produktdata från JSON-filerna en enda gång.
        async fetchAllProducts() {
            if (this.allProductsData) return this.allProductsData;
            try {
                const [newDevices, usedDevices, accessories] = await Promise.all([
                    fetch('./nya-enheter.json').then(res => res.json()),
                    fetch('./used-products.json').then(res => res.json()),
                    fetch('./accessories.json').then(res => res.json())
                ]);
                
                const newProductsFlat = newDevices.flatMap(p => 
                    p.varianter.map(v => ({ ...p, ...v, id_base: p.id_base, varianter: undefined }))
                );
                
                this.allProductsData = [...newProductsFlat, ...usedDevices, ...accessories];
                return this.allProductsData;
            } catch (error) {
                console.error("Kunde inte ladda all produktdata för varukorgen:", error);
                return [];
            }
        }
    
        // Lägger till en produkt i varukorgen
        async addToCart(productId) {
            if (!this.allProductsData) await this.fetchAllProducts();
        
            const productToAdd = this.allProductsData.find(p => p.id === productId);
        
            if (productToAdd) {
                // KORRIGERING: Skapa ett nytt objekt och lägg till det unika cart_id
                const cartItem = { ...productToAdd, cart_id: Date.now() };
                this.cart.push(cartItem);
                this.saveAndRender();
                
                const cartIcon = document.querySelector('.cart-icon-container i');
                if (cartIcon) {
                    cartIcon.style.transform = 'scale(1.3)';
                    setTimeout(() => { cartIcon.style.transform = 'scale(1)'; }, 300);
                }
            } else {
                console.error(`Produkt med ID ${productId} kunde inte hittas.`);
                alert('Ett fel uppstod, produkten kunde inte läggas till.');
            }
        }
    
        // Tar bort en produkt från varukorgen
        removeFromCart(cartId) {
            this.cart = this.cart.filter(item => item.cart_id !== cartId);
            this.saveAndRender();
        }
    
        // Tömmer hela varukorgen
        clearCart() {
            this.cart = [];
            this.saveAndRender();
        }
    
        // Sparar till localStorage och ritar om hela UI:t
        saveAndRender() {
            localStorage.setItem('techzon_cart', JSON.stringify(this.cart));
            this.updateCartUI();
        }
    
        // Uppdaterar ALL UI relaterad till varukorgen
        updateCartUI() {
            // 1. Uppdatera ikonen
            if (this.cart.length > 0) {
                this.cartIconCount.textContent = this.cart.length;
                this.cartIconCount.style.display = 'flex';
            } else {
                this.cartIconCount.style.display = 'none';
            }
    
            // 2. Uppdatera hover-vyn
            if (this.cartHoverItems) {
                if (this.cart.length > 0) {
                    this.cartHoverItems.innerHTML = this.cart.slice(0, 3).map(item => {
                        const imageUrl = (item.media && item.media[0]?.url) || (item.bilder && item.bilder[0]) || 'bilder/testbild.png';
                        const fullName = item.marke ? `${item.marke} ${item.namn}` : item.namn;
                        return `
                        <div class="cart-hover-item">
                            <img src="${imageUrl}" alt="${fullName}">
                            <div class="cart-hover-item-info">
                                <p>${fullName}</p>
                                <p class="price">${item.pris} kr</p>
                            </div>
                        </div>`;
                    }).join('');
                    if (this.cart.length > 3) {
                        this.cartHoverItems.innerHTML += `<p style="text-align:center; font-size: 0.9em; margin-top: 10px;">... och ${this.cart.length - 3} till.</p>`;
                    }
                } else {
                    this.cartHoverItems.innerHTML = '<p style="text-align: center; color: #888;">Din varukorg är tom.</p>';
                }
            }
    
            // 3. Om vi är på kassasidan, rita om den
            if (this.checkoutPage) {
                this.renderCheckoutPage();
            }
        }
        
        // Ritar om innehållet på kassasidan
        renderCheckoutPage() {
            const itemsContainer = document.getElementById('checkout-items-container');
            const subtotalEl = document.getElementById('summary-subtotal');
            const totalEl = document.getElementById('summary-total');
    
            if (this.cart.length === 0) {
                itemsContainer.innerHTML = '<p style="margin: 20px 0;">Din varukorg är tom.</p>';
                subtotalEl.textContent = '0 kr';
                totalEl.textContent = '0 kr';
                return;
            }
    
            itemsContainer.innerHTML = this.cart.map(item => {
                const imageUrl = (item.media && item.media[0]?.url) || (item.bilder && item.bilder[0]) || 'bilder/testbild.png';
                const fullName = item.marke ? `${item.marke} ${item.namn}` : item.namn;
                return `
                <div class="checkout-item">
                    <a href="produkt.html?id=${item.id}" class="checkout-item-image-link">
                        <img src="${imageUrl}" alt="${fullName}">
                    </a>
                    <div class="checkout-item-info">
                        <a href="produkt.html?id=${item.id}"><h4>${fullName}</h4></a>
                        <p>Art.nr: ${item.id}</p>
                        <div class="checkout-item-actions">
                            <button class="remove-from-cart-btn" data-cart-id="${item.cart_id}">Ta bort</button>
                        </div>
                    </div>
                    <div class="checkout-item-price">${item.pris} kr</div>
                </div>`;
            }).join('');
    
            const subtotal = this.cart.reduce((sum, item) => sum + item.pris, 0);
            subtotalEl.textContent = `${subtotal} kr`;
            totalEl.textContent = `${subtotal} kr`;
        }
    
        // Sätter upp alla event listeners
        setupEventListeners() {
            // En enda, kraftfull event listener för hela sidan
            document.body.addEventListener('click', (e) => {
                const button = e.target.closest('.add-to-cart-btn, .pdp-buy-button');
                if (button) {
                    e.preventDefault();
                    const productId = button.dataset.id || (window.currentVariantForCart && window.currentVariantForCart.id);
                    if (productId) {
                        this.addToCart(productId);
                    }
                }
            });
    
            // Event listener för kassasidan
            if (this.checkoutPage) {
                const itemsContainer = document.getElementById('checkout-items-container');
                itemsContainer.addEventListener('click', (e) => {
                    // Se till att vi bara reagerar på klick på en "ta bort"-knapp
                    if (e.target.classList.contains('remove-from-cart-btn')) {
                        // Hämta det UNIKA cart_id från knappen (inte det generella produkt-id)
                        // parseInt konverterar texten "167888..." till ett nummer
                        const cartIdToRemove = parseInt(e.target.dataset.cartId, 10);
                        
                        // Hitta hela produktobjektet för att kunna visa namnet i dialogen
                        const itemToRemove = this.cart.find(item => item.cart_id === cartIdToRemove);
                        
                        if (itemToRemove) {
                            const wantsToRemove = confirm(`Är du säker på att du vill ta bort "${itemToRemove.namn}" från varukorgen?`);
                            
                            if (wantsToRemove) {
                                // Anropa removeFromCart med det UNIKA cart_id
                                this.removeFromCart(cartIdToRemove);
                            }
                        }
                    }
                });
                    
                document.getElementById('checkout-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (this.cart.length === 0) {
                        alert("Din varukorg är tom!");
                        return;
                    }
                    alert('Tack för din beställning!');
                    this.clearCart();
                    window.location.href = 'index.html';
                });
            }
        }
    }
    
    // Starta varukorgshanteraren på varje sida
    new CartManager();
    
});
