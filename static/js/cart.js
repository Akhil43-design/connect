// Cart and Checkout JavaScript

// Load cart on page load
if (window.location.pathname === '/cart') {
    loadCart();
}

// Load checkout on page load
if (window.location.pathname === '/checkout') {
    loadCheckout();
}

// Load receipt on page load
if (window.location.pathname.includes('/receipt/')) {
    loadReceipt();
}

// Load cart
async function loadCart() {
    try {
        const response = await fetch('/api/cart');
        const cart = await response.json();

        const cartItems = document.getElementById('cart-items');
        const emptyCart = document.getElementById('empty-cart');
        const cartSummary = document.getElementById('cart-summary');

        if (!cart || Object.keys(cart).length === 0) {
            cartItems.style.display = 'none';
            cartSummary.style.display = 'none';
            emptyCart.style.display = 'block';
            return;
        }

        cartItems.innerHTML = '';
        let totalItems = 0;
        let totalPrice = 0;

        for (const [productId, item] of Object.entries(cart)) {
            const cartItem = createCartItem(productId, item);
            cartItems.appendChild(cartItem);
            totalItems += item.quantity;
            totalPrice += item.price * item.quantity;
        }

        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('total-price').textContent = `$${totalPrice.toFixed(2)}`;

        cartSummary.style.display = 'block';
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

// Create cart item
function createCartItem(productId, item) {
    const div = document.createElement('div');
    div.className = 'cart-item';

    const imageUrl = item.image || 'https://via.placeholder.com/80x80?text=No+Image';

    div.innerHTML = `
        <img src="${imageUrl}" alt="${item.product_name}">
        <div class="cart-item-info">
            <h3>${item.product_name}</h3>
            <div class="product-price">$${parseFloat(item.price).toFixed(2)}</div>
            <div>Quantity: ${item.quantity}</div>
        </div>
        <div class="cart-item-actions">
            <button class="btn-danger" onclick="removeFromCart('${productId}')">Remove</button>
        </div>
    `;

    return div;
}

// Remove from cart
async function removeFromCart(productId) {
    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadCart();
        } else {
            alert('Failed to remove item');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// Proceed to checkout
function proceedToCheckout() {
    window.location.href = '/checkout';
}

// Load checkout
async function loadCheckout() {
    try {
        const response = await fetch('/api/cart');
        const cart = await response.json();

        if (!cart || Object.keys(cart).length === 0) {
            window.location.href = '/cart';
            return;
        }

        const checkoutItems = document.getElementById('checkout-items');
        let total = 0;

        checkoutItems.innerHTML = '';

        for (const [productId, item] of Object.entries(cart)) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'summary-row';
            itemDiv.innerHTML = `
                <span>${item.product_name} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            `;
            checkoutItems.appendChild(itemDiv);
            total += item.price * item.quantity;
        }

        document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading checkout:', error);
    }
}

// Toggle address field
function toggleAddress() {
    const deliveryMethod = document.getElementById('delivery-method').value;
    const addressSection = document.getElementById('address-section');

    if (deliveryMethod === 'home_delivery') {
        addressSection.style.display = 'block';
        document.getElementById('delivery-address').required = true;
    } else {
        addressSection.style.display = 'none';
        document.getElementById('delivery-address').required = false;
    }
}

// Handle checkout
async function handleCheckout(event) {
    event.preventDefault();

    const deliveryMethod = document.getElementById('delivery-method').value;
    const address = document.getElementById('delivery-address').value;

    try {
        // Get cart
        const cartResponse = await fetch('/api/cart');
        const cart = await cartResponse.json();

        // Calculate total
        let total = 0;
        const items = [];

        for (const [productId, item] of Object.entries(cart)) {
            total += item.price * item.quantity;
            items.push({
                product_id: productId,
                store_id: item.store_id, // Include store_id
                product_name: item.product_name,
                price: item.price,
                quantity: item.quantity
            });
        }

        // Create order
        const orderData = {
            items: items,
            total: total,
            delivery_method: deliveryMethod,
            address: address
        };

        const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const orderResult = await orderResponse.json();

        if (orderResult.success) {
            window.location.href = `/receipt/${orderResult.order_id}`;
        } else {
            alert('Failed to place order');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// Load receipt
async function loadReceipt() {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        const order = await response.json();

        const receiptDetails = document.getElementById('receipt-details');

        let itemsHtml = '';
        for (const item of order.items) {
            itemsHtml += `
                <div class="summary-row">
                    <span>${item.product_name} x${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        }

        receiptDetails.innerHTML = `
            <div class="receipt-info">
                <p><strong>Order ID:</strong> ${order.order_id}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                <p><strong>Delivery Method:</strong> ${order.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Self Pickup'}</p>
                ${order.address ? `<p><strong>Address:</strong> ${order.address}</p>` : ''}
            </div>
            <div class="receipt-items">
                <h3>Items</h3>
                ${itemsHtml}
                <div class="summary-row total">
                    <span>Total</span>
                    <span>$${parseFloat(order.total).toFixed(2)}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading receipt:', error);
    }
}
