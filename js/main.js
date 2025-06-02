// आपकी Firebase कॉन्फ़िगरेशन यहाँ डालें
const firebaseConfig = {
  apiKey: "AIzaSyA5MtfhOJkaZQlRTkzSKZuPtq4dmrsg9sc",
  authDomain: "aitestbook.firebaseapp.com",
  projectId: "aitestbook",
  databaseURL:
    "https://aitestbook-default-rtdb.asia-southeast1.firebasedatabase.app/",
  storageBucket: "aitestbook.firebasestorage.app",
  messagingSenderId: "881340974074",
  appId: "1:881340974074:web:7e355216ae6521e77fda43",
};

// Firebase को इनिशियलाइज़ करें
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
// Realtime Database सर्विस को एक्सेस करें
const rtdb = firebase.database();
const auth = firebase.auth(); // Firebase Authentication सर्विस को एक्सेस करें

const testUnitsContainer = document.getElementById("test-units-container");
const myLibraryHeading = document.getElementById("my-library-heading");
const myLibraryContainer = document.getElementById("my-library-container");
const purchasedTestsContainer = document.getElementById(
  "purchased-tests-container"
);
const referralCodeInput = document.getElementById("referral-code-input");
const applyReferralBtn = document.getElementById("apply-referral-btn");
const referralMessage = document.getElementById("referral-message");

// Auth Modal Elements
const authModal = document.getElementById("auth-modal");
const authModalTitle = document.getElementById("auth-modal-title");
const authForm = document.getElementById("auth-form");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const closeButton = document.querySelector(".modal .close-button");
const toggleSignupLink = document.getElementById("toggle-signup");
const toggleLoginLink = document.getElementById("toggle-login");

// Header Auth Elements
const authButton = document.getElementById("auth-button");
const userDisplay = document.getElementById("user-display");

let currentUser = null; // वर्तमान में लॉग-इन उपयोगकर्ता

// --- Authentication Logic ---
auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    userDisplay.textContent = user.email;
    authButton.textContent = "Logout";
    authButton.classList.add("logout");
    myLibraryHeading.style.display = "block";
    myLibraryContainer.style.display = "block";
    loadPurchasedTests(user.uid); // उपयोगकर्ता की खरीदी गई टेस्ट्स लोड करें
    authModal.style.display = "none"; // यदि उपयोगकर्ता लॉग इन है तो मोडल छिपाएं
  } else {
    userDisplay.textContent = "Guest";
    authButton.textContent = "Login";
    authButton.classList.remove("logout");
    myLibraryHeading.style.display = "none";
    myLibraryContainer.style.display = "none";
    purchasedTestsContainer.innerHTML = ""; // लाइब्रेरी को साफ़ करें
    referralMessage.textContent = "";
    referralCodeInput.value = "";
  }
  loadTestUnits(); // सार्वजनिक टेस्ट इकाइयाँ हमेशा लोड करें
});

if (authButton) {
  authButton.addEventListener("click", () => {
    if (currentUser) {
      // Logout
      auth
        .signOut()
        .then(() => alert("आप लॉग आउट हो गए हैं।"))
        .catch((error) => console.error("लॉग आउट त्रुटि:", error.message));
    } else {
      // Login/Signup Modal दिखाएं
      authModal.style.display = "block";
      authModalTitle.textContent = "Login";
      authSubmitBtn.textContent = "Login";
      toggleLoginLink.style.display = "none";
      toggleSignupLink.style.display = "inline";
      authForm.reset(); // फॉर्म को साफ़ करें
    }
  });
}

// Close modal button
if (closeButton) {
  closeButton.addEventListener("click", () => {
    authModal.style.display = "none";
  });
}

// Click outside modal to close
window.addEventListener("click", (event) => {
  if (event.target == authModal) {
    authModal.style.display = "none";
  }
});

// Toggle between Login and Sign Up
if (toggleSignupLink) {
  toggleSignupLink.addEventListener("click", (e) => {
    e.preventDefault();
    authModalTitle.textContent = "Sign Up";
    authSubmitBtn.textContent = "Sign Up";
    toggleSignupLink.style.display = "none";
    toggleLoginLink.style.display = "inline";
    authForm.reset();
  });
}

if (toggleLoginLink) {
  toggleLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    authModalTitle.textContent = "Login";
    authSubmitBtn.textContent = "Login";
    toggleLoginLink.style.display = "none";
    toggleSignupLink.style.display = "inline";
    authForm.reset();
  });
}

// Handle Login/Sign Up Form Submission
if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    const isLogin = authSubmitBtn.textContent === "Login";

    try {
      if (isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
        alert("सफलतापूर्वक लॉग इन किया गया!");
      } else {
        await auth.createUserWithEmailAndPassword(email, password);
        alert("खाता सफलतापूर्वक बनाया गया और लॉग इन किया गया!");
      }
      authModal.style.display = "none"; // Close modal on success
    } catch (error) {
      alert(`Authentication Error: ${error.message}`);
    }
  });
}

// --- Load Available Test Units ---
async function loadTestUnits() {
  try {
    const testsRef = rtdb.ref("tests");
    const snapshot = await testsRef.get();

    if (!snapshot.exists()) {
      testUnitsContainer.innerHTML = "<p>कोई टेस्ट यूनिट उपलब्ध नहीं है।</p>";
      return;
    }

    const testsData = snapshot.val();
    let unitsHtml = "";

    for (const unitId in testsData) {
      if (testsData.hasOwnProperty(unitId)) {
        const unitData = testsData[unitId];
        unitsHtml += `
                    <div class="unit-card">
                        <h3>${unitData.title || `यूनिट ${unitId}`}</h3>
                        <p>${unitData.description || "कोई विवरण नहीं।"}</p>
                        <button class="view-test-details-btn" data-unit-id="${unitId}">Details</button>
                        <button class="buy-test-btn" data-unit-id="${unitId}" data-unit-title="${
          unitData.title || `यूनिट ${unitId}`
        }">Buy Test</button>
                    </div>
                `;
      }
    }

    if (unitsHtml === "") {
      testUnitsContainer.innerHTML =
        "<p>कोई टेस्ट यूनिट सही फॉर्मेट में उपलब्ध नहीं है।</p>";
    } else {
      testUnitsContainer.innerHTML = unitsHtml;
    }

    // Add event listeners for "Buy Test" buttons
    document.querySelectorAll(".buy-test-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const unitId = e.target.dataset.unitId;
        const unitTitle = e.target.dataset.unitTitle;
        handleBuyTest(unitId, unitTitle);
      });
    });
    // Add event listeners for "Details" buttons (for future expansion)
    document.querySelectorAll(".view-test-details-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const unitId = e.target.dataset.unitId;
        alert(`Details for Test Unit: ${unitId} (Feature coming soon!)`);
      });
    });
  } catch (error) {
    console.error("टेस्ट यूनिट्स लोड करने में त्रुटि:", error);
    testUnitsContainer.innerHTML =
      "<p>टेस्ट लोड करने में विफल। कृपया बाद में प्रयास करें।</p>";
  }
}

// --- Referral Code System ---
if (applyReferralBtn) {
  applyReferralBtn.addEventListener("click", async () => {
    if (!currentUser) {
      referralMessage.textContent =
        "कृपया रेफरल कोड का उपयोग करने के लिए लॉग इन करें।";
      referralMessage.style.color = "orange";
      return;
    }

    const referralCode = referralCodeInput.value.trim().toUpperCase();
    if (!referralCode) {
      referralMessage.textContent = "कृपया एक रेफरल कोड दर्ज करें।";
      referralMessage.style.color = "red";
      return;
    }

    try {
      const codeRef = rtdb.ref(`referralCodes/${referralCode}`);
      const snapshot = await codeRef.get();

      if (snapshot.exists()) {
        const codeData = snapshot.val();
        const testIdToUnlock = codeData.unlocksTest; // वह टेस्ट जिसे यह कोड अनलॉक करता है

        if (testIdToUnlock) {
          // जांचें कि क्या उपयोगकर्ता के पास पहले से ही यह टेस्ट है
          const userPurchasedTestsRef = rtdb.ref(
            `users/${currentUser.uid}/purchasedTests/${testIdToUnlock}`
          );
          const userSnapshot = await userPurchasedTestsRef.get();

          if (userSnapshot.exists()) {
            referralMessage.textContent =
              "आपके पास पहले से ही यह टेस्ट सीरीज है।";
            referralMessage.style.color = "orange";
          } else {
            // टेस्ट को उपयोगकर्ता की लाइब्रेरी में जोड़ें
            const testTitleRef = rtdb.ref(`tests/${testIdToUnlock}/title`);
            const testTitleSnapshot = await testTitleRef.get();
            const testTitle = testTitleSnapshot.exists()
              ? testTitleSnapshot.val()
              : `Test ${testIdToUnlock}`;

            await userPurchasedTestsRef.set({
              title: testTitle,
              purchasedDate: new Date().toISOString(),
            });
            referralMessage.textContent = `रेफरल कोड "${referralCode}" सफलतापूर्वक लागू किया गया! टेस्ट सीरीज "${testTitle}" आपकी लाइब्रेरी में जोड़ दी गई है।`;
            referralMessage.style.color = "green";
            loadPurchasedTests(currentUser.uid); // लाइब्रेरी को रीफ्रेश करें
            referralCodeInput.value = ""; // इनपुट साफ़ करें
          }
        } else {
          referralMessage.textContent =
            "यह रेफरल कोड किसी भी टेस्ट से जुड़ा नहीं है।";
          referralMessage.style.color = "red";
        }
      } else {
        referralMessage.textContent = "अमान्य रेफरल कोड।";
        referralMessage.style.color = "red";
      }
    } catch (error) {
      console.error("रेफरल कोड लागू करने में त्रुटि:", error);
      referralMessage.textContent = `रेफरल कोड लागू करने में त्रुटि: ${error.message}`;
      referralMessage.style.color = "red";
    }
  });
}

// --- User Library Display ---
async function loadPurchasedTests(uid) {
  try {
    const purchasedTestsRef = rtdb.ref(`users/${uid}/purchasedTests`);
    const snapshot = await purchasedTestsRef.get();

    if (!snapshot.exists() || Object.keys(snapshot.val()).length === 0) {
      purchasedTestsContainer.innerHTML =
        "<p>आपके पास अभी तक कोई खरीदी गई टेस्ट सीरीज नहीं है।</p>";
      return;
    }

    const purchasedData = snapshot.val();
    let purchasedHtml = "";

    for (const testId in purchasedData) {
      if (purchasedData.hasOwnProperty(testId)) {
        const testDetails = purchasedData[testId];
        purchasedHtml += `
                    <div class="unit-card purchased-card">
                        <h3>${testDetails.title || `Test ${testId}`}</h3>
                        <p>Purchased: ${new Date(
                          testDetails.purchasedDate
                        ).toLocaleDateString()}</p>
                        <a href="test.html?unit=${testId}" class="start-test-btn">Start Test</a>
                    </div>
                `;
      }
    }
    purchasedTestsContainer.innerHTML = purchasedHtml;
  } catch (error) {
    console.error("खरीदी गई टेस्ट्स लोड करने में त्रुटि:", error);
    purchasedTestsContainer.innerHTML =
      "<p>आपकी खरीदी गई टेस्ट्स लोड करने में विफल।</p>";
  }
}

// Dummy function for Buy Test (since we are using referral codes)
function handleBuyTest(unitId, unitTitle) {
  if (!currentUser) {
    alert("कृपया टेस्ट खरीदने के लिए लॉग इन करें।");
    // आप यहां लॉगिन मोडल भी दिखा सकते हैं
    authModal.style.display = "block";
    authModalTitle.textContent = "Login";
    authSubmitBtn.textContent = "Login";
    toggleLoginLink.style.display = "none";
    toggleSignupLink.style.display = "inline";
    authForm.reset();
    return;
  }
  alert(
    `इस टेस्ट को खरीदने के लिए रेफरल कोड का उपयोग करें। "My Library" सेक्शन में रेफरल कोड दर्ज करें।`
  );
  // या आप रेफरल कोड इनपुट को सीधे दिखा सकते हैं
  myLibraryHeading.scrollIntoView({ behavior: "smooth" });
  referralCodeInput.focus();
}

// पेज लोड होने पर सार्वजनिक टेस्ट इकाइयाँ लोड करें
window.onload = () => {
  // Authentication listener loadTestUnits को ट्रिगर करेगा
};
