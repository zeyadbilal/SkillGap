import os

from flask import Flask, jsonify, request

try:
    from .engine import analyze_cv
except ImportError:  # Allows `python app.py` from model/service.
    from engine import analyze_cv


def create_app():
    app = Flask(__name__)

    @app.post("/analyze")
    def analyze():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Request body must be JSON", "errorCode": "INVALID_CV_TEXT"}), 400
        unsupported_fields = sorted(set(payload) - {"cvText", "track"})
        if unsupported_fields:
            return jsonify({
                "error": f"Unsupported field(s): {', '.join(unsupported_fields)}",
                "errorCode": "VALIDATION_ERROR",
            }), 400
        try:
            return jsonify(analyze_cv(payload)), 200
        except ValueError as error:
            return jsonify({"error": str(error), "errorCode": "INVALID_CV_TEXT"}), 400
        except Exception:
            app.logger.exception("Model analysis failed")
            return jsonify({"error": "Model analysis failed", "errorCode": "MODEL_INTERNAL"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host=os.getenv("MODEL_HOST", "0.0.0.0"), port=int(os.getenv("MODEL_PORT", "5001")))
