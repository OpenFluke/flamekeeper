from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np

# Initialize FastAPI
app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Nomic Embedding Model
embedding_model = SentenceTransformer('nomic-ai/nomic-embed-text-v1', trust_remote_code=True)
print("✅ Nomic Embed Model Loaded and Ready.")

# Define the incoming request structure
class TextInput(BaseModel):
    text: str  # Changed to accept a single text string

# Endpoint to receive a single text chunk and return its embedding
@app.post("/embed")
async def embed_text(payload: TextInput):
    try:
        text = payload.text
        embedding = embedding_model.encode(text, normalize_embeddings=True)
        embedding_list = embedding.tolist()  # Convert numpy array to JSON serializable list
        return {"embedding": embedding_list}
    except Exception as e:
        return {"error": str(e)}