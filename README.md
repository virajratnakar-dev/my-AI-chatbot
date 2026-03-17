
# 🤖 Viraj's AI Chat App

A modern, browser-based AI chat application with authentication, multi-chat support, customizable response styles, and usage tiers.

✨ Features

🔐 User Authentication

Login & Register system

Google Sign-In integration

💬 Multi-Chat System

Create, rename, and delete conversations

Persistent chat history (via backend API)

🎨 Custom Chat Styles

Formal

Normal

Informal

⚡ Real-time Messaging UI

Smooth animations

Typing indicator

🎟️ Promo Code System

Unlock Pro / Plus tiers

📊 Usage Limits

Normal users: 30 messages

Google users: 50 messages

Plus users: 100 messages

Pro users: Unlimited

🔑 Promo Codes
Code	Tier	Benefits
113411	Pro -	Unlimited messages
155411	Plus -	100 message limit
🧠 How It Works

User logs in or registers

App unlocks chat interface

User creates a chat session

Messages are:

Stored locally (UI state)

Sent to backend (/api/ask)

AI responds based on:

Conversation history

Selected tone/style

📁 Project Structure
index.html   # Main app (UI + logic)
README.md    # Project documentation
⚠️ Important Notes

This project requires a backend to function fully.

Google Sign-In requires a valid OAuth Client ID.

Chat persistence depends on /api/chats.

🔮 Future Improvements

✅ Dark/light mode toggle

✅ Streaming AI responses

✅ File uploads

✅ Voice input

✅ Better mobile UI

👤 Author

Viraj

📜 License

This project is open-source. Feel free to modify and use it.
