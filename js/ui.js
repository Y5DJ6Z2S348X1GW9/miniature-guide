// UI管理模块 - ui.js

class UIManager {
    constructor() {
        // 屏幕元素
        this.screens = {
            start: document.getElementById('startScreen'),
            game: document.getElementById('gameScreen'),
            pause: document.getElementById('pauseScreen'),
            gameOver: document.getElementById('gameOverScreen'),
            instructions: document.getElementById('instructionsScreen'),
            settings: document.getElementById('settingsScreen'),
            loading: document.getElementById('loadingScreen')
        };
        
        // 游戏UI元素
        this.gameUI = {
            scoreValue: document.getElementById('scoreValue'),
            levelValue: document.getElementById('levelValue'),
            healthBar: document.getElementById('healthBar'),
            healthIcons: document.querySelectorAll('.health-icon'),
            weaponLevel: document.getElementById('weaponLevel'),
            weaponCooldown: document.getElementById('weaponCooldown'),
            shieldButton: document.getElementById('shieldButton'),
            waveInfo: document.getElementById('waveInfo'),
            waveNumber: document.getElementById('waveNumber'),
            waveProgress: document.querySelector('.wave-progress-fill')
        };
        
        // 按钮元素
        this.buttons = {
            start: document.getElementById('startButton'),
            instructions: document.getElementById('instructionsButton'),
            settings: document.getElementById('settingsButton'),
            pause: document.getElementById('pauseButton'),
            resume: document.getElementById('resumeButton'),
            restart: document.getElementById('restartButton'),
            mainMenu: document.getElementById('mainMenuButton'),
            playAgain: document.getElementById('playAgainButton'),
            backToMenu: document.getElementById('backToMenuButton'),
            closeInstructions: document.getElementById('closeInstructionsButton'),
            closeSettings: document.getElementById('closeSettingsButton'),
            resetSettings: document.getElementById('resetSettingsButton')
        };
        
        // 设置元素
        this.settings = {
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            difficultySelect: document.getElementById('difficultySelect'),
            particleEffects: document.getElementById('particleEffects'),
            screenShake: document.getElementById('screenShake')
        };
        
        // 统计元素
        this.stats = {
            pauseScore: document.getElementById('pauseScore'),
            survivalTime: document.getElementById('survivalTime'),
            finalScore: document.getElementById('finalScore'),
            finalLevel: document.getElementById('finalLevel'),
            finalTime: document.getElementById('finalTime'),
            enemiesKilled: document.getElementById('enemiesKilled')
        };
        
        // 通知系统
        this.notifications = [];
        this.maxNotifications = 3;
        
        // 当前屏幕
        this.currentScreen = 'loading';
        
        // 游戏数据
        this.gameData = {
            score: 0,
            level: 1,
            wave: 1,
            lives: 3,
            health: 100,
            maxHealth: 100,
            weaponLevel: 1,
            shieldEnergy: 100,
            survivalTime: 0
        };
        
        // 设置数据
        this.gameSettings = {
            volume: 70,
            difficulty: 'normal',
            particleEffects: true,
            screenShake: true
        };
        
        this.initializeEventListeners();
        this.loadSettings();
        this.showScreen('start');
    }
    
    // 初始化事件监听器
    initializeEventListeners() {
        // 主菜单按钮
        this.buttons.start.addEventListener('click', () => {
            this.startGame();
            audioManager.playSound('buttonClick', 0.3);
        });
        
        this.buttons.instructions.addEventListener('click', () => {
            this.showScreen('instructions');
            audioManager.playSound('buttonClick', 0.3);
        });
        
        this.buttons.settings.addEventListener('click', () => {
            this.showScreen('settings');
            audioManager.playSound('buttonClick', 0.3);
        });
        
        // 游戏控制按钮
        this.buttons.pause.addEventListener('click', () => {
            this.pauseGame();
            audioManager.playSound('buttonClick', 0.3);
        });
        
        this.buttons.resume.addEventListener('click', () => {
            this.resumeGame();
            audioManager.playSound('buttonClick', 0.3);
        });
        
        this.buttons.restart.addEventListener('click', () => {
            this.restartGame();
            audioManager.playSound('buttonClick', 0.3);
        });
        
        this.buttons.mainMenu.addEventListener('click', () => {
            this.returnToMainMenu();
            audioManager.playSound('buttonClick', 0.3);
        });
        
        // 游戏结束按钮
        this.buttons.playAgain.addEventListener('click', () => {
            this.restartGame();
            audioManager.playSound('buttonClick', 0.3);
        });
        
        this.buttons.backToMenu.addEventListener('click', () => {
            this.returnToMainMenu();
            audioManager.playSound('buttonClick', 0.3);
        });
        
        // 说明和设置关闭按钮
        this.buttons.closeInstructions.addEventListener('click', () => {
            this.showScreen('start');
            audioManager.playSound('buttonClick', 0.3);
        });
        
        this.buttons.closeSettings.addEventListener('click', () => {
            this.saveSettings();
            this.showScreen('start');
            audioManager.playSound('buttonClick', 0.3);
        });
        
        this.buttons.resetSettings.addEventListener('click', () => {
            this.resetSettings();
            audioManager.playSound('buttonClick', 0.3);
        });
        
        // 设置控件
        this.settings.volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            this.gameSettings.volume = volume;
            this.settings.volumeValue.textContent = volume + '%';
            audioManager.setMasterVolume(volume / 100);
        });
        
        this.settings.difficultySelect.addEventListener('change', (e) => {
            this.gameSettings.difficulty = e.target.value;
        });
        
        this.settings.particleEffects.addEventListener('change', (e) => {
            this.gameSettings.particleEffects = e.target.checked;
        });
        
        this.settings.screenShake.addEventListener('change', (e) => {
            this.gameSettings.screenShake = e.target.checked;
        });
        
        // 特殊能力按钮
        this.gameUI.shieldButton.addEventListener('click', () => {
            if (window.player && player.canActivateShield()) {
                player.activateShield();
                audioManager.playSound('buttonClick', 0.2);
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
        
        // 按钮悬停音效
        Object.values(this.buttons).forEach(button => {
            if (button) {
                button.addEventListener('mouseenter', () => {
                    audioManager.playSound('buttonHover', 0.1);
                });
            }
        });
    }
    
    // 处理键盘输入
    handleKeyboardInput(e) {
        switch (e.code) {
            case 'KeyP':
            case 'Escape':
                if (this.currentScreen === 'game') {
                    this.pauseGame();
                } else if (this.currentScreen === 'pause') {
                    this.resumeGame();
                }
                break;
            case 'Enter':
                if (this.currentScreen === 'start') {
                    this.startGame();
                }
                break;
        }
    }
    
    // 显示屏幕
    showScreen(screenName) {
        // 隐藏所有屏幕
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });
        
        // 显示指定屏幕
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }
    
    // 开始游戏
    startGame() {
        this.showScreen('game');
        if (window.gameManager) {
            gameManager.startGame();
        }
    }
    
    // 暂停游戏
    pauseGame() {
        this.updatePauseStats();
        this.showScreen('pause');
        if (window.gameManager) {
            gameManager.pauseGame();
        }
    }
    
    // 继续游戏
    resumeGame() {
        this.showScreen('game');
        if (window.gameManager) {
            gameManager.resumeGame();
        }
    }
    
    // 重新开始游戏
    restartGame() {
        this.showScreen('game');
        if (window.gameManager) {
            gameManager.restartGame();
        }
    }
    
    // 返回主菜单
    returnToMainMenu() {
        this.showScreen('start');
        if (window.gameManager) {
            gameManager.stopGame();
        }
    }
    
    // 显示游戏结束屏幕
    showGameOver(stats) {
        this.updateGameOverStats(stats);
        this.showScreen('gameOver');
    }
    
    // 更新游戏UI
    updateGameUI(gameData) {
        this.gameData = { ...this.gameData, ...gameData };
        
        // 更新分数
        if (this.gameUI.scoreValue) {
            this.gameUI.scoreValue.textContent = this.formatNumber(this.gameData.score);
        }
        
        // 更新等级
        if (this.gameUI.levelValue) {
            this.gameUI.levelValue.textContent = this.gameData.level;
        }
        
        // 更新生命值
        this.updateHealthDisplay();
        
        // 更新武器等级
        if (this.gameUI.weaponLevel) {
            this.gameUI.weaponLevel.textContent = `LV.${this.gameData.weaponLevel}`;
        }
        
        // 更新护盾按钮状态
        this.updateShieldButton();
    }
    
    // 更新生命值显示
    updateHealthDisplay() {
        const healthPercent = this.gameData.health / this.gameData.maxHealth;
        
        // 更新血条
        if (this.gameUI.healthBar) {
            const healthFill = this.gameUI.healthBar.querySelector('.health-fill');
            if (healthFill) {
                healthFill.style.width = (healthPercent * 100) + '%';
            }
        }
        
        // 更新生命图标
        this.gameUI.healthIcons.forEach((icon, index) => {
            if (index < this.gameData.lives) {
                icon.classList.remove('lost');
            } else {
                icon.classList.add('lost');
            }
        });
        
        // 低血量警告
        if (healthPercent < 0.3) {
            document.body.classList.add('health-low');
        } else {
            document.body.classList.remove('health-low');
        }
    }
    
    // 更新护盾按钮
    updateShieldButton() {
        if (this.gameUI.shieldButton && window.player) {
            const canActivate = player.canActivateShield();
            this.gameUI.shieldButton.disabled = !canActivate;
            
            if (player.shield) {
                this.gameUI.shieldButton.classList.add('active');
            } else {
                this.gameUI.shieldButton.classList.remove('active');
            }
        }
    }
    
    // 更新武器冷却显示
    updateWeaponCooldown(cooldownPercent) {
        if (this.gameUI.weaponCooldown) {
            const cooldownFill = this.gameUI.weaponCooldown.querySelector('.cooldown-fill');
            if (cooldownFill) {
                cooldownFill.style.width = (cooldownPercent * 100) + '%';
            }
        }
    }
    
    // 显示波次信息
    showWaveInfo(waveNumber) {
        if (this.gameUI.waveInfo && this.gameUI.waveNumber) {
            this.gameUI.waveNumber.textContent = waveNumber;
            this.gameUI.waveInfo.classList.remove('hidden');
            
            // 3秒后隐藏
            setTimeout(() => {
                if (this.gameUI.waveInfo) {
                    this.gameUI.waveInfo.classList.add('hidden');
                }
            }, 3000);
        }
    }
    
    // 更新波次进度
    updateWaveProgress(progress) {
        if (this.gameUI.waveProgress) {
            this.gameUI.waveProgress.style.width = (progress * 100) + '%';
        }
    }
    
    // 波次完成
    onWaveComplete(waveNumber) {
        this.showNotification('波次完成！', `第 ${waveNumber} 波已清除`, 'success');
        
        // 隐藏波次信息
        if (this.gameUI.waveInfo) {
            this.gameUI.waveInfo.classList.add('hidden');
        }
    }
    
    // 显示通知
    showNotification(title, message, type = 'info') {
        // 移除过多的通知
        while (this.notifications.length >= this.maxNotifications) {
            const oldNotification = this.notifications.shift();
            if (oldNotification.element && oldNotification.element.parentNode) {
                oldNotification.element.remove();
            }
        }
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-text">${message}</div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 添加到通知列表
        const notificationData = {
            element: notification,
            type: type,
            timestamp: Date.now()
        };
        this.notifications.push(notificationData);
        
        // 定位通知
        const index = this.notifications.length - 1;
        notification.style.top = (100 + index * 80) + 'px';
        
        // 自动隐藏
        setTimeout(() => {
            this.removeNotification(notificationData);
        }, 4000);
        
        // 播放通知音效
        const soundMap = {
            success: 'powerup',
            warning: 'warning',
            error: 'warning',
            info: 'buttonClick'
        };
        audioManager.playSound(soundMap[type] || 'buttonClick', 0.3);
    }
    
    // 移除通知
    removeNotification(notificationData) {
        const index = this.notifications.indexOf(notificationData);
        if (index !== -1) {
            this.notifications.splice(index, 1);
            
            if (notificationData.element && notificationData.element.parentNode) {
                notificationData.element.classList.add('fade-out');
                setTimeout(() => {
                    if (notificationData.element && notificationData.element.parentNode) {
                        notificationData.element.remove();
                    }
                }, 300);
            }
            
            // 重新定位剩余通知
            this.repositionNotifications();
        }
    }
    
    // 重新定位通知
    repositionNotifications() {
        this.notifications.forEach((notification, index) => {
            if (notification.element) {
                notification.element.style.top = (100 + index * 80) + 'px';
            }
        });
    }
    
    // 更新暂停统计
    updatePauseStats() {
        if (this.stats.pauseScore) {
            this.stats.pauseScore.textContent = this.formatNumber(this.gameData.score);
        }
        
        if (this.stats.survivalTime) {
            this.stats.survivalTime.textContent = this.formatTime(this.gameData.survivalTime);
        }
    }
    
    // 更新游戏结束统计
    updateGameOverStats(gameStats) {
        if (this.stats.finalScore) {
            this.stats.finalScore.textContent = this.formatNumber(gameStats.score);
        }
        
        if (this.stats.finalLevel) {
            this.stats.finalLevel.textContent = gameStats.level;
        }
        
        if (this.stats.finalTime) {
            this.stats.finalTime.textContent = this.formatTime(gameStats.survivalTime);
        }
        
        if (this.stats.enemiesKilled) {
            this.stats.enemiesKilled.textContent = gameStats.enemiesKilled;
        }
        
        // 显示成就
        this.displayAchievements(gameStats);
    }
    
    // 显示成就
    displayAchievements(gameStats) {
        const achievementsContainer = document.getElementById('achievements');
        if (!achievementsContainer) return;
        
        achievementsContainer.innerHTML = '';
        
        const achievements = this.calculateAchievements(gameStats);
        
        achievements.forEach(achievement => {
            const achievementElement = document.createElement('div');
            achievementElement.className = 'achievement';
            
            achievementElement.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            `;
            
            achievementsContainer.appendChild(achievementElement);
        });
    }
    
    // 计算成就
    calculateAchievements(gameStats) {
        const achievements = [];
        
        // 生存时间成就
        const survivalMinutes = gameStats.survivalTime / (1000 * 60);
        if (survivalMinutes >= 10) {
            achievements.push({
                icon: '⏰',
                title: '持久战士',
                description: '生存超过10分钟'
            });
        } else if (survivalMinutes >= 5) {
            achievements.push({
                icon: '⏱️',
                title: '坚持不懈',
                description: '生存超过5分钟'
            });
        }
        
        // 得分成就
        if (gameStats.score >= 10000) {
            achievements.push({
                icon: '🏆',
                title: '得分大师',
                description: '得分超过10,000'
            });
        } else if (gameStats.score >= 5000) {
            achievements.push({
                icon: '🥇',
                title: '高分玩家',
                description: '得分超过5,000'
            });
        }
        
        // 击杀成就
        if (gameStats.enemiesKilled >= 100) {
            achievements.push({
                icon: '💥',
                title: '终极猎手',
                description: '消灭100个敌人'
            });
        } else if (gameStats.enemiesKilled >= 50) {
            achievements.push({
                icon: '🎯',
                title: '神枪手',
                description: '消灭50个敌人'
            });
        }
        
        // 等级成就
        if (gameStats.level >= 10) {
            achievements.push({
                icon: '⭐',
                title: '经验丰富',
                description: '达到10级'
            });
        }
        
        return achievements;
    }
    
    // 加载设置
    loadSettings() {
        const savedSettings = localStorage.getItem('spaceShooterSettings');
        if (savedSettings) {
            try {
                this.gameSettings = { ...this.gameSettings, ...JSON.parse(savedSettings) };
            } catch (e) {
                console.warn('无法加载设置，使用默认设置');
            }
        }
        
        this.applySettings();
    }
    
    // 应用设置
    applySettings() {
        // 音量设置
        if (this.settings.volumeSlider) {
            this.settings.volumeSlider.value = this.gameSettings.volume;
            this.settings.volumeValue.textContent = this.gameSettings.volume + '%';
            audioManager.setMasterVolume(this.gameSettings.volume / 100);
        }
        
        // 难度设置
        if (this.settings.difficultySelect) {
            this.settings.difficultySelect.value = this.gameSettings.difficulty;
        }
        
        // 特效设置
        if (this.settings.particleEffects) {
            this.settings.particleEffects.checked = this.gameSettings.particleEffects;
        }
        
        if (this.settings.screenShake) {
            this.settings.screenShake.checked = this.gameSettings.screenShake;
        }
    }
    
    // 保存设置
    saveSettings() {
        localStorage.setItem('spaceShooterSettings', JSON.stringify(this.gameSettings));
        this.showNotification('设置已保存', '游戏设置已成功保存', 'success');
    }
    
    // 重置设置
    resetSettings() {
        this.gameSettings = {
            volume: 70,
            difficulty: 'normal',
            particleEffects: true,
            screenShake: true
        };
        
        this.applySettings();
        this.showNotification('设置已重置', '所有设置已恢复为默认值', 'info');
    }
    
    // 显示加载进度
    updateLoadingProgress(progress) {
        const progressBar = document.querySelector('.loading-progress');
        if (progressBar) {
            progressBar.style.width = (progress * 100) + '%';
        }
    }
    
    // 隐藏加载界面
    hideLoadingScreen() {
        if (this.screens.loading) {
            this.screens.loading.classList.add('hidden');
        }
    }
    
    // 格式化数字
    formatNumber(number) {
        return number.toLocaleString();
    }
    
    // 格式化时间
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 获取设置
    getSettings() {
        return { ...this.gameSettings };
    }
    
    // 清理资源
    cleanup() {
        // 移除所有通知
        this.notifications.forEach(notification => {
            if (notification.element && notification.element.parentNode) {
                notification.element.remove();
            }
        });
        this.notifications = [];
    }
    
    // 调试信息显示
    showDebugInfo(debugData) {
        // 可以在开发时显示调试信息
        if (window.DEBUG_MODE) {
            console.log('Debug Info:', debugData);
        }
    }
}

// 创建全局UI管理器实例
const uiManager = new UIManager();

// 导出供外部使用
window.uiManager = uiManager;
