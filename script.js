// Initialize quests from localStorage
let quests = JSON.parse(localStorage.getItem('quests')) || [];
let totalPoints = JSON.parse(localStorage.getItem('totalPoints')) || 0;
let streak = JSON.parse(localStorage.getItem('streak')) || 0;
let lastCompletionDate = localStorage.getItem('lastCompletionDate') || null;

// Load quests on page load
document.addEventListener('DOMContentLoaded', function() {
    renderQuests();
    updateStats();
    requestNotificationPermission();
    checkDailyReset();
});

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Check if daily quests should be reset
function checkDailyReset() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('lastReset');
    
    if (lastReset !== today) {
        resetDaily();
    }
}

function addQuest() {
    const input = document.getElementById('questInput');
    const type = document.getElementById('questType').value;
    const points = parseInt(document.getElementById('questPoints').value) || 10;
    const questText = input.value.trim();

    if (questText === '') {
        showNotification('Please enter a quest!', 'error');
        return;
    }

    if (points <= 0) {
        showNotification('Points must be greater than 0!', 'error');
        return;
    }

    const quest = {
        id: Date.now(),
        text: questText,
        type: type,
        completed: false,
        points: points,
        completedDate: null
    };

    quests.push(quest);
    saveQuests();
    renderQuests();
    showNotification('Quest added! 📝', 'success');
    input.value = '';
    document.getElementById('questPoints').value = '10';
}

function deleteQuest(id) {
    const quest = quests.find(function(q) {
        return q.id === id;
    });
    
    if (quest && quest.completed) {
        totalPoints -= quest.points;
        savePoints();
    }

    quests = quests.filter(function(quest) {
        return quest.id !== id;
    });
    
    saveQuests();
    renderQuests();
    updateStats();
    showNotification('Quest deleted! 🗑️', 'warning');
}

function toggleComplete(id) {
    const quest = quests.find(function(q) {
        return q.id === id;
    });
    
    if (quest) {
        if (!quest.completed) {
            quest.completed = true;
            quest.completedDate = new Date().toLocaleString();
            totalPoints += quest.points;
            updateStreak();
            
            showNotification('🎉 Quest Complete! +' + quest.points + ' points', 'success');
            triggerNotification('Quest Complete! +' + quest.points + ' points');
            triggerConfetti();
        } else {
            quest.completed = false;
            quest.completedDate = null;
            totalPoints -= quest.points;
            showNotification('Quest uncompleted! -' + quest.points + ' points', 'warning');
        }

        saveQuests();
        savePoints();
        renderQuests();
        updateStats();
    }
}

function updateStreak() {
    const today = new Date().toDateString();
    if (lastCompletionDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastCompletionDate === yesterday) {
            streak++;
        } else if (lastCompletionDate !== today) {
            streak = 1;
        }
        lastCompletionDate = today;
        localStorage.setItem('lastCompletionDate', lastCompletionDate);
        localStorage.setItem('streak', streak);
    }
}

function renderQuests() {
    const types = ['daily', 'weekly', 'monthly'];

    for (let i = 0; i < types.length; i++) {
        const type = types[i];
        const questList = document.getElementById(type + 'Quests');
        questList.innerHTML = '';

        const typeQuests = quests.filter(function(q) {
            return q.type === type;
        });

        if (typeQuests.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.style.padding = '10px';
            emptyLi.style.color = '#999';
            emptyLi.textContent = 'No quests yet!';
            questList.appendChild(emptyLi);
            continue;
        }

        for (let j = 0; j < typeQuests.length; j++) {
            const quest = typeQuests[j];
            const li = document.createElement('li');
            li.className = 'quest-item';
            if (quest.completed) {
                li.className += ' completed';
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = quest.completed;
            checkbox.onchange = function() {
                toggleComplete(quest.id);
            };

            const questContent = document.createElement('div');
            questContent.className = 'quest-content';

            const questText = document.createElement('span');
            questText.className = 'quest-text';
            questText.textContent = quest.text;

            const questPoints = document.createElement('span');
            questPoints.className = 'quest-points';
            questPoints.textContent = '⭐ ' + quest.points + ' points';

            questContent.appendChild(questText);
            questContent.appendChild(questPoints);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = function() {
                deleteQuest(quest.id);
            };

            li.appendChild(checkbox);
            li.appendChild(questContent);
            li.appendChild(deleteBtn);

            questList.appendChild(li);
        }
    }
}

function updateStats() {
    document.getElementById('totalPoints').textContent = totalPoints;

    const completedCount = quests.filter(function(q) {
        return q.completed;
    }).length;
    document.getElementById('completedCount').textContent = completedCount;

    document.getElementById('streak').textContent = streak;

    const dailyQuests = quests.filter(function(q) {
        return q.type === 'daily';
    });
    
    const completedDaily = dailyQuests.filter(function(q) {
        return q.completed;
    }).length;
    
    const progress = dailyQuests.length > 0 ? (completedDaily / dailyQuests.length) * 100 : 0;

    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = progress + '%';
    progressBar.textContent = Math.round(progress) + '%';

    document.getElementById('progressText').textContent = completedDaily + '/' + dailyQuests.length + ' quests completed';
}

function resetDaily() {
    quests = quests.filter(function(q) {
        return q.type !== 'daily';
    });
    
    saveQuests();
    renderQuests();
    updateStats();
    localStorage.setItem('lastReset', new Date().toDateString());
    showNotification('Daily quests reset! ✨', 'warning');
}

function clearAll() {
    if (confirm('Are you sure? This will delete ALL data and cannot be undone!')) {
        quests = [];
        totalPoints = 0;
        streak = 0;
        lastCompletionDate = null;
        saveQuests();
        savePoints();
        localStorage.removeItem('lastCompletionDate');
        localStorage.setItem('streak', 0);
        renderQuests();
        updateStats();
        showNotification('All data cleared! 🔄', 'error');
    }
}

function saveQuests() {
    localStorage.setItem('quests', JSON.stringify(quests));
}

function savePoints() {
    localStorage.setItem('totalPoints', totalPoints);
}

function showNotification(message, type) {
    if (type === undefined) {
        type = 'success';
    }
    
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification show ' + type;

    setTimeout(function() {
        notification.classList.remove('show');
    }, 3000);
}

function triggerNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Quest Tracker', {
            body: message,
            icon: '⚔️'
        });
    }
}

function triggerConfetti() {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.background = '#' + Math.floor(Math.random() * 16777215).toString(16);
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.top = '-10px';
    confetti.style.borderRadius = '50%';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '999';

    document.body.appendChild(confetti);

    let top = 0;
    const interval = setInterval(function() {
        top += 5;
        confetti.style.top = top + 'px';
        confetti.style.opacity = 1 - (top / window.innerHeight);
        
        if (top > window.innerHeight) {
            clearInterval(interval);
            confetti.remove();
        }
    }, 30);
}

// Allow Enter key to add quest
document.addEventListener('DOMContentLoaded', function() {
    const questInput = document.getElementById('questInput');
    questInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addQuest();
        }
    });
});