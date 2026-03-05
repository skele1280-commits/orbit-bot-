"""
Universal Smart Downloader
Handles YouTube, TikTok, Instagram, X, Facebook, Xiaohongshu, and generic links
No caching, no temp files - direct streaming
"""

import subprocess
import io
import requests
from pathlib import Path
from urllib.parse import urlparse


def detect_platform(url):
    """
    Detect platform from URL
    
    Returns:
        dict: {"platform": str, "type": "video|image|audio", "title": str}
        or None if unrecognized
    """
    url_lower = url.lower()
    
    # Platform detection
    platforms = {
        ("youtube.com", "youtu.be"): "youtube",
        ("tiktok.com", "vm.tiktok.com", "vt.tiktok.com"): "tiktok",
        ("instagram.com", "instagr.am"): "instagram",
        ("twitter.com", "x.com"): "x",
        ("facebook.com", "fb.watch"): "facebook",
        ("xiaohongshu.com", "xhslink.com"): "xiaohongshu",
    }
    
    detected_platform = None
    for domains, platform in platforms.items():
        if any(domain in url_lower for domain in domains):
            detected_platform = platform
            break
    
    if not detected_platform:
        # Check for direct media links
        if url_lower.endswith((".mp4", ".mov", ".avi", ".webm")):
            return {"platform": "generic_video", "type": "video", "title": "Video"}
        elif url_lower.endswith((".mp3", ".wav", ".aac", ".flac")):
            return {"platform": "generic_audio", "type": "audio", "title": "Audio"}
        elif url_lower.endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
            return {"platform": "generic_image", "type": "image", "title": "Image"}
        return None
    
    # Determine media type by platform
    media_type = "video"  # Most platforms are video
    if detected_platform == "x":
        media_type = "video"  # Can be video or image, but default video
    
    return {
        "platform": detected_platform,
        "type": media_type,
        "title": detected_platform.upper()
    }


def get_media_info(url, platform):
    """
    Get media information without downloading
    
    Returns:
        dict with title, duration (if video), size estimate, format suggestions
    """
    try:
        if platform.startswith("generic"):
            # For generic links, just get file size
            resp = requests.head(url, timeout=5, allow_redirects=True)
            size = resp.headers.get("content-length", "unknown")
            filename = url.split("/")[-1].split("?")[0]
            return {
                "title": filename or "Media",
                "size": size,
                "formats": ["original"]
            }
        
        # For social platforms, use yt-dlp
        cmd = ["yt-dlp", "--dump-json", url]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            import json
            data = json.loads(result.stdout)
            return {
                "title": data.get("title", "Media"),
                "duration": data.get("duration", 0),
                "formats": suggest_format(platform, "video")
            }
    except:
        pass
    
    return {
        "title": platform.upper(),
        "duration": None,
        "formats": suggest_format(platform, "video")
    }


def suggest_format(platform, media_type):
    """
    Suggest best format for platform/type combination
    
    Returns:
        list of format suggestions
    """
    suggestions = {
        "youtube": ["MP4 720p", "MP4 1080p", "MP3 320k"],
        "tiktok": ["MP4 720p (no watermark)", "MP3 128k"],
        "instagram": ["MP4 720p", "JPG (original)"],
        "x": ["MP4 original", "JPG"],
        "facebook": ["MP4 720p"],
        "xiaohongshu": ["MP4 720p", "JPG (original)"],
        "generic_video": ["MP4 original"],
        "generic_audio": ["MP3 original"],
        "generic_image": ["JPG original"],
    }
    return suggestions.get(platform, ["Original"])


def download_media(url, format_choice="best"):
    """
    Download media and return as bytes (no temp files)
    
    Args:
        url: str media URL
        format_choice: str format choice (e.g., "MP4 720p")
    
    Returns:
        dict: {
            "success": bool,
            "data": bytes or None,
            "filename": str,
            "size": int,
            "error": str or None
        }
    """
    try:
        platform = detect_platform(url)
        if not platform:
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": 0,
                "error": "Unsupported link"
            }
        
        plat = platform["platform"]
        
        # Generic links - direct download
        if plat.startswith("generic"):
            try:
                resp = requests.get(url, timeout=30)
                if resp.status_code == 200:
                    filename = url.split("/")[-1].split("?")[0] or "download"
                    size = len(resp.content)
                    
                    if size > 50 * 1024 * 1024:
                        return {
                            "success": False,
                            "data": None,
                            "filename": filename,
                            "size": size,
                            "error": f"File too large: {size / 1024 / 1024:.1f}MB (max 50MB)"
                        }
                    
                    return {
                        "success": True,
                        "data": resp.content,
                        "filename": filename,
                        "size": size,
                        "error": None
                    }
            except Exception as e:
                return {
                    "success": False,
                    "data": None,
                    "filename": None,
                    "size": 0,
                    "error": f"Download failed: {str(e)}"
                }
        
        # Social platforms - use yt-dlp
        # Determine format codes
        format_code = "best"
        if "720p" in format_choice or "1080p" in format_choice:
            format_code = "best[height<=1080]"
        elif "360p" in format_choice:
            format_code = "best[height<=360]"
        elif "320k" in format_choice or "192k" in format_choice or "128k" in format_choice:
            format_code = "bestaudio"
        
        # Use yt-dlp to download to pipe (not to file)
        cmd = [
            "yt-dlp",
            "-f", format_code,
            "-o", "-",  # Output to stdout
            "--no-warnings",
            url
        ]
        
        # For TikTok: no watermark option
        if plat == "tiktok":
            cmd = [
                "yt-dlp",
                "-f", "best",
                "-o", "-",
                "--no-warnings",
                "--postprocessor-args", "-c:v libx264 -preset fast",
                url
            ]
        
        result = subprocess.run(cmd, capture_output=True, timeout=120)
        
        if result.returncode != 0:
            error_msg = result.stderr.decode() if result.stderr else "Download failed"
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": 0,
                "error": error_msg.split("\n")[0] if error_msg else "Download failed"
            }
        
        data = result.stdout
        size = len(data)
        
        # Check size limit
        if size > 50 * 1024 * 1024:
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": size,
                "error": f"File too large: {size / 1024 / 1024:.1f}MB (limit 50MB). Try lower quality."
            }
        
        # Generate filename
        info = get_media_info(url, plat)
        title = info.get("title", "download")
        # Sanitize filename
        title = "".join(c for c in title if c.isalnum() or c in "-_").rstrip()
        
        if "MP3" in format_choice or "audio" in plat:
            filename = f"{title}.mp3"
        elif "JPG" in format_choice:
            filename = f"{title}.jpg"
        else:
            filename = f"{title}.mp4"
        
        return {
            "success": True,
            "data": data,
            "filename": filename,
            "size": size,
            "error": None
        }
    
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "data": None,
            "filename": None,
            "size": 0,
            "error": "Download timeout (took too long)"
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "filename": None,
            "size": 0,
            "error": str(e)
        }


def format_size(bytes_size):
    """Format bytes to human-readable size"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024:
            return f"{bytes_size:.1f}{unit}"
        bytes_size /= 1024
    return f"{bytes_size:.1f}TB"
