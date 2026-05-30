import pickle
import pandas as pd

def predict_congestion(hour, road_type, traffic_volume, avg_speed, weather, accident):
    with open("traffic_model.pkl", "rb") as f:
        payload = pickle.load(f)

    model     = payload["model"]
    le_road   = payload["le_road"]
    le_weather = payload["le_weather"]
    features  = payload["features"]

    # Encode categoricals using saved encoders
    road_encoded    = le_road.transform([road_type])[0]
    weather_encoded = le_weather.transform([weather])[0]

    # Build input in the correct feature order
    input_df = pd.DataFrame([{
        "hour_of_day":        hour,
        "road_type":          road_encoded,
        "traffic_volume":     traffic_volume,
        "average_speed_kmph": avg_speed,
        "weather_condition":  weather_encoded,
        "accident_reported":  accident
    }])[features]  # Reorder columns to match training

    prediction = model.predict(input_df)[0]
    label_map = {0: "Low", 1: "Medium", 2: "High"}
    return label_map[prediction]


# Test with varied inputs — should give different results
print(predict_congestion(8,  "Highway",     1400, 15, "Rain",  1))  # Expect High
print(predict_congestion(3,  "Residential",  60, 90, "Clear", 0))   # Expect Low
print(predict_congestion(17, "Main Road",   800, 40, "Cloudy", 0))  # Expect Medium