from werkzeug.utils import secure_filename
import os
from flask import Flask, jsonify, request, render_template, send_from_directory
import joblib
import numpy as np
from flask_cors import CORS
import pandas as pd
from ultralytics import YOLO
from sklearn.ensemble import RandomForestRegressor


app = Flask(__name__)
CORS(app)

# Load ML models
earth_model = joblib.load('earthquake.pkl')
hurri_model = joblib.load('hurricane.pkl')
flood_model = joblib.load('flood.pkl')
flood_features = joblib.load('flood_features.pkl')
seismic_cells = pd.read_csv('seismic_cells.csv')

# Load YOLO11 model for victim detection
yolo_model = YOLO('yolo11s.pt')


@app.route("/")
def hello_world():
    return render_template('index.html')


@app.route("/detect-page")
def detect_page():
    """Post-Disaster Detection (YOLO) page. Served under its own path so it
    does not collide with the React app that nginx serves at '/'."""
    return render_template('index.html')


@app.route("/download")
def download():
    return render_template('download.html')


@app.route('/static/results/<path:filename>')
def serve_result(filename):
    """Serve detection result files."""
    return send_from_directory(os.path.join('static', 'results'), filename)


@app.route("/detect", methods=['POST'])
def detect():
    """Run YOLO11 object detection on uploaded image or video."""
    if request.method != "POST":
        return "Invalid request method", 400

    file = request.files.get('video') or request.files.get('file')

    if not file:
        return jsonify({"error": "No file provided"}), 400

    filename = secure_filename(file.filename)
    upload_path = os.path.join(os.getcwd(), 'static', 'uploads')
    os.makedirs(upload_path, exist_ok=True)
    file_path = os.path.join(upload_path, filename)
    file.save(file_path)

    # Run YOLO11 inference with absolute paths
    output_dir = os.path.join(os.getcwd(), 'static', 'results')
    os.makedirs(output_dir, exist_ok=True)

    results = yolo_model.predict(
        source=file_path,
        save=True,
        project=output_dir,
        name='.',
        exist_ok=True,
        imgsz=320,
    )

    # YOLO saves all images as .jpg regardless of input format
    name_without_ext = os.path.splitext(filename)[0]
    # Check for original extension first, then .jpg
    output_file = os.path.join(output_dir, filename)
    output_filename = filename
    if not os.path.exists(output_file):
        output_file = os.path.join(output_dir, name_without_ext + '.jpg')
        output_filename = name_without_ext + '.jpg'

    if os.path.exists(output_file):
        total_detections = sum(len(r.boxes) for r in results)
        return jsonify({
            "output_path": f"/static/results/{output_filename}",
            "detections": total_detections,
            "filename": output_filename
        })
    else:
        print(f"Expected output at: {output_file}")
        print(f"Results dir contents: {os.listdir(output_dir)}")
        return jsonify({"error": "Detection completed but output file not found"}), 500


def earth_predicted_magnitude(latitude, longitude, depth, year, month, day, hour):
    feature_cols = ['latitude', 'longitude', 'depth', 'year', 'month', 'day', 'hour']
    user_input = pd.DataFrame(
        [[latitude, longitude, depth, year, month, day, hour]],
        columns=feature_cols
    )
    prediction = earth_model.predict(user_input)
    magnitude = round(prediction[0], 2)

    # Look up historical seismic data for this location
    # Search within a 2-degree radius to capture nearby seismic zones
    lat_cell = round(latitude * 2) / 2
    lon_cell = round(longitude * 2) / 2

    nearby = seismic_cells[
        (seismic_cells['lat_cell'] >= latitude - 2) &
        (seismic_cells['lat_cell'] <= latitude + 2) &
        (seismic_cells['lon_cell'] >= longitude - 2) &
        (seismic_cells['lon_cell'] <= longitude + 2)
    ]

    if len(nearby) > 0:
        hist_max = round(float(nearby['cell_max_mag'].max()), 1)
        event_count = int(nearby['cell_count'].sum())
    else:
        hist_max = 0.0
        event_count = 0

    # Determine risk level based on historical max magnitude
    if hist_max >= 8:
        risk = "Extreme"
    elif hist_max >= 7:
        risk = "Very High"
    elif hist_max >= 6:
        risk = "High"
    elif hist_max >= 5:
        risk = "Moderate"
    elif hist_max >= 4:
        risk = "Low"
    elif event_count > 0:
        risk = "Very Low"
    else:
        risk = "Negligible"

    return magnitude, hist_max, event_count, risk


def predict_max_wind(latitude, longitude, moderate_wind_ne, moderate_wind_se,
                     moderate_wind_sw, moderate_wind_nw, year, month, day):
    feature_cols = ['LAT', 'LON', 'USA_R50_NE', 'USA_R50_SE', 'USA_R50_SW', 'USA_R50_NW', 'year', 'month', 'day']
    input_data = pd.DataFrame(
        [[latitude, longitude, moderate_wind_ne, moderate_wind_se,
          moderate_wind_sw, moderate_wind_nw, year, month, day]],
        columns=feature_cols
    )
    prediction = hurri_model.predict(input_data)
    return round(float(prediction[0]), 1)


def flood_predict(factors):
    """Predict flood probability from environmental/infrastructure factors."""
    input_data = pd.DataFrame([factors], columns=flood_features)
    prediction = flood_model.predict(input_data)[0]
    probability = round(float(prediction), 4)

    # Classify risk
    if probability >= 0.6:
        risk = "High"
    elif probability >= 0.5:
        risk = "Moderate"
    elif probability >= 0.4:
        risk = "Low"
    else:
        risk = "Very Low"

    return probability, risk


@app.route('/flood', methods=['POST'])
def flood():
    data = request.get_json()
    # Extract all 20 features
    factors = {feat: data.get(feat, 5) for feat in flood_features}
    probability, risk = flood_predict(factors)
    return jsonify({
        "flood_probability": probability,
        "risk_level": risk
    })


@app.route('/hurri', methods=['POST'])
def hurri():
    """Hurricane/Cyclone maximum wind prediction."""
    data = request.get_json()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    moderate_wind_ne = data.get('moderate_wind_ne')
    moderate_wind_se = data.get('moderate_wind_se')
    moderate_wind_sw = data.get('moderate_wind_sw')
    moderate_wind_nw = data.get('moderate_wind_nw')
    year = data.get('year')
    month = data.get('month')
    day = data.get('day')
    print(data)
    predicted_max_wind1 = predict_max_wind(latitude, longitude, moderate_wind_ne,
                                           moderate_wind_se, moderate_wind_sw,
                                           moderate_wind_nw, year, month, day)
    print(predicted_max_wind1)
    return jsonify({"predicted_max_wind": predicted_max_wind1})


@app.route('/earth', methods=['POST'])
def earth():
    """Earthquake magnitude prediction."""
    data = request.get_json()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    depth = data.get('depth', 33.0)
    year = data.get('year', 2024)
    month = data.get('month', 1)
    day = data.get('day', 1)
    hour = data.get('hour', 12)
    magnitude, hist_max, event_count, risk = earth_predicted_magnitude(
        latitude, longitude, depth, year, month, day, hour
    )

    # Check for active earthquakes near this location (last 24h)
    active_alert = None
    try:
        usgs_url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"
        usgs_resp = http_requests.get(usgs_url, timeout=5)
        if usgs_resp.status_code == 200:
            earthquakes = usgs_resp.json().get('features', [])
            for eq in earthquakes:
                props = eq['properties']
                coords = eq['geometry']['coordinates']
                dist = haversine_km(latitude, longitude, coords[1], coords[0])
                if dist <= 300 and props['mag'] >= 4.0:
                    active_alert = {
                        "magnitude": props['mag'],
                        "place": props.get('place', ''),
                        "distance_km": round(dist),
                        "time_ago": props.get('time'),
                    }
                    break  # Take the nearest significant one
    except Exception:
        pass

    response = {
        "predicted_magnitude": magnitude,
        "historical_max": hist_max,
        "event_count": event_count,
        "risk_level": risk,
    }
    if active_alert:
        response["active_alert"] = active_alert

    return jsonify(response)


import requests as http_requests


@app.route("/test")
def test_page():
    """Model comparison test page."""
    return render_template('test.html')


@app.route("/run_test", methods=['POST'])
def run_test():
    """Run model comparison on earthquake data sample."""
    from sklearn.ensemble import GradientBoostingRegressor, AdaBoostRegressor
    from sklearn.tree import DecisionTreeRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.neighbors import KNeighborsRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
    import time

    # Use the earthquake training data (already loaded as seismic_cells gives us the path)
    try:
        csv_path = None
        for p in ['/Users/kushagraverma/Desktop/major-project/datasets/earthquake_global_1990_2023.csv',
                  '/Users/kushagraverma/Downloads/Eartquakes-1990-2023.csv',
                  os.path.join(os.getcwd(), 'earthquake_data.csv')]:
            if os.path.exists(p):
                csv_path = p
                break

        if not csv_path:
            return jsonify({"error": "Earthquake dataset not found"}), 500

        data = pd.read_csv(csv_path, low_memory=False)
        data = data[data['data_type'] == 'earthquake'].copy()
        data = data[data['magnitudo'] > 0].copy()
        data['datetime'] = pd.to_datetime(data['date'], format='mixed', errors='coerce', utc=True)
        data['year'] = data['datetime'].dt.year
        data['month'] = data['datetime'].dt.month
        data['day'] = data['datetime'].dt.day
        data['hour'] = data['datetime'].dt.hour

        feature_cols = ['latitude', 'longitude', 'depth', 'year', 'month', 'day', 'hour']
        data_clean = data[feature_cols + ['magnitudo']].dropna()
        sample = data_clean.sample(n=50000, random_state=42)

        X = sample[feature_cols]
        y = sample['magnitudo']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        models = [
            ("Linear Regression", LinearRegression()),
            ("Decision Tree", DecisionTreeRegressor(max_depth=20, random_state=42)),
            ("KNN (k=10)", KNeighborsRegressor(n_neighbors=10, n_jobs=-1)),
            ("AdaBoost", AdaBoostRegressor(n_estimators=100, random_state=42)),
            ("Gradient Boosting", GradientBoostingRegressor(n_estimators=100, max_depth=6, random_state=42)),
            ("Random Forest", RandomForestRegressor(n_estimators=200, max_depth=25, min_samples_split=10, min_samples_leaf=5, max_features='sqrt', random_state=42, n_jobs=-1)),
        ]

        results = []
        for name, model in models:
            start = time.time()
            model.fit(X_train, y_train)
            elapsed = round(time.time() - start, 2)
            y_pred = model.predict(X_test)
            r2 = round(r2_score(y_test, y_pred), 4)
            mae = round(mean_absolute_error(y_test, y_pred), 4)
            rmse = round(np.sqrt(mean_squared_error(y_test, y_pred)), 4)
            results.append({
                "model": name,
                "r2": r2,
                "mae": mae,
                "rmse": rmse,
                "time": elapsed,
                "is_best": False
            })

        # Mark the best
        best_idx = max(range(len(results)), key=lambda i: results[i]['r2'])
        results[best_idx]['is_best'] = True

        return jsonify({
            "results": results,
            "dataset": "USGS Earthquake Catalog (1990-2023)",
            "samples": 50000,
            "train_size": len(X_train),
            "test_size": len(X_test),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/alerts', methods=['POST'])
def alerts():
    """Check real-time disaster feeds for active alerts near a location."""
    data = request.get_json()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    radius_km = data.get('radius', 300)  # default 300km radius

    active_alerts = []

    # 1. Check USGS Earthquake Feed (last 24 hours, magnitude 4.0+)
    try:
        usgs_url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson"
        usgs_resp = http_requests.get(usgs_url, timeout=10)
        if usgs_resp.status_code == 200:
            earthquakes = usgs_resp.json().get('features', [])
            for eq in earthquakes:
                props = eq['properties']
                coords = eq['geometry']['coordinates']
                eq_lon, eq_lat, eq_depth = coords[0], coords[1], coords[2]

                dist = haversine_km(latitude, longitude, eq_lat, eq_lon)

                if dist <= radius_km:
                    active_alerts.append({
                        "type": "earthquake",
                        "severity": "critical" if props['mag'] >= 6 else "warning",
                        "title": f"M{props['mag']:.1f} Earthquake",
                        "description": props.get('place', 'Unknown location'),
                        "magnitude": props['mag'],
                        "distance_km": round(dist),
                        "time": props.get('time'),
                        "url": props.get('url', ''),
                    })
    except Exception as e:
        print(f"USGS feed error: {e}")

    # 2. Check GDACS (Global Disaster Alerts) RSS — earthquakes, floods, cyclones
    try:
        gdacs_url = "https://www.gdacs.org/xml/rss_7d.xml"
        gdacs_resp = http_requests.get(gdacs_url, timeout=10)
        if gdacs_resp.status_code == 200:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(gdacs_resp.text)

            for item in root.findall('.//item'):
                title = item.findtext('title', '')
                desc = item.findtext('description', '')
                link = item.findtext('link', '')

                # Extract coordinates - try multiple namespace formats
                geo_lat = item.findtext('{http://www.w3.org/2003/01/geo/wgs84_pos#}lat')
                geo_lon = item.findtext('{http://www.w3.org/2003/01/geo/wgs84_pos#}long')

                if not geo_lat or not geo_lon:
                    georss_point = item.findtext('{http://www.georss.org/georss}point')
                    if georss_point:
                        parts = georss_point.strip().split()
                        if len(parts) == 2:
                            geo_lat, geo_lon = parts[0], parts[1]

                if geo_lat and geo_lon:
                    try:
                        event_lat = float(geo_lat)
                        event_lon = float(geo_lon)
                        dist = haversine_km(latitude, longitude, event_lat, event_lon)

                        # Use tighter radius for floods (50km), normal radius for others
                        is_flood_event = 'flood' in title.lower()
                        effective_radius = 200 if is_flood_event else radius_km

                        if dist <= effective_radius:
                            event_type = "cyclone" if any(w in title.lower() for w in ['cyclone', 'hurricane', 'typhoon', 'storm']) else \
                                         "flood" if 'flood' in title.lower() else \
                                         "earthquake" if 'earthquake' in title.lower() else "disaster"
                            severity = "critical" if any(w in title.lower() for w in ['red', 'orange']) else "warning"

                            # Extract useful info from description
                            alert_desc = desc[:200] if desc else title

                            active_alerts.append({
                                "type": event_type,
                                "severity": severity,
                                "title": title[:120],
                                "description": alert_desc,
                                "distance_km": round(dist),
                                "url": link,
                            })
                    except (ValueError, TypeError):
                        pass
                else:
                    # No coordinates — match by country/region name in title
                    # Get the location name from Nominatim reverse lookup (we already have lat/lon)
                    # Simple text match: check if the queried region appears in the event
                    pass
    except Exception as e:
        print(f"GDACS feed error: {e}")

    # 3. Country-level flood/cyclone alerts disabled — coordinate-based only (50km for floods)
    # Country-name matching was too broad (showed all-India alerts for any Indian city)

    # Sort by severity (critical first) then distance
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    active_alerts.sort(key=lambda x: (severity_order.get(x['severity'], 3), x.get('distance_km', 9999)))

    return jsonify({
        "alerts": active_alerts[:10],  # Max 10 alerts
        "total": len(active_alerts),
        "radius_km": radius_km,
    })


def get_country_approx_coords(country_name):
    """Return approximate center coordinates for common disaster-prone countries."""
    coords = {
        'India': (22.0, 78.0), 'Bangladesh': (23.7, 90.4), 'Nepal': (28.2, 84.3),
        'Pakistan': (30.4, 69.3), 'Sri Lanka': (7.9, 80.8), 'Myanmar': (19.8, 96.0),
        'Indonesia': (-2.5, 118.0), 'Philippines': (12.9, 122.0), 'Japan': (36.2, 138.3),
        'China': (35.0, 105.0), 'Vietnam': (14.0, 108.0), 'Thailand': (15.9, 100.9),
        'Malaysia': (4.2, 101.9), 'Cambodia': (12.6, 105.0), 'Afghanistan': (33.9, 67.7),
        'Iran': (32.4, 53.7), 'Turkey': (39.0, 35.2), 'Haiti': (19.0, -72.4),
        'United States of America': (39.8, -98.6), 'Mexico': (23.6, -102.6),
        'Brazil': (-14.2, -51.9), 'Colombia': (4.6, -74.3), 'Peru': (-9.2, -75.0),
        'Chile': (-35.7, -71.5), 'Ecuador': (-1.8, -78.2),
        'Nigeria': (9.1, 8.7), 'Kenya': (-0.02, 37.9), 'Ethiopia': (9.1, 40.5),
        'Mozambique': (-18.7, 35.5), 'Somalia': (5.2, 46.2), 'Sudan': (12.9, 30.2),
        'South Sudan': (6.9, 31.3), 'Democratic Republic of the Congo': (-4.0, 21.8),
        'Madagascar': (-18.8, 46.9), 'Tanzania': (-6.4, 34.9),
        'Australia': (-25.3, 133.8), 'New Zealand': (-40.9, 174.9),
        'Italy': (41.9, 12.6), 'Greece': (39.1, 21.8), 'Spain': (40.5, -3.7),
        'Germany': (51.2, 10.5), 'France': (46.2, 2.2),
    }
    for name, coord in coords.items():
        if name.lower() in country_name.lower() or country_name.lower() in name.lower():
            return coord
    return None


def haversine_km(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km."""
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


if __name__ == '__main__':
    app.run(port=5001, debug=False)
