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
  const filePath = path.join(FILES_DIR, req.file.originalname);
  fs.writeFile(filePath, req.file.buffer, async (err) => {
    if (err) return res.status(500).json({ error: "Error saving file", details: err.message });
    res.json({ success: true, file: req.file.originalname });
  });
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

    // Verificar permisos en la base de datos
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

    // Verificar existencia física del archivo
    const filePath = path.join(FILES_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Permitir descarga
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
    
    // Obtener nombres base desde la base de datos
    const dbResult = await pool.query(
      `SELECT d.file FROM documents d
       JOIN document_entities de ON d.id = de.document_id
       JOIN entities e ON de.entity_id = e.id
       WHERE e.user_id = $1`,
      [userId]
    );

    const availableFiles = [];

    // Verificar existencia física de cada versión
    for (const row of dbResult.rows) {
      const baseName = row.file;
      
      // Verificar y agregar .md si existe
      const mdFile = `${baseName}.md`;
      if (fs.existsSync(path.join(FILES_DIR, mdFile))) {
        availableFiles.push(mdFile);
      }
      
      // Verificar y agregar .pdf si existe
      const pdfFile = `${baseName}.pdf`;
      if (fs.existsSync(path.join(FILES_DIR, pdfFile))) {
        availableFiles.push(pdfFile);
      }
    }

    res.json({ 
      success: true, 
      files: availableFiles.sort() // Ordenar alfabéticamente
    });
    
  } catch (error) {
    res.status(500).json({ error: "Error listing files", details: error.message });
  }
});
/**
 * Endpoint de login para validar credenciales.
 */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ result: false, error: "Missing username or password" });
  try {
    const result = await pool.query("SELECT id FROM users WHERE username = $1 AND password = $2", [username, password]);
    if (result.rows.length > 0) {
      req.session.userId = result.rows[0].id;
      res.json({ result: true });
    } else {
      res.json({ result: false });
    }
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
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
