# Eagle Wallet Backend Deployment Guide

This is the backend service for Eagle Wallet's AI features. It handles OpenAI requests, NFT verification, and rate limiting.

## 🚀 How to Deploy on Baota (BT Panel)

1.  **Prepare Files:**
    *   Compress the `backend` folder into a zip file.
    *   Upload the zip to your server (e.g., `/www/wwwroot/eagle-backend`).
    *   Unzip the file.

2.  **Install Dependencies:**
    *   Go to the folder terminal.
    *   Run `npm install` (Make sure Node.js is installed on your server).

3.  **Configure Environment:**
    *   Rename `.env.example` to `.env`.
    *   Edit `.env` and fill in your `OPENAI_API_KEY`.

4.  **Start Service:**
    *   In BT Panel -> Website -> Node project (if available) OR simply use PM2 manager.
    *   Command: `npm start` or `node server.js`.
    *   Recommended: Use PM2 to keep it running `pm2 start server.js --name eagle-backend`.

5.  **Reverse Proxy (Domain Setup):**
    *   Add a domain in BT Panel (e.g., `us.eagleswaps.com`).
    *   Set up a Reverse Proxy pointing to `http://127.0.0.1:3000`.
    *   Enable SSL (Let's Encrypt).

## 🔗 API Endpoints

### 1. Chat with AI
*   **URL:** `https://us.eagleswaps.com/api/chat`
*   **Headers:** 
    *   `Content-Type: application/json`
    *   `x-app-secret: eagle_wallet_secret_123`
*   **Body:**
    ```json
    {
      "message": "Hello AI",
      "deviceId": "device_123",
      "walletAddress": "0x123..." // Optional, for VIP check
    }
    ```

### 2. Check Status
*   **URL:** `GET /api/status?walletAddress=0x...&deviceId=...`

## 🛡 Security
*   The `APP_SECRET` in `.env` must match the one in your App source code.
*   NFT verification happens automatically via the BSC blockchain.
