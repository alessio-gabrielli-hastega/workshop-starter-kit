const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crea il database in questa cartella (Lezione 3).
// Le Lezioni 4 e 5 lo leggeranno da qui.
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Inizializzazione del database (Lezione 3)...");

db.serialize(() => {
    // Ripartiamo sempre da zero: cancelliamo le tabelle se esistono già
    db.run("DROP TABLE IF EXISTS film");
    db.run("DROP TABLE IF EXISTS registi");

    // Tabella dei registi
    db.run("CREATE TABLE registi (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT)");

    // Tabella dei film: regista_id collega ogni film al suo regista
    db.run("CREATE TABLE film (id INTEGER PRIMARY KEY AUTOINCREMENT, titolo TEXT, anno INTEGER, genere TEXT, regista_id INTEGER REFERENCES registi(id))");

    db.run("INSERT INTO registi (nome) VALUES ('Christopher Nolan')");     // id 1
    db.run("INSERT INTO registi (nome) VALUES ('Francis Ford Coppola')");  // id 2
    db.run("INSERT INTO registi (nome) VALUES ('Lana e Lilly Wachowski')"); // id 3

    db.run("INSERT INTO film (titolo, anno, genere, regista_id) VALUES ('Inception', 2010, 'Fantascienza', 1)");
    db.run("INSERT INTO film (titolo, anno, genere, regista_id) VALUES ('Interstellar', 2014, 'Fantascienza', 1)");
    db.run("INSERT INTO film (titolo, anno, genere, regista_id) VALUES ('Il Padrino', 1972, 'Drammatico', 2)");
    db.run("INSERT INTO film (titolo, anno, genere, regista_id) VALUES ('Apocalypse Now', 1979, 'Guerra', 2)");
    db.run("INSERT INTO film (titolo, anno, genere, regista_id) VALUES ('Matrix', 1999, 'Fantascienza', 3)", () => {
        console.log("✅ Database 'database.sqlite' creato con successo nella cartella lezione-3-database!");
    });
});

db.close();
