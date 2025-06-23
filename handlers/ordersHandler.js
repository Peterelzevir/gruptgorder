const { Markup } = require('telegraf');
const Order = require('../database/models/order');
const User = require('../database/models/user');

/**
 * Handle orders command
 * Displays user's recent orders
 */
async function handleOrders(ctx) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user) {
      return ctx.reply(ctx.i18n.t('user_not_found'));
    }
    
    const orders = await Order.getUser Orders(user._id);
    
    if (orders.length === 0) {
      return ctx.reply(ctx.i18n.t('no_orders_found'));
    }
    
    const message = ctx.i18n.t('your_orders') + '\n\n' +
      orders.map(order => {
        return `Order ID: ${order._id}\nType: ${order.orderType}\nStatus: ${order.status}\nTotal Price: ${order.totalPrice} USDT`;
      }).join('\n\n');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('back_to_main'), 'back_to_main')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in orders handler:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Handle order details
 */
async function handleOrderDetails(ctx, orderId) {
  try {
    const order = await Order.findById(orderId).populate('userId');
    
    if (!order) {
      return ctx.reply(ctx.i18n.t('order_not_found'));
    }
    
    const message = ctx.i18n.t('order_details', {
      orderId: order._id,
      type: order.orderType,
      month: order.month,
      year: order.year,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      status: order.status
    });
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('back_to_orders'), 'back_to_orders')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error handling order details:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Handle order cancellation
 */
async function handleCancelOrder(ctx, orderId) {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      return ctx.reply(ctx.i18n.t('order_not_found'));
    }
    
    order.status = 'cancelled';
    await order.save();
    
    return ctx.reply(ctx.i18n.t('order_cancelled', { orderId: order._id }));
  } catch (error) {
    console.error('Error cancelling order:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

// Export handlers
module.exports = {
  handleOrders,
  handleOrderDetails,
  handleCancelOrder
};
