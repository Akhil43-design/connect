
import firebase_service
import requests
import sys

def reset_database():
    print("⚠️  WARNING: This will DELETE ALL DATA from the database.")
    print("Nodes to be deleted: users, stores, orders, requests, customers")
    
    confirm = input("Are you sure you want to proceed? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Operation cancelled.")
        return

    print("\n🚀 Starting Database Reset...")
    
    firebase = firebase_service.FirebaseService()
    
    # List of root nodes to clear
    nodes = ['users', 'stores', 'orders', 'requests']
    
    deleted_count = 0
    
    for node in nodes:
        try:
            url = firebase._get_url(node)
            print(f"Deleting /{node}...")
            response = requests.delete(url)
            
            if response.status_code == 200:
                print(f"✅ Successfully deleted /{node}")
                deleted_count += 1
            else:
                print(f"❌ Failed to delete /{node}. Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error deleting /{node}: {e}")
            
    print("\n" + "="*50)
    print(f"🎉 Database Reset Complete. Cleared {deleted_count}/{len(nodes)} nodes.")
    print("="*50)

if __name__ == "__main__":
    # Bypass input check for automation if argument provided
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        # Mock input
        input = lambda _: "yes"
        
    reset_database()
