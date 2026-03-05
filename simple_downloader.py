"""
Simple, reliable downloader using requests + yt-dlp
No piping, just download to temp and read back
"""

import subprocess
import requests
import os
import tempfile
import shutil


def get_download_url(media_url):
    """
    Get actual download URL from yt-dlp
    
    Returns: (url, filename) or (None, None) if failed
    """
    try:
        cmd = [
            "yt-dlp",
            "--get-url",
            "-f", "best",
            media_url
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            actual_url = result.stdout.strip().split('\n')[0]
            return actual_url, media_url.split('/')[-1][:30]
        return None, None
    except:
        return None, None


def download_file(url, max_size_mb=50):
    """
    Simple download function
    
    Returns: (bytes, filename) or (None, None)
    """
    try:
        # Try requests first (for direct links and simple downloads)
        resp = requests.get(url, timeout=60, stream=True)
        
        if resp.status_code == 200:
            # Check size before downloading
            content_length = resp.headers.get('content-length')
            if content_length:
                size_mb = int(content_length) / 1024 / 1024
                if size_mb > max_size_mb:
                    return None, f"File too large: {size_mb:.1f}MB (max {max_size_mb}MB)"
            
            # Download
            data = b''
            for chunk in resp.iter_content(chunk_size=1024*1024):  # 1MB chunks
                if chunk:
                    data += chunk
                    if len(data) > max_size_mb * 1024 * 1024:
                        return None, f"File exceeded {max_size_mb}MB limit"
            
            filename = url.split('/')[-1].split('?')[0][:30] or "download"
            return data, filename
        
        return None, "Failed to download"
    
    except Exception as e:
        return None, str(e)[:100]


def download_from_platform(url, format_choice="best"):
    """
    Download from YouTube, TikTok, Instagram, etc.
    
    Returns: {
        "success": bool,
        "data": bytes,
        "filename": str,
        "size": int,
        "error": str
    }
    """
    try:
        # Step 1: Get URL from yt-dlp
        download_url, hint_name = get_download_url(url)
        
        if not download_url:
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": 0,
                "error": "Could not extract download link. Platform may require login or video is private/deleted."
            }
        
        # Step 2: Download the file
        data, error = download_file(download_url)
        
        if error:
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": 0,
                "error": error
            }
        
        # Success
        filename = f"{hint_name[:20]}.mp4"
        if "MP3" in format_choice:
            filename = f"{hint_name[:20]}.mp3"
        
        return {
            "success": True,
            "data": data,
            "filename": filename,
            "size": len(data),
            "error": None
        }
    
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "filename": None,
            "size": 0,
            "error": str(e)[:150]
        }


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
