# Deployment Guide - Simple CRM

Step-by-step guide for deploying Simple CRM to production.

---

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] `.env.example` created
- [ ] Docker images build successfully
- [ ] Git repository clean (committed all changes)
- [ ] CI/CD pipeline green
- [ ] Security checks passed (no hardcoded secrets)

---

## Option 1: Deploy to Render (EASIEST)

### Frontend on Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Deploy Frontend**
   - New → Web Service
   - Connect GitHub repo
   - Environment: Node
   - Build command: `npm install && npm run build`
   - Start command: `npx serve -s build -l 3000`
   - Add environment variable: `REACT_APP_API_URL=https://your-backend-url.com`
   - Deploy

3. **Get Frontend URL**
   - After deployment: `https://simple-crm-frontend.onrender.com`

### Backend on Render

1. **Deploy Backend**
   - New → Web Service
   - Select repository
   - Environment: Node
   - Build command: `npm install`
   - Start command: `node src/server.js`
   - Environment variables:
     ```
     PORT=5000
     DB_URL=<your_mongodb_atlas_url>
     NODE_ENV=production
     ```
   - Deploy

2. **Get Backend URL**
   - After deployment: `https://simple-crm-backend.onrender.com`

3. **Update Frontend Environment**
   - Update `REACT_APP_API_URL` to backend URL
   - Redeploy frontend

---

## Option 2: Deploy to Docker VPS

### Prerequisites

- VPS (DigitalOcean, Linode, AWS)
- Ubuntu 20.04+
- SSH access
- Domain name (optional)

### Setup VPS

```bash
# SSH into VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deploy user
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
```

### Deploy Application

```bash
# SSH as deploy user
ssh deploy@your-vps-ip

# Clone repository
git clone https://github.com/your-username/simple-crm.git
cd simple-crm

# Create .env with production values
cat > .env << EOF
# Backend
PORT=5000
DB_URL=mongodb://admin:secure_password@mongo:27017/crm-db?authSource=admin
NODE_ENV=production

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com
EOF

# Also update docker-compose.yml with domain
# Change ports if needed (use reverse proxy)

# Build and start
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

### Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Configure Nginx as reverse proxy
# (Add Nginx config)

# Auto-renew certificates
sudo systemctl enable certbot.timer
```

### Backup Database

```bash
# Monthly backup script
cat > /home/deploy/backup-mongo.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
mkdir -p $BACKUP_DIR
docker exec simple-crm-mongo mongodump \
  -u admin -p password \
  --authenticationDatabase admin \
  --out $BACKUP_DIR/backup-$(date +%Y%m%d)
EOF

chmod +x /home/deploy/backup-mongo.sh

# Add to cron
crontab -e
# Add: 0 2 * * 0 /home/deploy/backup-mongo.sh
```

---

## Option 3: Deploy to Vercel + Render

**FASTEST SETUP**

### Frontend: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod

# Get URL and note it
```

### Backend: Render

(Follow Option 1: Backend on Render section)

### Connect Frontend to Backend

```bash
# In Vercel project settings:
# Environment Variables:
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

## Monitoring & Maintenance

### Check Application Health

```bash
# Health check endpoint
curl https://api.yourdomain.com/api/health

# Should return: {"status": "ok"}
```

### View Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Follow specific service
docker-compose logs -f --tail=100 backend
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Verify
docker-compose ps
curl http://localhost:5000/api/health
```

### Backup and Restore

```bash
# Backup MongoDB
docker exec simple-crm-mongo mongodump -o /backup

# Restore MongoDB
docker exec simple-crm-mongo mongorestore /backup
```

---

## Production Checklist

- [ ] HTTPS/SSL enabled
- [ ] Database backups configured
- [ ] Monitoring/alerts set up
- [ ] Error logging configured
- [ ] Database credentials secure
- [ ] API rate limiting enabled
- [ ] CORS configured for production domain
- [ ] Environment variables in .env (NOT in code)
- [ ] Database username/password strong
- [ ] Firewall configured
- [ ] Auto-restart on failure configured
- [ ] CDN configured for static files (optional)

---

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose down
docker-compose up --build

# Check resources
docker stats
```

### Database connection error

```bash
# Check MongoDB
docker exec simple-crm-mongo mongosh -u admin -p

# Check network
docker network ls
docker network inspect simple-crm_crm-network
```

### High CPU/Memory usage

```bash
# Identify container
docker stats

# Restart container
docker-compose restart backend

# Check for memory leaks in logs
docker-compose logs backend | grep -i memory
```

### Slow API responses

```bash
# Check MongoDB indexes
docker exec simple-crm-mongo mongosh \
  -u admin -p \
  --eval "db.customers.getIndexes()"

# Check Docker logs for errors
docker-compose logs -f backend
```

---

## Rollback Procedure

If deployment fails:

```bash
# Get git log
git log --oneline

# Revert to previous version
git revert <commit-hash>
git push origin main

# Redeploy
docker-compose up -d --build
```

---

## Performance Optimization

### Enable Caching

```javascript
// Backend
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
});
```

### Database Indexing

```bash
docker exec simple-crm-mongo mongosh -u admin -p << EOF
use crm-db;
db.customers.createIndex({ email: 1 });
db.customers.createIndex({ name: 1 });
EOF
```

### Use CDN for Frontend

- CloudFlare, AWS CloudFront, or Vercel CDN
- Automatic caching of static files

---

## Scaling

### Horizontal Scaling (Multiple Backend Instances)

Use Nginx as load balancer:

```nginx
upstream backend {
  server backend1:5000;
  server backend2:5000;
  server backend3:5000;
}

server {
  location /api {
    proxy_pass http://backend;
  }
}
```

### Vertical Scaling

Increase container resources:

```yaml
# docker-compose.yml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
```

---

**Last Updated:** April 2024  
**Maintained By:** Ông Thân Quốc Trường (Infrastructure Engineer)
