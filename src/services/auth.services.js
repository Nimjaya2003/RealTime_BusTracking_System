/**
 * Auth Service
 * Contains business logic related to authentication
 */
const bcrypt = require('bcrypt');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const registerUser = async (name, email, password, role) => {
    const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
        throw new Error('User already exists');
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert user into DB
    await db.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role || 'PASSENGER']
    );

    return true;
};

// LOGIN
const loginUser = async (email, password) => {
    const [rows] = await db.execute(
        'SELECT id, password, role FROM users WHERE email = ?',
        [email]
    );

    if (rows.length === 0) {
        throw new Error('Invalid email or password');
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    // Generate JWT
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return {
        token,
        role: user.role
    };
};


module.exports = {
    registerUser,
    loginUser
};

    



    


