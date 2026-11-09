const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware per gestire le richieste JSON e permettere l'accesso da altri domini (CORS)
app.use(express.json());
app.use(cors());

// Serve i file statici (come l'HTML) dalla cartella 'public'
app.use(express.static('public'));

// Connessione al nostro database locale
const db = new sqlite3.Database('./database.sqlite');

// ==========================================
// LE NOSTRE API (Il "Backend")
// ==========================================

// Rotta per ottenere tutti i film dal database
app.get('/api/film', (req, res) => {
    // Eseguiamo una query SQL per leggere la tabella
    db.all("SELECT * FROM film", [], (err, rows) => {
        if (err) {
            res.status(500).json({ errore: err.message });
            return;
        }
        // Rispondiamo inviando i dati in formato JSON
        res.json(rows);
    });
});

// Avvia il server in ascolto sulla porta 3000
app.listen(PORT, () => {
    console.log(`🚀 Server in esecuzione! Apri il browser su: http://localhost:${PORT}`);
    console.log(`🔍 Per testare l'API JSON vai su: http://localhost:${PORT}/api/film`);
});
