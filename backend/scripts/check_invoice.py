from sqlalchemy import create_engine, inspect
from app.config import settings

def check_invoice_schema():
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    print("\n🔍 INSPECTING 'INVOICES' TABLE")
    columns = inspector.get_columns('invoices')
    
    for col in columns:
        print(f"   - {col['name']} ({col['type']})")

if __name__ == "__main__":
    check_invoice_schema()