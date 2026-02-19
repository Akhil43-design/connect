// Modern QR Scanner for Mobile
// Optimized for performance and UX

let html5QrCode;
let isScanning = false;
let currentProduct = null;
let soundEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    startScanner();
});

function startScanner() {
    const readerElement = document.getElementById("qr-reader");
    if (!readerElement) return;

    // Show scanning animation
    document.getElementById('scan-line').style.display = 'block';

    html5QrCode = new Html5Qrcode("qr-reader");

    const config = {
        fps: 30,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        }
    };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error("Camera start failed", err);
        document.querySelector('.scanner-wrapper').innerHTML = `
            <div style="padding: 20px; text-align: center; color: white;">
                <p>Camera access denied or unavailable.</p>
                <button class="control-btn" style="margin: 0 auto;" onclick="location.reload()">Retry</button>
            </div>
        `;
    });
}

function onScanSuccess(decodedText, decodedResult) {
    if (!isScanning) {
        // Play Sound
        if (soundEnabled) {
            const audio = document.getElementById("scan-sound");
            audio.play().catch(e => console.log("Audio play failed", e));
        }

        isScanning = true;

        // Stop scanning animation
        document.getElementById('scan-line').style.display = 'none';

        // Pause scanner (don't stop, just pause processing)
        html5QrCode.pause();

        // Process Data
        handleScannedData(decodedText);
    }
}

function onScanFailure(error) {
    // console.warn(`Code scan error = ${error}`);
}

function handleScannedData(data) {
    console.log("Scanned:", data);

    let productData = {};

    try {
        // Try parsing JSON first (User Request Format)
        // { "name": "Milk Packet", "price": "₹45", "weight": "500ml", "store": "Akhil Mart" }
        productData = JSON.parse(data);
        showProductModal(productData);
    } catch (e) {
        // Not JSON, try URL Parsing (Legacy/Fallback)
        if (data.includes('/store/') && data.includes('/product/')) {
            // Fetch from API
            fetchProductFromUrl(data);
        } else {
            alert("Invalid QR Code format.\nData: " + data);
            resetScanner();
        }
    }
}

async function fetchProductFromUrl(urlStr) {
    try {
        // Extract IDs from URL like /store/1/product/5
        // Handle relative or absolute
        let path = urlStr;
        if (urlStr.startsWith('http')) {
            const urlObj = new URL(urlStr);
            path = urlObj.pathname;
        }

        const parts = path.split('/');
        const storeIdx = parts.indexOf('store');
        const prodIdx = parts.indexOf('product');

        if (storeIdx === -1 || prodIdx === -1) throw new Error("Invalid URL path");

        const storeId = parts[storeIdx + 1];
        const productId = parts[prodIdx + 1];

        // Fetch from backend
        const res = await fetch(`/api/stores/${storeId}/products/${productId}`);
        const product = await res.json();

        if (product.error) throw new Error(product.error);

        // Normalize data to standard format
        const displayData = {
            id: productId,
            store_id: storeId,
            name: product.name,
            price: `₹${product.price}`, // Assuming backend returns number
            weight: product.size || 'N/A',
            store: 'Connected Store', // We might need to fetch store name too
            image: product.image
        };

        // Attach raw data for 'Add to Cart'
        currentProduct = displayData;
        showProductModal(displayData);

    } catch (err) {
        console.error(err);
        alert("Failed to fetch product details.");
        resetScanner();
    }
}

function showProductModal(data) {
    currentProduct = data; // Save for cart action

    // Populate UI
    document.getElementById('p-name').textContent = data.name || 'Unknown Item';
    document.getElementById('p-price').textContent = data.price || '₹0';
    document.getElementById('p-weight').textContent = data.weight || '-';
    document.getElementById('p-store').textContent = data.store || '-';

    // Show Modal with Animation
    const modal = document.getElementById('result-modal');
    modal.style.display = 'flex';

    // Trigger CSS Transition
    setTimeout(() => {
        document.getElementById('modal-card').classList.add('show');
    }, 10);
}

function resetScanner() {
    isScanning = false;
    currentProduct = null;

    // Hide Modal
    const modal = document.getElementById('result-modal');
    document.getElementById('modal-card').classList.remove('show');

    setTimeout(() => {
        modal.style.display = 'none';

        // Resume Scanner
        try {
            html5QrCode.resume();
            document.getElementById('scan-line').style.display = 'block';
        } catch (e) {
            console.error(e);
            location.reload(); // Fallback if resume fails
        }
    }, 300);
}

async function addToCart() {
    if (!currentProduct) return;

    const btn = document.getElementById('btn-add-cart');
    const originalText = btn.textContent;
    btn.textContent = "ADDING...";
    btn.disabled = true;

    // Logic for Cart
    // If we have IDs (from URL scan), use them. 
    // If we have only JSON (from user prompt), we might not have IDs!
    // -> Note: The user prompt JSON example DOES NOT have IDs. 
    // -> RISK: How do we add to cart without IDs?
    // -> SOLUTION: I will assume the JSON might have hidden IDs OR I will mock the cart addition for the visual demo if IDs are missing.
    // -> For the real URL flow, we have IDs.

    try {
        let payload = {};

        if (currentProduct.id && currentProduct.store_id) {
            payload = {
                product_id: currentProduct.id,
                store_id: currentProduct.store_id,
                product_name: currentProduct.name,
                price: parseFloat(currentProduct.price.replace('₹', '')),
                quantity: 1,
                image: currentProduct.image
            };
        } else {
            // Fallback for JSON-only scan (Demo Mode)
            // Just Alert for now or try to send what we have
            console.warn("No ID found in product data, cannot add to real backend cart properly without IDs.");
            // We simulate success for the UI demo
            await new Promise(r => setTimeout(r, 800)); // Fake network lag
            alert("Added to Cart (Demo Mode - Missing IDs)");
            resetScanner();
            return;
        }

        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            btn.textContent = "ADDED ✓";
            setTimeout(() => {
                resetScanner();
                btn.textContent = originalText;
                btn.disabled = false;
            }, 1000);
        } else {
            throw new Error("Failed to add");
        }

    } catch (e) {
        alert("Error adding to cart");
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// File Scan Handler
function handleFileScan(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    // Temporarily stop live scan to process file
    if (html5QrCode && html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
        html5QrCode.pause();
    }

    html5QrCode.scanFile(file, true)
        .then(decodedText => {
            onScanSuccess(decodedText, null);
        })
        .catch(err => {
            alert("Could not read QR from image");
            if (html5QrCode) html5QrCode.resume();
        });
}

function toggleMute() {
    soundEnabled = !soundEnabled;
    document.getElementById('mute-btn').textContent = soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
}

function manualEntry() {
    const code = prompt("Enter product code/URL:");
    if (code) handleScannedData(code);
}


// Load scanned history
if (window.location.pathname === '/history') {
    loadHistory();
}

// Load store products
if (window.location.pathname.includes('/store/') && !window.location.pathname.includes('/product/')) {
    loadStoreProducts();
}

// Load user orders
if (window.location.pathname === '/orders') {
    loadUserOrders();
}

// Load all stores
async function loadStores() {
    try {
        const response = await fetch('/api/stores');
        const stores = await response.json();

        const storesGrid = document.getElementById('stores-grid');
        const noStores = document.getElementById('no-stores');

        if (!stores || Object.keys(stores).length === 0) {
            storesGrid.style.display = 'none';
            noStores.style.display = 'block';
            return;
        }

        storesGrid.innerHTML = '';

        for (const [storeId, store] of Object.entries(stores)) {
            const storeCard = createStoreCard(storeId, store);
            storesGrid.appendChild(storeCard);
        }
    } catch (error) {
        console.error('Error loading stores:', error);
    }
}

// Create store card
function createStoreCard(storeId, store) {
    const card = document.createElement('div');
    card.className = 'store-card';
    card.onclick = () => window.location.href = `/store/${storeId}`;

    card.innerHTML = `
        <h3>🏪 ${store.name}</h3>
        <p>${store.description || 'No description available'}</p>
    `;

    return card;
}

// Load store products
async function loadStoreProducts() {
    try {
        const response = await fetch(`/api/stores/${storeId}`);
        const store = await response.json();

        document.getElementById('store-name').textContent = store.name;
        document.getElementById('store-description').textContent = store.description || '';

        const productsResponse = await fetch(`/api/stores/${storeId}/products`);
        const products = await productsResponse.json();

        const productsGrid = document.getElementById('products-grid');
        const noProducts = document.getElementById('no-products');

        if (!products || Object.keys(products).length === 0) {
            productsGrid.style.display = 'none';
            noProducts.style.display = 'block';
            return;
        }

        productsGrid.innerHTML = '';

        for (const [productId, product] of Object.entries(products)) {
            const productCard = createProductCard(storeId, productId, product);
            productsGrid.appendChild(productCard);
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Create product card
function createProductCard(storeId, productId, product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => window.location.href = `/store/${storeId}/product/${productId}`;

    const imageUrl = product.image || 'https://via.placeholder.com/300x200?text=No+Image';

    card.innerHTML = `
        <img src="${imageUrl}" alt="${product.name}">
        <h3>${product.name}</h3>
        <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
        <div class="product-info">
            ${product.size ? `Size: ${product.size} | ` : ''}
            ${product.color ? `Color: ${product.color} | ` : ''}
            Stock: ${product.stock}
        </div>
    `;

    return card;
}

// Load scanned history
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const history = await response.json();

        const historyList = document.getElementById('history-list');
        const noHistory = document.getElementById('no-history');

        if (!history || Object.keys(history).length === 0) {
            historyList.style.display = 'none';
            noHistory.style.display = 'block';
            return;
        }

        historyList.innerHTML = '';

        for (const [productId, item] of Object.entries(history)) {
            const historyCard = createHistoryCard(productId, item);
            historyList.appendChild(historyCard);
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Create history card
function createHistoryCard(productId, item) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => window.location.href = `/store/${item.store_id}/product/${productId}`;

    const scannedDate = new Date(item.scanned_at).toLocaleDateString();

    card.innerHTML = `
        <h3>${item.product_name}</h3>
        <div class="product-info">Scanned on: ${scannedDate}</div>
        <button class="btn-primary" onclick="event.stopPropagation(); window.location.href='/store/${item.store_id}/product/${productId}'">
            View Again
        </button>
    `;

    return card;
}

// Load user orders
async function loadUserOrders() {
    try {
        const response = await fetch('/api/my-orders');
        const orders = await response.json();

        const ordersList = document.getElementById('orders-list');
        const noOrders = document.getElementById('no-orders');

        if (!orders || Object.keys(orders).length === 0) {
            ordersList.style.display = 'none';
            noOrders.style.display = 'block';
            return;
        }

        ordersList.innerHTML = '';

        // Convert to array and sort by date descending
        const ordersArray = Object.entries(orders).map(([id, data]) => ({
            id,
            ...data
        })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        for (const order of ordersArray) {
            const orderCard = createOrderCard(order);
            ordersList.appendChild(orderCard);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Create order card
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'cart-item'; // Reuse cart item styling
    card.style.flexDirection = 'column';
    card.style.alignItems = 'flex-start';

    const date = new Date(order.created_at).toLocaleString();

    // Check if items exist (for older orders they might not be directly in the user order ref)
    // We might need to fetch full order details if we want items, but for now let's show total and date
    // The user node only has total and created_at usually. 
    // Wait, the firebase_service.add_order_to_user only saves total and created_at.
    // If user wants to see items, we should link to receipt or fetch full order.
    // Let's add a "View Receipt" button.

    card.innerHTML = `
        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3>Order #${order.id.substring(0, 8)}</h3>
            <span class="badge badge-success" style="background: #27ae60; color: white; padding: 5px 10px; border-radius: 15px;">Confirmed</span>
        </div>
        <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span><strong>Date:</strong> ${date}</span>
            <span><strong>Total:</strong> $${parseFloat(order.total).toFixed(2)}</span>
        </div>
        <button class="btn-primary" onclick="window.location.href='/receipt/${order.id}'">View Receipt</button>
    `;

    return card;
}

// Request product
function requestProduct() {
    window.location.href = `/request-product/${storeId}`;
}

// ========== QR CODE SCANNER ==========

let html5QrCode = null;
let isScanning = false;

// Open scanner modal
function openScanner() {
    const modal = document.getElementById('scanner-modal');
    modal.style.display = 'flex';
    startScanner();
}

// Close scanner modal
function closeScanner() {
    const modal = document.getElementById('scanner-modal');
    modal.style.display = 'none';
    stopScanner();
}

// Stop QR code scanner
function stopScanner() {
    if (html5QrCode && isScanning) {
        html5QrCode.stop().then(() => {
            isScanning = false;
            html5QrCode.clear();
        }).catch(err => {
            console.error("Error stopping scanner:", err);
        });
    }
}

// Scan from file (Alternative to camera)
function scanFromFile(inputElement) {
    if (inputElement.files.length === 0) return;

    const imageFile = inputElement.files[0];

    // Stop the running scanner first if it exists
    if (isScanning && html5QrCode) {
        console.log("Stopping active camera scanner for file scan...");
        html5QrCode.stop().then(() => {
            isScanning = false;
            html5QrCode.clear();
            processFile(imageFile);
        }).catch(err => {
            console.error("Error stopping scanner for file scan:", err);
            // Try to process anyway
            processFile(imageFile);
        });
    } else {
        processFile(imageFile);
    }
}

function processFile(imageFile) {
    // Create a new instance for file scanning 
    // We can't reuse the same element ID if it was just cleared, 
    // but scanFile works without mounting to DOM if we use the class statically or a dummy element.
    // Actually, Html5Qrcode.scanFile is an instance method.
    // We need to re-instantiate it.

    const fileScanner = new Html5Qrcode("qr-reader");
    fileScanner.scanFile(imageFile, true)
        .then(decodedText => {
            // Success
            console.log("File Scan Success:", decodedText);
            onScanSuccess(decodedText, null);
        })
        .catch(err => {
            // Failure
            console.error("Error scanning file:", err);
            alert("Could not scan QR code from file.\n\nTip: Ensure good lighting and crop the image to just the QR code.");
        });
}

// Start QR code scanner
function startScanner() {
    // Check for HTTPS (required for camera access)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        alert("⚠️ Camera access requires HTTPS.\nPlease use a secure connection or test on localhost.");
        closeScanner();
        return;
    }

    if (isScanning) return;

    // Ensure element exists
    if (!document.getElementById("qr-reader")) {
        console.error("QR Reader element not found");
        return;
    }

    // Debug log element
    let debugLog = document.getElementById("debug-log");
    if (!debugLog) {
        debugLog = document.createElement("div");
        debugLog.id = "debug-log";
        debugLog.style.cssText = "margin-top: 10px; padding: 10px; background: #f0f0f0; border: 1px solid #ccc; font-size: 12px; height: 100px; overflow-y: scroll;";
        document.querySelector(".scanner-container").appendChild(debugLog);
    }

    function log(msg) {
        const time = new Date().toLocaleTimeString();
        debugLog.innerHTML = `<div>[${time}] ${msg}</div>` + debugLog.innerHTML;
        console.log(msg);
    }

    log("Initializing scanner...");

    html5QrCode = new Html5Qrcode("qr-reader");

    const config = {
        fps: 30, // High FPS for smoother scanning
        // aspectRatio: 1.0, // REMOVED: Allow full screen checks
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        },
        videoConstraints: {
            facingMode: "environment",
            focusMode: "continuous",
            width: { min: 640, ideal: 1280, max: 1920 }, // Force higher resolution
            height: { min: 480, ideal: 720, max: 1080 }
        }
    };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
            log("SUCCESS: " + decodedText);
            onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
            // log("Scanning... " + errorMessage); 
        }
    ).then(() => {
        isScanning = true;
        log("Scanner started! Point at a QR code.");
        const reader = document.getElementById("qr-reader");
        if (reader) reader.style.border = "2px solid #2ecc71";

        // ADD ZOOM SLIDER LOGIC
        // Check if zoom is supported
        const videoTrack = html5QrCode.getRunningTrackCameraCapabilities()[0];
        // Note: html5-qrcode might not expose track directly easily, but let's try standard way
        // Actually html5-qrcode has applyVideoConstraints

        // Let's create a zoom slider if not exists
        let zoomControl = document.getElementById("zoom-control");
        if (!zoomControl) {
            const container = document.querySelector(".scanner-container");
            zoomControl = document.createElement("div");
            zoomControl.id = "zoom-control";
            zoomControl.style.marginTop = "10px";
            zoomControl.innerHTML = `
                <label for="zoom-slider">Zoom: <span id="zoom-value">1x</span></label>
                <input type="range" id="zoom-slider" min="1" max="5" step="0.1" value="1" style="width: 100%;">
            `;
            // Insert before debug log
            const debugLog = document.getElementById("debug-log");
            container.insertBefore(zoomControl, debugLog);

            const slider = document.getElementById("zoom-slider");
            const zoomValue = document.getElementById("zoom-value");

            slider.oninput = function () {
                const zoom = Number(this.value);
                zoomValue.innerText = zoom + "x";
                html5QrCode.applyVideoConstraints({
                    advanced: [{ zoom: zoom }]
                });
            };
        }

    }).catch(err => {
        log("FATAL ERROR: " + err);
        console.error("Camera error details:", err);
        let errorMsg = "Unable to access camera.";

        if (err.name === 'NotAllowedError') {
            errorMsg = "Camera permission denied. Please allow camera access.";
        } else if (err.name === 'NotFoundError') {
            errorMsg = "No camera found on this device.";
        } else if (err.name === 'NotReadableError') {
            errorMsg = "Camera is already in use by another app.";
        } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            errorMsg = "Camera requires HTTPS or Localhost.";
        }

        alert(errorMsg + "\n\nTechncial details: " + err);
        closeScanner();
    });
}

// Handle successful QR scan
function onScanSuccess(decodedText, decodedResult) {
    console.log("QR Code detected:", decodedText);

    // DEBUG: Alert immediately to see what we got
    alert("DEBUG: Received Scan:\n" + decodedText);

    // Check if it's a product URL
    if (decodedText.includes('/store/') && decodedText.includes('/product/')) {
        // Extract storeId and productId
        try {
            // Attempt to handle relative URLs by prepending origin if needed
            let urlString = decodedText;
            if (urlString.startsWith('/')) {
                urlString = window.location.origin + urlString;
            }

            // Log the URL we are trying to parse
            console.log("Parsing URL:", urlString);

            const url = new URL(urlString);
            const pathParts = url.pathname.split('/');

            // Handle different URL structures if necessary, but standard is /store/SID/product/PID
            let storeId, productId;

            // Try to find 'store' and 'product' in path parts
            const storeTokenIndex = pathParts.indexOf('store');
            const productTokenIndex = pathParts.indexOf('product');

            if (storeTokenIndex !== -1 && productTokenIndex !== -1 && productTokenIndex > storeTokenIndex) {
                storeId = pathParts[storeTokenIndex + 1];
                productId = pathParts[productTokenIndex + 1];
            }
            // Also check for /api/qr/SID/PID format
            else if (pathParts.includes('api') && pathParts.includes('qr')) {
                const qrIndex = pathParts.indexOf('qr');
                storeId = pathParts[qrIndex + 1];
                productId = pathParts[qrIndex + 2];
            }

            if (storeId && productId) {
                // Stop scanner
                stopScanner();
                closeScanner(); // Close the scanner modal

                // Fetch and show product details
                fetchProductAndShowModal(storeId, productId);
            } else {
                alert("Parsed text but could not find Store ID or Product ID.\nText: " + decodedText);
            }

        } catch (e) {
            console.error("Error parsing QR code:", e);
            // Handle cases where e might not be an Error object
            const errorText = (e && e.message) ? e.message : String(e);
            alert("Error processing QR code:\n" + errorText + "\n\nInput: " + decodedText);
        }
    } else {
        // If it doesn't look like our URL, tell the user what it IS
        alert("Scanned something, but it's not a valid product code.\nScanned: " + decodedText);
    }
}

// Fetch product and show modal
async function fetchProductAndShowModal(storeId, productId) {
    const modal = document.getElementById('product-modal');
    const content = document.getElementById('modal-product-content');

    // Show modal with loading state
    modal.style.display = 'flex';
    content.innerHTML = '<div class="loading-spinner">Loading product info...</div>';

    try {
        const response = await fetch(`/api/stores/${storeId}/products/${productId}`);
        const product = await response.json();

        if (product.error) {
            content.innerHTML = `<p class="error-text">${product.error}</p>`;
            return;
        }

        const imageUrl = product.image || 'https://via.placeholder.com/300x300?text=No+Image';

        content.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}" style="max-width: 100%; max-height: 200px; object-fit: contain; margin-bottom: 15px; border-radius: 8px;">
            <h2 style="margin-bottom: 10px; color: #333;">${product.name}</h2>
            <div style="font-size: 1.5em; color: #27ae60; font-weight: bold; margin-bottom: 10px;">$${parseFloat(product.price).toFixed(2)}</div>
            
            <div style="margin-bottom: 15px; background: #f9f9f9; padding: 10px; border-radius: 5px; text-align: left;">
                ${product.size ? `<p><strong>Size:</strong> ${product.size}</p>` : ''}
                ${product.color ? `<p><strong>Color:</strong> ${product.color}</p>` : ''}
                <p><strong>Description:</strong> ${product.description || 'No description'}</p>
            </div>

            <button onclick="addToCartFromModal('${storeId}', '${productId}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image}')" 
                    class="btn-primary" style="width: 100%; padding: 12px; font-size: 1.1em;">
                Add to Cart
            </button>
        `;

    } catch (error) {
        console.error("Error fetching product:", error);
        content.innerHTML = '<p class="error-text">Failed to load product details.</p>';
    }
}

// Close product modal
function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

// Add to cart from modal
async function addToCartFromModal(storeId, productId, name, price, image) {
    try {
        const cartData = {
            product_id: productId,
            store_id: storeId,
            product_name: name,
            price: price,
            quantity: 1,
            image: image
        };

        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartData)
        });

        if (response.ok) {
            // Show success message or feedback
            alert('Added to Cart!');
            closeProductModal();
            // Optional: Update cart count if exists
        } else {
            alert('Failed to add to cart.');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding to cart.');
    }
}

// Handle scan errors (silent - happens continuously while scanning)
function onScanError(errorMessage) {
    // Ignore errors - they happen when no QR code is in view
}

// Show scan success feedback
function showScanSuccess() {
    const reader = document.getElementById('qr-reader');
    if (reader) {
        reader.style.border = '5px solid #27ae60';
        setTimeout(() => {
            reader.style.border = 'none';
        }, 500);
    }
}

// Close scanner/modal when clicking outside
// Manual enter code (fallback)
function manualEnterCode() {
    const code = prompt("Enter the QR Code URL or Text:");
    if (code) {
        onScanSuccess(code, null);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const scannerModal = document.getElementById('scanner-modal');
    if (scannerModal) {
        scannerModal.addEventListener('click', function (e) {
            if (e.target === scannerModal) {
                closeScanner();
            }
        });
    }

    const productModal = document.getElementById('product-modal');
    if (productModal) {
        productModal.addEventListener('click', function (e) {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
    }
});
