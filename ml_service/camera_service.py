import cv2
import json
import numpy as np
from datetime import datetime
from pathlib import Path
import sys
import os

# Add the ML directory to Python path to import existing modules
ML_DIR = Path(__file__).parent.parent / "ML"
sys.path.append(str(ML_DIR))
sys.path.append(str(ML_DIR / "models"))

from ultralytics import YOLO

class CameraService:
    def __init__(self, bin_type="dry", threshold=0.50):
        self.bin_type = bin_type
        self.threshold = threshold
        self.snapshot_dir = Path("ml_service/snapshots")
        self.snapshot_dir.mkdir(parents=True, exist_ok=True)
        
        # Load YOLO model from ML directory
        model_path = ML_DIR / "models" / "best.pt"
        if not model_path.exists():
            model_path = ML_DIR / "yolo11s.pt"  # fallback
        
        print(f"Loading YOLO model from: {model_path}")
        self.model = YOLO(str(model_path))
        
        # Class mapping from existing ML setup
        self.class_map = {
            0: "dry",
            1: "wet"
        }
        
        # Initialize camera
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            print("Warning: Camera not accessible, using dummy mode")
            self.cap = None
        
        self.latest_result = {
            "class": None,
            "wet_dry": None,
            "confidence": 0.0,
            "is_violation": False
        }
    
    def save_snapshot(self, frame):
        """Save violation snapshot."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"violation_{timestamp}.jpg"
        filepath = self.snapshot_dir / filename
        cv2.imwrite(str(filepath), frame)
        return str(filepath)
    
    def detect_and_draw(self, frame):
        """Run YOLO detection and draw overlays."""
        results = self.model(frame, conf=self.threshold, verbose=False)
        detections = results[0].boxes
        
        violation = False
        detected_class = None
        confidence = 0.0
        
        if len(detections) > 0:
            # Get the most confident detection
            confidences = []
            classes = []
            
            for box in detections:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                waste_type = self.class_map[cls_id]
                
                confidences.append(conf)
                classes.append(waste_type)
                
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                # Check for violation
                wrong_bin = (waste_type != self.bin_type)
                if wrong_bin:
                    violation = True
                
                # Draw green box around object
                color = (0, 255, 0)  # Green box as per requirements
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
                
                # Draw label with confidence
                label = f"{waste_type.upper()} ({conf:.2f})"
                cv2.putText(frame, label, (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            
            # Get top detection
            if confidences:
                top_idx = confidences.index(max(confidences))
                detected_class = classes[top_idx]
                confidence = max(confidences)
        
        # Update latest result
        self.latest_result = {
            "class": detected_class,
            "wet_dry": detected_class,
            "confidence": round(confidence, 2),
            "is_violation": violation
        }
        
        return violation, frame, detected_class, confidence
    
    def draw_violation_alert(self, frame):
        """Draw violation overlay exactly as specified."""
        h, w, _ = frame.shape
        
        # Full-frame red border
        cv2.rectangle(frame, (0, 0), (w-1, h-1), (0, 0, 255), 15)
        
        # Big red text "VIOLATION DETECTED" at top
        text = "VIOLATION DETECTED"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 2.5
        thickness = 6
        color = (0, 0, 255)  # Red
        
        # Get text size to center it
        (text_width, text_height), _ = cv2.getTextSize(text, font, font_scale, thickness)
        text_x = (w - text_width) // 2
        text_y = 80
        
        cv2.putText(frame, text, (text_x, text_y), font, font_scale, color, thickness)
        
        return frame
    
    def get_frame(self):
        """Get a single frame with detection overlays."""
        if self.cap is None:
            # Create dummy frame for testing
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, "NO CAMERA", (200, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            return frame, False
        
        ret, frame = self.cap.read()
        if not ret:
            return None, False
        
        violation, frame, detected_class, confidence = self.detect_and_draw(frame)
        
        if violation:
            frame = self.draw_violation_alert(frame)
            # Save snapshot
            self.save_snapshot(frame)
        
        return frame, violation
    
    def generate_frames(self):
        """Generator for MJPEG stream."""
        while True:
            frame, violation = self.get_frame()
            if frame is None:
                continue
            
            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            # Yield frame in MJPEG format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    def get_latest_detection(self):
        """Get latest detection result as JSON."""
        return self.latest_result
    
    def __del__(self):
        if self.cap:
            self.cap.release()