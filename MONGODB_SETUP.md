# 🗄️ MongoDB Setup Guide

## You have 2 options:

---

## ✅ **OPTION 1: MongoDB Atlas (Cloud - RECOMMENDED - 2 minutes)**

### **Fastest way to get started!**

1. **Go to:** https://www.mongodb.com/cloud/atlas
2. **Sign up** (free account)
3. **Create a free cluster** (M0 - Free tier)
4. **Get connection string:**
   - Click "Connect"
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

5. **Update your .env file:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/syncspace?retryWrites=true&w=majority
   ```

6. **Whitelist your IP:**
   - In Atlas, go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (for development)

**Then continue with the setup below!**

---

## ⚙️ **OPTION 2: Install MongoDB Locally (15 minutes)**

### **For Windows:**

1. **Download MongoDB:**
   - Go to: https://www.mongodb.com/try/download/community
   - Download "MongoDB Community Server" for Windows
   - Run the installer (.msi file)

2. **Install:**
   - Choose "Complete" installation
   - Check "Install MongoDB as a Service"
   - Complete the installation

3. **Start MongoDB:**
   - MongoDB should start automatically as a service
   - Or run: `net start MongoDB`

4. **Verify:**
   ```powershell
   mongod --version
   ```

**Then continue with the setup below!**

---

## 🚀 **After Setting Up MongoDB**

### **Run these commands:**

```powershell
# 1. Navigate to server directory
cd "d:\rashmi Project\server"

# 2. Seed the database
npm run seed

# 3. Go back to root
cd ..

# 4. Start the development servers
.\start-dev.bat
```

---

## 🔥 **Quick Test (No MongoDB Required)**

If you want to test the **frontend only** without database:

1. Comment out MongoDB connection in `server/server.js`
2. Start just the frontend:
   ```powershell
   cd client
   npm run dev
   ```

But for **full functionality**, you need MongoDB!

---

## 💡 **Recommended: Use MongoDB Atlas**

- ✅ Free forever
- ✅ No installation needed
- ✅ Works from anywhere
- ✅ Automatic backups
- ✅ Easy scaling

**It takes just 2 minutes to set up!**

---

## ❓ **Need Help?**

**Check if MongoDB is running:**
```powershell
# Try connecting
mongosh  # or mongo
```

**Check MongoDB service (Windows):**
```powershell
Get-Service MongoDB
```

**Start MongoDB service:**
```powershell
net start MongoDB
```

---

**Choose MongoDB Atlas for the quickest setup! 🚀**
