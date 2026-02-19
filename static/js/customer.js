// Customer Dashboard JavaScript

// Load stores on page load
if (window.location.pathname === '/customer/dashboard') {
    loadStores();
}

// Load scanned history
if (window.location.pathname === '/history') {
    loadHistory();
}

async function loadStores() {
    try {
        const response = await fetch('/api/stores');
        const stores = await response.json();
        renderStores(stores);
    } catch (error) {
        console.error('Error loading stores:', error);
    }
}

function renderStores(stores) {
    const list = document.getElementById('stores-list');
    if (!list) return; // Guard clause if we are not on dashboard

    list.innerHTML = '';
    stores.forEach(store => {
        const card = document.createElement('div');
        card.className = 'store-card';
        card.onclick = () => window.location.href = `/store/${store.id}`;
        card.innerHTML = `
            <div class="store-icon">🏪</div>
            <div class="store-info">
                <h3>${store.name}</h3>
                <p>${store.location}</p>
            </div>
        `;
        list.appendChild(card);
    });
}

// History Logic
async function loadHistory() {
    try {
        const res = await fetch('/api/my-orders');
        const orders = await res.json();
        const container = document.getElementById('history-container');
        if (!container) return;

        container.innerHTML = '';
        orders.forEach(order => {
            container.appendChild(createOrderCard(order));
        });
    } catch (e) {
        console.error(e);
    }
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'history-card'; // Assumed class
    const date = new Date(order.timestamp).toLocaleDateString();

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

// ==========================================
// MODERN QR SCANNER LOGIC (V12)
// ==========================================

let html5QrCode;
let isScanning = false;
let currentProduct = null;
let soundEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    // Check if library is loaded, if not, load it dynamically
    if (typeof Html5Qrcode === 'undefined') {
        console.warn("Html5Qrcode not found, loading dynamically...");
        const script = document.createElement('script');
        script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
        script.onload = () => {
            console.log("Html5Qrcode loaded dynamically.");
            // Re-bind buttons if needed or just let user click again
        };
        script.onerror = () => {
            alert("Failed to load QR Scanner library. Please check internet connection.");
        };
        document.head.appendChild(script);
    }
});

function startScanner() {
    const readerElement = document.getElementById("qr-reader");
    if (!readerElement) return;

    // HIDE placeholder, show animation
    const placeholder = document.getElementById('scanner-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    const scanLine = document.getElementById('scan-line');
    const overlay = document.getElementById('scan-overlay');
    if (scanLine) scanLine.style.display = 'block';
    if (overlay) overlay.style.display = 'block';

    // Clear any previous errors
    const errorDiv = document.getElementById('scanner-error');
    if (errorDiv) errorDiv.style.display = 'none';

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
        showCameraError(err);
    });
}

function showCameraError(err) {
    const errorDiv = document.getElementById('scanner-error');
    const errorMsg = document.getElementById('error-message');
    const placeholder = document.getElementById('scanner-placeholder');

    // Hide scanning visuals
    document.getElementById('scan-line').style.display = 'none';
    if (placeholder) placeholder.style.display = 'none';

    // Determine friendly message
    let msg = "Unable to access camera.";
    if (err.name === 'NotAllowedError') msg = "Access denied. Please enable camera permissions.";
    else if (err.name === 'NotFoundError') msg = "No camera found on this device.";
    else if (err.name === 'NotReadableError') msg = "Camera is being used by another app.";
    else if (err.name === 'OverconstrainedError') msg = "Camera constraints failed. Try a different device.";
    else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') msg = "HTTPS is required for camera security.";

    if (errorDiv && errorMsg) {
        errorDiv.style.display = 'flex';
        errorMsg.innerHTML = `<strong>${msg}</strong><br><br><small style='opacity:0.7; font-size: 0.8em'>${err.name || err}</small>`;
    } else {
        alert(msg + "\n" + err);
    }
}

function onScanSuccess(decodedText, decodedResult) {
    if (!isScanning) {
        // Play Sound
        if (soundEnabled) {
            const audio = document.getElementById("scan-sound");
            if (audio) {
                audio.play().catch(e => console.log("Audio play failed", e));
            }
        }

        isScanning = true;

        // Stop scanning animation
        const scanLine = document.getElementById('scan-line');
        if (scanLine) scanLine.style.display = 'none';

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

    let storeId, productId;

    // 1. Try JSON parsing (New QRs)
    try {
        const productData = JSON.parse(data);
        if (productData.store_id && productData.id) {
            storeId = productData.store_id;
            productId = productData.id;
        } else {
            throw new Error("Missing IDs in JSON");
        }
    } catch (e) {
        // 2. Try URL parsing (Legacy/Fallback)
        if (data.includes('/store/') && data.includes('/product/')) {
            // Extract IDs from URL string
            const parts = data.split('/');
            const sIdx = parts.indexOf('store');
            const pIdx = parts.indexOf('product');

            if (sIdx !== -1 && pIdx !== -1) {
                storeId = parts[sIdx + 1];
                productId = parts[pIdx + 1];
            }
        }
    }

    if (storeId && productId) {
        // FETCH FROM BACKEND to ensure:
        // 1. Scan count increments
        // 2. Data is latest (stock, price)
        // 3. User history is updated
        fetchProductDetails(storeId, productId);
    } else {
        alert("Invalid QR Code.\nData: " + data);
        resetScanner();
    }
}

async function fetchProductDetails(storeId, productId) {
    try {
        const res = await fetch(`/api/stores/${storeId}/products/${productId}`);
        const product = await res.json();

        if (product.error) throw new Error(product.error);

        const displayData = {
            id: productId,
            store_id: storeId,
            name: product.name,
            price: `₹${product.price}`,
            weight: product.size || 'N/A',
            store: 'Connect Store', // Placeholder, could be fetched
            image: product.image
        };

        currentProduct = displayData;
        showProductModal(displayData);

    } catch (err) {
        console.error(err);
        alert("Failed to load product. Please check connection.");
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
    const card = document.getElementById('modal-card');
    if (card) card.classList.remove('show');

    setTimeout(() => {
        if (modal) modal.style.display = 'none';

        // Resume Scanner
        try {
            html5QrCode.resume();
            const scanLine = document.getElementById('scan-line');
            if (scanLine) scanLine.style.display = 'block';
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
            console.warn("No ID found in product data (JSON Mode)");
            await new Promise(r => setTimeout(r, 800)); // Fake network lag
            alert("Added to Cart (Demo Mode)");
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

// File Scan Handler - Uses Python Backend (Hybrid Mode)
// File Scan and Sound Toggle removed as per user request
// function handleFileScan(input) { ... }
// function toggleMute() { ... }

function manualEntry() {
    const code = prompt("Enter product code/URL:");
    if (code) handleScannedData(code);
}
