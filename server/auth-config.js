// Auth Configuration
// In production, these should be stored as environment variables
// For development, they are stored here for convenience

export const authConfig = {
    // Valid user credentials
    users: [
        {
            username: 'demo',
            password: 'demo2025',
            role: 'admin'
        }
        // Add more users as needed
    ],

    // JWT secret (in production, use environment variable)
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',

    // Session timeout in milliseconds (24 hours)
    sessionTimeout: 24 * 60 * 60 * 1000,

    // Rate limiting configuration
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 requests per windowMs
        message: 'Too many login attempts, please try again later'
    }
};

// Function to validate user credentials
export const validateCredentials = (username, password) => {
    return authConfig.users.find(user =>
        user.username === username && user.password === password
    );
};

// Function to get user without password
export const getUserInfo = (username) => {
    const user = authConfig.users.find(u => u.username === username);
    if (user) {
        const { password, ...userInfo } = user;
        return userInfo;
    }
    return null;
}; 