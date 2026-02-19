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
// MODERN QR SCANNER LOGIC (V11)
// ==========================================

let html5QrCode;
let isScanning = false;
let currentProduct = null;
let soundEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    // Only start scanner if we are on the dashboard and elements exist
    if (document.getElementById("qr-reader")) {
        startScanner();
    }
});

function startScanner() {
    const readerElement = document.getElementById("qr-reader");
    if (!readerElement) return;

    // Show scanning animation
    const scanLine = document.getElementById('scan-line');
    if (scanLine) scanLine.style.display = 'block';

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
        const wrapper = document.querySelector('.scanner-wrapper');
        if (wrapper) {
            wrapper.innerHTML = `
                <div style="padding: 20px; text-align: center; color: white;">
                    <p>Camera access denied or unavailable.</p>
                    <button class="control-btn" style="margin: 0 auto;" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    });
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

function handleFileScan(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    // Temporarily stop live scan to process file
    if (html5QrCode && html5QrCode.getState() === 2) { // 2 = SCANNING
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
    const btn = document.getElementById('mute-btn');
    if (btn) btn.textContent = soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
}

function manualEntry() {
    const code = prompt("Enter product code/URL:");
    if (code) handleScannedData(code);
}
