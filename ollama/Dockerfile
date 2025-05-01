FROM ollama/ollama:latest

# Install curl (assuming Debian-based image)
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy models.txt and verify
COPY models.txt /models/models.txt
RUN ls -l /models/models.txt && cat /models/models.txt || echo "Error: Failed to copy models.txt"

# Create entrypoint script with enhanced error handling
RUN echo '#!/bin/bash' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo 'echo "Starting Ollama server..."' >> /entrypoint.sh && \
    echo 'ollama serve &' >> /entrypoint.sh && \
    echo 'OLLAMA_PID=$!' >> /entrypoint.sh && \
    echo 'echo "Waiting for Ollama to start..."' >> /entrypoint.sh && \
    echo 'for i in {1..60}; do' >> /entrypoint.sh && \
    echo '  if curl -s http://localhost:11434 > /dev/null; then' >> /entrypoint.sh && \
    echo '    echo "Ollama is ready!"' >> /entrypoint.sh && \
    echo '    break' >> /entrypoint.sh && \
    echo '  fi' >> /entrypoint.sh && \
    echo '  sleep 1' >> /entrypoint.sh && \
    echo 'done' >> /entrypoint.sh && \
    echo 'if ! curl -s http://localhost:11434 > /dev/null; then' >> /entrypoint.sh && \
    echo '  echo "Error: Ollama failed to start"' >> /entrypoint.sh && \
    echo '  exit 1' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo 'if [ -f /models/models.txt ]; then' >> /entrypoint.sh && \
    echo '  echo "Found models.txt, contents:"' >> /entrypoint.sh && \
    echo '  cat /models/models.txt' >> /entrypoint.sh && \
    echo '  echo "Checking models from models.txt..."' >> /entrypoint.sh && \
    echo '  while IFS= read -r model; do' >> /entrypoint.sh && \
    echo '    if [[ -z "$model" || "$model" =~ ^#.* ]]; then' >> /entrypoint.sh && \
    echo '      echo "Skipping empty or commented line: $model"' >> /entrypoint.sh && \
    echo '      continue' >> /entrypoint.sh && \
    echo '    fi' >> /entrypoint.sh && \
    echo '    echo "Checking model: $model"' >> /entrypoint.sh && \
    echo '    if ollama list | grep -q "$model"; then' >> /entrypoint.sh && \
    echo '      echo "Model $model is already installed, skipping..."' >> /entrypoint.sh && \
    echo '    else' >> /entrypoint.sh && \
    echo '      echo "Pulling model $model..."' >> /entrypoint.sh && \
    echo '      ollama pull "$model"' >> /entrypoint.sh && \
    echo '      if [ $? -eq 0 ]; then' >> /entrypoint.sh && \
    echo '        echo "Successfully pulled $model"' >> /entrypoint.sh && \
    echo '      else' >> /entrypoint.sh && \
    echo '        echo "Failed to pull $model"' >> /entrypoint.sh && \
    echo '      fi' >> /entrypoint.sh && \
    echo '    fi' >> /entrypoint.sh && \
    echo '  done < /models/models.txt' >> /entrypoint.sh && \
    echo 'else' >> /entrypoint.sh && \
    echo '  echo "Error: models.txt not found, using fallback models"' >> /entrypoint.sh && \
    echo '  for model in tinyllama qwen3:0.6b qwen3:1.7b qwen3:4b; do' >> /entrypoint.sh && \
    echo '    echo "Checking fallback model: $model"' >> /entrypoint.sh && \
    echo '    if ollama list | grep -q "$model"; then' >> /entrypoint.sh && \
    echo '      echo "Model $model is already installed, skipping..."' >> /entrypoint.sh && \
    echo '    else' >> /entrypoint.sh && \
    echo '      echo "Pulling model $model..."' >> /entrypoint.sh && \
    echo '      ollama pull "$model"' >> /entrypoint.sh && \
    echo '      if [ $? -eq 0 ]; then' >> /entrypoint.sh && \
    echo '        echo "Successfully pulled $model"' >> /entrypoint.sh && \
    echo '      else' >> /entrypoint.sh && \
    echo '        echo "Failed to pull $model"' >> /entrypoint.sh && \
    echo '      fi' >> /entrypoint.sh && \
    echo '    fi' >> /entrypoint.sh && \
    echo '  done' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo 'echo "Model pulling complete, keeping container running..."' >> /entrypoint.sh && \
    echo 'wait $OLLAMA_PID' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]