document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.querySelector(".close-btn");
  const chatbox = document.querySelector(".chatbox");
  const chatInput = document.querySelector(".chat-input textarea");
  const sendChatBtn = document.querySelector("#send-btn");
  const chatbot = document.querySelector(".chatbot");
  const startChat = document.querySelector(".start-chat");
  const startBtn = document.querySelector("#start-btn");

  let userMessage = null; 
  const inputInitHeight = chatInput.scrollHeight;

  const API_KEY = "AIzaSyDnqZ7k3z3_hIqnJ5xoZbQ-55ZaR_2l4lU"; 
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);

    if (className === "incoming") {
      let cleanMessage = message
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*/g, '')
        .trim();

      const hasCode = cleanMessage.match(/```[\s\S]*```/) || 
                     cleanMessage.match(/\b(function|if|for|while|const|let|var)\b/) || 
                     cleanMessage.includes('(') && cleanMessage.includes(')') && cleanMessage.includes('{');

      if (hasCode) {
        const codeRegex = /```[\s\S]*?```/g;
        const codeBlocks = cleanMessage.match(codeRegex);
        let content = '';

        if (codeBlocks) {
          let remainingText = cleanMessage;
          let lastIndex = 0;

          codeBlocks.forEach(block => {
            const codeStart = remainingText.indexOf(block, lastIndex);
            const beforeCode = remainingText.substring(lastIndex, codeStart).trim();

            if (beforeCode) {
              content += `<p class="response-text">${beforeCode}</p>`;
            }

            const codeContent = block.replace(/```/g, '').trim();
            content += `<pre class="code-block">${codeContent}</pre>`;
            lastIndex = codeStart + block.length;
          });

          const afterCode = remainingText.substring(lastIndex).trim();
          if (afterCode) {
            content += `<p class="response-text">${afterCode}</p>`;
          }
        } else {
          content = `<pre class="code-block">${cleanMessage}</pre>`;
        }

        chatLi.innerHTML = content;
      } else {
        const paragraphs = cleanMessage.split(/\n\s*\n/).filter(p => p.trim());
        let content = '';

        if (paragraphs.length > 1) {
          paragraphs.forEach(paragraph => {
            content += `<p class="response-text">${paragraph.trim()}</p>`;
          });
        } else {
          content = `<p class="response-text">${cleanMessage.replace(/\n/g, ' ').trim()}</p>`;
        }

        chatLi.innerHTML = content;
      }
    } else {
      chatLi.innerHTML = `<p>${message}</p>`;
    }

    return chatLi;
  };

  const generateResponse = async (chatElement) => {
    const messageElement = chatElement.querySelector("p") || chatElement.querySelector("pre");
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [{ 
          role: "user", 
          parts: [{ text: userMessage }] 
        }] 
      }),
    };

    try {
      const response = await fetch(API_URL, requestOptions);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);

      let responseText = data.candidates[0].content.parts[0].text;
      
      const newChatLi = createChatLi(responseText, "incoming");
      chatElement.parentNode.replaceChild(newChatLi, chatElement);
    } catch (error) {
      messageElement.classList.add("error");
      messageElement.textContent = error.message;
    } finally {
      chatbox.scrollTo(0, chatbox.scrollHeight);
    }
  };

  const handleChat = () => {
    userMessage = chatInput.value.trim(); 
    if (!userMessage) return;

    if (userMessage.toLowerCase() === "x") {
      chatbot.style.display = "none";
      startChat.style.display = "flex";
      chatInput.value = "";
      chatInput.style.height = `${inputInitHeight}px`;
      return;
    }

    chatInput.value = "";
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(() => {
      const incomingChatLi = createChatLi("Thinking...", "incoming");
      chatbox.appendChild(incomingChatLi);
      chatbox.scrollTo(0, chatbox.scrollHeight);
      generateResponse(incomingChatLi);
    }, 600);
  };

  // Updated startChatFunction now simply starts the chat without quiz functionality.
  const startChatFunction = () => {
    startChat.style.display = "none";
    chatbot.style.display = "flex";
    chatbox.innerHTML = '';
    chatbot.style.opacity = "0";
    setTimeout(() => {
      chatbot.style.opacity = "1";
    }, 10);
  };

  // Input auto-grow
  chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
      e.preventDefault();
      handleChat();
    }
  });

  sendChatBtn.addEventListener("click", handleChat);
  closeBtn.addEventListener("click", () => {
    chatbot.style.display = "none";
    startChat.style.display = "flex";
  });
  startBtn.addEventListener("click", startChatFunction);

  const clearBtn = document.querySelector("#clear-chat-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (chatbox) {
        chatbox.innerHTML = "";
        chatbox.scrollTo(0, 0);
      }
    });
  }
});