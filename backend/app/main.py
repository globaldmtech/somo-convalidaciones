from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import alumnos, convalidaciones, validaciones

app = FastAPI(
    title="Somo-Convalidaciones API",
    description="Backend for Somorrostro Convalidaciones system.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(alumnos.router)
app.include_router(convalidaciones.router)
app.include_router(validaciones.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Somo-Convalidaciones API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
