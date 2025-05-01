import { auth } from './firebase-config.js';

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const userData = {
        isQuestionnaireDone: false
    };

    // Check questionnaire status immediately before anything else
    const currentUser = auth.currentUser;
    if (currentUser) {
        const isQuestionnaireDone = localStorage.getItem(`questionnaire_completed_${currentUser.uid}`);
        if (isQuestionnaireDone === 'true') {
            document.getElementById('disabled-overlay').style.display = 'none';
            document.getElementById('questionnaire-overlay').style.display = 'none';
        }
    }

    // Remove event listeners for blocking interactions as we're using the overlay instead
    if (!userData.isQuestionnaireDone) {
        document.getElementById('disabled-overlay').style.display = 'block';
    }

    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        
        // Check if questionnaire is completed
        const isQuestionnaireDone = localStorage.getItem(`questionnaire_completed_${user.uid}`);
        if (isQuestionnaireDone === 'true') {
            document.getElementById('disabled-overlay').style.display = 'none';
            document.getElementById('questionnaire-overlay').style.display = 'none';
        }

        // Get stored name data
        const nameData = JSON.parse(localStorage.getItem(`name_${user.uid}`) || '{}');
        const firstName = nameData.firstName;
        
        // Use first name if available, otherwise fallback to email
        const displayName = firstName || user.email.split('@')[0];
        const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        const welcomeMessage = document.getElementById('welcome-message');
        welcomeMessage.textContent = `Welcome, ${capitalizedName}!`;
        updateAccountButtonImage();
        updateInfoCards();
    });

    // Sidebar functionality
    const menuButton = document.getElementById('menu-button');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    menuButton.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    function toggleSidebar() {
        // If right sidebar is open, close it first
        if (rightSidebar.classList.contains('active')) {
            rightSidebar.classList.remove('active');
            overlay.classList.remove('active-right');
        }
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    const sidebarButtons = document.querySelectorAll('.sidebar-btn');
    const sections = document.querySelectorAll('.section-content');

    function switchSection(sectionId) {
        // Hide all sections first
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show the selected section
        const targetSection = document.querySelector(`.section-content[data-section="${sectionId}"]`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update button states
        sidebarButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionId) {
                btn.classList.add('active');
            }
        });

        // Close sidebar and overlay
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Add click handlers for sidebar buttons
    sidebarButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.dataset.section;
            switchSection(sectionId);
        });
    });

    // Initialize home section as active
    switchSection('home');

    const physiqueForm = document.getElementById('physique-form');
    const nameSection = document.querySelector('.name-section');
    const physiqueSection = document.querySelector('.physique-section');

    // Rename this section switching function to avoid conflicts
    function switchQuestionnaireSection(fromSection, toSection, direction = 'forward') {
        const fadeOut = direction === 'forward' ? 'fadeOutLeft' : 'fadeOutRight';
        const fadeIn = direction === 'forward' ? 'fadeInRight' : 'fadeInLeft';
        
        fromSection.style.animation = `${fadeOut} 0.3s forwards`;
        setTimeout(() => {
            fromSection.style.display = 'none';
            toSection.style.display = 'block';
            toSection.style.animation = `${fadeIn} 0.3s forwards`;
        }, 300);
    }

    physiqueForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const height = document.getElementById('height');
        const weight = document.getElementById('weight');
        const metabolicRate = document.getElementById('metabolic-rate');
        let isValid = true;

        // Clear previous errors
        [height, weight, metabolicRate].forEach(input => input.classList.remove('error'));

        if (height.value < 100 || height.value > 250) {
            height.classList.add('error');
            isValid = false;
        }

        if (weight.value < 30 || weight.value > 300) {
            weight.classList.add('error');
            isValid = false;
        }

        if (metabolicRate.value < 800 || metabolicRate.value > 4000) {
            metabolicRate.classList.add('error');
            isValid = false;
        }

        if (!isValid) return;

        // Save physique data
        const userId = auth.currentUser.uid;
        const physiqueData = {
            height: parseFloat(height.value),
            weight: parseFloat(weight.value),
            metabolicRate: parseFloat(metabolicRate.value)
        };
        
        localStorage.setItem(`physique_${userId}`, JSON.stringify(physiqueData));
        
        // Transition to name section
        switchQuestionnaireSection(physiqueSection, nameSection, 'forward');
    });

    // Handle back button
    document.querySelector('.back-btn').addEventListener('click', () => {
        switchQuestionnaireSection(nameSection, physiqueSection, 'backward');
    });

    // Add necessary animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOutLeft {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(-10%);
            }
        }
        @keyframes fadeOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(10%);
            }
        }
        @keyframes fadeInRight {
            from {
                opacity: 0;
                transform: translateX(10%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes fadeInLeft {
            from {
                opacity: 0;
                transform: translateX(-10%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);

    // Handle name form submission
    const nameForm = document.getElementById('name-form');
    const birthSection = document.querySelector('.birth-section');
    const birthForm = document.getElementById('birth-form');
    
    nameForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const firstName = document.getElementById('first-name').value;
        const secondName = document.getElementById('second-name').value;
        const lastName = document.getElementById('last-name').value;

        const userId = auth.currentUser.uid;
        const nameData = {
            firstName,
            secondName,
            lastName,
        };

        localStorage.setItem(`name_${userId}`, JSON.stringify(nameData));

        // Transition to birth section instead of completing questionnaire
        switchQuestionnaireSection(nameSection, birthSection, 'forward');
    });

    // Handle birth form validation and submission
    birthForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const year = parseInt(document.getElementById('birth-year').value);
        const month = parseInt(document.getElementById('birth-month').value);
        const day = parseInt(document.getElementById('birth-day').value);
        
        const currentYear = new Date().getFullYear();
        let isValid = true;

        if (year < 1920 || year > currentYear) {
            document.getElementById('birth-year').classList.add('error');
            isValid = false;
        }

        if (day < 1 || day > 31) {
            document.getElementById('birth-day').classList.add('error');
            isValid = false;
        }

        if (!isValid) return;

        const userId = auth.currentUser.uid;
        const birthData = {
            year,
            month,
            day
        };

        localStorage.setItem(`birth_${userId}`, JSON.stringify(birthData));
        
        // Transition to avatar section instead of completing questionnaire
        switchQuestionnaireSection(birthSection, avatarSection, 'forward');
        
        // Update subtitle for last section
        document.querySelector('.subtitle').textContent = 'Last One';
    });

    // Handle avatar form
    const avatarSection = document.querySelector('.avatar-section');
    const avatarForm = document.getElementById('avatar-form');
    const profileUpload = document.getElementById('profile-upload');
    const profilePreview = document.getElementById('profile-preview');

    profileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    avatarForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = auth.currentUser.uid;
        const avatarData = {
            nickname: document.getElementById('nickname').value,
            gender: document.getElementById('gender').value,
            profilePicture: profilePreview.src
        };

        localStorage.setItem(`avatar_${userId}`, JSON.stringify(avatarData));
        updateAccountButtonImage();

        // Add closing animation
        const questionnaireContainer = document.querySelector('.questionnaire-container');
        questionnaireContainer.style.animation = 'slideDown 0.5s ease-out forwards';
        
        // Complete questionnaire with delay for animation
        setTimeout(() => {
            completeQuestionnaire();
        }, 500);
    });

    // Update back button handler to include avatar section
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.closest('.avatar-section')) {
                switchQuestionnaireSection(avatarSection, birthSection, 'backward');
                // Reset subtitle
                document.querySelector('.subtitle').textContent = 'Almost There...';
            } else if (btn.closest('.birth-section')) {
                switchQuestionnaireSection(birthSection, nameSection, 'backward');
            } else if (btn.closest('.name-section')) {
                switchQuestionnaireSection(nameSection, physiqueSection, 'backward');
            }
        });
    });

    // Add closing animation keyframe
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(50px);
            }
        }
    `;
    document.head.appendChild(styleSheet);

    // Function to complete questionnaire
    function completeQuestionnaire() {
        userData.isQuestionnaireDone = true;
        const userId = auth.currentUser.uid;
        localStorage.setItem(`questionnaire_completed_${userId}`, 'true');
        
        document.getElementById('disabled-overlay').style.display = 'none';
        document.getElementById('questionnaire-overlay').style.display = 'none';
        
        // Show selection area with animation and update cards immediately
        const selectionArea = document.getElementById('selection-area');
        const infoCardsContainer = document.querySelector('.info-cards-container');
        
        selectionArea.classList.remove('hide-selection');
        infoCardsContainer.style.display = 'grid';
        infoCardsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        infoCardsContainer.style.gap = '2rem';
        infoCardsContainer.style.padding = '1rem';
        
        // Update cards immediately
        updateInfoCards();

        // Update cards after a small delay to ensure smooth transition
        setTimeout(() => {
            updateInfoCards();
        }, 300);
    }

    // Account button and right sidebar functionality
    const accountButton = document.getElementById('account-button');
    const accountButtonImage = document.getElementById('account-button-image');
    const rightSidebar = document.getElementById('right-sidebar');
    
    // Update account button image if profile picture exists
    function updateAccountButtonImage() {
        const userId = auth.currentUser?.uid;
        if (userId) {
            const avatarData = JSON.parse(localStorage.getItem(`avatar_${userId}`) || '{}');
            if (avatarData.profilePicture) {
                accountButtonImage.src = avatarData.profilePicture;
            }
        }
    }

    // Call this after auth state changes and after avatar form submission
    auth.onAuthStateChanged((user) => {
        updateAccountButtonImage();
    });

    accountButton.addEventListener('click', toggleRightSidebar);

    function toggleRightSidebar() {
        // If left sidebar is open, close it first
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
        rightSidebar.classList.toggle('active');
        overlay.classList.toggle('active-right');
    }

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        rightSidebar.classList.remove('active');
        overlay.classList.remove('active');
        overlay.classList.remove('active-right');
    });

    // Update avatar form submit handler to also update account button image
    avatarForm.addEventListener('submit', async (e) => {
        updateAccountButtonImage();
    });

    // Password toggle handler
    document.addEventListener('click', (e) => {
        if (e.target.closest('.toggle-password')) {
            const btn = e.target.closest('.toggle-password');
            const passwordText = btn.parentElement.querySelector('.password-text');
            const isHidden = passwordText.textContent === '••••••••';
            
            if (isHidden && passwordText.dataset.password) {
                passwordText.textContent = passwordText.dataset.password;
                btn.querySelector('img').style.opacity = '0.5';
            } else {
                passwordText.textContent = '••••••••';
                btn.querySelector('img').style.opacity = '1';
            }
        }
    });
});

function updateInfoCards() {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const isQuestionnaireDone = localStorage.getItem(`questionnaire_completed_${userId}`) === 'true';
    const selectionArea = document.getElementById('selection-area');
    const infoCardsContainer = document.querySelector('.info-cards-container');

    // Show/hide the entire selection area based on questionnaire completion
    if (!isQuestionnaireDone) {
        selectionArea.classList.add('hide-selection');
        return;
    } else {
        selectionArea.classList.remove('hide-selection');
        infoCardsContainer.style.display = 'grid'; // Force grid display when questionnaire is done
        infoCardsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        infoCardsContainer.style.gap = '2rem';
        infoCardsContainer.style.padding = '1rem';
    }

    // Update card contents
    const physiqueData = JSON.parse(localStorage.getItem(`physique_${userId}`) || '{}');
    const nameData = JSON.parse(localStorage.getItem(`name_${userId}`) || '{}');
    const birthData = JSON.parse(localStorage.getItem(`birth_${userId}`) || '{}');
    const avatarData = JSON.parse(localStorage.getItem(`avatar_${userId}`) || '{}');
    const accountData = JSON.parse(localStorage.getItem(`account_${userId}`) || '{}');

    // Update physique card
    const physiqueCard = document.querySelector('.physique-card');
    if (physiqueCard) {
        physiqueCard.querySelector('.height span').textContent = physiqueData.height ? `${physiqueData.height} cm` : '--';
        physiqueCard.querySelector('.weight span').textContent = physiqueData.weight ? `${physiqueData.weight} kg` : '--';
        physiqueCard.querySelector('.metabolic span').textContent = physiqueData.metabolicRate ? `${physiqueData.metabolicRate} kcal` : '--';
    }

    // Update personal card
    const personalCard = document.querySelector('.personal-card');
    if (personalCard) {
        personalCard.querySelector('.firstname span').textContent = nameData.firstName || '--';
        personalCard.querySelector('.secondname span').textContent = nameData.secondName || '--';
        personalCard.querySelector('.lastname span').textContent = nameData.lastName || '--';
    }

    // Update birth card
    const birthCard = document.querySelector('.birth-card');
    if (birthCard) {
        birthCard.querySelector('.year span').textContent = birthData.year || '--';
        birthCard.querySelector('.month span').textContent = birthData.month ? getMonthName(birthData.month) : '--';
        birthCard.querySelector('.day span').textContent = birthData.day || '--';
    }

    // Update avatar card
    const avatarCard = document.querySelector('.avatar-card');
    if (avatarCard) {
        const avatarImg = avatarCard.querySelector('.avatar-preview img');
        if (avatarData.profilePicture) {
            avatarImg.src = avatarData.profilePicture;
        }
        avatarCard.querySelector('.nickname span').textContent = avatarData.nickname || '--';
        avatarCard.querySelector('.gender span').textContent = avatarData.gender || '--';
    }

    // Update account card
    const accountCard = document.querySelector('.account-info-card');
    if (accountCard) {
        accountCard.querySelector('.email span').textContent = accountData.email || '--';
        const passwordText = accountCard.querySelector('.password-text');
        if (accountData.password) {
            passwordText.textContent = '••••••••';
            passwordText.dataset.password = accountData.password;
        } else {
            passwordText.textContent = '--';
        }
    }
}

function getMonthName(monthNumber) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1] || '--';
}
