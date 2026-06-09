const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// 1. Remove imports
code = code.replace(/import sqlite3 from "sqlite3";\n/g, '');
code = code.replace(/import { open } from "sqlite";\n/g, '');

// 2. Remove sqliteDb variable and local file init
code = code.replace(/let sqliteDb: any = null;\n/g, '');
const sqliteInitRegex = /  \/\/ Always initialize SQLite database first[\s\S]*?await sqliteDb.exec\(`[\s\S]*?`\);\n/m;
code = code.replace(sqliteInitRegex, '');

// 3. Remove migrateMunicipalitiesSchema sqliteDb parameter and block
code = code.replace(/async function migrateMunicipalitiesSchema\(sqliteDb: any, mysqlPool: any\) {/g, 'async function migrateMunicipalitiesSchema() {');
code = code.replace(/if \(sqliteDb\) {[\s\S]*?}\n\n    if \(mysqlPool && getIsMysqlHealthy\(\)\)/g, 'if (mysqlPool && getIsMysqlHealthy())');
code = code.replace(/typeSqlite: "[a-zA-Z0-9_()]+", /g, '');
code = code.replace(/await migrateMunicipalitiesSchema\(sqliteDb, mysqlPool\);/g, 'await migrateMunicipalitiesSchema();');

// 4. Clean up seedDatabaseReferenceAndPresets
// Remove `if (sqliteDb) { ... }` block inside seedDatabaseReferenceAndPresets
const seedSqliteRegex = /    \/\/ Seeding SQLite Reference Values[\s\S]*?    \/\/ Seeding MySQL Reference/m;
code = code.replace(seedSqliteRegex, '    // Seeding MySQL Reference');

// 5. Clean up getActiveComuneKeyServer
code = code.replace(/async function getActiveComuneKeyServer\(dbSq: any\): Promise<string> {/g, 'async function getActiveComuneKeyServer(): Promise<string> {');
code = code.replace(/if \(getIsMysqlHealthy\(\) && mysqlPool\) {([\s\S]*?)} else {[\s\S]*?}/m, 'if (getIsMysqlHealthy() && mysqlPool) {$1}');

// 6. Fix admin_users insert
code = code.replace(/  if \(sqliteDb\) {[\s\S]*?try {[\s\S]*?const row = await sqliteDb\.get[\s\S]*?} catch\(e\) {}\n  }\n/m, '');

// 7. Remove all occurrences of "} else if (sqliteDb) { ... }" logic chunks
code = code.replace(/\} else if \(sqliteDb\) \{([\s\S]*?(\n\s*\})\s*)+/g, '}');

// Handle remaining stray "if (sqliteDb) { ...}" blocks manually due to potential bracket mismatch bugs
// We'll replace it carefully.
code = code.replace(/if \(sqliteDb\) \{[\s\S]*?\n\s*\}/g, '');

// 8. Replace dbSq argument calls
code = code.replace(/getActiveComuneKeyServer\(sqliteDb\)/g, 'getActiveComuneKeyServer()');

code = code.split('\n').filter(line => !line.includes('if (sqliteDb)') && !line.includes('} else if (sqliteDb)')).join('\n');

fs.writeFileSync('server.ts', code);
