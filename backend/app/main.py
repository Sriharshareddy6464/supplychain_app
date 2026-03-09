from fastapi import FastAPI
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

app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(billing.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Supply Chain Platform API"}
