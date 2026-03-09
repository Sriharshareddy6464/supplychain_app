from sqlalchemy import create_engine, inspect
from app.config import settings

def inspect_db():
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    print("\n🔍 DATABASE X-RAY REPORT")
    print("==========================")
    
    # 1. List all Tables
    tables = inspector.get_table_names()
    print(f"📂 Tables Found: {tables}")
    
    # 2. Check key tables for 'category'
    target_tables = ["users", "vendors", "vendor_profiles", "profiles"]
    
    for table in tables:
        if table in target_tables:
            print(f"\n📋 Table: '{table}'")
            columns = [col['name'] for col in inspector.get_columns(table)]
            print(f"   Columns: {columns}")
            
    print("\n==========================")

if __name__ == "__main__":
    inspect_db()