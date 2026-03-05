# Universal Smart Downloader - Rebuild Task

## Goal
Replace youtube_downloader.py with a universal downloader that handles ANY link (YouTube, TikTok, Instagram, X, Facebook, Xiaohongshu, etc.)

## Requirements

### 1. Platform Detection
Detect platform from URL:
- YouTube
- TikTok
- Instagram (videos, reels, carousel)
- X / Twitter (videos, images)
- Facebook
- Xiaohongshu (小红书)
- Generic links (direct mp4, jpg, mp3, gif)

Return: `{platform: str, type: "video|image|audio", title: str}`

### 2. Smart Download
- **Video** → MP4, auto-pick best quality
- **Image** → JPG/PNG, keep original size
- **Audio** → MP3, best bitrate available
- **Multiple images** → ZIP them
- **No watermarks** - use yt-dlp for clean downloads

### 3. Direct Streaming (Critical)
- NO temp files
- NO caching
- Download to memory buffer OR stream directly to Telegram
- Delete immediately after sending
- Handle 50MB limit gracefully (compress quality if needed)

### 4. Smart Decisions
- Detect if video has audio → suggest MP3 option
- Auto-suggest best format per platform
- Example: TikTok video → "MP4 720p (no watermark)?"
- Handle errors: bad links, private content, restricted access

### 5. Privacy & Security
- Never log user URLs or data
- No debug output to users
- No internal details exposed
- User-friendly error messages only

### 6. API/Functions Needed

```python
detect_platform(url: str) -> dict
  Returns: {"platform": str, "type": "video|image|audio", "title": str}
  or None if unrecognized

get_media_info(url: str, platform: str) -> dict
  Returns metadata: title, duration (if video), size estimate, format suggestions

download_media(url: str, format_choice: str) -> dict
  Returns: {"success": bool, "data": bytes, "filename": str, "size": int, "error": str}

suggest_format(platform: str, media_type: str) -> str
  Returns best format suggestion: "MP4 720p", "JPG 1080p", "MP3 320k", etc
```

### 7. Platforms Priority

1. **YouTube** - yt-dlp (MP4 + MP3 options)
2. **TikTok** - yt-dlp (clean download, no watermark)
3. **Instagram** - yt-dlp (videos, reels, carousel)
4. **X/Twitter** - yt-dlp (videos + images)
5. **Facebook** - yt-dlp (videos)
6. **Xiaohongshu** - yt-dlp or requests (images + videos)
7. **Generic URLs** - requests (direct mp4, jpg, mp3, gif)

### 8. Build Steps

1. Write `universal_downloader.py`
   - All platform detection
   - All handlers
   - Clean, documented code
   
2. Update `main.py`
   - Replace `/download` command handler
   - Use new universal functions
   - Simplify conversation flow
   
3. Update `requirements.txt`
   - Check if anything new needed (probably just yt-dlp)
   
4. Test
   - `python3 -m py_compile`
   - Check imports work
   
5. Commit
   - Clear message about universal downloader

### 9. Code Style
- Docstrings on all functions
- Clear error messages (user-facing)
- No logging of sensitive data
- Production-ready
