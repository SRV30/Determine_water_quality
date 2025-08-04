import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib


df = pd.read_csv("water_potability.csv")
df = df.dropna() 


X = df[["ph", "Turbidity", "Solids"]] 
y = df["Potability"]


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = RandomForestClassifier()
model.fit(X_train, y_train)

joblib.dump(model, "water_model.pkl")
print("✅ Model trained and saved successfully.")
