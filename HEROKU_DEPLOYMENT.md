# Heroku Deployment Guide

## 🚀 Quick Deploy

### One-Click Deploy
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

The one-click deploy will automatically:
- ✅ Create a new Heroku app
- ✅ Configure build settings
- ✅ Generate secure passwords automatically
- ✅ Set up environment variables
- ✅ Deploy the application

**Important**: After one-click deploy, note down your generated admin password from the Config Vars section!

## 🔧 Manual Deployment

### Step 1: Prerequisites
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login
```

### Step 2: Create and Configure App
```bash
# Create new Heroku app
heroku create your-crisis-sim-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your_secure_password_here
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# Verify configuration
heroku config
```

### Step 3: Deploy
```bash
# Deploy to Heroku
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Open the application
heroku open
```

## ⚙️ Environment Variables Configuration

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `production` | Yes |
| `ADMIN_USERNAME` | Admin username | `admin` | No (default: `demo`) |
| `ADMIN_PASSWORD` | Admin password | `secure_password_123` | **Highly Recommended** |
| `JWT_SECRET` | JWT signing secret | `random_32_char_string` | **Highly Recommended** |

### Setting Variables

#### Via Heroku CLI:
```bash
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=my_secure_password
heroku config:set JWT_SECRET=your_jwt_secret_key
```

#### Via Heroku Dashboard:
1. Go to your app dashboard
2. **Settings** → **Config Vars**
3. Add the variables manually

#### Via app.json (for one-click deploy):
The variables are pre-configured in `app.json` with secure password generation.

## 📊 Database Considerations

### ⚠️ **CRITICAL: SQLite Limitations on Heroku**

**The current implementation uses SQLite, which has limitations on Heroku:**

1. **Ephemeral File System**: Heroku's file system is ephemeral
2. **Data Loss**: Database will be lost on dyno restart/sleep
3. **No Persistence**: User accounts will reset on app restart

### 🔄 **How It Works Currently**

```
App Restart → Database Reset → Admin User Recreated
```

Every time the Heroku dyno restarts:
1. SQLite database file is lost
2. New database is created automatically
3. Admin user is recreated with environment variables
4. All other users are lost

### 📈 **Production Recommendations**

For production use, consider upgrading to a persistent database:

#### Option 1: PostgreSQL (Recommended)
```bash
# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# The DATABASE_URL will be automatically set
heroku config:get DATABASE_URL
```

#### Option 2: ClearDB MySQL
```bash
# Add ClearDB MySQL addon
heroku addons:create cleardb:ignite

# Get the database URL
heroku config:get CLEARDB_DATABASE_URL
```

#### Option 3: External Database
- Use any external database service
- Set `DATABASE_URL` environment variable

### 🚀 **Current Setup Benefits**

Despite the SQLite limitations, the current setup is perfect for:
- ✅ **Demos and Testing**
- ✅ **Temporary Training Sessions**
- ✅ **Quick Prototypes**
- ✅ **Cost-Free Deployment**

The admin user will always be available with your configured credentials!

## 🔐 Security Best Practices

### Strong Passwords
```bash
# Generate a strong password
openssl rand -base64 20

# Generate JWT secret
openssl rand -base64 32
```

### Environment Variable Management
```bash
# View current configuration (passwords will be hidden)
heroku config

# Update a single variable
heroku config:set ADMIN_PASSWORD=new_secure_password

# Remove a variable
heroku config:unset VARIABLE_NAME
```

### Access Control
- Always use strong, unique passwords
- Change default credentials immediately
- Regularly rotate JWT secrets
- Monitor application logs for security events

## 🔍 Troubleshooting

### Common Issues

#### Issue 1: Admin User Not Found
**Symptom**: Cannot login with configured credentials
**Solution**: Check environment variables and restart the app
```bash
heroku config
heroku restart
heroku logs --tail
```

#### Issue 2: Database Connection Errors
**Symptom**: Database errors in logs
**Solution**: Restart the application (SQLite will be recreated)
```bash
heroku restart
```

#### Issue 3: Environment Variables Not Set
**Symptom**: Using default demo/demo2025 credentials
**Solution**: Set environment variables and restart
```bash
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your_password
heroku restart
```

### Logs and Monitoring
```bash
# View application logs
heroku logs --tail

# View specific components
heroku logs --source app --tail

# Check dyno status
heroku ps
```

## 📈 Scaling Considerations

### Free Tier Limitations
- App sleeps after 30 minutes of inactivity
- 550 free dyno hours per month
- No custom domain on free tier

### Paid Tier Benefits
- No sleep mode
- Custom domains
- Better performance
- SSL certificates

### Database Upgrade Path
```bash
# Upgrade to persistent database when ready
heroku addons:create heroku-postgresql:basic

# This will require code changes to use PostgreSQL instead of SQLite
```

## 🆘 Support

### Application Logs
```bash
# Real-time logs
heroku logs --tail

# Recent logs
heroku logs -n 200
```

### Database Status
```bash
# Check if admin user was created successfully
heroku logs --grep "Admin user"
```

### Configuration Check
```bash
# Verify all environment variables
heroku config

# Test the application
curl https://your-app.herokuapp.com/health
```

## 🔄 Updates and Maintenance

### Updating Admin Credentials
```bash
# Update password
heroku config:set ADMIN_PASSWORD=new_secure_password

# Restart to apply changes
heroku restart
```

### Application Updates
```bash
# Deploy updates
git push heroku main

# Check deployment status
heroku releases
```

### Backup Considerations
- **SQLite**: No backup needed (data is ephemeral)
- **PostgreSQL**: Heroku provides automatic backups
- **Export scenarios**: Always export custom scenarios as YAML files

---

**Ready to deploy? Use the one-click button above or follow the manual steps!** 🚀 