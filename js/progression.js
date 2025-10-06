// 游戏进展系统模块 - progression.js

class ProgressionSystem {
    constructor() {
        // 玩家等级和经验
        this.playerLevel = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;
        this.totalExperience = 0;
        
        // 技能点数
        this.skillPoints = 0;
        this.unspentSkillPoints = 0;
        
        // 货币系统
        this.currencies = {
            credits: 0,        // 基础货币
            gems: 0,          // 高级货币
            scrap: 0,         // 升级材料
            energy: 100,      // 能量（限制某些功能）
            maxEnergy: 100
        };
        
        // 技能树定义
        this.skillTree = {
            combat: {
                name: '战斗技能',
                icon: 'skill_combat.png',
                skills: {
                    damage_boost: {
                        name: '伤害强化',
                        description: '增加武器伤害',
                        maxLevel: 5,
                        currentLevel: 0,
                        cost: [1, 2, 3, 4, 5],
                        effects: [0.1, 0.15, 0.2, 0.25, 0.3],
                        prerequisite: null
                    },
                    fire_rate: {
                        name: '射速提升',
                        description: '提高武器射击速度',
                        maxLevel: 5,
                        currentLevel: 0,
                        cost: [1, 2, 3, 4, 5],
                        effects: [0.1, 0.15, 0.2, 0.25, 0.3],
                        prerequisite: null
                    },
                    critical_hit: {
                        name: '暴击',
                        description: '增加暴击几率和伤害',
                        maxLevel: 3,
                        currentLevel: 0,
                        cost: [2, 4, 6],
                        effects: [0.1, 0.15, 0.2],
                        prerequisite: 'damage_boost'
                    },
                    multi_shot: {
                        name: '多重射击',
                        description: '同时发射多发子弹',
                        maxLevel: 3,
                        currentLevel: 0,
                        cost: [3, 5, 7],
                        effects: [1, 2, 3],
                        prerequisite: 'fire_rate'
                    },
                    piercing_shot: {
                        name: '穿透射击',
                        description: '子弹可以穿透敌人',
                        maxLevel: 3,
                        currentLevel: 0,
                        cost: [2, 4, 6],
                        effects: [1, 2, 3],
                        prerequisite: 'critical_hit'
                    }
                }
            },
            
            survival: {
                name: '生存技能',
                icon: 'skill_survival.png',
                skills: {
                    health_boost: {
                        name: '生命强化',
                        description: '增加最大生命值',
                        maxLevel: 5,
                        currentLevel: 0,
                        cost: [1, 2, 3, 4, 5],
                        effects: [20, 25, 30, 35, 40],
                        prerequisite: null
                    },
                    shield_capacity: {
                        name: '护盾容量',
                        description: '增加护盾最大值',
                        maxLevel: 5,
                        currentLevel: 0,
                        cost: [1, 2, 3, 4, 5],
                        effects: [25, 30, 35, 40, 50],
                        prerequisite: null
                    },
                    regeneration: {
                        name: '生命恢复',
                        description: '缓慢恢复生命值',
                        maxLevel: 3,
                        currentLevel: 0,
                        cost: [3, 5, 8],
                        effects: [1, 2, 3],
                        prerequisite: 'health_boost'
                    },
                    damage_reduction: {
                        name: '伤害减免',
                        description: '减少受到的伤害',
                        maxLevel: 3,
                        currentLevel: 0,
                        cost: [4, 6, 9],
                        effects: [0.1, 0.15, 0.2],
                        prerequisite: 'shield_capacity'
                    },
                    emergency_shield: {
                        name: '紧急护盾',
                        description: '生命值低时自动激活护盾',
                        maxLevel: 1,
                        currentLevel: 0,
                        cost: [8],
                        effects: [1],
                        prerequisite: 'damage_reduction'
                    }
                }
            },
            
            utility: {
                name: '实用技能',
                icon: 'skill_utility.png',
                skills: {
                    movement_speed: {
                        name: '移动速度',
                        description: '提高移动速度',
                        maxLevel: 3,
                        currentLevel: 0,
                        cost: [1, 3, 5],
                        effects: [0.15, 0.25, 0.35],
                        prerequisite: null
                    },
                    experience_boost: {
                        name: '经验加成',
                        description: '增加经验值获取',
                        maxLevel: 3,
                        currentLevel: 0,
                        cost: [2, 4, 6],
                        effects: [0.2, 0.35, 0.5],
                        prerequisite: null
                    },
                    credit_boost: {
                        name: '金币加成',
                        description: '增加金币获取',
                        maxLevel: 3,
                        currentLevel: 0,
                        cost: [2, 4, 6],
                        effects: [0.25, 0.4, 0.6],
                        prerequisite: 'experience_boost'
                    },
                    time_dilation: {
                        name: '时间扩张',
                        description: '增加子弹时间持续时间',
                        maxLevel: 3,
                        currentLevel: 0,
                        cost: [3, 6, 9],
                        effects: [0.5, 1.0, 1.5],
                        prerequisite: 'movement_speed'
                    },
                    luck: {
                        name: '幸运',
                        description: '增加道具掉落几率',
                        maxLevel: 5,
                        currentLevel: 0,
                        cost: [2, 3, 4, 5, 7],
                        effects: [0.1, 0.15, 0.2, 0.25, 0.35],
                        prerequisite: 'credit_boost'
                    }
                }
            }
        };
        
        // 装备系统
        this.equipment = {
            weapon: null,
            armor: null,
            accessory1: null,
            accessory2: null,
            special: null
        };
        
        // 装备库存
        this.inventory = [];
        this.maxInventorySize = 50;
        
        // 商店物品
        this.shopItems = {
            weapons: [
                {
                    id: 'plasma_rifle',
                    name: '等离子步枪',
                    type: 'weapon',
                    rarity: 'rare',
                    price: 500,
                    currency: 'credits',
                    stats: { damage: 25, fireRate: 0.8, accuracy: 0.9 },
                    description: '高能等离子武器，射速较慢但威力巨大'
                },
                {
                    id: 'rapid_blaster',
                    name: '速射爆能枪',
                    type: 'weapon',
                    rarity: 'uncommon',
                    price: 300,
                    currency: 'credits',
                    stats: { damage: 12, fireRate: 1.5, accuracy: 0.7 },
                    description: '高射速武器，适合对付大量敌人'
                },
                {
                    id: 'sniper_cannon',
                    name: '狙击炮',
                    type: 'weapon',
                    rarity: 'legendary',
                    price: 50,
                    currency: 'gems',
                    stats: { damage: 80, fireRate: 0.3, accuracy: 1.0 },
                    description: '终极远程武器，一击致命'
                }
            ],
            
            armor: [
                {
                    id: 'nano_suit',
                    name: '纳米装甲',
                    type: 'armor',
                    rarity: 'rare',
                    price: 400,
                    currency: 'credits',
                    stats: { health: 50, defense: 0.15, speed: -0.1 },
                    description: '先进的纳米技术装甲，提供优秀防护'
                },
                {
                    id: 'speed_suit',
                    name: '疾风战衣',
                    type: 'armor',
                    rarity: 'uncommon',
                    price: 250,
                    currency: 'credits',
                    stats: { health: 20, defense: 0.05, speed: 0.3 },
                    description: '轻量化装甲，大幅提升移动速度'
                }
            ],
            
            accessories: [
                {
                    id: 'energy_core',
                    name: '能量核心',
                    type: 'accessory',
                    rarity: 'rare',
                    price: 350,
                    currency: 'credits',
                    stats: { energyRegen: 2, maxEnergy: 50 },
                    description: '提升能量恢复速度和上限'
                },
                {
                    id: 'targeting_chip',
                    name: '瞄准芯片',
                    type: 'accessory',
                    rarity: 'uncommon',
                    price: 200,
                    currency: 'credits',
                    stats: { accuracy: 0.2, critChance: 0.1 },
                    description: '提升射击精度和暴击率'
                },
                {
                    id: 'luck_charm',
                    name: '幸运护符',
                    type: 'accessory',
                    rarity: 'epic',
                    price: 30,
                    currency: 'gems',
                    stats: { luck: 0.25, expBonus: 0.15 },
                    description: '神秘的护符，带来好运'
                }
            ],
            
            consumables: [
                {
                    id: 'health_potion',
                    name: '生命药剂',
                    type: 'consumable',
                    rarity: 'common',
                    price: 50,
                    currency: 'credits',
                    effect: 'restore_health',
                    value: 50,
                    description: '立即恢复50点生命值'
                },
                {
                    id: 'shield_battery',
                    name: '护盾电池',
                    type: 'consumable',
                    rarity: 'common',
                    price: 40,
                    currency: 'credits',
                    effect: 'restore_shield',
                    value: 75,
                    description: '立即恢复75点护盾值'
                },
                {
                    id: 'exp_booster',
                    name: '经验助推器',
                    type: 'consumable',
                    rarity: 'uncommon',
                    price: 100,
                    currency: 'credits',
                    effect: 'exp_boost',
                    value: 2.0,
                    duration: 300000,
                    description: '5分钟内经验获取翻倍'
                }
            ]
        };
        
        // 成就系统
        this.achievements = {
            first_kill: {
                name: '初次击杀',
                description: '击败第一个敌人',
                unlocked: false,
                reward: { type: 'credits', amount: 50 }
            },
            combo_master: {
                name: '连击大师',
                description: '达到50连击',
                unlocked: false,
                reward: { type: 'skillPoints', amount: 2 }
            },
            survivor: {
                name: '幸存者',
                description: '存活10分钟',
                unlocked: false,
                reward: { type: 'gems', amount: 5 }
            },
            collector: {
                name: '收藏家',
                description: '收集100个道具',
                unlocked: false,
                progress: 0,
                target: 100,
                reward: { type: 'credits', amount: 500 }
            },
            rich: {
                name: '富翁',
                description: '拥有10000金币',
                unlocked: false,
                reward: { type: 'gems', amount: 10 }
            }
        };
        
        // 每日任务
        this.dailyQuests = [];
        this.generateDailyQuests();
        
        // 临时增益效果
        this.activeBuffs = new Map();
        
        // UI元素
        this.progressionUI = null;
        this.createProgressionUI();
        
        // 事件监听
        this.setupEventListeners();
        
        // 加载保存的数据
        this.loadProgress();
    }
    
    // 创建进展系统UI
    createProgressionUI() {
        // 等级显示
        this.levelDisplay = document.createElement('div');
        this.levelDisplay.id = 'levelDisplay';
        this.levelDisplay.className = 'level-display';
        this.levelDisplay.innerHTML = `
            <div class="level-info">
                <div class="level-number">1</div>
                <div class="level-label">等级</div>
            </div>
            <div class="exp-bar">
                <div class="exp-fill"></div>
                <div class="exp-text">0 / 100</div>
            </div>
        `;
        
        // 货币显示
        this.currencyDisplay = document.createElement('div');
        this.currencyDisplay.id = 'currencyDisplay';
        this.currencyDisplay.className = 'currency-display';
        this.currencyDisplay.innerHTML = `
            <div class="currency-item">
                <span class="currency-icon">💰</span>
                <span class="currency-amount" id="creditsAmount">0</span>
            </div>
            <div class="currency-item">
                <span class="currency-icon">💎</span>
                <span class="currency-amount" id="gemsAmount">0</span>
            </div>
            <div class="currency-item">  
                <span class="currency-icon">🔧</span>
                <span class="currency-amount" id="scrapAmount">0</span>
            </div>
        `;
        
        // 技能点显示
        this.skillPointsDisplay = document.createElement('div');
        this.skillPointsDisplay.id = 'skillPointsDisplay';
        this.skillPointsDisplay.className = 'skill-points-display hidden';
        this.skillPointsDisplay.innerHTML = `
            <div class="skill-points-icon">⭐</div>
            <div class="skill-points-text">
                <div class="skill-points-label">技能点</div>
                <div class="skill-points-amount">0</div>
            </div>
        `;
        
        // 添加到游戏UI
        const gameUI = document.getElementById('gameUI');
        if (gameUI) {
            gameUI.appendChild(this.levelDisplay);
            gameUI.appendChild(this.currencyDisplay);
            gameUI.appendChild(this.skillPointsDisplay);
        }
    }
    
    // 设置事件监听
    setupEventListeners() {
        // 敌人死亡事件
        document.addEventListener('enemy-death', (event) => {
            this.onEnemyDeath(event.detail);
        });
        
        // 连击事件
        document.addEventListener('combo-add', (event) => {
            this.onComboAdd(event.detail);
        });
        
        // 道具收集事件
        document.addEventListener('powerup-collected', (event) => {
            this.onPowerupCollected(event.detail);
        });
    }
    
    // 添加经验值
    addExperience(amount) {
        const bonusMultiplier = 1 + this.getSkillEffect('utility', 'experience_boost');
        const actualAmount = Math.floor(amount * bonusMultiplier);
        
        this.experience += actualAmount;
        this.totalExperience += actualAmount;
        
        // 检查升级
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
        
        this.updateProgressionUI();
        
        // 创建经验获得效果
        if (player) {
            this.createExpGainEffect(player.x, player.y, actualAmount);
        }
    }
    
    // 升级
    levelUp() {
        this.experience -= this.experienceToNextLevel;
        this.playerLevel++;
        this.skillPoints++;
        this.unspentSkillPoints++;
        
        // 增加经验需求
        this.experienceToNextLevel = Math.floor(100 * Math.pow(1.2, this.playerLevel - 1));
        
        // 升级奖励
        this.addCurrency('credits', this.playerLevel * 10);
        if (this.playerLevel % 5 === 0) {
            this.addCurrency('gems', 1);
        }
        
        // 升级效果
        if (player) {
            effectsManager.createExplosion(player.x, player.y, 2, 'levelup');
            effectsManager.addScreenShake(8, 500);
        }
        
        // 播放升级音效
        audioManager.playSound('powerup', 0.6, 1.2);
        
        // 显示升级通知
        if (window.uiManager) {
            uiManager.showNotification('升级！', `等级 ${this.playerLevel}`, 'success');
        }
        
        // 显示技能点提示
        this.skillPointsDisplay.classList.remove('hidden');
        
        this.updateProgressionUI();
    }
    
    // 添加货币
    addCurrency(type, amount) {
        if (!this.currencies.hasOwnProperty(type)) return;
        
        const bonusMultiplier = type === 'credits' ? 
            1 + this.getSkillEffect('utility', 'credit_boost') : 1;
        const actualAmount = Math.floor(amount * bonusMultiplier);
        
        this.currencies[type] += actualAmount;
        
        // 检查成就
        if (type === 'credits' && this.currencies[type] >= 10000) {
            this.unlockAchievement('rich');
        }
        
        this.updateProgressionUI();
        
        // 保存进度
        this.saveProgress();
    }
    
    // 学习技能
    learnSkill(category, skillName) {
        const skill = this.skillTree[category]?.skills[skillName];
        if (!skill) return false;
        
        // 检查条件
        if (skill.currentLevel >= skill.maxLevel) return false;
        if (this.unspentSkillPoints < skill.cost[skill.currentLevel]) return false;
        
        // 检查前置技能
        if (skill.prerequisite) {
            const prereqSkill = this.skillTree[category].skills[skill.prerequisite];
            if (!prereqSkill || prereqSkill.currentLevel === 0) return false;
        }
        
        // 学习技能
        this.unspentSkillPoints -= skill.cost[skill.currentLevel];
        skill.currentLevel++;
        
        // 应用技能效果
        this.applySkillEffect(category, skillName, skill);
        
        // 播放学习音效
        audioManager.playSound('powerup', 0.4, 1.4);
        
        // 显示通知
        if (window.uiManager) {
            uiManager.showNotification('技能学习！', `${skill.name} LV.${skill.currentLevel}`, 'info');
        }
        
        this.updateProgressionUI();
        this.saveProgress();
        
        return true;
    }
    
    // 获取技能效果
    getSkillEffect(category, skillName) {
        const skill = this.skillTree[category]?.skills[skillName];
        if (!skill || skill.currentLevel === 0) return 0;
        
        return skill.effects[skill.currentLevel - 1] || 0;
    }
    
    // 应用技能效果
    applySkillEffect(category, skillName, skill) {
        // 这里可以直接影响游戏系统
        switch (skillName) {
            case 'health_boost':
                if (player) {
                    const healthBoost = skill.effects[skill.currentLevel - 1];
                    player.maxHealth += healthBoost;
                    player.health += healthBoost;
                }
                break;
                
            case 'movement_speed':
                if (player) {
                    const speedBoost = skill.effects[skill.currentLevel - 1];
                    player.speed *= (1 + speedBoost);
                }
                break;
                
            case 'emergency_shield':
                if (player && skill.currentLevel > 0) {
                    player.hasEmergencyShield = true;
                }
                break;
        }
    }
    
    // 装备物品
    equipItem(item, slot = null) {
        if (!slot) {
            slot = this.getDefaultSlot(item.type);
        }
        
        if (!this.equipment.hasOwnProperty(slot)) return false;
        
        // 卸下当前装备
        if (this.equipment[slot]) {
            this.unequipItem(slot);
        }
        
        // 装备新物品
        this.equipment[slot] = item;
        this.applyEquipmentStats(item, true);
        
        // 从库存移除
        const index = this.inventory.indexOf(item);
        if (index !== -1) {
            this.inventory.splice(index, 1);
        }
        
        // 播放装备音效
        audioManager.playSound('powerup', 0.3, 1.1);
        
        this.saveProgress();
        return true;
    }
    
    // 卸下装备
    unequipItem(slot) {
        const item = this.equipment[slot];
        if (!item) return false;
        
        // 取消装备效果
        this.applyEquipmentStats(item, false);
        
        // 放入库存
        if (this.inventory.length < this.maxInventorySize) {
            this.inventory.push(item);
        }
        
        this.equipment[slot] = null;
        this.saveProgress();
        return true;
    }
    
    // 应用装备属性
    applyEquipmentStats(item, equip = true) {
        const multiplier = equip ? 1 : -1;
        
        if (player && item.stats) {
            if (item.stats.health) {
                const healthChange = item.stats.health * multiplier;
                player.maxHealth += healthChange;
                if (equip) player.health += healthChange;
            }
            
            if (item.stats.speed) {
                player.speed *= equip ? (1 + item.stats.speed) : (1 / (1 + item.stats.speed));
            }
            
            if (item.stats.defense) {
                player.damageReduction = (player.damageReduction || 0) + item.stats.defense * multiplier;
            }
        }
    }
    
    // 获取默认装备槽位
    getDefaultSlot(itemType) {
        const slotMap = {
            weapon: 'weapon',
            armor: 'armor',
            accessory: 'accessory1'
        };
        
        return slotMap[itemType] || 'accessory1';
    }
    
    // 购买商店物品
    buyItem(itemId) {
        let item = null;
        let itemList = null;
        
        // 查找物品
        for (const category of Object.values(this.shopItems)) {
            const found = category.find(i => i.id === itemId);
            if (found) {
                item = found;
                itemList = category;
                break;
            }
        }
        
        if (!item) return false;
        
        // 检查货币
        if (this.currencies[item.currency] < item.price) return false;
        
        // 检查库存空间
        if (this.inventory.length >= this.maxInventorySize) return false;
        
        // 购买物品
        this.currencies[item.currency] -= item.price;
        
        // 创建物品副本
        const purchasedItem = { ...item };
        delete purchasedItem.price;
        delete purchasedItem.currency;
        
        this.inventory.push(purchasedItem);
        
        // 播放购买音效
        audioManager.playSound('powerup', 0.4, 0.9);
        
        // 显示通知
        if (window.uiManager) {
            uiManager.showNotification('购买成功！', item.name, 'success');
        }
        
        this.updateProgressionUI();
        this.saveProgress();
        
        return true;
    }
    
    // 使用消耗品
    useConsumable(item) {
        if (item.type !== 'consumable') return false;
        
        switch (item.effect) {
            case 'restore_health':
                if (player) {
                    player.health = Math.min(player.maxHealth, player.health + item.value);
                }
                break;
                
            case 'restore_shield':
                if (player) {
                    player.shield = Math.min(player.maxShield, player.shield + item.value);
                }
                break;
                
            case 'exp_boost':
                this.activateBuff('exp_boost', item.value, item.duration);
                break;
        }
        
        // 从库存移除
        const index = this.inventory.indexOf(item);
        if (index !== -1) {
            this.inventory.splice(index, 1);
        }
        
        // 播放使用音效
        audioManager.playSound('powerup', 0.3, 1.3);
        
        return true;
    }
    
    // 激活增益效果
    activateBuff(buffType, value, duration) {
        this.activeBuffs.set(buffType, {
            value: value,
            duration: duration,
            startTime: Date.now()
        });
        
        // 显示通知
        if (window.uiManager) {
            uiManager.showNotification('增益激活！', `${buffType} x${value}`, 'info');
        }
    }
    
    // 生成每日任务
    generateDailyQuests() {
        this.dailyQuests = [
            {
                id: 'daily_kills',
                name: '每日击杀',
                description: '击败50个敌人',
                progress: 0,
                target: 50,
                reward: { type: 'credits', amount: 200 },
                completed: false
            },
            {
                id: 'daily_survival',
                name: '生存挑战',
                description: '存活5分钟',
                progress: 0,
                target: 300000, // 5分钟（毫秒）
                reward: { type: 'gems', amount: 2 },
                completed: false
            },
            {
                id: 'daily_combo',
                name: '连击挑战',
                description: '达到30连击',
                progress: 0,
                target: 30,
                reward: { type: 'skillPoints', amount: 1 },
                completed: false
            }
        ];
    }
    
    // 解锁成就
    unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return;
        
        achievement.unlocked = true;
        
        // 给予奖励
        if (achievement.reward) {
            if (achievement.reward.type === 'skillPoints') {
                this.skillPoints += achievement.reward.amount;
                this.unspentSkillPoints += achievement.reward.amount;
            } else {
                this.addCurrency(achievement.reward.type, achievement.reward.amount);
            }
        }
        
        // 显示成就解锁
        if (window.uiManager) {
            uiManager.showNotification('成就解锁！', achievement.name, 'success');
        }
        
        // 播放成就音效
        audioManager.playSound('powerup', 0.5, 1.5);
        
        this.saveProgress();
    }
    
    // 事件处理器
    onEnemyDeath(enemyData) {
        // 添加经验和货币
        this.addExperience(enemyData.expValue || 10);
        this.addCurrency('credits', enemyData.creditValue || 5);
        
        // 更新成就进度
        if (!this.achievements.first_kill.unlocked) {
            this.unlockAchievement('first_kill');
        }
        
        // 更新每日任务
        const dailyKills = this.dailyQuests.find(q => q.id === 'daily_kills');
        if (dailyKills && !dailyKills.completed) {
            dailyKills.progress++;
            if (dailyKills.progress >= dailyKills.target) {
                this.completeDailyQuest('daily_kills');
            }
        }
        
        // 更新收藏家成就
        if (!this.achievements.collector.unlocked) {
            // 这个会在道具收集时更新
        }
    }
    
    onComboAdd(comboData) {
        // 检查连击成就
        if (comboData.current >= 50 && !this.achievements.combo_master.unlocked) {
            this.unlockAchievement('combo_master');
        }
        
        // 更新每日连击任务
        const dailyCombo = this.dailyQuests.find(q => q.id === 'daily_combo');
        if (dailyCombo && !dailyCombo.completed) {
            dailyCombo.progress = Math.max(dailyCombo.progress, comboData.current);
            if (dailyCombo.progress >= dailyCombo.target) {
                this.completeDailyQuest('daily_combo');
            }
        }
    }
    
    onPowerupCollected(powerupData) {
        // 更新收藏家成就
        if (!this.achievements.collector.unlocked) {
            this.achievements.collector.progress++;
            if (this.achievements.collector.progress >= this.achievements.collector.target) {
                this.unlockAchievement('collector');
            }
        }
    }
    
    // 完成每日任务
    completeDailyQuest(questId) {
        const quest = this.dailyQuests.find(q => q.id === questId);
        if (!quest || quest.completed) return;
        
        quest.completed = true;
        
        // 给予奖励
        if (quest.reward.type === 'skillPoints') {
            this.skillPoints += quest.reward.amount;
            this.unspentSkillPoints += quest.reward.amount;
        } else {
            this.addCurrency(quest.reward.type, quest.reward.amount);
        }
        
        // 显示通知
        if (window.uiManager) {
            uiManager.showNotification('任务完成！', quest.name, 'success');
        }
        
        audioManager.playSound('powerup', 0.4, 1.2);
    }
    
    // 更新进展系统
    update(deltaTime) {
        // 更新增益效果
        this.updateBuffs(deltaTime);
        
        // 更新生存时间成就
        if (window.gameManager && gameManager.survivalTime >= 600000) { // 10分钟
            if (!this.achievements.survivor.unlocked) {
                this.unlockAchievement('survivor');
            }
        }
        
        // 更新每日生存任务
        const dailySurvival = this.dailyQuests.find(q => q.id === 'daily_survival');
        if (dailySurvival && !dailySurvival.completed && window.gameManager) {
            dailySurvival.progress = gameManager.survivalTime;
            if (dailySurvival.progress >= dailySurvival.target) {
                this.completeDailyQuest('daily_survival');
            }
        }
        
        // 能量恢复
        if (this.currencies.energy < this.currencies.maxEnergy) {
            this.currencies.energy += 0.5 * deltaTime / 1000;
            this.currencies.energy = Math.min(this.currencies.maxEnergy, this.currencies.energy);
        }
    }
    
    // 更新增益效果
    updateBuffs(deltaTime) {
        const now = Date.now();
        
        this.activeBuffs.forEach((buff, buffType) => {
            const elapsed = now - buff.startTime;
            if (elapsed >= buff.duration) {
                this.activeBuffs.delete(buffType);
                
                // 显示效果结束通知
                if (window.uiManager) {
                    uiManager.showNotification('增益效果结束', buffType, 'warning');
                }
            }
        });
    }
    
    // 创建经验获得效果
    createExpGainEffect(x, y, amount) {
        effectsManager.createParticle(x, y, {
            vx: 0,
            vy: -2,
            life: 2.0,
            size: 3,
            color: '#00ff00',
            glow: true,
            type: 'exp_gain',
            text: `+${amount} EXP`
        });
    }
    
    // 更新进展UI
    updateProgressionUI() {
        // 更新等级显示
        if (this.levelDisplay) {
            const levelNumber = this.levelDisplay.querySelector('.level-number');
            const expFill = this.levelDisplay.querySelector('.exp-fill');
            const expText = this.levelDisplay.querySelector('.exp-text');
            
            if (levelNumber) levelNumber.textContent = this.playerLevel;
            if (expFill) {
                const expPercent = (this.experience / this.experienceToNextLevel) * 100;
                expFill.style.width = `${expPercent}%`;
            }
            if (expText) {
                expText.textContent = `${this.experience} / ${this.experienceToNextLevel}`;
            }
        }
        
        // 更新货币显示
        if (this.currencyDisplay) {
            const creditsAmount = this.currencyDisplay.querySelector('#creditsAmount');
            const gemsAmount = this.currencyDisplay.querySelector('#gemsAmount');
            const scrapAmount = this.currencyDisplay.querySelector('#scrapAmount');
            
            if (creditsAmount) creditsAmount.textContent = this.currencies.credits;
            if (gemsAmount) gemsAmount.textContent = this.currencies.gems;
            if (scrapAmount) scrapAmount.textContent = this.currencies.scrap;
        }
        
        // 更新技能点显示
        if (this.skillPointsDisplay) {
            const skillPointsAmount = this.skillPointsDisplay.querySelector('.skill-points-amount');
            if (skillPointsAmount) skillPointsAmount.textContent = this.unspentSkillPoints;
            
            if (this.unspentSkillPoints > 0) {
                this.skillPointsDisplay.classList.remove('hidden');
                this.skillPointsDisplay.classList.add('pulsing');
            } else {
                this.skillPointsDisplay.classList.add('hidden');
                this.skillPointsDisplay.classList.remove('pulsing');
            }
        }
    }
    
    // 保存进度
    saveProgress() {
        const saveData = {
            playerLevel: this.playerLevel,
            experience: this.experience,
            experienceToNextLevel: this.experienceToNextLevel,
            totalExperience: this.totalExperience,
            skillPoints: this.skillPoints,
            unspentSkillPoints: this.unspentSkillPoints,
            currencies: this.currencies,
            skillTree: this.skillTree,
            equipment: this.equipment,
            inventory: this.inventory,
            achievements: this.achievements,
            dailyQuests: this.dailyQuests
        };
        
        localStorage.setItem('spaceShooterProgress', JSON.stringify(saveData));
    }
    
    // 加载进度
    loadProgress() {
        try {
            const saveData = localStorage.getItem('spaceShooterProgress');
            if (saveData) {
                const data = JSON.parse(saveData);
                
                this.playerLevel = data.playerLevel || 1;
                this.experience = data.experience || 0;
                this.experienceToNextLevel = data.experienceToNextLevel || 100;
                this.totalExperience = data.totalExperience || 0;
                this.skillPoints = data.skillPoints || 0;
                this.unspentSkillPoints = data.unspentSkillPoints || 0;
                
                if (data.currencies) {
                    Object.assign(this.currencies, data.currencies);
                }
                
                if (data.skillTree) {
                    // 合并技能树数据，保持结构
                    Object.keys(data.skillTree).forEach(category => {
                        if (this.skillTree[category]) {
                            Object.keys(data.skillTree[category].skills).forEach(skillName => {
                                if (this.skillTree[category].skills[skillName]) {
                                    this.skillTree[category].skills[skillName].currentLevel = 
                                        data.skillTree[category].skills[skillName].currentLevel || 0;
                                }
                            });
                        }
                    });
                }
                
                if (data.equipment) {
                    this.equipment = data.equipment;
                }
                
                if (data.inventory) {
                    this.inventory = data.inventory;
                }
                
                if (data.achievements) {
                    Object.assign(this.achievements, data.achievements);
                }
                
                if (data.dailyQuests && data.dailyQuests.length > 0) {
                    this.dailyQuests = data.dailyQuests;
                }
                
                this.updateProgressionUI();
            }
        } catch (error) {
            console.warn('无法加载进度数据:', error);
        }
    }
    
    // 重置进度
    resetProgress() {
        localStorage.removeItem('spaceShooterProgress');
        
        // 重置所有数据到初始状态
        this.playerLevel = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;
        this.totalExperience = 0;
        this.skillPoints = 0;
        this.unspentSkillPoints = 0;
        
        this.currencies = {
            credits: 0,
            gems: 0,
            scrap: 0,
            energy: 100,
            maxEnergy: 100
        };
        
        // 重置技能树
        Object.values(this.skillTree).forEach(category => {
            Object.values(category.skills).forEach(skill => {
                skill.currentLevel = 0;
            });
        });
        
        this.equipment = {
            weapon: null,
            armor: null,
            accessory1: null,
            accessory2: null,
            special: null
        };
        
        this.inventory = [];
        
        // 重置成就
        Object.values(this.achievements).forEach(achievement => {
            achievement.unlocked = false;
            if (achievement.progress !== undefined) {
                achievement.progress = 0;
            }
        });
        
        this.generateDailyQuests();
        this.updateProgressionUI();
    }
    
    // 获取进展统计
    getStats() {
        const totalSkillsLearned = Object.values(this.skillTree).reduce((total, category) => {
            return total + Object.values(category.skills).reduce((categoryTotal, skill) => {
                return categoryTotal + skill.currentLevel;
            }, 0);
        }, 0);
        
        const unlockedAchievements = Object.values(this.achievements).filter(a => a.unlocked).length;
        const totalAchievements = Object.keys(this.achievements).length;
        
        const equippedItems = Object.values(this.equipment).filter(item => item !== null).length;
        
        return {
            playerLevel: this.playerLevel,
            totalExperience: this.totalExperience,
            skillPointsSpent: this.skillPoints - this.unspentSkillPoints,
            totalSkillsLearned: totalSkillsLearned,
            currencies: { ...this.currencies },
            achievementProgress: `${unlockedAchievements}/${totalAchievements}`,
            inventoryUsage: `${this.inventory.length}/${this.maxInventorySize}`,
            equippedItems: equippedItems,
            activeBuffs: this.activeBuffs.size
        };
    }
    
    // 清理资源
    cleanup() {
        if (this.levelDisplay && this.levelDisplay.parentNode) {
            this.levelDisplay.parentNode.removeChild(this.levelDisplay);
        }
        if (this.currencyDisplay && this.currencyDisplay.parentNode) {
            this.currencyDisplay.parentNode.removeChild(this.currencyDisplay);
        }
        if (this.skillPointsDisplay && this.skillPointsDisplay.parentNode) {
            this.skillPointsDisplay.parentNode.removeChild(this.skillPointsDisplay);
        }
    }
}

// 创建全局进展系统实例
const progressionSystem = new ProgressionSystem();
