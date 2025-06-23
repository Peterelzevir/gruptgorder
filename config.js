/**
 * Configuration file for the Telegram bot
 */

const config = {
  // Bot configuration
  BOT_TOKEN: '7559754047:AAFkYOw7i6acsYJKfbS6dLKaJWojFL_6aig', // Replace with your actual bot token

  // Admin configuration
  ADMIN_ID: 1290256714, // Replace with admin's Telegram ID
  ADMIN_USERNAME: 'ninz888', // Replace with admin's Telegram username without @
  ADMIN_IDS: [5988451717, 87654321], // List of all admin IDs that can access admin features

  // Channel that users must join
  REQUIRED_CHANNELS: [
    {
      id: '-1002316736329', // Channel username with @ or channel ID
      title: 'Честность и доверие', // Display name for the channel
      inviteLink: 'https://t.me/ninz818' // Invite link for the channel
    }
  ],

  // Database configuration (using MongoDB)
  DATABASE: {
    URI: 'mongodb+srv://protectBot:Too5UqYZJTswOLva@protect.hhc2v.mongodb.net/?retryWrites=true&w=majority&appName=protect',
    OPTIONS: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // Wallet configuration
  WALLET: {
    USDT_ADDRESS_TRC20: 'TUGeTtQdrMVhHubtYo41fGAE1348oWzLu8',
    USDT_ADDRESS_BEP20: '0x4f1834cD8e3293c48D3f2d217490d22dCd9BC7D3',
    MIN_DEPOSIT: 1, // Minimum deposit amount in USDT
    PREDEFINED_AMOUNTS: [1, 10, 50, 100] // Predefined deposit amounts
  },
  
  // Shop configuration
  SHOP: {
    DEFAULT_PRICING: {
      GROUP: 5, // Default price for groups in USDT
      CHANNEL: 7 // Default price for channels in USDT
    },
    AVAILABLE_YEARS: [2023, 2024], // Available years for catalog
    MONTHS: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  },

  // Support configuration
  SUPPORT: {
    TIMEOUT: 3600000 // Support session timeout in milliseconds (1 hour)
  },

  // Bot languages
  LANGUAGES: {
    en: 'English',
    id: 'Indonesia',
    zh: 'China',
    uz: 'Uzbekistan',
    ru: 'Russia'
  },

  // Default language
  DEFAULT_LANGUAGE: 'en',

  // Session options
  SESSION: {
    // Session data will be stored in memory (not persistent)
    // In production, you should use a database store
    TYPE: 'memory',
    TTL: 86400 // Session time-to-live in seconds (24 hours)
  }
};

module.exports = config;