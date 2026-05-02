# NeuroShield — BBB Crossing Predictor

AI-powered pre-screening system that predicts Blood-Brain Barrier (BBB) permeability before wet-lab testing.

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python train_model.py   # trains model, creates model.pkl
python app.py           # starts Flask API on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## API Endpoints

### POST /predict
```json
{
  "MW": 180.2,
  "LogP": 1.19,
  "HBD": 1,
  "TPSA": 63.6,
  "RingCount": 2,
  "RotBonds": 3
}
```

### GET /pubchem/<compound_name>
Auto-fills descriptors from PubChem. e.g. `/pubchem/aspirin`

## Dataset
B3DB — 7807 molecules, open access: https://github.com/theochem/B3DB
