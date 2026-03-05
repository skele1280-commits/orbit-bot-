"""
Technical Analysis Module for Crypto Bot
Provides RSI, trend detection, and buy/sell signals
"""

def calculate_rsi(prices, period=14):
    """
    Calculate Relative Strength Index (RSI)
    RSI measures momentum: 0-100 scale
    
    Args:
        prices: list of float prices (oldest to newest)
        period: lookback period (default 14)
    
    Returns:
        float: RSI value 0-100
    """
    if len(prices) < period:
        return 50  # Neutral if not enough data
    
    # Calculate price changes
    changes = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    
    # Separate gains and losses
    gains = [c if c > 0 else 0 for c in changes[-period:]]
    losses = [-c if c < 0 else 0 for c in changes[-period:]]
    
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    
    if avg_loss == 0:
        return 100 if avg_gain > 0 else 50
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def detect_trend(prices):
    """
    Detect trend direction based on recent price movement
    
    Args:
        prices: list of float prices (oldest to newest)
    
    Returns:
        str: "up", "down", or "sideways"
    """
    if len(prices) < 2:
        return "sideways"
    
    # Compare last 5 prices with previous 5 (if available)
    if len(prices) >= 10:
        recent_avg = sum(prices[-5:]) / 5
        previous_avg = sum(prices[-10:-5]) / 5
        
        change_percent = ((recent_avg - previous_avg) / previous_avg) * 100
        
        if change_percent > 2:
            return "up"
        elif change_percent < -2:
            return "down"
    else:
        # Fallback: just check if last price > first price
        if prices[-1] > prices[0] * 1.02:
            return "up"
        elif prices[-1] < prices[0] * 0.98:
            return "down"
    
    return "sideways"


def get_signal(rsi_value, price_trend):
    """
    Generate buy/sell signal based on RSI and trend
    
    Args:
        rsi_value: float RSI value 0-100
        price_trend: str "up", "down", or "sideways"
    
    Returns:
        dict: {"signal": "BUY|SELL|HOLD", "strength": "strong|moderate|weak"}
    """
    if rsi_value < 30:
        strength = "strong" if rsi_value < 20 else "moderate"
        return {"signal": "🟢 BUY", "strength": strength, "reason": f"Oversold (RSI {rsi_value:.1f})"}
    elif rsi_value > 70:
        strength = "strong" if rsi_value > 80 else "moderate"
        return {"signal": "🔴 SELL", "strength": strength, "reason": f"Overbought (RSI {rsi_value:.1f})"}
    else:
        return {"signal": "⚪ HOLD", "strength": "weak", "reason": f"Neutral (RSI {rsi_value:.1f})"}


def format_analysis(coin_name, current_price, rsi, trend, signal_info, change_24h):
    """
    Format analysis into readable message
    
    Returns:
        str: Formatted analysis text
    """
    msg = f"📊 {coin_name} Analysis\n"
    msg += f"💰 Price: ${current_price:,.2f}\n"
    msg += f"24h Change: {change_24h:+.2f}%\n\n"
    msg += f"📈 RSI: {rsi:.1f} ({trend})\n"
    msg += f"Signal: {signal_info['signal']} ({signal_info['strength']})\n"
    msg += f"Reason: {signal_info['reason']}\n"
    return msg
