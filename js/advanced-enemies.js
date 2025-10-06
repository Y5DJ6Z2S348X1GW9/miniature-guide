// 高级敌人系统模块 - advanced-enemies.js

class AdvancedEnemySystem {
    constructor() {
        // 高级敌人类型定义
        this.advancedEnemyTypes = {
            splitter: {
                name: '分裂虫',
                sprite: 'enemy_splitter.png',
                health: 25,
                speed: 2,
                damage: 15,
                scoreValue: 30,
                size: 45,
                splitCount: 3,
                splitType: 'basic',
                color: '#ff4500',
                glowColor: '#ffd700',
                behavior: 'aggressive',
                spawnWeight: 3
            },
            
            shielded: {
                name: '护盾兵',
                sprite: 'enemy_shielded.png',
                health: 40,
                speed: 1.5,
                damage: 20,
                scoreValue: 50,
                size: 50,
                shieldHealth: 30,
                shieldRegenRate: 2,
                shieldRegenDelay: 3000,
                color: '#4169e1',
                glowColor: '#87ceeb',
                behavior: 'defensive',
                spawnWeight: 2
            },
            
            stealth: {
                name: '幽灵战机',
                sprite: 'enemy_stealth.png',
                health: 15,
                speed: 3,
                damage: 12,
                scoreValue: 40,
                size: 40,
                stealthDuration: 2000,
                stealthCooldown: 4000,
                visibleAlpha: 0.3,
                invisibleAlpha: 0.1,
                color: '#ffffff',
                glowColor: '#00ffff',
                behavior: 'hit_and_run',
                spawnWeight: 2
            },
            
            swarm: {
                name: '蜂群无人机',
                sprite: 'enemy_swarm.png',
                health: 8,
                speed: 4,
                damage: 8,
                scoreValue: 15,
                size: 25,
                swarmSize: 5,
                formationRadius: 80,
                color: '#32cd32',
                glowColor: '#7fff00',
                behavior: 'swarm',
                spawnWeight: 4
            },
            
            regenerator: {
                name: '再生体',
                sprite: 'enemy_basic.png',
                health: 35,
                speed: 1.8,
                damage: 18,
                scoreValue: 35,
                size: 42,
                regenRate: 3,
                regenDelay: 2000,
                color: '#9400d3',
                glowColor: '#ba55d3',
                behavior: 'tanky',
                spawnWeight: 2
            },
            
            kamikaze: {
                name: '自爆虫',
                sprite: 'enemy_basic.png',
                health: 12,
                speed: 5,
                damage: 35,
                scoreValue: 25,
                size: 35,
                explosionRadius: 60,
                explosionDamage: 40,
                color: '#ff1493',
                glowColor: '#ff69b4',
                behavior: 'kamikaze',
                spawnWeight: 3
            },
            
            phase: {
                name: '相位舰',
                sprite: 'enemy_basic.png',
                health: 28,
                speed: 2.2,
                damage: 16,
                scoreValue: 45,
                size: 48,
                phaseDuration: 1500,
                phaseCooldown: 5000,
                color: '#8a2be2',
                glowColor: '#9370db',
                behavior: 'phase',
                spawnWeight: 1
            },
            
            hunter: {
                name: '追猎者',
                sprite: 'enemy_basic.png',
                health: 22,
                speed: 2.8,
                damage: 14,
                scoreValue: 38,
                size: 38,
                trackingStrength: 0.8,
                trackingRange: 200,
                color: '#dc143c',
                glowColor: '#ff6347',
                behavior: 'hunter',
                spawnWeight: 3
            }
        };
        
        // 敌人状态效果
        this.statusEffects = {
            burning: { damage: 2, duration: 3000, color: '#ff4500' },
            frozen: { speedReduction: 0.5, duration: 2000, color: '#87ceeb' },
            shocked: { stunChance: 0.3, duration: 1500, color: '#ffff00' },
            poisoned: { damage: 1, duration: 5000, color: '#9aff9a' },
            weakened: { damageReduction: 0.3, duration: 4000, color: '#dda0dd' }
        };
        
        // 敌人行为模式
        this.behaviorPatterns = {
            aggressive: this.aggressiveBehavior.bind(this),
            defensive: this.defensiveBehavior.bind(this),
            hit_and_run: this.hitAndRunBehavior.bind(this),
            swarm: this.swarmBehavior.bind(this),
            tanky: this.tankyBehavior.bind(this),
            kamikaze: this.kamikazeBehavior.bind(this),
            phase: this.phaseBehavior.bind(this),
            hunter: this.hunterBehavior.bind(this)
        };
        
        // 特殊效果系统
        this.specialEffects = [];
        
        // 敌人群组管理
        this.enemyGroups = new Map();
        this.nextGroupId = 1;
    }
    
    // 创建高级敌人
    createAdvancedEnemy(type, x, y, customConfig = {}) {
        if (!this.advancedEnemyTypes[type]) {
            console.warn('未知高级敌人类型:', type);
            return null;
        }
        
        const config = this.advancedEnemyTypes[type];
        const enemy = {
            id: Date.now() + Math.random(),
            type: type,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            
            // 基础属性
            health: config.health,
            maxHealth: config.health,
            speed: config.speed,
            damage: config.damage,
            scoreValue: config.scoreValue,
            size: config.size,
            radius: config.size / 2,
            
            // 视觉属性
            rotation: 0,
            alpha: 1.0,
            scale: 1.0,
            color: config.color,
            glowColor: config.glowColor,
            sprite: config.sprite,
            
            // 状态
            active: true,
            invulnerable: false,
            invulnerabilityTime: 0,
            
            // 行为相关
            behavior: config.behavior,
            behaviorState: {},
            targetX: x,
            targetY: y,
            
            // 特殊属性（根据类型）
            ...this.getSpecialProperties(type, config),
            
            // 状态效果
            statusEffects: new Map(),
            
            // 碰撞
            shape: 'circle',
            layer: collisionManager.collisionLayers.ENEMY,
            
            // 时间追踪
            age: 0,
            lastUpdate: Date.now(),
            
            // 自定义配置
            ...customConfig
        };
        
        // 初始化特殊行为
        this.initializeSpecialBehavior(enemy);
        
        return enemy;
    }
    
    // 获取特殊属性
    getSpecialProperties(type, config) {
        const properties = {};
        
        switch (type) {
            case 'splitter':
                properties.splitCount = config.splitCount;
                properties.splitType = config.splitType;
                properties.hasSplit = false;
                break;
                
            case 'shielded':
                properties.shieldHealth = config.shieldHealth;
                properties.maxShieldHealth = config.shieldHealth;
                properties.shieldRegenRate = config.shieldRegenRate;
                properties.shieldRegenDelay = config.shieldRegenDelay;
                properties.shieldRegenTimer = 0;
                properties.shieldActive = true;
                break;
                
            case 'stealth':
                properties.stealthDuration = config.stealthDuration;
                properties.stealthCooldown = config.stealthCooldown;
                properties.stealthTimer = 0;
                properties.stealthCooldownTimer = config.stealthCooldown;
                properties.isStealthed = false;
                properties.visibleAlpha = config.visibleAlpha;
                properties.invisibleAlpha = config.invisibleAlpha;
                break;
                
            case 'swarm':
                properties.swarmId = null;
                properties.formationAngle = Math.random() * Math.PI * 2;
                properties.formationRadius = config.formationRadius;
                break;
                
            case 'regenerator':
                properties.regenRate = config.regenRate;
                properties.regenDelay = config.regenDelay;
                properties.regenTimer = 0;
                break;
                
            case 'kamikaze':
                properties.explosionRadius = config.explosionRadius;
                properties.explosionDamage = config.explosionDamage;
                properties.isCharging = false;
                properties.chargeStarted = false;
                break;
                
            case 'phase':
                properties.phaseDuration = config.phaseDuration;
                properties.phaseCooldown = config.phaseCooldown;
                properties.phaseTimer = 0;
                properties.phaseCooldownTimer = config.phaseCooldown;
                properties.isPhased = false;
                break;
                
            case 'hunter':
                properties.trackingStrength = config.trackingStrength;
                properties.trackingRange = config.trackingRange;
                properties.targetLocked = false;
                break;
        }
        
        return properties;
    }
    
    // 初始化特殊行为
    initializeSpecialBehavior(enemy) {
        switch (enemy.type) {
            case 'swarm':
                // 创建蜂群
                if (!enemy.swarmId) {
                    this.createSwarmGroup(enemy);
                }
                break;
                
            case 'stealth':
                // 开始隐身循环
                enemy.stealthCooldownTimer = 0;
                break;
        }
    }
    
    // 创建蜂群组
    createSwarmGroup(leaderEnemy) {
        const groupId = this.nextGroupId++;
        leaderEnemy.swarmId = groupId;
        
        const swarmMembers = [leaderEnemy];
        const config = this.advancedEnemyTypes.swarm;
        
        // 创建蜂群成员
        for (let i = 1; i < config.swarmSize; i++) {
            const angle = (Math.PI * 2 * i) / config.swarmSize;
            const offsetX = Math.cos(angle) * config.formationRadius;
            const offsetY = Math.sin(angle) * config.formationRadius;
            
            const member = this.createAdvancedEnemy('swarm', 
                leaderEnemy.x + offsetX, 
                leaderEnemy.y + offsetY, {
                    swarmId: groupId,
                    formationAngle: angle
                });
            
            if (member) {
                swarmMembers.push(member);
            }
        }
        
        this.enemyGroups.set(groupId, {
            type: 'swarm',
            leader: leaderEnemy,
            members: swarmMembers,
            centerX: leaderEnemy.x,
            centerY: leaderEnemy.y
        });
    }
    
    // 主更新方法 - 被主游戏循环调用
    update(deltaTime) {
        // 更新所有注册的高级敌人
        if (typeof enemyManager !== 'undefined' && enemyManager.enemies) {
            enemyManager.enemies.forEach(enemy => {
                if (enemy.isAdvanced && enemy.active) {
                    this.updateAdvancedEnemy(enemy, deltaTime, player);
                }
            });
        }
        
        // 更新敌人组
        this.updateEnemyGroups(deltaTime);
        
        // 更新特殊效果
        this.updateSpecialEffects(deltaTime);
    }
    
    // 更新高级敌人
    updateAdvancedEnemy(enemy, deltaTime, player) {
        if (!enemy.active) return;
        
        enemy.age += deltaTime;
        
        // 更新状态效果
        this.updateStatusEffects(enemy, deltaTime);
        
        // 更新特殊属性
        this.updateSpecialProperties(enemy, deltaTime);
        
        // 应用行为模式
        if (this.behaviorPatterns[enemy.behavior]) {
            this.behaviorPatterns[enemy.behavior](enemy, deltaTime, player);
        }
        
        // 更新位置
        enemy.x += enemy.vx * deltaTime / 16;
        enemy.y += enemy.vy * deltaTime / 16;
        
        // 边界检查
        this.checkEnemyBounds(enemy);
        
        // 创建特殊粒子效果
        this.createEnemyParticles(enemy);
    }
    
    // 更新特殊属性
    updateSpecialProperties(enemy, deltaTime) {
        switch (enemy.type) {
            case 'shielded':
                this.updateShieldedEnemy(enemy, deltaTime);
                break;
                
            case 'stealth':
                this.updateStealthEnemy(enemy, deltaTime);
                break;
                
            case 'regenerator':
                this.updateRegeneratorEnemy(enemy, deltaTime);
                break;
                
            case 'phase':
                this.updatePhaseEnemy(enemy, deltaTime);
                break;
        }
    }
    
    // 更新护盾敌人
    updateShieldedEnemy(enemy, deltaTime) {
        if (enemy.shieldHealth <= 0 && enemy.shieldActive) {
            enemy.shieldActive = false;
            enemy.shieldRegenTimer = enemy.shieldRegenDelay;
        }
        
        if (!enemy.shieldActive) {
            enemy.shieldRegenTimer -= deltaTime;
            if (enemy.shieldRegenTimer <= 0) {
                enemy.shieldHealth += enemy.shieldRegenRate * deltaTime / 1000;
                if (enemy.shieldHealth >= enemy.maxShieldHealth) {
                    enemy.shieldHealth = enemy.maxShieldHealth;
                    enemy.shieldActive = true;
                }
            }
        }
    }
    
    // 更新隐形敌人
    updateStealthEnemy(enemy, deltaTime) {
        if (enemy.isStealthed) {
            enemy.stealthTimer -= deltaTime;
            enemy.alpha = enemy.invisibleAlpha;
            
            if (enemy.stealthTimer <= 0) {
                enemy.isStealthed = false;
                enemy.stealthCooldownTimer = enemy.stealthCooldown;
                enemy.alpha = enemy.visibleAlpha;
            }
        } else {
            enemy.stealthCooldownTimer -= deltaTime;
            enemy.alpha = enemy.visibleAlpha;
            
            if (enemy.stealthCooldownTimer <= 0) {
                enemy.isStealthed = true;
                enemy.stealthTimer = enemy.stealthDuration;
            }
        }
    }
    
    // 更新再生敌人
    updateRegeneratorEnemy(enemy, deltaTime) {
        if (enemy.health < enemy.maxHealth) {
            enemy.regenTimer -= deltaTime;
            if (enemy.regenTimer <= 0) {
                enemy.health += enemy.regenRate * deltaTime / 1000;
                enemy.health = Math.min(enemy.health, enemy.maxHealth);
                
                // 再生粒子效果
                if (Math.random() < 0.1) {
                    effectsManager.createParticle(
                        enemy.x + (Math.random() - 0.5) * enemy.size,
                        enemy.y + (Math.random() - 0.5) * enemy.size,
                        {
                            vx: 0,
                            vy: -1,
                            life: 1.0,
                            size: 2,
                            color: '#9aff9a',
                            glow: true,
                            type: 'regen'
                        }
                    );
                }
            }
        }
    }
    
    // 更新相位敌人
    updatePhaseEnemy(enemy, deltaTime) {
        if (enemy.isPhased) {
            enemy.phaseTimer -= deltaTime;
            enemy.alpha = 0.3;
            enemy.invulnerable = true;
            
            if (enemy.phaseTimer <= 0) {
                enemy.isPhased = false;
                enemy.phaseCooldownTimer = enemy.phaseCooldown;
                enemy.alpha = 1.0;
                enemy.invulnerable = false;
            }
        } else {
            enemy.phaseCooldownTimer -= deltaTime;
            
            if (enemy.phaseCooldownTimer <= 0 && enemy.health < enemy.maxHealth * 0.5) {
                enemy.isPhased = true;
                enemy.phaseTimer = enemy.phaseDuration;
                
                // 相位效果
                effectsManager.createExplosion(enemy.x, enemy.y, 1.5, 'phase');
            }
        }
    }
    
    // 行为模式实现
    aggressiveBehavior(enemy, deltaTime, player) {
        if (!player || !player.active) return;
        
        // 直接冲向玩家
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            enemy.vx = (dx / distance) * enemy.speed;
            enemy.vy = (dy / distance) * enemy.speed;
        }
        
        enemy.rotation = Math.atan2(dy, dx);
    }
    
    defensiveBehavior(enemy, deltaTime, player) {
        if (!player || !player.active) return;
        
        // 保持距离，环绕玩家
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const optimalDistance = 150;
        
        if (distance < optimalDistance) {
            // 后退
            enemy.vx = (-dx / distance) * enemy.speed;
            enemy.vy = (-dy / distance) * enemy.speed;
        } else if (distance > optimalDistance + 50) {
            // 前进
            enemy.vx = (dx / distance) * enemy.speed * 0.5;
            enemy.vy = (dy / distance) * enemy.speed * 0.5;
        } else {
            // 环绕
            const perpX = -dy / distance;
            const perpY = dx / distance;
            enemy.vx = perpX * enemy.speed;
            enemy.vy = perpY * enemy.speed;
        }
    }
    
    hitAndRunBehavior(enemy, deltaTime, player) {
        if (!player || !player.active) return;
        
        if (!enemy.behaviorState.phase) {
            enemy.behaviorState.phase = 'approach';
            enemy.behaviorState.timer = 0;
        }
        
        enemy.behaviorState.timer += deltaTime;
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        switch (enemy.behaviorState.phase) {
            case 'approach':
                enemy.vx = (dx / distance) * enemy.speed;
                enemy.vy = (dy / distance) * enemy.speed;
                
                if (distance < 100 || enemy.behaviorState.timer > 2000) {
                    enemy.behaviorState.phase = 'retreat';
                    enemy.behaviorState.timer = 0;
                }
                break;
                
            case 'retreat':
                enemy.vx = (-dx / distance) * enemy.speed;
                enemy.vy = (-dy / distance) * enemy.speed;
                
                if (distance > 200 || enemy.behaviorState.timer > 1500) {
                    enemy.behaviorState.phase = 'approach';
                    enemy.behaviorState.timer = 0;
                }
                break;
        }
    }
    
    swarmBehavior(enemy, deltaTime, player) {
        const group = this.enemyGroups.get(enemy.swarmId);
        if (!group) return;
        
        // 更新群组中心
        if (player && player.active) {
            const dx = player.x - group.centerX;
            const dy = player.y - group.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                group.centerX += (dx / distance) * enemy.speed * 0.5 * deltaTime / 16;
                group.centerY += (dy / distance) * enemy.speed * 0.5 * deltaTime / 16;
            }
        }
        
        // 保持编队
        const targetX = group.centerX + Math.cos(enemy.formationAngle) * enemy.formationRadius;
        const targetY = group.centerY + Math.sin(enemy.formationAngle) * enemy.formationRadius;
        
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;
        
        enemy.vx = dx * 0.05;
        enemy.vy = dy * 0.05;
        
        // 编队旋转
        enemy.formationAngle += 0.02 * deltaTime / 16;
    }
    
    tankyBehavior(enemy, deltaTime, player) {
        // 慢速但坚定地前进
        this.aggressiveBehavior(enemy, deltaTime, player);
        enemy.vx *= 0.7;
        enemy.vy *= 0.7;
    }
    
    kamikazeBehavior(enemy, deltaTime, player) {
        if (!player || !player.active) return;
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 80 && !enemy.chargeStarted) {
            enemy.isCharging = true;
            enemy.chargeStarted = true;
            
            // 闪烁效果
            enemy.behaviorState.flashTimer = 0;
            enemy.behaviorState.explosionTimer = 1000; // 1秒后爆炸
        }
        
        if (enemy.isCharging) {
            enemy.behaviorState.flashTimer += deltaTime;
            enemy.behaviorState.explosionTimer -= deltaTime;
            
            // 闪烁效果
            enemy.alpha = enemy.behaviorState.flashTimer % 200 < 100 ? 1.0 : 0.3;
            
            // 加速冲向玩家
            enemy.vx = (dx / distance) * enemy.speed * 2;
            enemy.vy = (dy / distance) * enemy.speed * 2;
            
            if (enemy.behaviorState.explosionTimer <= 0 || distance < 30) {
                this.explodeKamikazeEnemy(enemy);
            }
        } else {
            // 正常追踪
            enemy.vx = (dx / distance) * enemy.speed;
            enemy.vy = (dy / distance) * enemy.speed;
        }
    }
    
    phaseBehavior(enemy, deltaTime, player) {
        // 基本攻击行为，但在血量低时会相位
        this.aggressiveBehavior(enemy, deltaTime, player);
    }
    
    hunterBehavior(enemy, deltaTime, player) {
        if (!player || !player.active) return;
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= enemy.trackingRange) {
            enemy.targetLocked = true;
        }
        
        if (enemy.targetLocked) {
            // 智能追踪，预测玩家位置
            const predictX = player.x + player.vx * 0.5;
            const predictY = player.y + player.vy * 0.5;
            
            const pdx = predictX - enemy.x;
            const pdy = predictY - enemy.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            
            if (pdist > 0) {
                enemy.vx = (pdx / pdist) * enemy.speed * enemy.trackingStrength;
                enemy.vy = (pdy / pdist) * enemy.speed * enemy.trackingStrength;
            }
        } else {
            // 巡逻行为
            if (!enemy.behaviorState.patrolTarget) {
                enemy.behaviorState.patrolTarget = {
                    x: Math.random() * 1200,
                    y: Math.random() * 800
                };
            }
            
            const ptx = enemy.behaviorState.patrolTarget.x - enemy.x;
            const pty = enemy.behaviorState.patrolTarget.y - enemy.y;
            const ptdist = Math.sqrt(ptx * ptx + pty * pty);
            
            if (ptdist < 50) {
                enemy.behaviorState.patrolTarget = {
                    x: Math.random() * 1200,
                    y: Math.random() * 800
                };
            } else {
                enemy.vx = (ptx / ptdist) * enemy.speed * 0.5;
                enemy.vy = (pty / ptdist) * enemy.speed * 0.5;
            }
        }
    }
    
    // 自爆敌人爆炸
    explodeKamikazeEnemy(enemy) {
        // 创建爆炸效果
        effectsManager.createExplosion(enemy.x, enemy.y, 2.5, 'enemy');
        
        // 对玩家造成伤害
        if (player && player.active) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < enemy.explosionRadius) {
                const damageFactor = 1 - (distance / enemy.explosionRadius);
                const damage = enemy.explosionDamage * damageFactor;
                player.takeDamage(damage, enemy);
            }
        }
        
        // 对其他敌人造成伤害
        const nearbyEnemies = enemyManager.enemies.filter(e => 
            e !== enemy && e.active && 
            Math.sqrt((e.x - enemy.x) ** 2 + (e.y - enemy.y) ** 2) < enemy.explosionRadius
        );
        
        nearbyEnemies.forEach(e => {
            const dx = e.x - enemy.x;
            const dy = e.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const damageFactor = 1 - (distance / enemy.explosionRadius);
            const damage = enemy.explosionDamage * 0.5 * damageFactor;
            
            this.damageAdvancedEnemy(e, damage, enemy);
        });
        
        // 屏幕震动
        effectsManager.addScreenShake(15, 800);
        
        // 音效
        audioManager.playSoundAtPosition('explosion', enemy.x, enemy.y, 1200, 800, 0.6);
        
        // 销毁敌人
        enemy.active = false;
    }
    
    // 分裂敌人
    splitEnemy(enemy) {
        if (enemy.hasSplit) return;
        
        enemy.hasSplit = true;
        const splitConfig = this.advancedEnemyTypes[enemy.splitType] || this.advancedEnemyTypes.basic;
        
        for (let i = 0; i < enemy.splitCount; i++) {
            const angle = (Math.PI * 2 * i) / enemy.splitCount;
            const distance = 40;
            const splitX = enemy.x + Math.cos(angle) * distance;
            const splitY = enemy.y + Math.sin(angle) * distance;
            
            // 创建分裂出的敌人
            const splitEnemy = {
                ...splitConfig,
                x: splitX,
                y: splitY,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                health: splitConfig.health * 0.6,
                maxHealth: splitConfig.health * 0.6,
                size: splitConfig.size * 0.7
            };
            
            enemyManager.enemies.push(splitEnemy);
        }
        
        // 分裂效果
        effectsManager.createExplosion(enemy.x, enemy.y, 1.8, 'split');
        audioManager.playSoundAtPosition('enemyDeath', enemy.x, enemy.y, 1200, 800, 0.4);
    }
    
    // 高级敌人受伤处理
    damageAdvancedEnemy(enemy, damage, source) {
        if (enemy.invulnerable) return 0;
        
        let actualDamage = damage;
        
        // 护盾处理
        if (enemy.type === 'shielded' && enemy.shieldActive && enemy.shieldHealth > 0) {
            const shieldDamage = Math.min(actualDamage, enemy.shieldHealth);
            enemy.shieldHealth -= shieldDamage;
            actualDamage -= shieldDamage;
            
            // 护盾撞击效果
            effectsManager.createLaserImpact(enemy.x, enemy.y, Math.random() * Math.PI * 2, '#87ceeb');
            
            if (enemy.shieldHealth <= 0) {
                enemy.shieldActive = false;
                enemy.shieldRegenTimer = enemy.shieldRegenDelay;
                effectsManager.createExplosion(enemy.x, enemy.y, 1.2, 'shield_break');
            }
        }
        
        // 对本体造成伤害
        if (actualDamage > 0) {
            enemy.health -= actualDamage;
            
            // 重置再生计时器
            if (enemy.type === 'regenerator') {
                enemy.regenTimer = enemy.regenDelay;
            }
            
            // 血量低触发相位
            if (enemy.type === 'phase' && enemy.health < enemy.maxHealth * 0.3 && !enemy.isPhased && enemy.phaseCooldownTimer <= 0) {
                enemy.isPhased = true;
                enemy.phaseTimer = enemy.phaseDuration;
                effectsManager.createExplosion(enemy.x, enemy.y, 1.5, 'phase');
            }
        }
        
        // 死亡处理
        if (enemy.health <= 0) {
            this.handleAdvancedEnemyDeath(enemy, source);
        }
        
        return damage;
    }
    
    // 高级敌人死亡处理
    handleAdvancedEnemyDeath(enemy, source) {
        // 分裂敌人特殊处理
        if (enemy.type === 'splitter' && !enemy.hasSplit) {
            this.splitEnemy(enemy);
        }
        
        // 蜂群死亡处理
        if (enemy.type === 'swarm' && enemy.swarmId) {
            const group = this.enemyGroups.get(enemy.swarmId);
            if (group) {
                group.members = group.members.filter(m => m !== enemy);
                if (group.members.length === 0) {
                    this.enemyGroups.delete(enemy.swarmId);
                }
            }
        }
        
        // 创建死亡效果
        const explosionType = this.getDeathExplosionType(enemy.type);
        effectsManager.createExplosion(enemy.x, enemy.y, enemy.size / 25, explosionType);
        
        // 掉落特殊道具
        this.dropSpecialLoot(enemy);
        
        enemy.active = false;
    }
    
    // 获取死亡爆炸类型
    getDeathExplosionType(enemyType) {
        const explosionTypes = {
            splitter: 'split',
            shielded: 'shield',
            stealth: 'stealth',
            swarm: 'swarm',
            regenerator: 'regen',
            kamikaze: 'kamikaze',
            phase: 'phase',
            hunter: 'hunter'
        };
        
        return explosionTypes[enemyType] || 'enemy';
    }
    
    // 掉落特殊战利品
    dropSpecialLoot(enemy) {
        const dropChance = 0.15 + (comboSystem ? comboSystem.currentCombo * 0.005 : 0);
        
        if (Math.random() < dropChance) {
            const lootTypes = ['weapon_upgrade', 'shield_boost', 'time_crystal', 'experience_gem'];
            const randomLoot = lootTypes[Math.floor(Math.random() * lootTypes.length)];
            
            // 这里可以调用道具生成系统
            if (window.gameManager) {
                gameManager.spawnPowerup(enemy.x, enemy.y, randomLoot);
            }
        }
    }
    
    // 更新状态效果
    updateStatusEffects(enemy, deltaTime) {
        enemy.statusEffects.forEach((effect, effectType) => {
            effect.duration -= deltaTime;
            
            // 应用效果
            switch (effectType) {
                case 'burning':
                    if (Math.random() < 0.1) {
                        enemy.health -= effect.damage * deltaTime / 1000;
                        this.createStatusParticle(enemy, '#ff4500');
                    }
                    break;
                    
                case 'poisoned':
                    enemy.health -= effect.damage * deltaTime / 1000;
                    if (Math.random() < 0.05) {
                        this.createStatusParticle(enemy, '#9aff9a');
                    }
                    break;
                    
                case 'shocked':
                    if (Math.random() < effect.stunChance * deltaTime / 1000) {
                        enemy.vx *= 0.1;
                        enemy.vy *= 0.1;
                        this.createStatusParticle(enemy, '#ffff00');
                    }
                    break;
            }
            
            // 移除过期效果
            if (effect.duration <= 0) {
                enemy.statusEffects.delete(effectType);
            }
        });
    }
    
    // 创建状态粒子
    createStatusParticle(enemy, color) {
        effectsManager.createParticle(
            enemy.x + (Math.random() - 0.5) * enemy.size,
            enemy.y + (Math.random() - 0.5) * enemy.size,
            {
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 1,
                life: 0.8,
                size: 1 + Math.random(),
                color: color,
                glow: true,
                type: 'status'
            }
        );
    }
    
    // 创建敌人粒子效果
    createEnemyParticles(enemy) {
        if (Math.random() > 0.05) return;
        
        let particleConfig = {
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.5,
            size: 1,
            color: enemy.color,
            glow: true
        };
        
        // 特殊粒子效果
        switch (enemy.type) {
            case 'stealth':
                if (enemy.isStealthed) {
                    particleConfig.alpha = 0.3;
                    particleConfig.color = '#00ffff';
                }
                break;
                
            case 'kamikaze':
                if (enemy.isCharging) {
                    particleConfig.color = '#ff0000';
                    particleConfig.size = 2;
                    particleConfig.life = 0.3;
                }
                break;
                
            case 'phase':
                if (enemy.isPhased) {
                    particleConfig.color = '#8a2be2';
                    particleConfig.alpha = 0.5;
                }
                break;
        }
        
        effectsManager.createParticle(
            enemy.x + (Math.random() - 0.5) * enemy.size,
            enemy.y + (Math.random() - 0.5) * enemy.size,
            particleConfig
        );
    }
    
    // 检查敌人边界
    checkEnemyBounds(enemy) {
        const margin = enemy.size;
        
        if (enemy.x < -margin || enemy.x > 1200 + margin ||
            enemy.y < -margin || enemy.y > 800 + margin) {
            
            // 蜂群成员不会离开屏幕
            if (enemy.type === 'swarm') {
                enemy.x = Math.max(margin, Math.min(1200 - margin, enemy.x));
                enemy.y = Math.max(margin, Math.min(800 - margin, enemy.y));
            } else {
                enemy.active = false;
            }
        }
    }
    
    // 渲染高级敌人
    renderAdvancedEnemy(ctx, enemy) {
        if (!enemy.active) return;
        
        ctx.save();
        
        // 设置透明度
        ctx.globalAlpha = enemy.alpha;
        
        // 移动到敌人位置
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);
        ctx.scale(enemy.scale, enemy.scale);
        
        // 发光效果
        if (enemy.glowColor) {
            ctx.shadowColor = enemy.glowColor;
            ctx.shadowBlur = enemy.size * 0.3;
        }
        
        // 渲染敌人主体
        this.renderEnemyBody(ctx, enemy);
        
        // 渲染特殊效果
        this.renderSpecialEffects(ctx, enemy);
        
        ctx.restore();
        
        // 渲染护盾（在transform外）
        if (enemy.type === 'shielded' && enemy.shieldActive) {
            this.renderShield(ctx, enemy);
        }
        
        // 渲染状态效果
        this.renderStatusEffects(ctx, enemy);
    }
    
    // 渲染敌人主体
    renderEnemyBody(ctx, enemy) {
        // 基本形状渲染
        ctx.fillStyle = enemy.color;
        ctx.strokeStyle = enemy.glowColor || '#ffffff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 类型特定装饰
        switch (enemy.type) {
            case 'splitter':
                // 晶体纹理
                for (let i = 0; i < 6; i++) {
                    const angle = i * Math.PI / 3;
                    const x1 = Math.cos(angle) * enemy.size * 0.3;
                    const y1 = Math.sin(angle) * enemy.size * 0.3;
                    const x2 = Math.cos(angle) * enemy.size * 0.1;
                    const y2 = Math.sin(angle) * enemy.size * 0.1;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
                break;
                
            case 'hunter':
                // 瞄准器
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-enemy.size * 0.4, 0);
                ctx.lineTo(enemy.size * 0.4, 0);
                ctx.moveTo(0, -enemy.size * 0.4);
                ctx.lineTo(0, enemy.size * 0.4);
                ctx.stroke();
                break;
        }
    }
    
    // 渲染特殊效果
    renderSpecialEffects(ctx, enemy) {
        switch (enemy.type) {
            case 'kamikaze':
                if (enemy.isCharging) {
                    // 危险警告圈
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(0, 0, enemy.explosionRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                break;
                
            case 'phase':
                if (enemy.isPhased) {
                    // 相位波纹
                    for (let i = 1; i <= 3; i++) {
                        ctx.strokeStyle = `rgba(138, 43, 226, ${0.3 / i})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(0, 0, enemy.size * 0.5 + i * 10, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
                break;
        }
    }
    
    // 渲染护盾
    renderShield(ctx, enemy) {
        ctx.save();
        
        const shieldAlpha = enemy.shieldHealth / enemy.maxShieldHealth;
        ctx.globalAlpha = shieldAlpha * 0.7;
        
        // 护盾环
        for (let i = 0; i < 3; i++) {
            const radius = enemy.size * 0.6 + i * 8;
            const alpha = (3 - i) / 3 * shieldAlpha;
            
            ctx.strokeStyle = `rgba(135, 206, 235, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // 渲染状态效果
    renderStatusEffects(ctx, enemy) {
        if (enemy.statusEffects.size === 0) return;
        
        ctx.save();
        
        let effectIndex = 0;
        enemy.statusEffects.forEach((effect, effectType) => {
            const x = enemy.x + (effectIndex - enemy.statusEffects.size / 2) * 15;
            const y = enemy.y - enemy.size * 0.6 - 10;
            
            ctx.fillStyle = this.statusEffects[effectType].color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            effectIndex++;
        });
        
        ctx.restore();
    }
    
    // 更新敌人组
    updateEnemyGroups(deltaTime) {
        this.enemyGroups.forEach((group, groupId) => {
            // 清理已死亡的成员
            group.members = group.members.filter(member => member.active);
            
            // 如果组为空，删除组
            if (group.members.length === 0) {
                this.enemyGroups.delete(groupId);
                return;
            }
            
            // 更新组行为
            if (group.type === 'swarm') {
                this.updateSwarmBehavior(group, deltaTime);
            }
        });
    }
    
    // 更新蜂群行为
    updateSwarmBehavior(group, deltaTime) {
        if (group.members.length === 0) return;
        
        // 计算重心
        const centerX = group.members.reduce((sum, member) => sum + member.x, 0) / group.members.length;
        const centerY = group.members.reduce((sum, member) => sum + member.y, 0) / group.members.length;
        
        // 更新组中心
        group.centerX = centerX;
        group.centerY = centerY;
        
        // 蜂群聚拢行为
        group.members.forEach(member => {
            if (member.type === 'swarm') {
                // 向组中心靠拢的力
                const dx = centerX - member.x;
                const dy = centerY - member.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > group.cohesionDistance || 100) {
                    const force = 0.02;
                    member.vx += (dx / distance) * force;
                    member.vy += (dy / distance) * force;
                }
            }
        });
    }
    
    // 更新特殊效果
    updateSpecialEffects(deltaTime) {
        // 这里可以添加全局特殊效果的更新逻辑
        // 比如全局环境效果、区域伤害等
    }
    
    // 获取统计信息
    getStats() {
        return {
            activeGroups: this.enemyGroups.size,
            groupTypes: Array.from(this.enemyGroups.values()).reduce((acc, group) => {
                acc[group.type] = (acc[group.type] || 0) + 1;
                return acc;
            }, {}),
            specialEffectsCount: this.specialEffects ? this.specialEffects.length : 0
        };
    }
    
    // 清理系统
    cleanup() {
        this.enemyGroups.clear();
        this.specialEffects = [];
    }
}

// 创建全局高级敌人系统实例
const advancedEnemySystem = new AdvancedEnemySystem();
