# Smart QR Shopping Website

A beginner-friendly QR-based shopping platform built with Flask, Firebase, and vanilla frontend technologies.

## Features

### Two User Types
- **Customer**: Browse stores, scan QR codes, add to cart, checkout
- **Store Owner**: Register store, manage products, generate QR codes, view analytics

### Key Functionality
- Multi-store support
- QR code generation for products
- Shopping cart and checkout
- Order management with digital receipts
- Scanned product history
- Product request system
- Store analytics (most scanned, most requested products)

## Tech Stack

**Backend:**
- Python (Flask)
- Firebase Realtime Database (REST API)

**Frontend:**
- HTML
- CSS (Flexbox, responsive design)
- Vanilla JavaScript

## Project Structure

```
dit/
├── app.py                    # Main Flask application
├── config.py                 # Firebase configuration (IMPORTANT: Add your credentials here)
├── requirements.txt          # Python dependencies
├── firebase_service.py       # Firebase integration
├── qr_generator.py          # QR code generation
├── static/
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   ├── auth.js          # Authentication
│   │   ├── customer.js      # Customer features
│   │   ├── store.js         # Store owner features
│   │   ├── product.js       # Product details
│   │   └── cart.js          # Cart & checkout
│   └── qr_codes/            # Generated QR codes (auto-created)
└── templates/               # HTML templates
    ├── base.html
    ├── login.html
    ├── customer_dashboard.html
    ├── store_dashboard.html
    ├── store_view.html
    ├── product_detail.html
    ├── cart.html
    ├── checkout.html
    ├── receipt.html
    ├── history.html
    └── request_product.html
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/pavan/Desktop/dit
pip install -r requirements.txt
```

### 2. Configure Firebase Credentials

**IMPORTANT:** Before running the app, you need to add your Firebase credentials.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings > General > Your apps
4. Copy your Firebase configuration
5. Open `config.py` and replace the placeholder values:

```python
FIREBASE_CONFIG = {
    "apiKey": "YOUR_ACTUAL_API_KEY",
    "authDomain": "your-project.firebaseapp.com",
    "databaseURL": "https://your-project-default-rtdb.firebaseio.com",
    "projectId": "your-project-id",
    "storageBucket": "your-project.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123456789:web:abcdef"
}
```

### 3. Run the Application

```bash
python app.py
```

The server will start at: **http://127.0.0.1:5000**

### 4. Open in Browser

1. Open your web browser
2. Navigate to: **http://127.0.0.1:5000**
3. Register as either Customer or Store Owner
4. Start using the application!

## Usage Guide

### For Store Owners

1. **Register** as Store Owner
2. **Register your store** with name and description
3. **Add products** with details:
   - Name, Price, Size, Color
   - Description, Stock quantity
   - Image URL (optional)
4. **QR codes are auto-generated** for each product
5. **View analytics** on your dashboard

### For Customers

1. **Register** as Customer
2. **Browse stores** on the homepage
3. **View products** in any store
4. **Scan QR codes** (or click product links)
5. **Add to cart** and checkout
6. **Choose delivery method** (Home Delivery or Self Pickup)
7. **View scanned history** of products
8. **Request products** if unavailable

## Firebase Database Structure

```
/stores
  /{store_id}
    /products
      /{product_id}

/users
  /{user_id}
    /role
    /scanned_history
    /cart
    /orders

/requests
  /{store_id}
    /{product_name}
      /count

/orders
  /{order_id}
```

## QR Code Functionality

- Each product gets a unique QR code when created
- QR codes link to: `/store/{store_id}/product/{product_id}`
- Scanning automatically:
  - Saves product to scanned history
  - Increments scan count
  - Shows full product details

## Notes

- This is a **demo application** for local development
- Authentication is simplified (not production-ready)
- Payment is simulated (no real transactions)
- QR codes are saved in `static/qr_codes/`
- Mobile responsive design

## Troubleshooting

**Server won't start:**
- Make sure all dependencies are installed
- Check Python version (3.7+)

**Firebase errors:**
- Verify credentials in `config.py`
- Check Firebase Realtime Database is enabled
- Ensure database rules allow read/write

**QR codes not generating:**
- Check `static/qr_codes/` directory exists
- Verify qrcode library is installed

## License

This project is for educational purposes.

---

**Created with Flask, Firebase, and ❤️**
