import os
import sqlite3

DB_DIR = "databases"  # folder to store all company DBs

def create_database(company_code: str):
    """Create company database only if it doesn't already exist."""
    
    # Create databases folder if not exists
    os.makedirs(DB_DIR, exist_ok=True)
    
    db_path = os.path.join(DB_DIR, f"{company_code}.db")
    
    if os.path.exists(db_path):
        print(f"Database already exists: {company_code}")
        return db_path
    
    # Create the database file
    conn = sqlite3.connect(db_path)
    conn.close()
    
    print(f"Database created: {company_code}")
    return db_path