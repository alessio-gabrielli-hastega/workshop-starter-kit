const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve l'interfaccia grafica della cartella "public" (Lezione 5)
app.use(express.static(path.join(__dirname, 'public')));

// Si collega al database creato nella Lezione 3
const db = new sqlite3.Database(path.join(__dirname, '../lezione-3-database/database.sqlite'));

// === LEZIONE 4: LA NOSTRA API (già completa) ===
app.get('/api/film', (req, res) => {
    db.all("SELECT * FROM film", [], (err, rows) => {
        if (err) {
            res.status(500).json({ errore: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server in ascolto su http://localhost:${PORT}`);
});
