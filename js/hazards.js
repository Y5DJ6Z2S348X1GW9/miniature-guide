// 环境危险系统模块 - hazards.js

class EnvironmentalHazardSystem {
    constructor() {
        // 危险类型定义
        this.hazardTypes = {
            meteor: {
                name: '流星',
                sprite: 'hazard_meteor.png',
                damage: 15,
                health: 30,
                speed: 3,
                size: 35,
                rotationSpeed: 0.05,
                spawnChance: 0.1,
                destroyable: true,
                scoreValue: 5
            },
            
            blackhole: {
                name: '黑洞',
                sprite: 'hazard_blackhole.png',
                damage: 5,
                health: Infinity,
                speed: 1,
                size: 80,
                pullRadius: 150,
                pullStrength: 0.3,
                spawnChance: 0.02,
                destroyable: false,
                lifetime: 15000 // 15秒后消失
            },
            
            energyfield: {
                name: '能量场',
                sprite: 'hazard_energyfield.png',
                damage: 8,
                health: 50,
                speed: 2,
                size: 60,
                electricRadius: 80,
                spawnChance: 0.05,
                destroyable: true,
                scoreValue: 10
            },
            
            asteroid: {
                name: '小行星',
                sprite: 'hazard_meteor.png',
                damage: 25,
                health: 80,
                speed: 1.5,
                size: 50,
                rotationSpeed: 0.02,
                spawnChance: 0.08,
                destroyable: true,
                scoreValue: 15,
                splitOnDestroy: true
            },
            
            wormhole: {
                name: '虫洞',
                sprite: 'hazard_blackhole.png',
                damage: 0,
                health: Infinity,
                speed: 0.5,
                size: 60,
                teleportRadius: 40,
                spawnChance: 0.01,
                destroyable: false,
                lifetime: 10000,
                pairRequired: true
            },
            
            solarflare: {
                name: '太阳耀斑',
                sprite: 'weapon_wave.png',
                damage: 12,
                health: Infinity,
                speed: 8,
                size: 200,
                spawnChance: 0.03,
                destroyable: false,
                waveEffect: true
            }
        };
        
        // 活跃的危险列表
        this.activeHazards = [];
        this.maxHazards = 15;
        
        // 生成计时器
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // 2秒
        
        // 环境事件系统
        this.environmentalEvents = {
            meteorShower: { active: false, duration: 0, intensity: 1.0 },
            gravitationalStorm: { active: false, duration: 0, pullMultiplier: 2.0 },
            electricStorm: { active: false, duration: 0, damageMultiplier: 1.5 },
            solarActivity: { active: false, duration: 0, spawnRateMultiplier: 3.0 }
        };
        
        // 虫洞配对系统
        this.wormholePairs = [];
        
        // 粒子效果
        this.hazardParticles = [];
        
        // 预加载精灵
        this.sprites = {};
        this.loadSprites();
        
        // 环境音效
        this.ambientSounds = {
            blackhole: { playing: false, source: null },
            energyfield: { playing: false, source: null }
        };
        
        // 性能优化
        this.updateInterval = 0;
        this.particleUpdateCounter = 0;
    }
    
    // 加载危险精灵
    loadSprites() {
        Object.values(this.hazardTypes).forEach(hazard => {
            if (hazard.sprite) {
                const img = new Image();
                img.src = `assets/images/${hazard.sprite}`;
                this.sprites[hazard.sprite] = img;
            }
        });
    }
    
    // 创建危险
    createHazard(type, x = null, y = null, customConfig = {}) {
        if (!this.hazardTypes[type]) {
            console.warn('未知危险类型:', type);
            return null;
        }
        
        if (this.activeHazards.length >= this.maxHazards) {
            return null;
        }
        
        const config = this.hazardTypes[type];
        
        // 随机位置（如果未指定）
        if (x === null || y === null) {
            const spawnSide = Math.random();
            if (spawnSide < 0.25) {
                // 从上方生成
                x = Math.random() * 1200;
                y = -config.size;
            } else if (spawnSide < 0.5) {
                // 从右侧生成
                x = 1200 + config.size;
                y = Math.random() * 800;
            } else if (spawnSide < 0.75) {
                // 从左侧生成
                x = -config.size;
                y = Math.random() * 800;
            } else {
                // 从屏幕内随机位置生成（特殊危险）
                x = Math.random() * 1000 + 100;
                y = Math.random() * 600 + 100;
            }
        }
        
        const hazard = {
            id: Date.now() + Math.random(),
            type: type,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            health: config.health,
            maxHealth: config.health,
            damage: config.damage,
            size: config.size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: config.rotationSpeed || 0,
            active: true,
            sprite: this.sprites[config.sprite],
            
            // 特殊属性
            pullRadius: config.pullRadius || 0,
            pullStrength: config.pullStrength || 0,
            electricRadius: config.electricRadius || 0,
            teleportRadius: config.teleportRadius || 0,
            
            // 生命周期
            lifetime: config.lifetime || Infinity,
            age: 0,
            
            // 碰撞
            shape: 'circle',
            radius: config.size / 2,
            layer: collisionManager.collisionLayers.ENEMY,
            
            // 视觉效果
            alpha: 1.0,
            scale: 1.0,
            glowIntensity: 0,
            
            // 自定义配置
            ...customConfig
        };
        
        // 设置初始速度
        this.setHazardMovement(hazard);
        
        // 特殊初始化
        this.initializeSpecialBehavior(hazard);
        
        this.activeHazards.push(hazard);
        
        // 创建生成效果
        this.createSpawnEffect(hazard);
        
        return hazard;
    }
    
    // 设置危险移动模式
    setHazardMovement(hazard) {
        const config = this.hazardTypes[hazard.type];
        
        switch (hazard.type) {
            case 'meteor':
            case 'asteroid':
                // 朝向屏幕中心附近
                const targetX = 600 + (Math.random() - 0.5) * 400;
                const targetY = 400 + (Math.random() - 0.5) * 200;
                const dx = targetX - hazard.x;
                const dy = targetY - hazard.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                hazard.vx = (dx / distance) * config.speed;
                hazard.vy = (dy / distance) * config.speed;
                break;
                
            case 'blackhole':
            case 'wormhole':
                // 缓慢漂移
                hazard.vx = (Math.random() - 0.5) * config.speed;
                hazard.vy = (Math.random() - 0.5) * config.speed;
                break;
                
            case 'energyfield':
                // 随机移动
                hazard.vx = (Math.random() - 0.5) * config.speed * 2;
                hazard.vy = (Math.random() - 0.5) * config.speed * 2;
                break;
                
            case 'solarflare':
                // 从左到右扫过
                hazard.vx = config.speed;
                hazard.vy = 0;
                break;
        }
    }
    
    // 初始化特殊行为
    initializeSpecialBehavior(hazard) {
        switch (hazard.type) {
            case 'wormhole':
                // 寻找配对虫洞
                if (this.hazardTypes[hazard.type].pairRequired) {
                    this.createWormholePair(hazard);
                }
                break;
                
            case 'blackhole':
                // 开始环境音效
                this.startAmbientSound('blackhole');
                break;
                
            case 'energyfield':
                // 开始能量场音效
                this.startAmbientSound('energyfield');
                break;
        }
    }
    
    // 创建虫洞配对
    createWormholePair(wormhole1) {
        // 在随机位置创建配对虫洞
        const x = Math.random() * 1000 + 100;
        const y = Math.random() * 600 + 100;
        
        const wormhole2 = this.createHazard('wormhole', x, y, { 
            pairId: wormhole1.id 
        });
        
        if (wormhole2) {
            wormhole1.pairId = wormhole2.id;
            this.wormholePairs.push([wormhole1.id, wormhole2.id]);
        }
    }
    
    // 更新危险系统
    update(deltaTime) {
        this.updateInterval += deltaTime;
        
        // 更新生成
        this.updateSpawning(deltaTime);
        
        // 更新环境事件
        this.updateEnvironmentalEvents(deltaTime);
        
        // 更新危险
        for (let i = this.activeHazards.length - 1; i >= 0; i--) {
            const hazard = this.activeHazards[i];
            
            if (!hazard.active) {
                this.removeHazard(i);
                continue;
            }
            
            this.updateHazard(hazard, deltaTime);
            
            // 检查生命周期
            if (hazard.age >= hazard.lifetime) {
                this.destroyHazard(hazard);
                this.removeHazard(i);
            }
        }
        
        // 更新粒子效果（降频）
        this.particleUpdateCounter += deltaTime;
        if (this.particleUpdateCounter >= 50) { // 每50ms更新一次
            this.updateHazardParticles(deltaTime);
            this.particleUpdateCounter = 0;
        }
        
        // 添加到碰撞检测
        this.activeHazards.forEach(hazard => {
            if (hazard.active) {
                collisionManager.addToSpatialGrid(hazard);
            }
        });
    }
    
    // 更新生成
    updateSpawning(deltaTime) {
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.trySpawnHazard();
        }
    }
    
    // 尝试生成危险
    trySpawnHazard() {
        if (this.activeHazards.length >= this.maxHazards) {
            return;
        }
        
        // 应用环境事件的生成倍率
        let spawnRateMultiplier = 1.0;
        if (this.environmentalEvents.solarActivity.active) {
            spawnRateMultiplier = this.environmentalEvents.solarActivity.spawnRateMultiplier;
        }
        
        // 选择要生成的危险类型
        const hazardTypes = Object.keys(this.hazardTypes);
        for (const type of hazardTypes) {
            const config = this.hazardTypes[type];
            const chance = config.spawnChance * spawnRateMultiplier;
            
            if (Math.random() < chance) {
                this.createHazard(type);
                break; // 每次只生成一个
            }
        }
    }
    
    // 更新单个危险
    updateHazard(hazard, deltaTime) {
        // 更新年龄
        hazard.age += deltaTime;
        
        // 更新位置
        hazard.x += hazard.vx * deltaTime / 16;
        hazard.y += hazard.vy * deltaTime / 16;
        
        // 更新旋转
        if (hazard.rotationSpeed) {
            hazard.rotation += hazard.rotationSpeed * deltaTime / 16;
        }
        
        // 特殊行为更新
        this.updateSpecialBehavior(hazard, deltaTime);
        
        // 边界检查
        this.checkHazardBounds(hazard);
        
        // 创建粒子效果
        if (Math.random() < 0.1) {
            this.createHazardParticles(hazard);
        }
    }
    
    // 更新特殊行为
    updateSpecialBehavior(hazard, deltaTime) {
        switch (hazard.type) {
            case 'blackhole':
                this.updateBlackholeBehavior(hazard, deltaTime);
                break;
                
            case 'energyfield':
                this.updateEnergyFieldBehavior(hazard, deltaTime);
                break;
                
            case 'wormhole':
                this.updateWormholeBehavior(hazard, deltaTime);
                break;
                
            case 'solarflare':
                this.updateSolarFlareBehavior(hazard, deltaTime);
                break;
        }
    }
    
    // 更新黑洞行为
    updateBlackholeBehavior(hazard, deltaTime) {
        // 影响玩家
        if (player && player.active) {
            const dx = player.x - hazard.x;
            const dy = player.y - hazard.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < hazard.pullRadius) {
                const pullForce = hazard.pullStrength * (1 - distance / hazard.pullRadius);
                player.vx -= (dx / distance) * pullForce * deltaTime / 16;
                player.vy -= (dy / distance) * pullForce * deltaTime / 16;
                
                // 如果太近，造成伤害
                if (distance < hazard.radius) {
                    player.takeDamage(hazard.damage * deltaTime / 1000, hazard);
                }
            }
        }
        
        // 影响子弹
        const bullets = bulletManager.getBulletsByLayer(
            collisionManager.collisionLayers.PLAYER_BULLET
        );
        
        bullets.forEach(bullet => {
            const dx = bullet.x - hazard.x;
            const dy = bullet.y - hazard.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < hazard.pullRadius) {
                const pullForce = hazard.pullStrength * (1 - distance / hazard.pullRadius);
                bullet.vx -= (dx / distance) * pullForce * deltaTime / 16;
                bullet.vy -= (dy / distance) * pullForce * deltaTime / 16;
            }
        });
        
        // 脉冲效果
        hazard.glowIntensity = 0.5 + Math.sin(hazard.age * 0.005) * 0.3;
    }
    
    // 更新能量场行为
    updateEnergyFieldBehavior(hazard, deltaTime) {
        // 电弧效果
        if (Math.random() < 0.05) {
            this.createElectricArc(hazard);
        }
        
        // 检查电击范围内的对象
        if (player && player.active) {
            const dx = player.x - hazard.x;
            const dy = player.y - hazard.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < hazard.electricRadius) {
                // 间歇性电击伤害
                if (Math.random() < 0.02) {
                    player.takeDamage(hazard.damage, hazard);
                    this.createElectricShock(hazard, player);
                }
            }
        }
        
        // 闪烁效果
        hazard.alpha = 0.7 + Math.sin(hazard.age * 0.01) * 0.3;
    }
    
    // 更新虫洞行为
    updateWormholeBehavior(hazard, deltaTime) {
        // 检查传送
        if (player && player.active) {
            const dx = player.x - hazard.x;
            const dy = player.y - hazard.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < hazard.teleportRadius) {
                this.teleportThroughWormhole(hazard, player);
            }
        }
        
        // 旋转效果
        hazard.rotation += 0.02 * deltaTime / 16;
        hazard.scale = 0.8 + Math.sin(hazard.age * 0.003) * 0.2;
    }
    
    // 更新太阳耀斑行为
    updateSolarFlareBehavior(hazard, deltaTime) {
        // 波浪效果
        hazard.scale = 1.0 + Math.sin(hazard.age * 0.01) * 0.3;
        
        // 检查玩家碰撞
        if (player && player.active) {
            const dx = Math.abs(player.x - hazard.x);
            const dy = Math.abs(player.y - hazard.y);
            
            if (dx < hazard.size / 2 && dy < hazard.size / 4) {
                player.takeDamage(hazard.damage * deltaTime / 1000, hazard);
            }
        }
    }
    
    // 虫洞传送
    teleportThroughWormhole(wormhole, target) {
        const pair = this.wormholePairs.find(pair => 
            pair[0] === wormhole.id || pair[1] === wormhole.id
        );
        
        if (pair) {
            const otherId = pair[0] === wormhole.id ? pair[1] : pair[0];
            const otherWormhole = this.activeHazards.find(h => h.id === otherId);
            
            if (otherWormhole) {
                target.x = otherWormhole.x;
                target.y = otherWormhole.y;
                
                // 传送效果
                effectsManager.createExplosion(wormhole.x, wormhole.y, 1.5, 'teleport');
                effectsManager.createExplosion(otherWormhole.x, otherWormhole.y, 1.5, 'teleport');
                
                audioManager.playSound('powerup', 0.5, 0.8);
            }
        }
    }
    
    // 创建电弧
    createElectricArc(hazard) {
        const angle = Math.random() * Math.PI * 2;
        const distance = hazard.electricRadius * (0.5 + Math.random() * 0.5);
        
        const endX = hazard.x + Math.cos(angle) * distance;
        const endY = hazard.y + Math.sin(angle) * distance;
        
        // 创建闪电粒子
        for (let i = 0; i < 5; i++) {
            const t = i / 4;
            const x = hazard.x + (endX - hazard.x) * t;
            const y = hazard.y + (endY - hazard.y) * t;
            
            effectsManager.createParticle(x, y, {
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 0.2,
                size: 2,
                color: '#00ffff',
                glow: true,
                type: 'electric'
            });
        }
    }
    
    // 创建电击效果
    createElectricShock(hazard, target) {
        // 在危险和目标之间创建闪电
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = hazard.x + (target.x - hazard.x) * t;
            const y = hazard.y + (target.y - hazard.y) * t;
            
            effectsManager.createParticle(x, y, {
                vx: 0,
                vy: 0,
                life: 0.1,
                size: 3,
                color: '#ffffff',
                glow: true,
                type: 'shock'
            });
        }
        
        // 震动效果
        effectsManager.addScreenShake(5, 200);
    }
    
    // 创建危险粒子
    createHazardParticles(hazard) {
        let particleConfig = {};
        
        switch (hazard.type) {
            case 'meteor':
            case 'asteroid':
                particleConfig = {
                    vx: -hazard.vx * 0.5 + (Math.random() - 0.5) * 2,
                    vy: -hazard.vy * 0.5 + (Math.random() - 0.5) * 2,
                    life: 0.5,
                    size: 1 + Math.random() * 2,
                    color: '#ff4500',
                    glow: true
                };
                break;
                
            case 'blackhole':
                particleConfig = {
                    vx: (hazard.x - (hazard.x + (Math.random() - 0.5) * 100)) * 0.02,
                    vy: (hazard.y - (hazard.y + (Math.random() - 0.5) * 100)) * 0.02,
                    life: 2.0,
                    size: 1,
                    color: '#8a2be2',
                    glow: true
                };
                break;
                
            case 'energyfield':
                particleConfig = {
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 0.3,
                    size: 2,
                    color: '#00ffff',
                    glow: true
                };
                break;
        }
        
        if (Object.keys(particleConfig).length > 0) {
            effectsManager.createParticle(
                hazard.x + (Math.random() - 0.5) * hazard.size,
                hazard.y + (Math.random() - 0.5) * hazard.size,
                particleConfig
            );
        }
    }
    
    // 更新危险粒子
    updateHazardParticles(deltaTime) {
        // 这个由effectsManager处理，这里可以添加额外的粒子逻辑
    }
    
    // 检查危险边界
    checkHazardBounds(hazard) {
        const margin = hazard.size;
        
        // 对于某些类型，超出边界就销毁
        if (['meteor', 'asteroid', 'solarflare'].includes(hazard.type)) {
            if (hazard.x < -margin || hazard.x > 1200 + margin ||
                hazard.y < -margin || hazard.y > 800 + margin) {
                hazard.active = false;
            }
        }
        
        // 对于其他类型，在边界反弹
        if (['energyfield'].includes(hazard.type)) {
            if (hazard.x < margin || hazard.x > 1200 - margin) {
                hazard.vx = -hazard.vx;
                hazard.x = Math.max(margin, Math.min(1200 - margin, hazard.x));
            }
            if (hazard.y < margin || hazard.y > 800 - margin) {
                hazard.vy = -hazard.vy;
                hazard.y = Math.max(margin, Math.min(800 - margin, hazard.y));
            }
        }
    }
    
    // 危险受到伤害
    damageHazard(hazard, damage, source = null) {
        if (!this.hazardTypes[hazard.type].destroyable) {
            return 0;
        }
        
        const actualDamage = Math.min(damage, hazard.health);
        hazard.health -= actualDamage;
        
        // 创建撞击效果
        effectsManager.createLaserImpact(hazard.x, hazard.y, Math.random() * Math.PI * 2);
        
        if (hazard.health <= 0) {
            this.destroyHazard(hazard, source);
        }
        
        return actualDamage;
    }
    
    // 销毁危险
    destroyHazard(hazard, source = null) {
        hazard.active = false;
        
        // 创建销毁效果
        const explosionSize = hazard.size / 30;
        effectsManager.createExplosion(hazard.x, hazard.y, explosionSize, 'hazard');
        
        // 播放销毁音效
        audioManager.playSoundAtPosition('enemyDeath', hazard.x, hazard.y, 1200, 800, 0.3);
        
        // 特殊销毁行为
        this.handleSpecialDestruction(hazard, source);
        
        // 加分
        if (hazard.scoreValue && source === player) {
            if (window.gameManager) {
                gameManager.addScore(hazard.scoreValue);
            }
        }
    }
    
    // 处理特殊销毁行为
    handleSpecialDestruction(hazard, source) {
        switch (hazard.type) {
            case 'asteroid':
                if (this.hazardTypes[hazard.type].splitOnDestroy) {
                    // 分裂成小碎片
                    for (let i = 0; i < 3; i++) {
                        const angle = (Math.PI * 2 * i) / 3;
                        const distance = 30;
                        this.createHazard('meteor', 
                            hazard.x + Math.cos(angle) * distance,
                            hazard.y + Math.sin(angle) * distance);
                    }
                }
                break;
                
            case 'energyfield':
                // 电磁爆炸
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 * i) / 8;
                    this.createElectricArc({
                        x: hazard.x + Math.cos(angle) * 50,
                        y: hazard.y + Math.sin(angle) * 50,
                        electricRadius: 30
                    });
                }
                break;
        }
    }
    
    // 移除危险
    removeHazard(index) {
        const hazard = this.activeHazards[index];
        
        // 清理虫洞配对
        if (hazard.type === 'wormhole') {
            this.wormholePairs = this.wormholePairs.filter(pair => 
                pair[0] !== hazard.id && pair[1] !== hazard.id
            );
        }
        
        this.activeHazards.splice(index, 1);
    }
    
    // 更新环境事件
    updateEnvironmentalEvents(deltaTime) {
        Object.keys(this.environmentalEvents).forEach(eventName => {
            const event = this.environmentalEvents[eventName];
            if (event.active && event.duration > 0) {
                event.duration -= deltaTime;
                if (event.duration <= 0) {
                    this.deactivateEnvironmentalEvent(eventName);
                }
            }
        });
    }
    
    // 激活环境事件
    activateEnvironmentalEvent(eventName, duration = 10000) {
        const event = this.environmentalEvents[eventName];
        if (event) {
            event.active = true;
            event.duration = duration;
            
            // 特殊激活逻辑
            switch (eventName) {
                case 'meteorShower':
                    // 增加流星生成概率
                    this.hazardTypes.meteor.spawnChance *= 5;
                    break;
                    
                case 'gravitationalStorm':
                    // 增强所有引力效果
                    this.activeHazards.forEach(hazard => {
                        if (hazard.pullStrength) {
                            hazard.pullStrength *= event.pullMultiplier;
                        }
                    });
                    break;
            }
            
            if (window.uiManager) {
                uiManager.showNotification('环境事件！', this.getEventDescription(eventName), 'warning');
            }
        }
    }
    
    // 停用环境事件
    deactivateEnvironmentalEvent(eventName) {
        const event = this.environmentalEvents[eventName];
        if (event) {
            event.active = false;
            
            // 特殊停用逻辑
            switch (eventName) {
                case 'meteorShower':
                    // 恢复正常生成概率
                    this.hazardTypes.meteor.spawnChance /= 5;
                    break;
                    
                case 'gravitationalStorm':
                    // 恢复正常引力
                    this.activeHazards.forEach(hazard => {
                        if (hazard.pullStrength) {
                            hazard.pullStrength /= event.pullMultiplier;
                        }
                    });
                    break;
            }
        }
    }
    
    // 获取事件描述
    getEventDescription(eventName) {
        const descriptions = {
            meteorShower: '流星雨来袭！',
            gravitationalStorm: '引力风暴！',
            electricStorm: '电磁风暴！',
            solarActivity: '太阳活动异常！'
        };
        
        return descriptions[eventName] || '未知事件';
    }
    
    // 开始环境音效
    startAmbientSound(soundType) {
        if (!this.ambientSounds[soundType].playing) {
            this.ambientSounds[soundType].playing = true;
            // 这里可以添加循环音效逻辑
        }
    }
    
    // 停止环境音效
    stopAmbientSound(soundType) {
        if (this.ambientSounds[soundType].playing) {
            this.ambientSounds[soundType].playing = false;
            // 停止循环音效
        }
    }
    
    // 创建生成效果
    createSpawnEffect(hazard) {
        // 生成时的粒子爆发
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const speed = 2 + Math.random() * 3;
            
            effectsManager.createParticle(hazard.x, hazard.y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.8,
                size: 2,
                color: this.getHazardColor(hazard.type),
                glow: true,
                type: 'spawn'
            });
        }
        
        audioManager.playSoundAtPosition('warning', hazard.x, hazard.y, 1200, 800, 0.2);
    }
    
    // 获取危险颜色
    getHazardColor(type) {
        const colors = {
            meteor: '#ff4500',
            blackhole: '#8a2be2',
            energyfield: '#00ffff',
            asteroid: '#8b4513',
            wormhole: '#9400d3',
            solarflare: '#ffff00'
        };
        
        return colors[type] || '#ffffff';
    }
    
    // 渲染危险
    render(ctx) {
        for (const hazard of this.activeHazards) {
            if (!hazard.active) continue;
            
            this.renderHazard(ctx, hazard);
        }
    }
    
    // 渲染单个危险
    renderHazard(ctx, hazard) {
        ctx.save();
        
        // 设置透明度和缩放
        ctx.globalAlpha = hazard.alpha;
        ctx.translate(hazard.x, hazard.y);
        ctx.rotate(hazard.rotation);
        ctx.scale(hazard.scale, hazard.scale);
        
        // 发光效果
        if (hazard.glowIntensity > 0) {
            ctx.shadowColor = this.getHazardColor(hazard.type);
            ctx.shadowBlur = hazard.size * hazard.glowIntensity;
        }
        
        // 渲染精灵或基本形状
        if (hazard.sprite && hazard.sprite.complete) {
            ctx.drawImage(hazard.sprite, -hazard.size / 2, -hazard.size / 2, 
                         hazard.size, hazard.size);
        } else {
            // 基本形状渲染
            ctx.fillStyle = this.getHazardColor(hazard.type);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(0, 0, hazard.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        // 特殊效果渲染
        this.renderSpecialEffects(ctx, hazard);
        
        ctx.restore();
    }
    
    // 渲染特殊效果
    renderSpecialEffects(ctx, hazard) {
        switch (hazard.type) {
            case 'blackhole':
                // 吸积盘
                for (let i = 1; i <= 3; i++) {
                    ctx.strokeStyle = `rgba(138, 43, 226, ${0.3 / i})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, hazard.size / 2 + i * 15, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
                
            case 'energyfield':
                // 电弧效果
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 * i / 3) + hazard.age * 0.01;
                    const radius = hazard.electricRadius;
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, angle, angle + Math.PI / 3);
                    ctx.stroke();
                }
                break;
        }
    }
    
    // 获取危险统计
    getStats() {
        return {
            activeHazards: this.activeHazards.length,
            hazardsByType: this.activeHazards.reduce((acc, hazard) => {
                acc[hazard.type] = (acc[hazard.type] || 0) + 1;
                return acc;
            }, {}),
            environmentalEvents: { ...this.environmentalEvents },
            wormholePairs: this.wormholePairs.length
        };
    }
    
    // 清除所有危险
    clear() {
        this.activeHazards.forEach(hazard => {
            hazard.active = false;
        });
        this.activeHazards = [];
        this.wormholePairs = [];
        
        // 停用环境事件
        Object.keys(this.environmentalEvents).forEach(eventName => {
            this.deactivateEnvironmentalEvent(eventName);
        });
        
        // 停止环境音效
        Object.keys(this.ambientSounds).forEach(soundType => {
            this.stopAmbientSound(soundType);
        });
    }
    
    // 重置系统
    reset() {
        this.clear();
        this.spawnTimer = 0;
    }
}

// 创建全局环境危险系统实例
const environmentalHazardSystem = new EnvironmentalHazardSystem();
