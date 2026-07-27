import sys
import os
import json
import joblib

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input text provided"}))
        return
        
    text_input = sys.argv[1].strip()
    if not text_input:
        print(json.dumps({"error": "Empty input text"}))
        return
        
    models_dir = os.path.dirname(os.path.abspath(__file__))
    # Adjust models_dir if it's placed in backend/scripts/ or backend/utils/
    # The models are saved in backend/models/
    models_path = os.path.join(models_dir, "..", "models")
    
    title_vec_path = os.path.join(models_path, "title_vectorizer.pkl")
    title_clf_path = os.path.join(models_path, "title_classifier.pkl")
    exp_vec_path = os.path.join(models_path, "exp_vectorizer.pkl")
    exp_clf_path = os.path.join(models_path, "exp_classifier.pkl")
    
    if not (os.path.exists(title_vec_path) and os.path.exists(title_clf_path)):
        print(json.dumps({"error": f"Model artifacts not found in {models_path}"}))
        return
        
    try:
        # Load vectorizers and models
        title_vectorizer = joblib.load(title_vec_path)
        title_classifier = joblib.load(title_clf_path)
        exp_vectorizer = joblib.load(exp_vec_path)
        exp_classifier = joblib.load(exp_clf_path)
        
        # Vectorize input text
        title_features = title_vectorizer.transform([text_input.lower()])
        exp_features = exp_vectorizer.transform([text_input.lower()])
        
        # Predict
        predicted_title = title_classifier.predict(title_features)[0]
        predicted_exp = exp_classifier.predict(exp_features)[0]
        
        # Output JSON
        result = {
          "predictedTitle": predicted_title,
          "predictedExperienceLevel": predicted_exp
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
