
import firebase_service
import requests
import sys

def cleanup_stores():
    print("Starting Store Cleanup...")
    firebase = firebase_service.FirebaseService()
    stores = firebase.get_all_stores()
    
    if not stores:
        print("No stores found.")
        return

    store_ids = list(stores.keys())
    print(f"Total stores found: {len(store_ids)}")
    
    if len(store_ids) <= 5:
        print("Less than or equal to 5 stores. No cleanup needed.")
        return

    # Keep first 5
    keep_ids = store_ids[:5]
    delete_ids = store_ids[5:]
    
    print("\nKeeping these stores:")
    for sid in keep_ids:
        sdata = stores.get(sid, {})
        print(f" - {sdata.get('name', sid)}")
        
    print(f"\nDeleting {len(delete_ids)} stores...")
    
    count = 0
    for sid in delete_ids:
        try:
            url = firebase._get_url(f"stores/{sid}")
            response = requests.delete(url)
            if response.status_code == 200:
                count += 1
                if count % 5 == 0:
                    print(f"Deleted {count}/{len(delete_ids)}...")
            else:
                print(f"Failed to delete {sid}")
        except Exception as e:
            print(f"Error deleting {sid}: {e}")
            
    print(f"\nCleanup Finished! Deleted {count} stores.")
    print(f"Remaining stores: {len(keep_ids)}")

if __name__ == "__main__":
    cleanup_stores()
