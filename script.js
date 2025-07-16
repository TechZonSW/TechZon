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

});
