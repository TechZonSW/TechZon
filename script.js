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
            activeStatusList = document.getElementById('activeStatusList');
    
        // --- State-variabler (appens minne) ---
        let jwtToken = sessionStorage.getItem('techzon_jwt') || null;
        let allRepairs = [];
        let activeRepair = null;
        let currentCaseView = 'active'; // Håller reda på vilken vy vi är i
    
        // --- Funktioner ---

        function switchMainView(viewToShow) {
            casesView.style.display = 'none';
            scanView.style.display = 'none';
            [navActiveBtn, navArchivedBtn, navScanBtn].forEach(b => b.classList.remove('active'));
        
            if (viewToShow === 'scan') {
                scanView.style.display = 'block';
                navScanBtn.classList.add('active');
            } else { // 'cases'
                casesView.style.display = 'block';
                // Markera rätt ärende-knapp baserat på vilken vy vi senast var i
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
    
        // --- Sidladdning ---
        if (jwtToken) {
            dashboardView.style.display = 'block';
            loginView.style.display = 'none';
            switchMainView('cases');
            fetchAndRenderRepairs('active');
        }
    }

    // --------------------------------------------------------------------
    // DEL 9: KOD FÖR E-HANDELSSIDAN (KOMPLETT OCH KORRIGERAD VERSION)
    // --------------------------------------------------------------------
    const shopPage = document.getElementById('shop-page');
    if (shopPage) {
        // --- Referenser ---
        const searchInput = document.getElementById('searchInput');
        const filtersContainer = document.getElementById('filters-container');
        const productGrid = document.getElementById('product-grid');
        const noResultsMessage = document.getElementById('no-results-message');
        const modal = document.getElementById('productModal');
        const modalBody = document.getElementById('modalBody');
        const closeModalBtn = document.getElementById('closeModalBtn');
    
        // --- State ---
        let allProducts = [];
        let priceSlider = null;
        let activeFilters = {
            kategori: [],
            marke: [],
            typ: [],
            price: { min: 0, max: 20000 }
        };
    
        // --- 1. INITIALISERING ---
        async function initializeShop() {
            try {
                const [newDevices, usedDevices, accessories] = await Promise.all([
                    fetch('./nya-enheter.json').then(res => res.json()),
                    fetch('./used-products.json').then(res => res.json()),
                    fetch('./accessories.json').then(res => res.json())
                ]);
                
                // Flatta ut "nya"-produkter så varje variant blir en egen produkt i listan
                const newProductsFlat = newDevices.flatMap(p => 
                    p.varianter.map(v => ({ ...p, ...v }))
                );
    
                allProducts = [ ...newProductsFlat, ...usedDevices, ...accessories ];
                
                // ... (resten av initializeShop, oförändrat)
                populateFilters();
                parseUrlParams();
                applyFiltersAndSearch();
            } catch (error) {
                console.error("Kunde inte ladda produkter:", error);
                productGrid.innerHTML = '<p class="error-message">Ett fel uppstod vid laddning av produkter. Försök igen senare.</p>';
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
            
            const filteredProducts = allProducts.filter(p => {
                const matchesSearch = !searchTerm || (p.namn && p.namn.toLowerCase().includes(searchTerm)) || (p.marke && p.marke.toLowerCase().includes(searchTerm));
                
                const matchesKategori = activeFilters.kategori.length === 0 || activeFilters.kategori.includes(p.kategori);
                const matchesMarke = activeFilters.marke.length === 0 || (p.marke && activeFilters.marke.includes(p.marke.toLowerCase()));
                const matchesTyp = activeFilters.typ.length === 0 || (p.typ && activeFilters.typ.includes(p.typ.toLowerCase()));
    
                const matchesPrice = p.pris >= activeFilters.price.min && p.pris <= activeFilters.price.max;
                
                return matchesSearch && matchesKategori && matchesMarke && matchesTyp && matchesPrice;
            });
            
            renderProducts(filteredProducts);
        }
        
        // --- 3. RENDERING (KORRIGERAD MED TVÅ KNAPPAR) ---
        function renderProducts(products) {
            productGrid.innerHTML = '';
            noResultsMessage.style.display = products.length === 0 ? 'block' : 'none';
        
            products.forEach(p => {
                const displayProduct = p.varianter ? p.varianter[0] : p;
                const imageUrl = (displayProduct.media && displayProduct.media[0]?.url) || (displayProduct.bilder && displayProduct.bilder[0]) || 'bilder/testbild.png';
        
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <a href="produkt.html?id=${displayProduct.id}" class="product-card-link">
                        <img src="${imageUrl}" alt="${p.namn}">
                    </a>
                    <div class="product-card-content">
                        <h4>${p.marke ? `${p.marke} ${p.namn}` : p.namn}</h4>
                        <p class="price">${displayProduct.pris} kr</p>
                        ${displayProduct.delbetalning_mojlig ? `<p class="price-installment">${displayProduct.delbetalning_pris}</p>` : ''}
                        <div class="product-card-buttons">
                            <a href="produkt.html?id=${displayProduct.id}"><button class="details-btn">Se detaljer</button></a>
                            <button class="add-to-cart-btn" data-id="${displayProduct.id}">Lägg i korg</button>
                        </div>
                    </div>
                `;
                productGrid.appendChild(card);
            });
        }
    
    
        // --- 4. EVENT LISTENERS ---
        productGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                e.preventDefault(); // Förhindra att länken följs om man klickar på knappen
                alert(`Produkt med ID ${e.target.dataset.id} lades till (logik ej implementerad).`);
            }
        });
        
        searchInput.addEventListener('input', applyFiltersAndSearch);
    
        filtersContainer.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const filterType = e.target.dataset.filter;
                const value = e.target.value;
                
                if (e.target.checked) {
                    activeFilters[filterType].push(value);
                } else {
                    activeFilters[filterType] = activeFilters[filterType].filter(item => item !== value);
                }
                applyFiltersAndSearch();
            }
        });
        
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
    // DEL 10: KOD FÖR PRODUKTSIDA (EGEN, ROBUST BILDVISARE)
    // --------------------------------------------------------------------
    const productPage = document.getElementById('product-page');
    if (productPage) {
        const contentWrapper = document.getElementById('product-content-wrapper');
        let allProductBases = [];
        let currentProductBase = null;
        let currentVariant = null;
        
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
                                        ${[...values].map(v => `<button class="variant-btn">${v}</button>`).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <p class="price">${currentVariant.pris} kr</p>
                        ${currentVariant.delbetalning_mojlig ? `<p class="price-installment">${currentVariant.delbetalning_pris}</p>` : ''}
                        <button class="pdp-buy-button">Lägg i varukorg</button>
                    </div>
                </div>
                <div class="pdp-long-info">
                    <h2>Beskrivning</h2>
                    <p>${currentProductBase.beskrivning_lang || currentProductBase.beskrivning || 'Mer information kommer snart.'}</p>
                    <h2>Specifikationer</h2>
                    <ul class="pdp-specs-list">
                        ${(currentVariant.specifikationer || []).map(spec => `<li><span>${spec.label}</span><strong>${spec.value}</strong></li>`).join('')}
                    </ul>
                </div>
            `;
    
            updateVariantUI();
            setupEventListeners();
        }
    
        function updateVariantUI() {
            const media = currentVariant.media || (currentVariant.bilder ? currentVariant.bilder.map(url => ({ typ: 'bild', url })) : []);
            
            const mainMediaContainer = document.getElementById('main-media-container');
            const thumbsList = document.getElementById('thumbs-list');
            
            thumbsList.innerHTML = media.map((item, index) => {
                const isActive = index === 0 ? 'class="active"' : '';
                if (item.typ === 'video') {
                    return `<li ${isActive} data-index="${index}"><img src="bilder/testbild.png" alt="Video thumbnail"><i class="ph-bold ph-play-circle thumb-video-icon"></i></li>`;
                }
                return `<li ${isActive} data-index="${index}"><img src="${item.url}" alt="${currentVariant.namn}"></li>`;
            }).join('');
            
            // Visa första bilden/videon som standard
            displayMedia(media[0]);
    
            // Uppdatera resten av UI:t
            contentWrapper.querySelector('.price').textContent = `${currentVariant.pris} kr`;
            const installmentP = contentWrapper.querySelector('.price-installment');
            if (installmentP) {
                installmentP.style.display = currentVariant.delbetalning_mojlig ? 'block' : 'none';
                if (currentVariant.delbetalning_mojlig) {
                    installmentP.textContent = currentVariant.delbetalning_pris;
                }
            }
            
            document.querySelectorAll('.variant-btn').forEach(btn => btn.classList.remove('selected'));
            if (currentVariant.attribut) {
                for (const [key, value] of Object.entries(currentVariant.attribut)) {
                    const btns = document.querySelectorAll(`.variant-options[data-attribute="${key}"] button`);
                    btns.forEach(btn => {
                        if(btn.textContent === value) btn.classList.add('selected');
                    });
                }
            }
        }
        
        function displayMedia(mediaItem) {
            const mainMediaContainer = document.getElementById('main-media-container');
            if (mediaItem.typ === 'video') {
                mainMediaContainer.innerHTML = `<video src="${mediaItem.url}" playsinline autoplay muted controls></video>`;
            } else {
                mainMediaContainer.innerHTML = `<img src="${mediaItem.url}" alt="${currentVariant.namn}">`;
            }
        }
    
        function setupEventListeners() {
            // Event listener för thumbnails (använder event delegation)
            contentWrapper.addEventListener('click', (e) => {
                const thumb = e.target.closest('.pdp-thumbs-list li');
                if (thumb) {
                    const media = currentVariant.media || (currentVariant.bilder ? currentVariant.bilder.map(url => ({ typ: 'bild', url })) : []);
                    const index = parseInt(thumb.dataset.index, 10);
                    
                    // Ta bort 'active' från alla thumbnails och lägg till på den klickade
                    document.querySelectorAll('.pdp-thumbs-list li').forEach(li => li.classList.remove('active'));
                    thumb.classList.add('active');
                    
                    displayMedia(media[index]);
                }
            });
            
            // Event listener för variant-knappar
            const selectors = document.getElementById('variant-selectors');
            if (selectors) {
                selectors.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON' && e.target.classList.contains('variant-btn')) {
                        const attribute = e.target.parentElement.dataset.attribute;
                        const value = e.target.textContent;
                        
                        const currentAttributes = { ...currentVariant.attribut };
                        currentAttributes[attribute] = value;
                        
                        // Hitta den bästa matchande varianten
                        let newVariant = currentProductBase.varianter.find(v => {
                            return Object.entries(currentAttributes).every(([key, val]) => v.attribut[key] === val);
                        });
                        
                        if (newVariant) {
                            currentVariant = newVariant;
                            updateVariantUI(); // Rita om hela UI:t med den nya variantens data
                        }
                    }
                });
            }
        }
    
        initializeProductPage();
    }

});
