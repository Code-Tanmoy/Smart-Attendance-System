

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
import base64
import shutil
import uuid  # To generate unique filenames
from deepface import DeepFace

app = Flask(__name__)
CORS(app)

# ======================================================
# CONFIGURATION
# ======================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FACES_DIR = os.path.join(BASE_DIR, "faces")
os.makedirs(FACES_DIR, exist_ok=True)

# Delete cache on startup to force a refresh of the model
pkl_path = os.path.join(FACES_DIR, "representations_vgg_face.pkl")
if os.path.exists(pkl_path):
    os.remove(pkl_path)

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
# ROUTE: ENROLL (Saves to faces folder)
# ======================================================
@app.route('/enroll', methods=['POST'])
def enroll():
    try:
        data = request.json
        urn = data.get('urn')
        image_data = data.get('image')

        if not urn or not image_data:
            return jsonify({"message": "Missing URN or Image"}), 400

        # Decode base64 image
        encoded_data = image_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Save temporarily for checking
        temp_path = f"temp_{urn}.jpg"
        cv2.imwrite(temp_path, img)

        # 🛡️ SECURITY CHECK: Does this face already exist?
        try:
            results = DeepFace.find(img_path=temp_path, db_path="faces", enforce_detection=True, silent=True)
            
            if len(results) > 0 and not results[0].empty:
                os.remove(temp_path) # Clean up temp file
                return jsonify({
                    "message": "Biometric Conflict: This face is already registered"
                }), 403
                
        except ValueError:
            pass # Empty DB, perfectly fine for the first student
        except Exception as e:
            pass

        # ✅ THE FIX: Create a dedicated folder for this URN
        person_dir = os.path.join(FACES_DIR, urn)
        os.makedirs(person_dir, exist_ok=True)
        
        # Save the image inside their specific folder
        final_path = os.path.join(person_dir, f"{urn}.jpg")
        cv2.imwrite(final_path, img)
        os.remove(temp_path) # Clean up temp file

        return jsonify({"message": f"Successfully enrolled face for URN {urn}"}), 200

    except Exception as e:
        print("Error during enrollment:", str(e))
        return jsonify({"message": "Server error during face enrollment"}), 500


# ======================================================
# ROUTE: RECOGNIZE (DeepFace with Race Condition Fix)
# ======================================================
@app.route("/recognize", methods=["POST"])
def recognize():
    data = request.get_json() or {}
    image_data = data.get("image")

    if not image_data:
        return jsonify({"urn": "No image"}), 400
    
    # Check if we have any students enrolled
    if not os.listdir(FACES_DIR):
        return jsonify({"urn": "No trained data"}), 200

    # 🟢 FIX: Generate a unique filename for this specific request
    # This prevents errors when multiple requests happen simultaneously
    unique_filename = f"temp_{uuid.uuid4()}.jpg"
    temp_path = os.path.join(BASE_DIR, unique_filename)

    try:
        # 1. Save current frame temporarily
        img = decode_image(image_data)
        if img is None:
            return jsonify({"urn": "Invalid Image"}), 400
            
        cv2.imwrite(temp_path, img)

        # 2. Run DeepFace Find
        # enforce_detection=False prevents crash if no face is found in frame
        results = DeepFace.find(
            img_path=temp_path, 
            db_path=FACES_DIR, 
            model_name="VGG-Face",
            enforce_detection=False,
            silent=True
        )

        # 3. Process Result
        if len(results) > 0 and not results[0].empty:
            match = results[0].iloc[0] # Get the top match
            identity_path = match['identity'] 
            
            # Extract URN from folder name
            urn = os.path.basename(os.path.dirname(identity_path))
            distance = match['distance']
            
            # Threshold (0.40 is standard for VGG-Face; lower is stricter)
            if distance < 0.40:
                print(f"✅ Match: {urn} (Dist: {distance:.4f})")
                return jsonify({"urn": urn, "confidence": float(1 - distance)})
            else:
                return jsonify({"urn": "Unknown"}), 200
        
        return jsonify({"urn": "Unknown"}), 200

    except Exception as e:
        print(f"❌ Recognition Error: {e}")
        return jsonify({"urn": "Error", "details": str(e)}), 500

    finally:
        # 🟢 FIX: Always remove the temporary file, even if code crashes
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as cleanup_error:
                print(f"⚠️ Could not remove temp file: {cleanup_error}")

#================================
#scan
#==================================
@app.route('/sync', methods=['POST'])
def sync_faces():
    try:
        # Path to the DeepFace memory cache
        pkl_path = os.path.join("faces", "representations_vgg_face.pkl")
        
        # If the cache exists, delete it so it forces a rebuild on the next scan
        if os.path.exists(pkl_path):
            os.remove(pkl_path)
            return jsonify({"message": "Cache cleared! New faces are now synced."}), 200
        else:
            return jsonify({"message": "Cache is already fresh. No sync needed."}), 200
            
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

    person_dir = os.path.join(FACES_DIR, urn)
    
    if os.path.exists(person_dir):
        try:
            shutil.rmtree(person_dir)
            
            # Clear cache to remove embeddings
            pkl_path = os.path.join(FACES_DIR, "representations_vgg_face.pkl")
            if os.path.exists(pkl_path):
                os.remove(pkl_path)
                
            return jsonify({"message": f"Deleted {urn}"}), 200
        except Exception as e:
            return jsonify({"message": f"Error deleting: {str(e)}"}), 500
    
    return jsonify({"message": "Student not found"}), 404


if __name__ == "__main__":
    # Debug=True is useful for development but should be False in production
    app.run(port=5000, debug=True)

