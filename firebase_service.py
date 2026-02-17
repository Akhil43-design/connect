"""
Firebase Service Module
Handles all Firebase Realtime Database operations using REST API
"""

import requests
import json
from config import FIREBASE_CONFIG

class FirebaseService:
    def __init__(self):
        self.db_url = FIREBASE_CONFIG['databaseURL']
    
    def _get_url(self, path):
        """Construct Firebase REST API URL"""
        return f"{self.db_url}/{path}.json"
    
    # ========== USER OPERATIONS ==========
    
    def create_user(self, user_id, email, role):
        """Create a new user in Firebase"""
        user_data = {
            "email": email,
            "role": role,
            "scanned_history": {},
            "cart": {},
            "orders": {}
        }
        url = self._get_url(f"users/{user_id}")
        response = requests.put(url, json=user_data)
        return response.json()
    
    def get_user(self, user_id):
        """Get user data"""
        url = self._get_url(f"users/{user_id}")
        response = requests.get(url)
        return response.json()
    def get_user_by_email(self, email):
        """Get user data by email (scan all users - inefficient but works for demo)"""
        url = self._get_url("users")
        response = requests.get(url)
        users = response.json()
        
        if not users:
            return None
            
        for user_id, user_data in users.items():
            if user_data.get('email') == email:
                # Inject user_id
                user_data['user_id'] = user_id
                return user_data
        
        return None
    
    def create_store(self, store_id, store_data):
        """Create a new store"""
        url = self._get_url(f"stores/{store_id}")
        response = requests.put(url, json=store_data)
        return response.json()
    
    def get_all_stores(self):
        """Get all stores"""
        url = self._get_url("stores")
        response = requests.get(url)
        stores = response.json()
        return stores if stores else {}
    
    def get_store(self, store_id):
        """Get a specific store"""
        url = self._get_url(f"stores/{store_id}")
        response = requests.get(url)
        return response.json()
    
    # ========== PRODUCT OPERATIONS ==========
    
    def add_product(self, store_id, product_id, product_data):
        """Add a product to a store"""
        url = self._get_url(f"stores/{store_id}/products/{product_id}")
        response = requests.put(url, json=product_data)
        return response.json()
    
    def get_products(self, store_id):
        """Get all products for a store"""
        url = self._get_url(f"stores/{store_id}/products")
        response = requests.get(url)
        products = response.json()
        return products if products else {}
    
    def get_product(self, store_id, product_id):
        """Get a specific product"""
        url = self._get_url(f"stores/{store_id}/products/{product_id}")
        response = requests.get(url)
        return response.json()
    
    def update_product(self, store_id, product_id, product_data):
        """Update a product"""
        url = self._get_url(f"stores/{store_id}/products/{product_id}")
        response = requests.patch(url, json=product_data)
        return response.json()
    
    def delete_product(self, store_id, product_id):
        """Delete a product"""
        url = self._get_url(f"stores/{store_id}/products/{product_id}")
        response = requests.delete(url)
        return response.status_code == 200
    
    # ========== CART OPERATIONS ==========
    
    def add_to_cart(self, user_id, product_id, product_data):
        """Add item to user's cart"""
        url = self._get_url(f"users/{user_id}/cart/{product_id}")
        response = requests.put(url, json=product_data)
        return response.json()
    
    def get_cart(self, user_id):
        """Get user's cart"""
        url = self._get_url(f"users/{user_id}/cart")
        response = requests.get(url)
        cart = response.json()
        return cart if cart else {}
    
    def remove_from_cart(self, user_id, product_id):
        """Remove item from cart"""
        url = self._get_url(f"users/{user_id}/cart/{product_id}")
        response = requests.delete(url)
        return response.status_code == 200
    
    def clear_cart(self, user_id):
        """Clear user's cart"""
        url = self._get_url(f"users/{user_id}/cart")
        response = requests.delete(url)
        return response.status_code == 200
    
    # ========== SCANNED HISTORY ==========
    
    def add_to_history(self, user_id, product_id, product_data):
        """Add product to scanned history"""
        url = self._get_url(f"users/{user_id}/scanned_history/{product_id}")
        response = requests.put(url, json=product_data)
        return response.json()
    
    def get_history(self, user_id):
        """Get user's scanned history"""
        url = self._get_url(f"users/{user_id}/scanned_history")
        response = requests.get(url)
        history = response.json()
        return history if history else {}
    
    # ========== ORDER OPERATIONS ==========
    
    def create_order(self, order_id, order_data):
        """Create a new order"""
        url = self._get_url(f"orders/{order_id}")
        response = requests.put(url, json=order_data)
        return response.json()
    
    def get_user_orders(self, user_id):
        """Get all orders for a user"""
        url = self._get_url(f"users/{user_id}/orders")
        response = requests.get(url)
        orders = response.json()
        return orders if orders else {}
    
    def add_order_to_user(self, user_id, order_id, order_data):
        """Add order reference to user"""
        url = self._get_url(f"users/{user_id}/orders/{order_id}")
        response = requests.put(url, json=order_data)
        return response.json()

    def add_order_to_store(self, store_id, order_id, order_data):
        """Add order reference to store"""
        url = self._get_url(f"stores/{store_id}/orders/{order_id}")
        response = requests.put(url, json=order_data)
        return response.json()
        
    def get_store_orders(self, store_id):
        """Get all orders for a store"""
        url = self._get_url(f"stores/{store_id}/orders")
        response = requests.get(url)
        orders = response.json()
        return orders if orders else {}
    
    # ========== PRODUCT REQUEST OPERATIONS ==========
    
    def add_product_request(self, store_id, product_name):
        """Add or increment product request"""
        url = self._get_url(f"requests/{store_id}/{product_name}")
        
        # Get current count
        response = requests.get(url)
        current_data = response.json()
        
        if current_data:
            count = current_data.get('count', 0) + 1
        else:
            count = 1
        
        # Update count
        request_data = {'count': count}
        response = requests.put(url, json=request_data)
        return response.json()
    
    def get_store_requests(self, store_id):
        """Get all product requests for a store"""
        url = self._get_url(f"requests/{store_id}")
        response = requests.get(url)
        requests_data = response.json()
        return requests_data if requests_data else {}
    
    # ========== ANALYTICS ==========
    
    def increment_scan_count(self, store_id, product_id):
        """Increment scan count for a product"""
        url = self._get_url(f"stores/{store_id}/products/{product_id}/scan_count")
        
        # Get current count
        response = requests.get(url)
        current_count = response.json() or 0
        
        # Increment
        new_count = current_count + 1
        response = requests.put(url, json=new_count)
        return response.json()
    
    def get_store_analytics(self, store_id):
        """Get analytics for a store"""
        # Get all products
        products = self.get_products(store_id)
        
        if not products:
            return {
                'total_orders': 0,
                'most_scanned': [],
                'most_requested': []
            }
        
        # Calculate most scanned products
        scanned_products = []
        for prod_id, prod_data in products.items():
            scan_count = prod_data.get('scan_count', 0)
            if scan_count > 0:
                scanned_products.append({
                    'name': prod_data.get('name', 'Unknown'),
                    'count': scan_count
                })
        
        scanned_products.sort(key=lambda x: x['count'], reverse=True)
        
        # Get product requests
        requests_data = self.get_store_requests(store_id)
        requested_products = []
        
        if requests_data:
            for prod_name, data in requests_data.items():
                requested_products.append({
                    'name': prod_name,
                    'count': data.get('count', 0)
                })
        
        requested_products.sort(key=lambda x: x['count'], reverse=True)
        
        return {
            'total_orders': 0,  # Will be calculated from orders
            'most_scanned': scanned_products[:5],
            'most_requested': requested_products[:5]
        }
