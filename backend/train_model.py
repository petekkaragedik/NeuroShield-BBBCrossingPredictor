import pandas as pd
import numpy as np
import pickle
from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
from sklearn.neighbors import NearestNeighbors
from B3DB import B3DB_DATA_DICT

FEATURES = ["MW", "LogP", "HBD", "TPSA", "RingCount", "RotBonds"]

def compute_descriptors(smiles):
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return None
        return {
            "MW":        round(Descriptors.MolWt(mol), 3),
            "LogP":      round(Descriptors.MolLogP(mol), 3),
            "HBD":       rdMolDescriptors.CalcNumHBD(mol),
            "TPSA":      round(Descriptors.TPSA(mol), 3),
            "RingCount": rdMolDescriptors.CalcNumRings(mol),
            "RotBonds":  rdMolDescriptors.CalcNumRotatableBonds(mol),
        }
    except:
        return None

def main():
    print("Loading B3DB dataset...")
    df = B3DB_DATA_DICT["B3DB_classification"]
    print(f"Total molecules: {len(df)}")

    print("Computing descriptors...")
    descs = df["SMILES"].apply(compute_descriptors)
    # Replace None with dict of NaNs
    empty = {f: np.nan for f in FEATURES}
    descs = descs.apply(lambda x: x if x is not None else empty)
    desc_df = pd.DataFrame(descs.tolist())
    df = pd.concat([df.reset_index(drop=True), desc_df], axis=1)
    df = df.dropna(subset=FEATURES)
    df["label"] = (df["BBB+/BBB-"] == "BBB+").astype(int)
    print(f"Molecules after cleaning: {len(df)}")

    X = df[FEATURES]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"AUC: {auc:.3f} | Accuracy: {acc:.3f}")

    print("Training nearest neighbors for similar compounds...")
    nn = NearestNeighbors(n_neighbors=4)
    nn.fit(X)

    print("Saving artifacts...")
    with open("model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open("nn.pkl", "wb") as f:
        pickle.dump(nn, f)

    df[["compound_name", "label"] + FEATURES].to_csv("compounds_db.csv", index=False)
    print("Done! model.pkl, nn.pkl, compounds_db.csv saved.")

if __name__ == "__main__":
    main()
