"""
Simple downloader using yt-dlp
"""

import subprocess
import os
import tempfile


def detect_platform(url):
    """Detect if URL is supported"""
    url_lower = url.lower()
    
    supported = [
        "youtube.com", "youtu.be",
        "tiktok.com", "vm.tiktok.com",
        "instagram.com",
        "twitter.com", "x.com",
        "facebook.com",
    ]
    
    for domain in supported:
        if domain in url_lower:
            return domain.split('.')[0].upper()
    
    return None


def download_from_platform(url, format_choice="best"):
    """
    Download using yt-dlp
    
    Returns: {
        "success": bool,
        "data": bytes,
        "filename": str,
        "size": int,
        "error": str
    }
    """
    temp_file = None
    
    try:
        platform = detect_platform(url)
        if not platform:
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": 0,
                "error": "Unsupported platform"
            }
        
        # Create temp file
        temp_dir = tempfile.gettempdir()
        temp_file = os.path.join(temp_dir, f"orbit_{os.urandom(4).hex()}")
        
        # Download using yt-dlp
        cmd = [
            "yt-dlp",
            "-f", "best",
            "-o", f"{temp_file}.%(ext)s",
            url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            error = result.stderr.strip() if result.stderr else "Download failed"
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": 0,
                "error": error[:100]
            }
        
        # Find the downloaded file
        actual_file = None
        for ext in [".mp4", ".mkv", ".webm", ".m4a", ".mp3", ".jpg", ".png", ".webp"]:
            path = f"{temp_file}{ext}"
            if os.path.exists(path):
                actual_file = path
                break
        
        if not actual_file:
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": 0,
                "error": "No file created"
            }
        
        # Read file
        with open(actual_file, "rb") as f:
            data = f.read()
        
        size = len(data)
        
        # Check size (50MB limit)
        if size > 50 * 1024 * 1024:
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": size,
                "error": f"File too large: {size / 1024 / 1024:.1f}MB (max 50MB)"
            }
        
        filename = os.path.basename(actual_file)
        
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
            "error": "Download took too long (>2 min)"
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "filename": None,
            "size": 0,
            "error": str(e)[:100]
        }
    
    finally:
        # Cleanup
        if temp_file:
            for ext in [".mp4", ".mkv", ".webm", ".m4a", ".mp3", ".jpg", ".png", ".webp", ""]:
                try:
                    path = f"{temp_file}{ext}"
                    if os.path.exists(path):
                        os.remove(path)
                except:
                    pass
