// 敌人系统模块 - enemies.js

class EnemyManager {
    constructor() {
        this.enemies = [];
        this.maxEnemies = 50;
        
        // 敌人类型配置
        this.enemyTypes = {
            basic: {
                health: 20,
                speed: 2,
                size: 20,
                sprite: 'enemy_basic.png',
                color: '#ff4444',
                score: 10,
                fireRate: 2000, // 毫秒
                bulletType: 'enemy_basic',
                behavior: 'straight',
                damage: 5,
                powerupChance: 0.1
            },
            fast: {
                health: 10,
                speed: 4,
                size: 18,
                sprite: 'enemy_fast.png',
                color: '#ffff44',
                score: 15,
                fireRate: 1500,
                bulletType: 'enemy_fast',
                behavior: 'zigzag',
                damage: 3,
                powerupChance: 0.15
            },
            heavy: {
                health: 60,
                speed: 1,
                size: 30,
                sprite: 'enemy_heavy.png',
                color: '#ff44ff',
                score: 30,
                fireRate: 3000,
                bulletType: 'enemy_heavy',
                behavior: 'tank',
                damage: 15,
                powerupChance: 0.25
            },
            seeker: {
                health: 25,
                speed: 2.5,
                size: 22,
                sprite: 'enemy_fast.png',
                color: '#ff8844',
                score: 20,
                fireRate: 2500,
                bulletType: 'enemy_seeking',
                behavior: 'follow',
                damage: 8,
                powerupChance: 0.2
            },
            boss: {
                health: 200,
                speed: 1.5,
                size: 60,
                sprite: 'enemy_heavy.png',
                color: '#8844ff',
                score: 100,
                fireRate: 1000,
                bulletType: 'enemy_heavy',
                behavior: 'boss',
                damage: 20,
                powerupChance: 0.8
            }
        };
        
        // 波次配置
        this.waveConfig = {
            current: 1,
            enemiesRemaining: 0,
            totalEnemies: 0,
            spawnTimer: 0,
            spawnDelay: 2000,
            waveDelay: 5000,
            isWaveActive: false,
            nextWaveTimer: 0
        };
        
        // 生成区域
        this.spawnAreas = [
            { x: 0, y: 0, width: 1200, height: 50 },     // 顶部
            { x: -50, y: 0, width: 50, height: 800 },    // 左侧
            { x: 1200, y: 0, width: 50, height: 800 }    // 右侧
        ];
        
        // 预加载敌人精灵
        this.sprites = {};
        this.loadSprites();
        
        // 敌人AI状态
        this.aiStates = ['patrol', 'attack', 'retreat', 'formation'];
        
        // 编队系统
        this.formations = [];
    }
    
    // 加载敌人精灵
    loadSprites() {
        const spriteNames = ['enemy_basic.png', 'enemy_fast.png', 'enemy_heavy.png'];
        
        spriteNames.forEach(spriteName => {
            const img = new Image();
            img.src = `assets/images/${spriteName}`;
            this.sprites[spriteName] = img;
        });
    }
    
    // 创建敌人
    createEnemy(type, x, y, config = {}) {
        const enemyConfig = this.enemyTypes[type];
        if (!enemyConfig) {
            console.warn('未知的敌人类型:', type);
            return null;
        }
        
        const enemy = {
            id: Date.now() + Math.random(),
            type: type,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            health: enemyConfig.health,
            maxHealth: enemyConfig.health,
            speed: enemyConfig.speed,
            size: enemyConfig.size,
            sprite: this.sprites[enemyConfig.sprite],
            color: enemyConfig.color,
            score: enemyConfig.score,
            damage: enemyConfig.damage,
            powerupChance: enemyConfig.powerupChance,
            
            // AI相关
            behavior: enemyConfig.behavior,
            aiState: 'patrol',
            target: null,
            lastFireTime: 0,
            fireRate: enemyConfig.fireRate,
            bulletType: enemyConfig.bulletType,
            
            // 行为相关
            moveTimer: 0,
            direction: Math.random() * Math.PI * 2,
            waypoint: null,
            formationIndex: -1,
            
            // 状态
            active: true,
            invulnerable: false,
            invulnerabilityTime: 0,
            stunned: false,
            stunnedTime: 0,
            
            // 渲染相关
            rotation: 0,
            scale: 1,
            alpha: 1,
            flashTime: 0,
            
            // 碰撞相关
            width: enemyConfig.size,
            height: enemyConfig.size,
            shape: 'circle',
            radius: enemyConfig.size / 2,
            layer: collisionManager.collisionLayers.ENEMY,
            
            // 自定义配置覆盖
            ...config
        };
        
        // 根据类型设置初始行为
        this.initializeEnemyBehavior(enemy);
        
        this.enemies.push(enemy);
        
        // 创建生成特效
        effectsManager.createExplosion(x, y, 0.5, 'spawn');
        effectsManager.createStardust(x, y, 8);
        
        return enemy;
    }
    
    // 初始化敌人行为
    initializeEnemyBehavior(enemy) {
        switch (enemy.behavior) {
            case 'straight':
                enemy.vy = enemy.speed;
                break;
            case 'zigzag':
                enemy.vy = enemy.speed;
                enemy.vx = (Math.random() - 0.5) * enemy.speed;
                break;
            case 'tank':
                enemy.vy = enemy.speed * 0.5;
                break;
            case 'follow':
                enemy.vy = enemy.speed * 0.7;
                break;
            case 'boss':
                enemy.waypoint = { x: 600, y: 150 }; // Boss移动到屏幕上方中央
                break;
        }
    }
    
    // 生成敌人波次
    spawnWave(waveNumber) {
        this.waveConfig.current = waveNumber;
        this.waveConfig.isWaveActive = true;
        this.waveConfig.spawnTimer = 0;
        
        // 计算波次敌人数量和类型
        const waveData = this.calculateWaveData(waveNumber);
        this.waveConfig.totalEnemies = waveData.totalEnemies;
        this.waveConfig.enemiesRemaining = waveData.totalEnemies;
        
        console.log(`开始第${waveNumber}波，共${waveData.totalEnemies}个敌人`);
        
        // 通知UI
        if (window.uiManager) {
            uiManager.showWaveInfo(waveNumber);
        }
        
        // 播放波次开始音效
        audioManager.playSound('bossAlert', 0.4);
        
        // 开始生成敌人
        this.scheduleEnemySpawns(waveData);
    }
    
    // 计算波次数据
    calculateWaveData(waveNumber) {
        const baseEnemies = 5;
        const enemiesPerWave = Math.floor(baseEnemies + waveNumber * 1.5);
        
        const waveData = {
            totalEnemies: enemiesPerWave,
            enemies: []
        };
        
        // 根据波次决定敌人类型分布
        if (waveNumber <= 3) {
            // 前3波：只有基础敌人
            for (let i = 0; i < enemiesPerWave; i++) {
                waveData.enemies.push('basic');
            }
        } else if (waveNumber <= 6) {
            // 4-6波：基础+快速敌人
            for (let i = 0; i < Math.floor(enemiesPerWave * 0.7); i++) {
                waveData.enemies.push('basic');
            }
            for (let i = 0; i < Math.floor(enemiesPerWave * 0.3); i++) {
                waveData.enemies.push('fast');
            }
        } else if (waveNumber <= 10) {
            // 7-10波：混合敌人
            for (let i = 0; i < Math.floor(enemiesPerWave * 0.5); i++) {
                waveData.enemies.push('basic');
            }
            for (let i = 0; i < Math.floor(enemiesPerWave * 0.3); i++) {
                waveData.enemies.push('fast');
            }
            for (let i = 0; i < Math.floor(enemiesPerWave * 0.2); i++) {
                waveData.enemies.push('heavy');
            }
        } else {
            // 10波以后：所有类型
            for (let i = 0; i < Math.floor(enemiesPerWave * 0.4); i++) {
                waveData.enemies.push('basic');
            }
            for (let i = 0; i < Math.floor(enemiesPerWave * 0.3); i++) {
                waveData.enemies.push('fast');
            }
            for (let i = 0; i < Math.floor(enemiesPerWave * 0.2); i++) {
                waveData.enemies.push('heavy');
            }
            for (let i = 0; i < Math.floor(enemiesPerWave * 0.1); i++) {
                waveData.enemies.push('seeker');
            }
        }
        
        // Boss波次（每5波）
        if (waveNumber % 5 === 0) {
            waveData.enemies.push('boss');
            waveData.totalEnemies++;
        }
        
        return waveData;
    }
    
    // 安排敌人生成
    scheduleEnemySpawns(waveData) {
        this.spawnQueue = [...waveData.enemies];
        this.waveConfig.spawnDelay = Math.max(500, 2000 - this.waveConfig.current * 100);
    }
    
    // 生成单个敌人
    spawnEnemy(type = null) {
        if (!type && this.spawnQueue && this.spawnQueue.length > 0) {
            type = this.spawnQueue.shift();
        }
        
        if (!type) {
            type = 'basic'; // 默认类型
        }
        
        // 选择生成位置
        const spawnArea = this.spawnAreas[Math.floor(Math.random() * this.spawnAreas.length)];
        const x = spawnArea.x + Math.random() * spawnArea.width;
        const y = spawnArea.y + Math.random() * spawnArea.height;
        
        // 确保不与现有敌人重叠
        const spawnPos = this.findValidSpawnPosition(x, y, 40);
        
        return this.createEnemy(type, spawnPos.x, spawnPos.y);
    }
    
    // 寻找有效的生成位置
    findValidSpawnPosition(x, y, minDistance) {
        let attempts = 0;
        let validPosition = { x, y };
        
        while (attempts < 10) {
            let tooClose = false;
            
            for (const enemy of this.enemies) {
                const dx = validPosition.x - enemy.x;
                const dy = validPosition.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                break;
            }
            
            // 尝试新位置
            validPosition.x = x + (Math.random() - 0.5) * 100;
            validPosition.y = y + (Math.random() - 0.5) * 100;
            attempts++;
        }
        
        return validPosition;
    }
    
    // 更新所有敌人
    update(deltaTime, player) {
        // 更新波次逻辑
        this.updateWaveLogic(deltaTime);
        
        // 清空碰撞网格
        collisionManager.clearSpatialGrid();
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (!enemy.active) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            this.updateEnemy(enemy, deltaTime, player);
            
            // 添加到碰撞检测网格
            if (enemy.active) {
                collisionManager.addToSpatialGrid(enemy);
            }
        }
    }
    
    // 更新波次逻辑
    updateWaveLogic(deltaTime) {
        if (this.waveConfig.isWaveActive) {
            // 生成敌人
            if (this.spawnQueue && this.spawnQueue.length > 0) {
                this.waveConfig.spawnTimer += deltaTime;
                
                if (this.waveConfig.spawnTimer >= this.waveConfig.spawnDelay) {
                    this.spawnEnemy();
                    this.waveConfig.spawnTimer = 0;
                }
            }
            
            // 检查波次是否完成
            if (this.enemies.length === 0 && (!this.spawnQueue || this.spawnQueue.length === 0)) {
                this.waveConfig.isWaveActive = false;
                this.waveConfig.nextWaveTimer = this.waveConfig.waveDelay;
                
                console.log(`第${this.waveConfig.current}波完成`);
                
                // 通知UI
                if (window.uiManager) {
                    uiManager.onWaveComplete(this.waveConfig.current);
                }
            }
        } else if (this.waveConfig.nextWaveTimer > 0) {
            // 等待下一波
            this.waveConfig.nextWaveTimer -= deltaTime;
            
            if (this.waveConfig.nextWaveTimer <= 0) {
                this.spawnWave(this.waveConfig.current + 1);
            }
        }
    }
    
    // 更新单个敌人
    updateEnemy(enemy, deltaTime, player) {
        // 更新状态效果
        this.updateEnemyEffects(enemy, deltaTime);
        
        // 如果被眩晕，跳过AI更新
        if (enemy.stunned) {
            return;
        }
        
        // 更新AI
        this.updateEnemyAI(enemy, deltaTime, player);
        
        // 更新位置
        enemy.x += enemy.vx * deltaTime;
        enemy.y += enemy.vy * deltaTime;
        
        // 更新旋转（朝向移动方向）
        if (enemy.vx !== 0 || enemy.vy !== 0) {
            enemy.rotation = Math.atan2(enemy.vy, enemy.vx);
        }
        
        // 边界检查
        this.checkEnemyBounds(enemy);
        
        // 射击逻辑
        this.updateEnemyShooting(enemy, deltaTime, player);
        
        // 创建引擎尾焰
        if (Math.random() < 0.3) {
            effectsManager.createEngineFlame(
                enemy.x - Math.cos(enemy.rotation) * enemy.size / 2,
                enemy.y - Math.sin(enemy.rotation) * enemy.size / 2,
                enemy.rotation + Math.PI,
                0.5
            );
        }
    }
    
    // 更新敌人状态效果
    updateEnemyEffects(enemy, deltaTime) {
        // 无敌时间
        if (enemy.invulnerable) {
            enemy.invulnerabilityTime -= deltaTime;
            if (enemy.invulnerabilityTime <= 0) {
                enemy.invulnerable = false;
            }
        }
        
        // 眩晕时间
        if (enemy.stunned) {
            enemy.stunnedTime -= deltaTime;
            if (enemy.stunnedTime <= 0) {
                enemy.stunned = false;
            }
        }
        
        // 受伤闪烁
        if (enemy.flashTime > 0) {
            enemy.flashTime -= deltaTime;
            enemy.alpha = Math.sin(enemy.flashTime / 50) * 0.5 + 0.5;
        } else {
            enemy.alpha = 1;
        }
    }
    
    // 更新敌人AI
    updateEnemyAI(enemy, deltaTime, player) {
        enemy.moveTimer += deltaTime;
        
        switch (enemy.behavior) {
            case 'straight':
                this.updateStraightBehavior(enemy, deltaTime);
                break;
            case 'zigzag':
                this.updateZigzagBehavior(enemy, deltaTime);
                break;
            case 'tank':
                this.updateTankBehavior(enemy, deltaTime, player);
                break;
            case 'follow':
                this.updateFollowBehavior(enemy, deltaTime, player);
                break;
            case 'boss':
                this.updateBossBehavior(enemy, deltaTime, player);
                break;
        }
    }
    
    // 直线移动行为
    updateStraightBehavior(enemy, deltaTime) {
        // 保持向下移动
        enemy.vy = enemy.speed;
    }
    
    // 之字形移动行为
    updateZigzagBehavior(enemy, deltaTime) {
        enemy.vy = enemy.speed;
        
        // 每2秒改变一次水平方向
        if (enemy.moveTimer > 2000) {
            enemy.vx = (Math.random() - 0.5) * enemy.speed * 2;
            enemy.moveTimer = 0;
        }
    }
    
    // 坦克行为（缓慢移动，频繁射击）
    updateTankBehavior(enemy, deltaTime, player) {
        enemy.vy = enemy.speed * 0.5;
        
        // 朝向玩家
        if (player) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            enemy.rotation = Math.atan2(dy, dx);
        }
    }
    
    // 跟随行为
    updateFollowBehavior(enemy, deltaTime, player) {
        if (player) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 100) {
                // 接近玩家
                enemy.vx = (dx / distance) * enemy.speed * 0.7;
                enemy.vy = (dy / distance) * enemy.speed * 0.7;
            } else {
                // 保持距离
                enemy.vx = -(dx / distance) * enemy.speed * 0.3;
                enemy.vy = -(dy / distance) * enemy.speed * 0.3;
            }
        } else {
            enemy.vy = enemy.speed;
        }
    }
    
    // Boss行为
    updateBossBehavior(enemy, deltaTime, player) {
        if (enemy.waypoint) {
            // 移动到指定位置
            const dx = enemy.waypoint.x - enemy.x;
            const dy = enemy.waypoint.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                enemy.vx = (dx / distance) * enemy.speed;
                enemy.vy = (dy / distance) * enemy.speed;
            } else {
                enemy.vx = 0;
                enemy.vy = 0;
                enemy.waypoint = null;
            }
        } else {
            // 左右移动
            if (enemy.moveTimer > 3000) {
                enemy.vx = (Math.random() - 0.5) * enemy.speed * 2;
                enemy.moveTimer = 0;
            }
            
            // 边界检查
            if (enemy.x < 100) enemy.vx = Math.abs(enemy.vx);
            if (enemy.x > 1100) enemy.vx = -Math.abs(enemy.vx);
        }
    }
    
    // 边界检查
    checkEnemyBounds(enemy) {
        const margin = enemy.size;
        
        // 如果敌人完全离开屏幕下方，移除它
        if (enemy.y > 800 + margin * 2) {
            enemy.active = false;
            return;
        }
        
        // 水平边界反弹
        if (enemy.x < margin) {
            enemy.x = margin;
            enemy.vx = Math.abs(enemy.vx);
        } else if (enemy.x > 1200 - margin) {
            enemy.x = 1200 - margin;
            enemy.vx = -Math.abs(enemy.vx);
        }
    }
    
    // 更新敌人射击
    updateEnemyShooting(enemy, deltaTime, player) {
        if (!player || !player.active) return;
        
        const currentTime = Date.now();
        if (currentTime - enemy.lastFireTime < enemy.fireRate) {
            return;
        }
        
        // 计算射击角度
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        
        // 根据敌人类型决定射击模式
        switch (enemy.type) {
            case 'basic':
                bulletManager.fire(enemy.x, enemy.y, angle, enemy.bulletType, enemy);
                break;
            case 'fast':
                bulletManager.fire(enemy.x, enemy.y, angle, enemy.bulletType, enemy);
                break;
            case 'heavy':
                bulletManager.fireSpread(enemy.x, enemy.y, angle, enemy.bulletType, 3, Math.PI / 6, enemy);
                break;
            case 'seeker':
                bulletManager.fire(enemy.x, enemy.y, angle, enemy.bulletType, enemy);
                break;
            case 'boss':
                // Boss多种射击模式
                if (Math.random() < 0.3) {
                    bulletManager.fireCircle(enemy.x, enemy.y, enemy.bulletType, 8, enemy);
                } else {
                    bulletManager.fireSpread(enemy.x, enemy.y, angle, enemy.bulletType, 5, Math.PI / 4, enemy);
                }
                break;
        }
        
        enemy.lastFireTime = currentTime;
    }
    
    // 敌人受到伤害
    damageEnemy(enemy, damage, source = null) {
        if (!enemy.active || enemy.invulnerable) {
            return 0;
        }
        
        const actualDamage = Math.min(damage, enemy.health);
        enemy.health -= actualDamage;
        
        // 创建伤害数字
        effectsManager.createDamageNumber(enemy.x, enemy.y, actualDamage, 'normal');
        
        // 受伤效果
        enemy.flashTime = 300;
        enemy.invulnerable = true;
        enemy.invulnerabilityTime = 100;
        
        // 屏幕震动
        effectsManager.addScreenShake(2, 100);
        
        // 播放受伤音效
        audioManager.playSoundAtPosition('explosion', enemy.x, enemy.y, 1200, 800, 0.1);
        
        // 死亡检查
        if (enemy.health <= 0) {
            this.destroyEnemy(enemy, source);
        }
        
        return actualDamage;
    }
    
    // 摧毁敌人
    destroyEnemy(enemy, source = null) {
        enemy.active = false;
        
        // 创建爆炸效果
        const explosionSize = enemy.size / 30;
        effectsManager.createExplosion(enemy.x, enemy.y, explosionSize, 'enemy');
        
        // 播放爆炸音效
        audioManager.playSoundAtPosition('enemyDeath', enemy.x, enemy.y, 1200, 800, 0.4);
        
        // 更新波次计数
        if (this.waveConfig.enemiesRemaining > 0) {
            this.waveConfig.enemiesRemaining--;
        }
        
        // 掉落道具
        if (Math.random() < enemy.powerupChance) {
            this.dropPowerUp(enemy.x, enemy.y);
        }
        
        // 通知游戏系统（得分、统计等）
        if (window.gameManager) {
            gameManager.onEnemyDestroyed(enemy, source);
        }
    }
    
    // 掉落道具
    dropPowerUp(x, y) {
        const powerupTypes = ['health', 'weapon', 'shield'];
        const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        // 这里应该调用道具管理器来创建道具
        // powerupManager.createPowerUp(x, y, randomType);
        
        // 临时创建道具闪光效果
        effectsManager.createPowerUpGlow(x, y, '#ffff00');
    }
    
    // 获取最近的敌人
    getNearestEnemy(x, y, maxDistance = Infinity) {
        let nearestEnemy = null;
        let nearestDistance = maxDistance;
        
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        return nearestEnemy;
    }
    
    // 获取指定区域内的敌人
    getEnemiesInArea(x, y, radius) {
        const enemiesInArea = [];
        
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius) {
                enemiesInArea.push(enemy);
            }
        }
        
        return enemiesInArea;
    }
    
    // 渲染所有敌人
    render(ctx) {
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            
            this.renderEnemy(ctx, enemy);
        }
    }
    
    // 渲染单个敌人
    renderEnemy(ctx, enemy) {
        ctx.save();
        
        // 设置透明度和缩放
        ctx.globalAlpha = enemy.alpha;
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);
        ctx.scale(enemy.scale, enemy.scale);
        
        // 渲染精灵或基本形状
        if (enemy.sprite && enemy.sprite.complete) {
            ctx.drawImage(enemy.sprite, -enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
        } else {
            // 基本形状渲染
            ctx.fillStyle = enemy.color;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        // 渲染血条（对于Boss）
        if (enemy.type === 'boss' || enemy.health < enemy.maxHealth) {
            this.renderHealthBar(ctx, enemy);
        }
        
        ctx.restore();
    }
    
    // 渲染血条
    renderHealthBar(ctx, enemy) {
        ctx.save();
        
        // 重置变换
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(enemy.x, enemy.y - enemy.size / 2 - 10);
        
        const barWidth = enemy.size;
        const barHeight = 4;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barWidth / 2, 0, barWidth, barHeight);
        
        // 血条
        ctx.fillStyle = healthPercent > 0.3 ? '#4caf50' : '#f44336';
        ctx.fillRect(-barWidth / 2, 0, barWidth * healthPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, 0, barWidth, barHeight);
        
        ctx.restore();
    }
    
    // 清除所有敌人
    clear() {
        for (const enemy of this.enemies) {
            enemy.active = false;
        }
        this.enemies.length = 0;
        
        this.waveConfig.isWaveActive = false;
        this.waveConfig.current = 1;
        this.spawnQueue = [];
    }
    
    // 获取统计信息
    getStats() {
        return {
            activeEnemies: this.enemies.length,
            currentWave: this.waveConfig.current,
            enemiesRemaining: this.waveConfig.enemiesRemaining,
            isWaveActive: this.waveConfig.isWaveActive
        };
    }
    
    // 调试渲染
    debugRender(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            
            // 渲染碰撞边界
            const bounds = collisionManager.getObjectBounds(enemy);
            ctx.strokeRect(bounds.left, bounds.top, 
                          bounds.right - bounds.left, 
                          bounds.bottom - bounds.top);
            
            // 显示敌人信息
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText(`${enemy.type} HP:${enemy.health}`, enemy.x + 20, enemy.y);
        }
        
        ctx.restore();
    }
}

// 创建全局敌人管理器实例
const enemyManager = new EnemyManager();
