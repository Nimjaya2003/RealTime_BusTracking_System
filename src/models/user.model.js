const db = require('../config/db');

exports.createUser = async (name, email, password, role) => {
    const query = `
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
        name,
        email,
        password,
        role
    ]);
    return result;
};

exports.findUserByEmail = async (email) => {
    const query = `
        SELECT * FROM users WHERE email = ?
    `;
    const [rows] = await db.execute(query, [email]);
    return rows[0];
};
