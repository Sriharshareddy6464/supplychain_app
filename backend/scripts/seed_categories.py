from sqlalchemy import create_engine, text
from app.config import settings
import random

def seed_categories():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Seeding Vendor Categories...")
        
        # Get vendors
        vendors = conn.execute(text("SELECT id FROM vendors")).fetchall()
        
        categories_pool = [
            ["Vegetables", "Fruits"],
            ["Dairy", "Bakery"],
            ["Meat", "Seafood"],
            ["Vegetables", "Dairy"]
        ]
        
        for i, vendor in enumerate(vendors):
            # Assign round-robin or random
            cats = categories_pool[i % len(categories_pool)]
            # JSON array format for SQL
            # Postgres requires json/jsonb input often as string if using simple text execution or careful parameter binding
            # Let's use simple text update for this quick script
            cat_str = str(cats).replace("'", '"') # valid json ["A", "B"]
            
            sql = text(f"UPDATE vendors SET categories = '{cat_str}' WHERE id = {vendor.id}")
            conn.execute(sql)
            print(f"Vendor {vendor.id} assigned: {cats}")
            
        conn.commit()
        print("Done!")

if __name__ == "__main__":
    seed_categories()
