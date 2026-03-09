import sys
import os

# Add the current directory to the path so we can find 'app'
sys.path.append(os.getcwd())

from sqlalchemy import create_engine, text
from app.config import settings

def nuke_database():
    print(f"Connecting to: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        
        print("!!! DESTROYING DATABASE ...")
        
        # 1. Force drop the entire schema (Deletes all tables/views/sequences)
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        
        # 2. Recreate the empty schema
        conn.execute(text("CREATE SCHEMA public;"))
        
        # 3. Drop any custom Enums (Order status, Roles)
        conn.execute(text("DROP TYPE IF EXISTS orderstatus CASCADE;"))
        conn.execute(text("DROP TYPE IF EXISTS userrole CASCADE;"))
        
        print("SUCCESS: Database is 100% Empty.")

if __name__ == "__main__":
    nuke_database()