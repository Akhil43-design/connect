// Customer Dashboard JavaScript

// Load stores on page load
if (window.location.pathname === '/customer/dashboard') {
    loadStores();
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

    html5QrCode = new Html5Qrcode("qr-reader");

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    html5QrCode.start(
        { facingMode: "environment" }, // Use rear camera
        config,
        onScanSuccess,
        onScanError
    ).then(() => {
        isScanning = true;
        console.log("Scanner started successfully");
    }).catch(err => {
        console.error("Camera error details:", err);
        let errorMsg = "Unable to access camera.";

        if (err.name === 'NotAllowedError') {
            errorMsg = "Camera permission denied. Please allow camera access.";
        } else if (err.name === 'NotFoundError') {
            errorMsg = "No camera found on this device.";
        } else if (err.name === 'NotReadableError') {
            errorMsg = "Camera is already in use by another app.";
        }

        alert(errorMsg + "\n\nError details: " + err);
        closeScanner();
    });
}

// Handle successful QR scan
function onScanSuccess(decodedText, decodedResult) {
    console.log("QR Code detected:", decodedText);

    // Check if it's a product URL
    if (decodedText.includes('/store/') && decodedText.includes('/product/')) {
        // Extract the path from the URL
        let productPath;
        try {
            const url = new URL(decodedText);
            productPath = url.pathname;
        } catch (e) {
            // If it's already a path, use it directly
            productPath = decodedText;
        }

        // Show success feedback
        showScanSuccess();

        // Stop scanner and redirect
        stopScanner();
        setTimeout(() => {
            window.location.href = productPath;
        }, 500);
    } else {
        alert("Invalid QR code. Please scan a product QR code.");
    }
}

// Handle scan errors (silent - happens continuously while scanning)
function onScanError(errorMessage) {
    // Ignore errors - they happen when no QR code is in view
}

// Show scan success feedback
function showScanSuccess() {
    const reader = document.getElementById('qr-reader');
    reader.style.border = '3px solid #27ae60';

    // Play success sound (optional)
    // You can add a beep sound here if desired

    setTimeout(() => {
        reader.style.border = 'none';
    }, 500);
}

// Close scanner when clicking outside
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('scanner-modal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeScanner();
            }
        });
    }
});
