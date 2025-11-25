import pandas as pd
import re
import os

file_path = "data/raw/reddit.csv"
if not os.path.exists(file_path):
    print(f"Erreur : le fichier {file_path} n'existe pas.")
    exit()

df = pd.read_csv(file_path)
df.columns = df.columns.str.strip()

if df.empty:
    print("Erreur : le fichier est vide.")
    exit()

print(f"Nombre de commentaires chargés : {len(df)}")
print("Colonnes dans le CSV :", df.columns.tolist())
print("Distribution des labels :")
print(df['category'].value_counts())

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

df['clean_comment'] = df['clean_comment'].apply(clean_text)

os.makedirs("data/processed", exist_ok=True)
output_path = "data/processed/reddit_clean.csv"
df.to_csv(output_path, index=False)

print(f"Nettoyage terminé ! Fichier sauvegardé dans {output_path}")
