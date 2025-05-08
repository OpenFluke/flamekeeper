```
wget https://dldata-public.s3.us-east-2.amazonaws.com/2086-149220-0033.wav
```

```
curl -X POST -F "file=@2086-149220-0033.wav" http://localhost:8020/transcribe
{"transcriptions":["Well, I don't wish to see it any more, observed Phebe, turning away her eyes. It is certainly very like the old portrait."],"alternatives":["Well, I don't wish to see it any more, observed Phebe, turning away her eyes. It is certainly very like the old portrait."]}
```
