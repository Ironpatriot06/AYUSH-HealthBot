from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

texts = [
    "Tulsi helps in cold and cough",
    "Neem purifies blood and is antibacterial",
    "Aloe vera used for skin treatment",
    "Cardamom is used as a spice and mouth freshener",
    "Ashwagandha helps in reducing stress",
]
labels = ["Medicinal", "Medicinal", "Medicinal", "Edible", "Medicinal"]

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)

X_train, X_test, y_train, y_test = train_test_split(X, labels, test_size=0.3, random_state=42)

clf = LogisticRegression(max_iter=200)
clf.fit(X_train, y_train)

preds = clf.predict(X_test)
print("Accuracy:", accuracy_score(y_test, preds))
print("Classification Report:")
print(classification_report(y_test, preds))
