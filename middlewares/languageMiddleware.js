const User = require('../database/models/user');
const config = require('../config');

/**
 * Middleware to handle language settings and translations
 */
function languageMiddleware(locales) {
  return async (ctx, next) => {
    try {
      // Initialize i18n object on context if it doesn't exist
      if (!ctx.i18n) {
        ctx.i18n = {
          locale: () => ctx.session?.language || config.DEFAULT_LANGUAGE,
          t: (key, params = {}) => {
            const locale = ctx.session?.language || config.DEFAULT_LANGUAGE;
            const translations = locales[locale] || locales[config.DEFAULT_LANGUAGE];
            
            let text = translations[key] || key;
            
            // Replace parameters in the text
            Object.keys(params).forEach(param => {
              text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
            });
            
            return text;
          }
        };
      }
      
      // Try to get user's language preference from database
      if (ctx.from?.id && !ctx.session?.language) {
        const user = await User.findByTelegramId(ctx.from.id);
        
        if (user && user.language) {
          ctx.session.language = user.language;
        } else {
          ctx.session.language = config.DEFAULT_LANGUAGE;
        }
      }
      
      return next();
    } catch (error) {
      console.error('Language middleware error:', error);
      return next();
    }
  };
}

module.exports = languageMiddleware;