const fs = require('fs');

let code = fs.readFileSync('src/pages/api/segnalazioni.ts', 'utf8');

// remove sqlite imports
code = code.replace(/import sqlite3 from "sqlite3";\n/g, '');
code = code.replace(/import { open } from "sqlite";\n/g, '');

// remove getSqliteDb
code = code.replace(/\/\/ Gestiamo SQLite come fallback[\s\S]*?return sqliteDb;\n}\n/m, '');

// update getActiveComuneKeyServer
code = code.replace(/async function getActiveComuneKeyServer\(dbSq: any\): Promise<string> \{([\s\S]*?)\}/, `async function getActiveComuneKeyServer(): Promise<string> {
  let key = "naro";
  try {
    if (getIsMysqlHealthy() && pool) {
      const [rows]: any = await pool.query("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
      if (rows && rows[0]) {
        key = rows[0].value_data;
      }
    }
  } catch (err) {
    console.error("Errore lettura activeComune:", err);
  }
  return key;
}`);

// general DB usage strip
code = code.replace(/const dbSq = await getSqliteDb\(\);\n/g, '');
code = code.replace(/getActiveComuneKeyServer\(dbSq\)/g, 'getActiveComuneKeyServer()');

code = code.replace(/let usedSqlite = true;\n/g, '');
code = code.replace(/usedSqlite = false;\n/g, '');
code = code.replace(/if \(usedSqlite\) \{([\s\S]*?)\n    \}\n/m, '');

code = code.replace(/let countSuccess = false;\n/g, '');
code = code.replace(/countSuccess = true;\n/g, '');
code = code.replace(/if \(!countSuccess\) \{[\s\S]*?\}\n/g, '');

code = code.replace(/let insertSuccess = false;\n/g, '');
code = code.replace(/insertSuccess = true;\n/g, '');
code = code.replace(/if \(!insertSuccess\) \{[\s\S]*?sqlId = insertResult\.lastID;\n    \}\n/m, '');

code = code.replace(/let updateSuccess = false;\n/g, '');
code = code.replace(/updateSuccess = true;\n/g, '');
code = code.replace(/if \(!updateSuccess\) \{[\s\S]*?\}\n/m, '');

code = code.replace(/let logSuccess = false;\n/g, '');
code = code.replace(/logSuccess = true;\n/g, '');
code = code.replace(/if \(!logSuccess\) \{[\s\S]*?\}\n\s*\}\n/m, '');

code = code.replace(/let sqlLookupSuccess = false;\n/g, '');
code = code.replace(/sqlLookupSuccess = true;\n/g, '');
code = code.replace(/if \(!sqlLookupSuccess\) \{[\s\S]*?\}\n\s*\}\n/m, '');

fs.writeFileSync('src/pages/api/segnalazioni.ts', code);
