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
const auth = firebase.auth();

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

// New Login Prompt Elements
const loginPrompt = document.getElementById("login-prompt");
const promptLoginLink = document.getElementById("prompt-login-link");
const promptSignupLink = document.getElementById("prompt-signup-link");

let currentUser = null;

// --- Authentication Logic ---
auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    userDisplay.textContent = user.email;
    authButton.textContent = "Logout";
    authButton.classList.add("logout");
    myLibraryHeading.style.display = "block";
    myLibraryContainer.style.display = "block";
    loginPrompt.style.display = "none"; // लॉगिन होने पर प्रॉम्प्ट छिपाएं
    loadPurchasedTests(user.uid);
    authModal.style.display = "none";
  } else {
    userDisplay.textContent = "Guest";
    authButton.textContent = "Login";
    authButton.classList.remove("logout");
    myLibraryHeading.style.display = "none";
    myLibraryContainer.style.display = "none";
    purchasedTestsContainer.innerHTML = "";
    referralMessage.textContent = "";
    referralCodeInput.value = "";
    // अगर उपयोगकर्ता लॉग आउट हो गया है तो प्रॉम्प्ट दिखाएं
    loginPrompt.style.display = "block";
  }
  loadTestUnits();
});

// ... (existing code for authButton, closeButton, toggleSignupLink, toggleLoginLink, authForm) ...

if (authButton) {
  authButton.addEventListener("click", () => {
    if (currentUser) {
      auth
        .signOut()
        .then(() => alert("आप लॉग आउट हो गए हैं।"))
        .catch((error) => console.error("लॉग आउट त्रुटि:", error.message));
    } else {
      authModal.style.display = "block";
      authModalTitle.textContent = "Login";
      authSubmitBtn.textContent = "Login";
      toggleLoginLink.style.display = "none";
      toggleSignupLink.style.display = "inline";
      authForm.reset();
    }
  });
}

if (closeButton) {
  closeButton.addEventListener("click", () => {
    authModal.style.display = "none";
  });
}

window.addEventListener("click", (event) => {
  if (event.target == authModal) {
    authModal.style.display = "none";
  }
});

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
      authModal.style.display = "none";
    } catch (error) {
      alert(`Authentication Error: ${error.message}`);
    }
  });
}

// --- Load Available Test Units ---
async function loadTestUnits() {
  //
  try {
    const testsRef = rtdb.ref("tests"); //
    const snapshot = await testsRef.get(); //

    if (!snapshot.exists()) {
      //
      testUnitsContainer.innerHTML = "<p>कोई टेस्ट यूनिट उपलब्ध नहीं है।</p>"; //
      return; //
    }

    const testsData = snapshot.val(); //
    let unitsHtml = ""; //

    for (const unitId in testsData) {
      //
      if (testsData.hasOwnProperty(unitId)) {
        //
        const unitData = testsData[unitId]; //
        // यदि उपयोगकर्ता लॉग इन नहीं है और टेस्ट खरीदी नहीं गई है तो "Start Test" बटन को छिपाएं
        // या "Buy Test" बटन दिखाएं
        let actionButton = "";
        if (currentUser) {
          const userPurchasedTestsRef = rtdb.ref(
            `users/${currentUser.uid}/purchasedTests/${unitId}`
          );
          const userSnapshot = await userPurchasedTestsRef.get();
          if (userSnapshot.exists()) {
            actionButton = `<a href="test.html?unit=${unitId}" class="start-test-btn">Start Test</a>`;
          } else {
            actionButton = `<button class="buy-test-btn" data-unit-id="${unitId}" data-unit-title="${
              unitData.title || `यूनिट ${unitId}`
            }">Buy Test</button>`;
          }
        } else {
          // लॉग इन नहीं है तो "Buy Test" बटन दिखाएं
          actionButton = `<button class="buy-test-btn" data-unit-id="${unitId}" data-unit-title="${
            unitData.title || `यूनिट ${unitId}`
          }">Buy Test</button>`;
        }

        unitsHtml += `
                    <div class="unit-card">
                        <h3>${unitData.title || `यूनिट ${unitId}`}</h3>
                        <p>${unitData.description || "कोई विवरण नहीं।"}</p>
                        <button class="view-test-details-btn" data-unit-id="${unitId}">Details</button>
                        ${actionButton}
                    </div>
                `;
      }
    }

    if (unitsHtml === "") {
      //
      testUnitsContainer.innerHTML =
        "<p>कोई टेस्ट यूनिट सही फॉर्मेट में उपलब्ध नहीं है।</p>"; //
    } else {
      testUnitsContainer.innerHTML = unitsHtml; //
    }

    document.querySelectorAll(".buy-test-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const unitId = e.target.dataset.unitId;
        const unitTitle = e.target.dataset.unitTitle;
        handleBuyTest(unitId, unitTitle);
      });
    });
    document.querySelectorAll(".view-test-details-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const unitId = e.target.dataset.unitId;
        alert(`Details for Test Unit: ${unitId} (Feature coming soon!)`);
      });
    });
  } catch (error) {
    //
    console.error("टेस्ट यूनिट्स लोड करने में त्रुटि:", error); //
    testUnitsContainer.innerHTML =
      "<p>टेस्ट लोड करने में विफल। कृपया बाद में प्रयास करें।</p>"; //
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
        const testIdToUnlock = codeData.unlocksTest;

        if (testIdToUnlock) {
          const userPurchasedTestsRef = rtdb.ref(
            `users/${currentUser.uid}/purchasedTests/${testIdToUnlock}`
          );
          const userSnapshot = await userPurchasedTestsRef.get();

          if (userSnapshot.exists()) {
            referralMessage.textContent =
              "आपके पास पहले से ही यह टेस्ट सीरीज है।";
            referralMessage.style.color = "orange";
          } else {
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
            loadPurchasedTests(currentUser.uid);
            referralCodeInput.value = "";
            loadTestUnits(); // सार्वजनिक टेस्ट इकाइयों को रीफ्रेश करें ताकि "Buy Test" बटन "Start Test" में बदल जाए
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

function handleBuyTest(unitId, unitTitle) {
  if (!currentUser) {
    alert("कृपया टेस्ट खरीदने के लिए लॉग इन करें।");
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
  myLibraryHeading.scrollIntoView({ behavior: "smooth" });
  referralCodeInput.focus();
}

// --- Initial Page Load Logic ---
window.onload = () => {
  //
  const hasVisitedBefore = localStorage.getItem("hasVisitedAkashTestbook"); //

  // यदि यह पहली बार विज़िट है और उपयोगकर्ता लॉग इन नहीं है, तो प्रॉम्प्ट दिखाएं
  if (!hasVisitedBefore && !currentUser) {
    //
    loginPrompt.style.display = "block"; // प्रॉम्प्ट दिखाएं
    // Optionally, show the login modal immediately
    // authModal.style.display = 'block';
    // authModalTitle.textContent = 'Login';
    // authSubmitBtn.textContent = 'Login';
    // toggleLoginLink.style.display = 'none';
    // toggleSignupLink.style.display = 'inline';
  } else if (currentUser) {
    loginPrompt.style.display = "none"; // अगर यूजर लॉगिन है तो छिपाएं
  }
  // पहली बार विजिट होने पर localStorage में मार्क करें
  localStorage.setItem("hasVisitedAkashTestbook", "true"); //

  // प्रॉम्प्ट के लिंक पर क्लिक लिसनर जोड़ें
  if (promptLoginLink) {
    promptLoginLink.addEventListener("click", (e) => {
      e.preventDefault();
      authModal.style.display = "block";
      authModalTitle.textContent = "Login";
      authSubmitBtn.textContent = "Login";
      toggleLoginLink.style.display = "none";
      toggleSignupLink.style.display = "inline";
      authForm.reset();
    });
  }

  if (promptSignupLink) {
    promptSignupLink.addEventListener("click", (e) => {
      e.preventDefault();
      authModal.style.display = "block";
      authModalTitle.textContent = "Sign Up";
      authSubmitBtn.textContent = "Sign Up";
      toggleSignupLink.style.display = "none";
      toggleLoginLink.style.display = "inline";
      authForm.reset();
    });
  }

  // auth.onAuthStateChanged loadTestUnits को पहले ही ट्रिगर करेगा
};
