"""Cloudinary helpers for avatar image uploads."""

from __future__ import annotations

from app.config.env import get_settings

try:
    import cloudinary
    import cloudinary.uploader
except ImportError:  # pragma: no cover
    cloudinary = None


def upload_image(content: bytes) -> str:
    """Upload an image buffer to Cloudinary and return its public URL."""
    settings = get_settings()

    if cloudinary is None:
        raise RuntimeError("Cloudinary SDK is not installed.")

    if not settings.cloudinary_key or not settings.cloudinary_secret:
        raise RuntimeError("Cloudinary credentials are missing.")

    if not content:
        raise RuntimeError("Image payload is empty.")

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_key,
        api_secret=settings.cloudinary_secret,
    )

    result = cloudinary.uploader.upload(
        content,
        folder=settings.cloudinary_folder,
        resource_type="image",
    )
    image_url = result.get("secure_url") or result.get("url")
    if not image_url:
        raise RuntimeError("Cloudinary upload did not return an image URL.")

    return image_url
