const API_URL = "https://whispr2-webapp-backend.vercel.app";

const postForm = document.getElementById("postForm");
const messageInput = document.getElementById("message");
const postsContainer = document.getElementById("postsContainer");
const yourPostsList = document.getElementById("yourPostsList");
const yourPostsBar = document.getElementById("yourPostsBar");

let allPosts = [];
let yourPostIds = JSON.parse(localStorage.getItem("yourPostIds")) || [];

// Toggle Your Posts Panel
function toggleYourPosts() {
  yourPostsBar.style.display = yourPostsBar.style.display === "none" ? "block" : "none";
}

// Submit new post
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  try {
    const res = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const newPost = await res.json();
    yourPostIds.unshift(newPost._id);
    localStorage.setItem("yourPostIds", JSON.stringify(yourPostIds));

    messageInput.value = "";
    await loadPosts();
  } catch (err) {
    alert("Failed to post.");
  }
});

// Load all posts
async function loadPosts() {
  try {
    const res = await fetch(`${API_URL}/posts`);
    allPosts = await res.json();

    shuffleArray(allPosts);
    renderPosts(allPosts);
    renderYourPosts();
  } catch {
    alert("Could not fetch posts.");
  }
}

// Render posts
function renderPosts(posts) {
  postsContainer.innerHTML = "";

  posts.forEach((post) => {
    const postDiv = document.createElement("div");
    postDiv.className = "post";

    const text = document.createElement("p");
    text.textContent = post.text;

    const reactionDiv = document.createElement("div");
    reactionDiv.className = "reactions";

    const upBtn = document.createElement("span");
    upBtn.innerHTML = `👍 ${post.upvotes || 0}`;
    upBtn.onclick = () => vote(post._id, "up");

    const downBtn = document.createElement("span");
    downBtn.innerHTML = `👎 ${post.downvotes || 0}`;
    downBtn.onclick = () => vote(post._id, "down");

    reactionDiv.appendChild(upBtn);
    reactionDiv.appendChild(downBtn);

    postDiv.appendChild(text);
    postDiv.appendChild(reactionDiv);
    postsContainer.appendChild(postDiv);
  });
}

// Vote on a post
async function vote(postId, type) {
  const key = `voted_${postId}`;
  if (localStorage.getItem(key)) {
    alert("Already voted.");
    return;
  }

  try {
    await fetch(`${API_URL}/posts/${postId}/vote`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });

    localStorage.setItem(key, "true");
    await loadPosts();
  } catch {
    alert("Vote failed.");
  }
}

// Render your posts
function renderYourPosts() {
  yourPostsList.innerHTML = "";

  const userPosts = allPosts.filter(post => yourPostIds.includes(post._id));
  userPosts.forEach(post => {
    const div = document.createElement("div");
    div.className = "your-post";
    div.textContent = post.text;

    const meta = document.createElement("small");
    meta.textContent = `👍 ${post.upvotes || 0} 👎 ${post.downvotes || 0}`;
    div.appendChild(meta);

    yourPostsList.appendChild(div);
  });
}

// Trending tab logic
function showTrending() {
  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const trending = allPosts
    .filter(p => new Date(p.createdAt) > oneDayAgo)
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  renderPosts(trending);
}

// Toggle post form
const formToggle = document.getElementById("formToggle");
formToggle.addEventListener("click", () => {
  postForm.style.display = postForm.style.display === "flex" ? "none" : "flex";
});

// Random shuffle
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Load posts on start
window.onload = loadPosts;