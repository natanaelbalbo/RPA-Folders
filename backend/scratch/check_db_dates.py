from database import SessionLocal, Arquivo
from datetime import datetime

db = SessionLocal()
arquivos = db.query(Arquivo).limit(5).all()
for a in arquivos:
    print(f"ID: {a.id}, Created At: {a.created_at}, Type: {type(a.created_at)}")
db.close()
