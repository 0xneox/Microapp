# Neurolov GPU Microapp
Backend for Telegram based Micro Application

## Overview
NeuroLov is an engaging GPU tapping game where users can tap to generate compute power, upgrade their virtual GPUs, complete quests, and compete on leaderboards. This repository contains the backend code for the NeuroLov game.



## Features
- User authentication via Telegram
- GPU tapping mechanism with cooldown periods
- Quest system with daily, weekly, and bonus quests
- Leaderboard functionality
- Referral system
- User profiles and settings

## Tech Stack
- Node.js
- Express.js
- MongoDB
- Redis (for caching and rate limiting)
- JSON Web Tokens (JWT) for authentication

## Prerequisites
- Node.js (v14 or later)
- MongoDB
- Redis
- Telegram Bot Token

## Installation
1. Clone the repository:
   ```
   git clone 
   cd Microapp
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Configuration
1. Create a `.env` file in the root directory with the following content:
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   REDIS_URL=your_redis_url
   JWT_SECRET=your_jwt_secret
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   CORS_ORIGIN=http://localhost:3000
   ```

2. Replace the placeholder values with your actual configuration details.

## Running the Application
1. Start the server:
   ```
   npm start
   ```

2. For development with auto-restart on file changes:
   ```
   npm run dev
   ```

## API Documentation
Detailed API documentation can be found in the [API_DOCS.md](./API_DOCS.md) file.



## Contributing
We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to contribute to this project.

## License
This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.
