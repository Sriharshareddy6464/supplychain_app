from sqlalchemy import create_engine, text
from app.config import settings

def list_vendors():
    # Connect to the database
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("\n--- CONNECTING TO DATABASE ---")
        
        # SQL Query to find all users with role 'VENDOR' and their categories from 'vendors' table
        query = text("""
            SELECT u.id, u.email, v.business_name, v.categories 
            FROM users u
            JOIN vendors v ON u.id = v.user_id 
            WHERE u.role = 'VENDOR' 
            ORDER BY u.id;
        """)
        result = conn.execute(query)
        
        print("\n--- YOUR VENDOR TEAM ---")
        # Header formatting
        print(f"{'ID':<5} {'EMAIL':<30} {'BUSINESS':<20} {'CATEGORIES'}")
        print("-" * 80)
        
        # Loop through results and print them
        rows = result.fetchall()
        if not rows:
            print("No vendors found! (Did you register them?)")
        
        for row in rows:
            # Handle cases where categories is NULL
            cats = str(row.categories) if row.categories else "🔴 []"
            print(f"{row.id:<5} {row.email:<30} {row.business_name:<20} {cats}")
            
        print("-" * 80)

if __name__ == "__main__":
    list_vendors()