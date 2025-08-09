🛡️ SafeGuard AI - Real-Time Moderated Chat
SafeGuard AI is a full-stack, real-time, peer-to-peer chat application with an integrated AI moderator that detects and flags toxic messages instantly. This project was built from the ground up to demonstrate a modern, serverless architecture for creating safer online communication tools.

If you find this project useful or interesting, please consider giving it a ⭐ star!

🚀 Live Demo
You can try the live application here:

https://safeguard-chat-app.vercel.app/

Note: You will need to add a screenshot of the app named screenshot.png to the repository for this image to display.

✨ Key Features
Real-Time P2P Chat: Instant messaging between users built on Google Firestore.

AI-Powered Moderation: Every message is analyzed by a fine-tuned BERT model to detect toxicity, with a warning flag (⚠️) applied to harmful content.

Responsive UI: A clean and modern user interface built with Tailwind CSS that works on all screen sizes.

Dark & Light Themes: A theme switcher that saves user preference in their browser.

User Authentication: Secure sign-up and login functionality handled by Firebase.

Chat Management: Users can view a list of all their conversations and delete chat histories.

🛠️ Tech Stack & Architecture
This project uses a modern, serverless architecture to ensure scalability and performance.

Frontend:

HTML5

Tailwind CSS

Vanilla JavaScript (ES6 Modules)

Deployment: Vercel

Backend (Serverless):

Database & Auth: Google Firestore for real-time data synchronization and user authentication.

AI Model & API:

Model: Fine-tuned bert-base-uncased model using PyTorch & Hugging Face Transformers.

API Framework: FastAPI

Deployment: Hugging Face Spaces

📊 Model Performance
The integrated BERT model was fine-tuned on a balanced dataset of over 115,000 samples and achieves excellent performance:

Overall Accuracy: 93%

Recall (for Bullying): 96%

Precision (for Bullying): 90%

⚙️ Getting Started
To run this project locally, follow these steps:

Prerequisites
A modern web browser.

A Firebase project with Authentication and Firestore enabled.

A deployed model API on Hugging Face Spaces.

Local Setup
Clone the repository:

git clone https://github.com/Dipanshu7777/safeguard-chat-app.git
cd safeguard-chat-app

Configure Firebase:

Open the script.js file.

Find the firebaseConfig object and replace the placeholder values with your own Firebase project's configuration keys.

Configure the Model API:

In script.js, find the API_URL constant.

Replace the placeholder with the URL of your deployed Hugging Face Spaces API.

Run the application:

The easiest way to run the project locally and avoid CORS errors is to use a simple live server. If you have VS Code, the "Live Server" extension is a great option.

📄 License
This project is distributed under the MIT License. See LICENSE for more information.
