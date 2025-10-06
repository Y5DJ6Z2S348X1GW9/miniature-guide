// 史诗级Boss战斗系统模块 - boss-system.js

class EpicBossSystem {
    constructor() {
        // Boss定义
        this.bossTypes = {
            fortress: {
                name: '机械要塞',
                sprite: 'boss_fortress.png',
                health: 800,
                size: 120,
                speed: 0.8,
                damage: 25,
                scoreValue: 1000,
                phases: 3,
                color: '#2f4f4f',
                glowColor: '#696969',
                music: 'boss_theme_1',
                abilities: ['turret_barrage', 'missile_swarm', 'shield_burst', 'repair_drones'],
                weakPoints: [
                    { x: -30, y: -35, size: 15, health: 100 },
                    { x: 30, y: -35, size: 15, health: 100 },
                    { x: 0, y: -20, size: 20, health: 150 }
                ]
            },
            
            organic: {
                name: '有机体母舰',
                sprite: 'boss_organic.png',
                health: 1200,
                size: 100,
                speed: 1.2,
                damage: 20,
                scoreValue: 1500,
                phases: 4,
                color: '#9400d3',
                glowColor: '#ba55d3',
                music: 'boss_theme_2',
                abilities: ['tentacle_strike', 'spawn_minions', 'acid_spray', 'regeneration', 'berserk'],
                weakPoints: [
                    { x: 0, y: 0, size: 25, health: 200, isCore: true }
                ]
            },
            
            crystalline: {
                name: '水晶守护者',
                sprite: 'boss_fortress.png',
                health: 600,
                size: 90,
                speed: 1.5,
                damage: 30,
                scoreValue: 1200,
                phases: 3,
                color: '#4169e1',
                glowColor: '#87ceeb',
                music: 'boss_theme_3',
                abilities: ['crystal_beam', 'shard_storm', 'teleport', 'crystal_prison'],
                weakPoints: [
                    { x: -25, y: -25, size: 12, health: 80 },
                    { x: 25, y: -25, size: 12, health: 80 },
                    { x: -25, y: 25, size: 12, health: 80 },
                    { x: 25, y: 25, size: 12, health: 80 }
                ]
            },
            
            shadow: {
                name: '暗影领主',
                sprite: 'boss_organic.png',
                health: 1000,
                size: 110,
                speed: 2.0,
                damage: 35,
                scoreValue: 2000,
                phases: 5,
                color: '#483d8b',
                glowColor: '#9370db',
                music: 'boss_theme_4',
                abilities: ['shadow_clone', 'void_blast', 'darkness', 'soul_drain', 'final_form'],
                weakPoints: [
                    { x: 0, y: -40, size: 18, health: 120, vulnerable: false }
                ]
            }
        };
        
        // 当前Boss
        this.currentBoss = null;
        this.bossPhase = 1;
        this.phaseTransitioning = false;
        this.bossSpawned = false;
        
        // Boss能力系统
        this.abilities = {
            turret_barrage: {
                name: '炮塔齐射',
                cooldown: 3000,
                duration: 2000,
                damage: 15,
                projectileCount: 8
            },
            missile_swarm: {
                name: '导弹群',
                cooldown: 8000,
                duration: 1000,
                damage: 30,
                projectileCount: 12
            },
            shield_burst: {
                name: '护盾爆发',
                cooldown: 12000,
                duration: 3000,
                shieldAmount: 200
            },
            repair_drones: {
                name: '维修无人机',
                cooldown: 15000,
                duration: 5000,
                healAmount: 3,
                droneCount: 4
            },
            tentacle_strike: {
                name: '触手攻击',
                cooldown: 2500,
                duration: 1500,
                damage: 20,
                range: 150
            },
            spawn_minions: {
                name: '召唤小兵',
                cooldown: 10000,
                duration: 1000,
                minionCount: 6,
                minionType: 'swarm'
            },
            acid_spray: {
                name: '酸液喷射',
                cooldown: 6000,
                duration: 3000,
                damage: 8,
                dotDuration: 5000
            },
            regeneration: {
                name: '再生',
                cooldown: 20000,
                duration: 8000,
                healRate: 5
            },
            berserk: {
                name: '狂暴',
                cooldown: 30000,
                duration: 10000,
                speedMultiplier: 2.0,
                damageMultiplier: 1.5
            },
            crystal_beam: {
                name: '水晶射线',
                cooldown: 4000,
                duration: 2000,
                damage: 25,
                beamWidth: 20
            },
            shard_storm: {
                name: '碎片风暴',
                cooldown: 7000,
                duration: 4000,
                damage: 12,
                shardCount: 20
            },
            teleport: {
                name: '传送',
                cooldown: 8000,
                duration: 500,
                invulnerable: true
            },
            crystal_prison: {
                name: '水晶监牢',
                cooldown: 18000,
                duration: 6000,
                trapRadius: 80
            },
            shadow_clone: {
                name: '暗影分身',
                cooldown: 12000,
                duration: 8000,
                cloneCount: 2
            },
            void_blast: {
                name: '虚空爆发',
                cooldown: 6000,
                duration: 1500,
                damage: 40,
                radius: 100
            },
            darkness: {
                name: '黑暗降临',
                cooldown: 25000,
                duration: 10000,
                visionReduction: 0.7
            },
            soul_drain: {
                name: '灵魂汲取',
                cooldown: 15000,
                duration: 5000,
                drainRate: 2,
                healRate: 1
            },
            final_form: {
                name: '最终形态',
                cooldown: 0,
                duration: 30000,
                sizeMultiplier: 1.5,
                speedMultiplier: 1.8,
                damageMultiplier: 2.0
            }
        };
        
        // Boss状态
        this.bossState = {
            position: { x: 600, y: 200 },
            target: { x: 600, y: 200 },
            velocity: { x: 0, y: 0 },
            rotation: 0,
            scale: 1.0,
            alpha: 1.0,
            invulnerable: false,
            stunned: false,
            berserking: false,
            regenerating: false,
            shielded: false,
            shieldHealth: 0,
            maxShieldHealth: 0
        };
        
        // 能力冷却追踪
        this.abilityCooldowns = new Map();
        this.activeAbilities = new Map();
        
        // Boss血条UI
        this.bossHealthBar = null;
        this.createBossUI();
        
        // 环境效果
        this.environmentEffects = {
            screenShake: 0,
            colorFilter: null,
            lighting: 1.0,
            particleIntensity: 1.0
        };
        
        // Boss音效
        this.bossAudio = {
            currentMusic: null,
            ambientSounds: new Map()
        };
        
        // 阶段转换效果
        this.phaseTransition = {
            active: false,
            timer: 0,
            duration: 3000,
            effects: []
        };
        
        // Boss警告系统
        this.bossWarning = {
            active: false,
            timer: 0,
            duration: 3000,
            message: ''
        };
        
        // 弱点系统
        this.weakPoints = [];
        
        // Boss AI状态机
        this.aiState = 'idle';
        this.aiTimer = 0;
        this.lastAbilityUsed = null;
        
        // 性能优化
        this.updateCounter = 0;
    }
    
    // 创建Boss UI
    createBossUI() {
        this.bossHealthBar = document.createElement('div');
        this.bossHealthBar.id = 'bossHealthBar';
        this.bossHealthBar.className = 'boss-health-bar hidden';
        this.bossHealthBar.innerHTML = `
            <div class="boss-info">
                <div class="boss-name">未知Boss</div>
                <div class="boss-phase">阶段 1/3</div>
            </div>
            <div class="boss-health-container">
                <div class="boss-health-fill"></div>
                <div class="boss-health-text">0 / 0</div>
            </div>
            <div class="boss-abilities">
                <div class="ability-indicators"></div>
            </div>
        `;
        
        // Boss警告UI
        this.bossWarningUI = document.createElement('div');
        this.bossWarningUI.id = 'bossWarning';
        this.bossWarningUI.className = 'boss-warning hidden';
        this.bossWarningUI.innerHTML = `
            <div class="warning-text">警告！Boss出现！</div>
            <div class="warning-subtext">准备战斗</div>
        `;
        
        // 添加到游戏UI
        const gameUI = document.getElementById('gameUI');
        if (gameUI) {
            gameUI.appendChild(this.bossHealthBar);
            gameUI.appendChild(this.bossWarningUI);
        }
    }
    
    // 生成Boss
    spawnBoss(bossType, x = 600, y = 150) {
        if (this.currentBoss) return false;
        
        const config = this.bossTypes[bossType];
        if (!config) return false;
        
        // 创建Boss实例
        this.currentBoss = {
            id: 'boss_' + Date.now(),
            type: bossType,
            name: config.name,
            x: x,
            y: y,
            health: config.health,
            maxHealth: config.health,
            size: config.size,
            radius: config.size / 2,
            speed: config.speed,
            damage: config.damage,
            scoreValue: config.scoreValue,
            phases: config.phases,
            currentPhase: 1,
            color: config.color,
            glowColor: config.glowColor,
            sprite: config.sprite,
            abilities: [...config.abilities],
            
            // 状态
            active: true,
            invulnerable: false,
            rotation: 0,
            scale: 1.0,
            alpha: 1.0,
            
            // AI
            aiState: 'spawning',
            aiTimer: 0,
            lastAbilityTime: 0,
            
            // 碰撞
            shape: 'circle',
            layer: collisionManager.collisionLayers.ENEMY,
            
            // 特殊属性
            phaseHealthThresholds: [],
            weakPointsDestroyed: 0,
            totalWeakPoints: config.weakPoints.length
        };
        
        // 设置阶段血量阈值
        for (let i = 1; i < config.phases; i++) {
            const threshold = (config.phases - i) / config.phases;
            this.currentBoss.phaseHealthThresholds.push(threshold * config.health);
        }
        
        // 初始化弱点
        this.initializeWeakPoints(config.weakPoints);
        
        // 重置Boss状态
        this.bossState.position = { x, y };
        this.bossState.target = { x, y };
        
        // 清空能力冷却
        this.abilityCooldowns.clear();
        this.activeAbilities.clear();
        
        // 设置Boss音乐
        this.playBossMusic(config.music);
        
        // 显示Boss警告
        this.showBossWarning(config.name);
        
        // 显示Boss血条
        this.showBossHealthBar();
        
        // Boss出现效果
        this.createBossSpawnEffect();
        
        // 屏幕震动
        effectsManager.addScreenShake(20, 1500);
        
        // 暂停游戏一秒让玩家准备
        if (window.gameManager) {
            gameManager.pauseForBossIntro(1000);
        }
        
        this.bossSpawned = true;
        this.updateBossUI();
        
        return true;
    }
    
    // 初始化弱点
    initializeWeakPoints(weakPointConfigs) {
        this.weakPoints = weakPointConfigs.map(config => ({
            ...config,
            maxHealth: config.health,
            active: true,
            vulnerable: config.vulnerable !== false,
            hitCooldown: 0
        }));
    }
    
    // 更新Boss系统
    update(deltaTime) {
        if (!this.currentBoss || !this.currentBoss.active) return;
        
        this.updateCounter++;
        
        // 更新Boss状态
        this.updateBossState(deltaTime);
        
        // 更新Boss AI
        this.updateBossAI(deltaTime);
        
        // 更新能力系统
        this.updateAbilities(deltaTime);
        
        // 更新弱点系统
        this.updateWeakPoints(deltaTime);
        
        // 更新环境效果
        this.updateEnvironmentEffects(deltaTime);
        
        // 更新阶段转换
        this.updatePhaseTransition(deltaTime);
        
        // 更新警告系统
        this.updateBossWarning(deltaTime);
        
        // 检查阶段转换条件
        this.checkPhaseTransition();
        
        // 更新UI
        this.updateBossUI();
        
        // 添加Boss到碰撞检测
        if (this.currentBoss.active) {
            collisionManager.addToSpatialGrid(this.currentBoss);
        }
    }
    
    // 更新Boss状态
    updateBossState(deltaTime) {
        const boss = this.currentBoss;
        
        // 更新位置
        boss.x += this.bossState.velocity.x * deltaTime / 16;
        boss.y += this.bossState.velocity.y * deltaTime / 16;
        
        // 移动到目标位置
        const dx = this.bossState.target.x - boss.x;
        const dy = this.bossState.target.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const moveSpeed = boss.speed * deltaTime / 16;
            this.bossState.velocity.x = (dx / distance) * moveSpeed;
            this.bossState.velocity.y = (dy / distance) * moveSpeed;
        } else {
            this.bossState.velocity.x *= 0.9;
            this.bossState.velocity.y *= 0.9;
        }
        
        // 更新旋转（面向玩家）
        if (player && player.active) {
            const playerDx = player.x - boss.x;
            const playerDy = player.y - boss.y;
            boss.rotation = Math.atan2(playerDy, playerDx);
        }
        
        // 边界限制
        boss.x = Math.max(boss.radius, Math.min(1200 - boss.radius, boss.x));
        boss.y = Math.max(boss.radius, Math.min(300, boss.y)); // Boss主要在上半部分活动
        
        // 更新Boss状态位置
        this.bossState.position.x = boss.x;
        this.bossState.position.y = boss.y;
    }
    
    // 更新Boss AI
    updateBossAI(deltaTime) {
        const boss = this.currentBoss;
        boss.aiTimer += deltaTime;
        
        switch (boss.aiState) {
            case 'spawning':
                if (boss.aiTimer > 2000) {
                    boss.aiState = 'combat';
                    boss.aiTimer = 0;
                }
                break;
                
            case 'combat':
                this.updateCombatAI(deltaTime);
                break;
                
            case 'phase_transition':
                // 在阶段转换期间暂停AI
                break;
                
            case 'death':
                this.updateDeathSequence(deltaTime);
                break;
        }
    }
    
    // 更新战斗AI
    updateCombatAI(deltaTime) {
        const boss = this.currentBoss;
        
        // 选择新目标位置（每3-5秒）
        if (boss.aiTimer > 3000 + Math.random() * 2000) {
            this.selectNewBossTarget();
            boss.aiTimer = 0;
        }
        
        // 使用能力
        this.updateAbilityUsage(deltaTime);
        
        // 根据Boss类型调整行为
        this.updateTypeSpecificBehavior(deltaTime);
    }
    
    // 选择新的Boss目标位置
    selectNewBossTarget() {
        const boss = this.currentBoss;
        const margin = boss.radius + 50;
        
        // 根据Boss类型选择不同的移动模式
        switch (boss.type) {
            case 'fortress':
                // 缓慢移动，主要在上方
                this.bossState.target.x = Math.random() * (1200 - 2 * margin) + margin;
                this.bossState.target.y = Math.random() * 100 + 80;
                break;
                
            case 'organic':
                // 更活跃的移动
                this.bossState.target.x = Math.random() * (1200 - 2 * margin) + margin;
                this.bossState.target.y = Math.random() * 150 + 80;
                break;
                
            case 'crystalline':
                // 传送式移动
                if (Math.random() < 0.3) {
                    this.triggerAbility('teleport');
                }
                this.bossState.target.x = Math.random() * (1200 - 2 * margin) + margin;
                this.bossState.target.y = Math.random() * 120 + 80;
                break;
                
            case 'shadow':
                // 难以预测的移动
                if (player && player.active) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 150 + Math.random() * 100;
                    this.bossState.target.x = player.x + Math.cos(angle) * distance;
                    this.bossState.target.y = player.y + Math.sin(angle) * distance;
                } else {
                    this.bossState.target.x = Math.random() * (1200 - 2 * margin) + margin;
                    this.bossState.target.y = Math.random() * 200 + 80;
                }
                break;
        }
        
        // 确保目标在边界内
        this.bossState.target.x = Math.max(margin, Math.min(1200 - margin, this.bossState.target.x));
        this.bossState.target.y = Math.max(margin, Math.min(300 - margin, this.bossState.target.y));
    }
    
    // 更新能力使用
    updateAbilityUsage(deltaTime) {
        const boss = this.currentBoss;
        const now = Date.now();
        
        // 根据Boss血量和阶段调整能力使用频率
        const healthRatio = boss.health / boss.maxHealth;
        const abilityFrequency = this.getAbilityFrequency(healthRatio);
        
        if (now - boss.lastAbilityTime > abilityFrequency) {
            const availableAbilities = this.getAvailableAbilities();
            if (availableAbilities.length > 0) {
                const selectedAbility = this.selectBestAbility(availableAbilities);
                this.triggerAbility(selectedAbility);
                boss.lastAbilityTime = now;
            }
        }
    }
    
    // 获取能力使用频率
    getAbilityFrequency(healthRatio) {
        // 血量越低，能力使用越频繁
        const baseFrequency = 4000; // 4秒基础间隔
        const minFrequency = 1500;  // 最短间隔
        
        return Math.max(minFrequency, baseFrequency * healthRatio);
    }
    
    // 获取可用能力
    getAvailableAbilities() {
        const boss = this.currentBoss;
        const now = Date.now();
        
        return boss.abilities.filter(abilityName => {
            const lastUsed = this.abilityCooldowns.get(abilityName) || 0;
            const cooldown = this.abilities[abilityName].cooldown;
            return now - lastUsed >= cooldown;
        });
    }
    
    // 选择最佳能力
    selectBestAbility(availableAbilities) {
        const boss = this.currentBoss;
        const healthRatio = boss.health / boss.maxHealth;
        
        // 根据情况和Boss类型选择能力
        let weights = {};
        
        availableAbilities.forEach(ability => {
            weights[ability] = 1;
            
            // 根据血量调整权重
            if (healthRatio < 0.5) {
                if (['regeneration', 'shield_burst', 'repair_drones'].includes(ability)) {
                    weights[ability] *= 2;
                }
            }
            
            if (healthRatio < 0.3) {
                if (['berserk', 'final_form', 'darkness'].includes(ability)) {
                    weights[ability] *= 3;
                }
            }
            
            // 根据玩家距离调整权重
            if (player && player.active) {
                const distance = Math.sqrt((player.x - boss.x) ** 2 + (player.y - boss.y) ** 2);
                
                if (distance < 150) {
                    if (['void_blast', 'tentacle_strike', 'crystal_beam'].includes(ability)) {
                        weights[ability] *= 2;
                    }
                } else {
                    if (['missile_swarm', 'shard_storm', 'turret_barrage'].includes(ability)) {
                        weights[ability] *= 2;
                    }
                }
            }
            
            // 避免重复使用同一能力
            if (ability === this.lastAbilityUsed) {
                weights[ability] *= 0.3;
            }
        });
        
        // 加权随机选择
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [ability, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                this.lastAbilityUsed = ability;
                return ability;
            }
        }
        
        // 备选方案
        return availableAbilities[0];
    }
    
    // 触发Boss能力
    triggerAbility(abilityName) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        
        const now = Date.now();
        this.abilityCooldowns.set(abilityName, now);
        
        // 执行能力
        this.executeAbility(abilityName, ability);
        
        // 显示能力指示器
        this.showAbilityIndicator(abilityName);
        
        return true;
    }
    
    // 执行能力
    executeAbility(abilityName, ability) {
        const boss = this.currentBoss;
        
        switch (abilityName) {
            case 'turret_barrage':
                this.executeTurretBarrage(ability);
                break;
            case 'missile_swarm':
                this.executeMissileSwarm(ability);
                break;
            case 'shield_burst':
                this.executeShieldBurst(ability);
                break;
            case 'repair_drones':
                this.executeRepairDrones(ability);
                break;
            case 'tentacle_strike':
                this.executeTentacleStrike(ability);
                break;
            case 'spawn_minions':
                this.executeSpawnMinions(ability);
                break;
            case 'acid_spray':
                this.executeAcidSpray(ability);
                break;
            case 'regeneration':
                this.executeRegeneration(ability);
                break;
            case 'berserk':
                this.executeBerserk(ability);
                break;
            case 'crystal_beam':
                this.executeCrystalBeam(ability);
                break;
            case 'shard_storm':
                this.executeShardStorm(ability);
                break;
            case 'teleport':
                this.executeTeleport(ability);
                break;
            case 'crystal_prison':
                this.executeCrystalPrison(ability);
                break;
            case 'shadow_clone':
                this.executeShadowClone(ability);
                break;
            case 'void_blast':
                this.executeVoidBlast(ability);
                break;
            case 'darkness':
                this.executeDarkness(ability);
                break;
            case 'soul_drain':
                this.executeSoulDrain(ability);
                break;
            case 'final_form':
                this.executeFinalForm(ability);
                break;
        }
        
        // 记录活跃能力
        this.activeAbilities.set(abilityName, {
            startTime: Date.now(),
            duration: ability.duration
        });
        
        // 播放能力音效
        audioManager.playSound('warning', 0.4, 0.8);
    }
    
    // 能力实现（示例几个）
    executeTurretBarrage(ability) {
        const boss = this.currentBoss;
        
        for (let i = 0; i < ability.projectileCount; i++) {
            setTimeout(() => {
                if (!boss.active) return;
                
                const angle = (Math.PI * 2 * i) / ability.projectileCount;
                const x = boss.x + Math.cos(angle) * boss.radius;
                const y = boss.y + Math.sin(angle) * boss.radius;
                
                // 发射子弹
                bulletManager.fire(x, y, angle, 'enemy_heavy', boss);
                
                // 炮口闪光
                effectsManager.createLaserImpact(x, y, angle);
                
            }, i * 100);
        }
        
        // 屏幕震动
        effectsManager.addScreenShake(5, ability.duration);
    }
    
    executeMissileSwarm(ability) {
        const boss = this.currentBoss;
        
        for (let i = 0; i < ability.projectileCount; i++) {
            setTimeout(() => {
                if (!boss.active || !player || !player.active) return;
                
                const spread = Math.PI / 4;
                const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + 
                             (Math.random() - 0.5) * spread;
                
                const missile = bulletManager.fire(boss.x, boss.y, angle, 'enemy_missile', boss);
                if (missile) {
                    missile.homing = true;
                    missile.homingStrength = 0.1;
                    missile.damage = ability.damage;
                }
                
            }, i * 200);
        }
        
        audioManager.playSound('explosion', 0.3, 0.7);
    }
    
    executeShieldBurst(ability) {
        const boss = this.currentBoss;
        
        this.bossState.shielded = true;
        this.bossState.shieldHealth = ability.shieldAmount;
        this.bossState.maxShieldHealth = ability.shieldAmount;
        
        // 护盾生成效果
        effectsManager.createExplosion(boss.x, boss.y, 3, 'shield');
        
        setTimeout(() => {
            this.bossState.shielded = false;
            this.bossState.shieldHealth = 0;
        }, ability.duration);
    }
    
    executeVoidBlast(ability) {
        const boss = this.currentBoss;
        
        // 创建虚空爆发效果
        effectsManager.createExplosion(boss.x, boss.y, 4, 'void');
        
        // 对范围内的玩家造成伤害
        if (player && player.active) {
            const distance = Math.sqrt((player.x - boss.x) ** 2 + (player.y - boss.y) ** 2);
            if (distance < ability.radius) {
                const damageFactor = 1 - (distance / ability.radius);
                const damage = ability.damage * damageFactor;
                player.takeDamage(damage, boss);
            }
        }
        
        // 屏幕震动
        effectsManager.addScreenShake(15, 1000);
        
        audioManager.playSound('explosion', 0.6, 0.5);
    }
    
    // 更新能力系统
    updateAbilities(deltaTime) {
        const now = Date.now();
        
        // 更新活跃能力
        this.activeAbilities.forEach((abilityState, abilityName) => {
            const elapsed = now - abilityState.startTime;
            if (elapsed >= abilityState.duration) {
                this.deactivateAbility(abilityName);
                this.activeAbilities.delete(abilityName);
            }
        });
    }
    
    // 停用能力
    deactivateAbility(abilityName) {
        switch (abilityName) {
            case 'berserk':
                this.bossState.berserking = false;
                break;
            case 'regeneration':
                this.bossState.regenerating = false;
                break;
            case 'darkness':
                this.environmentEffects.lighting = 1.0;
                document.body.classList.remove('darkness-effect');
                break;
            case 'final_form':
                this.currentBoss.scale = 1.0;
                this.currentBoss.speed /= 1.8;
                break;
        }
    }
    
    // 更新弱点系统
    updateWeakPoints(deltaTime) {
        this.weakPoints.forEach(weakPoint => {
            if (weakPoint.hitCooldown > 0) {
                weakPoint.hitCooldown -= deltaTime;
            }
        });
    }
    
    // Boss受伤处理
    damageBoss(damage, source = null) {
        if (!this.currentBoss || !this.currentBoss.active) return 0;
        
        const boss = this.currentBoss;
        
        // 检查无敌状态
        if (boss.invulnerable || this.bossState.invulnerable) return 0;
        
        let actualDamage = damage;
        
        // 护盾处理
        if (this.bossState.shielded && this.bossState.shieldHealth > 0) {
            const shieldDamage = Math.min(actualDamage, this.bossState.shieldHealth);
            this.bossState.shieldHealth -= shieldDamage;
            actualDamage -= shieldDamage;
            
            // 护盾撞击效果
            effectsManager.createLaserImpact(boss.x, boss.y, Math.random() * Math.PI * 2, '#87ceeb');
            
            if (this.bossState.shieldHealth <= 0) {
                this.bossState.shielded = false;
                effectsManager.createExplosion(boss.x, boss.y, 2, 'shield_break');
            }
        }
        
        // 对本体造成伤害
        if (actualDamage > 0) {
            boss.health -= actualDamage;
            
            // 撞击效果
            effectsManager.createLaserImpact(boss.x, boss.y, Math.random() * Math.PI * 2);
            
            // 屏幕震动
            effectsManager.addScreenShake(3, 200);
        }
        
        // 检查死亡
        if (boss.health <= 0) {
            this.killBoss();
        }
        
        return damage;
    }
    
    // 弱点受伤处理
    damageWeakPoint(weakPointIndex, damage, source = null) {
        if (weakPointIndex < 0 || weakPointIndex >= this.weakPoints.length) return 0;
        
        const weakPoint = this.weakPoints[weakPointIndex];
        if (!weakPoint.active || !weakPoint.vulnerable || weakPoint.hitCooldown > 0) return 0;
        
        weakPoint.health -= damage;
        weakPoint.hitCooldown = 500; // 0.5秒无敌时间
        
        // 弱点撞击效果
        const boss = this.currentBoss;
        const worldX = boss.x + weakPoint.x;
        const worldY = boss.y + weakPoint.y;
        
        effectsManager.createLaserImpact(worldX, worldY, Math.random() * Math.PI * 2, '#ff0000');
        
        // 弱点被摧毁
        if (weakPoint.health <= 0) {
            weakPoint.active = false;
            boss.weakPointsDestroyed++;
            
            // 弱点摧毁效果
            effectsManager.createExplosion(worldX, worldY, 1.5, 'weakpoint');
            
            // 对Boss造成额外伤害
            this.damageBoss(50, source);
            
            // 所有弱点被摧毁的特殊处理
            if (boss.weakPointsDestroyed >= boss.totalWeakPoints) {
                this.onAllWeakPointsDestroyed();
            }
        }
        
        return damage;
    }
    
    // 所有弱点被摧毁
    onAllWeakPointsDestroyed() {
        const boss = this.currentBoss;
        
        // 让Boss进入虚弱状态
        boss.invulnerable = false;
        this.bossState.stunned = true;
        
        // 造成大量伤害
        this.damageBoss(boss.maxHealth * 0.3);
        
        // 特殊效果
        effectsManager.createExplosion(boss.x, boss.y, 3, 'critical');
        effectsManager.addScreenShake(20, 1500);
        
        // 3秒后恢复
        setTimeout(() => {
            this.bossState.stunned = false;
            this.regenerateWeakPoints();
        }, 3000);
    }
    
    // 重生弱点
    regenerateWeakPoints() {
        this.weakPoints.forEach(weakPoint => {
            if (!weakPoint.active) {
                weakPoint.active = true;
                weakPoint.health = weakPoint.maxHealth * 0.7; // 重生时血量减少
            }
        });
        
        this.currentBoss.weakPointsDestroyed = 0;
    }
    
    // 检查阶段转换
    checkPhaseTransition() {
        const boss = this.currentBoss;
        if (!boss || boss.currentPhase >= boss.phases) return;
        
        const healthRatio = boss.health / boss.maxHealth;
        const nextPhaseThreshold = (boss.phases - boss.currentPhase) / boss.phases;
        
        if (healthRatio <= nextPhaseThreshold && !this.phaseTransitioning) {
            this.startPhaseTransition();
        }
    }
    
    // 开始阶段转换
    startPhaseTransition() {
        const boss = this.currentBoss;
        this.phaseTransitioning = true;
        boss.currentPhase++;
        boss.aiState = 'phase_transition';
        
        // 阶段转换效果
        this.phaseTransition.active = true;
        this.phaseTransition.timer = 0;
        
        // 临时无敌
        boss.invulnerable = true;
        
        // 大型爆炸效果
        effectsManager.createExplosion(boss.x, boss.y, 4, 'phase_transition');
        effectsManager.addScreenShake(25, 2000);
        
        // 阶段转换音效
        audioManager.playSound('powerup', 0.8, 0.6);
        
        // 显示阶段通知
        if (window.uiManager) {
            uiManager.showNotification('Boss进入新阶段！', `阶段 ${boss.currentPhase}`, 'warning');
        }
        
        // 根据新阶段解锁能力
        this.unlockPhaseAbilities(boss.currentPhase);
        
        setTimeout(() => {
            this.completePhaseTransition();
        }, this.phaseTransition.duration);
    }
    
    // 完成阶段转换
    completePhaseTransition() {
        const boss = this.currentBoss;
        
        this.phaseTransitioning = false;
        this.phaseTransition.active = false;
        boss.invulnerable = false;
        boss.aiState = 'combat';
        
        // 增强Boss属性
        boss.speed *= 1.2;
        boss.damage *= 1.1;
        
        // 恢复部分血量
        boss.health += boss.maxHealth * 0.1;
        boss.health = Math.min(boss.maxHealth, boss.health);
    }
    
    // 解锁阶段能力
    unlockPhaseAbilities(phase) {
        // 根据不同阶段解锁新能力或增强现有能力
        const boss = this.currentBoss;
        
        switch (phase) {
            case 2:
                // 第二阶段：更频繁使用能力
                Object.keys(this.abilities).forEach(abilityName => {
                    if (boss.abilities.includes(abilityName)) {
                        this.abilities[abilityName].cooldown *= 0.8;
                    }
                });
                break;
                
            case 3:
                // 第三阶段：解锁终极能力
                if (boss.type === 'shadow' && !boss.abilities.includes('final_form')) {
                    boss.abilities.push('final_form');
                }
                break;
        }
    }
    
    // 更新环境效果
    updateEnvironmentEffects(deltaTime) {
        // 屏幕震动衰减
        if (this.environmentEffects.screenShake > 0) {
            this.environmentEffects.screenShake -= deltaTime * 0.01;
            this.environmentEffects.screenShake = Math.max(0, this.environmentEffects.screenShake);
        }
    }
    
    // 更新阶段转换效果
    updatePhaseTransition(deltaTime) {
        if (this.phaseTransition.active) {
            this.phaseTransition.timer += deltaTime;
        }
    }
    
    // 更新Boss警告
    updateBossWarning(deltaTime) {
        if (this.bossWarning.active) {
            this.bossWarning.timer += deltaTime;
            if (this.bossWarning.timer >= this.bossWarning.duration) {
                this.hideBossWarning();
            }
        }
    }
    
    // 显示Boss警告
    showBossWarning(bossName) {
        this.bossWarning.active = true;
        this.bossWarning.timer = 0;
        this.bossWarning.message = bossName;
        
        if (this.bossWarningUI) {
            this.bossWarningUI.querySelector('.warning-text').textContent = `警告！${bossName}出现！`;
            this.bossWarningUI.classList.remove('hidden');
        }
    }
    
    // 隐藏Boss警告
    hideBossWarning() {
        this.bossWarning.active = false;
        
        if (this.bossWarningUI) {
            this.bossWarningUI.classList.add('hidden');
        }
    }
    
    // 显示Boss血条
    showBossHealthBar() {
        if (this.bossHealthBar) {
            this.bossHealthBar.classList.remove('hidden');
        }
    }
    
    // 隐藏Boss血条
    hideBossHealthBar() {
        if (this.bossHealthBar) {
            this.bossHealthBar.classList.add('hidden');
        }
    }
    
    // 更新Boss UI
    updateBossUI() {
        if (!this.currentBoss || !this.bossHealthBar) return;
        
        const boss = this.currentBoss;
        
        // 更新Boss名称和阶段
        const bossName = this.bossHealthBar.querySelector('.boss-name');
        const bossPhase = this.bossHealthBar.querySelector('.boss-phase');
        
        if (bossName) bossName.textContent = boss.name;
        if (bossPhase) bossPhase.textContent = `阶段 ${boss.currentPhase}/${boss.phases}`;
        
        // 更新血条
        const healthFill = this.bossHealthBar.querySelector('.boss-health-fill');
        const healthText = this.bossHealthBar.querySelector('.boss-health-text');
        
        if (healthFill) {
            const healthPercent = (boss.health / boss.maxHealth) * 100;
            healthFill.style.width = `${healthPercent}%`;
            
            // 根据血量改变颜色
            if (healthPercent > 60) {
                healthFill.style.backgroundColor = '#4caf50';
            } else if (healthPercent > 25) {
                healthFill.style.backgroundColor = '#ff9800';
            } else {
                healthFill.style.backgroundColor = '#f44336';
            }
        }
        
        if (healthText) {
            healthText.textContent = `${Math.ceil(boss.health)} / ${boss.maxHealth}`;
        }
        
        // 更新能力指示器
        this.updateAbilityIndicators();
    }
    
    // 更新能力指示器
    updateAbilityIndicators() {
        const indicators = this.bossHealthBar.querySelector('.ability-indicators');
        if (!indicators) return;
        
        indicators.innerHTML = '';
        
        this.activeAbilities.forEach((abilityState, abilityName) => {
            const indicator = document.createElement('div');
            indicator.className = 'ability-indicator';
            indicator.textContent = this.abilities[abilityName].name;
            indicators.appendChild(indicator);
        });
    }
    
    // 显示能力指示器
    showAbilityIndicator(abilityName) {
        const ability = this.abilities[abilityName];
        
        if (window.uiManager) {
            uiManager.showNotification('Boss技能！', ability.name, 'warning');
        }
    }
    
    // 播放Boss音乐
    playBossMusic(musicName) {
        // 这里可以实现Boss音乐播放
        // audioManager.playMusic(musicName);
    }
    
    // 停止Boss音乐
    stopBossMusic() {
        // audioManager.stopMusic();
    }
    
    // 创建Boss出现效果
    createBossSpawnEffect() {
        const boss = this.currentBoss;
        
        // 大型爆炸
        effectsManager.createExplosion(boss.x, boss.y, 5, 'boss_spawn');
        
        // 环形粒子爆发
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const distance = boss.radius + 50;
            const x = boss.x + Math.cos(angle) * distance;
            const y = boss.y + Math.sin(angle) * distance;
            
            effectsManager.createParticle(x, y, {
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 2.0,
                size: 4,
                color: boss.glowColor,
                glow: true,
                type: 'boss_spawn'
            });
        }
        
        // 播放Boss出现音效
        audioManager.playSound('explosion', 0.8, 0.4);
    }
    
    // 杀死Boss
    killBoss() {
        const boss = this.currentBoss;
        boss.active = false;
        boss.aiState = 'death';
        
        // 死亡效果
        this.createBossDeathEffect();
        
        // 奖励
        this.giveKillRewards();
        
        // 隐藏UI
        this.hideBossHealthBar();
        
        // 停止Boss音乐
        this.stopBossMusic();
        
        // 清理
        setTimeout(() => {
            this.cleanup();
        }, 3000);
    }
    
    // 创建Boss死亡效果
    createBossDeathEffect() {
        const boss = this.currentBoss;
        
        // 多次大爆炸
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * boss.size;
                const offsetY = (Math.random() - 0.5) * boss.size;
                
                effectsManager.createExplosion(
                    boss.x + offsetX, 
                    boss.y + offsetY, 
                    3 + Math.random() * 2, 
                    'boss_death'
                );
                
                effectsManager.addScreenShake(15, 300);
                audioManager.playSound('explosion', 0.6, 0.3 + Math.random() * 0.4);
                
            }, i * 300);
        }
        
        // 最终大爆炸
        setTimeout(() => {
            effectsManager.createExplosion(boss.x, boss.y, 8, 'boss_final_death');
            effectsManager.addScreenShake(30, 1500);
            audioManager.playSound('explosion', 1.0, 0.2);
            
            // 胜利粒子效果
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                
                effectsManager.createParticle(boss.x, boss.y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 3.0,
                    size: 3 + Math.random() * 2,
                    color: '#ffd700',
                    glow: true,
                    type: 'victory'
                });
            }
            
        }, 2500);
    }
    
    // 给予击杀奖励
    giveKillRewards() {
        const boss = this.currentBoss;
        
        // 分数奖励
        if (window.gameManager) {
            gameManager.addScore(boss.scoreValue);
        }
        
        // 经验奖励
        if (window.progressionSystem) {
            progressionSystem.addExperience(boss.scoreValue / 10);
            progressionSystem.addCurrency('credits', boss.scoreValue / 5);
            progressionSystem.addCurrency('gems', Math.floor(boss.scoreValue / 200));
        }
        
        // 特殊道具掉落
        this.dropBossLoot();
        
        // 显示胜利通知
        if (window.uiManager) {
            uiManager.showNotification('Boss击败！', `获得 ${boss.scoreValue} 分`, 'success');
        }
    }
    
    // 掉落Boss战利品
    dropBossLoot() {
        const boss = this.currentBoss;
        
        // 保证掉落高级道具
        const guaranteedDrops = ['legendary_weapon', 'rare_armor', 'epic_accessory'];
        const randomDrop = guaranteedDrops[Math.floor(Math.random() * guaranteedDrops.length)];
        
        if (window.gameManager) {
            gameManager.spawnPowerup(boss.x, boss.y - 30, randomDrop);
        }
        
        // 额外随机掉落
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 * i) / 3;
            const distance = 50;
            const x = boss.x + Math.cos(angle) * distance;
            const y = boss.y + Math.sin(angle) * distance;
            
            if (window.gameManager) {
                gameManager.spawnPowerup(x, y, 'experience');
            }
        }
    }
    
    // 渲染Boss系统
    render(ctx) {
        if (!this.currentBoss || !this.currentBoss.active) return;
        
        const boss = this.currentBoss;
        
        ctx.save();
        
        // Boss主体渲染
        this.renderBoss(ctx, boss);
        
        // 弱点渲染
        this.renderWeakPoints(ctx, boss);
        
        // 护盾渲染
        if (this.bossState.shielded) {
            this.renderBossShield(ctx, boss);
        }
        
        // 阶段转换效果
        if (this.phaseTransition.active) {
            this.renderPhaseTransition(ctx, boss);
        }
        
        ctx.restore();
    }
    
    // 渲染Boss
    renderBoss(ctx, boss) {
        ctx.save();
        
        ctx.translate(boss.x, boss.y);
        ctx.rotate(boss.rotation);
        ctx.scale(boss.scale, boss.scale);
        ctx.globalAlpha = boss.alpha;
        
        // 发光效果
        ctx.shadowColor = boss.glowColor;
        ctx.shadowBlur = boss.size * 0.5;
        
        // 主体
        ctx.fillStyle = boss.color;
        ctx.strokeStyle = boss.glowColor;
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(0, 0, boss.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Boss类型特定装饰
        this.renderBossDetails(ctx, boss);
        
        ctx.restore();
    }
    
    // 渲染Boss细节
    renderBossDetails(ctx, boss) {
        switch (boss.type) {
            case 'fortress':
                // 炮管
                for (let i = 0; i < 3; i++) {
                    const angle = (i - 1) * Math.PI / 6;
                    ctx.save();
                    ctx.rotate(angle);
                    ctx.fillStyle = '#696969';
                    ctx.fillRect(-3, -boss.size * 0.4, 6, boss.size * 0.3);
                    ctx.restore();
                }
                break;
                
            case 'organic':
                // 触手
                for (let i = 0; i < 6; i++) {
                    const angle = i * Math.PI / 3;
                    const length = boss.size * 0.6;
                    
                    ctx.strokeStyle = boss.color;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
                    ctx.stroke();
                }
                break;
        }
    }
    
    // 渲染弱点
    renderWeakPoints(ctx, boss) {
        this.weakPoints.forEach(weakPoint => {
            if (!weakPoint.active) return;
            
            const worldX = boss.x + weakPoint.x;
            const worldY = boss.y + weakPoint.y;
            
            ctx.save();
            
            // 弱点发光
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = weakPoint.size;
            
            // 弱点主体
            ctx.fillStyle = weakPoint.vulnerable ? '#ff4444' : '#666666';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(worldX, worldY, weakPoint.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // 血量指示
            if (weakPoint.health < weakPoint.maxHealth) {
                const healthRatio = weakPoint.health / weakPoint.maxHealth;
                ctx.fillStyle = healthRatio > 0.5 ? '#ffff00' : '#ff0000';
                ctx.fillRect(worldX - weakPoint.size / 2, worldY - weakPoint.size / 2 - 8, 
                           weakPoint.size * healthRatio, 3);
            }
            
            ctx.restore();
        });
    }
    
    // 渲染Boss护盾
    renderBossShield(ctx, boss) {
        if (this.bossState.shieldHealth <= 0) return;
        
        ctx.save();
        
        const shieldAlpha = this.bossState.shieldHealth / this.bossState.maxShieldHealth;
        ctx.globalAlpha = shieldAlpha * 0.8;
        
        // 多层护盾环
        for (let i = 0; i < 3; i++) {
            const radius = boss.size * 0.7 + i * 10;
            const alpha = (3 - i) / 3 * shieldAlpha;
            
            ctx.strokeStyle = `rgba(135, 206, 235, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // 渲染阶段转换效果
    renderPhaseTransition(ctx, boss) {
        const progress = this.phaseTransition.timer / this.phaseTransition.duration;
        
        ctx.save();
        
        // 能量波动
        for (let i = 0; i < 5; i++) {
            const radius = boss.size + i * 20 + progress * 100;
            const alpha = (1 - progress) * (1 - i / 5);
            
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // 获取Boss统计
    getStats() {
        if (!this.currentBoss) {
            return {
                bossActive: false
            };
        }
        
        return {
            bossActive: true,
            bossName: this.currentBoss.name,
            bossType: this.currentBoss.type,
            currentPhase: this.currentBoss.currentPhase,
            totalPhases: this.currentBoss.phases,
            healthPercent: (this.currentBoss.health / this.currentBoss.maxHealth) * 100,
            activeAbilities: this.activeAbilities.size,
            weakPointsDestroyed: this.currentBoss.weakPointsDestroyed,
            totalWeakPoints: this.currentBoss.totalWeakPoints
        };
    }
    
    // 清理Boss系统
    cleanup() {
        this.currentBoss = null;
        this.bossSpawned = false;
        this.phaseTransitioning = false;
        this.abilityCooldowns.clear();
        this.activeAbilities.clear();
        this.weakPoints = [];
        
        this.hideBossHealthBar();
        this.stopBossMusic();
        
        // 重置环境效果
        this.environmentEffects.lighting = 1.0;
        document.body.classList.remove('darkness-effect');
    }
}

// 创建全局Boss系统实例
const epicBossSystem = new EpicBossSystem();
