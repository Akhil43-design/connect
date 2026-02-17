
import uuid
import random
from datetime import datetime
from firebase_service import FirebaseService
from qr_generator import QRGenerator

# Initialize services
firebase = FirebaseService()
qr_gen = QRGenerator()

# Data Constants
CATEGORIES = [
    "Electronics", "Fashion", "Groceries", "Home & Garden", 
    "Books", "Beauty & Health", "Toys & Games", "Sports", 
    "Automotive", "Pet Supplies"
]

ADJECTIVES = [
    "Premium", "Discount", "Urban", "Global", "Local", "Family", 
    "Corner", "City", "Elite", "Smart", "Green", "Modern", 
    "Vintage", "Express", "Grand", "Royal", "Rapid", "Direct"
]

LOCATIONS = [
    "Plaza", "Center", "Market", "Boutique", "Outlet", "Store", 
    "Shop", "Mart", "Emporium", "Hub", "Corner", "Depot", 
    "Gallery", "World", "Zone", "Station"
]

PRODUCT_TEMPLATES = {
    "Electronics": [
        {"name": "Wireless Headphones", "price": 59.99, "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"},
        {"name": "Smart Watch", "price": 129.99, "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"},
        {"name": "Bluetooth Speaker", "price": 45.00, "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500"},
        {"name": "4K Action Camera", "price": 89.99, "image": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500"},
        {"name": "Gaming Mouse", "price": 34.99, "image": "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500"}
    ],
    "Fashion": [
        {"name": "Denim Jacket", "price": 49.99, "image": "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500"},
        {"name": "Casual T-Shirt", "price": 19.99, "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"},
        {"name": "Running Shoes", "price": 79.99, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"},
        {"name": "Summer Dress", "price": 39.99, "image": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500"},
        {"name": "Leather Handbag", "price": 119.99, "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500"}
    ],
    "Groceries": [
        {"name": "Organic Coffee Beans", "price": 14.99, "image": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500"},
        {"name": "Artisan Bread", "price": 5.99, "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500"},
        {"name": "Fresh Avocados (Pack)", "price": 8.99, "image": "https://images.unsplash.com/photo-1523049673856-428669e965f9?w=500"},
        {"name": "Premium Olive Oil", "price": 18.99, "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcdcc3a?w=500"},
        {"name": "Local Honey", "price": 12.99, "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500"}
    ],
    "Home & Garden": [
        {"name": "Succulent Plant", "price": 12.99, "image": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500"},
        {"name": "Ceramic Vase", "price": 24.99, "image": "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=500"},
        {"name": "Scented Candle", "price": 16.99, "image": "https://images.unsplash.com/photo-1602825485406-88001a884483?w=500"},
        {"name": "Throw Pillow", "price": 22.99, "image": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500"},
        {"name": "Wall Clock", "price": 34.99, "image": "https://images.unsplash.com/photo-1531688463-50714772f01f?w=500"}
    ],
    "Sports": [
        {"name": "Yoga Mat", "price": 29.99, "image": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500"},
        {"name": "Dumbbell Set", "price": 49.99, "image": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500"},
        {"name": "Tennis Racket", "price": 89.99, "image": "https://images.unsplash.com/photo-1617083934555-ac7d4fee8909?w=500"},
        {"name": "Basketball", "price": 24.99, "image": "https://images.unsplash.com/photo-1519861531473-920026393112?w=500"},
        {"name": "Cycling Helmet", "price": 45.99, "image": "https://images.unsplash.com/photo-1557803649-7b79a83857e4?w=500"}
    ]
}

def generate_store_name(category):
    adj = random.choice(ADJECTIVES)
    loc = random.choice(LOCATIONS)
    # 30% chance of including category in name
    if random.random() < 0.3:
        return f"{adj} {category} {loc}"
    else:
        # Use generic names related to category
        if category == "Electronics":
            return f"{adj} Tech {loc}"
        elif category == "Fashion":
            return f"{adj} Style {loc}"
        elif category == "Groceries":
            return f"{adj} Fresh {loc}"
        else:
            return f"{adj} {loc}"

def populate_database(num_stores=50):
    print(f"🚀 Starting database population with {num_stores} stores...")
    
    created_count = 0
    
    for i in range(num_stores):
        try:
            # 1. Create Store Owner Profile (Simulated)
            owner_id = str(uuid.uuid4())
            owner_email = f"owner_{i+1}@example.com"
            firebase.create_user(owner_id, owner_email, "store_owner")
            
            # 2. Pick Category and Name
            category = random.choice(list(PRODUCT_TEMPLATES.keys()))
            store_name = generate_store_name(category)
            
            # 3. Create Store
            store_id = str(uuid.uuid4())
            store_data = {
                'name': store_name,
                'owner_id': owner_id,
                'description': f"Best place for {category.lower()} and more. Quality guaranteed at {store_name}.",
                'category': category,
                'created_at': datetime.now().isoformat(),
                'products': {}
            }
            firebase.create_store(store_id, store_data)
            
            # 4. Add Products to Store
            # Pick 3-5 random products from the category template
            num_products = random.randint(3, 5)
            products = random.sample(PRODUCT_TEMPLATES[category], min(len(PRODUCT_TEMPLATES[category]), num_products))
            
            for prod in products:
                product_id = str(uuid.uuid4())
                
                # Generate QR
                qr_path = qr_gen.generate_product_qr(store_id, product_id)
                
                product_data = {
                    'id': product_id,
                    'name': prod['name'],
                    'price': prod['price'],
                    'size': random.choice(['S', 'M', 'L', 'One Size']),
                    'color': random.choice(['Black', 'White', 'Blue', 'Red', 'Green']),
                    'description': f"High quality {prod['name'].lower()} from {store_name}",
                    'stock': random.randint(10, 100),
                    'image': prod['image'],
                    'qr_code': qr_path,
                    'scan_count': random.randint(0, 50), # Simulate existing engagement
                    'created_at': datetime.now().isoformat()
                }
                
                firebase.add_product(store_id, product_id, product_data)
            
            created_count += 1
            print(f"✅ Created store {i+1}/{num_stores}: {store_name} ({category})")
            
        except Exception as e:
            print(f"❌ Error creating store {i+1}: {e}")

    print("\n" + "="*50)
    print(f"🎉 Metadata Population Complete! Created {created_count} stores.")
    print("="*50)

if __name__ == "__main__":
    populate_database(50)
