import requests
import os

url = "https://raw.githubusercontent.com/Himanshu-1703/reddit-sentiment-analysis/main/data/reddit.csv"
raw_path = "data/raw"
os.makedirs(raw_path, exist_ok=True)
file_path = os.path.join(raw_path, "reddit.csv")

response = requests.get(url)
if response.status_code == 200:
    with open(file_path, "wb") as f:
        f.write(response.content)
    print(f"Dataset téléchargé avec succès dans {file_path}")
else:
    print(f"Erreur lors du téléchargement, status code: {response.status_code}")
