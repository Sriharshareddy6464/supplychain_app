from sqlalchemy import create_engine, text
from app.config import settings

def clean_database():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        print("Cleaning up database types...")
        
        # 1. Drop the types explicitly
        conn.execute(text("DROP TYPE IF EXISTS userrole CASCADE;"))
        conn.execute(text("DROP TYPE IF EXISTS orderstatus CASCADE;"))
        
        # 2. Drop all tables just to be safe
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        
        print("Success! Database completely wiped.")

if __name__ == "__main__":
    clean_database()