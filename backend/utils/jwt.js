const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET || 'your_secret_key';
const tokenExpiration = '1h'; // Token expiration time

// Generate a JWT token
const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
    };
    return jwt.sign(payload, secretKey, { expiresIn: tokenExpiration });
};

// Verify a JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, secretKey);
    } catch (error) {
        return null; // Token is invalid
    }
};

module.exports = {
    generateToken,
    verifyToken,
};