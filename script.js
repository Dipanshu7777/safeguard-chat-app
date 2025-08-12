import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, collection, getDocs, query,
    addDoc, serverTimestamp, onSnapshot, orderBy, deleteDoc, writeBatch, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Configuration ---
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

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Global State ---
let currentChatRoomId = null;
let unsubscribeMessages = null;
let allUsers = {};

// --- Main execution block that waits for the DOM ---
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const authPage = document.getElementById('auth-page');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutButton = document.getElementById('logout-button');
    const messageForm = document.getElementById('message-form');
    const chatsTabButton = document.getElementById('chats-tab-button');
    const usersTabButton = document.getElementById('users-tab-button');
    const themeToggle = document.getElementById('theme-toggle');
    
    // --- Event Listeners ---
    signupForm.addEventListener('submit', handleSignup);
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', () => signOut(auth));
    messageForm.addEventListener('submit', handleSendMessage);
    chatsTabButton.addEventListener('click', () => switchTab('chats'));
    usersTabButton.addEventListener('click', () => switchTab('users'));
    if(themeToggle) {
        themeToggle.addEventListener('change', handleThemeToggle);
    }

    // --- Theme Management ---
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            if (themeToggle) themeToggle.checked = true;
        } else {
            document.documentElement.classList.remove('dark');
            if (themeToggle) themeToggle.checked = false;
        }
    }

    function handleThemeToggle() {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    }
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // --- Core Application Logic ---
    onAuthStateChanged(auth, user => {
        if (user) {
            authPage.style.display = 'none';
            mainApp.style.display = 'flex';
            updateUserInfo(user);
            fetchAllUsersAndChats(user.uid);
        } else {
            authPage.style.display = 'flex';
            mainApp.style.display = 'none';
        }
    });
});

// --- Function Definitions ---
async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    document.getElementById('signup-error').textContent = '';
    document.getElementById('signup-success').textContent = '';
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), { email: cred.user.email, uid: cred.user.uid });
        document.getElementById('signup-success').textContent = 'Account created successfully!';
    } catch (error) { document.getElementById('signup-error').textContent = error.message; }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    document.getElementById('login-error').textContent = '';
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (error) { document.getElementById('login-error').textContent = error.message; }
}

function updateUserInfo(user) {
    document.getElementById('current-user-email').textContent = user.email;
    document.getElementById('current-user-avatar').textContent = user.email.substring(0, 2).toUpperCase();
}

function switchTab(tabName) {
    const chatsListContainer = document.getElementById('chats-list-container');
    const usersListContainer = document.getElementById('users-list-container');
    const chatsTabButton = document.getElementById('chats-tab-button');
    const usersTabButton = document.getElementById('users-tab-button');

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

async function fetchAllUsersAndChats(currentUserId) {
    const usersQuery = query(collection(db, "users"));
    const usersSnapshot = await getDocs(usersQuery);
    allUsers = {};
    usersSnapshot.forEach(doc => allUsers[doc.id] = doc.data());
    
    displayAllUsers(currentUserId);
    listenForChatRooms(currentUserId);
}

function displayAllUsers(currentUserId) {
    const usersListContainer = document.getElementById('users-list-container');
    usersListContainer.innerHTML = '';
    Object.values(allUsers).forEach(userData => {
        if (userData.uid !== currentUserId) {
            const userElement = document.createElement('div');
            userElement.className = 'p-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700';
            const initials = userData.email.substring(0, 2).toUpperCase();
            userElement.innerHTML = `
                <div class="flex items-center min-w-0">
                    <div class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 mr-3 flex-shrink-0">${initials}</div>
                    <p class="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">${userData.email}</p>
                </div>
                <button class="start-chat-btn bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-semibold flex-shrink-0">Chat</button>`;
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
            if (doc.id.includes(currentUserId)) myChats.push(doc.id);
        });
        displayMyChats(myChats, currentUserId);
    });
}

function displayMyChats(chatRoomIds, currentUserId) {
    const chatsListContainer = document.getElementById('chats-list-container');
    chatsListContainer.innerHTML = '';
    if (chatRoomIds.length === 0) {
        chatsListContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center p-4 text-sm">No active chats. Start one from "All Users".</p>';
        return;
    }
    chatRoomIds.forEach(roomId => {
        const otherUserId = roomId.replace(currentUserId, '').replace('_', '');
        const otherUser = allUsers[otherUserId];
        if (otherUser) {
            const chatElement = document.createElement('div');
            chatElement.className = 'p-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
            const initials = otherUser.email.substring(0, 2).toUpperCase();
            chatElement.innerHTML = `
                <div class="flex items-center flex-grow min-w-0">
                    <div class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 mr-3 flex-shrink-0">${initials}</div>
                    <p class="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">${otherUser.email}</p>
                </div>
                <button class="delete-chat-btn p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 ml-2 flex-shrink-0">
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
            chatElement.addEventListener('click', (e) => { if (!e.target.closest('.delete-chat-btn')) openChat(otherUser); });
            chatElement.querySelector('.delete-chat-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteChat(roomId); });
            chatsListContainer.appendChild(chatElement);
        }
    });
}

async function deleteChat(roomId) {
    if (confirm("Are you sure you want to delete this entire chat history? This cannot be undone.")) {
        try {
            const messagesRef = collection(db, "chat_rooms", roomId, "messages");
            const messagesSnapshot = await getDocs(messagesRef);
            const batch = writeBatch(db);
            messagesSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            await deleteDoc(doc(db, "chat_rooms", roomId));
            document.getElementById('welcome-screen').style.display = 'flex';
            document.getElementById('chat-page').style.display = 'none';
        } catch (error) { console.error("Error deleting chat: ", error); }
    }
}

function openChat(otherUser) {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('chat-page').style.display = 'flex';
    document.getElementById('chat-with-email').textContent = otherUser.email;
    document.getElementById('chat-with-avatar').textContent = otherUser.email.substring(0, 2).toUpperCase();
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
        const messageData = {
            text: messageText, senderId: currentUser.uid, createdAt: serverTimestamp(), isToxic: 'checking'
        };
        const messageRef = await addDoc(collection(db, "chat_rooms", currentChatRoomId, "messages"), messageData);
        messageInput.value = '';

        const isToxic = await analyzeMessageToxicity(messageText);
        await updateDoc(messageRef, { isToxic: isToxic });
    }
}

async function analyzeMessageToxicity(text) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "text": text })
        });
        if (!response.ok) { return false; }
        const result = await response.json();
        return result.label === 'Bullying';
    } catch (error) { return false; }
}

function listenForMessages(chatRoomId) {
    if (unsubscribeMessages) unsubscribeMessages();
    const q = query(collection(db, "chat_rooms", chatRoomId, "messages"), orderBy("createdAt"));
    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.innerHTML = '';
        if (snapshot.empty) {
            messagesContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">No messages yet.</p>';
            return;
        }
        snapshot.forEach(doc => {
            messagesContainer.appendChild(createMessageElement(doc.data(), auth.currentUser.uid));
        });
        const lastMessage = messagesContainer.lastElementChild;
        if (lastMessage) {
            lastMessage.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

function createMessageElement(message, currentUserId) {
    const wrapper = document.createElement('div');
    const bubble = document.createElement('div');
    const isMyMessage = message.senderId === currentUserId;

    wrapper.className = `flex items-start gap-3 message-fade-in ${isMyMessage ? 'justify-end' : 'justify-start'}`;
    
    const sender = allUsers[message.senderId];
    const initials = sender ? sender.email.substring(0, 2).toUpperCase() : '??';
    const avatar = `<div class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">${initials}</div>`;
    
    const messageContent = document.createElement('div');
    messageContent.className = `flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`;

    bubble.className = `max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl`;
    bubble.appendChild(document.createTextNode(message.text));
    
    if (isMyMessage) {
        bubble.classList.add('bg-blue-600', 'text-white', 'rounded-br-none');
    } else {
        bubble.classList.add('bg-gray-200', 'text-gray-800', 'dark:bg-gray-700', 'dark:text-gray-200', 'rounded-bl-none');
    }
    
    if (message.isToxic === true) {
        bubble.classList.add('border-2', 'border-red-500');
        const warningIcon = document.createElement('span');
        warningIcon.className = 'text-red-500 ml-2';
        warningIcon.innerHTML = '⚠️';
        bubble.appendChild(warningIcon);
    }

    const timestamp = document.createElement('div');
    timestamp.className = `text-xs text-gray-400 mt-1`;
    if (message.createdAt) {
        timestamp.textContent = new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    messageContent.appendChild(bubble);
    messageContent.appendChild(timestamp);

    if (isMyMessage) {
        wrapper.appendChild(messageContent);
        wrapper.appendChild(document.createRange().createContextualFragment(avatar));
    } else {
        wrapper.appendChild(document.createRange().createContextualFragment(avatar));
        wrapper.appendChild(messageContent);
    }
    
    return wrapper;
}
