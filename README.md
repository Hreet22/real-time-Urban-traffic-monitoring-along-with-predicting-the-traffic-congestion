# 🚦 Real-Time Urban Traffic Monitoring & Congestion Prediction

A full-stack intelligent traffic monitoring system that collects real-time traffic data and uses a machine learning model to predict urban traffic congestion levels.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [ML Model](#ml-model)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 Overview

This project provides a real-time traffic monitoring dashboard along with a machine learning-based congestion prediction engine. It processes live traffic data, visualizes traffic patterns, and predicts congestion hotspots to help urban planners and commuters make smarter decisions.

---

## ✨ Features

- 🔴 **Real-time traffic monitoring** across multiple urban routes
- 🤖 **ML-powered congestion prediction** using a trained model (`traffic_model.pkl`)
- 📊 **REST API** for traffic data and predictions
- 🗺️ **Route-based traffic analysis** via modular route handlers
- 🧠 **Model training pipeline** included (`train_model.py`)
- ⚡ **Node.js/Express backend** for scalable API serving

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| ML Model | Python, Scikit-learn, Pickle |
| Model Training | Python (`train_model.py`) |
| API Routes | Express Router |
| Data Format | JSON |

---

## 📁 Project Structure

```
traffic/
│
├── server.js                  # Main Express server entry point
├── train_model.py             # Python script to train the ML model
├── traffic_model.pkl          # Pre-trained traffic congestion model
│
├── routes/
│   └── traffic.js             # Traffic API route handlers
│
└── README.md
```

---

## ⚙️ Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Python](https://python.org/) (v3.8+)
- pip

### 1. Clone the repository

```bash
git clone https://github.com/Hreet22/real-time-Urban-traffic-monitoring-along-with-predicting-the-traffic-congestion.git
cd real-time-Urban-traffic-monitoring-along-with-predicting-the-traffic-congestion
```

### 2. Install Node.js dependencies

```bash
npm install
```

### 3. Install Python dependencies

```bash
pip install scikit-learn pandas numpy
```

---

## 🚀 Usage

### Start the server

```bash
node server.js
```

The server will start at `http://localhost:3000` (or your configured port).

### Train the ML model (optional — model already included)

```bash
python train_model.py
```

This will generate/update `traffic_model.pkl`.

---

## 🤖 ML Model

The congestion prediction model (`traffic_model.pkl`) is trained using `train_model.py`.

**How it works:**
1. Takes traffic input features (e.g., time of day, vehicle count, route, speed)
2. Runs inference using the pre-trained Scikit-learn model
3. Returns a congestion level prediction (e.g., Low / Medium / High)

**To retrain:**
```bash
python train_model.py
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/traffic` | Get current traffic data |
| POST | `/api/traffic/predict` | Predict congestion for given input |

### Example Request — Predict Congestion

```http
POST /api/traffic/predict
Content-Type: application/json

{
  "hour": 8,
  "vehicle_count": 320,
  "route": "MG Road",
  "avg_speed": 15
}
```

### Example Response

```json
{
  "route": "MG Road",
  "congestion_level": "High",
  "confidence": 0.87
}
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Hreet Bansal**  
GitHub: [@Hreet22](https://github.com/Hreet22)

---

> ⭐ If you found this project useful, please give it a star on GitHub!
