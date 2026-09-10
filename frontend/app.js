/**
 * BIS assistant - Chatbot Application Controller
 * Optimized for minimal bandwidth and weak internet connections.
 */

document.addEventListener("DOMContentLoaded", () => {
  const chatFeed = document.getElementById("chat-feed");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const clearChatBtn = document.getElementById("clear-chat-btn");
  const systemStatus = document.getElementById("system-status");

  // BIS Account Elements
  const bisAccountBtn = document.getElementById("bis-account-btn");
  const bisAuthIndicator = document.getElementById("bis-auth-indicator");
  const bisAccountText = document.getElementById("bis-account-text");
  const bisModal = document.getElementById("bis-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelLoginBtn = document.getElementById("cancel-login-btn");
  const bisLoginForm = document.getElementById("bis-login-form");
  const bisUsernameInput = document.getElementById("bis-username-input");
  const bisPasswordInput = document.getElementById("bis-password-input");
  const captchaContainer = document.getElementById("captcha-container");
  const captchaImg = document.getElementById("captcha-img");
  const bisCaptchaInput = document.getElementById("bis-captcha-input");
  const modalStatusMsg = document.getElementById("modal-status-msg");
  const saveLoginBtn = document.getElementById("save-login-btn");
  const loginBtnText = document.getElementById("login-btn-text");

  let isSubmitting = false;

  // Initialize health and auth status
  checkHealth();
  checkBisAuth();

  // Attach greeting chips
  setupGreetingChips();

  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        if (systemStatus) {
          systemStatus.textContent = "Online";
        }
        if (data.bis_authenticated) {
          updateBisAuthUI({ authenticated: true, username: data.bis_user });
        }
      }
    } catch (e) {
      if (systemStatus) {
        systemStatus.textContent = "Connecting...";
      }
    }
  }

  async function checkBisAuth() {
    try {
      const res = await fetch("/api/bis/status");
      if (res.ok) {
        const data = await res.json();
        updateBisAuthUI(data);
      }
    } catch (e) {
      console.warn("Could not check BIS auth status", e);
    }
  }

  function updateBisAuthUI(data) {
    if (!bisAuthIndicator || !bisAccountText) return;
    if (data.authenticated) {
      bisAuthIndicator.className = "status-dot";
      bisAccountText.textContent = `Account: ${data.username || "Active"}`;
    } else {
      bisAuthIndicator.className = "status-dot guest";
      bisAccountText.textContent = "Account: Guest";
    }
    if (data.username && !bisUsernameInput.value) {
      bisUsernameInput.value = data.username;
    }
  }

  // Modal Handlers
  function openModal(msg = "") {
    bisModal.classList.remove("hidden");
    if (msg) {
      showModalStatus(msg, "info");
    } else {
      modalStatusMsg.style.display = "none";
    }
    bisUsernameInput.focus();
  }

  function closeModal() {
    bisModal.classList.add("hidden");
    modalStatusMsg.style.display = "none";
    captchaContainer.style.display = "none";
    loginBtnText.textContent = "Authenticate & Save";
    saveLoginBtn.disabled = false;
  }

  function showModalStatus(text, type = "info") {
    modalStatusMsg.textContent = text;
    modalStatusMsg.className = `modal-status ${type}`;
    modalStatusMsg.style.display = "block";
  }

  bisAccountBtn.addEventListener("click", () => openModal());
  closeModalBtn.addEventListener("click", closeModal);
  cancelLoginBtn.addEventListener("click", closeModal);
  bisModal.addEventListener("click", (e) => {
    if (e.target === bisModal) closeModal();
  });

  // BIS Login Submission
  bisLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = bisUsernameInput.value.trim();
    const password = bisPasswordInput.value.trim();
    const captcha_code = bisCaptchaInput.value.trim();

    if (!username || !password) {
      showModalStatus("Username and password are required.", "error");
      return;
    }

    loginBtnText.textContent = "Authenticating...";
    saveLoginBtn.disabled = true;
    modalStatusMsg.style.display = "none";

    try {
      const res = await fetch("/api/bis/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, captcha_code }),
      });

      const result = await res.json();
      if (result.status === "success") {
        showModalStatus(result.message || "Successfully authenticated with BIS portal!", "success");
        updateBisAuthUI({ authenticated: true, username });
        setTimeout(() => closeModal(), 1400);
      } else if (result.status === "captcha_needed") {
        showModalStatus(result.message || "Please enter the captcha characters shown.", "info");
        if (result.captcha_image) {
          captchaImg.src = result.captcha_image;
          captchaContainer.style.display = "block";
          bisCaptchaInput.focus();
        }
      } else {
        showModalStatus(result.message || "Login failed. Please verify credentials.", "error");
        if (result.captcha_image) {
          captchaImg.src = result.captcha_image;
          captchaContainer.style.display = "block";
        }
      }
    } catch (err) {
      showModalStatus("Failed to contact BIS login service: " + err.message, "error");
    } finally {
      loginBtnText.textContent = "Authenticate & Save";
      saveLoginBtn.disabled = false;
    }
  });

  // Auto-resize chat textarea
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
  });

  // Handle Enter key for submission (Shift+Enter for newline)
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitting && chatInput.value.trim()) {
        chatForm.dispatchEvent(new Event("submit"));
      }
    }
  });

  // Setup Chips Click Listener
  function setupGreetingChips() {
    const chips = document.querySelectorAll(".chat-chip");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const query = chip.getAttribute("data-query");
        if (query) {
          submitUserQuery(query);
        }
      });
    });
  }

  // Clear Chat History
  clearChatBtn.addEventListener("click", () => {
    chatFeed.innerHTML = `
      <div class="message-row assistant-row">
        <div class="avatar avatar-assistant">BIS</div>
        <div class="message-bubble">
          <div class="bubble-meta">
            <div class="meta-tags">
              <span class="meta-tag">Official Assistant</span>
              <span class="meta-tag">standardsbis.bsbedge.com</span>
            </div>
          </div>
          <div class="bubble-markdown">
            <p><strong>Chat cleared. I am your BIS assistant.</strong></p>
            <p>Ask any question about Indian Standards, test requirements, or certification schemes:</p>
            <div class="chips-container" id="greeting-chips">
              <button class="chat-chip" data-query="What are the purity grades and hallmarking rules under IS 1417?">Gold Hallmarking (IS 1417)</button>
              <button class="chat-chip" data-query="What is the specification for Ordinary Portland Cement under IS 269?">Portland Cement (IS 269)</button>
              <button class="chat-chip" data-query="What are the test parameters for Packaged Drinking Water under IS 14543?">Packaged Water (IS 14543)</button>
            </div>
          </div>
        </div>
      </div>
    `;
    setupGreetingChips();
    chatInput.focus();
  });

  // Form Submit Handler
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query || isSubmitting) return;
    submitUserQuery(query);
  });

  async function submitUserQuery(query) {
    if (isSubmitting) return;
    isSubmitting = true;
    sendBtn.disabled = true;

    // Reset textarea
    chatInput.value = "";
    chatInput.style.height = "auto";

    // 1. Append User Message Bubble
    appendUserMessage(query);

    // 2. Append Typing Indicator Bubble
    const typingId = "typing-" + Date.now();
    appendTypingIndicator(typingId);
    scrollToBottom();

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Remove typing bubble and append full Assistant response
      removeElement(typingId);
      appendAssistantMessage(data);
      scrollToBottom();

    } catch (err) {
      removeElement(typingId);
      appendErrorMessage(err.message || "Failed to communicate with BIS assistant.");
      scrollToBottom();
    } finally {
      isSubmitting = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  function appendUserMessage(text) {
    const row = document.createElement("div");
    row.className = "message-row user-row";
    row.innerHTML = `
      <div class="message-bubble">
        <p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>
      </div>
      <div class="avatar avatar-user">You</div>
    `;
    chatFeed.appendChild(row);
  }

  function appendTypingIndicator(id) {
    const row = document.createElement("div");
    row.className = "message-row assistant-row";
    row.id = id;
    row.innerHTML = `
      <div class="avatar avatar-assistant">BIS</div>
      <div class="message-bubble" style="padding: 10px 14px;">
        <div class="typing-indicator">
          <div class="dots-loader">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <span>Searching BIS repository &amp; synthesizing guidance...</span>
        </div>
      </div>
    `;
    chatFeed.appendChild(row);
  }

  function appendErrorMessage(errorText) {
    const row = document.createElement("div");
    row.className = "message-row assistant-row";
    row.innerHTML = `
      <div class="avatar avatar-assistant">BIS</div>
      <div class="message-bubble" style="border-color: #fecaca; background-color: #fef2f2; color: #991b1b;">
        <p><strong>Error</strong>: ${escapeHtml(errorText)}</p>
      </div>
    `;
    chatFeed.appendChild(row);
  }

  function appendAssistantMessage(data) {
    const row = document.createElement("div");
    row.className = "message-row assistant-row";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    // 1. Meta Tags & Copy Action
    const metaBar = document.createElement("div");
    metaBar.className = "bubble-meta";

    const tagsDiv = document.createElement("div");
    tagsDiv.className = "meta-tags";

    // Engine Tag
    const engineTag = document.createElement("span");
    engineTag.className = "meta-tag engine-tag";
    engineTag.textContent = data.engine || "BIS AI";
    tagsDiv.appendChild(engineTag);

    // Category Tag
    if (data.category) {
      const catTag = document.createElement("span");
      catTag.className = "meta-tag";
      catTag.textContent = formatCategory(data.category);
      tagsDiv.appendChild(catTag);
    }

    // Keywords Tags
    (data.extracted_keywords || []).slice(0, 3).forEach((kw) => {
      const kwTag = document.createElement("span");
      kwTag.className = "meta-tag";
      kwTag.textContent = `#${kw}`;
      tagsDiv.appendChild(kwTag);
    });

    // Copy Button
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-button";
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      <span>Copy</span>
    `;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(data.answer || "");
      copyBtn.querySelector("span").textContent = "Copied!";
      setTimeout(() => {
        copyBtn.querySelector("span").textContent = "Copy";
      }, 1800);
    });

    metaBar.appendChild(tagsDiv);
    metaBar.appendChild(copyBtn);
    bubble.appendChild(metaBar);

    // 2. Matched Indian Standards Grid (if standards found)
    const standards = data.matched_standards || [];
    if (standards.length > 0) {
      const stdHeader = document.createElement("div");
      stdHeader.style.cssText = "font-size: 11.5px; font-weight: 700; color: var(--text-primary); margin-top: 4px;";
      stdHeader.textContent = `Official Indian Standards Found (${standards.length}):`;
      bubble.appendChild(stdHeader);

      const grid = document.createElement("div");
      grid.className = "standards-grid";

      standards.slice(0, 4).forEach((std) => {
        const card = document.createElement("div");
        card.className = "std-card";

        const isActive = (std.status || "").toLowerCase() === "active";
        const statusClass = isActive ? "active" : "withdrawn";

        card.innerHTML = `
          <div>
            <div class="std-card-header">
              <span class="std-number">${escapeHtml(std.is_number)}</span>
              <span class="std-status ${statusClass}">${escapeHtml(std.status || "Status")}</span>
            </div>
            <p class="std-title">${escapeHtml(std.title || "Standard Specification")}</p>
            <div class="std-meta">
              ${std.technical_committee ? `<span>TC: ${escapeHtml(std.technical_committee)}</span>` : ""}
              <span>Amendments: ${std.amendments}</span>
            </div>
          </div>
          <div class="std-actions">
            ${std.preview_url ? `
              <a href="${escapeHtml(std.preview_url)}" target="_blank" rel="noopener noreferrer" class="btn-std-preview" title="View official scope & clause preview">
                Preview
              </a>
            ` : ""}
            <button type="button" class="btn-std-download" data-preview-id="${escapeHtml(std.preview_id || '')}" data-is-number="${escapeHtml(std.is_number)}" title="Download full PDF standard">
              Download PDF
            </button>
          </div>
        `;

        // Wire download button
        const dlBtn = card.querySelector(".btn-std-download");
        dlBtn.addEventListener("click", () => {
          downloadStandardPdf(std.preview_id, std.is_number, dlBtn);
        });

        grid.appendChild(card);
      });

      bubble.appendChild(grid);
    }

    // 3. Primary Standard Clause & Scope Preview Accordion
    if (data.primary_preview && data.primary_preview.trim().length > 40) {
      const previewBox = document.createElement("div");
      previewBox.className = "preview-box";
      previewBox.innerHTML = `
        <button type="button" class="preview-toggle">
          <span>Official Standard Scope &amp; Clause 1 Preview</span>
          <span class="arrow">&plus; Expand</span>
        </button>
        <div class="preview-content" style="display: none;">${escapeHtml(data.primary_preview.trim())}</div>
      `;

      const toggleBtn = previewBox.querySelector(".preview-toggle");
      const contentDiv = previewBox.querySelector(".preview-content");
      const arrowSpan = previewBox.querySelector(".arrow");

      toggleBtn.addEventListener("click", () => {
        const isHidden = contentDiv.style.display === "none";
        contentDiv.style.display = isHidden ? "block" : "none";
        arrowSpan.innerHTML = isHidden ? "&minus; Collapse" : "&plus; Expand";
      });

      bubble.appendChild(previewBox);
    }

    // 4. Formatted Answer Markdown
    const markdownDiv = document.createElement("div");
    markdownDiv.className = "bubble-markdown";
    markdownDiv.innerHTML = formatMarkdown(data.answer || "");
    bubble.appendChild(markdownDiv);

    // 5. Official Source Bar
    if (data.source_url) {
      const sourceBar = document.createElement("div");
      sourceBar.className = "source-bar";
      sourceBar.innerHTML = `
        <span style="color: var(--text-muted);">Source:</span>
        <a href="${escapeHtml(data.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.source_url)}</a>
      `;
      bubble.appendChild(sourceBar);
    }

    row.innerHTML = `<div class="avatar avatar-assistant">BIS</div>`;
    row.appendChild(bubble);
    chatFeed.appendChild(row);
  }

  // Handle PDF Download in Chat
  async function downloadStandardPdf(previewId, isNumber, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Downloading...";

    try {
      const res = await fetch("/api/bis/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview_id: previewId, is_number: isNumber }),
      });

      const data = await res.json();
      if (data.status === "login_required" || data.status === "session_expired") {
        btn.textContent = originalText;
        btn.disabled = false;
        openModal(data.message || "Please authenticate your BIS account to download full official PDFs.");
        return;
      }

      if (data.status === "success") {
        btn.textContent = "Open PDF";
        btn.className = "btn-std-download downloaded";
        btn.onclick = () => window.open(data.download_url, "_blank");
        btn.disabled = false;
        window.open(data.download_url, "_blank");
      } else {
        alert(data.message || "Could not download PDF from BIS portal.");
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch (err) {
      alert("Error contacting download service: " + err.message);
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  function scrollToBottom() {
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function formatCategory(cat) {
    return (cat || "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Markdown Formatter
  function formatMarkdown(text) {
    if (!text) return "";
    let html = escapeHtml(text);

    // Headers
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Inline Code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // List items (bullets and numbered)
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Paragraphs
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs
      .map((p) => {
        p = p.trim();
        if (p.startsWith("<h") || p.startsWith("<ul") || p.startsWith("<blockquote")) {
          return p;
        }
        return `<p>${p.replace(/\n/g, "<br>")}</p>`;
      })
      .join("");

    return html;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
