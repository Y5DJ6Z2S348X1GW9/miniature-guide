// 连击系统模块 - combo.js

class ComboSystem {
    constructor() {
        // 连击数据
        this.currentCombo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.comboTimeout = 3000; // 3秒内未击杀敌人则重置连击
        
        // 连击阶段
        this.comboTiers = [
            { threshold: 0, name: '无', multiplier: 1.0, color: '#ffffff' },
            { threshold: 5, name: '不错', multiplier: 1.2, color: '#ffff00' },
            { threshold: 10, name: '良好', multiplier: 1.5, color: '#ff8c00' },
            { threshold: 20, name: '优秀', multiplier: 2.0, color: '#ff4500' },
            { threshold: 35, name: '完美', multiplier: 2.5, color: '#ff0080' },
            { threshold: 50, name: '无敌', multiplier: 3.0, color: '#8000ff' },
            { threshold: 75, name: '传奇', multiplier: 4.0, color: '#00ff80' },
            { threshold: 100, name: '神话', multiplier: 5.0, color: '#00ffff' }
        ];
        
        // 连击奖励
        this.comboRewards = {
            score: true,        // 分数倍增
            fireRate: true,     // 射速提升
            damage: true,       // 伤害提升
            shield: false,      // 护盾奖励
            health: false       // 生命奖励
        };
        
        // 特殊连击效果
        this.specialEffects = {
            bulletTime: { active: false, duration: 0, cooldown: 0 },
            multiShot: { active: false, duration: 0, cooldown: 0 },
            piercing: { active: false, duration: 0, cooldown: 0 }
        };
        
        // UI元素
        this.comboDisplay = null;
        this.comboText = null;
        this.createComboUI();
        
        // 视觉效果
        this.particles = [];
        this.screenFlash = { active: false, intensity: 0, duration: 0 };
        
        // 音效延迟（避免过多音效）
        this.lastSoundTime = 0;
        this.soundCooldown = 100;
    }
    
    // 创建连击UI
    createComboUI() {
        // 创建连击显示容器
        this.comboDisplay = document.createElement('div');
        this.comboDisplay.id = 'comboDisplay';
        this.comboDisplay.className = 'combo-display hidden';
        
        // 连击数字
        this.comboText = document.createElement('div');
        this.comboText.className = 'combo-text';
        this.comboText.textContent = '0';
        
        // 连击标签
        this.comboLabel = document.createElement('div');
        this.comboLabel.className = 'combo-label';
        this.comboLabel.textContent = 'COMBO';
        
        // 连击等级
        this.comboTier = document.createElement('div');
        this.comboTier.className = 'combo-tier';
        this.comboTier.textContent = '';
        
        // 连击进度条
        this.comboProgress = document.createElement('div');
        this.comboProgress.className = 'combo-progress';
        
        this.comboProgressFill = document.createElement('div');
        this.comboProgressFill.className = 'combo-progress-fill';
        this.comboProgress.appendChild(this.comboProgressFill);
        
        // 组装UI
        this.comboDisplay.appendChild(this.comboText);
        this.comboDisplay.appendChild(this.comboLabel);
        this.comboDisplay.appendChild(this.comboTier);
        this.comboDisplay.appendChild(this.comboProgress);
        
        // 添加到游戏界面
        const gameUI = document.getElementById('gameUI');
        if (gameUI) {
            gameUI.appendChild(this.comboDisplay);
        }
    }
    
    // 增加连击
    addCombo(amount = 1) {
        this.currentCombo += amount;
        this.maxCombo = Math.max(this.maxCombo, this.currentCombo);
        this.comboTimer = this.comboTimeout;
        
        // 更新UI
        this.updateComboUI();
        
        // 创建视觉效果
        this.createComboEffect();
        
        // 播放音效
        this.playComboSound();
        
        // 检查特殊效果触发
        this.checkSpecialEffects();
        
        // 发送连击事件
        this.dispatchComboEvent('combo-add', {
            current: this.currentCombo,
            tier: this.getCurrentTier(),
            multiplier: this.getScoreMultiplier()
        });
    }
    
    // 重置连击
    resetCombo() {
        if (this.currentCombo > 0) {
            this.dispatchComboEvent('combo-break', {
                brokenCombo: this.currentCombo,
                maxCombo: this.maxCombo
            });
            
            this.currentCombo = 0;
            this.comboTimer = 0;
            
            // 重置特殊效果
            this.resetSpecialEffects();
            
            // 更新UI
            this.updateComboUI();
            
            // 连击断裂效果
            this.createComboBreakEffect();
            
            // 播放连击断裂音效
            audioManager.playSound('warning', 0.3);
        }
    }
    
    // 更新连击系统
    update(deltaTime) {
        // 更新连击计时器
        if (this.currentCombo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
        
        // 更新特殊效果
        this.updateSpecialEffects(deltaTime);
        
        // 更新视觉效果
        this.updateVisualEffects(deltaTime);
        
        // 更新UI动画
        this.updateComboUIAnimation(deltaTime);
    }
    
    // 更新连击UI
    updateComboUI() {
        if (!this.comboDisplay) return;
        
        const tier = this.getCurrentTier();
        
        // 更新连击数字
        this.comboText.textContent = this.currentCombo;
        this.comboText.style.color = tier.color;
        
        // 更新连击等级
        this.comboTier.textContent = tier.name;
        this.comboTier.style.color = tier.color;
        
        // 更新进度条
        const nextTier = this.getNextTier();
        if (nextTier) {
            const progress = (this.currentCombo - tier.threshold) / 
                           (nextTier.threshold - tier.threshold);
            this.comboProgressFill.style.width = (progress * 100) + '%';
            this.comboProgressFill.style.backgroundColor = tier.color;
        } else {
            this.comboProgressFill.style.width = '100%';
            this.comboProgressFill.style.backgroundColor = tier.color;
        }
        
        // 显示/隐藏连击显示
        if (this.currentCombo > 0) {
            this.comboDisplay.classList.remove('hidden');
        } else {
            this.comboDisplay.classList.add('hidden');
        }
        
        // 连击超时警告
        if (this.comboTimer < 1000 && this.currentCombo > 5) {
            this.comboDisplay.classList.add('combo-warning');
        } else {
            this.comboDisplay.classList.remove('combo-warning');
        }
    }
    
    // 创建连击效果
    createComboEffect() {
        const tier = this.getCurrentTier();
        
        // 屏幕闪光
        if (this.currentCombo % 10 === 0 && this.currentCombo >= 10) {
            this.screenFlash.active = true;
            this.screenFlash.intensity = Math.min(0.3, this.currentCombo * 0.01);
            this.screenFlash.duration = 200;
        }
        
        // 粒子爆发
        if (player) {
            const particleCount = Math.min(this.currentCombo, 20);
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = 2 + Math.random() * 3;
                
                effectsManager.createParticle(player.x, player.y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    size: 2 + Math.random() * 2,
                    color: tier.color,
                    glow: true,
                    type: 'combo'
                });
            }
        }
        
        // 连击里程碑效果
        if (this.isComboMilestone(this.currentCombo)) {
            this.createMilestoneEffect();
        }
    }
    
    // 创建连击断裂效果
    createComboBreakEffect() {
        if (player) {
            // 红色粒子爆发
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 4;
                
                effectsManager.createParticle(player.x, player.y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.8,
                    size: 3,
                    color: '#ff0000',
                    glow: true,
                    type: 'combo-break'
                });
            }
        }
    }
    
    // 创建里程碑效果
    createMilestoneEffect() {
        const tier = this.getCurrentTier();
        
        // 大型爆发效果
        if (player) {
            effectsManager.createExplosion(player.x, player.y, 2, 'powerup');
            
            // 环形粒子
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 * i) / 30;
                const speed = 4 + Math.random() * 2;
                
                effectsManager.createParticle(player.x, player.y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.5,
                    size: 4,
                    color: tier.color,
                    glow: true,
                    type: 'milestone'
                });
            }
        }
        
        // 屏幕震动
        effectsManager.addScreenShake(10, 500);
        
        // 显示连击通知
        if (window.uiManager) {
            uiManager.showNotification('连击达成！', `${tier.name} ${this.currentCombo}x`, 'success');
        }
    }
    
    // 播放连击音效
    playComboSound() {
        const currentTime = Date.now();
        if (currentTime - this.lastSoundTime < this.soundCooldown) {
            return;
        }
        
        const tier = this.getCurrentTier();
        let pitch = 1.0 + (this.currentCombo * 0.02);
        let volume = 0.3 + Math.min(this.currentCombo * 0.01, 0.3);
        
        audioManager.playSound('powerup', volume, pitch);
        this.lastSoundTime = currentTime;
    }
    
    // 检查特殊效果触发
    checkSpecialEffects() {
        const combo = this.currentCombo;
        
        // 子弹时间（每25连击）
        if (combo % 25 === 0 && combo >= 25) {
            this.activateBulletTime();
        }
        
        // 多重射击（每15连击）
        if (combo % 15 === 0 && combo >= 15) {
            this.activateMultiShot();
        }
        
        // 穿透子弹（每20连击）
        if (combo % 20 === 0 && combo >= 20) {
            this.activatePiercing();
        }
    }
    
    // 激活子弹时间
    activateBulletTime() {
        if (this.specialEffects.bulletTime.cooldown <= 0) {
            this.specialEffects.bulletTime.active = true;
            this.specialEffects.bulletTime.duration = 2000; // 2秒
            this.specialEffects.bulletTime.cooldown = 15000; // 15秒冷却
            
            // 通知游戏管理器
            if (window.gameManager) {
                gameManager.activateTimeEffect('slow', 0.3, 2000);
            }
            
            // 视觉效果
            document.body.classList.add('bullet-time');
            
            if (window.uiManager) {
                uiManager.showNotification('子弹时间！', '时间减缓激活', 'info');
            }
        }
    }
    
    // 激活多重射击
    activateMultiShot() {
        if (this.specialEffects.multiShot.cooldown <= 0) {
            this.specialEffects.multiShot.active = true;
            this.specialEffects.multiShot.duration = 5000; // 5秒
            this.specialEffects.multiShot.cooldown = 20000; // 20秒冷却
            
            if (window.uiManager) {
                uiManager.showNotification('多重射击！', '射击数量翻倍', 'info');
            }
        }
    }
    
    // 激活穿透子弹
    activatePiercing() {
        if (this.specialEffects.piercing.cooldown <= 0) {
            this.specialEffects.piercing.active = true;
            this.specialEffects.piercing.duration = 3000; // 3秒
            this.specialEffects.piercing.cooldown = 12000; // 12秒冷却
            
            if (window.uiManager) {
                uiManager.showNotification('穿透射击！', '子弹穿透敌人', 'info');
            }
        }
    }
    
    // 更新特殊效果
    updateSpecialEffects(deltaTime) {
        Object.keys(this.specialEffects).forEach(effectName => {
            const effect = this.specialEffects[effectName];
            
            // 更新持续时间
            if (effect.active && effect.duration > 0) {
                effect.duration -= deltaTime;
                if (effect.duration <= 0) {
                    this.deactivateSpecialEffect(effectName);
                }
            }
            
            // 更新冷却时间
            if (effect.cooldown > 0) {
                effect.cooldown -= deltaTime;
            }
        });
    }
    
    // 停用特殊效果
    deactivateSpecialEffect(effectName) {
        const effect = this.specialEffects[effectName];
        effect.active = false;
        effect.duration = 0;
        
        if (effectName === 'bulletTime') {
            document.body.classList.remove('bullet-time');
            if (window.gameManager) {
                gameManager.deactivateTimeEffect();
            }
        }
    }
    
    // 重置特殊效果
    resetSpecialEffects() {
        Object.keys(this.specialEffects).forEach(effectName => {
            this.deactivateSpecialEffect(effectName);
        });
    }
    
    // 更新视觉效果
    updateVisualEffects(deltaTime) {
        // 更新屏幕闪光
        if (this.screenFlash.active) {
            this.screenFlash.duration -= deltaTime;
            if (this.screenFlash.duration <= 0) {
                this.screenFlash.active = false;
                document.body.classList.remove('screen-flash');
            } else {
                document.body.classList.add('screen-flash');
                document.body.style.setProperty('--flash-intensity', this.screenFlash.intensity);
            }
        }
    }
    
    // 更新UI动画
    updateComboUIAnimation(deltaTime) {
        if (this.comboDisplay && !this.comboDisplay.classList.contains('hidden')) {
            // 连击数字脉冲动画
            const tier = this.getCurrentTier();
            const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
            this.comboText.style.transform = `scale(${scale})`;
            
            // 颜色渐变
            const hue = (Date.now() * 0.1) % 360;
            if (this.currentCombo >= 50) {
                this.comboText.style.color = `hsl(${hue}, 100%, 60%)`;
            }
        }
    }
    
    // 获取当前连击等级
    getCurrentTier() {
        let currentTier = this.comboTiers[0];
        for (const tier of this.comboTiers) {
            if (this.currentCombo >= tier.threshold) {
                currentTier = tier;
            } else {
                break;
            }
        }
        return currentTier;
    }
    
    // 获取下一个连击等级
    getNextTier() {
        for (const tier of this.comboTiers) {
            if (this.currentCombo < tier.threshold) {
                return tier;
            }
        }
        return null;
    }
    
    // 获取分数倍增器
    getScoreMultiplier() {
        return this.getCurrentTier().multiplier;
    }
    
    // 获取射速加成
    getFireRateBonus() {
        if (!this.comboRewards.fireRate) return 1.0;
        return 1.0 + Math.min(this.currentCombo * 0.01, 0.5); // 最多50%加成
    }
    
    // 获取伤害加成
    getDamageBonus() {
        if (!this.comboRewards.damage) return 1.0;
        return 1.0 + Math.min(this.currentCombo * 0.02, 1.0); // 最多100%加成
    }
    
    // 检查是否为连击里程碑
    isComboMilestone(combo) {
        const milestones = [10, 25, 50, 75, 100, 150, 200];
        return milestones.includes(combo);
    }
    
    // 发送连击事件
    dispatchComboEvent(eventType, data) {
        const event = new CustomEvent(eventType, { detail: data });
        document.dispatchEvent(event);
    }
    
    // 渲染连击效果
    render(ctx) {
        // 渲染子弹时间效果
        if (this.specialEffects.bulletTime.active) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 150, 255, 0.1)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }
        
        // 渲染屏幕闪光
        if (this.screenFlash.active) {
            ctx.save();
            ctx.globalAlpha = this.screenFlash.intensity;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }
    }
    
    // 获取连击统计
    getStats() {
        return {
            currentCombo: this.currentCombo,
            maxCombo: this.maxCombo,
            tier: this.getCurrentTier(),
            scoreMultiplier: this.getScoreMultiplier(),
            fireRateBonus: this.getFireRateBonus(),
            damageBonus: this.getDamageBonus(),
            specialEffects: { ...this.specialEffects }
        };
    }
    
    // 重置连击系统
    reset() {
        this.currentCombo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.resetSpecialEffects();
        this.updateComboUI();
        
        // 清理视觉效果
        this.screenFlash.active = false;
        document.body.classList.remove('bullet-time', 'screen-flash');
    }
    
    // 清理资源
    cleanup() {
        if (this.comboDisplay && this.comboDisplay.parentNode) {
            this.comboDisplay.parentNode.removeChild(this.comboDisplay);
        }
    }
}

// 创建全局连击系统实例
const comboSystem = new ComboSystem();
