let postalCodesData = null;
let isLoadingPostalCodes = false;


// Spanish bank codes (some of the most common ones)
const BANK_CODES = [
    '0049', '0182', '0081', '2100', '0128', // Santander, BBVA, Sabadell, CaixaBank, Bankinter
    '2038', '0019', '2085', '3190', '2095'  // Common regional banks
];

// Spanish names data
const firstNames = ['Antonio', 'María', 'José', 'Carmen', 'Manuel', 'Ana', 'Francisco', 'Isabel', 'Juan', 'Laura'];
const lastNames = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín'];
const streets = [
    'Calle Mayor', 'Avenida de la Constitución', 'Plaza España', 'Calle Real', 'Gran Vía',
    'Calle del Sol', 'Paseo de la Castellana', 'Rambla Catalunya', 'Calle Alcalá', 'Avenida Diagonal',
    'Plaza Mayor', 'Calle San Francisco', 'Paseo Marítimo', 'Calle del Carmen', 'Avenida del Puerto',
    'Calle San Miguel', 'Plaza del Ayuntamiento', 'Calle Nueva', 'Avenida de América', 'Calle Princesa',
    'Calle del Mar', 'Paseo del Prado', 'Calle Santa María', 'Avenida de Madrid', 'Calle Victoria'
];

// Populate city select with Select2
$(document).ready(function() {
    console.log('Document ready, initializing city select...');
    const citySelect = $('#selectedCity');
    
    try {
        console.log('Initializing Select2...');
        citySelect.select2({
            placeholder: 'Selecciona una ciudad...',
            allowClear: true,
            width: '100%',
            height: '100%',
            theme: 'default',
            minimumInputLength: 0, // Changed to 0 to allow showing initial values
            language: {
                inputTooShort: function(args) {
                    // Only show message if user has started typing
                    if (args.input.length > 0) {
                        return "Por favor ingresa 2 o más caracteres";
                    }
                    return "";
                },
                noResults: function() {
                    return "No se encontraron resultados";
                },
                searching: function() {
                    return "Buscando...";
                }
            },
            ajax: {
                delay: 250,
                data: function(params) {
                    console.log('Search params:', params);
                    return {
                        term: params.term || '',
                        page: params.page || 1
                    };
                },
                transport: function(params, success, failure) {
                    console.log('Transport called with term:', params.data.term);
                    try {
                        const results = codigosPostales
                            .filter(city => {
                                if (!params.data.term) return true;
                                return city.n.toLowerCase().includes(params.data.term.toLowerCase());
                            })
                            .slice(0, 30)
                            .map(city => ({
                                id: city.n,
                                text: city.n
                            }));

                        console.log('Found results:', results.length);
                        success({
                            results: results,
                            pagination: {
                                more: false
                            }
                        });
                    } catch (error) {
                        console.error('Error in transport:', error);
                        failure('Error loading cities');
                    }
                },
                cache: true
            },
            selectionCssClass: 'dark:!bg-gray-700 dark:!text-white dark:!border-gray-600 !h-full !flex !items-center',
            dropdownCssClass: 'dark:!bg-gray-700 dark:!text-white',
            templateSelection: function(data) {
                if (!data.id) {
                    return $('<span class="dark:text-gray-400">' + data.text + '</span>');
                }
                return $('<span class="dark:text-white">' + data.text + '</span>');
            }
        }).next('.select2-container').css('height', '100%')
          .find('.selection').css('height', '100%')
          .find('.select2-selection').css('height', '100%')
          .parent().find('.select2-search__field').addClass('dark:!bg-gray-700 dark:!text-white dark:!border-gray-600');

        // Add initial top 50 cities by postal code count, sorted alphabetically
        const popularCities = codigosPostales
            .sort((a, b) => b.cp.length - a.cp.length) // First sort by postal code count
            .slice(0, 50) // Take top 50
            .sort((a, b) => a.n.localeCompare(b.n)) // Then sort alphabetically
            .map(city => ({
                id: city.n,
                text: city.n
            }));

        // Add the initial options
        popularCities.forEach(city => {
            const option = new Option(city.text, city.id, false, false);
            citySelect.append(option);
        });
        
        // Log initial state
        console.log('Initial cities loaded:', popularCities.length);
        console.log('Select2 initialization complete');

        // Add change event listener
        citySelect.on('change', function(e) {
            console.log('Selection changed:', e.target.value);
        });

        // Add search event listener
        citySelect.on('select2:searching', function(e) {
            console.log('Searching:', e.params.term);
        });
    } catch (error) {
        console.error('Failed to initialize Select2:', error);
        console.error('Error stack:', error.stack);
        citySelect.append(new Option('Error loading cities', ''));
    }
});

// Handle random city selection
document.getElementById('randomCityBtn').addEventListener('click', () => {
    try {
        const cities = codigosPostales;
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        
        // Create the option and update Select2
        const newOption = new Option(randomCity.n, randomCity.n, true, true);
        $('#selectedCity').empty().append(newOption).trigger('change');
    } catch (error) {
        console.error('Failed to select random city:', error);
    }
});

// Generate data when button is clicked
document.getElementById('generateBtn').addEventListener('click', async () => {
    try {
        let selectedCity = document.getElementById('selectedCity').value;
        
        if (!selectedCity) {
            const cities = [...new Set(codigosPostales.map(pc => pc.n))];
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            selectedCity = randomCity;
            document.getElementById('selectedCity').value = selectedCity;
        }

        const fullName = generateFullName();
        const idNumber = generateId();
        const idsep = generateIDSEP();
        const landlinePhone = generateLandlinePhone();
        const mobilePhone = generateMobilePhone();
        const iban = generateIBAN();
        const birthDate = generateBirthDate();
        const addressData = await generateAddress(selectedCity);

        // Update UI with generated data
        document.getElementById('fullName').value = fullName;
        document.getElementById('idNumber').textContent = idNumber;
        document.getElementById('idsep').textContent = idsep;
        document.getElementById('landlinePhone').textContent = landlinePhone;
        document.getElementById('mobilePhone').textContent = mobilePhone;
        document.getElementById('iban').textContent = iban;
        document.getElementById('birthDate').textContent = birthDate;
        document.getElementById('city').textContent = addressData.city;
        document.getElementById('address').textContent = addressData.fullAddress;
        document.getElementById('postalCode').textContent = addressData.postalCode;

        const resultCard = document.getElementById('resultCard');
        resultCard.classList.remove('hidden');

        // Add to history
        addToHistory({
            fullName,
            idNumber,
            idsep,
            landlinePhone,
            mobilePhone,
            iban,
            birthDate,
            city: addressData.city,
            fullAddress: addressData.fullAddress,
            postalCode: addressData.postalCode
        });
    } catch (error) {
        console.error('Failed to generate data:', error);
        alert('Error generating data. Please try again.');
    }
});

// Generate DNI letter for a given number
function getDNILetter(number) {
    const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    return letters[number % 23];
}

// Generate valid DNI/NIE
function generateId() {
    const isNIE = Math.random() < 0.2;

    if (isNIE) {
        const nieLetters = ['X', 'Y', 'Z'];
        const firstLetter = nieLetters[Math.floor(Math.random() * nieLetters.length)];
        const number = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
        const numericValue = (firstLetter === 'X' ? '0' : firstLetter === 'Y' ? '1' : '2') + number;
        const letter = getDNILetter(parseInt(numericValue, 10));
        return `${firstLetter}${number}${letter}`;
    } else {
        const number = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
        const letter = getDNILetter(parseInt(number, 10));
        return `${number}${letter}`;
    }
}

// Calculate IBAN check digits
function calculateIBANCheckDigits(countryCode, bban) {
    // Convert the BBAN to a number for MOD97 calculation
    let numericString = '';
    
    // First, convert the BBAN
    for (let i = 0; i < bban.length; i++) {
        const char = bban.charAt(i);
        if (char >= '0' && char <= '9') {
            numericString += char;
        } else {
            numericString += (char.charCodeAt(0) - 55).toString();
        }
    }
    
    // Then append the country code and '00'
    for (let i = 0; i < countryCode.length; i++) {
        numericString += (countryCode.charCodeAt(i) - 55).toString();
    }
    numericString += '00';

    // Calculate MOD-97 on the complete numeric string
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
        remainder = ((remainder * 10) + parseInt(numericString.charAt(i))) % 97;
    }

    // The check digits are 98 minus the remainder
    const checkDigits = String(98 - remainder).padStart(2, '0');
    return checkDigits;
}

// Calculate control digits for Spanish bank accounts
function calculateControlDigits(bankCode, branchCode, accountNumber) {
    // First control digit (for bank and branch)
    const firstNumber = bankCode + branchCode;
    const weights1 = [4, 8, 5, 10, 9, 7, 3, 6];
    let sum1 = 0;
    
    for (let i = 0; i < firstNumber.length; i++) {
        sum1 += parseInt(firstNumber[i]) * weights1[i];
    }
    
    const controlDigit1 = 11 - (sum1 % 11);
    const firstControlDigit = controlDigit1 === 11 ? '0' : controlDigit1 === 10 ? '1' : controlDigit1.toString();
    
    // Second control digit (for account number)
    const weights2 = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];
    let sum2 = 0;
    
    for (let i = 0; i < accountNumber.length; i++) {
        sum2 += parseInt(accountNumber[i]) * weights2[i];
    }
    
    const controlDigit2 = 11 - (sum2 % 11);
    const secondControlDigit = controlDigit2 === 11 ? '0' : controlDigit2 === 10 ? '1' : controlDigit2.toString();
    
    return firstControlDigit + secondControlDigit;
}

// Generate valid Spanish IBAN
function generateIBAN() {
    // Spanish bank codes (some of the most common ones)
    const bankCode = BANK_CODES[Math.floor(Math.random() * BANK_CODES.length)];
    
    // Generate branch code (4 digits)
    const branchCode = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    // Generate account number (10 digits)
    const accountNumber = String(Math.floor(Math.random() * 10000000000)).padStart(10, '0');
    
    // Calculate control digits for the Spanish account
    const controlDigits = calculateControlDigits(bankCode, branchCode, accountNumber);
    
    // Combine to form BBAN (20 digits)
    const bban = `${bankCode}${branchCode}${controlDigits}${accountNumber}`;
    
    // Calculate IBAN check digits
    const checkDigits = calculateIBANCheckDigits('ES', bban);
    
    // Form the complete IBAN
    const iban = `ES${checkDigits}${bban}`;
    
    // Validate the generated IBAN
    if (!validateIBAN(iban)) {
        // If validation fails, try again (recursive call)
        return generateIBAN();
    }
    
    // Format the IBAN for display (groups of 4)
    return iban.match(/.{1,4}/g).join(' ');
}

// Validate Spanish account control digits
function validateControlDigits(bankCode, branchCode, controlDigits, accountNumber) {
    const calculatedControlDigits = calculateControlDigits(bankCode, branchCode, accountNumber);
    return controlDigits === calculatedControlDigits;
}

// Enhanced IBAN validation including Spanish control digits check
function validateIBAN(iban) {
    // Remove spaces and convert to uppercase
    iban = iban.replace(/\s/g, '').toUpperCase();
    
    // Check basic format
    if (!/^ES\d{22}$/.test(iban)) {
        return false;
    }
    
    // Extract components
    const bankCode = iban.slice(4, 8);
    const branchCode = iban.slice(8, 12);
    const controlDigits = iban.slice(12, 14);
    const accountNumber = iban.slice(14);
    
    // Validate Spanish control digits
    if (!validateControlDigits(bankCode, branchCode, controlDigits, accountNumber)) {
        return false;
    }
    
    // Move first 4 characters to end
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    
    // Convert letters to numbers (A=10, B=11, etc.)
    let numericString = '';
    for (let i = 0; i < rearranged.length; i++) {
        const char = rearranged.charAt(i);
        if (char >= '0' && char <= '9') {
            numericString += char;
        } else {
            numericString += (char.charCodeAt(0) - 55).toString();
        }
    }
    
    // Calculate remainder using mod-97
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
        remainder = ((remainder * 10) + parseInt(numericString.charAt(i))) % 97;
    }
    
    return remainder === 1;
}

// Generate random birth date (between 18 and 80 years old)
function generateBirthDate() {
    const today = new Date();
    const minAge = 18;
    const maxAge = 80;
    const minDate = new Date(today.getFullYear() - maxAge, 0, 1);
    const maxDate = new Date(today.getFullYear() - minAge, 11, 31);
    const randomDate = new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
    return randomDate.toLocaleDateString('es-ES');
}

// Generate random address
async function generateAddress(customCity = '') {
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 150) + 1;
    const floor = Math.floor(Math.random() * 8) + 1;
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 4));
    
    let cityData;
    if (customCity) {
        cityData = codigosPostales.find(c => c.n === customCity) || codigosPostales[Math.floor(Math.random() * codigosPostales.length)];
    } else {
        cityData = codigosPostales[Math.floor(Math.random() * codigosPostales.length)];
    }

    // Get a random postal code for the city
    const postalCode = cityData.cp[Math.floor(Math.random() * cityData.cp.length)];

    return {
        city: cityData.n,
        fullAddress: `${street}, ${number}, ${floor}º${letter}, ${postalCode} ${cityData.n}`,
        postalCode: postalCode
    };
}
// Generate full name
function generateFullName() {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName1 = lastNames[Math.floor(Math.random() * lastNames.length)];
    const lastName2 = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName1} ${lastName2}`;
}

// History Management
const HISTORY_KEY = 'generatedDataHistory';

// Load history from localStorage
function loadHistory() {
    try {
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
        console.error('Error loading history from localStorage:', error);
        return [];
    }
}

// Save history to localStorage
function saveHistory(history) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving history to localStorage:', error);
    }
}

// Add a new dataset to history
function addToHistory(data) {
    const history = loadHistory();
    history.unshift(data); // Add to the beginning
    saveHistory(history);
    updateHistoryCount();
    renderHistoryList();
}

// Remove a dataset from history by index
function removeFromHistory(index) {
    const history = loadHistory();
    if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        saveHistory(history);
        updateHistoryCount();
        renderHistoryList();
    }
}

// Export history as JSON file
function exportHistory() {
    const history = loadHistory();
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historial_generado.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Import history from JSON file
function importHistory(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                saveHistory(importedData);
                updateHistoryCount();
                renderHistoryList();
                alert('Historial importado correctamente.');
            } else {
                throw new Error('Formato inválido');
            }
        } catch (error) {
            console.error('Error importing history:', error);
            alert('Error al importar el historial. Asegúrate de que el archivo es válido.');
        }
    };
    reader.readAsText(file);
}

// Update history count display and button visibility
function updateHistoryCount() {
    const history = loadHistory();
    const countElement = document.getElementById('historyCount');
    const clearButton = document.getElementById('clearHistoryBtn');
    
    countElement.textContent = `${history.length} ${history.length === 1 ? 'registro' : 'registros'}`;
    
    // Show/hide clear button based on history length
    if (history.length > 0) {
        clearButton.classList.remove('hidden');
    } else {
        clearButton.classList.add('hidden');
    }
}

// Clear all history
function clearAllHistory() {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
        localStorage.removeItem(HISTORY_KEY);
        updateHistoryCount();
        renderHistoryList();
    }
}
document.getElementById('clearHistoryBtn').addEventListener('click', clearAllHistory);

// Render history list with the new compact design
function renderHistoryList() {
    const historyList = document.getElementById('historyList');
    const history = loadHistory();
    
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-4">No hay registros en el historial</p>';
        return;
    }
    
    history.forEach((data, index) => {
        const item = document.createElement('div');
        item.className = 'history-item mb-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md';
        
        item.innerHTML = `
            <div class="history-item-header bg-gray-50 dark:bg-gray-800 flex items-center justify-between p-2 sm:p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" onclick="toggleHistoryItem(${index})">
                <div class="basic-info flex flex-row gap-2 sm:gap-3 overflow-hidden">
                    <span class="name cursor-pointer bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 truncate" onclick="event.stopPropagation(); copyWithSnackbar('${data.fullName}', 'Nombre copiado')">
                        ${data.fullName}
                        <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </span>
                    <span class="dni cursor-pointer bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 truncate" onclick="event.stopPropagation(); copyWithSnackbar('${data.idNumber}', 'DNI/NIE copiado')">
                        ${data.idNumber}
                        <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </span>
                </div>
                <button class="expand-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200 ml-2">▼</button>
            </div>
            <div class="history-item-details hidden bg-white dark:bg-gray-800 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
                <div class="details-grid grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div class="detail-item">
                        <div class="data-label text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">IBAN</div>
                        <div class="data-value cursor-pointer bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" onclick="copyWithSnackbar('${data.iban}', 'IBAN copiado')">
                            ${data.iban}
                            <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="data-label text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha de Nacimiento</div>
                        <div class="data-value cursor-pointer bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" onclick="copyWithSnackbar('${data.birthDate}', 'Fecha de nacimiento copiada')">
                            ${data.birthDate}
                            <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="data-label text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Ciudad</div>
                        <div class="data-value cursor-pointer bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" onclick="copyWithSnackbar('${data.city}', 'Ciudad copiada')">
                            ${data.city}
                            <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="data-label text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Dirección</div>
                        <div class="data-value cursor-pointer bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" onclick="copyWithSnackbar('${data.fullAddress}', 'Dirección copiada')">
                            ${data.fullAddress}
                            <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="data-label text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Código Postal</div>
                        <div class="data-value cursor-pointer bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" onclick="copyWithSnackbar('${data.postalCode}', 'Código postal copiado')">
                            ${data.postalCode}
                            <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>
                    </div>
                </div>
                <div class="action-buttons mt-3 sm:mt-4 flex gap-3 sm:gap-4 justify-end">
                    <button class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center gap-1" onclick="copyHistoryItem(${index})">
                        📋 Copiar Todo
                    </button>
                    <button class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center gap-1" onclick="removeFromHistory(${index})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
        
        historyList.appendChild(item);
    });
}

// Copy text and show snackbar notification
function copyWithSnackbar(text, message) {
    navigator.clipboard.writeText(text).then(() => {
        // Create snackbar element if it doesn't exist
        let snackbar = document.getElementById('snackbar');
        if (!snackbar) {
            snackbar = document.createElement('div');
            snackbar.id = 'snackbar';
            snackbar.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg opacity-0 transition-opacity duration-300';
            document.body.appendChild(snackbar);
        }

        // Update and show snackbar
        snackbar.textContent = message;
        snackbar.style.opacity = '1';

        // Hide snackbar after 2 seconds
        setTimeout(() => {
            snackbar.style.opacity = '0';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}


// Copy history item to clipboard
function copyHistoryItem(index) {
    const history = loadHistory();
    const data = history[index];
    const text = `Nombre: ${data.fullName}
DNI/NIE: ${data.idNumber}
IBAN: ${data.iban}
Fecha de Nacimiento: ${data.birthDate}
Ciudad: ${data.city}
Dirección: ${data.fullAddress}
Código Postal: ${data.postalCode}`;

    copyWithSnackbar(text, 'Datos copiados al portapapeles');
    
    // Show a subtle feedback animation
    const items = document.querySelectorAll('.history-item');
    items[index].style.backgroundColor = '#e0e7ff';
    setTimeout(() => {
        items[index].style.backgroundColor = '';
    }, 200);
}

// Save data to local storage (updated to handle history)
function saveToLocalStorage(data) {
    try {
        addToHistory(data);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Load data from local storage (last generated)
function loadFromLocalStorage() {
    try {
        const history = loadHistory();
        return history.length > 0 ? history[0] : null;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return null;
    }
}

// Generate all data
function generateAllData() {
    const address = generateAddress(document.getElementById('city').value);
    const data = {
        fullName: document.getElementById('fullName').value || generateFullName(),
        idNumber: generateId(),
        iban: generateIBAN(),
        birthDate: generateBirthDate(),
        city: address.city,
        fullAddress: address.fullAddress,
        postalCode: address.postalCode
    };
    saveToLocalStorage(data);
    return data;
}


// Copy specific field to clipboard
function copyFieldToClipboard(fieldId) {
    try {
        const element = document.getElementById(fieldId);
        const text = element.tagName === 'INPUT' ? element.value : element.textContent;
        const button = document.querySelector(`[data-field="${fieldId}"]`);
        const originalEmoji = button.textContent;
        
        copyWithSnackbar(text, '¡Campo copiado al portapapeles!');
        button.textContent = '✅';
        setTimeout(() => button.textContent = originalEmoji, 1000);
    } catch (error) {
        console.error('Error in copyFieldToClipboard:', error);
    }
}

// Copy all data to clipboard
function copyAllToClipboard() {
    try {
        const data = {
            'Nombre': document.getElementById('fullName').value,
            'DNI/NIE': document.getElementById('idNumber').textContent,
            'IBAN': document.getElementById('iban').textContent,
            'Fecha de Nacimiento': document.getElementById('birthDate').textContent,
            'Dirección': document.getElementById('address').textContent
        };

        const text = Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

        copyWithSnackbar(text, '¡Datos copiados al portapapeles!');
    } catch (error) {
        console.error('Error in copyAllToClipboard:', error);
    }
}

document.getElementById('copyBtn').addEventListener('click', copyAllToClipboard);

// Add event listeners for individual copy buttons
document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', () => {
        copyFieldToClipboard(button.dataset.field);
    });
});

// Update address when city changes
document.getElementById('city').addEventListener('change', (e) => {
    try {
        if (e.target.value) {
            const address = generateAddress(e.target.value);
            document.getElementById('address').textContent = address.fullAddress;
            document.getElementById('postalCode').textContent = address.postalCode;
            document.getElementById('city').textContent = address.city;
        }
    } catch (error) {
        console.error('Error updating address:', error);
    }
});

// History Section Functionality

// Toggle History Section
document.getElementById('toggleHistoryBtn').addEventListener('click', () => {
    const historySection = document.getElementById('historySection');
    historySection.classList.toggle('hidden');
});

// Export History
document.getElementById('exportHistoryBtn').addEventListener('click', exportHistory);

// Import History
document.getElementById('importHistoryBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
});

document.getElementById('importFileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        importHistory(file);
    }
});

// Initialize History on Page Load
document.addEventListener('DOMContentLoaded', () => {
    updateHistoryCount();
    renderHistoryList();
});

// Add new function to toggle history item details
function toggleHistoryItem(index) {
    const historyItems = document.querySelectorAll('.history-item');
    const details = historyItems[index].querySelector('.history-item-details');
    const expandBtn = historyItems[index].querySelector('.expand-btn');
    
    details.classList.toggle('hidden');
    expandBtn.style.transform = details.classList.contains('hidden') ? 
        'rotate(0deg)' : 'rotate(180deg)';
}

// Generate IDSEP (DNI support number)
function generateIDSEP() {
    // IDSEP format: AAA123456 (3 letters followed by 6 numbers)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let idsep = '';
    
    // Generate 3 random letters
    for (let i = 0; i < 3; i++) {
        idsep += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generate 6 random numbers
    idsep += String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    
    return idsep;
}

// Generate Spanish landline phone number
function generateLandlinePhone() {
    // Spanish landline prefixes (some common ones)
    const landlinePrefixes = ['91', '93', '96', '95', '94', '98', '97', '92', '85', '86'];
    const prefix = landlinePrefixes[Math.floor(Math.random() * landlinePrefixes.length)];
    const number = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
    return prefix + number;
}

// Generate Spanish mobile phone number
function generateMobilePhone() {
    // Spanish mobile prefixes
    const mobilePrefixes = ['6', '7'];
    const prefix = mobilePrefixes[Math.floor(Math.random() * mobilePrefixes.length)];
    const number = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
    return prefix + number;
}
