from flask import Flask, Response, jsonify, send_from_directory
from flask_cors import CORS
import camera_service
import os

app = Flask(__name__)
CORS(app)

# Initialize camera service
camera_service_instance = camera_service.CameraService(bin_type="dry", threshold=0.50)

@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(camera_service_instance.generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route("/live")
def live():
    result = camera_service.get_last_detection() or {}
    return jsonify({
        "class": result.get("class"),
        "wet_dry": result.get("wet_dry"),
        "confidence": result.get("confidence") or 0.0,
        "is_violation": bool(result.get("is_violation")),
        "snapshot_path": result.get("snapshot_path")
    })

@app.route("/snapshots/<path:filename>")
def snapshot_file(filename):
    folder = os.path.join(os.path.dirname(__file__), "snapshots")
    return send_from_directory(folder, filename)

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({"status": "running", "service": "ML Camera Service"})

if __name__ == '__main__':
    print("🚀 Starting ML Camera Service on http://localhost:5001")
    print("📹 Video feed: http://localhost:5001/video_feed")
    print("📊 Live data: http://localhost:5001/live")
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)