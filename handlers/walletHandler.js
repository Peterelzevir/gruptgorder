const { Markup, Scenes } = require('telegraf');
const User = require('../database/models/user');
const Transaction = require('../database/models/transaction');
const config = require('../config');

// Define scenes for wallet operations
const depositScene = new Scenes.BaseScene('deposit');
const confirmDepositScene = new Scenes.BaseScene('confirm_deposit');
const selectNetworkScene = new Scenes.BaseScene('select_network');

// Collection of scenes to export
const scenes = [depositScene, confirmDepositScene, selectNetworkScene];

/**
 * Handle wallet command
 * Shows user's wallet balance and options
 */
async function handleWallet(ctx) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user) {
      return ctx.reply(ctx.i18n.t('user_not_found'));
    }
    
    const { balance, totalDeposited, totalSpent } = user.wallet;
    
    const message = ctx.i18n.t('wallet_info', {
      balance,
      totalDeposited,
      totalSpent,
      orders: await countUser Orders(user._id)
    });
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('topup_usdt'), 'wallet_topup')],
      [Markup.button.callback(ctx.i18n.t('transaction_history'), 'wallet_history')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in wallet handler:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Handle wallet callback queries
 */
async function handleWalletCallbacks(ctx, callbackData) {
  try {
    switch (callbackData) {
      case 'wallet_topup':
        ctx.scene.enter('deposit');
        break;
        
      case 'wallet_history':
        await showTransactionHistory(ctx);
        break;
        
      case 'wallet_network_trc20':
        ctx.session.selectedNetwork = 'TRC20';
        await showDepositInstructions(ctx, ctx.session.depositAmount, 'TRC20');
        break;
        
      case 'wallet_network_bep20':
        ctx.session.selectedNetwork = 'BEP20';
        await showDepositInstructions(ctx, ctx.session.depositAmount, 'BEP20');
        break;
        
      case 'copy_trc20':
        await ctx.answerCbQuery(ctx.i18n.t('address_copied'));
        break;
        
      case 'copy_bep20':
        await ctx.answerCbQuery(ctx.i18n.t('address_copied'));
        break;
        
      default:
        if (callbackData.startsWith('wallet_amount_')) {
          const amount = parseFloat(callbackData.split('_')[2]);
          ctx.session.depositAmount = amount;
          return ctx.scene.enter('select_network');
        } else if (callbackData === 'wallet_custom_amount') {
          await ctx.answerCbQuery();
          await ctx.reply(ctx.i18n.t('enter_custom_amount'));
          ctx.scene.state.awaitingCustomAmount = true;
        } else if (callbackData === 'wallet_confirm_deposit') {
          ctx.scene.enter('confirm_deposit');
        } else if (callbackData === 'wallet_cancel_deposit') {
          await ctx.answerCbQuery();
          await ctx.deleteMessage();
          await ctx.reply(ctx.i18n.t('deposit_cancelled'));
          ctx.scene.leave();
        } else if (callbackData === 'wallet_back') {
          await handleWallet(ctx);
        }
    }
    
    return ctx.answerCbQuery();
  } catch (error) {
    console.error('Error in wallet callbacks handler:', error);
    return ctx.answerCbQuery(ctx.i18n.t('error_occurred'), { show_alert: true });
  }
}

/**
 * Count user's orders
 */
async function countUserOrders(userId) {
  const Order = require('../database/models/order');
  return await Order.countDocuments({ userId });
}

/**
 * Show transaction history
 */
async function showTransactionHistory(ctx) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user) {
      return ctx.reply(ctx.i18n.t('user_not_found'));
    }
    
    const transactions = await Transaction.getUser Transactions(user._id).limit(10);
    
    if (transactions.length === 0) {
      return ctx.reply(ctx.i18n.t('no_transactions'));
    }
    
    const message = ctx.i18n.t('transaction_history_title') + '\n\n' +
      transactions.map(tx => {
        const date = new Date(tx.createdAt).toLocaleDateString();
        const time = new Date(tx.createdAt).toLocaleTimeString();
        
        let typeText;
        switch (tx.type) {
          case 'deposit': typeText = ctx.i18n.t('transaction_deposit'); break;
          case 'purchase': typeText = ctx.i18n.t('transaction_purchase'); break;
          case 'refund': typeText = ctx.i18n.t('transaction_refund'); break;
          case 'admin_adjustment': typeText = ctx.i18n.t('transaction_adjustment'); break;
        }
        
        let statusText;
        switch (tx.status) {
          case 'pending': statusText = ctx.i18n.t('transaction_pending'); break;
          case 'completed': statusText = ctx.i18n.t('transaction_completed'); break;
          case 'cancelled': statusText = ctx.i18n.t('transaction_cancelled'); break;
          case 'rejected': statusText = ctx.i18n.t('transaction_rejected'); break;
        }
        
        const amountText = tx.amount > 0 ? `+${tx.amount}` : tx.amount;
        
        return `${date} ${time}\n${typeText}: ${amountText} USDT\n${statusText}${tx.description ? '\n' + tx.description : ''}`;
      }).join('\n\n');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('back_to_wallet'), 'wallet_back')]
    ]);
    
    return ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error showing transaction history:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Show deposit instructions with network-specific address
 */
async function showDepositInstructions(ctx, amount, network) {
  try {
    const address = network === 'TRC20' 
      ? config.WALLET.USDT_ADDRESS_TRC20 
      : config.WALLET.USDT_ADDRESS_BEP20;
    
    const networkName = network === 'TRC20' 
      ? 'TRC20 (Tron)' 
      : 'BEP20 (Binance Smart Chain)';
    
    const messages = [
      ctx.i18n.t('deposit_instructions_header', { amount }),
      '',
      `🔹 *${networkName}*\n\`${address}\``,
      '',
      ctx.i18n.t('deposit_instructions_footer')
    ];
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t('send_deposit_proof'), 
          'wallet_confirm_deposit'
        )
      ],
      [
        Markup.button.callback(
          ctx.i18n.t('cancel'), 
          'wallet_cancel_deposit'
        )
      ]
    ]);
    
    await ctx.replyWithMarkdown(messages.join('\n'), {
      reply_markup: keyboard
    });
    
    return ctx.scene.leave();
  } catch (error) {
    console.error('Error showing deposit instructions:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Set up deposit scene
 */
depositScene.enter(async (ctx) => {
  try {
    const keyboard = Markup.inlineKeyboard([
      ...config.WALLET.PREDEFINED_AMOUNTS.map(amount => {
        return [Markup.button.callback(`${amount} USDT`, `wallet_amount_${amount}`)];
      }),
      [Markup.button.callback(ctx.i18n.t('custom_amount'), 'wallet_custom_amount')],
      [Markup.button.callback(ctx.i18n.t('cancel'), 'wallet_cancel_deposit')]
    ]);
    
    return ctx.reply(ctx.i18n.t('select_deposit_amount'), {
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error entering deposit scene:', error);
    ctx.reply(ctx.i18n.t('error_occurred'));
    return ctx.scene.leave();
  }
});

depositScene.on('text', async (ctx) => {
  if (ctx.scene.state.awaitingCustomAmount) {
    try {
      const amount = parseFloat(ctx.message.text.trim());
      
      if (isNaN(amount) || amount < config.WALLET.MIN_DEPOSIT) {
        return ctx.reply(ctx.i18n.t('invalid_deposit_amount', { min: config.WALLET.MIN_DEPOSIT }));
      }
      
      ctx.session.depositAmount = amount;
      return ctx.scene.enter('select_network');
    } catch (error) {
      console.error('Error processing custom amount:', error);
      return ctx.reply(ctx.i18n.t('error_occurred'));
    }
  }
});

/**
 * Set up network selection scene
 */
selectNetworkScene.enter(async (ctx) => {
  try {
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('TRC20 (Tron)', 'wallet_network_trc20'), 
        Markup.button.callback('BEP20 (BSC)', 'wallet_network_bep20')
      ],
      [Markup.button.callback(ctx.i18n.t('cancel'), 'wallet_cancel_deposit')]
    ]);
    
    return ctx.reply(ctx.i18n.t('select_network'), {
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error entering network selection scene:', error);
    ctx.reply(ctx.i18n.t('error_occurred'));
    return ctx.scene.leave();
  }
});

/**
 * Set up confirm deposit scene
 */
confirmDepositScene.enter(async (ctx) => {
  try {
    return ctx.reply(ctx.i18n.t('send_deposit_proof'));
  } catch (error) {
    console.error('Error entering confirm deposit scene:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
});

confirmDepositScene.on('photo', async (ctx) => {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user) {
      return ctx.reply(ctx.i18n.t('user_not_found'));
    }
    
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    
    const amount = ctx.session.depositAmount;
    const network = ctx.session.selectedNetwork || 'Unknown';
    const description = `Deposit ${amount} USDT via ${network}`;
    
    const transaction = await user.createPendingDeposit(amount, description);
    
    await notifyAdminAboutDeposit(ctx, user, amount, fileId, transaction._id, network);
    
    await ctx.reply(ctx.i18n.t('deposit_proof_received'));
    
    return ctx.scene.leave();
  } catch (error) {
    console.error('Error processing deposit proof:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
});

/**
 * Notify admin about new deposit
 */
async function notifyAdminAboutDeposit(ctx, user, amount, photoFileId, transactionId, network) {
  try {
    const adminMsg = `
💰 *New Deposit Request*

:User  ${user.firstName} ${user.lastName ? user.lastName : ''} 
Username: ${user.username ? '@' + user.username : 'None'}
Telegram ID: \`${user.telegramId}\`
Amount: *${amount} USDT*
Network: *${network}*
Transaction ID: \`${transactionId}\`
    `;
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Approve', `admin_approve_deposit_${transactionId}`),
        Markup.button.callback('❌ Reject', `admin_reject_deposit_${transactionId}`)
      ]
    ]);
    
    for (const adminId of config.ADMIN_IDS) {
      try {
        await ctx.telegram.sendPhoto(adminId, photoFileId, {
          caption: adminMsg,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (error) {
        console.error(`Error notifying admin ${adminId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error notifying admin about deposit:', error);
  }
}

// Export scenes and handlers
module.exports = {
  handleWallet,
  handleWalletCallbacks,
  scenes
};
