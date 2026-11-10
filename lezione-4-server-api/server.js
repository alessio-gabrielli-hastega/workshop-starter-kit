const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Si collega al database creato nella Lezione 3
const db = new sqlite3.Database(path.join(__dirname, '../lezione-3-database/database.sqlite'));

// === LEZIONE 4: LA NOSTRA API ===
// TODO: scrivi qui la rotta GET /api/film


app.listen(PORT, () => {
    console.log(`🚀 Server in ascolto su http://localhost:${PORT}`);
});
