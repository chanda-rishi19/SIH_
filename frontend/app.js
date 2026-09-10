

document.addEventListener("DOMContentLoaded", () => {
  const chatFeed = document.getElementById("chat-feed");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const clearChatBtn = document.getElementById("clear-chat-btn");
  const systemStatus = document.getElementById("system-status");
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
  const newChatBtn = document.getElementById("new-chat-btn");
  const appearanceBtn = document.getElementById("appearance-btn");
  const historyBtn = document.getElementById("history-btn");
  const historyPanel = document.getElementById("history-panel");
  const fileInput = document.getElementById("file-input");
  const cameraInput = document.getElementById("camera-input");
  const attachMenuBtn = document.getElementById("attach-menu-btn");
  const attachMenu = document.getElementById("attach-menu");
  const cameraBtn = document.getElementById("camera-btn");
  const imageBtn = document.getElementById("image-btn");
  const documentBtn = document.getElementById("document-btn");
  const menuVoiceBtn = document.getElementById("menu-voice-btn");
  const attachmentPreview = document.getElementById("attachment-preview");
  const assistantMode = document.getElementById("assistant-mode");
  const sourceSearchToggle = document.getElementById("source-search-toggle");
  const improvePromptBtn = document.getElementById("improve-prompt-btn");
  const voiceStatus = document.getElementById("voice-status");
  const responseFormat = document.getElementById("response-format");

  let isSubmitting = false;
  let selectedAttachment = null;
  let lastQuery = "";


  checkHealth();
  checkBisAuth();

  setupGreetingChips();
  setupFeatureControls();

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


  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitting && chatInput.value.trim()) {
        chatForm.dispatchEvent(new Event("submit"));
      }
    }
  });


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

  function setupFeatureControls() {
    document.querySelectorAll(".suggestion-button").forEach((button) => {
      button.addEventListener("click", () => submitUserQuery(button.dataset.query));
    });

    newChatBtn?.addEventListener("click", () => clearChatBtn.click());
    appearanceBtn?.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      const dark = document.body.classList.contains("dark-theme");
      localStorage.setItem("bis-theme", dark ? "dark" : "light");
      appearanceBtn.textContent = dark ? "Light mode" : "Dark mode";
    });
    if (localStorage.getItem("bis-theme") === "dark") {
      document.body.classList.add("dark-theme");
      if (appearanceBtn) appearanceBtn.textContent = "Light mode";
    }

    historyBtn?.addEventListener("click", () => {
      historyPanel.classList.toggle("hidden");
      renderHistory();
    });

    attachMenuBtn?.addEventListener("click", () => {
      const isHidden = attachMenu.classList.toggle("hidden");
      attachMenuBtn.setAttribute("aria-expanded", String(!isHidden));
    });
    cameraBtn?.addEventListener("click", () => {
      cameraInput?.click();
      closeAttachMenu();
    });
    imageBtn?.addEventListener("click", () => {
      fileInput?.setAttribute("accept", "image/*");
      fileInput?.click();
      closeAttachMenu();
    });
    documentBtn?.addEventListener("click", () => {
      fileInput?.setAttribute("accept", ".pdf,.txt,.doc,.docx");
      fileInput?.click();
      closeAttachMenu();
    });
    menuVoiceBtn?.addEventListener("click", () => {
      startVoiceInput();
      closeAttachMenu();
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".attach-menu-wrap")) closeAttachMenu();
    });

    fileInput?.addEventListener("change", () => handleFileSelection(fileInput));
    cameraInput?.addEventListener("change", () => handleFileSelection(cameraInput));

    function handleFileSelection(input) {
      selectedAttachment = input.files[0] || null;
      if (!selectedAttachment) {
        attachmentPreview.classList.add("hidden");
        return;
      }
      attachmentPreview.classList.remove("hidden");
      attachmentPreview.innerHTML = `<span>${escapeHtml(selectedAttachment.name)}</span><button type="button" aria-label="Remove attachment">Remove</button>`;
      attachmentPreview.querySelector("button").addEventListener("click", clearAttachment);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    function startVoiceInput() {
      if (!SpeechRecognition) {
        voiceStatus.textContent = "Voice input is not supported in this browser.";
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      voiceStatus.textContent = "Listening...";
      recognition.onresult = (event) => {
        chatInput.value = event.results[0][0].transcript;
        chatInput.dispatchEvent(new Event("input"));
      };
      recognition.onerror = () => { voiceStatus.textContent = "Voice input unavailable."; };
      recognition.onend = () => {
        if (voiceStatus.textContent === "Listening...") voiceStatus.textContent = "Voice ready";
      };
      recognition.start();
    }

    improvePromptBtn?.addEventListener("click", () => {
      const currentPrompt = chatInput.value.trim();
      if (!currentPrompt) {
        chatInput.focus();
        voiceStatus.textContent = "Enter a question first.";
        return;
      }
      chatInput.value = `Give a clear, source-backed answer about ${currentPrompt}. Include the applicable Indian Standard, requirements, testing steps, and important exceptions.`;
      chatInput.dispatchEvent(new Event("input"));
      voiceStatus.textContent = "Prompt improved";
    });
  }

  function clearAttachment() {
    selectedAttachment = null;
    if (fileInput) fileInput.value = "";
    if (cameraInput) cameraInput.value = "";
    attachmentPreview?.classList.add("hidden");
  }

  function closeAttachMenu() {
    attachMenu?.classList.add("hidden");
    attachMenuBtn?.setAttribute("aria-expanded", "false");
  }

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem("bis-history") || "[]");
    historyPanel.innerHTML = history.length
      ? history.map((query) => `<button type="button" class="history-item">${escapeHtml(query)}</button>`).join("")
      : `<span class="history-empty">Your recent questions will appear here.</span>`;
    historyPanel.querySelectorAll(".history-item").forEach((item) => {
      item.addEventListener("click", () => submitUserQuery(item.textContent));
    });
  }

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

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query || isSubmitting) return;
    submitUserQuery(query);
  });

  async function submitUserQuery(query) {
    if (isSubmitting) return;
    isSubmitting = true;
    lastQuery = query;
    const history = JSON.parse(localStorage.getItem("bis-history") || "[]").filter((item) => item !== query);
    localStorage.setItem("bis-history", JSON.stringify([query, ...history].slice(0, 8)));
    sendBtn.disabled = true;

   
    chatInput.value = "";
    chatInput.style.height = "auto";

    
    const attachmentContext = selectedAttachment ? `\n[Attached file: ${selectedAttachment.name}]` : "";
    const formatContext = responseFormat?.value && responseFormat.value !== "detailed"
      ? `\n[Response format: ${responseFormat.value}]`
      : "";
    const modeContext = assistantMode?.value && assistantMode.value !== "standard"
      ? `\n[Assistant mode: ${assistantMode.value}]`
      : "";
    const sourceContext = sourceSearchToggle?.checked ? "\n[Use official web and source lookup]" : "";
    appendUserMessage(query + attachmentContext);

    
    const typingId = "typing-" + Date.now();
    appendTypingIndicator(typingId);
    scrollToBottom();

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query + attachmentContext + formatContext + modeContext + sourceContext }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();

      
      removeElement(typingId);
      appendAssistantMessage(data);
      clearAttachment();
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

   
    const metaBar = document.createElement("div");
    metaBar.className = "bubble-meta";

    const tagsDiv = document.createElement("div");
    tagsDiv.className = "meta-tags";

   
    const engineTag = document.createElement("span");
    engineTag.className = "meta-tag engine-tag";
    engineTag.textContent = data.engine || "BIS AI";
    tagsDiv.appendChild(engineTag);
    if (data.category) {
      const catTag = document.createElement("span");
      catTag.className = "meta-tag";
      catTag.textContent = formatCategory(data.category);
      tagsDiv.appendChild(catTag);
    }

    (data.extracted_keywords || []).slice(0, 3).forEach((kw) => {
      const kwTag = document.createElement("span");
      kwTag.className = "meta-tag";
      kwTag.textContent = `#${kw}`;
      tagsDiv.appendChild(kwTag);
    });

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
        const dlBtn = card.querySelector(".btn-std-download");
        dlBtn.addEventListener("click", () => {
          downloadStandardPdf(std.preview_id, std.is_number, dlBtn);
        });

        grid.appendChild(card);
      });

      bubble.appendChild(grid);
    }

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

    const markdownDiv = document.createElement("div");
    markdownDiv.className = "bubble-markdown";
    markdownDiv.innerHTML = formatMarkdown(data.answer || "");
    bubble.appendChild(markdownDiv);

    
    if (data.source_url) {
      const sourceBar = document.createElement("div");
      sourceBar.className = "source-bar";
      sourceBar.innerHTML = `
        <span style="color: var(--text-muted);">Source:</span>
        <a href="${escapeHtml(data.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.source_url)}</a>
      `;
      bubble.appendChild(sourceBar);
    }

      const actionBar = document.createElement("div");
      actionBar.className = "response-actions";
      actionBar.innerHTML = `
        <button type="button" data-action="highlight">Highlight</button>
        <button type="button" data-action="copy">Copy answer</button>
        <button type="button" data-action="share">Share</button>
        <button type="button" data-action="regenerate">Regenerate</button>
        <button type="button" data-action="export">Export</button>
      `;
      actionBar.querySelector('[data-action="highlight"]').addEventListener("click", (event) => {
        markdownDiv.classList.toggle("highlighted");
        event.currentTarget.textContent = markdownDiv.classList.contains("highlighted") ? "Remove highlight" : "Highlight";
      });
      actionBar.querySelector('[data-action="copy"]').addEventListener("click", () => navigator.clipboard.writeText(data.answer || ""));
      actionBar.querySelector('[data-action="share"]').addEventListener("click", async () => {
        if (navigator.share) await navigator.share({ title: "BIS Assistant answer", text: data.answer || "" });
        else await navigator.clipboard.writeText(data.answer || "");
      });
      actionBar.querySelector('[data-action="regenerate"]').addEventListener("click", () => submitUserQuery(lastQuery));
      actionBar.querySelector('[data-action="export"]').addEventListener("click", () => exportAnswer(data.answer || ""));
      bubble.appendChild(actionBar);


    function exportAnswer(answer) {
      const blob = new Blob([answer], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "bis-answer.txt";
      link.click();
      URL.revokeObjectURL(link.href);
    }
    row.innerHTML = `<div class="avatar avatar-assistant">BIS</div>`;
    row.appendChild(bubble);
    chatFeed.appendChild(row);
  }

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

  function formatMarkdown(text) {
    if (!text) return "";
    let html = escapeHtml(text);

    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  
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
