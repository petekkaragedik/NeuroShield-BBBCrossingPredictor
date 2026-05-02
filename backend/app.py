import pickle
import numpy as np
import pandas as pd
import shap
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from rdkit import Chem
from rdkit.Chem import rdMolDescriptors

app = Flask(__name__)
CORS(app)

FEATURES = ["MW", "LogP", "HBD", "TPSA", "RingCount", "RotBonds"]

# Load artifacts
print("Loading model artifacts...")
with open("model.pkl", "rb") as f:
    model = pickle.load(f)
with open("nn.pkl", "rb") as f:
    nn = pickle.load(f)

compounds_db = pd.read_csv("compounds_db.csv")
explainer = shap.TreeExplainer(model)
print("Ready!")


def get_confidence(prob):
    diff = abs(prob - 0.5)
    if diff > 0.35:
        return "High"
    elif diff > 0.15:
        return "Medium"
    return "Low"


def get_contributing_factors(user_input):
    input_df = pd.DataFrame([user_input], columns=FEATURES)
    shap_vals = explainer.shap_values(input_df)
    # SHAP shape varies: list[2] of (n,f) for older, ndarray (n,f,2) for newer,
    # or plain (n,f) when explainer already targets the positive class.
    arr = np.asarray(shap_vals)
    if isinstance(shap_vals, list):
        per_sample = shap_vals[1][0]
    elif arr.ndim == 3:
        per_sample = arr[0, :, 1]
    else:
        per_sample = arr[0]
    contributions = dict(zip(FEATURES, per_sample))
    # Sort by absolute impact
    sorted_factors = sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
    result = []
    for feat, val in sorted_factors:
        result.append({
            "feature": feat,
            "value": round(user_input[FEATURES.index(feat)], 3),
            "impact": round(float(val), 4),
            "direction": "increases BBB penetration" if val > 0 else "decreases BBB penetration"
        })
    return result


def get_similar_compounds(user_input):
    distances, indices = nn.kneighbors([user_input])
    similar = []
    for dist, idx in zip(distances[0], indices[0]):
        row = compounds_db.iloc[idx]
        similar.append({
            "name": row["compound_name"],
            "bbb_status": "BBB+" if row["label"] == 1 else "BBB-",
            "similarity": round(1 / (1 + dist), 3),
            "MW": round(row["MW"], 2),
            "LogP": round(row["LogP"], 2),
        })
    # Skip the exact match (distance=0) if any
    similar = [s for s in similar if s["similarity"] < 1.0][:3]
    return similar


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        user_input = [
            float(data["MW"]),
            float(data["LogP"]),
            float(data["HBD"]),
            float(data["TPSA"]),
            float(data["RingCount"]),
            float(data["RotBonds"]),
        ]

        prob = model.predict_proba([user_input])[0][1]
        confidence = get_confidence(prob)
        factors = get_contributing_factors(user_input)
        similar = get_similar_compounds(user_input)

        return jsonify({
            "probability": round(prob * 100, 1),
            "prediction": "BBB+" if prob >= 0.5 else "BBB-",
            "confidence": confidence,
            "contributing_factors": factors,
            "similar_compounds": similar,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/pubchem/<compound_name>", methods=["GET"])
def pubchem_lookup(compound_name):
    """Autocomplete: compound name → descriptors via PubChem API"""
    try:
        url = (
            f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/"
            f"{compound_name}/property/"
            f"MolecularWeight,XLogP,HBondDonorCount,TPSA,RotatableBondCount,CanonicalSMILES/JSON"
        )
        res = requests.get(url, timeout=5)
        if res.status_code != 200:
            return jsonify({"error": "Compound not found"}), 404

        props = res.json()["PropertyTable"]["Properties"][0]
        smiles = props.get("CanonicalSMILES") or props.get("ConnectivitySMILES") or ""
        ring_count = 0
        if smiles:
            mol = Chem.MolFromSmiles(smiles)
            if mol is not None:
                ring_count = rdMolDescriptors.CalcNumRings(mol)

        return jsonify({
            "MW":        props.get("MolecularWeight", 0),
            "LogP":      props.get("XLogP", 0),
            "HBD":       props.get("HBondDonorCount", 0),
            "TPSA":      props.get("TPSA", 0),
            "RingCount": ring_count,
            "RotBonds":  props.get("RotatableBondCount", 0),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
