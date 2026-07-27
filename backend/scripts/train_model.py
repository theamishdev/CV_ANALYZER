import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

def clean_experience_level(level):
    if not isinstance(level, str):
        return 'Mid-Level'
    level = level.strip().lower()
    if level in ['fresher', 'entry-level', 'junior']:
        return 'Entry-Level'
    elif level in ['experienced', 'mid-level', 'mid-senior level', 'mid-senior', 'mid-level']:
        return 'Mid-Level'
    elif level in ['senior-level', 'senior', 'lead']:
        return 'Senior-Level'
    else:
        return 'Mid-Level'

def clean_years_of_experience(years):
    if not isinstance(years, str):
        return 0.0
    years = years.replace('', '-').replace(' year', '').replace('s', '').strip().lower()
    if years == '0':
        return 0.0
    if '+' in years:
        try:
            return float(years.replace('+', '').strip())
        except ValueError:
            return 3.0
    if '-' in years:
        parts = years.split('-')
        try:
            return (float(parts[0]) + float(parts[1])) / 2.0
        except (ValueError, IndexError):
            return 1.0
    try:
        return float(years)
    except ValueError:
        return 2.0

def main():
    print("Starting dataset cleaning and model training...")
    
    # 1. Load dataset
    csv_path = "c:/Users/Amish Verma/Desktop/Home/Projects/CV ANalyzer/job_dataset.csv"
    if not os.path.exists(csv_path):
        print(f"Error: dataset not found at {csv_path}")
        return
        
    df = pd.read_csv(csv_path)
    
    # 2. Clean data
    df = df.dropna(subset=['Title'])
    df['Clean_ExperienceLevel'] = df['ExperienceLevel'].apply(clean_experience_level)
    df['Clean_YearsOfExperience'] = df['YearsOfExperience'].apply(clean_years_of_experience)
    
    # Combine Skills and Keywords for text classification features
    df['TextFeatures'] = df['Skills'].fillna('') + " " + df['Keywords'].fillna('')
    df['TextFeatures'] = df['TextFeatures'].str.lower()
    
    print(f"Cleaned dataset shape: {df.shape}")
    print(f"Experience Level breakdown:\n{df['Clean_ExperienceLevel'].value_counts()}")
    
    # Save cleaned dataset for reference
    cleaned_csv_path = "c:/Users/Amish Verma/Desktop/Home/Projects/CV ANalyzer/cleaned_job_dataset.csv"
    df.to_csv(cleaned_csv_path, index=False)
    print(f"Saved cleaned dataset to {cleaned_csv_path}")

    # 3. Model 1: Job Title Classifier
    print("\n--- Training Job Title Classifier ---")
    X = df['TextFeatures']
    y_title = df['Title']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y_title, test_size=0.2, random_state=42)
    
    vectorizer = TfidfVectorizer(max_features=2500, stop_words='english')
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    title_model = LogisticRegression(max_iter=500, C=1.0)
    title_model.fit(X_train_vec, y_train)
    
    y_pred = title_model.predict(X_test_vec)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Job Title Model Accuracy: {accuracy:.4f}")
    
    # 4. Model 2: Experience Level Classifier
    print("\n--- Training Experience Level Classifier ---")
    y_exp = df['Clean_ExperienceLevel']
    
    X_train_exp, X_test_exp, y_train_exp, y_test_exp = train_test_split(X, y_exp, test_size=0.2, random_state=42)
    
    exp_vectorizer = TfidfVectorizer(max_features=1500, stop_words='english')
    X_train_exp_vec = exp_vectorizer.fit_transform(X_train_exp)
    X_test_exp_vec = exp_vectorizer.transform(X_test_exp)
    
    exp_model = LogisticRegression(max_iter=500, C=1.0)
    exp_model.fit(X_train_exp_vec, y_train_exp)
    
    y_pred_exp = exp_model.predict(X_test_exp_vec)
    exp_accuracy = accuracy_score(y_test_exp, y_pred_exp)
    print(f"Experience Level Model Accuracy: {exp_accuracy:.4f}")

    # 5. Save model artifacts
    models_dir = "c:/Users/Amish Verma/Desktop/Home/Projects/CV ANalyzer/backend/models"
    os.makedirs(models_dir, exist_ok=True)
    
    joblib.dump(vectorizer, os.path.join(models_dir, "title_vectorizer.pkl"))
    joblib.dump(title_model, os.path.join(models_dir, "title_classifier.pkl"))
    joblib.dump(exp_vectorizer, os.path.join(models_dir, "exp_vectorizer.pkl"))
    joblib.dump(exp_model, os.path.join(models_dir, "exp_classifier.pkl"))
    
    print("\nAll models and vectorizers trained and saved successfully in backend/models/!")

if __name__ == "__main__":
    main()
