from flask import Flask, Response, jsonify
from flask_cors import CORS
from camera_service import CameraService
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize camera service
camera_service = CameraService(bin_type="dry", threshold=0.50)

@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(camera_service.generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/live')
def live():
    """Get latest detection result as JSON."""
    result = camera_service.get_latest_detection()
    return jsonify(result)

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({"status": "running", "service": "ML Camera Service"})

if __name__ == '__main__':
    print("🚀 Starting ML Camera Service on http://localhost:5001")
    print("📹 Video feed: http://localhost:5001/video_feed")
    print("📊 Live data: http://localhost:5001/live")
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)