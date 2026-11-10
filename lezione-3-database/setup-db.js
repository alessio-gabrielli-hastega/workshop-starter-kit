const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crea il database nella cartella dell'app finale
const dbPath = path.join(__dirname, '../lezione-4-e-5-app-finale/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Inizializzazione del database (Lezione 3)...");

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS film (id INTEGER PRIMARY KEY AUTOINCREMENT, titolo TEXT, anno INTEGER, genere TEXT)");
    db.run("DELETE FROM film");
    
    db.run("INSERT INTO film (titolo, anno, genere) VALUES ('Inception', 2010, 'Fantascienza')");
    db.run("INSERT INTO film (titolo, anno, genere) VALUES ('Il Padrino', 1972, 'Drammatico')");
    db.run("INSERT INTO film (titolo, anno, genere) VALUES ('Matrix', 1999, 'Fantascienza')");
    
    console.log("✅ Database 'database.sqlite' creato con successo nella cartella della Lezione 4 e 5!");
});

db.close();