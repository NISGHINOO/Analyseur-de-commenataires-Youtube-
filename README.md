---
title: YouTube Sentiment Analyzer
emoji: 🎬
colorFrom: red
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# YouTube Sentiment Analyzer API

API d'analyse de sentiments pour les commentaires YouTube utilisant CamemBERT.

## Fonctionnalités

- Analyse de sentiments en français
- Support des commentaires YouTube
- API REST FastAPI
- Modèle CamemBERT fine-tuné

## Utilisation
```bash
POST /analyze
{
  "text": "Votre texte ici"
}
```

## Modèle

Utilise le modèle CamemBERT pour l'analyse de sentiments en français.