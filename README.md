# Workshop Starter Kit - Fullstack per Principianti

Questo è il progetto base pronto all'uso per il corso. Contiene tutto il necessario per far toccare con mano l'interazione tra Database, Backend (Node.js/Express) e Frontend (HTML/JS) senza impazzire con configurazioni complesse.

## 🛠️ Come usare questo repository in aula

Sei il docente (o uno studente). Ecco i passi esatti da seguire dopo aver aperto questa cartella in VS Code:

### 1. Aprire il terminale
In VS Code: vai su **Terminale > Nuovo Terminale** in alto.

### 2. Installare le "rotelle" del software (Dipendenze)
Digita questo comando e premi Invio:
```bash
npm install
```
*Questo scaricherà Express (per fare il server web) e SQLite3 (per parlare col database).*

### 3. Creare il Database Iniziale (I Post-it)
Digita:
```bash
npm run setup
```
*Vedrai comparire un file `database.sqlite` a sinistra. Il server ha appena creato la tabella "film" e inserito i dati iniziali.*

### 4. Accendere il Server
Digita:
```bash
npm start
```
*Il terminale dirà "🚀 Server in esecuzione!". Ora il tuo computer è ufficialmente un Server.*

### 5. Aprire il Client (Browser)
Apri il tuo browser (Chrome/Edge) e vai all'indirizzo:
[http://localhost:3000](http://localhost:3000)

Clicca sul pulsante e guarda i dati viaggiare dal Database -> Server -> Rete -> HTML!

## 🧩 Esercizi suggeriti in classe:
1. Aprire Thunder Client e testare l'API chiamando `GET http://localhost:3000/api/film`.
2. Aprire `server.js` e provare a cambiare la rotta (es. da `/api/film` a `/api/catalogo`).
3. Modificare i colori in `index.html`.
