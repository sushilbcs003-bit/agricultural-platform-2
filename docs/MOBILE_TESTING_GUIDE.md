# Mobile Testing Guide

## Quick Steps to Test on Mobile (Same Network)

### Step 1: Find Your Computer's Local IP Address

**On macOS:**
```bash
# Option 1: System Preferences
System Preferences → Network → Select your network → View IP address

# Option 2: Terminal
ifconfig | grep "inet " | grep -v 127.0.0.1
# Look for something like: 192.168.1.xxx or 10.0.0.xxx

# Option 3: Network Utility
ipconfig getifaddr en0  # For Wi-Fi
ipconfig getifaddr en1  # For Ethernet
```

**Common IP ranges:**
- `192.168.x.x` (most home networks)
- `10.0.x.x` (some networks)
- `172.16.x.x` (some corporate networks)

### Step 2: Update API URL for Mobile Testing

The frontend currently uses `localhost:3001` which won't work from mobile. You have two options:

#### Option A: Quick Test (Temporary - No Code Changes)
1. Open browser DevTools on your computer
2. Use browser's mobile emulation
3. Or use a proxy tool like ngrok (see below)

#### Option B: Update Environment Variable (Recommended)

1. **Find your local IP** (from Step 1), e.g., `192.168.1.100`

2. **Update docker-compose.yml:**
   ```yaml
   frontend:
     environment:
       - REACT_APP_API_URL=http://YOUR_LOCAL_IP:3001
       # Replace YOUR_LOCAL_IP with your actual IP, e.g.:
       # - REACT_APP_API_URL=http://192.168.1.100:3001
   ```

3. **Also update hardcoded localhost in FarmerRegistration.js:**
   - File: `frontend/src/pages/FarmerRegistration.js` (line 58)
   - Change: `http://localhost:3001/api/master-data`
   - To: `http://YOUR_LOCAL_IP:3001/api/master-data`

4. **Rebuild and restart:**
   ```bash
   docker compose up -d --build frontend
   ```

### Step 3: Access from Mobile Device

1. **Ensure both devices are on the same Wi-Fi network**

2. **Open mobile browser** and navigate to:
   ```
   http://YOUR_LOCAL_IP:3002
   ```
   Example: `http://192.168.1.100:3002`

3. **If it doesn't load:**
   - Check firewall settings on your computer
   - Ensure Docker ports are accessible
   - Try disabling firewall temporarily for testing

### Step 4: Firewall Configuration (if needed)

**On macOS:**
```bash
# Allow incoming connections on ports 3001 and 3002
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/Docker.app
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /Applications/Docker.app
```

Or via System Preferences:
- System Preferences → Security & Privacy → Firewall → Firewall Options
- Add Docker to allowed applications

### Alternative: Use ngrok (Easiest - No IP/Network Config)

1. **Install ngrok:**
   ```bash
   brew install ngrok
   # Or download from https://ngrok.com/
   ```

2. **Create tunnel:**
   ```bash
   ngrok http 3002
   ```

3. **Use the ngrok URL on mobile:**
   - ngrok will give you a URL like: `https://abc123.ngrok.io`
   - Access this from your mobile (works on any network!)
   - Note: You'll still need to update API URLs to use the ngrok backend URL

### Testing Checklist

- [ ] Find local IP address
- [ ] Update REACT_APP_API_URL in docker-compose.yml
- [ ] Update hardcoded localhost in FarmerRegistration.js
- [ ] Rebuild frontend container
- [ ] Ensure mobile and computer are on same Wi-Fi
- [ ] Access `http://YOUR_IP:3002` from mobile browser
- [ ] Test registration form
- [ ] Test dashboard forms
- [ ] Test mobile responsiveness
- [ ] Test touch interactions

### Troubleshooting

**"Can't connect" error:**
- Verify IP address is correct
- Check both devices are on same network
- Try pinging from mobile: `ping YOUR_IP` (if you have a network tool)

**"API calls failing":**
- Check backend is accessible: `http://YOUR_IP:3001/api/health`
- Verify REACT_APP_API_URL is set correctly
- Check browser console for CORS errors

**"Page loads but features don't work":**
- Open mobile browser DevTools (if available)
- Check Network tab for failed API calls
- Verify API URL is using your IP, not localhost

### Quick Command Reference

```bash
# Find your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Check if ports are accessible
lsof -i :3001
lsof -i :3002

# Restart frontend with new config
docker compose up -d --build frontend

# View frontend logs
docker logs -f agricultural_frontend
```
