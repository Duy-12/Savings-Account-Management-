/**
 * Quản lý Connection Pool MySQL & Helper ACID Transaction (withTransaction)
 * File: backend/config/db.js
 */
const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: env.db.connectionLimit,
    queueLimit: 0,
    decimalNumbers: true
});

/**
 * Thực thi một khối nghiệp vụ bên trong MySQL Transaction (ACID).
 * Tự động BEGIN, COMMIT nếu thành công và ROLLBACK nếu có lỗi.
 * @template T
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<T>} workFn
 * @returns {Promise<T>}
 */
async function withTransaction(workFn) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const result = await workFn(conn);
        await conn.commit();
        return result;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

/**
 * Kiểm tra kết nối tới MySQL Server cho endpoint /api/health
 */
async function testConnection() {
    try {
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    pool,
    withTransaction,
    testConnection
};
