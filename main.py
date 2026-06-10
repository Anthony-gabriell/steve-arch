"""
Entrypoint do Steve Arch — FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import router, limiter

app = FastAPI(
    title="Steve Arch API",
    description="Arquiteto de soluções escaláveis",
    version="1.0.0"
)

# Rate limit: registra o limiter compartilhado do routes.py
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: permite o frontend local chamar o backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://steve-arch.vercel.app",
        "https://www.stevearch.com.br",
        "https://stevearch.com.br",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Steve Arch API online", "version": "1.0.0"}