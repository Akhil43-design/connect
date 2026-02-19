"""
Smart QR Shopping Website - Flask Application
Main application file with all routes and API endpoints
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from firebase_service import FirebaseService
from qr_generator import QRGenerator
import uuid
from datetime import datetime
import config

app = Flask(__name__)
app.secret_key = config.SECRET_KEY

# Initialize services
firebase = FirebaseService()
qr_gen = QRGenerator()

# ========== HELPER FUNCTIONS ==========

def login_required(f):
    """Decorator to require login"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(role):
    """Decorator to require specific role"""
    from functools import wraps
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return redirect(url_for('login'))
            if session.get('role') != role:
                return jsonify({'error': 'Unauthorized'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ========== MAIN ROUTES ==========

@app.route('/')
def index():
    """Home page - Landing page"""
    if 'user_id' in session:
        if session.get('role') == 'customer':
            return redirect(url_for('customer_dashboard'))
        elif session.get('role') == 'store_owner':
            return redirect(url_for('store_dashboard'))
    return render_template('landing.html')

@app.route('/login')
def login():
    """Login and registration page"""
    role = request.args.get('role')
    return render_template('login.html', role=role)

@app.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    return redirect(url_for('login'))

# ========== AUTHENTICATION API ==========

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')  # 'customer' or 'store_owner'
    
    if not email or not password or not role:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Clear any existing session
    session.clear()
    
    # Generate user ID
    user_id = str(uuid.uuid4())
    
    # Create user in Firebase
    firebase.create_user(user_id, email, role)
    
    # Set session
    session['user_id'] = user_id
    session['email'] = email
    session['role'] = role
    
    return jsonify({
        'success': True,
        'user_id': user_id,
        'role': role
    })

@app.route('/api/login', methods=['POST'])
def api_login():
    """Login user (simplified - in production use proper authentication)"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Missing credentials'}), 400
        
    # Clear any existing session
    session.clear()
    
    # Look up user in Firebase
    user = firebase.get_user_by_email(email)
    
    if user:
        # User exists, use their data
        # In a real app, verify password hash here
        user_id = user.get('user_id')
        role = user.get('role')
        
        # Determine redirect based on role
        if role == 'customer':
            redirect_url = '/customer/dashboard'
        elif role == 'store_owner':
            redirect_url = '/store/dashboard'
        else:
            redirect_url = '/'
            
        # Set session
        session['user_id'] = user_id
        session['email'] = email
        session['role'] = role
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'role': role,
            'redirect': redirect_url
        })
    else:
        # User not found
        return jsonify({'error': 'Invalid credentials'}), 401

# ========== CUSTOMER ROUTES ==========

@app.route('/customer/dashboard')
@login_required
@role_required('customer')
def customer_dashboard():
    """Customer dashboard - view all stores"""
    return render_template('customer_dashboard.html')

@app.route('/store/<store_id>')
@login_required
def store_view(store_id):
    """View a specific store's products"""
    return render_template('store_view.html', store_id=store_id)

@app.route('/store/<store_id>/product/<product_id>')
@login_required
def product_detail(store_id, product_id):
    """Product detail page (QR scan target)"""
    return render_template('product_detail.html', store_id=store_id, product_id=product_id)

@app.route('/cart')
@login_required
@role_required('customer')
def cart():
    """Shopping cart page"""
    return render_template('cart.html')

@app.route('/checkout')
@login_required
@role_required('customer')
def checkout():
    """Checkout page"""
    return render_template('checkout.html')

@app.route('/receipt/<order_id>')
@login_required
def receipt(order_id):
    """Order receipt page"""
    return render_template('receipt.html', order_id=order_id)

@app.route('/history')
@login_required
@role_required('customer')
def history():
    """Scanned product history"""
    return render_template('history.html')

@app.route('/request-product/<store_id>')
@login_required
@role_required('customer')
def request_product(store_id):
    """Product request form"""
    return render_template('request_product.html', store_id=store_id)

@app.route('/orders')
@login_required
@role_required('customer')
def orders():
    """Customer orders page"""
    return render_template('orders.html')

@app.route('/api/my-orders', methods=['GET'])
@login_required
@role_required('customer')
def my_orders_api():
    """Get orders for current user"""
    user_id = session['user_id']
    orders = firebase.get_user_orders(user_id)
    return jsonify(orders)

# ========== STORE OWNER ROUTES ==========

@app.route('/store/dashboard')
@login_required
@role_required('store_owner')
def store_dashboard():
    """Store owner dashboard"""
    return render_template('store_dashboard.html')

# ========== API ENDPOINTS ==========

# Store APIs
@app.route('/api/stores', methods=['GET', 'POST'])
@login_required
def stores_api():
    """Get all stores or create a new store"""
    if request.method == 'GET':
        stores = firebase.get_all_stores()
        return jsonify(stores)
    
    elif request.method == 'POST':
        data = request.json
        store_id = str(uuid.uuid4())
        
        store_data = {
            'name': data.get('name'),
            'owner_id': session['user_id'],
            'description': data.get('description', ''),
            'created_at': datetime.now().isoformat(),
            'products': {}
        }
        
        firebase.create_store(store_id, store_data)
        
        return jsonify({
            'success': True,
            'store_id': store_id,
            'store': store_data
        })

@app.route('/api/stores/<store_id>', methods=['GET'])
@login_required
def get_store_api(store_id):
    """Get a specific store"""
    store = firebase.get_store(store_id)
    return jsonify(store)

@app.route('/api/my-store', methods=['GET'])
@login_required
@role_required('store_owner')
def get_my_store_api():
    """Get the store owned by the current user"""
    stores = firebase.get_all_stores()
    user_id = session['user_id']
    
    if not stores:
        return jsonify(None)
        
    # Find store owned by user
    for store_id, store_data in stores.items():
        if store_data.get('owner_id') == user_id:
            # Inject ID into data
            store_data['id'] = store_id
            return jsonify(store_data)
            
    return jsonify(None)

# Product APIs
@app.route('/api/stores/<store_id>/products', methods=['GET', 'POST'])
@login_required
def products_api(store_id):
    """Get all products or add a new product"""
    if request.method == 'GET':
        products = firebase.get_products(store_id)
        return jsonify(products)
    
    elif request.method == 'POST':
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
                
            product_id = str(uuid.uuid4())
            
            # Generate QR code
            # Generate dynamic QR URL
            qr_path = f"/api/qr/{store_id}/{product_id}"
            
            product_data = {
                'id': product_id,
                'name': data.get('name'),
                'price': data.get('price'),
                'size': data.get('size', ''),
                'color': data.get('color', ''),
                'description': data.get('description', ''),
                'stock': data.get('stock', 0),
                'image': data.get('image', ''),
                'qr_code': qr_path,
                'scan_count': 0,
                'created_at': datetime.now().isoformat()
            }
            
            firebase.add_product(store_id, product_id, product_data)
            
            return jsonify({
                'success': True,
                'product_id': product_id,
                'product': product_data
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f"Server Error: {str(e)}"}), 500

@app.route('/api/stores/<store_id>/products/<product_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def product_api(store_id, product_id):
    """Get, update, or delete a specific product"""
    if request.method == 'GET':
        product = firebase.get_product(store_id, product_id)
        
        # Increment scan count
        firebase.increment_scan_count(store_id, product_id)
        
        # Add to scanned history if customer
        if session.get('role') == 'customer':
            firebase.add_to_history(session['user_id'], product_id, {
                'store_id': store_id,
                'product_name': product.get('name'),
                'scanned_at': datetime.now().isoformat()
            })
        
        return jsonify(product)
    
    elif request.method == 'PUT':
        data = request.json
        firebase.update_product(store_id, product_id, data)
        return jsonify({'success': True})
    
    elif request.method == 'DELETE':
        firebase.delete_product(store_id, product_id)
        return jsonify({'success': True})

# Cart APIs
@app.route('/api/cart', methods=['GET', 'POST', 'DELETE'])
@login_required
@role_required('customer')
def cart_api():
    """Get cart, add to cart, or clear cart"""
    user_id = session['user_id']
    
    if request.method == 'GET':
        cart = firebase.get_cart(user_id)
        return jsonify(cart)
    
    elif request.method == 'POST':
        data = request.json
        product_id = data.get('product_id')
        
        cart_item = {
            'store_id': data.get('store_id'),
            'product_name': data.get('product_name'),
            'price': data.get('price'),
            'quantity': data.get('quantity', 1),
            'image': data.get('image', ''),
            'added_at': datetime.now().isoformat()
        }
        
        firebase.add_to_cart(user_id, product_id, cart_item)
        return jsonify({'success': True})
    
    elif request.method == 'DELETE':
        firebase.clear_cart(user_id)
        return jsonify({'success': True})

@app.route('/api/cart/<product_id>', methods=['DELETE'])
@login_required
@role_required('customer')
def remove_from_cart_api(product_id):
    """Remove item from cart"""
    user_id = session['user_id']
    firebase.remove_from_cart(user_id, product_id)
    return jsonify({'success': True})

# Order APIs
@app.route('/api/orders', methods=['POST'])
@login_required
@role_required('customer')
def create_order_api():
    """Create a new order"""
    data = request.json
    user_id = session['user_id']
    order_id = str(uuid.uuid4())
    
    order_data = {
        'order_id': order_id,
        'user_id': user_id,
        'items': data.get('items'),
        'total': data.get('total'),
        'delivery_method': data.get('delivery_method'),
        'address': data.get('address', ''),
        'status': 'confirmed',
        'created_at': datetime.now().isoformat()
    }
    
    # Create order
    firebase.create_order(order_id, order_data)
    
    # Add to user's orders
    firebase.add_order_to_user(user_id, order_id, {
        'total': data.get('total'),
        'created_at': datetime.now().isoformat()
    })
    
    # Add to relevant stores
    items = data.get('items', [])
    store_orders = {}
    
    # Group items by store
    for item in items:
        store_id = item.get('store_id')
        if store_id:
            if store_id not in store_orders:
                store_orders[store_id] = {
                    'items': [],
                    'total': 0
                }
            
            store_orders[store_id]['items'].append(item)
            # Calculate store-specific total
            item_total = float(item.get('price', 0)) * int(item.get('quantity', 1))
            store_orders[store_id]['total'] += item_total
            
    # Get customer email
    customer_email = session.get('email', 'Unknown')

    for store_id, store_data in store_orders.items():
        firebase.add_order_to_store(store_id, order_id, {
            'user_id': user_id,
            'customer_email': customer_email,
            'items': store_data['items'],
            'total': store_data['total'],
            'status': 'confirmed',
            'created_at': datetime.now().isoformat()
        })
    
    # Clear cart
    firebase.clear_cart(user_id)
    
    return jsonify({
        'success': True,
        'order_id': order_id
    })

@app.route('/api/orders/<order_id>', methods=['GET'])
@login_required
def get_order_api(order_id):
    """Get order details"""
    # In a real app, verify user owns this order
    order_url = f"orders/{order_id}"
    response = firebase._get_url(order_url)
    import requests
    order = requests.get(response).json()
    return jsonify(order)

@app.route('/api/stores/<store_id>/orders', methods=['GET'])
@login_required
@role_required('store_owner')
def get_store_orders_api(store_id):
    """Get orders for a specific store"""
    orders = firebase.get_store_orders(store_id)
    return jsonify(orders)

# History APIs
@app.route('/api/history', methods=['GET'])
@login_required
@role_required('customer')
def history_api():
    """Get scanned history"""
    user_id = session['user_id']
    history = firebase.get_history(user_id)
    return jsonify(history)

# Product Request APIs
@app.route('/api/requests', methods=['POST'])
@login_required
@role_required('customer')
def product_request_api():
    """Submit a product request"""
    data = request.json
    store_id = data.get('store_id')
    product_name = data.get('product_name')
    
    firebase.add_product_request(store_id, product_name)
    
    return jsonify({'success': True})

@app.route('/api/stores/<store_id>/requests', methods=['GET'])
@login_required
@role_required('store_owner')
def get_requests_api(store_id):
    """Get product requests for a store"""
    requests_data = firebase.get_store_requests(store_id)
    return jsonify(requests_data)

# Analytics APIs
@app.route('/api/stores/<store_id>/analytics', methods=['GET'])
@login_required
@role_required('store_owner')
def analytics_api(store_id):
    """Get analytics for a store"""
    analytics = firebase.get_store_analytics(store_id)
    return jsonify(analytics)

# ========== RUN APPLICATION ==========

@app.route('/api/qr/<store_id>/<product_id>')
def get_qr_code(store_id, product_id):
    """Generate and serve QR code dynamically with JSON payload"""
    try:
        # Fetch actual product details to encode in QR
        product = firebase.get_product(store_id, product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
            
        # Create the JSON payload requested by user
        # Format: { "name": "Milk Packet", "price": "₹45", "weight": "500ml", "store": "Akhil Mart" }
        payload = {
            "id": product_id, # Keep ID for API calls
            "store_id": store_id,
            "name": product.get('name'),
            "price": f"₹{product.get('price')}",
            "weight": product.get('size', ''),
            "store": "Connect Store", # Should ideally fetch store name
            "image": product.get('image', '') # Helper for UI
        }
        
        buffer = qr_gen.generate_qr_stream(payload)
        return send_file(
            buffer,
            mimetype='image/png',
            as_attachment=False,
            download_name=f'{product_id}.png'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scan-qr', methods=['POST'])
def scan_qr_api():
    """
    Process uploaded image for QR codes using Python OpenCV/Pyzbar
    Requested by user to 'use python' for scanning.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Import here to avoid crash if libs missing locally
        import cv2
        import numpy as np
        from pyzbar.pyzbar import decode
        from PIL import Image
        import io

        # Read image
        in_memory_file = io.BytesIO()
        file.save(in_memory_file)
        in_memory_file.seek(0)
        
        # Convert to numpy array for OpenCV
        file_bytes = np.asarray(bytearray(in_memory_file.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        # Decode
        decoded_objects = decode(img)
        
        if not decoded_objects:
            # Try converting to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            decoded_objects = decode(gray)

        if not decoded_objects:
            return jsonify({'error': 'No QR code detected in image'}), 404

        # Get first result
        qr_data = decoded_objects[0].data.decode('utf-8')
        
        return jsonify({'success': True, 'data': qr_data})

    except ImportError:
        return jsonify({'error': 'Server missing Python QR libraries (opencv/pyzbar)'}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Processing failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Smart QR Shopping Website - Flask Server")
    print("="*60)
    print(f"\n✅ Server running at: http://{config.HOST}:{config.PORT}")
    print(f"\n📝 Instructions:")
    print(f"   1. Open your browser")
    print(f"   2. Navigate to: http://{config.HOST}:{config.PORT}")
    print(f"   3. Register as Customer or Store Owner")
    print(f"\n⚠️  IMPORTANT: Update Firebase credentials in config.py")
    print("="*60 + "\n")
    
    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG
    )
