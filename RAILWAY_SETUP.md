# Railway Setup Guide

## Step 1: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose: `Ido108/suno-artist-to-style`

## Step 2: Add Volume (IMPORTANT!)

**This prevents data loss on redeploy:**

1. Click on your service
2. Go to "Settings" tab
3. Scroll to "Volumes"
4. Click "+ Add Volume"
5. **Mount Path**: `/app/data`
6. Click "Add"

## Step 3: Add Environment Variables

1. Go to "Variables" tab
2. Add these variables:

```
ADMIN_PASSWORD=yanivkatan20
RAILWAY_VOLUME_MOUNT_PATH=/app/data
PORT=3000
```

## Step 4: Configure Domain

1. Go to "Settings" tab
2. Scroll to "Networking"
3. Click "Generate Domain"
4. Change to: `suno.up.railway.app`
5. Save

## Step 5: Deploy

Railway will auto-deploy. Wait 2-3 minutes.

## Step 6: Test

1. Go to: https://suno.up.railway.app
2. Login with: `yanivkatan20`
3. Check that artists are loaded

## Important Notes:

- **Volume is required** - without it, all artist additions will be lost on redeploy
- Volume persists data across deployments
- First deploy copies `artist_styles.json` to volume
- Subsequent deploys use volume version

## Troubleshooting:

**Artists disappear after redeploy:**
- Check that Volume is mounted at `/app/data`
- Check that `RAILWAY_VOLUME_MOUNT_PATH=/app/data` is set

**Cannot connect:**
- Check domain is set to `suno.up.railway.app`
- Check service is deployed

**Login fails:**
- Check `ADMIN_PASSWORD=yanivkatan20` is set
