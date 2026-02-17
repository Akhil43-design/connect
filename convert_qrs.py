
import firebase_service
from qr_generator import QRGenerator
import sys

def convert_all_qrs():
    print("Starting QR Code Migration to Base64...")
    
    # Initialize services
    firebase = firebase_service.FirebaseService()
    qr_gen = QRGenerator() # Uses default Vercel URL
    
    # Get all stores
    print("Fetching all stores...")
    stores = firebase.get_all_stores()
    
    if not stores:
        print("No stores found.")
        return

    total_updated = 0
    
    for store_id, store_data in stores.items():
        print(f"Processing store: {store_data.get('name', store_id)}")
        
        # Get products for this store
        products = firebase.get_products(store_id)
        
        if not products:
            continue
            
        for product_id, product_data in products.items():
            # Check if already base64 (starts with data:)
            current_qr = product_data.get('qr_code', '')
            if current_qr.startswith('data:'):
                continue
                
            # Generate new Base64 QR
            try:
                # We need to preserve the store_id and product_id for the URL
                new_qr_base64 = qr_gen.generate_product_qr(store_id, product_id)
                
                # Update product in Firebase
                # We can't update just one field easily with the current service 
                # unless we add a method or use the private _get_url/requests directly.
                # But firebase.add_product overwrites/updates at the product path.
                
                # Update the specific field in memory
                product_data['qr_code'] = new_qr_base64
                
                # Save back to Firebase
                firebase.add_product(store_id, product_id, product_data)
                
                print(f"  - Updated QR for {product_data.get('name')}")
                total_updated += 1
                
            except Exception as e:
                print(f"  - Failed to update {product_id}: {e}")

    print(f"Migration Complete. Updated {total_updated} products.")

if __name__ == "__main__":
    convert_all_qrs()
