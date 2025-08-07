#!/bin/bash

# Script to create PWA icons with Serra ICT branding
# Creates 192x192 and 512x512 PNG icons from source images

set -e  # Exit on any error

echo "Creating PWA icons..."

# Check if source images exist
if [ ! -f "img/app-url-qr-code.png" ]; then
    echo "Error: img/app-url-qr-code.png not found"
    exit 1
fi

if [ ! -f "img/logo.png" ]; then
    echo "Error: img/logo.png not found"
    exit 1
fi

if [ ! -f "favicon.ico" ]; then
    echo "Error: favicon.ico not found"
    exit 1
fi

echo "Step 1: Converting QR code black pixels to #009279..."
magick img/app-url-qr-code.png -colorspace RGB -fill "#009279" -opaque black qr-converted.png

echo "Step 2: Creating 512x512 base with favicon in center square..."
magick qr-converted.png -resize 512x512 -gravity center -extent 512x512 \
    \( -size 120x120 xc:white \) -gravity center -composite \
    \( -size 120x120 xc:none -draw "stroke white stroke-width 8 fill none rectangle 0,0 119,119" \) -gravity center -composite \
    \( -size 120x120 xc:none -draw "stroke #009279 stroke-width 4 fill none rectangle 2,2 117,117" \) -gravity center -composite \
    \( favicon.ico -resize 80x80 \) -gravity center -composite \
    icon-with-favicon.png

echo "Step 3: Adding full-width logo at bottom..."
magick icon-with-favicon.png \
    \( img/logo.png -resize 512x \) -gravity south -geometry +0+20 -composite \
    icon-512.png

echo "Step 4: Creating 192x192 version..."
magick icon-512.png -resize 192x192 icon-192.png

echo "Step 5: Cleaning up temporary files..."
rm -f qr-converted.png icon-with-favicon.png

echo "✅ PWA icons created successfully!"
echo "   - icon-192.png (192x192)"
echo "   - icon-512.png (512x512)"
echo ""
echo "Icons feature:"
echo "   - Teal (#009279) QR code background"
echo "   - Favicon in center square with double border"
echo "   - Serra ICT logo across bottom"