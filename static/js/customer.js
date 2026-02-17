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
        fps: 10,
        // qrbox: { width: 250, height: 250 }, // REMOVED: Scan full frame to fixing detection issues
        aspectRatio: 1.0,
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        },
        videoConstraints: {
            facingMode: "environment",
            focusMode: "continuous"
        }
    };

    html5QrCode.start(
        { facingMode: "environment" }, // Must have exactly 1 key if object
        config,
        (decodedText, decodedResult) => {
            log("SUCCESS: " + decodedText);
            onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
            // log("Scanning... " + errorMessage); // Too verbose to log every frame error
        }
    ).then(() => {
        isScanning = true;
        log("Scanner started! Point at a QR code.");
        // Add visual feedback that scanner is active
        const reader = document.getElementById("qr-reader");
        if (reader) reader.style.border = "2px solid #2ecc71";
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

    // DEBUG: Show what was scanned to help the user understand what's happening
    // Remove this in final production if deemed too annoying, but critical for debugging now.
    // alert("Scanned: " + decodedText); 

    // Check if it's a product URL
    if (decodedText.includes('/store/') && decodedText.includes('/product/')) {
        // Extract storeId and productId
        try {
            // Expected format: /api/qr/<store_id>/<product_id> OR /store/<store_id>/product/<product_id>
            // Let's parse the URL
            const url = new URL(decodedText, window.location.origin);
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
            alert("Error processing QR code: " + e.message);
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
