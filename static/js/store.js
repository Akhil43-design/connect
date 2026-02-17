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
            <img src="${product.qr_code}" alt="QR Code">
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

        // Update most requested
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
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}
