# Database Migrations

Dette er migrasjonsskript for 4H Event Hub databasen.

## Struktur

- `init.js` - Initialiserer en ny database fra bunnen av
- `migrate.js` - Kjører alle nødvendige migrasjoner automatisk ved oppstart
- `migrate-*.js` - Individuelle migrasjonsskript

## Bruk

### Initialisere ny database
```bash
npm run init-db
```

### Kjøre migrasjoner
```bash
npm run migrate
```

Migrasjoner kjøres også automatisk ved `npm start`.

### Lage ny migrasjon

1. Opprett en ny fil: `migrate-add-<feature-name>.js`
2. Bruk følgende mal:

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: <Description>...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Din migrasjonslogikk her

db.serialize(() => {
    db.run(`
        -- SQL her
    `, (err) => {
        if (err) {
            console.error('❌ Migration failed:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Migration complete');
        db.close();
    });
});
```

## Viktig

- Database-filene ligger i `/data/` mappen (IKKE her)
- Denne mappen inneholder KUN migrasjonsskript
- Migrasjonsskript committes til git
- Database-filer committes IKKE til git
