// 玩家系统模块 - player.js

class Player {
    constructor() {
        // 基本属性
        this.x = 600;
        this.y = 700;
        this.width = 40;
        this.height = 40;
        this.radius = 20;
        this.speed = 5;
        
        // 生命值系统
        this.health = 100;
        this.maxHealth = 100;
        this.lives = 3;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.invulnerabilityDuration = 2000; // 2秒无敌时间
        
        // 武器系统
        this.weaponLevel = 1;
        this.maxWeaponLevel = 5;
        this.fireRate = 200; // 毫秒
        this.lastFireTime = 0;
        this.weaponTypes = ['basic', 'rapid', 'heavy', 'laser', 'homing'];
        this.currentWeaponType = 'basic';
        
        // 护盾系统
        this.shield = false;
        this.shieldEnergy = 0;
        this.maxShieldEnergy = 100;
        this.shieldRegenRate = 10; // 每秒恢复点数
        this.shieldCooldown = 0;
        this.shieldDuration = 5000; // 护盾持续时间
        
        // 特殊能力
        this.specialAbilities = {
            rapidFire: { active: false, cooldown: 0, duration: 0, maxCooldown: 10000 },
            shield: { active: false, cooldown: 0, duration: 0, maxCooldown: 15000 },
            laser: { active: false, cooldown: 0, duration: 0, maxCooldown: 20000 }
        };
        
        // 移动和控制
        this.vx = 0;
        this.vy = 0;
        this.acceleration = 0.3;
        this.friction = 0.85;
        this.rotation = -Math.PI / 2; // 朝上
        
        // 状态
        this.active = true;
        this.respawning = false;
        this.respawnTime = 0;
        this.respawnDuration = 3000;
        
        // 渲染相关
        this.sprite = null;
        this.alpha = 1;
        this.scale = 1;
        this.flashTime = 0;
        this.engineFlameTimer = 0;
        
        // 碰撞相关
        this.shape = 'circle';
        this.layer = collisionManager.collisionLayers.PLAYER;
        
        // 统计数据
        this.stats = {
            shotsFired: 0,
            enemiesKilled: 0,
            damageDealt: 0,
            damageTaken: 0,
            powerupsCollected: 0,
            score: 0,
            survivalTime: 0
        };
        
        // 经验和升级系统
        this.experience = 0;
        this.level = 1;
        this.experienceToNextLevel = 100;
        
        this.loadSprite();
        this.initializeTrail();
    }
    
    // 加载玩家精灵
    loadSprite() {
        this.sprite = new Image();
        this.sprite.src = 'assets/images/player_ship.png';
    }
    
    // 初始化轨迹效果
    initializeTrail() {
        this.trail = effectsManager.createTrail(this.x, this.y, {
            color: '#64b5f6',
            maxPoints: 15,
            width: 3,
            fadeSpeed: 0.03
        });
    }
    
    // 更新玩家
    update(deltaTime) {
        if (!this.active) {
            this.updateRespawn(deltaTime);
            return;
        }
        
        this.updateMovement(deltaTime);
        this.updateWeapons(deltaTime);
        this.updateSpecialAbilities(deltaTime);
        this.updateEffects(deltaTime);
        this.updateBounds();
        this.updateStats(deltaTime);
        
        // 更新轨迹
        if (this.trail) {
            effectsManager.updateTrail(this.trail, this.x, this.y);
        }
        
        // 添加到碰撞检测
        collisionManager.addToSpatialGrid(this);
    }
    
    // 更新移动
    updateMovement(deltaTime) {
        const movement = inputManager.getMovementVector();
        
        // 应用加速度
        this.vx += movement.x * this.acceleration * deltaTime / 16;
        this.vy += movement.y * this.acceleration * deltaTime / 16;
        
        // 限制最大速度
        const maxSpeed = this.speed;
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > maxSpeed) {
            this.vx = (this.vx / currentSpeed) * maxSpeed;
            this.vy = (this.vy / currentSpeed) * maxSpeed;
        }
        
        // 应用摩擦力
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // 更新位置
        this.x += this.vx * deltaTime / 16;
        this.y += this.vy * deltaTime / 16;
        
        // 创建引擎尾焰
        if (movement.x !== 0 || movement.y !== 0) {
            this.engineFlameTimer += deltaTime;
            if (this.engineFlameTimer > 50) {
                effectsManager.createEngineFlame(
                    this.x - movement.x * 20,
                    this.y - movement.y * 20,
                    Math.atan2(-movement.y, -movement.x),
                    0.8
                );
                this.engineFlameTimer = 0;
            }
        }
    }
    
    // 更新武器系统
    updateWeapons(deltaTime) {
        // 射击输入
        if (inputManager.isShooting()) {
            this.fire();
        }
        
        // 武器冷却
        if (this.lastFireTime > 0) {
            this.lastFireTime += deltaTime;
        }
    }
    
    // 射击
    fire() {
        const currentTime = Date.now();
        let actualFireRate = this.fireRate;
        
        // 快速射击能力
        if (this.specialAbilities.rapidFire.active) {
            actualFireRate *= 0.3; // 快3倍
        }
        
        if (currentTime - this.lastFireTime < actualFireRate) {
            return;
        }
        
        const bulletType = this.getBulletType();
        const firePosition = this.getFirePosition();
        
        // 根据武器等级决定射击模式
        switch (this.weaponLevel) {
            case 1:
                bulletManager.fire(firePosition.x, firePosition.y, this.rotation, bulletType, this);
                break;
            case 2:
                // 双发
                bulletManager.fire(firePosition.x - 5, firePosition.y, this.rotation, bulletType, this);
                bulletManager.fire(firePosition.x + 5, firePosition.y, this.rotation, bulletType, this);
                break;
            case 3:
                // 三发扩散
                bulletManager.fireSpread(firePosition.x, firePosition.y, this.rotation, bulletType, 3, Math.PI / 12, this);
                break;
            case 4:
                // 四发
                bulletManager.fire(firePosition.x - 8, firePosition.y, this.rotation, bulletType, this);
                bulletManager.fire(firePosition.x - 3, firePosition.y, this.rotation, bulletType, this);
                bulletManager.fire(firePosition.x + 3, firePosition.y, this.rotation, bulletType, this);
                bulletManager.fire(firePosition.x + 8, firePosition.y, this.rotation, bulletType, this);
                break;
            case 5:
                // 五发扩散
                bulletManager.fireSpread(firePosition.x, firePosition.y, this.rotation, bulletType, 5, Math.PI / 8, this);
                break;
        }
        
        this.lastFireTime = currentTime;
        this.stats.shotsFired++;
        
        // 创建枪口闪光
        effectsManager.createParticle(firePosition.x, firePosition.y, {
            vx: 0,
            vy: -2,
            life: 0.1,
            size: 3,
            color: '#ffffff',
            glow: true
        });
    }
    
    // 获取子弹类型
    getBulletType() {
        const baseType = 'player_' + this.currentWeaponType;
        
        // 特殊能力修改子弹类型
        if (this.specialAbilities.laser.active) {
            return 'player_laser';
        }
        
        return baseType;
    }
    
    // 获取射击位置
    getFirePosition() {
        const offsetDistance = this.radius;
        return {
            x: this.x + Math.cos(this.rotation) * offsetDistance,
            y: this.y + Math.sin(this.rotation) * offsetDistance
        };
    }
    
    // 更新特殊能力
    updateSpecialAbilities(deltaTime) {
        Object.keys(this.specialAbilities).forEach(abilityName => {
            const ability = this.specialAbilities[abilityName];
            
            // 更新冷却时间
            if (ability.cooldown > 0) {
                ability.cooldown -= deltaTime;
                if (ability.cooldown <= 0) {
                    ability.cooldown = 0;
                }
            }
            
            // 更新持续时间
            if (ability.active && ability.duration > 0) {
                ability.duration -= deltaTime;
                if (ability.duration <= 0) {
                    this.deactivateSpecialAbility(abilityName);
                }
            }
        });
        
        // 护盾输入
        if (inputManager.isShielding() && this.canActivateShield()) {
            this.activateShield();
        }
        
        // 护盾能量恢复
        if (!this.shield && this.shieldEnergy < this.maxShieldEnergy) {
            this.shieldEnergy += this.shieldRegenRate * deltaTime / 1000;
            this.shieldEnergy = Math.min(this.shieldEnergy, this.maxShieldEnergy);
        }
    }
    
    // 激活护盾
    activateShield() {
        if (this.shieldEnergy >= 30) { // 最少需要30点能量
            this.shield = true;
            this.shieldCooldown = this.shieldDuration;
            this.shieldEnergy -= 30;
            
            // 创建护盾效果
            effectsManager.createShieldEffect(this.x, this.y, this.radius + 10);
            
            // 播放护盾音效
            audioManager.playSound('shield', 0.4);
        }
    }
    
    // 检查是否可以激活护盾
    canActivateShield() {
        return !this.shield && this.shieldEnergy >= 30 && this.shieldCooldown <= 0;
    }
    
    // 激活特殊能力
    activateSpecialAbility(abilityName) {
        const ability = this.specialAbilities[abilityName];
        if (!ability || ability.active || ability.cooldown > 0) {
            return false;
        }
        
        ability.active = true;
        
        switch (abilityName) {
            case 'rapidFire':
                ability.duration = 5000; // 5秒
                ability.cooldown = ability.maxCooldown;
                break;
            case 'shield':
                this.activateShield();
                ability.cooldown = ability.maxCooldown;
                break;
            case 'laser':
                ability.duration = 3000; // 3秒
                ability.cooldown = ability.maxCooldown;
                break;
        }
        
        return true;
    }
    
    // 停用特殊能力
    deactivateSpecialAbility(abilityName) {
        const ability = this.specialAbilities[abilityName];
        if (ability) {
            ability.active = false;
            ability.duration = 0;
        }
    }
    
    // 更新效果
    updateEffects(deltaTime) {
        // 无敌时间
        if (this.invulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
                this.alpha = 1;
            } else {
                // 闪烁效果
                this.alpha = Math.sin(this.invulnerabilityTime / 100) * 0.5 + 0.5;
            }
        }
        
        // 护盾冷却
        if (this.shieldCooldown > 0) {
            this.shieldCooldown -= deltaTime;
            if (this.shieldCooldown <= 0) {
                this.shield = false;
            }
        }
        
        // 受伤闪烁
        if (this.flashTime > 0) {
            this.flashTime -= deltaTime;
        }
    }
    
    // 更新边界
    updateBounds() {
        const margin = this.radius;
        
        // 水平边界
        if (this.x < margin) {
            this.x = margin;
            this.vx = 0;
        } else if (this.x > 1200 - margin) {
            this.x = 1200 - margin;
            this.vx = 0;
        }
        
        // 垂直边界
        if (this.y < margin) {
            this.y = margin;
            this.vy = 0;
        } else if (this.y > 800 - margin) {
            this.y = 800 - margin;
            this.vy = 0;
        }
    }
    
    // 更新统计数据
    updateStats(deltaTime) {
        this.stats.survivalTime += deltaTime;
    }
    
    // 更新重生
    updateRespawn(deltaTime) {
        if (this.respawning) {
            this.respawnTime -= deltaTime;
            if (this.respawnTime <= 0) {
                this.respawn();
            }
        }
    }
    
    // 受到伤害
    takeDamage(damage, source = null) {
        if (!this.active || this.invulnerable) {
            return 0;
        }
        
        let actualDamage = damage;
        
        // 护盾吸收伤害
        if (this.shield) {
            actualDamage *= 0.3; // 护盾减少70%伤害
            this.shieldEnergy -= damage * 0.5;
            
            if (this.shieldEnergy <= 0) {
                this.shield = false;
                this.shieldEnergy = 0;
            }
            
            // 护盾受击效果
            effectsManager.createShieldEffect(this.x, this.y, this.radius + 15);
        }
        
        this.health -= actualDamage;
        this.health = Math.max(0, this.health);
        this.stats.damageTaken += actualDamage;
        
        // 创建伤害数字
        effectsManager.createDamageNumber(this.x, this.y, actualDamage, 'normal');
        
        // 受伤效果
        this.flashTime = 300;
        this.invulnerable = true;
        this.invulnerabilityTime = this.invulnerabilityDuration;
        
        // 屏幕震动
        effectsManager.addScreenShake(5, 200);
        
        // 创建受伤粒子
        for (let i = 0; i < 5; i++) {
            effectsManager.createParticle(this.x, this.y, {
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 0.5,
                size: 2,
                color: '#ff4444',
                glow: true
            });
        }
        
        // 播放受伤音效
        audioManager.playSound('warning', 0.3);
        
        // 振动反馈
        inputManager.vibrate(300, 0.7);
        
        // 检查死亡
        if (this.health <= 0) {
            this.die();
        }
        
        return actualDamage;
    }
    
    // 治疗
    heal(amount) {
        const actualHeal = Math.min(amount, this.maxHealth - this.health);
        this.health += actualHeal;
        
        // 创建治疗数字
        effectsManager.createDamageNumber(this.x, this.y, actualHeal, 'heal');
        
        // 治疗效果
        effectsManager.createPowerUpGlow(this.x, this.y, '#44ff44');
        
        // 播放治疗音效
        audioManager.playSound('heal', 0.4);
        
        return actualHeal;
    }
    
    // 升级武器
    upgradeWeapon() {
        if (this.weaponLevel < this.maxWeaponLevel) {
            this.weaponLevel++;
            
            // 创建升级效果
            effectsManager.createPowerUpGlow(this.x, this.y, '#ffaa00');
            
            // 播放升级音效
            audioManager.playSound('powerup', 0.5);
            
            return true;
        }
        return false;
    }
    
    // 获得经验
    gainExperience(amount) {
        this.experience += amount;
        
        // 检查升级
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
    }
    
    // 升级
    levelUp() {
        this.experience -= this.experienceToNextLevel;
        this.level++;
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
        
        // 升级奖励
        this.maxHealth += 10;
        this.health = this.maxHealth; // 完全恢复
        this.maxShieldEnergy += 20;
        
        // 升级效果
        effectsManager.createExplosion(this.x, this.y, 1.5, 'powerup');
        audioManager.playSound('powerup', 0.8);
        
        // 通知UI
        if (window.uiManager) {
            uiManager.showNotification('等级提升！', `达到 ${this.level} 级`, 'success');
        }
    }
    
    // 死亡
    die() {
        this.active = false;
        this.lives--;
        
        // 创建死亡爆炸
        effectsManager.createExplosion(this.x, this.y, 2, 'player');
        
        // 播放死亡音效
        audioManager.playSound('explosion', 0.6);
        
        // 屏幕震动
        effectsManager.addScreenShake(15, 1000);
        
        // 振动反馈
        inputManager.vibrate(1000, 1.0);
        
        // 清除玩家子弹
        bulletManager.clearByOwner(this);
        
        if (this.lives > 0) {
            // 准备重生
            this.respawning = true;
            this.respawnTime = this.respawnDuration;
        } else {
            // 游戏结束
            if (window.gameManager) {
                gameManager.gameOver();
            }
        }
    }
    
    // 重生
    respawn() {
        this.active = true;
        this.respawning = false;
        this.health = this.maxHealth;
        this.x = 600;
        this.y = 700;
        this.vx = 0;
        this.vy = 0;
        this.invulnerable = true;
        this.invulnerabilityTime = this.invulnerabilityDuration;
        
        // 重生效果
        effectsManager.createExplosion(this.x, this.y, 1, 'spawn');
        effectsManager.createStardust(this.x, this.y, 12);
        
        // 播放重生音效
        audioManager.playSound('powerup', 0.5);
    }
    
    // 渲染玩家
    render(ctx) {
        if (!this.active && !this.respawning) return;
        
        ctx.save();
        
        // 设置透明度
        ctx.globalAlpha = this.alpha;
        
        // 移动到玩家位置
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        
        // 渲染护盾
        if (this.shield) {
            this.renderShield(ctx);
        }
        
        // 渲染玩家精灵
        if (this.sprite && this.sprite.complete) {
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // 基本形状渲染
            ctx.fillStyle = '#64b5f6';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(-this.radius / 2, -this.radius / 2);
            ctx.lineTo(-this.radius / 4, 0);
            ctx.lineTo(-this.radius / 2, this.radius / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        // 渲染武器等级指示器
        if (this.weaponLevel > 1) {
            this.renderWeaponIndicator(ctx);
        }
        
        ctx.restore();
        
        // 渲染重生倒计时
        if (this.respawning) {
            this.renderRespawnTimer(ctx);
        }
    }
    
    // 渲染护盾
    renderShield(ctx) {
        ctx.save();
        
        const shieldRadius = this.radius + 10;
        const shieldAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
        
        ctx.globalAlpha = shieldAlpha;
        ctx.strokeStyle = '#64b5f6';
        ctx.fillStyle = 'rgba(100, 181, 246, 0.1)';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    // 渲染武器等级指示器
    renderWeaponIndicator(ctx) {
        ctx.save();
        
        // 重置变换
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(this.x, this.y - this.radius - 15);
        
        const barWidth = 30;
        const barHeight = 4;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barWidth / 2, 0, barWidth, barHeight);
        
        // 等级条
        const levelPercent = this.weaponLevel / this.maxWeaponLevel;
        ctx.fillStyle = '#ff9800';
        ctx.fillRect(-barWidth / 2, 0, barWidth * levelPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, 0, barWidth, barHeight);
        
        // 等级文字
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`LV.${this.weaponLevel}`, 0, -5);
        
        ctx.restore();
    }
    
    // 渲染重生倒计时
    renderRespawnTimer(ctx) {
        ctx.save();
        
        ctx.translate(this.x, this.y);
        
        const seconds = Math.ceil(this.respawnTime / 1000);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        
        ctx.strokeText(seconds.toString(), 0, 8);
        ctx.fillText(seconds.toString(), 0, 8);
        
        ctx.restore();
    }
    
    // 重置玩家状态
    reset() {
        this.x = 600;
        this.y = 700;
        this.vx = 0;
        this.vy = 0;
        this.health = this.maxHealth;
        this.lives = 3;
        this.weaponLevel = 1;
        this.shield = false;
        this.shieldEnergy = this.maxShieldEnergy;
        this.active = true;
        this.respawning = false;
        this.invulnerable = false;
        this.alpha = 1;
        this.experience = 0;
        this.level = 1;
        this.experienceToNextLevel = 100;
        
        // 重置特殊能力
        Object.keys(this.specialAbilities).forEach(key => {
            this.specialAbilities[key].active = false;
            this.specialAbilities[key].cooldown = 0;
            this.specialAbilities[key].duration = 0;
        });
        
        // 重置统计
        this.stats = {
            shotsFired: 0,
            enemiesKilled: 0,
            damageDealt: 0,
            damageTaken: 0,
            powerupsCollected: 0,
            score: 0,
            survivalTime: 0
        };
        
        // 重新初始化轨迹
        this.initializeTrail();
    }
    
    // 获取玩家状态
    getStatus() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            lives: this.lives,
            weaponLevel: this.weaponLevel,
            shield: this.shield,
            shieldEnergy: this.shieldEnergy,
            level: this.level,
            experience: this.experience,
            experienceToNextLevel: this.experienceToNextLevel,
            stats: { ...this.stats },
            specialAbilities: { ...this.specialAbilities }
        };
    }
    
    // 调试渲染
    debugRender(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        
        // 渲染碰撞边界
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 显示玩家信息
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`HP: ${this.health}/${this.maxHealth}`, this.x + 25, this.y - 20);
        ctx.fillText(`WLV: ${this.weaponLevel}`, this.x + 25, this.y - 5);
        ctx.fillText(`Shield: ${this.shield ? 'ON' : 'OFF'}`, this.x + 25, this.y + 10);
        
        ctx.restore();
    }
}

// 创建全局玩家实例
const player = new Player();
