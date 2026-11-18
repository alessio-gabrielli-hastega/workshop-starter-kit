# Quaderno degli Esercizi - Workshop Software

Benvenuti! Questo workspace vi accompagnerà per tutte le 9 lezioni del corso: 9 lezioni da 2 ore, raggruppate in giornate da 4 ore.

## Cosa installare

1. **Node.js** (versione **LTS**): https://nodejs.org/it/download
2. **Visual Studio Code**: https://code.visualstudio.com/download

## Setup Iniziale (Lezione 1)
1. Apri questa cartella in VS Code (File > Apri cartella).
2. Quando VS Code propone le **estensioni consigliate**, clicca **Installa**.
3. Apri il terminale (Terminale > Nuovo Terminale).
4. Esegui: `npm install`

### Estensioni consigliate
Se il popup non compare, cercale a mano nel pannello Estensioni (`Ctrl+Shift+X`):

| Nome | ID |
|---|---|
| REST Client | `humao.rest-client` |
| Database Client | `cweijan.vscode-database-client2` |
| Cline | `saoudrizwan.claude-dev` |
| Italian Language Pack for Visual Studio Code (facoltativa) | `MS-CEINTL.vscode-language-pack-it` |

## Programma per giornata

| Giornata | Lezioni | Tema |
|---|---|---|
| 1 | 1-2 | Frontend, JSON |
| 2 | 3-4 | HTTP e server |
| 3 | 5-6 | Database |
| 4 | 7-8 | Integrazione e fullstack |
| 5 (2 ore) | 9 | Sviluppo con l'AI e progetto |

## Le cartelle

| Cartella | Lezione |
|---|---|
| `lezione-1-frontend/` | 1 - HTML, CSS e il primo JavaScript |
| `lezione-2-rete-dati/` | 2 - JSON e dati |
| `lezione-3-http-rest/` | 3 - HTTP e REST |
| `lezione-4-server/` | 4 - Il server con Express e le API |
| `lezione-5-database/` | 5 - SQL e database |
| `lezione-6-database-relazioni/` | 6 - Relazioni, JOIN e integrità dei dati |
| `lezione-7-server-db/` | 7 - Il server collegato al database |
| `lezione-8-fullstack/` | 8 - Frontend e backend insieme |
| `lezione-9-ai-progetto/` | 9 - Sviluppo con l'AI e progetto finale |

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run setup-db` | Crea (o ricrea da zero) il database usato dalle Lezioni 5-9 |
| `npm run aggiungi-recensioni` | Aggiunge la tabella `recensioni` con qualche dato (Lezione 7) |
| `npm run start-l4` | Avvia il server della Lezione 4 (dati in memoria) |
| `npm run start-l7` | Avvia il server della Lezione 7 (con database) |
| `npm run start-app` | Avvia il server della Lezione 8 con la tua interfaccia (`public/index.html`) |
| `npm run start-l9` | Avvia l'applicazione di partenza del progetto della Lezione 9 |

Note:
- Il database si crea con `setup-db` e si rigenera da zero ogni volta. Dopo un `setup-db`, se sei oltre la Lezione 7, rilancia `aggiungi-recensioni`.
- Tutti i server usano la porta 3000: avviane **uno solo alla volta**.
- Per fermare un server: `Ctrl+C` nel terminale.

## Problemi comuni

- **Porta 3000 occupata:** ferma l'altro server con `Ctrl+C` e riprova.
- **«Impossibile aprire il database»:** esegui `npm run setup-db`.
- **«database is locked»:** disconnetti il database da Database Client e riprova.
- **`no such table: recensioni`:** esegui `npm run aggiungi-recensioni`.

---
Segui le indicazioni del docente per sapere quale file aprire e cosa scrivere!
