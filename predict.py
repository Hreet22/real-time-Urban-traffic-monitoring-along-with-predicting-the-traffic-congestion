import sys, json, pickle
import pandas as pd

def predict(input_json):
    data = json.loads(input_json)
    with open("traffic_model.pkl", "rb") as f:
        payload = pickle.load(f)
    model      = payload["model"]
    le_road    = payload["le_road"]
    le_weather = payload["le_weather"]
    features   = payload["features"]
    data["road_type"]         = le_road.transform([data["road_type"]])[0]
    data["weather_condition"] = le_weather.transform([data["weather_condition"]])[0]
    df   = pd.DataFrame([data])[features]
    pred = model.predict(df)[0]
    label_map = {0: "Low", 1: "Medium", 2: "High"}
    print(json.dumps({"class": int(pred), "label": label_map[pred]}))

if __name__ == "__main__":
    # Read from stdin instead of sys.argv — avoids all Windows quoting issues
    input_json = sys.stdin.read().strip()
    predict(input_json)