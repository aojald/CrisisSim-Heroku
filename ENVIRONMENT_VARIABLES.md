# Environment Variables Configuration

This application supports the following environment variables for configuration:

## Admin User Configuration

### `ADMIN_USERNAME` (optional)
- **Default**: `demo`
- **Description**: Username for the admin account
- **Example**: `ADMIN_USERNAME=admin`

### `ADMIN_PASSWORD` (optional)
- **Default**: `demo2025`
- **Description**: Password for the admin account
- **Example**: `ADMIN_PASSWORD=your_secure_password_here`
- **Note**: If this variable is set, it will update the admin password on each server startup

## Security Configuration

### `JWT_SECRET` (recommended for production)
- **Default**: `your-secret-key-change-in-production`
- **Description**: Secret key for JWT token signing
- **Example**: `JWT_SECRET=a-very-long-random-secret-key`

## Server Configuration

### `NODE_ENV`
- **Default**: `development`
- **Description**: Application environment
- **Values**: `development`, `production`

### `PORT`
- **Default**: `3001`
- **Description**: Port number for the server
- **Example**: `PORT=8080`

## Usage Examples

### Development
```bash
npm run dev
```

### Production with custom admin credentials
```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=secure123 NODE_ENV=production npm start
```

### Heroku deployment
Set these variables in your Heroku app configuration:
```bash
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your-secure-password
heroku config:set JWT_SECRET=your-jwt-secret
```

## Security Notes

- Always use strong passwords in production
- The admin password will be hashed using bcrypt before storage
- If `ADMIN_PASSWORD` is set, the password will be updated on every server restart
- Keep your `JWT_SECRET` secure and never commit it to version control 