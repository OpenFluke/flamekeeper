from fastapi import FastAPI, Request
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np

# Initialize FastAPI
app = FastAPI()

# Load Nomic Embedding Model
embedding_model = SentenceTransformer('nomic-ai/nomic-embed-text-v1', trust_remote_code=True)
print("✅ Nomic Embed Model Loaded and Ready.")

# Define the incoming request structure
class TextInput(BaseModel):
    text: str

# Endpoint to receive text and return embedding
@app.post("/embed")
async def embed_text(payload: TextInput):
    try:
        text = payload.text
        embedding = embedding_model.encode(text, normalize_embeddings=True)
        embedding_list = embedding.tolist()  # Convert numpy to JSON serializable
        return {"embedding": embedding_list}
    except Exception as e:
        return {"error": str(e)}
