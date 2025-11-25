import pandas as pd
from sklearn.model_selection import train_test_split
import os

df = pd.read_csv("data/processed/reddit_clean_balanced.csv")

X = df['clean_comment']
y = df['category']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

train_df = pd.DataFrame({'clean_comment': X_train, 'category': y_train})
test_df = pd.DataFrame({'clean_comment': X_test, 'category': y_test})

os.makedirs("data/processed", exist_ok=True)
train_df.to_csv("data/processed/train.csv", index=False)
test_df.to_csv("data/processed/test.csv", index=False)

print(f"Train size: {len(train_df)}, Test size: {len(test_df)}")
