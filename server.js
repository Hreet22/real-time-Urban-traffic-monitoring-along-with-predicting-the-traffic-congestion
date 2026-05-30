const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// --- STEP 1: INITIALIZE THE BASE POOL ---
// Connecting without forcing a database name stops startup connection timeouts
const pool = mysql.createPool({
    host: '127.0.0.1',      
    port: 3306,             // Changed to 3307 if your XAMPP Control Panel uses 3307
    user: 'root',           
    password: '',           
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 15000   
});

// --- STEP 2: AUTOMATIC DATABASE & TABLE GENERATOR ---
async function initDb() {
    try {
        const connection = await pool.getConnection();
        
        // Build the database shell safely if it was wiped during a reset
        await connection.query("CREATE DATABASE IF NOT EXISTS traffic_db");
        await connection.query("USE traffic_db");
        
        // Create Live Traffic Tracking Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS live_traffic (
                id INT AUTO_INCREMENT PRIMARY KEY,
                location_name VARCHAR(255) NOT NULL,
                latitude DOUBLE NOT NULL,
                longitude DOUBLE NOT NULL,
                traffic_volume INT,
                average_speed_kmph DOUBLE,
                congestion_level INT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Incidents Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS incidents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                location_name VARCHAR(255) NOT NULL,
                incident_type VARCHAR(100) NOT NULL,
                severity VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'Active',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("✅ MySQL Database 'traffic_db' and Tables Verified/Created Successfully!");
        connection.release();
    } catch (err) {
        console.error("❌ Database setup failed: ", err.message);
    }
}

// --- STEP 3: API ENDPOINTS ---

// 1. Post new traffic telemetry updates
app.post('/predict', async (req, res) => {
    const { road_type, weather_condition, accident_reported } = req.body;

    // Fix 1: Generate realistic volume & speed based on current time
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // Fix 2: Show actual time with minutes
    const timeStr = `${String(hour).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;

    // Fix 3: Simulate peak hour traffic realistically
    const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const isNight = hour >= 22 || hour <= 5;

    const traffic_volume     = isPeak ? 1300 : isNight ? 80  : 600;
    const average_speed_kmph = isPeak ? 12   : isNight ? 85  : 45;

    // Fix 4: Map "Urban" → "Main Road" to match training labels
    const roadTypeMap = {
        "Urban":       "Main Road",
        "Highway":     "Highway",
        "Main Road":   "Main Road",
        "Residential": "Residential"
    };
    const mapped_road = roadTypeMap[road_type] || "Main Road";

    // Now call Python with all required features
    const inputPayload = JSON.stringify({
        hour_of_day:          hour,
        road_type:            mapped_road,
        traffic_volume:       traffic_volume,
        average_speed_kmph:   average_speed_kmph,
        weather_condition:    weather_condition,
        accident_reported:    accident_reported === "Yes" ? 1 : 0
    });

    const { spawn } = require('child_process');
    const py = spawn('python', ['predict.py', inputPayload]);

    let result = '';
    py.stdout.on('data', (data) => { result += data.toString(); });
    py.stderr.on('data', (data) => { console.error('Python error:', data.toString()); });

    py.on('close', (code) => {
        try {
            const parsed = JSON.parse(result.trim());
            res.json({
    success: true,
    label: parsed.label,           // ← frontend reads data.label
    predicted_class: parsed.class, // ← frontend reads data.predicted_class
    road_type: road_type,
    time: timeStr
});
        } catch (e) {
            res.status(500).json({ success: false, error: 'Model parsing failed' });
        }
    });
});

// 2. Fetch the latest live records per location for dashboard mapping
app.get('/api/traffic/live', async (req, res) => {
    try {
        await pool.query("USE traffic_db");
        const query = `
            SELECT t.* FROM live_traffic t
            INNER JOIN (
                SELECT location_name, MAX(timestamp) as max_t
                FROM live_traffic GROUP BY location_name
            ) tm ON t.location_name = tm.location_name AND t.timestamp = tm.max_t
        `;
        const [rows] = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 3. Post and Fetch active traffic incidents
app.route('/api/incidents')
    .post(async (req, res) => {
        const { location_name, incident_type, severity } = req.body;
        try {
            await pool.query("USE traffic_db");
            await pool.query(`INSERT INTO incidents (location_name, incident_type, severity) VALUES (?, ?, ?)`, [location_name, incident_type, severity]);
            res.status(201).json({ status: "success", message: "Active Incident Reported" });
        } catch (err) { 
            res.status(500).json({ error: err.message }); 
        }
    })
    .get(async (req, res) => {
        try {
            await pool.query("USE traffic_db");
            const [rows] = await pool.query(`SELECT * FROM incidents WHERE status = 'Active' ORDER BY timestamp DESC`);
            res.status(200).json(rows);
        } catch (err) { 
            res.status(500).json({ error: err.message }); 
        }
    });

// 4. Retrieve total metric calculations for Admin Panel counters
app.get('/api/admin/analytics', async (req, res) => {
    try {
        await pool.query("USE traffic_db");
        const [totals] = await pool.query(`SELECT COUNT(*) as total_records, AVG(average_speed_kmph) as avg_speed, AVG(traffic_volume) as avg_volume FROM live_traffic`);
        const [incidents] = await pool.query(`SELECT COUNT(*) as active_incidents FROM incidents WHERE status = 'Active'`);
        res.status(200).json({
            system_total_records: totals[0].total_records,
            average_system_speed: parseFloat(totals[0].avg_speed || 0).toFixed(2),
            average_traffic_volume: parseFloat(totals[0].avg_volume || 0).toFixed(2),
            total_active_incidents: incidents[0].active_incidents
        });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/predict/congestion', (req, res) => {
    const { road_type, weather_condition, accident_reported } = req.body;

    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const timeStr = `${String(hour).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;

    const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const isNight = hour >= 22 || hour <= 5;
    const traffic_volume     = isPeak ? 1300 : isNight ? 80  : 600;
    const average_speed_kmph = isPeak ? 12   : isNight ? 85  : 45;

    const roadTypeMap = {
        "Urban": "Main Road", "Highway": "Highway",
        "Main Road": "Main Road", "Residential": "Residential"
    };

    const inputPayload = JSON.stringify({
        hour_of_day:         hour,
        road_type:           roadTypeMap[road_type] || "Main Road",
        traffic_volume:      traffic_volume,
        average_speed_kmph:  average_speed_kmph,
        weather_condition:   weather_condition,
        accident_reported:   accident_reported === "Yes" ? 1 : 0
    });

    const pythonProcess = spawn('python', ['predict.py']);
    pythonProcess.stdin.write(inputPayload);
    pythonProcess.stdin.end();

    let dataString = '';
    let errorString = '';
    pythonProcess.stdout.on('data', (data) => { dataString += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorString += data.toString(); });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: "ML Pipeline Failed.", details: errorString.trim() });
        }
        try {
            const parsed = JSON.parse(dataString);
            res.status(200).json({
                success: true,
                label: parsed.label,
                predicted_class: parsed.class,
                road_type: road_type,
                time: timeStr
            });
        } catch (e) {
            res.status(500).json({ error: "Failed to parse ML response.", raw: dataString });
        }
    });
});
   
// --- STEP 4: START SERVER ENVIRONMENT ---
app.listen(PORT, () => {
    initDb();
    console.log(`🚀 Server executing live on port: ${PORT}`);
});
app.use('/api/traffic', require('./routes/traffic'));