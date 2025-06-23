const { Markup } = require('telegraf');
const Catalog = require('../database/models/catalog');
const Stock = require('../database/models/stock');
const Pricing = require('../database/models/pricing');
const User = require('../database/models/user');
const config = require('../config');

/**
 * Handle shop command
 * Displays available products and their prices
 */
async function handleShop(ctx) {
  try {
    const catalogs = await Catalog.getActiveCatalogs();
    
    if (catalogs.length === 0) {
      return ctx.reply(ctx.i18n.t('no_products_available'));
    }
    
    const message = ctx.i18n.t('available_products') + '\n\n' +
      catalogs.map(catalog => `${catalog.type} - ${catalog.year}: ${catalog.availableMonths.map(m => m.month).join(', ')}`).join('\n');
    
    const keyboard = Markup.inlineKeyboard([
      ...catalogs.map(catalog => {
        return [Markup.button.callback(`${catalog.type} ${catalog.year}`, `select_product_${catalog._id}`)];
      }),
      [Markup.button.callback(ctx.i18n.t('back_to_main'), 'back_to_main')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in shop handler:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Handle product selection
 */
async function handleProductSelection(ctx, productId) {
  try {
    const product = await Catalog.findById(productId);
    
    if (!product) {
      return ctx.reply(ctx.i18n.t('product_not_found'));
    }
    
    const stock = await Stock.getAvailableStock(product.type, product.year, product.availableMonths[0].month);
    const pricing = await Pricing.getPrice(product.type, product.year, product.availableMonths[0].month);
    
    const message = ctx.i18n.t('product_details', {
      type: product.type,
      year: product.year,
      month: product.availableMonths[0].month,
      price: pricing,
      stock: stock ? stock.quantity : 0
    });
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('add_to_cart'), `add_to_cart_${productId}`)],
      [Markup.button.callback(ctx.i18n.t('back_to_shop'), 'back_to_shop')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error handling product selection:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Handle adding product to cart
 */
async function handleAddToCart(ctx, productId) {
  try {
    // Logic to add product to user's cart
    ctx.session.cart = ctx.session.cart || [];
    ctx.session.cart.push(productId);
    
    return ctx.reply(ctx.i18n.t('product_added_to_cart'));
  } catch (error) {
    console.error('Error adding product to cart:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * View cart contents
 */
async function viewCart(ctx) {
  try {
    const cart = ctx.session.cart || [];
    
    if (cart.length === 0) {
      return ctx.reply(ctx.i18n.t('cart_empty'));
    }
    
    const cartDetails = await Promise.all(cart.map(async (productId) => {
      const product = await Catalog.findById(productId);
      const pricing = await Pricing.getPrice(product.type, product.year, product.availableMonths[0].month);
      return `${product.type} - ${product.year} (${product.availableMonths[0].month}): ${pricing} USDT`;
    }));
    
    const message = ctx.i18n.t('cart_contents') + '\n\n' + cartDetails.join('\n');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('checkout'), 'checkout')],
      [Markup.button.callback(ctx.i18n.t('clear_cart'), 'clear_cart')],
      [Markup.button.callback(ctx.i18n.t('back_to_shop'), 'back_to_shop')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error viewing cart:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Clear the cart
 */
async function clearCart(ctx) {
  ctx.session.cart = [];
  return ctx.reply(ctx.i18n.t('cart_cleared'));
}

/**
 * Handle checkout process
 */
async function handleCheckout(ctx) {
  try {
    const cart = ctx.session.cart || [];
    
    if (cart.length === 0) {
      return ctx.reply(ctx.i18n.t('cart_empty'));
    }
    
    // Logic for processing the checkout
    // This would involve checking stock, calculating total price, etc.
    
    const totalPrice = await calculateTotalPrice(cart);
    
    const message = ctx.i18n.t('checkout_confirmation', { totalPrice });
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('confirm_checkout'), 'confirm_checkout')],
      [Markup.button.callback(ctx.i18n.t('cancel_checkout'), 'cancel_checkout')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Calculate total price for the cart
 */
async function calculateTotalPrice(cart) {
  let total = 0;
  
  for (const productId of cart) {
    const product = await Catalog.findById(productId);
    const pricing = await Pricing.getPrice(product.type, product.year, product.availableMonths[0].month);
    total += pricing; // Assuming 1 unit per product for simplicity
  }
  
  return total;
}

// Export handlers
module.exports = {
  handleShop,
  handleProductSelection,
  handleAddToCart,
  viewCart,
  clearCart,
  handleCheckout
};