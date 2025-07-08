# DivineTap

A Telegram Mini App for divine mining and rewards.

## Features

- Divine mining game with points and gems
- Daily rewards system
- Referral system using Telegram start parameters
- Task center and achievements
- Real-time cosmic insights
- NFT gallery and minting
- TON wallet integration

## Referral System

The app uses Telegram's start parameter system for referrals. When users share their referral link, it uses the format:

```
https://t.me/DivineTaps_bot/mine?startapp=REFERRAL_CODE
```

### How it works:

1. **Referral Link Generation**: Each user gets a unique referral code that's used in the `startapp` parameter
2. **Start Parameter Processing**: When someone opens the app via a referral link, the `startapp` parameter is automatically processed
3. **Referral Tracking**: The system tracks who referred whom and provides rewards accordingly
4. **Rewards**: Referrers earn points, gems, and special rewards based on their referral level

### Start Parameter Format

The start parameter follows Telegram's requirements:
- Only alphanumeric characters, underscores, and hyphens allowed
- Maximum 512 characters
- Validated with regex: `/^[\w-]{1,512}$/`

### Example Usage

```typescript
// Generate a referral link
const referralLink = `https://t.me/DivineTaps_bot/mine?startapp=${userReferralCode}`;

// Process start parameter (automatically done on app launch)
const launchParams = retrieveLaunchParams();
const startParam = launchParams.startParam; // Contains the referral code
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Build for production: `npm run build`

### Environment Variables

Create a `.env` file with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Telegram Mini App Setup

1. Create a bot with @BotFather
2. Set up your Mini App with the bot
3. Configure the start parameter handling
4. Deploy your app and test the referral system

## License

MIT License - see LICENSE file for details.
