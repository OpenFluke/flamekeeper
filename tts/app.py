from flask import Flask, request, send_file
from TTS.api import TTS
import soundfile as sf
import os
import uuid

app = Flask(__name__)

# Load model once when the container starts
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)

@app.route('/tts', methods=['POST'])
def text_to_speech():
    data = request.get_json()
    if not data or 'text' not in data:
        return {"error": "Please provide text in JSON format: { 'text': 'your text' }"}, 400
    
    text = data['text']
    audio = tts.tts(text)

    filename = f"/tmp/{uuid.uuid4().hex}.wav"
    sf.write(filename, audio, 22050)

    return send_file(filename, mimetype='audio/wav', as_attachment=True, download_name='output.wav')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
