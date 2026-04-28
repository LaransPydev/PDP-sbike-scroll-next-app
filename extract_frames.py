import cv2
import os
import glob

video_path = 'public/0824.png0001-1121.mkv'
output_dir = 'public/frames/'

os.makedirs(output_dir, exist_ok=True)

# Delete existing frames
print(f"Cleaning up old frames in {output_dir}...")
existing_frames = glob.glob(os.path.join(output_dir, '*.jpg'))
for f in existing_frames:
    try:
        os.remove(f)
    except Exception as e:
        print(f"Error deleting file {f}: {e}")

print(f"Reading video from {video_path}...")
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("Error: Could not open video file.")
    exit(1)

count = 0
success = True

print(f"Extracting frames to {output_dir}...")
while success:
    success, image = cap.read()
    if success:
        # Resize if width is larger than 1920 to save memory and size, maintaining aspect ratio
        height, width = image.shape[:2]
        if width > 1920:
            scale = 1920 / width
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)

        filename = os.path.join(output_dir, f"frame{(count+1):04d}.jpg")
        cv2.imwrite(filename, image, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        count += 1
        
        if count % 50 == 0:
            print(f"Extracted {count} frames...")

print(f"Successfully extracted {count} frames total.")
cap.release()
