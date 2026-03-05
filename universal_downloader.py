"""
Universal Smart Downloader
Handles YouTube, TikTok, Instagram, X, Facebook, Xiaohongshu, and generic links
"""

import subprocess
import requests
import os
import tempfile
from pathlib import Path


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
        ("twitter.com", "x.com", "reddit.com"): "x",
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
    
    return {
        "platform": detected_platform,
        "type": media_type,
        "title": detected_platform.upper()
    }


def get_media_info(url, platform):
    """Get media information"""
    try:
        if platform.startswith("generic"):
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
    """Suggest best format for platform"""
    suggestions = {
        "youtube": ["MP4 720p", "MP4 1080p", "MP3 320k"],
        "tiktok": ["MP4 720p", "MP3 128k"],
        "instagram": ["MP4 720p", "JPG"],
        "x": ["MP4 720p", "JPG"],
        "facebook": ["MP4 720p"],
        "xiaohongshu": ["MP4 720p", "JPG"],
        "generic_video": ["MP4 Original"],
        "generic_audio": ["MP3 Original"],
        "generic_image": ["JPG Original"],
    }
    return suggestions.get(platform, ["Original"])


def download_media(url, format_choice="best"):
    """
    Download media using yt-dlp
    
    Returns:
        dict: {
            "success": bool,
            "data": bytes or None,
            "filename": str,
            "size": int,
            "error": str or None
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
                "error": "Unsupported link"
            }
        
        plat = platform["platform"]
        
        # For generic direct links, just download
        if plat.startswith("generic"):
            try:
                resp = requests.get(url, timeout=30, stream=True)
                if resp.status_code == 200:
                    data = resp.content
                    filename = url.split("/")[-1].split("?")[0] or "download"
                    size = len(data)
                    
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
                        "data": data,
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
        
        # For social platforms, use yt-dlp to temp file
        # Create temp directory
        temp_dir = tempfile.gettempdir()
        temp_file = os.path.join(temp_dir, f"orbit_{os.urandom(8).hex()}")
        
        # Determine format
        if "MP3" in format_choice or "audio" in plat:
            format_code = "bestaudio"
            output_template = f"{temp_file}.mp3"
            postproc = ["-x", "--audio-format", "mp3", "--audio-quality", "192"]
        elif "1080p" in format_choice:
            format_code = "best[height<=1080]"
            output_template = f"{temp_file}.mp4"
            postproc = []
        elif "720p" in format_choice:
            format_code = "best[height<=720]"
            output_template = f"{temp_file}.mp4"
            postproc = []
        elif "360p" in format_choice:
            format_code = "best[height<=360]"
            output_template = f"{temp_file}.mp4"
            postproc = []
        else:
            format_code = "best"
            output_template = f"{temp_file}.mp4"
            postproc = []
        
        # Build command
        cmd = ["yt-dlp", "-f", format_code, "-o", output_template, "--no-warnings", url]
        
        # Add post-processing if needed
        if postproc:
            cmd.extend(postproc)
        
        # Download
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            error_msg = result.stderr if result.stderr else "Download failed"
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": 0,
                "error": error_msg.split("\n")[0][:150]
            }
        
        # Find the actual file (might have different extension)
        actual_file = None
        for ext in [".mp4", ".mp3", ".jpg", ".png", ".webp"]:
            if os.path.exists(f"{temp_file}{ext}"):
                actual_file = f"{temp_file}{ext}"
                break
        
        if not actual_file or not os.path.exists(actual_file):
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": 0,
                "error": "File not created"
            }
        
        # Read file
        with open(actual_file, "rb") as f:
            data = f.read()
        
        size = len(data)
        
        # Check size
        if size > 50 * 1024 * 1024:
            return {
                "success": False,
                "data": None,
                "filename": None,
                "size": size,
                "error": f"File too large: {size / 1024 / 1024:.1f}MB (max 50MB). Try lower quality."
            }
        
        # Generate filename
        info = get_media_info(url, plat)
        title = info.get("title", "download")
        title = "".join(c for c in title if c.isalnum() or c in "-_ ").rstrip()[:30]
        
        ext = os.path.splitext(actual_file)[1]
        filename = f"{title}{ext}"
        
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
            "error": str(e)[:150]
        }
    
    finally:
        # Cleanup temp file
        if temp_file:
            for ext in [".mp4", ".mp3", ".jpg", ".png", ".webp", ""]:
                try:
                    if os.path.exists(f"{temp_file}{ext}"):
                        os.remove(f"{temp_file}{ext}")
                except:
                    pass


def format_size(bytes_size):
    """Format bytes to human-readable size"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024:
            return f"{bytes_size:.1f}{unit}"
        bytes_size /= 1024
    return f"{bytes_size:.1f}TB"
