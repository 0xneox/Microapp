# GPU Tapping Game API Documentation

Base URL: `http://api.neurolov.ai/api`

## Authentication

All endpoints except `/auth/telegram` require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### 1. Telegram Authentication

- **URL**: `/auth/telegram`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "id": "telegram_user_id",
    "first_name": "User's First Name",
    "username": "telegram_username"
  }
  ```
- **Response**: 
  ```json
  {
    "token": "your_jwt_token",
    "user": {
      "id": "telegram_user_id",
      "username": "telegram_username"
    }
  }
  ```

## User Routes

### 2. Start or Resume Session

- **URL**: `/users/start`
- **Method**: `POST`
- **Headers**: Authorization
- **Response**: User object

### 3. Claim Daily XP

- **URL**: `/users/claim-daily-xp`
- **Method**: `POST`
- **Headers**: Authorization
- **Response**: 
  ```json
  {
    "message": "Daily XP claimed successfully",
    "user": {
      "xp": 100,
      "lastDailyClaimDate": "2024-08-13T12:34:56.789Z"
    }
  }
  ```

### 4. Tap GPU

- **URL**: `/users/tap`
- **Method**: `POST`
- **Headers**: Authorization
- **Response**: 
  ```json
  {
    "message": "Tap successful",
    "user": {
      // Updated user object
    }
  }
  ```

### 5. Upgrade GPU

- **URL**: `/users/upgrade-gpu`
- **Method**: `POST`
- **Headers**: Authorization
- **Response**: 
  ```json
  {
    "message": "GPU upgraded",
    "user": {
      // Updated user object
    }
  }
  ```

### 6. Add Referral

- **URL**: `/users/add-referral`
- **Method**: `POST`
- **Headers**: Authorization
- **Body**:
  ```json
  {
    "referredId": "telegram_id_of_referred_user"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Referral added successfully",
    "referrer": {
      // Referrer user object
    },
    "referred": {
      // Referred user object
    }
  }
  ```

## Quest Routes

### 7. Get All Active Quests

- **URL**: `/quests`
- **Method**: `GET`
- **Headers**: Authorization
- **Response**: Array of active quests

## Leaderboard Routes

### 8. Get Global Leaderboard

- **URL**: `/leaderboard/global`
- **Method**: `GET`
- **Headers**: Authorization
- **Response**: Array of top 100 users

### 9. Get User's Position in Leaderboard

- **URL**: `/leaderboard/position`
- **Method**: `GET`
- **Headers**: Authorization
- **Response**: 
  ```json
  {
    "position": 42,
    "totalUsers": 1000
  }
  ```

### 10. Get Timeframe Leaderboard

- **URL**: `/leaderboard/:timeframe`
- **Method**: `GET`
- **Headers**: Authorization
- **Parameters**: 
  - `timeframe`: "daily", "weekly", or "monthly"
- **Response**: Array of top 100 users for the specified timeframe

## Profile Dashboard Routes

### 11. Get User Profile and Dashboard Data

- **URL**: `/profile-dashboard`
- **Method**: `GET`
- **Headers**: Authorization
- **Response**: 
  ```json
  {
    "user": {
      // User data
    },
    "quests": [
      // Active quests
    ],
    "cooldownStatus": {
      // Cooldown information
    }
  }
  ```

### 12. Update User Profile

- **URL**: `/profile-dashboard/update`
- **Method**: `PUT`
- **Headers**: Authorization
- **Body**:
  ```json
  {
    "username": "new_username"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Profile updated successfully",
    "user": {
      // Updated user object
    }
  }
  ```

## Referral Routes

### 13. Generate Referral Code

- **URL**: `/referral/generate-code`
- **Method**: `GET`
- **Headers**: Authorization
- **Response**: 
  ```json
  {
    "referralCode": "ABCD1234"
  }
  ```

### 14. Apply Referral Code

- **URL**: `/referral/apply-code`
- **Method**: `POST`
- **Headers**: Authorization
- **Body**:
  ```json
  {
    "referralCode": "ABCD1234"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Referral code applied successfully"
  }
  ```

### 15. Get Referral Statistics

- **URL**: `/referral/stats`
- **Method**: `GET`
- **Headers**: Authorization
- **Response**: 
  ```json
  {
    "totalReferrals": 5,
    "referralXP": 1000,
    "topReferrals": [
      { "username": "user1", "computePower": 100 },
      { "username": "user2", "computePower": 90 }
    ]
  }
  ```

## Error Handling

All endpoints may return appropriate HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Error responses will have the following format:
```json
{
  "message": "Error description"
}
```

## Notes for Frontend Integration

1. Store the JWT token securely (e.g., in HttpOnly cookies or secure local storage) after receiving it from the Telegram authentication process.
2. Include the JWT token in the Authorization header for all authenticated requests.
3. Handle token expiration and implement a refresh mechanism if necessary.
4. Implement proper error handling and display user-friendly messages.
5. implement a loading state while waiting for API responses.
6. For RT updates (if implemented), use WebSocket connections or implement polling mechanisms as advised by the backend team.
7. Be aware of rate limiting policies (e.g., 100 requests per 15 minutes per IP).

