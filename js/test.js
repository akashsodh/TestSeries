// console.log("TEST.JS SCRIPT LOADED AND RUNNING!");
// आपकी Firebase कॉन्फ़िगरेशन यहाँ डालें (main.js के समान)
const firebaseConfig = {
    apiKey: "AIzaSyA5MtfhOJkaZQlRTkzSKZuPtq4dmrsg9sc",
    authDomain: "aitestbook.firebaseapp.com",
    projectId: "aitestbook", // Realtime Database के लिए projectId ज़रूरी नहीं, पर SDK के लिए है
    databaseURL: "https://aitestbook-default-rtdb.asia-southeast1.firebasedatabase.app/", // <<--- यह Realtime Database के लिए महत्वपूर्ण है!
    storageBucket: "aitestbook.firebasestorage.app", //
    messagingSenderId: "881340974074",
    appId: "1:881340974074:web:7e355216ae6521e77fda43"
};

// // Firebase को इनिशियलाइज़ करें
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} //
// Realtime Database सर्विस को एक्सेस करें
const rtdb = firebase.database();
const auth = firebase.auth(); // Firebase Authentication सर्विस को एक्सेस करें

const quizContainer = document.getElementById('quiz-container');
const testTitleElement = document.getElementById('test-title');
// const submitButtonOriginal = document.getElementById('submit-test-btn'); // // यह HTML से हटाया जा सकता है या छिपाया जा सकता है
const submitButtonSidebar = document.getElementById('submit-test-btn-sidebar');
const resultContainer = document.getElementById('result-container'); //
const scoreElement = document.getElementById('score');

const backButton = document.getElementById('back-btn');
const nextButton = document.getElementById('next-btn');
const clearOptionButton = document.getElementById('clear-option-btn');
const navigationButtonsContainer = document.getElementById('navigation-buttons'); //

const questionNavigationTable = document.getElementById('question-navigation-table');
const quizContent = document.getElementById('quiz-content'); //
const decreaseFontButton = document.getElementById('decrease-font'); //
const increaseFontButton = document.getElementById('increase-font'); //
const currentFontSizeSpan = document.getElementById('current-font-size');
const shuffleQuestionsButton = document.getElementById('shuffle-questions-btn'); //
const shuffleOptionsButton = document.getElementById('shuffle-options-btn');

const liveFeedbackContainer = document.getElementById('question-feedback-live');
const liveCorrectAnswersSpan = document.getElementById('live-correct-answers');
const liveIncorrectAnswersSpan = document.getElementById('live-incorrect-answers');

// --- नए एलिमेंट्स ---
const sidebar = document.getElementById('sidebar');
const sidebarToggleButton = document.getElementById('sidebar-toggle-btn');
const authButton = document.getElementById('auth-button');
const userDisplay = document.getElementById('user-display');
// --- ---

let currentQuestions = []; //
let userAnswers = []; // उपयोगकर्ताओं के उत्तरों को संग्रहीत करने के लिए
let currentQuestionIndex = 0; //
let questionsShuffled = false; //
let optionsShuffled = false; //
let baseFontSize = 16; // // पिक्सल में
let currentUser = null; // वर्तमान में लॉग-इन उपयोगकर्ता

// URL से यूनिट आईडी प्राप्त करें
const urlParams = new URLSearchParams(window.location.search);
const unitId = urlParams.get('unit'); //

// --- Authentication Logic ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        userDisplay.textContent = user.email;
        authButton.textContent = 'Logout';
        authButton.classList.add('logout');
        loadUserDataFromFirebase(user.uid, unitId); // उपयोगकर्ता के टेस्ट डेटा को लोड करें
    } else {
        userDisplay.textContent = 'Guest';
        authButton.textContent = 'Login';
        authButton.classList.remove('logout');
        // उपयोगकर्ता लॉगआउट होने पर localStorage से डेटा लोड करें (यदि कोई हो)
        loadUserDataFromLocalStorage(unitId);
    }
});

if (authButton) {
    authButton.addEventListener('click', async () => {
        if (currentUser) {
            // Logout
            await auth.signOut();
            alert('आप लॉग आउट हो गए हैं।');
            resetQuizStateForNewUser(); // यूज़र लॉगआउट होने पर क्विज़ को रीसेट करें
        } else {
            // Login (एक साधारण प्रॉम्प्ट के साथ, वास्तविक ऐप में एक अच्छा UI होगा)
            const email = prompt('कृपया अपना ईमेल दर्ज करें:');
            const password = prompt('कृपया अपना पासवर्ड दर्ज करें:');

            if (email && password) {
                try {
                    await auth.signInWithEmailAndPassword(email, password);
                    alert('सफलतापूर्वक लॉग इन किया गया!');
                } catch (error) {
                    // यदि उपयोगकर्ता मौजूद नहीं है, तो उसे पंजीकृत करने का प्रयास करें
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                        const confirmRegister = confirm('यह उपयोगकर्ता मौजूद नहीं है या पासवर्ड गलत है। क्या आप एक नया खाता बनाना चाहते हैं?');
                        if (confirmRegister) {
                            try {
                                await auth.createUserWithEmailAndPassword(email, password);
                                alert('खाता सफलतापूर्वक बनाया गया और लॉग इन किया गया!');
                            } catch (regError) {
                                alert(`खाता बनाने में त्रुटि: ${regError.message}`);
                            }
                        }
                    } else {
                        alert(`लॉगिन त्रुटि: ${error.message}`);
                    }
                }
            }
        }
    });
}

function resetQuizStateForNewUser() {
    // प्रश्नों और उत्तरों को पूरी तरह से रीसेट करें, नए उपयोगकर्ता के लिए तैयार करें
    currentQuestionIndex = 0;
    userAnswers = [];
    questionsShuffled = false;
    optionsShuffled = false;
    quizContainer.innerHTML = '<p>प्रश्न पुनः लोड हो रहे हैं...</p>';
    resultContainer.style.display = 'none';
    liveCorrectAnswersSpan.textContent = '0';
    liveIncorrectAnswersSpan.textContent = '0';
    submitButtonSidebar.style.display = 'block';
    navigationButtonsContainer.style.display = 'block';
    liveFeedbackContainer.style.display = 'block';
    decreaseFontButton.disabled = false;
    increaseFontButton.disabled = false;
    shuffleQuestionsButton.disabled = false;
    shuffleOptionsButton.disabled = false;
    
    // सुनिश्चित करें कि क्विज़ UI साफ़ हो
    document.querySelectorAll('.question-card').forEach(card => card.remove());
    if(questionNavigationTable) questionNavigationTable.innerHTML = '';

    loadQuestions(unitId); // वर्तमान यूनिट के प्रश्नों को फिर से लोड करें
}


async function loadUserDataFromFirebase(uid, unitId) {
    try {
        const userTestRef = rtdb.ref(`users/${uid}/tests/${unitId}`);
        const snapshot = await userTestRef.get();
        if (snapshot.exists()) {
            const userData = snapshot.val();
            // यदि डेटा Firebase में है, तो उसे उपयोग करें
            if (userData.userAnswers) {
                userAnswers = userData.userAnswers;
            }
            if (userData.currentQuestionIndex !== undefined) {
                currentQuestionIndex = userData.currentQuestionIndex;
            }
            if (userData.questionsShuffled !== undefined) {
                questionsShuffled = userData.questionsShuffled;
            }
            if (userData.optionsShuffled !== undefined) {
                optionsShuffled = userData.optionsShuffled;
            }
            // फ़ॉन्ट साइज़ भी लोड कर सकते हैं यदि Firebase में सहेजा गया हो
            if (userData.baseFontSize !== undefined) {
                baseFontSize = userData.baseFontSize;
                updateFontSize();
            }
            console.log("Firebase से डेटा लोड किया गया:", userData);
        } else {
            // Firebase में डेटा नहीं है, localStorage से लोड करें
            loadUserDataFromLocalStorage(unitId);
            console.log("Firebase में कोई डेटा नहीं मिला, localStorage से लोड कर रहा हूँ।");
        }
    } catch (error) {
        console.error("Firebase से उपयोगकर्ता डेटा लोड करने में त्रुटि:", error);
        loadUserDataFromLocalStorage(unitId); // त्रुटि होने पर localStorage से लोड करें
    }
    loadQuestions(unitId); // डेटा लोड होने के बाद प्रश्न लोड करें
}

function loadUserDataFromLocalStorage(unitId) {
    const localData = JSON.parse(localStorage.getItem(`testProgress_${unitId}`) || '{}');
    if (localData.userAnswers) {
        userAnswers = localData.userAnswers;
    } else {
        userAnswers = new Array(currentQuestions.length).fill(null);
    }
    if (localData.currentQuestionIndex !== undefined) {
        currentQuestionIndex = localData.currentQuestionIndex;
    } else {
        currentQuestionIndex = 0;
    }
    if (localData.questionsShuffled !== undefined) {
        questionsShuffled = localData.questionsShuffled;
    } else {
        questionsShuffled = false;
    }
    if (localData.optionsShuffled !== undefined) {
        optionsShuffled = localData.optionsShuffled;
    } else {
        optionsShuffled = false;
    }
    if (localData.baseFontSize !== undefined) {
        baseFontSize = localData.baseFontSize;
    } else {
        baseFontSize = 16;
    }
    console.log("localStorage से डेटा लोड किया गया:", localData);
}

function saveUserData() {
    const dataToSave = {
        userAnswers: userAnswers,
        currentQuestionIndex: currentQuestionIndex,
        questionsShuffled: questionsShuffled,
        optionsShuffled: optionsShuffled,
        baseFontSize: baseFontSize // फ़ॉन्ट साइज़ भी सहेजें
    };

    // localStorage में सहेजें
    localStorage.setItem(`testProgress_${unitId}`, JSON.stringify(dataToSave));

    // Firebase में सहेजें यदि उपयोगकर्ता लॉग इन है
    if (currentUser) {
        const userTestRef = rtdb.ref(`users/${currentUser.uid}/tests/${unitId}`);
        userTestRef.set(dataToSave)
            .then(() => console.log("Firebase में डेटा सफलतापूर्वक सहेजा गया।"))
            .catch(error => console.error("Firebase में डेटा सहेजने में त्रुटि:", error));
    }
}


async function loadQuestions(unitId) { //
    if (!unitId) {
        quizContainer.innerHTML = "<p>कोई यूनिट चयनित नहीं है। कृपया होम पेज पर वापस जाएं और एक यूनिट चुनें।</p>";
        return; //
    }

    try {
        const unitRef = rtdb.ref(`tests/${unitId}`); //
        const snapshot = await unitRef.get(); //

        if (!snapshot.exists()) {
            quizContainer.innerHTML = "<p>यह टेस्ट यूनिट नहीं मिली।</p>";
            return; //
        }

        const testData = snapshot.val(); //
        testTitleElement.textContent = testData.title || `टेस्ट: ${unitId}`; //
        currentQuestions = testData.questions; //

        if (!currentQuestions || !Array.isArray(currentQuestions) || currentQuestions.length === 0) {
            quizContainer.innerHTML = "<p>इस यूनिट में कोई प्रश्न उपलब्ध नहीं है या सही फॉर्मेट में नहीं हैं।</p>";
            return; //
        }

        // यदि userAnswers पहले से लोड नहीं किए गए हैं (जैसे पहली बार लोड होने पर)
        if (userAnswers.length !== currentQuestions.length) {
             userAnswers = new Array(currentQuestions.length).fill(null); //
        }
        
        // प्रश्न लोड होने के बाद, यदि Firebase या localStorage से कोई इंडेक्स लोड हुआ है, तो उसका उपयोग करें
        // यदि नहीं, तो currentQuestionIndex 0 ही रहेगा।
        // currentQuestionIndex = currentQuestionIndex; // 

        if (questionsShuffled) { //
            shuffleArray(currentQuestions);
        } //
        if (optionsShuffled) { //
            currentQuestions.forEach(q => shuffleArray(q.options));
        } //

        renderAllQuestions(); // // सभी प्रश्न कार्ड बनाएं (शुरू में छिपे हुए)
        displayQuestion(currentQuestionIndex); //
        buildQuestionNavigation(); //
        updateNavigationButtons(); //
        if(submitButtonSidebar) submitButtonSidebar.style.display = 'block'; //
        if(navigationButtonsContainer) navigationButtonsContainer.style.display = 'block'; //
        if(liveFeedbackContainer) liveFeedbackContainer.style.display = 'block'; // // लाइव फीडबैक दिखाएं
        updateLiveFeedback(); //
        updateFontSize(); // सुनिश्चित करें कि सही फ़ॉन्ट साइज़ लागू हो

    } catch (error) { //
        console.error("प्रश्न लोड करने में त्रुटि:", error); //
        quizContainer.innerHTML = "<p>प्रश्न लोड करने में विफल।</p>"; //
    }
}

function shuffleArray(array) { //
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); //
        [array[i], array[j]] = [array[j], array[i]]; //
    }
}

function renderAllQuestions() { //
    let questionsHtml = ''; //
    currentQuestions.forEach((q, index) => { //
        if (q && typeof q.question === 'string' && Array.isArray(q.options)) { //
            questionsHtml += `
                <div class="question-card" id="question-${index}">
                    <p><b>प्रश्न ${index + 1}:</b> ${q.question}</p>
                    <div class="options">
            `; //
            q.options.forEach((option, i) => { //
                const optionValue = typeof option === 'object' && option !== null ? option.text : option; //
                const optionDisplay = optionValue; //

                questionsHtml += `
                        <label>
                            <input type="radio" name="question${index}" value="${optionValue}">
                            <span>${optionDisplay}</span>
                        </label>
                `; //
            });
            questionsHtml += `
                    </div>
                    <div class="correct-answer-display" id="correct-answer-${index}" style="display:none;"></div>
                </div>
            `; //
        } else { //
            console.warn(`प्रश्न ${index + 1} का फॉर्मेट सही नहीं है:`, q); //
        } //
    });
    quizContainer.innerHTML = questionsHtml; //

    currentQuestions.forEach((_, questionIndex) => { //
        const radioButtons = document.querySelectorAll(`input[name="question${questionIndex}"]`); //
        radioButtons.forEach(radio => { //
            radio.addEventListener('change', (event) => { //
                handleOptionSelection(questionIndex, event.target);
            });
        });
    }); //
}

function handleOptionSelection(questionIndex, selectedRadio) {
    if (selectedRadio.disabled) return;

    userAnswers[questionIndex] = selectedRadio.value; //
    updateQuestionNavigationItemStatus(questionIndex); //
    updateLiveFeedback(); //
    saveUserData(); // उत्तर सहेजें

    const questionData = currentQuestions[questionIndex]; //
    const optionsContainer = selectedRadio.closest('.options'); //
    const allLabelsInQuestion = optionsContainer.querySelectorAll('label'); //
    const selectedLabel = selectedRadio.parentElement; //

    const allRadioButtonsInQuestion = optionsContainer.querySelectorAll(`input[name="question${questionIndex}"]`); //
    allRadioButtonsInQuestion.forEach(rb => rb.disabled = true); //

    allLabelsInQuestion.forEach(label => { //
        label.classList.remove('user-answer-correct', 'user-answer-incorrect', 'highlight-correct-answer'); // पुरानी क्लास हटाएँ
    });

    if (questionData && typeof questionData.answer === 'string') { //
        if (selectedRadio.value === questionData.answer) { //
            selectedLabel.classList.add('user-answer-correct'); //
        } else { //
            selectedLabel.classList.add('user-answer-incorrect'); //
            // गलत उत्तर पर सही विकल्प को हाइलाइट करें
            const correctOptionLabel = document.querySelector(`input[name="question${questionIndex}"][value="${questionData.answer}"]`).parentElement;
            if (correctOptionLabel) {
                correctOptionLabel.classList.add('highlight-correct-answer');
            }
        }
    }

    const correctAnswerDisplay = document.getElementById(`correct-answer-${questionIndex}`); //
    if (correctAnswerDisplay && questionData && questionData.answer) { //
        correctAnswerDisplay.innerHTML = `<strong>सही उत्तर:</strong> ${questionData.answer}`; //
        correctAnswerDisplay.style.display = 'block'; //
    }
    if(clearOptionButton) clearOptionButton.disabled = true; // क्लियर बटन को अक्षम करें
}


function displayQuestion(index) { //
    // सुनिश्चित करें कि इंडेक्स सीमा के भीतर है
    if (index < 0 || index >= currentQuestions.length) {
        console.warn("अमान्य प्रश्न इंडेक्स:", index);
        return;
    }

    document.querySelectorAll('.question-card').forEach(card => { //
        card.classList.remove('active'); //
    });
    const currentQuestionCard = document.getElementById(`question-${index}`); //
    if (currentQuestionCard) { //
        currentQuestionCard.classList.add('active'); //
    } //
    currentQuestionIndex = index; //
    saveUserData(); // वर्तमान प्रश्न इंडेक्स सहेजें

    updateNavigationButtons(); //
    highlightCurrentQuestionNav(); //

    const radioButtons = document.querySelectorAll(`input[name="question${index}"]`);
    const correctAnswerDisplay = document.getElementById(`correct-answer-${index}`);
    const questionData = currentQuestions[index];

    // सभी विकल्प लेबलों से फीडबैक क्लास हटाएँ
    document.querySelectorAll(`#question-${index} .options label`).forEach(label => {
        label.classList.remove('user-answer-correct', 'user-answer-incorrect', 'highlight-correct-answer');
    });

    if (userAnswers[index] !== null) { //
        const selectedRadioButton = document.querySelector(`input[name="question${index}"][value="${userAnswers[index]}"]`); //
        if (selectedRadioButton) { //
            selectedRadioButton.checked = true; //
            
            // अगर उत्तर पहले से दिया गया है तो उसे फिर से लॉक और स्टाइल करें
            radioButtons.forEach(rb => rb.disabled = true);

            const selectedLabel = selectedRadioButton.parentElement;
            if (selectedLabel && questionData && questionData.answer) {
                if (selectedRadioButton.value === questionData.answer) {
                    selectedLabel.classList.add('user-answer-correct');
                } else {
                    selectedLabel.classList.add('user-answer-incorrect');
                    // गलत उत्तर पर सही विकल्प को हाइलाइट करें
                    const correctOptionLabel = document.querySelector(`input[name="question${index}"][value="${questionData.answer}"]`).parentElement;
                    if (correctOptionLabel) {
                        correctOptionLabel.classList.add('highlight-correct-answer');
                    }
                }
            }
        } //
        if(correctAnswerDisplay && questionData && questionData.answer) {
            correctAnswerDisplay.innerHTML = `<strong>सही उत्तर:</strong> ${questionData.answer}`;
            correctAnswerDisplay.style.display = 'block';
        }
        if(clearOptionButton) clearOptionButton.disabled = true; // क्लियर बटन को अक्षम करें
    } else {
        // यदि कोई उत्तर नहीं दिया गया है, तो रेडियो बटन सक्षम होने चाहिए
        radioButtons.forEach(rb => rb.disabled = false);
        if(clearOptionButton) clearOptionButton.disabled = false; // क्लियर बटन को सक्षम करें
        if(correctAnswerDisplay) correctAnswerDisplay.style.display = 'none';
        if(correctAnswerDisplay) correctAnswerDisplay.innerHTML = '';
    }
}

function updateNavigationButtons() { //
    if(backButton) backButton.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none'; //
    if(nextButton) nextButton.style.display = currentQuestionIndex < currentQuestions.length - 1 ? 'inline-block' : 'none'; //
    if(clearOptionButton) { //
        // क्लियर बटन केवल तभी दिखाएं/सक्षम करें यदि वर्तमान प्रश्न का उत्तर नहीं दिया गया है
        if (userAnswers[currentQuestionIndex] !== null) {
            clearOptionButton.style.display = 'inline-block'; // दिखाएँ
            clearOptionButton.disabled = true; // पर अक्षम
        } else {
            clearOptionButton.style.display = 'inline-block'; // दिखाएँ
            clearOptionButton.disabled = false; // और सक्षम
        }
    }
} //

function buildQuestionNavigation() { //
    let navHtml = ''; //
    currentQuestions.forEach((_, index) => { //
        // उपयोगकर्ता के उत्तर के आधार पर वर्ग जोड़ें
        const answeredClass = userAnswers[index] !== null ? 'answered' : '';
        navHtml += `<a href="#" data-qindex="${index}" id="qnav-${index}" class="${answeredClass}">${index + 1}</a>`; //
    });
    if(questionNavigationTable) questionNavigationTable.innerHTML = navHtml; //

    document.querySelectorAll('#question-navigation-table a').forEach(link => { //
        link.addEventListener('click', (e) => { //
            e.preventDefault(); //
            const qIndex = parseInt(e.target.dataset.qindex); //
            displayQuestion(qIndex); //
        });
    });
    highlightCurrentQuestionNav(); //
}

function updateQuestionNavigationItemStatus(index) { //
    const navLink = document.getElementById(`qnav-${index}`); //
    if (navLink && userAnswers[index] !== null) { //
        navLink.classList.add('answered'); //
    } else if (navLink) { //
        navLink.classList.remove('answered'); //
    } //
}


function highlightCurrentQuestionNav() { //
    document.querySelectorAll('#question-navigation-table a').forEach(link => { //
        link.classList.remove('current-q-nav'); //
    });
    const currentNavLink = document.getElementById(`qnav-${currentQuestionIndex}`); //
    if (currentNavLink) { //
        currentNavLink.classList.add('current-q-nav'); //
    } //
}

function calculateScore() { //
    let score = 0; //
    let correctCount = 0; //
    let incorrectCount = 0; //
    currentQuestions.forEach((q, index) => { //
        if (userAnswers[index] !== null && q && typeof q.answer === 'string') { //
            if (userAnswers[index] === q.answer) { //
                score++; //
                correctCount++; //
            } else { //
                incorrectCount++; //
            }
        }
    });
    // // लाइव फीडबैक स्पैन भी अपडेट कर सकते हैं यदि आवश्यक हो, हालांकि यह सबमिट के समय है
    // liveCorrectAnswersSpan.textContent = correctCount;
    // liveIncorrectAnswersSpan.textContent = incorrectCount; //
    return score; //
}

function updateLiveFeedback() { //
    let tempCorrect = 0; //
    let tempIncorrect = 0; //
    userAnswers.forEach((answer, index) => { //
        if (answer !== null) { //
            if (currentQuestions[index] && answer === currentQuestions[index].answer) { //
                tempCorrect++; //
            } else if (currentQuestions[index]) { //
                tempIncorrect++; //
            } //
        }
    });
    if(liveCorrectAnswersSpan) liveCorrectAnswersSpan.textContent = tempCorrect; //
    if(liveIncorrectAnswersSpan) liveIncorrectAnswersSpan.textContent = tempIncorrect; //
}


if(nextButton) nextButton.addEventListener('click', () => { //
    if (currentQuestionIndex < currentQuestions.length - 1) { //
        displayQuestion(currentQuestionIndex + 1); //
    }
});
if(backButton) backButton.addEventListener('click', () => { //
    if (currentQuestionIndex > 0) { //
        displayQuestion(currentQuestionIndex - 1); //
    }
});

if(clearOptionButton) clearOptionButton.addEventListener('click', () => { //
    if (userAnswers[currentQuestionIndex] !== null) { // केवल तभी साफ़ करें यदि कोई उत्तर चयनित है
        const radioButtons = document.querySelectorAll(`input[name="question${currentQuestionIndex}"]`); //
        radioButtons.forEach(radio => radio.checked = false); //
        userAnswers[currentQuestionIndex] = null; // उत्तर को null पर सेट करें
        updateQuestionNavigationItemStatus(currentQuestionIndex); //
        
        // सभी विकल्पों से स्टाइल हटाएँ और रेडियो बटन को फिर से सक्षम करें
        const currentLabels = document.querySelectorAll(`#question-${currentQuestionIndex} .options label`); //
        currentLabels.forEach(label => { //
            label.classList.remove('user-answer-correct', 'user-answer-incorrect', 'highlight-correct-answer'); //
            label.querySelector('input[type="radio"]').disabled = false; // रेडियो बटन को सक्षम करें
        });
        const correctAnswerDisplay = document.getElementById(`correct-answer-${currentQuestionIndex}`); //
        if(correctAnswerDisplay) { //
            correctAnswerDisplay.style.display = 'none'; //
            correctAnswerDisplay.innerHTML = ''; //
        }
        updateLiveFeedback(); //
        saveUserData(); // डेटा सहेजें
        clearOptionButton.disabled = false; // क्लियर बटन को सक्षम करें
    }
});

if(submitButtonSidebar) submitButtonSidebar.addEventListener('click', () => { //
    const totalScore = calculateScore(); //
    if(scoreElement) scoreElement.textContent = `${totalScore} / ${currentQuestions.length}`; //
    if(resultContainer) resultContainer.style.display = 'block'; //
    if(submitButtonSidebar) submitButtonSidebar.style.display = 'none'; //
    if(navigationButtonsContainer) navigationButtonsContainer.style.display = 'none'; //
    if(liveFeedbackContainer) liveFeedbackContainer.style.display = 'none'; //

    if(decreaseFontButton) decreaseFontButton.disabled = true; //
    if(increaseFontButton) increaseFontButton.disabled = true; //
    if(shuffleQuestionsButton) shuffleQuestionsButton.disabled = true; //
    if(shuffleOptionsButton) shuffleOptionsButton.disabled = true; //
    document.querySelectorAll('#question-navigation-table a').forEach(link => link.style.pointerEvents = 'none'); //

    currentQuestions.forEach((q, index) => { //
        const questionCard = document.getElementById(`question-${index}`); //
        if (!questionCard) return; //

        // Ensure the card is visible if it's the current one, or if you want to show all results.
        // If showing all, you might remove the 'display: none' from .question-card CSS.
        // For now, let's just make sure the current active one updates correctly.
        // if(!questionCard.classList.contains('active')) { //
        //      questionCard.classList.add('active'); //
        // } //


        const optionsContainer = questionCard.querySelector('.options'); //
        if (optionsContainer) { //
            const caDisplay = questionCard.querySelector(`#correct-answer-${index}`);
            if(caDisplay && q.answer){
                caDisplay.innerHTML = `<b>सही उत्तर:</b> ${q.answer}`;
                caDisplay.style.display = 'block';
            } else if (caDisplay) { // यदि उत्तर नहीं है
                 caDisplay.innerHTML = `<b>सही उत्तर:</b> उपलब्ध नहीं`;
                 caDisplay.style.display = 'block';
            }
        } // (else if condition missing in original)


        const selectedOptionValue = userAnswers[index]; //
        const radioInputs = questionCard.querySelectorAll(`input[name="question${index}"]`); //

        radioInputs.forEach(input => { //
            input.disabled = true; //
            const parentLabel = input.parentElement; //
            if (parentLabel) { //
                // यह सुनिश्चित करने के लिए कि सभी सही और गलत उत्तर हाइलाइट किए गए हैं
                parentLabel.classList.remove('user-answer-correct', 'user-answer-incorrect', 'highlight-correct-answer');
                if (selectedOptionValue === input.value) {
                    if (q.answer && selectedOptionValue === q.answer) {
                        parentLabel.classList.add('user-answer-correct');
                    } else if (q.answer) {
                        parentLabel.classList.add('user-answer-incorrect');
                        // अगर उपयोगकर्ता ने गलत चुना है, तो सही को हाइलाइट करें
                        const correctOptionLabel = document.querySelector(`input[name="question${index}"][value="${q.answer}"]`).parentElement;
                        if (correctOptionLabel) {
                            correctOptionLabel.classList.add('highlight-correct-answer');
                        }
                    }
                } else if (input.value === q.answer) {
                    parentLabel.classList.add('highlight-correct-answer'); // सही उत्तर को हाइलाइट करें
                }
            }
        });
    }); //
    if(resultContainer) resultContainer.scrollIntoView({ behavior: 'smooth' }); //
});

// फ़ॉन्ट आकार नियंत्रण
if(increaseFontButton) increaseFontButton.addEventListener('click', () => { //
    if (baseFontSize < 24) { //
        baseFontSize += 2; //
        updateFontSize();
        saveUserData(); // फ़ॉन्ट साइज़ सहेजें
    }
});
if(decreaseFontButton) decreaseFontButton.addEventListener('click', () => { //
    if (baseFontSize > 12) { //
        baseFontSize -= 2; //
        updateFontSize();
        saveUserData(); // फ़ॉन्ट साइज़ सहेजें
    }
});

// फ़ॉन्ट साइज़ को अपडेट करने के लिए नया फ़ंक्शन
function updateFontSize() {
    if(quizContent) {
        // quizContent को हटा दें क्योंकि हम व्यक्तिगत तत्वों को स्टाइल करेंगे
        // quizContent.style.fontSize = `${baseFontSize}px`; 
    }
    if(currentFontSizeSpan) currentFontSizeSpan.textContent = `${baseFontSize}px`;

    // प्रश्न टेक्स्ट और विकल्पों पर फ़ॉन्ट साइज़ लागू करें
    document.querySelectorAll('.question-card p, .options label span').forEach(element => {
        element.style.fontSize = `${baseFontSize}px`;
    });
}


// // शफल प्रश्न
if(shuffleQuestionsButton) shuffleQuestionsButton.addEventListener('click', () => { //
    if (confirm("क्या आप प्रश्नों को शफल करना चाहते हैं? आपकी वर्तमान प्रगति रीसेट हो जाएगी।")) { //
        questionsShuffled = true; //
        optionsShuffled = false; //
        resetQuizStateAndReload(); //
    }
});

// // शफल विकल्प
if(shuffleOptionsButton) shuffleOptionsButton.addEventListener('click', () => { //
    if (confirm("क्या आप विकल्पों को शफल करना चाहते हैं? आपकी वर्तमान प्रगति रीसेट हो जाएगी।")) { //
        optionsShuffled = true; //
        resetQuizStateAndReload(); //
    }
});

function resetQuizStateAndReload() { //
    currentQuestionIndex = 0; //
    userAnswers = new Array(currentQuestions.length).fill(null); // उत्तरों को रीसेट करें
    if(quizContainer) quizContainer.innerHTML = '<p>प्रश्न पुनः लोड हो रहे हैं...</p>'; //
    if(resultContainer) resultContainer.style.display = 'none'; //
    if(liveCorrectAnswersSpan) liveCorrectAnswersSpan.textContent = '0'; //
    if(liveIncorrectAnswersSpan) liveIncorrectAnswersSpan.textContent = '0'; //
    if(submitButtonSidebar) submitButtonSidebar.style.display = 'block'; //
    if(navigationButtonsContainer) navigationButtonsContainer.style.display = 'block'; //
    if(liveFeedbackContainer) liveFeedbackContainer.style.display = 'block'; //
    if(decreaseFontButton) decreaseFontButton.disabled = false; //
    if(increaseFontButton) increaseFontButton.disabled = false; //
    if(shuffleQuestionsButton) shuffleQuestionsButton.disabled = false; //
    if(shuffleOptionsButton) shuffleOptionsButton.disabled = false; //

    saveUserData(); // रीसेट की गई स्थिति सहेजें
    loadQuestions(unitId); //
} //


// --- साइडबार टॉगल लॉजिक ---
if (sidebarToggleButton && sidebar) {
    sidebarToggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-hidden');
    });
}
// --- ---


// पेज लोड होने पर प्रश्न लोड करें
window.onload = () => { //
    // Authentication listener पहले ही डेटा लोड करेगा, इसलिए यहां सिर्फ प्रारंभिक फ़ॉन्ट साइज़ सेट करें
    // loadQuestions(unitId); // यह अब auth.onAuthStateChanged द्वारा ट्रिगर किया जाएगा
    if(currentFontSizeSpan) currentFontSizeSpan.textContent = `${baseFontSize}px`; //

    // यदि आप चाहते हैं कि साइडबार शुरू में छिपा रहे:
    if (sidebar) {
         sidebar.classList.add('sidebar-hidden');
    }
};
