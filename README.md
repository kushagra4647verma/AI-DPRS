# AI-Based Disaster Prediction and Response System (AI-DPRS)

A multi-module AI platform for predicting natural disasters (earthquakes, floods, cyclones), detecting victims in post-disaster imagery, and providing real-time alerts from global monitoring agencies.

## Project Structure

```
major-project/
├── AI-Based Disaster Prediction and Response System/   # Application
│   ├── backend/                                        # Flask API (port 5001)
│   │   ├── app.py                                     # Main server
│   │   ├── detect.py                                  # YOLO11 CLI
│   │   ├── requirements.txt                           # Python dependencies
│   │   ├── earthquake.pkl                             # Trained earthquake model
│   │   ├── flood.pkl                                  # Trained flood model
│   │   ├── hurricane.pkl                              # Trained cyclone model
│   │   ├── seismic_cells.csv                          # Spatial grid lookup
│   │   ├── yolo11s.pt                                 # YOLO11 weights
│   │   ├── templates/                                 # HTML pages
│   │   ├── static/                                    # Uploads & results
│   │   └── venv/                                      # Virtual environment
│   ├── client/                                        # React frontend (port 3000)
│   │   ├── src/components/                            # UI components
│   │   ├── src/screens/                               # Pages
│   │   └── package.json
│   └── start.sh                                       # One-command startup
│
├── datasets/                                           # Training data
│   ├── earthquake_global_1990_2023.csv                # USGS 3.2M events
│   ├── cyclone_global_ibtracs.csv                     # NOAA IBTrACS all basins
│   ├── flood_train.csv                                # Kaggle S4E5 1.1M samples
│   ├── flood_test.csv                                 # Flood test set
│   └── flood_sample_submission.csv                    # Flood submission format
│
├── charts/                                             # Generated visualizations
│   ├── model_comparison.png
│   ├── feature_importance.png
│   └── error_distribution.png
│
├── Earthquake_Model_Training.ipynb                    # Training notebook
├── Flood_Model_Training.ipynb                         # Training notebook
├── Cyclone_Model_Training.ipynb                       # Training notebook
├── Model_Comparison.ipynb                             # 6-model accuracy comparison
└── README.md
```

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, Tailwind CSS, Axios |
| Backend | Python 3.12, Flask, Flask-CORS, Gunicorn |
| ML Models | scikit-learn (Random Forest Regressor) |
| Object Detection | YOLO11 (Ultralytics, September 2024) |
| Live Alerts | USGS Earthquake Feed, UN GDACS |
| Geocoding | OpenStreetMap Nominatim |
| Chatbot | Botpress Cloud |

## Models & Performance

| Model | Dataset | Samples | R² Score | MAE |
|-------|---------|:---:|:---:|:---:|
| Earthquake | USGS Global Catalog (1990–2023) | 3.2M | 0.84 | 0.40 |
| Flood | Kaggle Playground S4E5 | 1.1M | 0.58 | 0.027 |
| Cyclone | NOAA IBTrACS (all basins, 1980–present) | 271K | 0.84 | 7.9 knots |

## Quick Start

```bash
cd "AI-Based Disaster Prediction and Response System"
./start.sh
```

**First-time setup:**
```bash
cd "AI-Based Disaster Prediction and Response System/backend"
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd ../client
npm install
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/earth` | POST | Predict earthquake magnitude + risk level |
| `/flood` | POST | Predict flood probability from 20 factors |
| `/hurri` | POST | Predict cyclone max wind speed |
| `/alerts` | POST | Check live disasters near a location |
| `/detect` | POST | YOLO11 object detection on image/video |
| `/test` | GET | Model comparison test page |

## Live Data Sources

- **USGS** — Real-time earthquake feed (last 24h, M4.5+)
- **GDACS** — Global disaster alerts (last 7 days, earthquakes/floods/cyclones)
- **Nominatim** — Geocoding (city name → coordinates)
