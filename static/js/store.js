// Store Owner Dashboard JavaScript

let currentStoreId = null;

// Load on page load
document.addEventListener('DOMContentLoaded', () => {
    checkStoreRegistration();
});

// Check if store is registered
async function checkStoreRegistration() {
    try {
        const response = await fetch('/api/my-store');
        const store = await response.json();

        if (store) {
            currentStoreId = store.id;
            // Update dashboard with store info
            document.getElementById('store-name').value = store.name;
            document.getElementById('store-description').value = store.description;
            // Show management view
            showStoreManagement();
            loadProducts();
            loadAnalytics();
            loadOrders();
        } else {
            showStoreRegistration();
        }
    } catch (error) {
        console.error('Error checking store:', error);
    }
}

// Show store registration form
function showStoreRegistration() {
    document.getElementById('store-registration').style.display = 'block';
    document.getElementById('store-management').style.display = 'none';
}

// Show store management
function showStoreManagement() {
    document.getElementById('store-registration').style.display = 'none';
    document.getElementById('store-management').style.display = 'block';
}

// Handle store registration
async function handleStoreRegistration(event) {
    event.preventDefault();

    const name = document.getElementById('store-name').value;
    const description = document.getElementById('store-description').value;

    try {
        const response = await fetch('/api/stores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        });

        const data = await response.json();

        if (data.success) {
            currentStoreId = data.store_id;
            alert('Store registered successfully!');
            showStoreManagement();
            loadProducts();
        } else {
            alert('Failed to register store');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// Show add product form
function showAddProductForm() {
    document.getElementById('add-product-form').style.display = 'block';
}

// Hide add product form
function hideAddProductForm() {
    document.getElementById('add-product-form').style.display = 'none';
}

// Handle add product
async function handleAddProduct(event) {
    event.preventDefault();

    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        size: document.getElementById('product-size').value,
        color: document.getElementById('product-color').value,
        stock: parseInt(document.getElementById('product-stock').value),
        image: document.getElementById('product-image').value,
        description: document.getElementById('product-description').value
    };

    try {
        const response = await fetch(`/api/stores/${currentStoreId}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (data.success) {
            alert('Product added successfully!');
            hideAddProductForm();
            event.target.reset();
            loadProducts();
        } else {
            alert('Failed to add product');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await fetch(`/api/stores/${currentStoreId}/products`);
        const products = await response.json();

        const productsList = document.getElementById('products-list');
        productsList.innerHTML = '';

        if (!products || Object.keys(products).length === 0) {
            productsList.innerHTML = '<p>No products yet. Add your first product!</p>';
            return;
        }

        for (const [productId, product] of Object.entries(products)) {
            const productCard = createProductManagementCard(productId, product);
            productsList.appendChild(productCard);
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Create product management card
function createProductManagementCard(productId, product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageUrl = product.image || 'https://via.placeholder.com/300x200?text=No+Image';

    card.innerHTML = `
        <img src="${imageUrl}" alt="${product.name}">
        <h3>${product.name}</h3>
        <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
        <div class="product-info">Stock: ${product.stock} | Scans: ${product.scan_count || 0}</div>
        <div class="qr-code-container">
            <p><strong>QR Code:</strong></p>
            <img src="/api/qr/${currentStoreId}/${product.id}" alt="QR Code" loading="lazy"> 
        </div>
        <button class="btn-danger" onclick="deleteProduct('${productId}')">Delete</button>
    `;

    return card;
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const response = await fetch(`/api/stores/${currentStoreId}/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Product deleted successfully!');
            loadProducts();
        } else {
            alert('Failed to delete product');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await fetch(`/api/stores/${currentStoreId}/analytics`);
        const analytics = await response.json();

        // Update total orders
        document.getElementById('total-orders').textContent = analytics.total_orders;

        // Update most scanned
        const mostScanned = document.getElementById('most-scanned');
        if (analytics.most_scanned.length > 0) {
            mostScanned.innerHTML = '<ul class="analytics-list">' +
                analytics.most_scanned.map(item =>
                    `<li>${item.name}: ${item.count} scans</li>`
                ).join('') +
                '</ul>';
        } else {
            mostScanned.innerHTML = '<p>No data yet</p>';
        }

        // Update most requested in analytics card
        const mostRequested = document.getElementById('most-requested');
        if (analytics.most_requested.length > 0) {
            mostRequested.innerHTML = '<ul class="analytics-list">' +
                analytics.most_requested.map(item =>
                    `<li>${item.name}: ${item.count} requests</li>`
                ).join('') +
                '</ul>';
        } else {
            mostRequested.innerHTML = '<p>No requests yet</p>';
        }

        // Update High Demand Section
        const highDemandList = document.getElementById('high-demand-list');
        if (analytics.most_requested.length > 0) {
            highDemandList.innerHTML = '<div class="demand-grid">' +
                analytics.most_requested.map(item =>
                    `<div class="demand-card" style="border: 1px solid #eee; padding: 15px; margin-bottom: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; background: #fff;">
                        <span style="font-weight: bold; font-size: 1.1em;">${item.name}</span>
                        <span class="badge" style="background: #e74c3c; color: white; padding: 5px 10px; border-radius: 20px;">${item.count} Requests</span>
                    </div>`
                ).join('') +
                '</div>';
        } else {
            highDemandList.innerHTML = '<p>No high demand products at the moment.</p>';
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}
// Load orders
async function loadOrders() {
    try {
        const response = await fetch(`/api/stores/${currentStoreId}/orders`);
        const orders = await response.json();

        const ordersList = document.getElementById('orders-list');
        ordersList.innerHTML = '';

        if (!orders || Object.keys(orders).length === 0) {
            ordersList.innerHTML = '<p>No new orders yet.</p>';
            return;
        }

        // Convert to array and sort by date descending
        const ordersArray = Object.entries(orders).map(([id, data]) => ({
            id,
            ...data
        })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        for (const order of ordersArray) {
            const date = new Date(order.created_at).toLocaleString();
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            orderCard.style.border = '1px solid #ddd';
            orderCard.style.padding = '15px';
            orderCard.style.marginBottom = '15px';
            orderCard.style.borderRadius = '8px';
            orderCard.style.backgroundColor = '#fff';
            orderCard.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';

            // Build items list
            let itemsHtml = '';
            if (order.items && order.items.length > 0) {
                itemsHtml = '<ul style="margin: 10px 0; padding-left: 20px; color: #555;">' +
                    order.items.map(item => `<li>${item.quantity}x <strong>${item.name || item.product_name}</strong> - $${parseFloat(item.price).toFixed(2)}</li>`).join('') +
                    '</ul>';
            } else {
                itemsHtml = '<p style="color: #999; font-style: italic;">No item details available</p>';
            }

            // Customer info
            const customerInfo = order.customer_email ? `<p><strong>Customer:</strong> ${order.customer_email}</p>` : '';

            orderCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <div>
                        <strong style="font-size: 1.1em; color: #2c3e50;">Order #${order.id.substring(0, 8)}</strong>
                        <div style="font-size: 0.9em; color: #7f8c8d;">${date}</div>
                    </div>
                    <span class="badge badge-success" style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">${order.status}</span>
                </div>
                ${customerInfo}
                <div style="background: #f9f9f9; padding: 10px; border-radius: 4px;">
                    ${itemsHtml}
                </div>
                <div style="margin-top: 10px; text-align: right; font-size: 1.2em; color: #2c3e50;">
                    <strong>Total: $${parseFloat(order.total).toFixed(2)}</strong>
                </div>
            `;
            ordersList.appendChild(orderCard);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Poll for orders every 10 seconds
setInterval(() => {
    if (currentStoreId) {
        loadOrders();
    }
}, 10000);
