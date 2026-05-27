import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'user_spaces.json');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Helper to read database safely
const readDB = () => {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading DB:', error);
    return [];
  }
};

// Helper to write database safely
const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
    return false;
  }
};

// API: Root status message
app.get('/', (req, res) => {
  res.json({
    message: 'Sensory Shield Backend API is running.',
    endpoints: {
      status: '/status',
      savedPresets: '/api/rooms/saved'
    }
  });
});

// API: Get saved room presets
app.get('/api/rooms/saved', (req, res) => {
  const data = readDB();
  res.json(data);
});

// API: Save a new room preset
app.post('/api/rooms/save', (req, res) => {
  const { spaceName, activeRoomType, visualBlur, noiseCutoff, audioMix } = req.body;
  
  if (!spaceName || !activeRoomType) {
    return res.status(400).json({ error: 'spaceName and activeRoomType are required.' });
  }

  const database = readDB();
  const newPreset = {
    id: Date.now().toString(),
    spaceName,
    activeRoomType,
    visualBlur: visualBlur ?? 0,
    noiseCutoff: noiseCutoff ?? 1000,
    audioMix: audioMix ?? {},
    createdAt: new Date().toISOString()
  };

  database.push(newPreset);
  if (writeDB(database)) {
    res.status(201).json({ success: true, preset: newPreset });
  } else {
    res.status(500).json({ error: 'Failed to save space preset.' });
  }
});

// Default status endpoint
app.get('/status', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`[Sensory Shield Backend] Listening on http://localhost:${PORT}`);
});
