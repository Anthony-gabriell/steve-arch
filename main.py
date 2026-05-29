"""
Entrypoint do Steve Arch — FastAPI
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="Steve Arch API",
    description="Arquiteto de soluções escaláveis",
    version="1.0.0"
)

# CORS — permite o frontend local chamar o backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restringir para o domínio real
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Steve Arch API online", "version": "1.0.0"}