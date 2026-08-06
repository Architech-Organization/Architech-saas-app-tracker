from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from app.db.session import engine, Base
from app.routers import auth, software, users, notifications
import re, os

Base.metadata.create_all(bind=engine)
app = FastAPI(title="SAM API", version="1.0.0")

def allowed(origin):
    if not origin: return False
    if re.match(r'https://architech-saas-app-tracker.*\.vercel\.app$', origin): return True
    if origin in ['http://localhost:5173','http://localhost:3000']: return True
    return False

app.add_middleware(CORSMiddleware,
    allow_origin_regex=r'https://architech-saas-app-tracker.*\.vercel\.app',
    allow_origins=['http://localhost:5173','http://localhost:3000'],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router, prefix="/api/v1")
app.include_router(software.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")

@app.get("/health")
def health(): return {"status": "ok"}
