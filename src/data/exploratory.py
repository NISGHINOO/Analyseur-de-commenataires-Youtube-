import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("data/processed/reddit_clean_balanced.csv")

print("Colonnes dans le CSV :", df.columns.tolist())
print("Nombre de commentaires chargés :", len(df))
print("Distribution des labels :")
print(df['category'].value_counts())

df['category'].value_counts().plot(kind='bar', title="Distribution des labels")
plt.xlabel("Classe")
plt.ylabel("Nombre de commentaires")
plt.show()

df['text_length'] = df['clean_comment'].apply(lambda x: len(str(x).split()))
df['text_length'].hist(bins=30)
plt.title("Distribution de la longueur des commentaires")
plt.xlabel("Nombre de mots")
plt.ylabel("Nombre de commentaires")
plt.show()
