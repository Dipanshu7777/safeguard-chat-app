import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, collection, getDocs, query,
    addDoc, serverTimestamp, onSnapshot, orderBy, deleteDoc, writeBatch, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- CONFIGURATION ---
const firebaseConfig = { 
    apiKey: "AIzaSyCigAZ0kMKzAwfi6i9cYS5bRppZ9-NvZ8c", 
    authDomain: "safeguard-chat-9bc8d.firebaseapp.com", 
    projectId: "safeguard-chat-9bc8d", 
    storageBucket: "safeguard-chat-9bc8d.firebasestorage.app", 
    messagingSenderId: "821851058680", 
    appId: "1:821851058680:web:869061bec3be3afe66a60d", 
    measurementId: "G-9ZV3X87H6C" 
};
const API_URL = "https://dez2work9876-safeguard-api.hf.space/predict";

// --- INITIALIZATION ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- GLOBAL VARIABLES ---
let currentChatRoomId = null;
let unsubscribeMessages = null;
let allUsers = {};

// --- DOM ELEMENTS ---
const authPage = document.getElementById('auth-page');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutButton = document.getElementById('logout-button');
const currentUserEmailDisplay = document.getElementById('current-user-email');
const currentUserAvatar = document.getElementById('current-user-avatar');
const messageForm = document.getElementById('message-form');
const messagesContainer = document.getElementById('messages-container');
const chatPage = document.getElementById('chat-page');
const welcomeScreen = document.getElementById('welcome-screen');
const chatWithEmail = document.getElementById('chat-with-email');
const chatWithAvatar = document.getElementById('chat-with-avatar');
const chatsTabButton = document.getElementById('chats-tab-button');
const usersTabButton = document.getElementById('users-tab-button');
const chatsListContainer = document.getElementById('chats-list-container');
const usersListContainer = document.getElementById('users-list-container');

// --- EVENT LISTENERS ---
signupForm.addEventListener('submit', handleSignup);
loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', () => signOut(auth));
messageForm.addEventListener('submit', handleSendMessage);
chatsTabButton.addEventListener('click', () => switchTab('chats'));
usersTabButton.addEventListener('click', () => switchTab('users'));
    
// --- THEME LOGIC ---
function applyTheme(theme, toggleElement) {
    const html = document.documentElement;
    // If the theme is LIGHT, we REMOVE the dark class and CHECK the toggle.
    if (theme === 'light') {
        html.classList.remove('dark');
        if (toggleElement) toggleElement.checked = true;
    } else { // Otherwise, the theme is DARK, so we ADD the dark class and UNCHECK the toggle.
        html.classList.add('dark');
        if (toggleElement) toggleElement.checked = false;
    }
}

// Set initial theme on page load
const savedTheme = localStorage.getItem("theme") || 'dark';
applyTheme(savedTheme, null);


// --- AUTHENTICATION ---
onAuthStateChanged(auth, user => {
    if (user) {
        authPage.style.display = 'none';
        mainApp.style.display = 'flex';
        updateUserInfo(user);
        fetchAllUsersAndChats(user.uid);

        const themeToggle = document.getElementById('theme-toggle');
        // Sync toggle with current theme
        applyTheme(localStorage.getItem("theme") || 'dark', themeToggle);
        // Add listener for theme changes
        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme, themeToggle);
        });

    } else {
        authPage.style.display = 'flex';
        mainApp.style.display = 'none';
        // Cleanup when logged out
        if (unsubscribeMessages) unsubscribeMessages();
        currentChatRoomId = null;
    }
});

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    document.getElementById('signup-error').textContent = '';
    document.getElementById('signup-success').textContent = '';
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
            email: cred.user.email,
            uid: cred.user.uid
        });
        document.getElementById('signup-success').textContent = 'Account created successfully!';
    } catch (error) {
        document.getElementById('signup-error').textContent = error.message;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    document.getElementById('login-error').textContent = '';
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        document.getElementById('login-error').textContent = error.message;
    }
}

// --- UI FUNCTIONS ---
function updateUserInfo(user) {
    currentUserEmailDisplay.textContent = user.email;
    currentUserAvatar.textContent = user.email.substring(0, 2).toUpperCase();
}

function switchTab(tabName) {
    if (tabName === 'chats') {
        chatsListContainer.classList.remove('hidden');
        usersListContainer.classList.add('hidden');
        chatsTabButton.classList.add('tab-active');
        usersTabButton.classList.remove('tab-active');
    } else {
        chatsListContainer.classList.add('hidden');
        usersListContainer.classList.remove('hidden');
        chatsTabButton.classList.remove('tab-active');
        usersTabButton.classList.add('tab-active');
    }
}

// --- DATA FETCHING AND DISPLAY ---
async function fetchAllUsersAndChats(currentUserId) {
    const usersQuery = query(collection(db, "users"));
    const usersSnapshot = await getDocs(usersQuery);
    allUsers = {};
    usersSnapshot.forEach(doc => {
        allUsers[doc.id] = doc.data();
    });
    displayAllUsers(currentUserId);
    listenForChatRooms(currentUserId);
}

function displayAllUsers(currentUserId) {
    usersListContainer.innerHTML = '';
    Object.values(allUsers).forEach(userData => {
        if (userData.uid !== currentUserId) {
            const userElement = document.createElement('div');
            userElement.className = 'p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer';
            const initials = userData.email.substring(0, 2).toUpperCase();
            userElement.innerHTML = `
                <div class="flex items-center min-w-0">
                    <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-600 flex items-center justify-center font-bold text-slate-600 dark:text-gray-300 mr-3 flex-shrink-0">${initials}</div>
                    <p class="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">${userData.email}</p>
                </div>
                <button class="start-chat-btn bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-semibold flex-shrink-0">Chat</button>
            `;
            userElement.querySelector('.start-chat-btn').addEventListener('click', () => openChat(userData));
            usersListContainer.appendChild(userElement);
        }
    });
}

function listenForChatRooms(currentUserId) {
    const chatRoomsRef = collection(db, "chat_rooms");
    onSnapshot(chatRoomsRef, (snapshot) => {
        const myChats = [];
        snapshot.forEach(doc => {
            if (doc.id.includes(currentUserId)) {
                myChats.push(doc.id);
            }
        });
        displayMyChats(myChats, currentUserId);
    });
}

function displayMyChats(chatRoomIds, currentUserId) {
    chatsListContainer.innerHTML = '';
    if (chatRoomIds.length === 0) {
        chatsListContainer.innerHTML = '<p class="text-slate-500 dark:text-slate-400 text-center p-4 text-sm">No active chats. Start one from "All Users".</p>';
        return;
    }
    chatRoomIds.forEach(roomId => {
        const otherUserId = roomId.replace(currentUserId, '').replace('_', '');
        const otherUser = allUsers[otherUserId];
        if (otherUser) {
            const chatElement = document.createElement('div');
            chatElement.className = 'p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer';
            const initials = otherUser.email.substring(0, 2).toUpperCase();
            chatElement.innerHTML = `
                <div class="flex items-center flex-grow min-w-0">
                    <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-600 flex items-center justify-center font-bold text-slate-600 dark:text-gray-300 mr-3 flex-shrink-0">${initials}</div>
                    <p class="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">${otherUser.email}</p>
                </div>
                <button class="delete-chat-btn p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 ml-2 flex-shrink-0">
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
            chatElement.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-chat-btn')) {
                    openChat(otherUser);
                }
            });
            chatElement.querySelector('.delete-chat-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(roomId);
            });
            chatsListContainer.appendChild(chatElement);
        }
    });
}

// --- CHAT LOGIC ---
async function deleteChat(roomId) {
    if (confirm("Are you sure you want to delete this entire chat history? This cannot be undone.")) {
        try {
            const messagesRef = collection(db, "chat_rooms", roomId, "messages");
            const messagesSnapshot = await getDocs(messagesRef);
            const batch = writeBatch(db);
            messagesSnapshot.forEach(doc => {
                batch.delete(doc.ref)
            });
            await batch.commit();
            await deleteDoc(doc(db, "chat_rooms", roomId));
            welcomeScreen.style.display = 'flex';
            chatPage.style.display = 'none';
        } catch (error) {
            console.error("Error deleting chat: ", error);
            alert("Failed to delete chat. Please try again.");
        }
    }
}

function openChat(otherUser) {
    welcomeScreen.style.display = 'none';
    chatPage.style.display = 'flex';
    chatWithEmail.textContent = otherUser.email;
    chatWithAvatar.textContent = otherUser.email.substring(0, 2).toUpperCase();
    const currentUser = auth.currentUser;
    const chatRoomId = [currentUser.uid, otherUser.uid].sort().join('_');
    currentChatRoomId = chatRoomId;
    listenForMessages(currentChatRoomId);
}

async function handleSendMessage(e) {
    e.preventDefault();
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    const currentUser = auth.currentUser;
    if (messageText && currentUser && currentChatRoomId) {
        messageInput.value = ''; // Clear input immediately for better UX
        const messageData = {
            text: messageText,
            senderId: currentUser.uid,
            createdAt: serverTimestamp(),
            isToxic: 'checking'
        };
        try {
            const messageRef = await addDoc(collection(db, "chat_rooms", currentChatRoomId, "messages"), messageData);
            const isToxic = await analyzeMessageToxicity(messageText);
            await updateDoc(messageRef, {
                isToxic: isToxic
            });
        } catch (error) {
            console.error("Error sending message:", error);
            // Optionally, add the message back to the input to allow user to retry
            messageInput.value = messageText; 
        }
    }
}

async function analyzeMessageToxicity(text) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "text": text })
        });
        if (!response.ok) {
            console.error("API Error:", response.statusText);
            return false;
        }
        const result = await response.json();
        return result.label === 'Bullying';
    } catch (error) {
        console.error("Error analyzing toxicity:", error);
        return false; // Default to not toxic if API fails
    }
}

function listenForMessages(chatRoomId) {
    if (unsubscribeMessages) {
        unsubscribeMessages();
    }
    const q = query(collection(db, "chat_rooms", chatRoomId, "messages"), orderBy("createdAt"));
    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = '';
        if (snapshot.empty) {
            messagesContainer.innerHTML = '<p class="text-center text-slate-500 dark:text-slate-400">No messages yet. Say hi!</p>';
            return;
        }
        snapshot.forEach(doc => {
            messagesContainer.appendChild(createMessageElement(doc.data(), auth.currentUser.uid));
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, (error) => {
        console.error("Error listening for messages:", error);
    });
}

function createMessageElement(message, currentUserId) {
    const wrapper = document.createElement('div');
    const bubble = document.createElement('div');
    const isMyMessage = message.senderId === currentUserId;

    wrapper.className = `flex items-start gap-3 message-fade-in ${isMyMessage ? 'justify-end' : 'justify-start'}`;

    const sender = allUsers[message.senderId];
    const initials = sender ? sender.email.substring(0, 2).toUpperCase() : '??';
    const avatarHTML = `<div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-600 flex items-center justify-center font-bold text-slate-600 dark:text-gray-300 flex-shrink-0">${initials}</div>`;
    
    const messageContent = document.createElement('div');
    messageContent.className = `flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`;

    bubble.className = `max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl`;
    bubble.textContent = message.text;

    if (isMyMessage) {
        bubble.classList.add('bg-blue-600', 'text-white', 'rounded-br-none');
    } else {
        bubble.classList.add('bg-slate-200', 'text-slate-800', 'dark:bg-gray-700', 'dark:text-gray-200', 'rounded-bl-none');
    }

    if (message.isToxic === true) {
        bubble.classList.add('border-2', 'border-red-500');
        const warningIcon = document.createElement('span');
        warningIcon.className = 'text-red-500 ml-2';
        warningIcon.innerHTML = '⚠️';
        warningIcon.title = "This message was flagged as potentially harmful.";
        bubble.appendChild(warningIcon);
    }

    const timestamp = document.createElement('div');
    timestamp.className = `text-xs text-slate-400 mt-1`;
    if (message.createdAt && message.createdAt.seconds) {
        timestamp.textContent = new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        timestamp.textContent = "sending..."; // Placeholder for pending messages
    }

    messageContent.appendChild(bubble);
    messageContent.appendChild(timestamp);
    
    const avatarFragment = document.createRange().createContextualFragment(avatarHTML);

    if (isMyMessage) {
        wrapper.appendChild(messageContent);
        wrapper.appendChild(avatarFragment);
    } else {
        wrapper.appendChild(avatarFragment);
        wrapper.appendChild(messageContent);
    }

    return wrapper;
}
