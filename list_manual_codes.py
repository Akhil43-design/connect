from firebase_service import FirebaseService
import config

firebase = FirebaseService()
stores = firebase.get_all_stores()

print("\n=== VALID QR CODES FOR TESTING ===")
if stores:
    for store_id, store_data in stores.items():
        print(f"\nStore: {store_data.get('name')} (ID: {store_id})")
        products = firebase.get_products(store_id)
        if products:
            for p_id, p_data in list(products.items())[:3]: # Just show top 3
                print(f"  - Product: {p_data.get('name')}")
                print(f"    Manual Code: /store/{store_id}/product/{p_id}")
        else:
            print("  (No products)")
else:
    print("No stores found.")
