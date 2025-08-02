from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)
model = joblib.load("water_model.pkl")

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    features = np.array([[
        data['ph'],
        data['Hardness'],
        data['Solids'],
        data['Chloramines'],
        data['Sulfate'],
        data['Conductivity'],
        data['Organic_carbon'],
        data['Trihalomethanes'],
        data['Turbidity']
    ]])
    prediction = model.predict(features)
    return jsonify({"prediction": "Safe" if prediction[0] == 1 else "Unsafe"})

if __name__ == '__main__':
    app.run(port=5001)

