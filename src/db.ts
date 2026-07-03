import fs from "fs";
import path from "path";
import { TrackedProduct, AlertLog } from "./types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

interface DatabaseSchema {
  products: TrackedProduct[];
  logs: AlertLog[];
}

function initDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialData: DatabaseSchema = {
        products: [],
        logs: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    }
  } catch (err) {
    console.error("Error initializing database file-store:", err);
  }
}

// Read database
export function readDb(): DatabaseSchema {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data) as DatabaseSchema;
  } catch (err) {
    console.error("Error reading from database file-store:", err);
    return { products: [], logs: [] };
  }
}

// Write database
export function writeDb(data: DatabaseSchema) {
  initDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to database file-store:", err);
  }
}

// Products operations
export function getProducts(): TrackedProduct[] {
  return readDb().products;
}

export function saveProduct(product: TrackedProduct): TrackedProduct {
  const db = readDb();
  const index = db.products.findIndex(p => p.id === product.id);
  if (index >= 0) {
    db.products[index] = product;
  } else {
    db.products.push(product);
  }
  writeDb(db);
  return product;
}

export function deleteProduct(id: string): boolean {
  const db = readDb();
  const initialLength = db.products.length;
  db.products = db.products.filter(p => p.id !== id);
  writeDb(db);
  return db.products.length < initialLength;
}

// Logs operations
export function getLogs(): AlertLog[] {
  return readDb().logs;
}

export function addLog(log: AlertLog): AlertLog {
  const db = readDb();
  db.logs.unshift(log); // newest first
  // Cap logs at 100 entries for performance
  if (db.logs.length > 100) {
    db.logs = db.logs.slice(0, 100);
  }
  writeDb(db);
  return log;
}
