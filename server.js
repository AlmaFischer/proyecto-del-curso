const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Importar express-session y session-file-store
const session = require("express-session");
const FileStore = require("session-file-store")(session);

const app = express();
app.use(express.json());

// Configurar el motor de vistas EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Configurar Multer para manejar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Configurar el almacenamiento de sesiones en el sistema de archivos
const sessionsDir = path.join(__dirname, "sessions");
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

app.use(session({
  store: new FileStore({ path: sessionsDir }),
  secret: process.env.SESSIONS_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
}));




// Directorio local para almacenar archivos
const FILES_DIR = path.join(__dirname, "files");
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "postgres"
});

/**
 * Middleware para verificar si el usuario está autenticado
 * 
 */
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

/**
 * Endpoint para subir archivos al servidor local.
 */
app.post("/upload", upload.single("file"), isAuthenticated, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const userId = req.session.userId;
  const fileName = path.parse(req.file.originalname).name;
  
  try {
    const dbResult = await pool.query(
      `SELECT d.id FROM documents d
       JOIN document_entities de ON d.id = de.document_id
       JOIN entities e ON de.entity_id = e.id
       WHERE e.user_id = $1 AND d.file = $2`,
      [userId, fileName]
    );
    
    if (dbResult.rows.length === 0) {
      return res.status(403).json({ error: "You do not have permission to upload this file." });
    }
    
    const filePath = path.join(FILES_DIR, req.file.originalname);
    fs.writeFile(filePath, req.file.buffer, async (err) => {
      if (err) return res.status(500).json({ error: "Error saving file", details: err.message });
      res.json({ success: true, file: req.file.originalname });
    });
  } catch (error) {
    res.status(500).json({ error: "Error uploading file", details: error.message });
  }
});

/**
 * Endpoint para descargar archivos, solo si pertenecen al usuario autenticado.
 */
app.get("/download/:filename", isAuthenticated, async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.session.userId;

    // Extraer el nombre base sin extensión
    const baseName = path.parse(filename).name;

    const dbResult = await pool.query(
      `SELECT d.file FROM documents d
       JOIN document_entities de ON d.id = de.document_id
       JOIN entities e ON de.entity_id = e.id
       WHERE e.user_id = $1 AND d.file = $2`,
      [userId, baseName]
    );

    if (dbResult.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    const filePath = path.join(FILES_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: "Error downloading file", details: error.message });
  }
});

/**
 * Endpoint para listar archivos del usuario autenticado.
 */
app.get("/files", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const dbResult = await pool.query(
      `SELECT d.file FROM documents d
       JOIN document_entities de ON d.id = de.document_id
       JOIN entities e ON de.entity_id = e.id
       WHERE e.user_id = $1`,
      [userId]
    );

    const availableFiles = [];

    for (const row of dbResult.rows) {
      const baseName = row.file;
      
      const mdFile = `${baseName}.md`;
      if (fs.existsSync(path.join(FILES_DIR, mdFile))) {
        availableFiles.push(mdFile);
      }
      

      const pdfFile = `${baseName}.pdf`;
      if (fs.existsSync(path.join(FILES_DIR, pdfFile))) {
        availableFiles.push(pdfFile);
      }
    }

    res.json({ 
      success: true, 
      files: availableFiles.sort()
    });
    
  } catch (error) {
    res.status(500).json({ error: "Error listing files", details: error.message });
  }
});
/**
 * Endpoint de login para validar credenciales.
 * Ahora acepta username o email como identificador
 */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  // Validar campos obligatorios
  if (!username || !password) {
    return res.status(400).json({ 
      result: false, 
      error: "Falta nombre de usuario/email o contraseña" 
    });
  }

  try {
    const result = await pool.query(
      `SELECT id FROM users 
       WHERE (username = $1 OR email = $1) 
       AND password = $2`, 
      [username, password]
    );

    if (result.rows.length > 0) {
      req.session.userId = result.rows[0].id;
      res.json({ result: true });
    } else {
      res.status(401).json({ 
        result: false, 
        error: "Credenciales inválidas" 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      result: false, 
      error: "Error en el servidor" 
    });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { title: "DocLocker Login" });
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/home", (req, res) => {
  res.render("home", { title: "DocLocker" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const { exec } = require("child_process");

async function checkAndSeedDatabase() {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM users");
    const userCount = parseInt(result.rows[0].count, 10);

    if (userCount === 0) {
      console.log("Database is empty. Running insertData.js...");
      exec("node insertData.js", (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing insertData.js: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`insertData.js stderr: ${stderr}`);
        }
        console.log(`insertData.js output:\n${stdout}`);
      });
    } else {
      console.log("Database already has data. Skipping insertData.js...");
    }
  } catch (error) {
    console.error("Error checking database:", error.message);
  }
}
checkAndSeedDatabase();
