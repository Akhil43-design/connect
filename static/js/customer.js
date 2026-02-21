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
    if (!list) return;

    list.innerHTML = '';

    if (!stores || Object.keys(stores).length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4); grid-column: 1/-1;">
                <p>No stores with active products found nearby.</p>
            </div>`;
        return;
    }

    Object.entries(stores).forEach(([id, store]) => {
        const card = document.createElement('div');
        card.className = 'store-card';
        card.style.background = 'rgba(255, 255, 255, 0.05)';
        card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        card.style.borderRadius = '20px';
        card.style.padding = '1.5rem';
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.3s ease';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '1.2rem';
        card.style.backdropFilter = 'blur(10px)';

        card.onmouseover = () => {
            card.style.background = 'rgba(255, 255, 255, 0.1)';
            card.style.transform = 'translateY(-5px)';
            card.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        };
        card.onmouseout = () => {
            card.style.background = 'rgba(255, 255, 255, 0.05)';
            card.style.transform = 'translateY(0)';
            card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        };

        card.onclick = () => window.location.href = `/store/${id}`;

        card.innerHTML = `
            <div class="store-icon" style="font-size: 2.5rem; background: rgba(99, 102, 241, 0.1); width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border-radius: 15px;">🏪</div>
            <div class="store-info" style="flex: 1;">
                <h3 style="margin: 0 0 5px 0; font-size: 1.25rem; font-weight: 600; color: #fff;">${store.name}</h3>
                <p style="margin: 0; opacity: 0.6; font-size: 0.9rem;">${store.description || 'Premium Partner Store'}</p>
                <div style="margin-top: 10px; display: flex; align-items: center; gap: 5px;">
                    <span style="display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
                    <span style="font-size: 0.75rem; color: #10b981; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Active Inventory</span>
                </div>
            </div>
            <div style="color: rgba(255,255,255,0.3); font-size: 1.2rem;">➜</div>
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

    scanned = false; // Reset scan state
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
        // FETCH FROM BACKEND
        fetchProductDetails(storeId, productId);
    } else {
        // 3. Assume Plain ID (Static QR Mode or Legacy Barcode)
        // If it's not JSON and not a URL, it might be a direct ID.
        // We force this path for EVERYTHING else.
        console.log("Assuming Plain ID scan:", data);
        fetchProductByGlobalId(data);
    }
}

async function fetchProductByGlobalId(productId) {
    try {
        const res = await fetch(`/api/products/${productId}`);
        const product = await res.json();

        if (product.error || !product.id) throw new Error("Product not found");

        // Normalize
        const displayData = {
            id: product.id,
            store_id: product.store_id,
            name: product.name,
            price: `₹${product.price}`,
            weight: product.size || 'N/A',
            store: product.store_name || 'Connect Store',
            image: product.image
        };

        currentProduct = displayData;
        showProductModal(displayData);

    } catch (e) {
        console.error(e);
        // Only alert if we really can't find it
        alert("Product not found in system.\nID: " + productId);
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
