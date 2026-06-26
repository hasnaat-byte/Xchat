/* ==========================================================================
   XChat — script.js
   Vanilla JS controller for the existing index.html / style.css.

   This file is organised in clearly-labelled sections so it can be wired up
   to a Django backend with minimal changes:

     1. CONFIG & MOCK DATA   — replace with real API responses
     2. API LAYER            — swap the body of each function for fetch()
                                calls to your Django REST endpoints
     3. STATE                — single source of truth for the running app
     4. DOM REFERENCES       — cached element lookups (IDs match index.html)
     5. UTILITIES            — small reusable helpers
     6. AUTH SCREEN          — login / register panel logic
     7. APP SHELL            — navbar, profile dropdown, logout
     8. SIDEBAR              — conversation list + search
     9. CHAT                 — message rendering + sending
    10. RESPONSIVE / MOBILE  — sidebar <-> conversation panel switching
    11. INIT                 — event wiring or DOMContentLoaded

   Every place you need to touch to connect Django is marked with:
       // 🔌 DJANGO HOOK
   ========================================================================== */


/* ==========================================================================
   1. CONFIG & MOCK DATA
   ========================================================================== */

/* 🔌 DJANGO HOOK
   These constants and the MOCK_* data below exist purely so the UI has
   something to render in a standalone frontend demo. Once the Django REST
   endpoints exist, delete the MOCK_* objects and let the API layer in
   section 2 do real fetch() calls instead. */

const API_BASE = "/api"; // 🔌 DJANGO HOOK: e.g. "/api" if you mount DRF routes there

// Helper to build relative timestamps so "Today" / "Yesterday" always work
// correctly no matter when this demo is opened.
function hoursAgo(h) { return new Date(Date.now() - h * 60 * 60 * 1000).toISOString(); }
function daysAgo(d, h = 0) { return new Date(Date.now() - (d * 24 + h) * 60 * 60 * 1000).toISOString(); }

const MOCK_CURRENT_USER = {
  id: 1,
  username: "you",
  first_name: "Alex",
  last_name: "Carter",
  email: "alex.carter@example.com",
};

const MOCK_CONVERSATIONS = [
  {
    id: 101,
    user: { id: 2, username: "priya_sharma", first_name: "Priya", last_name: "Sharma", online: true },
    unread_count: 2,
    messages: [
      { id: 1, sender: "them", text: "Hey! Did you get a chance to look at the proposal?", created_at: daysAgo(1, 2), status: "read" },
      { id: 2, sender: "me",   text: "Yes, just finished reading it.", created_at: daysAgo(1, 1.9), status: "read" },
      { id: 3, sender: "me",   text: "Looks solid overall, just a couple of comments on pricing.", created_at: daysAgo(1, 1.85), status: "read" },
      { id: 4, sender: "them", text: "Perfect, send them over whenever you can.", created_at: daysAgo(1, 1.5), status: "read" },
      { id: 5, sender: "them", text: "Are we still on for tomorrow?", created_at: hoursAgo(1), status: "delivered" },
      { id: 6, sender: "them", text: "Let me know what time works 🙂", created_at: hoursAgo(0.8), status: "delivered" },
    ],
  },
  {
    id: 102,
    user: { id: 3, username: "rahul_verma", first_name: "Rahul", last_name: "Verma", online: false },
    unread_count: 0,
    messages: [
      { id: 1, sender: "me",   text: "Morning! Any update on the deployment?", created_at: daysAgo(2), status: "read" },
      { id: 2, sender: "them", text: "All good, pushed to staging last night.", created_at: daysAgo(2), status: "read" },
      { id: 3, sender: "them", text: "Sent the files, check your email.", created_at: daysAgo(0, 5), status: "read" },
    ],
  },
  {
    id: 103,
    user: { id: 4, username: "ananya_iyer", first_name: "Ananya", last_name: "Iyer", online: true },
    unread_count: 5,
    messages: [
      { id: 1, sender: "them", text: "Lol you have to see this", created_at: hoursAgo(3) },
      { id: 2, sender: "them", text: "😂😂 that's hilarious", created_at: hoursAgo(2.9) },
      { id: 3, sender: "me",   text: "Hahaha stop 😭", created_at: hoursAgo(2.8), status: "read" },
    ],
  },
  {
    id: 104,
    user: { id: 5, username: "karan_mehta", first_name: "Karan", last_name: "Mehta", online: false },
    unread_count: 0,
    messages: [
      { id: 1, sender: "them", text: "Let's catch up this weekend?", created_at: daysAgo(3) },
      { id: 2, sender: "me",   text: "Sounds good, Saturday afternoon?", created_at: daysAgo(3), status: "read" },
    ],
  },
];


/* ==========================================================================
   2. API LAYER
   Every function below currently resolves against the MOCK_* data with an
   artificial delay (to mimic network latency). Replace the inside of each
   function with a real fetch() call to Django — the function signatures
   and return shapes are designed to stay the same either way.
   ========================================================================== */

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return "";
}

function requestJson(url, options = {}) {
  return fetch(url, {
    credentials: "same-origin",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      ...(options.headers || {}),
    },
    ...options,
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw { message: data.message || "Request failed." };
    }
    return data;
  });
}

const api = {
  login(username, password) {
    const body = new FormData();
    body.append("username", username);
    body.append("password", password);
    return requestJson(`${API_BASE}/auth/login/`, {
      method: "POST",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      body,
    });
  },

  register(payload) {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => body.append(key, value));
    return requestJson(`${API_BASE}/auth/register/`, {
      method: "POST",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      body,
    });
  },

  logout() {
    window.location.href = window.XCHAT_BOOTSTRAP?.logoutUrl || "/logout/";
    return Promise.resolve();
  },

  async fetchConversations() {
    const data = await requestJson(`${API_BASE}/conversations/`);
    return data.conversations || [];
  },

  async sendMessage(conversationId, text) {
    const body = new FormData();
    body.append("text", text);

    const data = await requestJson(`${API_BASE}/conversations/${conversationId}/messages/`, {
      method: "POST",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      body,
    });

    return data.message;
  },
};

/* ==========================================================================
   3. STATE
   ========================================================================== */

const state = {
  currentUser: null,
  conversations: [],
  activeConversationId: null,
  searchTerm: "",
};


/* ==========================================================================
   4. DOM REFERENCES
   ========================================================================== */

const el = {
  // Auth
  authScreen: document.getElementById("auth-screen"),
  loginPanel: document.getElementById("login-panel"),
  registerPanel: document.getElementById("register-panel"),

  loginUsername: document.getElementById("login-username"),
  loginPassword: document.getElementById("login-password"),
  loginError: document.getElementById("login-error"),
  loginBtn: document.getElementById("login-btn"),

  registerFirstName: document.getElementById("register-first-name"),
  registerLastName: document.getElementById("register-last-name"),
  registerUsername: document.getElementById("register-username"),
  registerEmail: document.getElementById("register-email"),
  registerPassword: document.getElementById("register-password"),
  registerPassword2: document.getElementById("register-password2"),
  registerError: document.getElementById("register-error"),
  registerSuccess: document.getElementById("register-success"),
  registerBtn: document.getElementById("register-btn"),
  passwordStrength: document.getElementById("password-strength"),

  // App shell
  appScreen: document.getElementById("app-screen"),
  newChatBtn: document.getElementById("new-chat-btn"),
  navbarAvatarWrap: document.getElementById("navbar-avatar-wrap"),
  navbarAvatar: document.getElementById("navbar-avatar"),
  navbarAvatarInitials: document.getElementById("navbar-avatar-initials"),
  profileDropdown: document.getElementById("profile-dropdown"),
  dropdownAvatarInitials: document.getElementById("dropdown-avatar-initials"),
  dropdownUsername: document.getElementById("dropdown-username"),
  dropdownEmail: document.getElementById("dropdown-email"),
  logoutBtn: document.getElementById("logout-btn"),

  // Sidebar
  chatSidebar: document.getElementById("chat-sidebar"),
  userSearch: document.getElementById("user-search"),
  searchClear: document.getElementById("search-clear"),
  userCount: document.getElementById("user-count"),
  usersList: document.getElementById("users-list"),
  usersEmpty: document.getElementById("users-empty"),

  // Conversation panel
  conversationPanel: document.getElementById("conversation-panel"),
  noChatSelected: document.getElementById("no-chat-selected"),
  activeChat: document.getElementById("active-chat"),
  chatBackBtn: document.getElementById("chat-back-btn"),
  chatHeaderAvatar: document.getElementById("chat-header-avatar"),
  chatHeaderInitials: document.getElementById("chat-header-initials"),
  chatHeaderName: document.getElementById("chat-header-name"),
  chatHeaderStatus: document.getElementById("chat-header-status"),
  messagesArea: document.getElementById("messages-area"),
  messageInput: document.getElementById("message-input"),
  sendBtn: document.getElementById("send-btn"),
};


/* ==========================================================================
   5. UTILITIES
   ========================================================================== */

function escapeHTML(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

function getInitials(user) {
  const a = (user.first_name || user.username || "?").trim();
  const b = (user.last_name || "").trim();
  const first = a.charAt(0) || "";
  const second = b.charAt(0) || (a.charAt(1) || "");
  return (first + second).toUpperCase() || "?";
}

function getDisplayName(user) {
  const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return full || user.username;
}

// Small palette of brand-aligned greens for avatar variety.
const AVATAR_PALETTE = ["#25D366", "#128C7E", "#075E54", "#22c55e", "#16a34a", "#0d9488"];
function avatarColor(seed) {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatListTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return formatTime(isoString);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

function formatDateDivider(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}

function lastMessageOf(conversation) {
  return conversation.messages[conversation.messages.length - 1] || null;
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function setLoading(btn, isLoading, idleLabel) {
  btn.classList.toggle("loading", isLoading);
  btn.disabled = isLoading;
  btn.textContent = isLoading ? "Please wait…" : idleLabel;
}

function showFieldMessage(node, message) {
  if (!message) {
    node.classList.add("hidden");
    node.textContent = "";
    return;
  }
  node.textContent = message;
  node.classList.remove("hidden");
}


/* ==========================================================================
   6. AUTH SCREEN
   ========================================================================== */

function switchAuthPanel(target) {
  const showRegister = target === "register";
  const enter = showRegister ? el.registerPanel : el.loginPanel;
  const exit = showRegister ? el.loginPanel : el.registerPanel;

  exit.classList.remove("active");
  exit.classList.remove("slide-enter");
  enter.classList.add("active", "slide-enter");
  setTimeout(() => enter.classList.remove("slide-enter"), 200);

  showFieldMessage(el.loginError, "");
  showFieldMessage(el.registerError, "");
  showFieldMessage(el.registerSuccess, "");
}

function initPasswordToggles() {
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const wasPassword = input.type === "password";
      input.type = wasPassword ? "text" : "password";

      const svgs = btn.querySelectorAll("svg");
      if (svgs.length === 2) {
        svgs[0].classList.toggle("hidden", wasPassword);
        svgs[1].classList.toggle("hidden", !wasPassword);
      }
    });
  });
}

function passwordStrengthScore(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

function renderPasswordStrength(password) {
  if (!password) {
    el.passwordStrength.innerHTML = "";
    return;
  }
  const score = passwordStrengthScore(password);
  const labels = ["Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#ef4444", "#ef4444", "#f59e0b", "#22c55e", "#16a34a"];

  let bars = "";
  for (let i = 0; i < 4; i++) {
    const filled = i < score;
    bars += `<span class="strength-bar" style="background:${filled ? colors[score] : ""}"></span>`;
  }
  el.passwordStrength.innerHTML = `${bars}<span class="strength-label" style="color:${colors[score]}">${labels[score]}</span>`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleLogin() {
  const username = el.loginUsername.value.trim();
  const password = el.loginPassword.value;

  if (!username || !password) {
    showFieldMessage(el.loginError, "Please enter your username and password.");
    return;
  }
  showFieldMessage(el.loginError, "");

  setLoading(el.loginBtn, true);
  try {
    // 🔌 DJANGO HOOK: api.login() should POST to your Django auth endpoint
    // and the backend should set a session cookie / return a token.
    const { user } = await api.login(username, password);
    onAuthenticated(user);
  } catch (err) {
    showFieldMessage(el.loginError, err?.message || "Invalid username or password.");
  } finally {
    setLoading(el.loginBtn, false, "Sign In");
  }
}

async function handleRegister() {
  const payload = {
    first_name: el.registerFirstName.value.trim(),
    last_name: el.registerLastName.value.trim(),
    username: el.registerUsername.value.trim(),
    email: el.registerEmail.value.trim(),
    password: el.registerPassword.value,
  };
  const password2 = el.registerPassword2.value;

  showFieldMessage(el.registerError, "");
  showFieldMessage(el.registerSuccess, "");

  if (!payload.first_name || !payload.username || !payload.email || !payload.password) {
    showFieldMessage(el.registerError, "Please fill in all required fields.");
    return;
  }
  if (!validateEmail(payload.email)) {
    showFieldMessage(el.registerError, "Please enter a valid email address.");
    return;
  }
  if (payload.password.length < 6) {
    showFieldMessage(el.registerError, "Password must be at least 6 characters.");
    return;
  }
  if (payload.password !== password2) {
    showFieldMessage(el.registerError, "Passwords do not match.");
    return;
  }

  setLoading(el.registerBtn, true);
  try {
    // 🔌 DJANGO HOOK: api.register() should POST to your Django registration
    // endpoint (e.g. via django-allauth or a custom DRF serializer).
    await api.register(payload);
    showFieldMessage(el.registerSuccess, "Account created! You can sign in now.");
    el.registerPanel.querySelectorAll("input").forEach((i) => (i.value = ""));
    renderPasswordStrength("");
    setTimeout(() => switchAuthPanel("login"), 1200);
  } catch (err) {
    showFieldMessage(el.registerError, err?.message || "Could not create your account.");
  } finally {
    setLoading(el.registerBtn, false, "Create Account");
  }
}

function onAuthenticated(user) {
  state.currentUser = user;
  el.authScreen.classList.add("hidden");
  el.appScreen.classList.remove("hidden");

  el.navbarAvatarInitials.textContent = getInitials(user);
  el.dropdownAvatarInitials.textContent = getInitials(user);
  el.dropdownUsername.textContent = getDisplayName(user);
  el.dropdownEmail.textContent = user.email || "";
  el.navbarAvatar.style.background = avatarColor(user.id ?? user.username);

  loadConversations();
}


/* ==========================================================================
   7. APP SHELL — navbar, profile dropdown, logout
   ========================================================================== */

function toggleProfileDropdown(forceClose = false) {
  const isOpen = el.profileDropdown.classList.contains("open");
  el.profileDropdown.classList.toggle("open", forceClose ? false : !isOpen);
}

async function handleLogout() {
  // 🔌 DJANGO HOOK: api.logout() should POST to your Django logout endpoint
  // and clear the session cookie / token.
  await api.logout();

  state.currentUser = null;
  state.conversations = [];
  state.activeConversationId = null;
  state.searchTerm = "";

  el.userSearch.value = "";
  el.searchClear.classList.add("hidden");
  el.messageInput.value = "";
  toggleProfileDropdown(true);

  el.appScreen.classList.add("hidden");
  el.authScreen.classList.remove("hidden");
  switchAuthPanel("login");
  el.loginUsername.value = "";
  el.loginPassword.value = "";
}


/* ==========================================================================
   8. SIDEBAR — conversation list + search
   ========================================================================== */

async function loadConversations() {
  // 🔌 DJANGO HOOK: api.fetchConversations() should GET the list of the
  // current user's conversations (with last message + unread count
  // pre-computed server-side, ideally).
  el.usersList.innerHTML = "";
  el.usersEmpty.classList.add("hidden");

  const conversations = await api.fetchConversations();
  state.conversations = conversations.sort((a, b) => {
    const aTime = new Date(lastMessageOf(a)?.created_at || 0).getTime();
    const bTime = new Date(lastMessageOf(b)?.created_at || 0).getTime();
    return bTime - aTime;
  });

  renderUsersList();
}

function getFilteredConversations() {
  const term = state.searchTerm.trim().toLowerCase();
  if (!term) return state.conversations;
  return state.conversations.filter((c) => {
    const name = getDisplayName(c.user).toLowerCase();
    const username = c.user.username.toLowerCase();
    const preview = (lastMessageOf(c)?.text || "").toLowerCase();
    return name.includes(term) || username.includes(term) || preview.includes(term);
  });
}

function renderUsersList() {
  const conversations = getFilteredConversations();

  el.usersList.innerHTML = "";
  el.usersEmpty.classList.toggle("hidden", conversations.length > 0);

  const unreadCount = state.conversations.filter((c) => c.unread_count > 0).length;
  el.userCount.textContent = unreadCount > 0 ? String(unreadCount) : "";

  conversations.forEach((conversation) => {
    const li = document.createElement("li");
    li.className = "user-item";
    li.dataset.conversationId = conversation.id;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", String(conversation.id === state.activeConversationId));
    if (conversation.id === state.activeConversationId) li.classList.add("active");

    const last = lastMessageOf(conversation);
    const name = getDisplayName(conversation.user);
    const preview = last ? (last.sender === "me" ? `You: ${last.text}` : last.text) : "Say hi 👋";
    const time = last ? formatListTime(last.created_at) : "";

    li.innerHTML = `
      <div class="user-item-avatar-wrap">
        <div class="avatar avatar-md" style="background:${avatarColor(conversation.user.id)}">${getInitials(conversation.user)}</div>
        ${conversation.user.online ? '<span class="online-dot"></span>' : ""}
      </div>
      <div class="user-item-body">
        <div class="user-item-top">
          <span class="user-item-name">${escapeHTML(name)}</span>
          <span class="user-item-time">${escapeHTML(time)}</span>
        </div>
        <div class="user-item-bottom">
          <span class="user-item-preview">${escapeHTML(preview)}</span>
          ${conversation.unread_count > 0 ? `<span class="unread-badge">${conversation.unread_count}</span>` : ""}
        </div>
      </div>
    `;

    li.addEventListener("click", () => selectConversation(conversation.id));
    el.usersList.appendChild(li);
  });
}

function handleSearchInput() {
  state.searchTerm = el.userSearch.value;
  el.searchClear.classList.toggle("hidden", state.searchTerm.length === 0);
  renderUsersList();
}

function clearSearch() {
  el.userSearch.value = "";
  state.searchTerm = "";
  el.searchClear.classList.add("hidden");
  el.userSearch.focus();
  renderUsersList();
}


/* ==========================================================================
   9. CHAT — message rendering + sending
   ========================================================================== */

function selectConversation(conversationId) {
  state.activeConversationId = conversationId;
  const conversation = state.conversations.find((c) => c.id === conversationId);
  if (!conversation) return;

  // Mark as read locally.
  // 🔌 DJANGO HOOK: also notify the backend, e.g.
  // POST {API_BASE}/conversations/{id}/read/
  conversation.unread_count = 0;

  renderUsersList();
  renderChatHeader(conversation);
  renderMessages(conversation);

  el.noChatSelected.classList.add("hidden");
  el.activeChat.classList.remove("hidden");

  goToConversationView();
  el.messageInput.focus();
}

function renderChatHeader(conversation) {
  el.chatHeaderInitials.textContent = getInitials(conversation.user);
  el.chatHeaderAvatar.style.background = avatarColor(conversation.user.id);
  el.chatHeaderName.textContent = getDisplayName(conversation.user);
  el.chatHeaderStatus.textContent = conversation.user.online ? "online" : "offline";
}

function statusIconSVG(status) {
  const isRead = status === "read";
  return `
    <span class="message-status${isRead ? " read" : ""}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="2 12 7 17 14 8"/>
        <polyline points="9 16 13 20 22 6"/>
      </svg>
    </span>
  `;
}

function renderMessages(conversation) {
  el.messagesArea.innerHTML = "";
  let lastDateLabel = null;
  let lastSender = null;

  conversation.messages.forEach((msg) => {
    const dateLabel = formatDateDivider(msg.created_at);
    if (dateLabel !== lastDateLabel) {
      const divider = document.createElement("div");
      divider.className = "date-divider";
      divider.innerHTML = `<span>${escapeHTML(dateLabel)}</span>`;
      el.messagesArea.appendChild(divider);
      lastDateLabel = dateLabel;
      lastSender = null; // force first-in-group after a divider
    }

    const isFirstInGroup = msg.sender !== lastSender;
    const row = document.createElement("div");
    row.className = `message-row ${msg.sender === "me" ? "sent" : "received"}${isFirstInGroup ? " first-in-group" : ""}`;

    const avatarHTML =
      msg.sender === "them"
        ? `<div class="message-avatar" style="background:${avatarColor(conversation.user.id)}">${getInitials(conversation.user)}</div>`
        : "";

    row.innerHTML = `
      ${avatarHTML}
      <div class="message-bubble">
        ${escapeHTML(msg.text)}
        <div class="message-meta">
          <span class="message-time">${formatTime(msg.created_at)}</span>
          ${msg.sender === "me" ? statusIconSVG(msg.status) : ""}
        </div>
      </div>
    `;

    el.messagesArea.appendChild(row);
    lastSender = msg.sender;
  });

  scrollMessagesToBottom();
}

function scrollMessagesToBottom() {
  el.messagesArea.scrollTop = el.messagesArea.scrollHeight;
}

async function handleSendMessage() {
  const text = el.messageInput.value.trim();
  if (!text || state.activeConversationId == null) return;

  const conversation = state.conversations.find((c) => c.id === state.activeConversationId);
  if (!conversation) return;

  el.messageInput.value = "";
  autoResizeTextarea();

  // 🔌 DJANGO HOOK: api.sendMessage() should POST the message to
  // {API_BASE}/conversations/{id}/messages/ — ideally over a websocket
  // (e.g. Django Channels) for real-time delivery to the other user.
  const message = await api.sendMessage(conversation.id, text);
  conversation.messages.push(message);

  renderMessages(conversation);
  renderUsersList();
}

function autoResizeTextarea() {
  el.messageInput.style.height = "auto";
  el.messageInput.style.height = `${Math.min(el.messageInput.scrollHeight, 116)}px`;
}


/* ==========================================================================
   10. RESPONSIVE / MOBILE — sidebar <-> conversation panel switching
   ========================================================================== */

function goToConversationView() {
  el.chatSidebar.classList.add("hidden-mobile");
  el.conversationPanel.classList.add("visible-mobile");
}

function goToSidebarView() {
  el.chatSidebar.classList.remove("hidden-mobile");
  el.conversationPanel.classList.remove("visible-mobile");
}


/* ==========================================================================
   11. INIT
   ========================================================================== */

function init() {
  // Auth panel switching
  document.querySelectorAll("[data-switch]").forEach((btn) => {
    btn.addEventListener("click", () => switchAuthPanel(btn.dataset.switch));
  });
  initPasswordToggles();

  // Login
 

  // Register

  el.registerPassword.addEventListener("input", () => renderPasswordStrength(el.registerPassword.value));

  // Profile dropdown
  el.navbarAvatar.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleProfileDropdown();
  });
  document.addEventListener("click", (e) => {
    if (!el.navbarAvatarWrap.contains(e.target)) toggleProfileDropdown(true);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleProfileDropdown(true);
  });
  el.logoutBtn.addEventListener("click", handleLogout);

  // New chat (🔌 DJANGO HOOK: wire this to a "start new conversation" flow
  // backed by GET {API_BASE}/users/ to pick someone to message)
  el.newChatBtn.addEventListener("click", () => {
    goToSidebarView();
    el.userSearch.focus();
  });

  // Sidebar search
  el.userSearch.addEventListener("input", debounce(handleSearchInput, 120));
  el.searchClear.addEventListener("click", clearSearch);

  // Mobile back button
  el.chatBackBtn.addEventListener("click", goToSidebarView);

  // Message composer
  el.sendBtn.addEventListener("click", handleSendMessage);
  el.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  el.messageInput.addEventListener("input", autoResizeTextarea);

  if (window.XCHAT_BOOTSTRAP?.authenticated && window.XCHAT_BOOTSTRAP.currentUser) {
    onAuthenticated(window.XCHAT_BOOTSTRAP.currentUser);
  }
}

document.addEventListener("DOMContentLoaded", init);


