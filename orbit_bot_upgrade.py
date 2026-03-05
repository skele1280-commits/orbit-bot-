# UPGRADES TO YOUR ORBIT BOT
# Add these functions and modify existing ones

# ============================================
# NEW: Pagination state tracking
# ============================================
coin_pagination = {}  # Format: {user_id: current_page}

# ============================================
# NEW: Fetch top 50 coins instead of 10
# ============================================
def fetch_top_coins(limit=50):
    """Fetch top coins with customizable limit"""
    global pulse_cache, pulse_cache_time
    now = time.time()
    if pulse_cache and (now - pulse_cache_time) < PULSE_CACHE_TTL:
        print(f"[CACHE] Serving pulse from cache (age: {int(now - pulse_cache_time)}s)")
        return pulse_cache
    
    raw = cg_request("/coins/markets",
        params={
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": limit,  # Changed: now accepts limit parameter
            "page": 1,
            "sparkline": "false",
            "price_change_percentage": "1h,24h"
        })
    if raw:
        validated = normalize_coin_list(raw)
        if len(validated) >= 5:
            pulse_cache = validated
            pulse_cache_time = now
            return validated
    
    print("[FALLBACK] CoinGecko failed for top coins, trying CoinCap...")
    cc_data = coincap_fetch_top(limit)
    if cc_data and len(cc_data) >= 5:
        print(f"[FALLBACK] CoinCap returned {len(cc_data)} coins")
        pulse_cache = cc_data
        pulse_cache_time = now
        return cc_data
    
    if pulse_cache:
        print("[CACHE] Both APIs failed — serving stale pulse cache")
        return pulse_cache
    return None


# ============================================
# NEW: Build paginated message
# ============================================
def build_coins_page_text(coins, page=0, total_pages=5):
    """Build message for a specific page of coins"""
    coins_per_page = 10
    start = page * coins_per_page
    end = start + coins_per_page
    page_coins = coins[start:end]
    
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    msg = f"📊 TOP CRYPTOCURRENCIES (Page {page+1}/{total_pages})\n"
    msg += "─────────────────────────────────────────\n"
    
    for i, c in enumerate(page_coins, start + 1):
        name = c.get("name", "Unknown")
        sym = c.get("symbol", "???")
        price = fmt_price(c.get("current_price"))
        ch1h = fmt_change(get_coin_change(c, "1h"))
        ch24h = fmt_change(get_coin_change(c, "24h"))
        mcap = fmt_mcap(c.get("market_cap"))
        vol = fmt_vol(c.get("total_volume"))
        
        msg += f"\n{i}. {name} ({sym})\n"
        msg += f" {price} 1h: {ch1h} 24h: {ch24h}\n"
        msg += f" Cap: {mcap} | Vol: {vol}\n"
    
    msg += f"\n⏱ {now} | Source: CoinGecko"
    msg += f"\n\nPage {page+1} of {total_pages} • Tap a coin below for pro analysis."
    return msg


# ============================================
# NEW: Build pagination keyboard
# ============================================
def build_pagination_keyboard(coins, page=0):
    """Build coin buttons with pagination controls"""
    coins_per_page = 10
    total_pages = (len(coins) + coins_per_page - 1) // coins_per_page
    
    start = page * coins_per_page
    end = start + coins_per_page
    page_coins = coins[start:end]
    
    # Coin buttons (5 per row)
    keyboard = []
    row = []
    for c in page_coins:
        coin_id = c.get("id", "")
        short = get_coin_short_id(coin_id)
        sym = c.get("symbol", "???")
        row.append(InlineKeyboardButton(sym, callback_data=f"ci_{short}"))
        if len(row) == 5:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    
    # Pagination buttons
    nav_row = []
    if page > 0:
        nav_row.append(InlineKeyboardButton("⬅️ Previous", callback_data=f"pulse_page_{page-1}"))
    if page < total_pages - 1:
        nav_row.append(InlineKeyboardButton("Next ➡️", callback_data=f"pulse_page_{page+1}"))
    nav_row.append(InlineKeyboardButton("🔄 Refresh", callback_data="pulse_refresh_page"))
    
    if nav_row:
        keyboard.append(nav_row)
    
    return keyboard


# ============================================
# MODIFIED: Pulse command (now with pagination)
# ============================================
async def pulse(update: Update, context: ContextTypes.DEFAULT_TYPE):
    track_user(update.effective_user)
    log_activity(update.effective_user.id, "pulse")
    user_id = update.effective_user.id
    
    await update.message.reply_text("Loading top 50 coins...")
    coins = fetch_top_coins(limit=50)  # Changed: fetch 50 instead of 10
    
    if not coins:
        await update.message.reply_text(
            "⏳ Data temporarily unavailable — try again in a moment.")
        return
    
    # Reset to page 0 for new request
    coin_pagination[user_id] = 0
    
    page = 0
    total_pages = (len(coins) + 9) // 10  # 50 coins = 5 pages of 10
    msg = build_coins_page_text(coins, page, total_pages)
    keyboard = build_pagination_keyboard(coins, page)
    
    await update.message.reply_text(
        msg, reply_markup=InlineKeyboardMarkup(keyboard))


# ============================================
# MODIFIED: Handle callback for pagination
# ============================================
# Add these cases to your existing handle_callback function:

# In the handle_callback function, add these new conditions:

    elif data.startswith("pulse_page_"):
        page_num = int(data.split("_")[-1])
        coins = fetch_top_coins(limit=50)
        
        if not coins:
            await query.edit_message_text(
                "⏳ Data temporarily unavailable — try again in a moment.")
            return
        
        total_pages = (len(coins) + 9) // 10
        msg = build_coins_page_text(coins, page_num, total_pages)
        keyboard = build_pagination_keyboard(coins, page_num)
        
        await query.edit_message_text(
            msg, reply_markup=InlineKeyboardMarkup(keyboard))
    
    elif data == "pulse_refresh_page":
        user_id = query.from_user.id
        page = coin_pagination.get(user_id, 0)
        coins = fetch_top_coins(limit=50)
        
        if not coins:
            await query.edit_message_text(
                "⏳ Data temporarily unavailable — try again in a moment.")
            return
        
        total_pages = (len(coins) + 9) // 10
        msg = build_coins_page_text(coins, page, total_pages)
        keyboard = build_pagination_keyboard(coins, page)
        
        await query.edit_message_text(
            msg, reply_markup=InlineKeyboardMarkup(keyboard))


# ============================================
# SUMMARY OF CHANGES
# ============================================
"""
WHAT'S NEW:

1. fetch_top_coins(limit=50) - Fetches top 50 coins instead of 10

2. Pagination support:
   - 10 coins per page
   - Total 5 pages for top 50
   - Previous/Next buttons to browse

3. New callback handlers:
   - pulse_page_N - Navigate to page N
   - pulse_refresh_page - Refresh current page

4. Better coin display:
   - Shows ranking (1-10, 11-20, 21-30, etc.)
   - Page indicator (Page 1/5, etc.)
   - All coins still have tap-to-analyze feature

HOW TO DEPLOY:

1. Copy the NEW functions to your main.py
2. Replace the pulse() function with the new one
3. Add the new elif conditions to handle_callback()
4. Replace fetch_top10() calls with fetch_top_coins(limit=50)
5. Test with /pulse command
6. Deploy to Replit

RESULT:
- Users can now see top 50 coins instead of just 10
- Easy pagination with Previous/Next buttons
- Same functionality (tap coin for pro analysis)
- Responsive and fast
"""
