import os
import pickle
import numpy as np
import pandas as pd
import shap
import requests
from groq import Groq
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from rdkit import Chem
from rdkit.Chem import rdMolDescriptors

load_dotenv()

app = Flask(__name__)
app.json.allow_nan = False  # reject NaN/Infinity, force valid JSON
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


def _clean_name(raw):
    if raw is None:
        return "Unknown compound"
    try:
        if isinstance(raw, float) and np.isnan(raw):
            return "Unknown compound"
    except Exception:
        pass
    s = str(raw).strip()
    return s if s and s.lower() != "nan" else "Unknown compound"


def get_similar_compounds(user_input):
    distances, indices = nn.kneighbors([user_input])
    similar = []
    for dist, idx in zip(distances[0], indices[0]):
        row = compounds_db.iloc[idx]
        similar.append({
            "name": _clean_name(row["compound_name"]),
            "bbb_status": "BBB+" if row["label"] == 1 else "BBB-",
            "similarity": round(1 / (1 + dist), 3),
            "MW": round(row["MW"], 2),
            "LogP": round(row["LogP"], 2),
        })
    # Skip the exact match (distance=0) if any
    similar = [s for s in similar if s["similarity"] < 1.0][:3]
    return similar


@app.route("/search/<query>", methods=["GET"])
def search_compounds(query):
    if not query:
        return jsonify([])
    q = query.lower()
    matches = compounds_db["compound_name"].dropna()
    matches = matches[matches.str.lower().str.startswith(q)].unique()
    return jsonify(sorted(matches.tolist())[:8])


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


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        body = request.json
        question     = body.get("question", "").strip()
        compound     = body.get("compound_name") or "Unknown compound"
        descriptors  = body.get("descriptors", {})
        prediction   = body.get("prediction", "")
        probability  = body.get("probability", 0)
        shap_values  = body.get("shap_values", [])

        if not question:
            return jsonify({"error": "question is required"}), 400

        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return jsonify({"error": "GROQ_API_KEY not set in backend/.env"}), 500

        # Format SHAP values for the prompt
        shap_lines = []
        for s in shap_values:
            sign = "+" if s["impact"] > 0 else ""
            shap_lines.append(
                f"  {s['feature']}={s['value']} (SHAP {sign}{s['impact']:.4f}, {s['direction']})"
            )
        shap_text = "\n".join(shap_lines) if shap_lines else "  (none)"

        desc_text = ", ".join(f"{k}={v}" for k, v in descriptors.items())

        system_prompt = (
            f"You are NeuroShield's AI assistant. You help researchers understand "
            f"BBB permeability predictions. "
            f"Current compound: {compound}, "
            f"BBB prediction: {prediction} ({probability}% probability), "
            f"descriptors: {desc_text}, "
            f"SHAP values (sorted by impact):\n{shap_text}\n"
            f"Answer concisely in 2-3 sentences max. "
            f"Be specific — reference actual numbers from the data."
        )

        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            max_tokens=256,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": question},
            ],
        )
        return jsonify({"response": completion.choices[0].message.content})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
