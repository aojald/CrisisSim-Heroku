import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path
const dbPath = join(__dirname, 'users.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Initialize database schema
export const initializeDatabase = async () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create users table
            db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Users table created successfully');
                    // Check if admin user exists, create default admin if not
                    createDefaultAdmin().then(resolve).catch(reject);
                }
            });
        });
    });
};

// Create default admin user if none exists
const createDefaultAdmin = async () => {
    return new Promise((resolve, reject) => {
        // Get admin credentials from environment variables
        const adminUsername = process.env.ADMIN_USERNAME || 'demo';
        const adminPassword = process.env.ADMIN_PASSWORD || 'demo2025';

        db.get('SELECT * FROM users WHERE username = ?', [adminUsername], async (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                // Create admin user
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                db.run(
                    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                    [adminUsername, hashedPassword, 'admin'],
                    (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            const passwordDisplay = process.env.ADMIN_PASSWORD ? '***' : adminPassword;
                            console.log(`Admin user created: ${adminUsername}/${passwordDisplay}`);
                            resolve();
                        }
                    }
                );
            } else {
                // Update existing admin password if environment variable is set
                if (process.env.ADMIN_PASSWORD) {
                    const hashedPassword = await bcrypt.hash(adminPassword, 10);
                    db.run(
                        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
                        [hashedPassword, adminUsername],
                        (err) => {
                            if (err) {
                                console.error('Failed to update admin password:', err);
                                reject(err);
                            } else {
                                console.log(`Admin password updated for user: ${adminUsername}`);
                                resolve();
                            }
                        }
                    );
                } else {
                    console.log(`Admin user already exists: ${adminUsername}`);
                    resolve();
                }
            }
        });
    });
};

// User database operations
export const userService = {
    // Get all users
    getAllUsers: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // Get user by username
    getUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // Get user by ID
    getUserById: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // Create new user
    createUser: async (username, password, role = 'user') => {
        return new Promise(async (resolve, reject) => {
            try {
                // Check if user already exists
                const existingUser = await userService.getUserByUsername(username);
                if (existingUser) {
                    reject(new Error('User already exists'));
                    return;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert user
                db.run(
                    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                    [username, hashedPassword, role],
                    function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({
                                id: this.lastID,
                                username,
                                role,
                                created_at: new Date().toISOString()
                            });
                        }
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    },

    // Update user
    updateUser: async (id, updates) => {
        return new Promise(async (resolve, reject) => {
            try {
                const setClauses = [];
                const values = [];

                if (updates.username) {
                    setClauses.push('username = ?');
                    values.push(updates.username);
                }

                if (updates.password) {
                    const hashedPassword = await bcrypt.hash(updates.password, 10);
                    setClauses.push('password_hash = ?');
                    values.push(hashedPassword);
                }

                if (updates.role) {
                    setClauses.push('role = ?');
                    values.push(updates.role);
                }

                setClauses.push('updated_at = CURRENT_TIMESTAMP');
                values.push(id);

                const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;

                db.run(sql, values, function (err) {
                    if (err) {
                        reject(err);
                    } else if (this.changes === 0) {
                        reject(new Error('User not found'));
                    } else {
                        resolve({ id, ...updates });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    // Delete user
    deleteUser: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('User not found'));
                } else {
                    resolve({ id });
                }
            });
        });
    },

    // Validate user credentials
    validateCredentials: async (username, password) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await userService.getUserByUsername(username);
                if (!user) {
                    resolve(null);
                    return;
                }

                const isValid = await bcrypt.compare(password, user.password_hash);
                if (isValid) {
                    resolve({
                        id: user.id,
                        username: user.username,
                        role: user.role
                    });
                } else {
                    resolve(null);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
};

// Close database connection
export const closeDatabase = () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
    });
};

// Initialize database on import
initializeDatabase().catch(console.error); 