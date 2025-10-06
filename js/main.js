// 主游戏逻辑 - main.js

class GameManager {
    constructor() {
        // 游戏状态
        this.gameState = 'menu'; // menu, playing, paused, gameOver, loading
        this.isRunning = false;
        this.isPaused = false;
        
        // 游戏画布
        this.canvas = null;
        this.ctx = null;
        
        // 时间管理
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        
        // 游戏数据
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.survivalTime = 0;
        this.scoreMultiplier = 1;
        
        // 性能监控
        this.performance = {
            fps: 60,
            frameCount: 0,
            lastFpsUpdate: 0,
            drawCalls: 0,
            updateTime: 0,
            renderTime: 0
        };
        
        // 调试模式
        this.debugMode = false;
        this.showCollisionBoxes = false;
        this.showPerformanceInfo = false;
        
        // 游戏难度设置
        this.difficulty = {
            enemySpawnRate: 1.0,
            enemyHealth: 1.0,
            enemySpeed: 1.0,
            scoreMultiplier: 1.0
        };
        
        // 道具系统
        this.powerups = [];
        
        this.initialize();
    }
    
    // 初始化游戏
    async initialize() {
        console.log('初始化游戏系统...');
        
        try {
            // 获取画布
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('无法找到游戏画布');
            }
            
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('无法获取画布上下文');
            }
            
            // 设置画布属性
            this.setupCanvas();
            
            // 加载游戏资源
            await this.loadGameAssets();
            
            // 初始化游戏系统
            this.initializeGameSystems();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 开始游戏循环
            this.startGameLoop();
            
            console.log('游戏系统初始化完成');
            
            // 隐藏加载界面
            uiManager.hideLoadingScreen();
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            this.showError('游戏初始化失败: ' + error.message);
        }
    }
    
    // 设置画布
    setupCanvas() {
        // 设置画布分辨率
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        // 设置画布样式
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // 设置渲染属性
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
    }
    
    // 加载游戏资源
    async loadGameAssets() {
        const assets = [
            'assets/images/player_ship.png',
            'assets/images/enemy_basic.png',
            'assets/images/enemy_fast.png',
            'assets/images/enemy_heavy.png',
            'assets/images/bullet_player.png',
            'assets/images/bullet_enemy.png',
            'assets/images/background_stars.jpg'
        ];
        
        let loadedCount = 0;
        const totalAssets = assets.length;
        
        const loadPromises = assets.map(src => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    loadedCount++;
                    const progress = loadedCount / totalAssets;
                    uiManager.updateLoadingProgress(progress);
                    resolve(img);
                };
                img.onerror = reject;
                img.src = src;
            });
        });
        
        try {
            await Promise.all(loadPromises);
            console.log('所有游戏资源加载完成');
        } catch (error) {
            console.error('资源加载失败:', error);
        }
    }
    
    // 初始化游戏系统
    initializeGameSystems() {
        // 初始化各个管理器（它们已经在各自的文件中被创建）
        
        // 设置难度
        this.applyDifficulty(uiManager.getSettings().difficulty);
        
        // 创建初始道具
        this.initializePowerupSystem();
        
        console.log('游戏系统初始化完成');
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 窗口调整大小
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState === 'playing') {
                this.pauseGame();
            }
        });
        
        // 调试快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey) {
                switch (e.code) {
                    case 'KeyD':
                        this.toggleDebugMode();
                        e.preventDefault();
                        break;
                    case 'KeyC':
                        this.showCollisionBoxes = !this.showCollisionBoxes;
                        e.preventDefault();
                        break;
                    case 'KeyP':
                        this.showPerformanceInfo = !this.showPerformanceInfo;
                        e.preventDefault();
                        break;
                }
            }
        });
    }
    
    // 开始游戏循环
    startGameLoop() {
        const gameLoop = (currentTime) => {
            // 计算时间差
            this.deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // 限制最大帧时间，避免大的时间跳跃
            if (this.deltaTime > 100) {
                this.deltaTime = this.frameTime;
            }
            
            // 更新性能统计
            this.updatePerformanceStats(currentTime);
            
            // 游戏更新和渲染
            if (this.gameState === 'playing' && !this.isPaused) {
                const updateStart = performance.now();
                this.update(this.deltaTime);
                this.performance.updateTime = performance.now() - updateStart;
            }
            
            const renderStart = performance.now();
            this.render();
            this.performance.renderTime = performance.now() - renderStart;
            
            // 继续循环
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    // 更新游戏
    update(deltaTime) {
        this.gameTime += deltaTime;
        this.survivalTime += deltaTime;
        
        // 应用时间缩放
        const timeScale = (typeof timeEffectsManager !== 'undefined' && timeEffectsManager.getTimeScale) 
            ? timeEffectsManager.getTimeScale() 
            : 1.0;
        const scaledDeltaTime = deltaTime * timeScale;
        
        // 更新输入
        inputManager.update();
        
        // 更新增强游戏系统
        if (typeof comboSystem !== 'undefined') comboSystem.update(deltaTime);
        if (typeof timeEffectsManager !== 'undefined') timeEffectsManager.update(deltaTime);
        if (typeof advancedWeaponSystem !== 'undefined') advancedWeaponSystem.update(scaledDeltaTime);
        if (typeof environmentalHazardSystem !== 'undefined') environmentalHazardSystem.update(scaledDeltaTime);
        if (typeof advancedEnemySystem !== 'undefined') advancedEnemySystem.update(scaledDeltaTime);
        if (typeof epicBossSystem !== 'undefined') epicBossSystem.update(scaledDeltaTime);
        if (typeof progressionSystem !== 'undefined') progressionSystem.update(deltaTime);
        
        // 更新玩家
        if (player) {
            player.update(scaledDeltaTime);
        }
        
        // 更新敌人
        enemyManager.update(scaledDeltaTime, player);
        
        // 更新子弹
        bulletManager.update(scaledDeltaTime, enemyManager.enemies);
        
        // 更新道具
        this.updatePowerups(scaledDeltaTime);
        
        // 更新特效
        effectsManager.update(scaledDeltaTime);
        
        // 碰撞检测
        this.handleCollisions();
        
        // 更新UI
        this.updateUI();
        
        // 检查游戏状态
        this.checkGameState();
        
        // 随机触发环境事件
        this.updateEnvironmentalEvents(deltaTime);
    }
    
    // 敌人死亡处理
    onEnemyDeath(enemy) {
        // 连击系统处理
        comboSystem.addCombo(1);
        
        // 计算分数（包含连击加成）
        const baseScore = enemy.scoreValue || 10;
        const multipliedScore = Math.floor(baseScore * comboSystem.getScoreMultiplier());
        this.addScore(multipliedScore);
        
        // 生成经验值
        this.spawnExperienceOrb(enemy.x, enemy.y, enemy.expValue || 1);
        
        // 有几率生成道具（连击越高几率越大）
        const comboBonus = Math.min(comboSystem.currentCombo * 0.01, 0.15);
        if (Math.random() < 0.1 + comboBonus) {
            this.spawnRandomPowerup(enemy.x, enemy.y);
        }
        
        // 播放死亡音效
        audioManager.playSoundAtPosition('enemyDeath', enemy.x, enemy.y, 1200, 800, 0.3);
        
        // 创建爆炸效果
        effectsManager.createExplosion(enemy.x, enemy.y, enemy.radius / 20);
    }
    
    // 更新环境事件
    updateEnvironmentalEvents(deltaTime) {
        // 随机触发环境事件
        if (Math.random() < 0.0001 * deltaTime) { // 很低的概率
            const events = ['meteorShower', 'gravitationalStorm', 'electricStorm', 'solarActivity'];
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            environmentalHazardSystem.activateEnvironmentalEvent(randomEvent, 8000 + Math.random() * 7000);
        }
    }
    
    // 生成经验球
    spawnExperienceOrb(x, y, value) {
        // 创建经验球道具
        this.spawnPowerup(x, y, 'experience', { expValue: value });
    }
    
    // 生成随机道具
    spawnRandomPowerup(x, y) {
        const powerupTypes = ['health', 'shield', 'rapidFire', 'multiShot', 'experience'];
        const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        this.spawnPowerup(x, y, randomType);
    }
    
    // 时间特效激活
    activateTimeEffect(effectType, scale, duration) {
        switch (effectType) {
            case 'slow':
                timeEffectsManager.activateBulletTime(duration);
                break;
            case 'freeze':
                timeEffectsManager.activateTimeFreeze(duration);
                break;
            case 'accelerate':
                timeEffectsManager.activateTimeAccelerate(duration);
                break;
        }
    }
    
    // 停用时间特效
    deactivateTimeEffect() {
        timeEffectsManager.deactivateAllEffects();
    }
    
    // 处理碰撞
    handleCollisions() {
        if (!player || !player.active) return;
        
        // 玩家与敌人子弹的碰撞
        const enemyBullets = bulletManager.getBulletsByLayer(
            collisionManager.collisionLayers.ENEMY_BULLET
        );
        
        for (const bullet of enemyBullets) {
            if (collisionManager.checkCollision(player, bullet)) {
                const damage = bulletManager.onBulletHit(bullet, player);
                player.takeDamage(damage, bullet.owner);
                break; // 一次只处理一个碰撞
            }
        }
        
        // 玩家与敌人的碰撞
        for (const enemy of enemyManager.enemies) {
            if (!enemy.active) continue;
            
            if (collisionManager.checkCollision(player, enemy)) {
                const damage = enemy.damage;
                player.takeDamage(damage, enemy);
                enemyManager.damageEnemy(enemy, enemy.health, player); // 撞击摧毁敌人
                break;
            }
        }
        
        // 玩家子弹与敌人的碰撞
        const playerBullets = bulletManager.getBulletsByLayer(
            collisionManager.collisionLayers.PLAYER_BULLET
        );
        
        for (const bullet of playerBullets) {
            if (!bullet.active) continue;
            
            for (const enemy of enemyManager.enemies) {
                if (!enemy.active) continue;
                
                if (collisionManager.checkCollision(bullet, enemy)) {
                    const damage = bulletManager.onBulletHit(bullet, enemy);
                    const actualDamage = enemyManager.damageEnemy(enemy, damage, player);
                    
                    // 更新玩家统计
                    if (player) {
                        player.stats.damageDealt += actualDamage;
                        if (!enemy.active) {
                            player.stats.enemiesKilled++;
                            this.addScore(enemy.score);
                        }
                    }
                    
                    if (!bullet.pierce) {
                        break; // 非穿透子弹命中后停止检测
                    }
                }
            }
        }
        
        // 玩家与道具的碰撞
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (collisionManager.checkCollision(player, powerup)) {
                this.collectPowerup(powerup);
                this.powerups.splice(i, 1);
            }
        }
    }
    
    // 更新UI
    updateUI() {
        const gameData = {
            score: this.score,
            level: this.level,
            wave: enemyManager.waveConfig.current,
            lives: player ? player.lives : 0,
            health: player ? player.health : 0,
            maxHealth: player ? player.maxHealth : 100,
            weaponLevel: player ? player.weaponLevel : 1,
            survivalTime: this.survivalTime
        };
        
        uiManager.updateGameUI(gameData);
        
        // 更新武器冷却显示
        if (player) {
            const timeSinceLastFire = Date.now() - player.lastFireTime;
            const cooldownPercent = Math.min(1, timeSinceLastFire / player.fireRate);
            uiManager.updateWeaponCooldown(cooldownPercent);
        }
        
        // 更新波次进度
        const waveProgress = enemyManager.waveConfig.enemiesRemaining > 0 ?
            1 - (enemyManager.waveConfig.enemiesRemaining / enemyManager.waveConfig.totalEnemies) : 1;
        uiManager.updateWaveProgress(waveProgress);
    }
    
    // 检查游戏状态
    checkGameState() {
        if (!player || !player.active) {
            if (player && player.lives <= 0) {
                this.gameOver();
            }
        }
    }
    
    // 渲染游戏
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染背景
        this.renderBackground();
        
        if (this.gameState === 'playing') {
            // 渲染环境危险
            environmentalHazardSystem.render(this.ctx);
            
            // 渲染游戏对象
            this.renderGameObjects();
            
            // 渲染特效
            effectsManager.render(this.ctx);
            
            // 渲染增强系统效果
            if (typeof comboSystem !== 'undefined') comboSystem.render(this.ctx);
            if (typeof timeEffectsManager !== 'undefined') timeEffectsManager.render(this.ctx);
            if (typeof epicBossSystem !== 'undefined') epicBossSystem.render(this.ctx);
            
            // 渲染调试信息
            if (this.debugMode) {
                this.renderDebugInfo();
            }
        }
        
        // 渲染性能信息
        if (this.showPerformanceInfo) {
            this.renderPerformanceInfo();
        }
        
        this.performance.drawCalls++;
    }
    
    // 渲染背景
    renderBackground() {
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(0.5, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 渲染游戏对象
    renderGameObjects() {
        // 渲染道具
        this.renderPowerups();
        
        // 渲染子弹
        bulletManager.render(this.ctx);
        
        // 渲染敌人
        enemyManager.render(this.ctx);
        
        // 渲染玩家
        if (player) {
            player.render(this.ctx);
        }
        
        // 渲染碰撞框（调试用）
        if (this.showCollisionBoxes) {
            collisionManager.debugDraw(this.ctx, this.canvas.width, this.canvas.height);
            bulletManager.debugRender(this.ctx);
            enemyManager.debugRender(this.ctx);
            if (player) {
                player.debugRender(this.ctx);
            }
        }
    }
    
    // 渲染道具
    renderPowerups() {
        for (const powerup of this.powerups) {
            this.ctx.save();
            
            this.ctx.translate(powerup.x, powerup.y);
            this.ctx.rotate(powerup.rotation);
            
            if (powerup.sprite && powerup.sprite.complete) {
                this.ctx.drawImage(powerup.sprite, -powerup.size / 2, -powerup.size / 2, 
                                 powerup.size, powerup.size);
            } else {
                this.ctx.fillStyle = powerup.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, powerup.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
    }
    
    // 渲染调试信息
    renderDebugInfo() {
        this.ctx.save();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 200);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        
        let y = 25;
        const lineHeight = 15;
        
        const debugInfo = [
            `FPS: ${this.performance.fps.toFixed(1)}`,
            `Update: ${this.performance.updateTime.toFixed(2)}ms`,
            `Render: ${this.performance.renderTime.toFixed(2)}ms`,
            `Players: ${player ? 1 : 0}`,
            `Enemies: ${enemyManager.enemies.length}`,
            `Bullets: ${bulletManager.bullets.length}`,
            `Particles: ${effectsManager.particles.length}`,
            `Powerups: ${this.powerups.length}`,
            `Score: ${this.score}`,
            `Wave: ${enemyManager.waveConfig.current}`,
            `Time: ${this.formatTime(this.survivalTime)}`
        ];
        
        debugInfo.forEach(info => {
            this.ctx.fillText(info, 20, y);
            y += lineHeight;
        });
        
        this.ctx.restore();
    }
    
    // 渲染性能信息
    renderPerformanceInfo() {
        this.ctx.save();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.canvas.width - 150, 10, 140, 60);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        
        this.ctx.fillText(`FPS: ${this.performance.fps.toFixed(1)}`, this.canvas.width - 140, 25);
        this.ctx.fillText(`Update: ${this.performance.updateTime.toFixed(1)}ms`, this.canvas.width - 140, 40);
        this.ctx.fillText(`Render: ${this.performance.renderTime.toFixed(1)}ms`, this.canvas.width - 140, 55);
        
        this.ctx.restore();
    }
    
    // 更新性能统计
    updatePerformanceStats(currentTime) {
        this.performance.frameCount++;
        
        if (currentTime - this.performance.lastFpsUpdate >= 1000) {
            this.performance.fps = this.performance.frameCount;
            this.performance.frameCount = 0;
            this.performance.lastFpsUpdate = currentTime;
            this.performance.drawCalls = 0;
        }
    }
    
    // 初始化道具系统
    initializePowerupSystem() {
        this.powerupTypes = {
            health: {
                sprite: 'assets/images/powerup_health.png',
                color: '#44ff44',
                effect: (player) => player.heal(25)
            },
            weapon: {
                sprite: 'assets/images/powerup_weapon.png',
                color: '#ffaa00',
                effect: (player) => player.upgradeWeapon()
            },
            shield: {
                sprite: 'assets/images/powerup_shield.png',
                color: '#4444ff',
                effect: (player) => {
                    player.shieldEnergy = player.maxShieldEnergy;
                    player.activateShield();
                }
            }
        };
    }
    
    // 更新道具
    updatePowerups(deltaTime) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            // 更新位置
            powerup.y += powerup.speed * deltaTime / 16;
            powerup.rotation += powerup.rotationSpeed * deltaTime / 16;
            
            // 更新生命时间
            powerup.life -= deltaTime;
            
            // 移除过期或超出屏幕的道具
            if (powerup.life <= 0 || powerup.y > 850) {
                this.powerups.splice(i, 1);
            }
        }
    }
    
    // 创建道具
    createPowerup(x, y, type) {
        const config = this.powerupTypes[type];
        if (!config) return;
        
        const powerup = {
            x: x,
            y: y,
            type: type,
            size: 24,
            speed: 1,
            rotation: 0,
            rotationSpeed: 0.05,
            life: 10000, // 10秒
            color: config.color,
            sprite: null,
            effect: config.effect,
            shape: 'circle',
            radius: 12,
            width: 24,
            height: 24,
            layer: collisionManager.collisionLayers.POWERUP
        };
        
        // 加载精灵
        if (config.sprite) {
            powerup.sprite = new Image();
            powerup.sprite.src = config.sprite;
        }
        
        this.powerups.push(powerup);
        
        return powerup;
    }
    
    // 收集道具
    collectPowerup(powerup) {
        if (player && powerup.effect) {
            powerup.effect(player);
            player.stats.powerupsCollected++;
        }
        
        // 创建收集特效
        effectsManager.createPowerUpGlow(powerup.x, powerup.y, powerup.color);
        
        // 播放音效
        audioManager.playSound('powerup', 0.5);
        
        // 加分
        this.addScore(50);
    }
    
    // 添加分数
    addScore(points) {
        const bonusPoints = Math.floor(points * this.scoreMultiplier);
        this.score += bonusPoints;
        
        // 显示得分
        if (player) {
            effectsManager.createDamageNumber(player.x, player.y - 30, bonusPoints, 'normal');
        }
        
        // 检查升级
        this.checkLevelUp();
    }
    
    // 检查等级提升
    checkLevelUp() {
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.scoreMultiplier += 0.1; // 每级增加10%分数倍率
            
            uiManager.showNotification('等级提升！', `达到 ${this.level} 级`, 'success');
            
            // 创建道具作为奖励
            if (player) {
                this.createPowerup(player.x + Math.random() * 100 - 50, 
                                 player.y - 100, 
                                 Math.random() < 0.5 ? 'weapon' : 'health');
            }
        }
    }
    
    // 敌人被摧毁时调用
    onEnemyDestroyed(enemy, source) {
        // 加分
        this.addScore(enemy.score);
        
        // 随机掉落道具
        if (Math.random() < enemy.powerupChance) {
            const powerupTypes = ['health', 'weapon', 'shield'];
            const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
            this.createPowerup(enemy.x, enemy.y, randomType);
        }
    }
    
    // 应用难度设置
    applyDifficulty(difficultyName) {
        const difficulties = {
            easy: {
                enemySpawnRate: 0.7,
                enemyHealth: 0.8,
                enemySpeed: 0.8,
                scoreMultiplier: 0.8
            },
            normal: {
                enemySpawnRate: 1.0,
                enemyHealth: 1.0,
                enemySpeed: 1.0,
                scoreMultiplier: 1.0
            },
            hard: {
                enemySpawnRate: 1.3,
                enemyHealth: 1.2,
                enemySpeed: 1.2,
                scoreMultiplier: 1.2
            },
            nightmare: {
                enemySpawnRate: 1.5,
                enemyHealth: 1.5,
                enemySpeed: 1.5,
                scoreMultiplier: 1.5
            }
        };
        
        this.difficulty = difficulties[difficultyName] || difficulties.normal;
    }
    
    // 开始游戏
    startGame() {
        console.log('开始新游戏');
        
        this.gameState = 'playing';
        this.isRunning = true;
        this.isPaused = false;
        
        // 重置游戏数据
        this.score = 0;
        this.level = 1;
        this.survivalTime = 0;
        this.scoreMultiplier = 1;
        
        // 重置玩家
        if (player) {
            player.reset();
        }
        
        // 重置所有游戏系统
        enemyManager.clear();
        bulletManager.clear();
        effectsManager.clear();
        this.powerups = [];
        
        // 重置增强系统
        if (typeof comboSystem !== 'undefined') comboSystem.reset();
        if (typeof timeEffectsManager !== 'undefined') timeEffectsManager.reset();
        if (typeof advancedWeaponSystem !== 'undefined') advancedWeaponSystem.reset();
        if (typeof environmentalHazardSystem !== 'undefined') environmentalHazardSystem.reset();
        if (typeof epicBossSystem !== 'undefined') epicBossSystem.cleanup();
        if (typeof advancedEnemySystem !== 'undefined') advancedEnemySystem.cleanup();
        
        // 开始第一波敌人
        enemyManager.spawnWave(1);
        
        // 播放开始音效和动态音乐
        if (typeof enhancedAudioManager !== 'undefined') {
            enhancedAudioManager.transitionToMusicTheme('calm');
        } else {
            audioManager.playSound('buttonClick', 0.5);
        }
        
        // 显示开始通知
        if (typeof uiManager !== 'undefined') {
            uiManager.showNotification('游戏开始！', '消灭所有敌人，生存下去！', 'info');
        }
    }
    
    // 暂停游戏
    pauseGame() {
        if (this.gameState === 'playing') {
            this.isPaused = true;
            console.log('游戏已暂停');
        }
    }
    
    // 继续游戏
    resumeGame() {
        if (this.gameState === 'playing') {
            this.isPaused = false;
            console.log('游戏已继续');
        }
    }
    
    // 重新开始游戏
    restartGame() {
        console.log('重新开始游戏');
        this.startGame();
    }
    
    // 停止游戏
    stopGame() {
        this.gameState = 'menu';
        this.isRunning = false;
        this.isPaused = false;
        
        // 清理游戏状态
        if (player) {
            player.reset();
        }
        
        enemyManager.clear();
        bulletManager.clear();
        effectsManager.clear();
        this.powerups = [];
        
        console.log('游戏已停止');
    }
    
    // 游戏结束
    gameOver() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'gameOver';
        this.isRunning = false;
        
        console.log('游戏结束');
        
        // 收集最终统计数据
        const finalStats = {
            score: this.score,
            level: this.level,
            survivalTime: this.survivalTime,
            enemiesKilled: player ? player.stats.enemiesKilled : 0,
            shotsFired: player ? player.stats.shotsFired : 0,
            damageDealt: player ? player.stats.damageDealt : 0,
            powerupsCollected: player ? player.stats.powerupsCollected : 0
        };
        
        // 显示游戏结束界面
        uiManager.showGameOver(finalStats);
        
        // 播放游戏结束音效
        audioManager.playSound('explosion', 0.8);
        
        // 清理游戏对象
        setTimeout(() => {
            bulletManager.clear();
            effectsManager.clear();
            this.powerups = [];
        }, 2000);
    }
    
    // 切换调试模式
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log('调试模式:', this.debugMode ? '开启' : '关闭');
    }
    
    // 显示错误
    showError(message) {
        console.error(message);
        uiManager.showNotification('错误', message, 'error');
    }
    
    // 格式化时间
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 获取游戏统计
    getGameStats() {
        return {
            gameState: this.gameState,
            score: this.score,
            level: this.level,
            survivalTime: this.survivalTime,
            performance: { ...this.performance },
            enemies: enemyManager.getStats(),
            bullets: bulletManager.getStats(),
            effects: effectsManager.getStats(),
            player: player ? player.getStatus() : null
        };
    }
}

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error);
    if (window.gameManager) {
        gameManager.showError('发生未知错误: ' + e.message);
    }
});

// 未处理的Promise拒绝
window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
    if (window.gameManager) {
        gameManager.showError('系统错误: ' + e.reason);
    }
});

// 创建全局游戏管理器实例
const gameManager = new GameManager();

// 导出供外部使用
window.gameManager = gameManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，初始化游戏...');
});

console.log('太空射击游戏 v1.0 - 准备就绪！');
