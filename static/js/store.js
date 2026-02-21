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
    card.style.background = '#fff';
    card.style.padding = '1rem';
    card.style.borderRadius = '12px';
    card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';

    const imageUrl = product.image || 'https://via.placeholder.com/300x200?text=No+Image';

    card.innerHTML = `
        <img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">
        <h3 style="margin: 0 0 0.5rem 0;">${product.name}</h3>
        <div class="product-price" style="font-weight: 700; color: #6366f1; font-size: 1.2rem; margin-bottom: 0.5rem;">$${parseFloat(product.price).toFixed(2)}</div>
        <div class="product-info" style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
            Stock: ${product.stock} | Scans: ${product.scan_count || 0}
        </div>
        <button class="btn-danger" onclick="deleteProduct('${productId}')" style="width: 100%; padding: 0.6rem; border-radius: 8px;">Delete Product</button>
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
        const totalOrdersEl = document.getElementById('total-orders');
        if (totalOrdersEl) totalOrdersEl.textContent = analytics.total_orders;

        // Update most scanned
        const mostScanned = document.getElementById('most-scanned');
        if (mostScanned) {
            if (analytics.most_scanned && analytics.most_scanned.length > 0) {
                mostScanned.innerHTML = '<ul class="analytics-list" style="list-style: none; padding: 0; margin: 0;">' +
                    analytics.most_scanned.map(item =>
                        `<li style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between;">
                            <span>${item.name}</span>
                            <span style="font-weight: 600; color: #6366f1;">${item.count} scans</span>
                        </li>`
                    ).join('') +
                    '</ul>';
            } else {
                mostScanned.innerHTML = '<p style="text-align: center; color: #64748b; padding: 10px 0;">No scan data yet</p>';
            }
        }

        // Update High Demand Section
        const highDemandList = document.getElementById('high-demand-list');
        if (highDemandList) {
            if (analytics.most_requested && analytics.most_requested.length > 0) {
                highDemandList.innerHTML = '<div class="demand-grid">' +
                    analytics.most_requested.map(item =>
                        `<div class="demand-card" style="border: 1px solid #f1f5f9; padding: 15px; margin-bottom: 10px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; background: #fff;">
                            <span style="font-weight: 600; color: #1e293b;">${item.name}</span>
                            <span class="badge" style="background: #fee2e2; color: #ef4444; padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${item.count} Requests</span>
                        </div>`
                    ).join('') +
                    '</div>';
            } else {
                highDemandList.innerHTML = '<p style="text-align: center; color: #64748b; font-style: italic; padding: 20px 0;">No high demand products at the moment.</p>';
            }
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
