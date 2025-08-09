# 🛡️ SafeGuard AI — Real-Time Moderated Chat

**SafeGuard AI** is a **full-stack, real-time, peer-to-peer chat application** with an **integrated AI moderator** that detects and flags toxic messages instantly.  
Built from the ground up, this project demonstrates a **modern, serverless architecture** for creating **safer online communication tools**.

If you find this project useful or interesting, please consider giving it a ⭐ **star**!

---

## 🚀 Live Demo  
🔗 **[Try the Application](https://safeguard-chat-app.vercel.app/)**  

> **Note:** Add your screenshot named `Safegaurd.png` to the repository for the preview image to display here.

---

## ✨ Key Features  

- **💬 Real-Time P2P Chat** — Instant messaging powered by **Google Firestore**.  
- **🤖 AI-Powered Moderation** — Each message is analyzed by a **fine-tuned BERT model** to detect toxicity, with ⚠️ warnings for harmful content.  
- **📱 Responsive UI** — Clean, modern design with **Tailwind CSS** that works seamlessly on all devices.  
- **🌓 Dark & Light Modes** — Theme switcher with saved preferences in the browser.  
- **🔐 User Authentication** — Secure sign-up/login with **Firebase Auth**.  
- **🗑️ Chat Management** — View all conversations and delete histories at any time.  

---

## 🛠 Tech Stack & Architecture  

**Frontend**  
- HTML5  
- Tailwind CSS  
- Vanilla JavaScript (ES6 Modules)  
- **Deployment:** Vercel  

**Backend (Serverless)**  
- **Database & Auth:** Google Firestore  
- **Real-Time Sync:** Firebase Realtime Updates  

**AI Model & API**  
- **Model:** Fine-tuned `bert-base-uncased` using **PyTorch** + Hugging Face Transformers  
- **API Framework:** FastAPI  
- **Deployment:** Hugging Face Spaces  

---

## 📊 Model Performance  

| Metric                  | Score |
|-------------------------|-------|
| **Overall Accuracy**    | 93%   |
| **Recall (Bullying)**   | 96%   |
| **Precision (Bullying)**| 90%   |

**Dataset:** Balanced dataset of **115,000+ samples**.  
**Training:** Optimized for real-time classification in chat environments.

---

## ⚙️ Getting Started  

### **Prerequisites**
- A modern web browser  
- Firebase project with Authentication + Firestore enabled  
- Deployed model API on Hugging Face Spaces  

---

### **Local Setup**  

1️⃣ **Clone the repository**  
```bash
git clone https://github.com/Dipanshu7777/safeguard-chat-app.git
cd safeguard-chat-app
