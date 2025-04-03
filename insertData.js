const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "postgres"
});

const FILES_DIR = path.join(__dirname, "files");
const filePath = path.join(FILES_DIR, "grupo07_docmanifest.json");
const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));

let userCounter = 1; // Contador inicial para generar contraseñas únicas

async function insertData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const doc of jsonData) {
      const docRes = await client.query(
        `INSERT INTO documents (document_type, file, pdf_path, sha256)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (sha256) DO NOTHING RETURNING id`,
        [doc.document_type, doc.file, doc.pdf_path, doc.sha256]
      );

      const documentId = docRes.rows[0]?.id;
      if (!documentId) continue;

      for (const entity of doc.entities) {
        const isPerson = entity.first_name && entity.last_name;
        const entityName = isPerson ? null : entity.name;
        const firstName = isPerson ? entity.first_name : null;
        const lastName = isPerson ? entity.last_name : null;

        let userId = null;
        if (entity.email) {
          const password = `${entity.email.split('@')[0]}_${userCounter++}`; // Generar contraseña única
          const userRes = await client.query(
            `INSERT INTO users (username, password, email)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO NOTHING RETURNING id`,
            [entity.email.split('@')[0] + entity.email.split('@')[1][0], password, entity.email]
          );
          userId = userRes.rows[0]?.id;
        }

        const entityRes = await client.query(
          `INSERT INTO entities (user_id, name, first_name, last_name, email, nationality, address, representative)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (email) DO NOTHING RETURNING id`,
          [userId, entityName, firstName, lastName, entity.email, entity.nationality, entity.address, entity.representative]
        );

        const entityId = entityRes.rows[0]?.id;
        if (!entityId) continue;

        await client.query(
          `INSERT INTO document_entities (document_id, entity_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [documentId, entityId]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Datos insertados correctamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error insertando datos:', error);
  } finally {
    client.release();
  }
}

insertData().then(() => pool.end());
