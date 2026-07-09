import os
from flask import Flask, request, jsonify, render_template
from parser import extract_resume_details
from database import get_db_connection

app = Flask(__name__)

# -----------------------
# Upload folder setup
# -----------------------
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# -----------------------
# Home route
# -----------------------
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/interview")
def interview():
    return render_template("interview.html")

# -----------------------
# Upload + Parse + Store
# -----------------------
@app.route("/upload", methods=["POST"])
def upload_resume():

    try:
        if "resume" not in request.files:
            return jsonify({"error": "No file uploaded"})

        file = request.files["resume"]

        if file.filename == "":
            return jsonify({"error": "No file selected"})

        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        print("File saved:", filepath)

        details = extract_resume_details(filepath)
        print("Extracted Details:")

        print(details)

        return jsonify({
            "message": "Parsing successful",
            "data": details
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

# -----------------------
# Run server
# -----------------------
if __name__ == "__main__":
    app.run(debug=True)