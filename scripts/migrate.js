import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'gotek';
const MYSQL_PORT = process.env.MYSQL_PORT || 3306;

async function migrate() {
    let connection;
    try {
        console.log(`Connecting to ${MYSQL_DATABASE} on ${MYSQL_HOST}:${MYSQL_PORT}...`);
        connection = await mysql.createConnection({
            host: MYSQL_HOST,
            port: MYSQL_PORT,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD,
            database: MYSQL_DATABASE
        });

        console.log('Connected to database.');

        const columnsToAdd = [
            { name: 'current_stage', type: "varchar(50) DEFAULT 'data_collected'" },
            { name: 'completed_stages', type: "longtext" },
            { name: 'pdf_url', type: "varchar(500) DEFAULT NULL" },
            { name: 'assignedTo', type: "varchar(100) DEFAULT NULL" },
            { name: 'assignedToName', type: "varchar(255) DEFAULT NULL" }
        ];

        for (const col of columnsToAdd) {
            try {
                // Check if column exists
                const [rows] = await connection.query(
                    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND COLUMN_NAME = ?`,
                    [MYSQL_DATABASE, col.name]
                );

                if (rows.length === 0) {
                    console.log(`Adding column ${col.name}...`);
                    await connection.query(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`Column ${col.name} added.`);
                } else {
                    console.log(`Column ${col.name} already exists.`);
                }
            } catch (err) {
                console.error(`Error adding column ${col.name}:`, err.message);
            }
        }

        // Initialize completed_stages if NULL
        await connection.query(`UPDATE projects SET completed_stages = '[]' WHERE completed_stages IS NULL`);
        console.log('Done.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
