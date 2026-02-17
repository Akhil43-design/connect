
import uuid
import random
from datetime import datetime
from firebase_service import FirebaseService
from qr_generator import QRGenerator

# India-Specific Data
INDIAN_STORES = [
    {
        "name": "Sharma Electronics",
        "category": "Electronics",
        "description": "Best deals on smartphones, laptops, and accessories. Located in Nehru Place.",
        "products": [
            {"name": "OnePlus Nord CE 3", "price": 24999, "image": "https://m.media-amazon.com/images/I/6175SlKKECL._SX679_.jpg", "stock": 15},
            {"name": "Samsung Galaxy Tab S9", "price": 69999, "image": "https://m.media-amazon.com/images/I/61fK9Vn+ZIL._SX679_.jpg", "stock": 8},
            {"name": "boAt Rockerz 450", "price": 1499, "image": "https://m.media-amazon.com/images/I/51xxA+6E+xL._SX679_.jpg", "stock": 50},
            {"name": "Dell Inspiron 15 Laptop", "price": 45000, "image": "https://m.media-amazon.com/images/I/51jF8d7sC+L._SX679_.jpg", "stock": 5},
            {"name": "Mi Power Bank 3i", "price": 1999, "image": "https://m.media-amazon.com/images/I/71lVwl3q-kL._SX679_.jpg", "stock": 30}
        ]
    },
    {
        "name": "Priya Fashions",
        "category": "Fashion",
        "description": "Trending ethnic and western wear for women. Visit us for the latest collection.",
        "products": [
            {"name": "Cotton Kurti Set", "price": 1299, "image": "https://m.media-amazon.com/images/I/61K-Kk6mKPL._UY741_.jpg", "stock": 25},
            {"name": "Silk Saree (Kanjivaram)", "price": 4500, "image": "https://m.media-amazon.com/images/I/91JmOqf+bAL._UY879_.jpg", "stock": 10},
            {"name": "Denim Jeans", "price": 1899, "image": "https://m.media-amazon.com/images/I/81+wF7Y5LlL._UY741_.jpg", "stock": 40},
            {"name": "Designer Lehenga", "price": 12000, "image": "https://m.media-amazon.com/images/I/71K2+p7g+tL._UY879_.jpg", "stock": 3},
            {"name": "Party Wear Gown", "price": 3500, "image": "https://m.media-amazon.com/images/I/61v+5q6s+pL._UY741_.jpg", "stock": 12}
        ]
    },
    {
        "name": "Singh Grocery Mart",
        "category": "Groceries",
        "description": "Daily fresh vegetables, fruits, and household essentials. Free home delivery.",
        "products": [
            {"name": "Basmati Rice (5kg)", "price": 650, "image": "https://m.media-amazon.com/images/I/71h+hC+m+aL._SX679_.jpg", "stock": 100},
            {"name": "Tata Tea Gold (500g)", "price": 280, "image": "https://m.media-amazon.com/images/I/61+9f+k+k+L._SX679_.jpg", "stock": 60},
            {"name": "Amul Butter (500g)", "price": 275, "image": "https://m.media-amazon.com/images/I/61+rJ+n+n+L._SX679_.jpg", "stock": 40},
            {"name": "Aashirvaad Atta (10kg)", "price": 450, "image": "https://m.media-amazon.com/images/I/81+w+w+w+wL._SX679_.jpg", "stock": 80},
            {"name": "Sunflower Oil (1L)", "price": 160, "image": "https://m.media-amazon.com/images/I/61+y+y+y+yL._SX679_.jpg", "stock": 50}
        ]
    },
    {
        "name": "Raju Home Decor",
        "category": "Home & Garden",
        "description": "Beautify your home with our exclusive collection of decor items.",
        "products": [
            {"name": "Ceramic Flower Vase", "price": 899, "image": "https://m.media-amazon.com/images/I/71+v+v+v+vL._SX679_.jpg", "stock": 15},
            {"name": "Wall Painting (Abstract)", "price": 2500, "image": "https://m.media-amazon.com/images/I/81+z+z+z+zL._SX679_.jpg", "stock": 5},
            {"name": "Cotton Bedsheet (King Size)", "price": 1499, "image": "https://m.media-amazon.com/images/I/71+x+x+x+xL._SX679_.jpg", "stock": 30},
            {"name": "Table Lamp", "price": 1200, "image": "https://m.media-amazon.com/images/I/61+u+u+u+uL._SX679_.jpg", "stock": 10},
            {"name": "Indoor Plant (Snake Plant)", "price": 450, "image": "https://m.media-amazon.com/images/I/61+t+t+t+tL._SX679_.jpg", "stock": 20}
        ]
    },
    {
        "name": "Tech World",
        "category": "Electronics",
        "description": "Your one-stop shop for all gaming accessories and computer peripherals.",
        "products": [
            {"name": "Logitech G102 Mouse", "price": 1495, "image": "https://m.media-amazon.com/images/I/61+s+s+s+sL._SX679_.jpg", "stock": 25},
            {"name": "Mechanical Keyboard", "price": 3500, "image": "https://m.media-amazon.com/images/I/71+r+r+r+rL._SX679_.jpg", "stock": 10},
            {"name": "Gaming Headset", "price": 2200, "image": "https://m.media-amazon.com/images/I/61+q+q+q+qL._SX679_.jpg", "stock": 15},
            {"name": "Mouse Pad (Extended)", "price": 499, "image": "https://m.media-amazon.com/images/I/61+p+p+p+pL._SX679_.jpg", "stock": 50},
            {"name": "HDMI Cable (2m)", "price": 299, "image": "https://m.media-amazon.com/images/I/51+n+n+n+nL._SX679_.jpg", "stock": 60}
        ]
    }
]

def seed_database():
    print("🚀 Starting Database Seeding (Indian Stores)...")
    
    firebase = FirebaseService()
    qr_gen = QRGenerator()
    
    created_count = 0
    
    for i, store_info in enumerate(INDIAN_STORES):
        try:
            # 1. Create Store Owner Profile
            owner_id = str(uuid.uuid4())
            owner_email = f"owner_{store_info['name'].lower().replace(' ', '_')}@example.com"
            # Creating a predictable email for testing if needed
            
            print(f"Creating Owner: {owner_email}")
            firebase.create_user(owner_id, owner_email, "store_owner")
            
            # 2. Create Store
            store_id = str(uuid.uuid4())
            store_data = {
                'name': store_info['name'],
                'owner_id': owner_id,
                'description': store_info['description'],
                'category': store_info['category'],
                'created_at': datetime.now().isoformat(),
                'products': {}
            }
            firebase.create_store(store_id, store_data)
            
            # 3. Add Products
            for prod in store_info['products']:
                product_id = str(uuid.uuid4())
                
                # Generate QR
                qr_path = qr_gen.generate_product_qr(store_id, product_id)
                
                product_data = {
                    'id': product_id,
                    'name': prod['name'],
                    'price': prod['price'],
                    'size': 'Standard',
                    'color': 'Standard',
                    'description': f"Best quality {prod['name']}",
                    'stock': prod['stock'],
                    'image': prod['image'],
                    'qr_code': qr_path,
                    'scan_count': random.randint(0, 10),
                    'created_at': datetime.now().isoformat()
                }
                
                firebase.add_product(store_id, product_id, product_data)
                
            created_count += 1
            print(f"✅ Created Store: {store_info['name']}")
            
        except Exception as e:
            print(f"❌ Error creating {store_info['name']}: {e}")
            
    print("\n" + "="*50)
    print(f"🎉 Seeding Complete! Created {created_count} stores.")
    print("="*50)

if __name__ == "__main__":
    seed_database()
