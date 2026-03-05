"""
YouTube Downloader Module for Telegram Bot
Uses yt-dlp to download videos and extract audio
"""

import os
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime, timedelta


CACHE_DIR = "/tmp/telegram_downloads"
CACHE_TTL = 3600  # 1 hour


def ensure_cache_dir():
    """Create cache directory if it doesn't exist"""
    os.makedirs(CACHE_DIR, exist_ok=True)


def cleanup_old_files():
    """Remove files older than CACHE_TTL"""
    ensure_cache_dir()
    now = datetime.now()
    for file in Path(CACHE_DIR).glob("*"):
        if file.is_file():
            file_age = now - datetime.fromtimestamp(file.stat().st_mtime)
            if file_age > timedelta(seconds=CACHE_TTL):
                try:
                    file.unlink()
                except:
                    pass


def get_video_info(url):
    """
    Get video information without downloading
    
    Args:
        url: str YouTube URL
    
    Returns:
        dict: {"title": str, "duration": int (seconds), "formats": list}
              Returns None if error
    """
    try:
        cleanup_old_files()
        
        cmd = [
            "yt-dlp",
            "--dump-json",
            "-f", "best",
            url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        
        if result.returncode != 0:
            return None
        
        import json
        data = json.loads(result.stdout)
        
        return {
            "title": data.get("title", "Unknown"),
            "duration": data.get("duration", 0),
            "url": url,
            "formats": ["MP4 360p", "MP4 720p", "MP4 1080p", "MP3 128k", "MP3 192k", "MP3 320k"]
        }
    except Exception as e:
        print(f"Error getting video info: {e}")
        return None


def download_video(url, format_choice):
    """
    Download video in selected format
    
    Args:
        url: str YouTube URL
        format_choice: str One of "MP4_360p", "MP4_720p", "MP4_1080p", 
                           "MP3_128k", "MP3_192k", "MP3_320k"
    
    Returns:
        dict: {"success": bool, "file_path": str, "file_size": int, "error": str}
    """
    try:
        ensure_cache_dir()
        cleanup_old_files()
        
        # Parse format choice
        is_audio = "MP3" in format_choice
        
        filename = f"{datetime.now().timestamp()}"
        file_path = os.path.join(CACHE_DIR, filename)
        
        if is_audio:
            # Extract audio as MP3
            bitrate = format_choice.split("_")[1]  # "128k", "192k", "320k"
            output_path = f"{file_path}.mp3"
            
            cmd = [
                "yt-dlp",
                "-x",  # Extract audio
                "--audio-format", "mp3",
                "--audio-quality", bitrate,
                "-o", output_path,
                url
            ]
        else:
            # Download video as MP4
            quality = format_choice.split("_")[1]  # "360p", "720p", "1080p"
            output_path = f"{file_path}.mp4"
            
            # Map quality to yt-dlp format code
            quality_map = {
                "360p": "18",  # 360p MP4
                "720p": "22",  # 720p MP4
                "1080p": "137+140"  # 1080p video + audio
            }
            format_code = quality_map.get(quality, "best")
            
            cmd = [
                "yt-dlp",
                "-f", format_code,
                "-o", output_path,
                url
            ]
        
        # Run download with timeout
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            return {
                "success": False,
                "file_path": None,
                "file_size": 0,
                "error": result.stderr or "Download failed"
            }
        
        # Check file exists and get size
        if not os.path.exists(output_path):
            return {
                "success": False,
                "file_path": None,
                "file_size": 0,
                "error": "File not created"
            }
        
        file_size = os.path.getsize(output_path)
        
        # Telegram 50MB limit
        if file_size > 50 * 1024 * 1024:
            return {
                "success": False,
                "file_path": output_path,
                "file_size": file_size,
                "error": f"File too large: {file_size / 1024 / 1024:.1f}MB (limit: 50MB)"
            }
        
        return {
            "success": True,
            "file_path": output_path,
            "file_size": file_size,
            "error": None
        }
    
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "file_path": None,
            "file_size": 0,
            "error": "Download timeout (>5 minutes)"
        }
    except Exception as e:
        return {
            "success": False,
            "file_path": None,
            "file_size": 0,
            "error": str(e)
        }


def format_size(size_bytes):
    """Format bytes to human-readable size"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f}TB"


def format_duration(seconds):
    """Format seconds to HH:MM:SS"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"
