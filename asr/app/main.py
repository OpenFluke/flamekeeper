from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import nemo.collections.asr as nemo_asr
from pydub import AudioSegment
import os
import uuid
import shutil
from typing import Any

app = FastAPI(title="ASR Transcription API")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Parakeet TDT 0.6B model on CPU at startup
asr_model = nemo_asr.models.ASRModel.from_pretrained(
    model_name="nvidia/parakeet-tdt-0.6b-v2", map_location="cpu"
)

# Directory for uploaded and converted audio files
UPLOAD_DIR = "uploads"

# Ensure uploads directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def convert_to_wav(input_path: str, output_path: str) -> None:
    """Convert audio file to 16kHz mono WAV format using pydub."""
    try:
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio.export(output_path, format="wav")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Audio conversion failed: {str(e)}")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe an uploaded audio file and return full transcription output."""
    # Validate file type
    allowed_extensions = {".wav", ".mp3", ".ogg", ".flac"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
        )

    # Save uploaded file
    file_id = str(uuid.uuid4())
    uploaded_file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
    try:
        with open(uploaded_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Convert to WAV if necessary
    wav_file_path = uploaded_file_path
    if file_ext != ".wav":
        wav_file_path = os.path.join(UPLOAD_DIR, f"{file_id}.wav")
        convert_to_wav(uploaded_file_path, wav_file_path)

    # Transcribe audio
    try:
        output = asr_model.transcribe([wav_file_path], batch_size=1)

        print(f"[DEBUG] ASR Output: {output}")

        response_data: dict[str, Any] = {}

        # Output is usually a tuple of (predictions, alternatives)
        if isinstance(output, tuple):
            response_data = {
                "transcriptions": output[0],
                "alternatives": output[1] if len(output) > 1 else []
            }
        else:
            response_data = {
                "transcriptions": output
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        # Clean up files
        for path in {uploaded_file_path, wav_file_path}:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

    return JSONResponse(content=response_data)
