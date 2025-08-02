import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

# Load CSV
df = pd.read_csv("water_potability.csv")
df = df.dropna()  # Drop missing values

# Use some features — feel free to use more
X = df[["ph", "Turbidity", "Solids"]]  # use only 3 for simplicity now
y = df["Potability"]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train the model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Save the model
joblib.dump(model, "water_model.pkl")
print("✅ Model trained and saved successfully.")
