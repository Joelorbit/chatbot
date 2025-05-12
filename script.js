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
      // Clean the message: remove asterisks and markdown
      let cleanMessage = message
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*/g, '') // Remove all asterisks
        .trim();

      // Simple heuristic to detect code: look for common code patterns or backticks
      const hasCode = cleanMessage.match(/```[\s\S]*```/) || 
                     cleanMessage.match(/\b(function|if|for|while|const|let|var)\b/) || 
                     cleanMessage.includes('(') && cleanMessage.includes(')') && cleanMessage.includes('{');

      if (hasCode) {
        // Extract code blocks (between ``` if present, or treat the whole message as code)
        const codeRegex = /```[\s\S]*?```/g;
        const codeBlocks = cleanMessage.match(codeRegex);
        let content = '';

        if (codeBlocks) {
          // Split the message around code blocks
          let remainingText = cleanMessage;
          let lastIndex = 0;

          codeBlocks.forEach(block => {
            const codeStart = remainingText.indexOf(block, lastIndex);
            const beforeCode = remainingText.substring(lastIndex, codeStart).trim();

            if (beforeCode) {
              // Add non-code text as a paragraph
              content += `<p class="response-text">${beforeCode}</p>`;
            }

            // Add the code block
            const codeContent = block.replace(/```/g, '').trim();
            content += `<pre class="code-block">${codeContent}</pre>`;
            lastIndex = codeStart + block.length;
          });

          // Add any remaining text after the last code block
          const afterCode = remainingText.substring(lastIndex).trim();
          if (afterCode) {
            content += `<p class="response-text">${afterCode}</p>`;
          }
        } else {
          // If no ``` but code-like content detected, treat the whole message as code
          content = `<pre class="code-block">${cleanMessage}</pre>`;
        }

        chatLi.innerHTML = content;
      } else {
        // For non-code responses, split into paragraphs if there are distinct sections
        const paragraphs = cleanMessage.split(/\n\s*\n/).filter(p => p.trim());
        let content = '';

        if (paragraphs.length > 1) {
          // If there are multiple paragraphs, create separate boxes
          paragraphs.forEach(paragraph => {
            content += `<p class="response-text">${paragraph.trim()}</p>`;
          });
        } else {
          // Single paragraph, no separation needed
          content = `<p class="response-text">${cleanMessage.replace(/\n/g, ' ').trim()}</p>`;
        }

        chatLi.innerHTML = content;
      }
    } else {
      // For outgoing messages, keep it simple
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

      // Get the response text
      let responseText = data.candidates[0].content.parts[0].text;
      
      // Recreate the chat element with the formatted response
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

  const startChatFunction = () => {
    startChat.style.display = "none";
    chatbot.style.display = "flex";
    chatbox.innerHTML = '';
    chatbox.appendChild(createChatLi("Hi there 👋 How can I help you today?", "incoming"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
    chatbot.style.opacity = "0";
    setTimeout(() => {
      chatbot.style.opacity = "1";
    }, 10);
  };

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
});