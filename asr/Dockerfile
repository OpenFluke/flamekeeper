FROM python:3.10-slim

# Install system dependencies, including ffmpeg for audio conversion
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Update pip to the latest version
RUN pip install --no-cache-dir --upgrade pip

# Copy requirements file
COPY requirements.txt .

# Explicitly downgrade NumPy to avoid np.sctypes issue
# Make sure this is also in your requirements.txt: numpy<2.0.0
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy application code
COPY ./app ./app

# Create uploads and cache directories
RUN mkdir -p /app/uploads /app/cache

# (Optional) Create a non-root user for security
RUN useradd -ms /bin/bash appuser

# Give full permissions to the app directories
RUN chown -R appuser:appuser /app/uploads /app/cache && \
    chmod -R 777 /app/uploads /app/cache

# Set environment variables to redirect cache directories
ENV HF_HOME=/app/cache/huggingface \
    XDG_CACHE_HOME=/app/cache \
    MPLCONFIGDIR=/app/cache/matplotlib

# Switch to the non-root user
USER appuser

# Expose port
EXPOSE 8020

# Command to run the application (overridden by docker-compose.yml if needed)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8020"]
