  
##################################################

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from deepface import DeepFace
from pymongo import MongoClient
from scipy.spatial.distance import cosine
import os
from dotenv import load_dotenv


app = Flask(__name__)
load_dotenv()
# Allow requests only from your local React app and your deployed Vercel app
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS(app, origins=[FRONTEND_URL, "http://localhost:5173"])

# ======================================================
# MONGODB CONFIGURATION 
# ======================================================

# db string
MONGO_URI = os.getenv("MONGO_URI")


client = MongoClient(MONGO_URI)
#db = client.get_default_database()
db = client['attendance_db']
students_collection = db['students'] 


known_embeddings = {}

def load_embeddings_from_db():
    """Loads all student embeddings from MongoDB into RAM on startup/sync."""
    global known_embeddings
    known_embeddings.clear()
    print("🔄 Syncing embeddings from MongoDB...")
    
    # Find all students that actually have the 'embedding' array field
    students = students_collection.find({"embedding": {"$exists": True}})
    count = 0
    for student in students:
        urn = student.get("urn")
        embedding = student.get("embedding")
        if urn and embedding:
            known_embeddings[urn] = np.array(embedding)
            count += 1
            
    print(f"✅ Loaded {count} faces into memory.")

    
print("⏬ Pre-loading GhostFaceNet model weights...")
DeepFace.build_model("GhostFaceNet")
# Load embeddings immediately when the server starts
load_embeddings_from_db()

def decode_image(image_data):
    """Convert Base64 string to OpenCV Image."""
    try:
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]
        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

# ======================================================
# ROUTE: ENROLL (Extracts Math, Saves to MongoDB)
# ======================================================
@app.route('/enroll', methods=['POST'])
def enroll():
    try:
        data = request.json
        urn = data.get('urn')
        image_data = data.get('image')

        if not urn or not image_data:
            return jsonify({"message": "Missing URN or Image"}), 400

        img = decode_image(image_data)
        if img is None:
            return jsonify({"message": "Invalid Image Data"}), 400

        # 1. Extract the Mathematical Embedding (No file saving!)
        try:
            results = DeepFace.represent(
                img_path=img, 
                model_name="GhostFaceNet", 
                enforce_detection=True
            )
            embedding = results[0]["embedding"]
        except Exception as e:
            return jsonify({"message": "No face detected. Please ensure good lighting and look at the camera."}), 400

        # 2. Update the Student document in MongoDB with the embedding
        students_collection.update_one(
            {"urn": urn},
            {"$set": {"embedding": embedding}}
        )

        # 3. Update the lightning-fast local cache
        known_embeddings[urn] = np.array(embedding)

        return jsonify({"message": f"Biometrics secured and saved to database for {urn}!"}), 200

    except Exception as e:
        print("Error during enrollment:", str(e))
        return jsonify({"message": "Server error during biometric enrollment"}), 500

# ======================================================
# ROUTE: RECOGNIZE (Math Comparison - Blazing Fast)
# ======================================================
@app.route("/recognize", methods=["POST"])
def recognize():
    data = request.get_json() or {}
    image_data = data.get("image")

    if not image_data:
        return jsonify({"urn": "No image"}), 400
    
    if not known_embeddings:
        return jsonify({"urn": "No trained data"}), 200

    try:
        img = decode_image(image_data)
        if img is None:
            return jsonify({"urn": "Invalid Image"}), 400

        # 1. Extract embedding from the LIVE webcam frame
        results = DeepFace.represent(
            img_path=img, 
            model_name="GhostFaceNet", 
            enforce_detection=False
        )
        live_embedding = results[0]["embedding"]

        # 2. Find the best match using Vector Math (Cosine Distance)
        best_match_urn = "Unknown"
        min_distance = float('inf')
        
        # DeepFace GhostFaceNet threshold is roughly 0.65. Lower is stricter.
        THRESHOLD = 0.60 

        for urn, known_emb in known_embeddings.items():
            distance = cosine(live_embedding, known_emb)
            if distance < min_distance:
                min_distance = distance
                best_match_urn = urn

        if min_distance <= THRESHOLD:
            print(f"✅ Match: {best_match_urn} (Dist: {min_distance:.4f})")
            return jsonify({"urn": best_match_urn, "confidence": float(1 - min_distance)})
        else:
            return jsonify({"urn": "Unknown"}), 200

    except ValueError:
        # DeepFace raises ValueError if no face is found in the frame
        return jsonify({"urn": "No face detected"}), 200
    except Exception as e:
        print(f"❌ Recognition Error: {e}")
        return jsonify({"urn": "Error", "details": str(e)}), 500

# ======================================================
# ROUTE: SYNC
# ======================================================
@app.route('/sync', methods=['POST'])
def sync_faces():
    try:
        load_embeddings_from_db()
        return jsonify({"message": "Cache successfully synced with MongoDB!"}), 200
    except Exception as e:
        print("Sync Error:", str(e))
        return jsonify({"message": "Server error during sync."}), 500

# ======================================================
# ROUTE: DELETE
# ======================================================
@app.route("/delete", methods=["POST"])
def delete_student():
    data = request.get_json() or {}
    urn = data.get("urn")

    if not urn:
        return jsonify({"message": "URN required"}), 400

    try:
        # 1. Remove the embedding array from MongoDB
        students_collection.update_one(
            {"urn": urn},
            {"$unset": {"embedding": ""}}
        )
        
        # 2. Remove from local cache
        if urn in known_embeddings:
            del known_embeddings[urn]
            
        return jsonify({"message": f"Biometrics wiped for {urn}"}), 200
    except Exception as e:
        return jsonify({"message": f"Error deleting: {str(e)}"}), 500

if __name__ == "__main__":
    # Grab Render's assigned port, or default to 5000 locally
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)