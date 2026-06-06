const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "nu-lipa-yearbook-secret";

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dg_bughaw",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const runQuery = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  return result;
};

const ensureUsersProfileColumns = async () => {
  await runQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255) NULL");
  await runQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic LONGTEXT NULL");
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication token is required." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token.", error: error.message });
  }
};

const isValidBase64Payload = (value) => {
  if (!value || value.length % 4 !== 0) {
    return false;
  }

  return /^[A-Za-z0-9+/]+={0,2}$/.test(value);
};

const normalizeProfilePicInput = (value) => {
  if (value === undefined) {
    return { provided: false };
  }

  if (value === null) {
    return { provided: true, value: null };
  }

  if (typeof value !== "string") {
    return { error: "Profile picture must be a base64 string or image data URI." };
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { provided: true, value: null };
  }

  const dataUriMatch = trimmedValue.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);

  if (dataUriMatch) {
    const normalizedBase64 = dataUriMatch[2].replace(/\s+/g, "");

    if (!isValidBase64Payload(normalizedBase64)) {
      return { error: "Profile picture data URI contains invalid base64 data." };
    }

    return {
      provided: true,
      value: `data:${dataUriMatch[1]};base64,${normalizedBase64}`,
    };
  }

  const normalizedBase64 = trimmedValue.replace(/\s+/g, "");

  if (!isValidBase64Payload(normalizedBase64)) {
    return { error: "Profile picture must be a valid base64 string or image data URI." };
  }

  return {
    provided: true,
    value: `data:image/jpeg;base64,${normalizedBase64}`,
  };
};

const createCrudRoutes = ({ route, table, columns }) => {
  app.get(`/${route}`, async (_req, res) => {
    try {
      const rows = await runQuery(`SELECT * FROM ${table} ORDER BY id DESC`);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch ${route}.`, error: error.message });
    }
  });

  app.post(`/${route}`, async (req, res) => {
    try {
      const values = columns.map((column) => req.body[column] ?? null);
      const placeholders = columns.map(() => "?").join(", ");
      const result = await runQuery(
        `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
        values
      );

      const rows = await runQuery(`SELECT * FROM ${table} WHERE id = ?`, [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: `Failed to create ${route.slice(0, -1)}.`, error: error.message });
    }
  });

  app.put(`/${route}/:id`, async (req, res) => {
    try {
      const values = columns.map((column) => req.body[column] ?? null);
      const assignments = columns.map((column) => `${column} = ?`).join(", ");
      const result = await runQuery(
        `UPDATE ${table} SET ${assignments} WHERE id = ?`,
        [...values, req.params.id]
      );

      if (!result.affectedRows) {
        return res.status(404).json({ message: `${route.slice(0, -1)} not found.` });
      }

      const rows = await runQuery(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: `Failed to update ${route.slice(0, -1)}.`, error: error.message });
    }
  });

  app.delete(`/${route}/:id`, async (req, res) => {
    try {
      const result = await runQuery(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);

      if (!result.affectedRows) {
        return res.status(404).json({ message: `${route.slice(0, -1)} not found.` });
      }

      res.json({ message: `${route.slice(0, -1)} deleted successfully.` });
    } catch (error) {
      res.status(500).json({ message: `Failed to delete ${route.slice(0, -1)}.`, error: error.message });
    }
  });
};

app.get("/health", (_req, res) => {
  res.json({ message: "NU Lipa Digital Yearbook API is running." });
});

app.post("/register", async (req, res) => {
  const { email, password, name, course, section, profile_pic } = req.body;

  if (!email || !password || !name?.trim()) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  try {
    const normalizedProfilePic = normalizeProfilePicInput(profile_pic);

    if (normalizedProfilePic.error) {
      return res.status(400).json({ message: normalizedProfilePic.error });
    }

    const existingUsers = await runQuery("SELECT id FROM users WHERE email = ?", [email]);

    if (existingUsers.length) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await runQuery(
      "INSERT INTO users (email, password, name, course, section, profile_pic) VALUES (?, ?, ?, ?, ?, ?)",
      [email, hashedPassword, name.trim(), course ?? null, section ?? null, normalizedProfilePic.value ?? null]
    );

    const rows = await runQuery(
      "SELECT id, email, name, course, section, profile_pic FROM users WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "User registered successfully.",
      user: rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed.", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const rows = await runQuery("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        course: user.course,
        section: user.section,
        profile_pic: user.profile_pic,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed.", error: error.message });
  }
});

app.get("/me", authenticateToken, async (req, res) => {
  try {
    const rows = await runQuery(
      "SELECT id, email, name, course, section, profile_pic FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile.", error: error.message });
  }
});

app.put("/me", authenticateToken, async (req, res) => {
  const { name, course, section, profile_pic, password } = req.body;

  try {
    const normalizedProfilePic = normalizeProfilePicInput(profile_pic);

    if (normalizedProfilePic.error) {
      return res.status(400).json({ message: normalizedProfilePic.error });
    }

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name?.trim() || null);
    }

    if (course !== undefined) {
      fields.push("course = ?");
      values.push(course);
    }

    if (section !== undefined) {
      fields.push("section = ?");
      values.push(section);
    }

    if (normalizedProfilePic.provided) {
      fields.push("profile_pic = ?");
      values.push(normalizedProfilePic.value);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    if (!fields.length) {
      return res.status(400).json({ message: "No fields provided for update." });
    }

    await runQuery(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      [...values, req.user.id]
    );

    const rows = await runQuery(
      "SELECT id, email, name, course, section, profile_pic FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
});

app.get("/users", async (_req, res) => {
  try {
    const rows = await runQuery(
      "SELECT id, email, name, course, section, profile_pic FROM users ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users.", error: error.message });
  }
});

app.put("/users/:id", async (req, res) => {
  const { email, name, course, section, profile_pic, password } = req.body;

  try {
    const normalizedProfilePic = normalizeProfilePicInput(profile_pic);

    if (normalizedProfilePic.error) {
      return res.status(400).json({ message: normalizedProfilePic.error });
    }

    const fields = [];
    const values = [];

    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }

    if (course !== undefined) {
      fields.push("course = ?");
      values.push(course);
    }

    if (section !== undefined) {
      fields.push("section = ?");
      values.push(section);
    }

    if (normalizedProfilePic.provided) {
      fields.push("profile_pic = ?");
      values.push(normalizedProfilePic.value);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    if (!fields.length) {
      return res.status(400).json({ message: "No fields provided for update." });
    }

    const result = await runQuery(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      [...values, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "User not found." });
    }

    const rows = await runQuery(
      "SELECT id, email, name, course, section, profile_pic FROM users WHERE id = ?",
      [req.params.id]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to update user.", error: error.message });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const result = await runQuery("DELETE FROM users WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user.", error: error.message });
  }
});

createCrudRoutes({
  route: "students",
  table: "students",
  columns: ["name", "course", "section", "photo"],
});

createCrudRoutes({
  route: "faculty",
  table: "faculty",
  columns: ["name", "department", "email"],
});

createCrudRoutes({
  route: "gallery",
  table: "gallery",
  columns: ["image_url", "caption"],
});

app.listen(PORT, async () => {
  try {
    await pool.getConnection().then((connection) => connection.release());
    await ensureUsersProfileColumns();
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Connected to MySQL database: dg_bughaw");
  } catch (error) {
    console.error("Server started but database connection failed:", error.message);
  }
});
