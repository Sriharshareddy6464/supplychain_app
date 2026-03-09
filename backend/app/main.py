from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import auth, orders, billing
from app.models.user import User
from app.models.kitchen import Kitchen
from app.models.vendor import Vendor
from app.models.transport import Transport
from app.models.order import Order
from app.models.invoice import Invoice



app = FastAPI(
    title="Supply Chain Operations & Control Platform",
    description="Backend for Cloud Kitchen Aggregator Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(billing.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Supply Chain Platform API"}
