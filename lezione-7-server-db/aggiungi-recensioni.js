const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Aggiunge al database della Lezione 5 la tabella `recensioni` con qualche dato di esempio.
// E' una piccola "migrazione": modifica lo schema di un database che esiste gia'.
// Lancialo con: npm run aggiungi-recensioni
// E' ripetibile: ogni volta cancella e ricrea la tabella `recensioni` (le altre tabelle non vengono toccate).
// Attenzione: `npm run setup-db` cancella anche `recensioni`, quindi dopo un setup-db rilancia questo script.
const DB_PATH = path.join(__dirname, '..', 'lezione-5-database', 'database.sqlite');

if (!fs.existsSync(DB_PATH)) {
    console.error(`Database non trovato (${DB_PATH}).`);
    console.error('Esegui prima: npm run setup-db');
    process.exit(1);
}

// OPEN_READWRITE: non crea un database vuoto se il file manca
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(`Impossibile aprire il database: ${err.message}`);
        process.exit(1);
    }
});
db.configure('busyTimeout', 3000); // se Database Client ha il file aperto, aspetta invece di fallire subito

let errori = 0;
function esegui(sql, parametri = []) {
    db.run(sql, parametri, (err) => {
        if (err) {
            errori++;
            console.error(`Errore SQL: ${err.message}\n   Query: ${sql.trim().split('\n')[0]}`);
        }
    });
}

const recensioni = [ // [film_id, autore, voto, commento]
    [1, 'Giulia', 5, 'Un film che fa pensare, da rivedere.'],
    [1, 'Marco', 4, 'Bellissimo, un po\' complicato.'],
    [1, 'Sara', 5, 'Colonna sonora spettacolare.'],
    [2, 'Giulia', 4, 'Emozionante.'],
    [3, 'Marco', 5, null],                 // commento NULL di proposito: e' facoltativo
    [3, 'Sara', 5, 'Un classico.'],
    [5, 'Luca', 3, 'Bello il primo, meno i seguiti.'],
    [6, 'Giulia', 5, 'Dialoghi memorabili.']
];

// serialize() fa eseguire le query una dopo l'altra
db.serialize(() => {
    esegui('PRAGMA foreign_keys = ON');
    esegui('DROP TABLE IF EXISTS recensioni');
    esegui(`CREATE TABLE recensioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        film_id INTEGER NOT NULL REFERENCES film(id) ON DELETE CASCADE,   -- cancellando un film spariscono le sue recensioni
        autore TEXT NOT NULL CHECK (length(trim(autore)) > 0),
        voto INTEGER NOT NULL CHECK (voto BETWEEN 1 AND 5),
        commento TEXT,                                                    -- facoltativo
        data_creazione TEXT NOT NULL DEFAULT (date('now')),
        UNIQUE (film_id, autore)                                          -- un autore recensisce un film una sola volta
    )`);
    esegui('CREATE INDEX idx_recensioni_film_id ON recensioni(film_id)');

    recensioni.forEach(r => esegui('INSERT INTO recensioni (film_id, autore, voto, commento) VALUES (?, ?, ?, ?)', r));

    db.get('SELECT COUNT(*) AS righe FROM recensioni', (err, riga) => {
        if (err) { errori++; console.error('Errore nel conteggio:', err.message); return; }
        console.log(`Recensioni inserite: ${riga.righe}`); // attese: 8
    });

    db.close((err) => {
        if (err) { console.error('Errore nella chiusura:', err.message); process.exitCode = 1; return; }
        if (errori > 0) { console.error(`Operazione terminata con ${errori} errori.`); process.exitCode = 1; }
        else console.log('Tabella `recensioni` creata con successo.');
    });
});
