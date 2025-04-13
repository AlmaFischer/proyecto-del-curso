// ============================================
// SECCIÓN 1: CONFIGURACIÓN INICIAL Y MIDDLEWARES
// ============================================

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

// ============================================
// SECCIÓN 2: MIDDLEWARES PERSONALIZADOS
// ============================================

// Middleware para verificar autenticación
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

// Middleware para verificar admin
function isAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: "Acceso requerido: administrador" });
  }
  next();
}

// ============================================
// SECCIÓN 3: RUTAS PÚBLICAS
// ============================================

// redireccion a /login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// render a /login
app.get("/login", (req, res) => {
  res.render("login", { title: "DocLocker Login" });
});

// Endpoint de login para validar credenciales
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
      `SELECT id, is_admin FROM users 
       WHERE (username = $1 OR email = $1) 
       AND password = $2`, 
      [username, password]
    );

    if (result.rows.length > 0) {
      req.session.userId = result.rows[0].id;
      req.session.isAdmin = result.rows[0].is_admin;

      const redirectPath = result.rows[0].is_admin ? "/admin/home" : "/home";
      res.json({ 
        result: true, 
        redirect: redirectPath // Enviar ruta al frontend
      });

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



// ============================================
// SECCIÓN 4: RUTAS DE USUARIO AUTENTICADO
// ============================================

app.get("/home",isAuthenticated, (req, res) => {
  res.render("home", { title: "DocLocker",user: {isAdmin: req.session.isAdmin} });
});

// Endpoint para listar archivos del usuario autenticado.
app.get("/files", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Primero obtenemos los documentos del usuario con sus metadatos
    const documentsQuery = await pool.query(
      `SELECT d.id, d.file, d.document_type 
       FROM documents d
       JOIN document_entities de ON d.id = de.document_id
       JOIN entities e ON de.entity_id = e.id
       WHERE e.user_id = $1`,
      [userId]
    );

    const filesData = [];

    for (const doc of documentsQuery.rows) {
      const baseName = doc.file;
      const fileEntry = {
        documentId: doc.id,
        documentType: doc.document_type,
        files: [],
        comments: []
      };

      // Verificamos archivos físicos
      const mdFile = `${baseName}.md`;
      if (fs.existsSync(path.join(FILES_DIR, mdFile))) {
        fileEntry.files.push(mdFile);
      }

      const pdfFile = `${baseName}.pdf`;
      if (fs.existsSync(path.join(FILES_DIR, pdfFile))) {
        fileEntry.files.push(pdfFile);
      }

      // Obtenemos comentarios para este documento
      if (doc.id) {
        const commentsQuery = await pool.query(
          `SELECT DISTINCT c.id, c.content, c.created_at, u.username 
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.document_id = $1
           ORDER BY c.created_at DESC`,
          [doc.id]
        );
        fileEntry.comments = commentsQuery.rows;
      }

      filesData.push(fileEntry);
    }

    res.json({ 
      success: true, 
      data: filesData.sort((a, b) => a.documentType.localeCompare(b.documentType))
    });
    
  } catch (error) {
    res.status(500).json({ error: "Error listing files", details: error.message });
  }
});

// Endpoint para agregar comentarios a un documento
app.post("/api/documents/:documentId/comments", isAuthenticated, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content } = req.body;
    const userId = req.session.userId;

    // Validación básica
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "El comentario no puede estar vacío" });
    }

    // Insertar en la base de datos
    const result = await pool.query(
      `INSERT INTO comments (user_id, document_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, documentId, content.trim()]
    );

    res.json({ 
      success: true, 
      comment: result.rows[0] 
    });

  } catch (error) {
    res.status(500).json({ 
      error: "Error al crear el comentario", 
      details: error.message 
    });
  }
});

// Endpoint para descargar archivos, solo si pertenecen al usuario autenticado.
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

// ============================================
// SECCIÓN 5: RUTAS DE ADMINISTRADOR
// ============================================

app.get("/admin/home", isAuthenticated, isAdmin, (req, res) => {
  res.render("admin/home", {
    title: "Panel de Administración"
  });
});

// Endpoint para listar todos los documentos y sus comentarios
app.get("/admin/files", isAuthenticated,isAdmin, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Primero obtenemos los documentos del usuario con sus metadatos
    const documentsQuery = await pool.query(
      `SELECT DISTINCT d.id, d.file, d.document_type 
       FROM documents d
       JOIN document_entities de ON d.id = de.document_id
       JOIN entities e ON de.entity_id = e.id`,
      []
    );

    const filesData = [];

    for (const doc of documentsQuery.rows) {
      const baseName = doc.file;
      const fileEntry = {
        documentId: doc.id,
        documentType: doc.document_type,
        files: [],
        comments: []
      };

      // Verificamos archivos físicos
      const mdFile = `${baseName}.md`;
      if (fs.existsSync(path.join(FILES_DIR, mdFile))) {
        fileEntry.files.push(mdFile);
      }

      const pdfFile = `${baseName}.pdf`;
      if (fs.existsSync(path.join(FILES_DIR, pdfFile))) {
        fileEntry.files.push(pdfFile);
      }

      // Obtenemos comentarios para este documento
      if (doc.id) {
        const commentsQuery = await pool.query(
          `SELECT c.id, c.content, c.created_at, u.username 
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.document_id = $1
           ORDER BY c.created_at DESC`,
          [doc.id]
        );
        fileEntry.comments = commentsQuery.rows;
      }

      filesData.push(fileEntry);
    }

    res.json({ 
      success: true, 
      data: filesData.sort((a, b) => a.documentType.localeCompare(b.documentType))
    });
    
  } catch (error) {
    res.status(500).json({ error: "Error listing files", details: error.message });
  }
});

// Endpoint para descargar archivos.
app.get("/admin/download/:filename", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // 1. Verificar existencia del registro en la base de datos
    const baseName = path.parse(filename).name; // Extraer nombre sin extensión
    
    const documentCheck = await pool.query(
      "SELECT file FROM documents WHERE file = $1",
      [baseName]
    );

    // 2. Validar que el documento existe en los registros
    if (documentCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: "Documento no registrado en el sistema",
        details: `El archivo ${baseName} no existe en la base de datos`
      });
    }

    // 3. Verificar existencia física del archivo
    const filePath = path.join(FILES_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Archivo no encontrado",
        details: `El archivo ${filename} no existe en el servidor`
      });
    }

    // 4. Descargar archivo
    res.download(filePath);

  } catch (error) {
    console.error("[ADMIN DOWNLOAD ERROR]", error);
    res.status(500).json({
      error: "Error en la descarga",
      details: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Contacte al equipo técnico'
    });
  }
});

// Endpoint para subir archivos al servidor local.
app.post("/upload", upload.single("file"), isAuthenticated, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const userId = req.session.userId;
  const isAdmin = req.session.isAdmin;
  const fileName = path.parse(req.file.originalname).name;

  try {
    if (!isAdmin) {
      // Validar si este archivo le pertenece al usuario
      const dbResult = await pool.query(
        `SELECT d.id FROM documents d
         JOIN document_entities de ON d.id = de.document_id
         JOIN entities e ON de.entity_id = e.id
         WHERE e.user_id = $1 AND d.file = $2`,
        [userId, fileName]
      );

      if (dbResult.rows.length === 0) {
        return res.status(403).json({ error: "No tienes permiso para subir este archivo." });
      }
    }

    // Guardar archivo
    const filePath = path.join(FILES_DIR, req.file.originalname);
    fs.writeFile(filePath, req.file.buffer, (err) => {
      if (err) return res.status(500).json({ error: "Error al guardar el archivo", details: err.message });

      res.json({ success: true, file: req.file.originalname });
    });

  } catch (error) {
    res.status(500).json({ error: "Error en el servidor", details: error.message });
  }
});

// ============================================
// SECCIÓN 6: MANEJO DE ERRORES Y UTILIDADES
// ============================================

// Poblar la base de datos
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

function handleAdminError(res, error, message) {
  console.error(`[ADMIN ERROR] ${message}:`, error);
  res.status(500).json({ 
    error: message,
    details: process.env.NODE_ENV === 'production' ? null : error.message
  });
}