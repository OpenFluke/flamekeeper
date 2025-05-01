```
sudo docker-compose down -v
```

```
sudo docker rmi ollama-ollama
```

```
sudo docker-compose up --build
```

```
curl -X GET http://localhost:11434/api/tags
```

```
curl -s http://localhost:11434/api/tags \
  | jq -r '.models[].name'
```

```
curl -X POST http://localhost:11434/api/pull \
     -H "Content-Type: application/json" \
     -d '{"model":"qwen3:4b"}'
```

```
curl -s http://localhost:11434/api/pull \
     -H "Content-Type: application/json" \
     -d '{"model":"qwen3:4b"}' | jq .
```

```
curl -N http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3:4b",
    "messages": [
      { "role": "system",    "content": "You are a helpful assistant." },
      { "role": "user",      "content": "Give me a Docker-related joke." }
    ]
  }'
```

```
curl http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3:4b",
    "messages": [
      { "role": "user",    "content": "What\'s the weather like on Mars?" }
    ],
    "stream": false
  }'
```
