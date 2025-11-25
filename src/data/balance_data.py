import pandas as pd
from sklearn.utils import resample

df = pd.read_csv("data/processed/reddit_clean.csv")

df_pos = df[df['category'] == 1]
df_neu = df[df['category'] == 0]
df_neg = df[df['category'] == -1]

min_size = min(len(df_pos), len(df_neu), len(df_neg))

df_pos_resampled = resample(df_pos, replace=False, n_samples=min_size, random_state=42)
df_neu_resampled = resample(df_neu, replace=False, n_samples=min_size, random_state=42)
df_neg_resampled = resample(df_neg, replace=False, n_samples=min_size, random_state=42)

df_balanced = pd.concat([df_pos_resampled, df_neu_resampled, df_neg_resampled])
df_balanced.to_csv("data/processed/reddit_clean_balanced.csv", index=False)

print("Dataset équilibré :")
print(df_balanced['category'].value_counts())
