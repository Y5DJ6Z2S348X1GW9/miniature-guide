// 时间特效系统模块 - timeeffects.js

class TimeEffectsManager {
    constructor() {
        // 时间缩放
        this.timeScale = 1.0;
        this.targetTimeScale = 1.0;
        this.timeScaleTransition = 0;
        this.transitionSpeed = 3.0;
        
        // 时间特效状态
        this.effects = {
            bulletTime: {
                active: false,
                scale: 0.3,
                duration: 0,
                maxDuration: 2000,
                cooldown: 0,
                maxCooldown: 15000,
                energy: 100,
                maxEnergy: 100,
                drainRate: 50, // 每秒消耗50点能量
                regenRate: 20  // 每秒恢复20点能量
            },
            freeze: {
                active: false,
                scale: 0.0,
                duration: 0,
                maxDuration: 1000,
                cooldown: 0,
                maxCooldown: 20000
            },
            accelerate: {
                active: false,
                scale: 2.0,
                duration: 0,
                maxDuration: 1500,
                cooldown: 0,
                maxCooldown: 10000
            }
        };
        
        // 视觉效果
        this.visualEffects = {
            trails: [],
            ripples: [],
            chronoParticles: []
        };
        
        // 音效配置
        this.audioEffects = {
            slowMotion: false,
            echoDelay: 0.3,
            reverbAmount: 0.8
        };
        
        // UI元素
        this.timeUI = null;
        this.createTimeUI();
        
        // 粒子系统（时间扭曲效果）
        this.timeParticles = [];
        this.maxTimeParticles = 50;
        
        // 性能优化
        this.updateCounter = 0;
        this.skipFrames = 0;
    }
    
    // 创建时间特效UI
    createTimeUI() {
        this.timeUI = document.createElement('div');
        this.timeUI.id = 'timeEffectsUI';
        this.timeUI.className = 'time-effects-ui';
        
        // 子弹时间能量条
        this.bulletTimeBar = document.createElement('div');
        this.bulletTimeBar.className = 'bullet-time-bar';
        
        this.bulletTimeLabel = document.createElement('div');
        this.bulletTimeLabel.className = 'time-label';
        this.bulletTimeLabel.textContent = '子弹时间';
        
        this.bulletTimeProgress = document.createElement('div');
        this.bulletTimeProgress.className = 'time-progress';
        
        this.bulletTimeFill = document.createElement('div');
        this.bulletTimeFill.className = 'time-progress-fill bullet-time-fill';
        this.bulletTimeProgress.appendChild(this.bulletTimeFill);
        
        this.bulletTimeBar.appendChild(this.bulletTimeLabel);
        this.bulletTimeBar.appendChild(this.bulletTimeProgress);
        
        // 时间特效指示器
        this.timeIndicator = document.createElement('div');
        this.timeIndicator.className = 'time-indicator hidden';
        this.timeIndicator.textContent = '时间操控激活';
        
        // 组装UI
        this.timeUI.appendChild(this.bulletTimeBar);
        this.timeUI.appendChild(this.timeIndicator);
        
        // 添加到游戏UI
        const gameUI = document.getElementById('gameUI');
        if (gameUI) {
            gameUI.appendChild(this.timeUI);
        }
    }
    
    // 激活子弹时间
    activateBulletTime(duration = null) {
        const effect = this.effects.bulletTime;
        
        if (effect.cooldown > 0 || effect.energy < 20) {
            return false;
        }
        
        effect.active = true;
        effect.duration = duration || effect.maxDuration;
        this.targetTimeScale = effect.scale;
        
        // 视觉效果
        this.createTimeDistortion();
        this.startTimeTrails();
        
        // 音效
        this.activateSlowMotionAudio();
        audioManager.playSound('warning', 0.4, 0.7);
        
        // UI反馈
        this.updateTimeUI();
        this.showTimeIndicator('子弹时间');
        
        return true;
    }
    
    // 激活时间冻结
    activateTimeFreeze(duration = null) {
        const effect = this.effects.freeze;
        
        if (effect.cooldown > 0) {
            return false;
        }
        
        effect.active = true;
        effect.duration = duration || effect.maxDuration;
        effect.cooldown = effect.maxCooldown;
        this.targetTimeScale = effect.scale;
        
        // 特殊视觉效果
        this.createFreezeEffect();
        
        // 音效
        audioManager.playSound('shield', 0.6, 0.5);
        
        // UI反馈
        this.showTimeIndicator('时间冻结');
        
        return true;
    }
    
    // 激活时间加速
    activateTimeAccelerate(duration = null) {
        const effect = this.effects.accelerate;
        
        if (effect.cooldown > 0) {
            return false;
        }
        
        effect.active = true;
        effect.duration = duration || effect.maxDuration;
        effect.cooldown = effect.maxCooldown;
        this.targetTimeScale = effect.scale;
        
        // 视觉效果
        this.createAccelerateEffect();
        
        // 音效
        audioManager.playSound('powerup', 0.5, 1.5);
        
        // UI反馈
        this.showTimeIndicator('时间加速');
        
        return true;
    }
    
    // 停用所有时间特效
    deactivateAllEffects() {
        Object.keys(this.effects).forEach(key => {
            const effect = this.effects[key];
            effect.active = false;
            effect.duration = 0;
        });
        
        this.targetTimeScale = 1.0;
        this.deactivateSlowMotionAudio();
        this.clearVisualEffects();
        this.hideTimeIndicator();
    }
    
    // 更新时间特效系统
    update(deltaTime) {
        this.updateCounter++;
        
        // 性能优化：每3帧更新一次某些效果
        if (this.updateCounter % 3 === 0) {
            this.updateTimeParticles(deltaTime);
            this.updateVisualEffects(deltaTime);
        }
        
        // 更新时间特效
        this.updateTimeEffects(deltaTime);
        
        // 更新时间缩放过渡
        this.updateTimeScale(deltaTime);
        
        // 更新UI
        this.updateTimeUI();
        
        // 创建时间扭曲粒子
        if (this.timeScale !== 1.0 && Math.random() < 0.1) {
            this.createTimeParticle();
        }
    }
    
    // 更新时间特效状态
    updateTimeEffects(deltaTime) {
        let anyActive = false;
        
        Object.keys(this.effects).forEach(key => {
            const effect = this.effects[key];
            
            // 更新持续时间
            if (effect.active) {
                effect.duration -= deltaTime;
                anyActive = true;
                
                // 子弹时间能量消耗
                if (key === 'bulletTime' && effect.active) {
                    effect.energy -= effect.drainRate * deltaTime / 1000;
                    if (effect.energy <= 0) {
                        effect.energy = 0;
                        effect.duration = 0; // 强制结束
                    }
                }
                
                if (effect.duration <= 0) {
                    effect.active = false;
                    effect.duration = 0;
                    
                    if (key === 'bulletTime') {
                        this.deactivateSlowMotionAudio();
                    }
                }
            }
            
            // 更新冷却时间
            if (effect.cooldown > 0) {
                effect.cooldown -= deltaTime;
                if (effect.cooldown < 0) {
                    effect.cooldown = 0;
                }
            }
            
            // 子弹时间能量恢复
            if (key === 'bulletTime' && !effect.active && effect.energy < effect.maxEnergy) {
                effect.energy += effect.regenRate * deltaTime / 1000;
                effect.energy = Math.min(effect.energy, effect.maxEnergy);
            }
        });
        
        // 如果没有特效激活，恢复正常时间
        if (!anyActive) {
            this.targetTimeScale = 1.0;
            this.hideTimeIndicator();
        }
    }
    
    // 更新时间缩放
    updateTimeScale(deltaTime) {
        if (Math.abs(this.timeScale - this.targetTimeScale) > 0.01) {
            const transition = this.transitionSpeed * deltaTime / 1000;
            this.timeScale = this.lerp(this.timeScale, this.targetTimeScale, transition);
        } else {
            this.timeScale = this.targetTimeScale;
        }
        
        // 确定时间缩放范围
        this.timeScale = Math.max(0, Math.min(3.0, this.timeScale));
    }
    
    // 创建时间扭曲粒子
    createTimeParticle() {
        if (this.timeParticles.length >= this.maxTimeParticles) {
            this.timeParticles.shift();
        }
        
        const particle = {
            x: Math.random() * 1200,
            y: Math.random() * 800,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1.0,
            maxLife: 1.0,
            size: 1 + Math.random() * 3,
            color: this.getTimeEffectColor(),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        };
        
        this.timeParticles.push(particle);
    }
    
    // 更新时间粒子
    updateTimeParticles(deltaTime) {
        for (let i = this.timeParticles.length - 1; i >= 0; i--) {
            const particle = this.timeParticles[i];
            
            // 更新位置
            particle.x += particle.vx * deltaTime / 16;
            particle.y += particle.vy * deltaTime / 16;
            particle.rotation += particle.rotationSpeed * deltaTime / 16;
            
            // 更新生命
            particle.life -= deltaTime / 2000; // 2秒生命周期
            
            // 移除死亡粒子
            if (particle.life <= 0) {
                this.timeParticles.splice(i, 1);
            }
        }
    }
    
    // 创建时间扭曲效果
    createTimeDistortion() {
        // 在屏幕边缘创建波纹效果
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const x = 600 + Math.cos(angle) * 400;
            const y = 400 + Math.sin(angle) * 300;
            
            this.createTimeRipple(x, y, 50, '#64b5f6');
        }
    }
    
    // 创建时间波纹
    createTimeRipple(x, y, maxRadius, color) {
        const ripple = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: maxRadius,
            life: 1.0,
            color: color,
            width: 3
        };
        
        this.visualEffects.ripples.push(ripple);
    }
    
    // 创建冻结效果
    createFreezeEffect() {
        // 创建冰晶粒子
        for (let i = 0; i < 20; i++) {
            const particle = {
                x: Math.random() * 1200,
                y: Math.random() * 800,
                vx: 0,
                vy: 0,
                life: 1.0,
                size: 2 + Math.random() * 4,
                color: '#87ceeb',
                type: 'freeze'
            };
            
            this.visualEffects.chronoParticles.push(particle);
        }
        
        // 屏幕边缘结冰效果
        document.body.classList.add('time-freeze');
    }
    
    // 创建加速效果
    createAccelerateEffect() {
        // 创建能量线条
        for (let i = 0; i < 15; i++) {
            const trail = {
                x: Math.random() * 1200,
                y: Math.random() * 800,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 0.5,
                color: '#ffff00',
                width: 2
            };
            
            this.visualEffects.trails.push(trail);
        }
        
        document.body.classList.add('time-accelerate');
    }
    
    // 开始时间轨迹效果
    startTimeTrails() {
        document.body.classList.add('bullet-time-trails');
    }
    
    // 更新视觉效果
    updateVisualEffects(deltaTime) {
        // 更新波纹
        for (let i = this.visualEffects.ripples.length - 1; i >= 0; i--) {
            const ripple = this.visualEffects.ripples[i];
            ripple.radius += 2 * deltaTime / 16;
            ripple.life -= deltaTime / 1000;
            
            if (ripple.life <= 0 || ripple.radius >= ripple.maxRadius) {
                this.visualEffects.ripples.splice(i, 1);
            }
        }
        
        // 更新轨迹
        for (let i = this.visualEffects.trails.length - 1; i >= 0; i--) {
            const trail = this.visualEffects.trails[i];
            trail.x += trail.vx * deltaTime / 16;
            trail.y += trail.vy * deltaTime / 16;
            trail.life -= deltaTime / 1000;
            
            if (trail.life <= 0) {
                this.visualEffects.trails.splice(i, 1);
            }
        }
        
        // 更新时间粒子
        for (let i = this.visualEffects.chronoParticles.length - 1; i >= 0; i--) {
            const particle = this.visualEffects.chronoParticles[i];
            particle.life -= deltaTime / 2000;
            
            if (particle.life <= 0) {
                this.visualEffects.chronoParticles.splice(i, 1);
            }
        }
    }
    
    // 清理视觉效果
    clearVisualEffects() {
        this.visualEffects.ripples = [];
        this.visualEffects.trails = [];
        this.visualEffects.chronoParticles = [];
        
        document.body.classList.remove('bullet-time-trails', 'time-freeze', 'time-accelerate');
    }
    
    // 激活慢动作音效
    activateSlowMotionAudio() {
        this.audioEffects.slowMotion = true;
        // 这里可以添加音效处理逻辑
    }
    
    // 停用慢动作音效
    deactivateSlowMotionAudio() {
        this.audioEffects.slowMotion = false;
    }
    
    // 更新时间UI
    updateTimeUI() {
        if (!this.timeUI) return;
        
        const bulletTime = this.effects.bulletTime;
        
        // 更新子弹时间能量条
        const energyPercent = bulletTime.energy / bulletTime.maxEnergy;
        this.bulletTimeFill.style.width = (energyPercent * 100) + '%';
        
        // 根据能量状态改变颜色
        if (energyPercent < 0.2) {
            this.bulletTimeFill.style.backgroundColor = '#ff4444';
        } else if (energyPercent < 0.5) {
            this.bulletTimeFill.style.backgroundColor = '#ffaa00';
        } else {
            this.bulletTimeFill.style.backgroundColor = '#64b5f6';
        }
        
        // 冷却时间指示
        if (bulletTime.cooldown > 0) {
            this.bulletTimeBar.classList.add('cooldown');
            const cooldownPercent = bulletTime.cooldown / bulletTime.maxCooldown;
            this.bulletTimeBar.style.setProperty('--cooldown-progress', cooldownPercent);
        } else {
            this.bulletTimeBar.classList.remove('cooldown');
        }
    }
    
    // 显示时间指示器
    showTimeIndicator(text) {
        if (this.timeIndicator) {
            this.timeIndicator.textContent = text;
            this.timeIndicator.classList.remove('hidden');
        }
    }
    
    // 隐藏时间指示器
    hideTimeIndicator() {
        if (this.timeIndicator) {
            this.timeIndicator.classList.add('hidden');
        }
    }
    
    // 获取时间特效颜色
    getTimeEffectColor() {
        if (this.effects.bulletTime.active) return '#64b5f6';
        if (this.effects.freeze.active) return '#87ceeb';
        if (this.effects.accelerate.active) return '#ffff00';
        return '#ffffff';
    }
    
    // 渲染时间特效
    render(ctx) {
        if (!ctx) return;
        
        ctx.save();
        
        // 渲染时间粒子
        this.renderTimeParticles(ctx);
        
        // 渲染波纹效果
        this.renderRipples(ctx);
        
        // 渲染轨迹效果
        this.renderTrails(ctx);
        
        // 渲染时间粒子
        this.renderChronoParticles(ctx);
        
        // 渲染时间扭曲overlay
        this.renderTimeOverlay(ctx);
        
        ctx.restore();
    }
    
    // 渲染时间粒子
    renderTimeParticles(ctx) {
        for (const particle of this.timeParticles) {
            const alpha = particle.life / particle.maxLife;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.size * 2;
            
            ctx.beginPath();
            ctx.rect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    // 渲染波纹
    renderRipples(ctx) {
        for (const ripple of this.visualEffects.ripples) {
            const alpha = ripple.life;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = ripple.color;
            ctx.lineWidth = ripple.width;
            
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    // 渲染轨迹
    renderTrails(ctx) {
        for (const trail of this.visualEffects.trails) {
            const alpha = trail.life;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = trail.color;
            ctx.lineWidth = trail.width;
            
            ctx.beginPath();
            ctx.moveTo(trail.x, trail.y);
            ctx.lineTo(trail.x - trail.vx * 5, trail.y - trail.vy * 5);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    // 渲染时间粒子
    renderChronoParticles(ctx) {
        for (const particle of this.visualEffects.chronoParticles) {
            const alpha = particle.life;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.size;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    // 渲染时间扭曲覆盖层
    renderTimeOverlay(ctx) {
        if (this.timeScale !== 1.0) {
            ctx.save();
            
            // 根据时间缩放程度调整覆盖层
            let overlayColor, alpha;
            
            if (this.timeScale < 1.0) {
                // 慢动作 - 蓝色调
                overlayColor = 'rgba(100, 181, 246, ';
                alpha = (1.0 - this.timeScale) * 0.1;
            } else {
                // 加速 - 黄色调
                overlayColor = 'rgba(255, 255, 0, ';
                alpha = (this.timeScale - 1.0) * 0.05;
            }
            
            ctx.fillStyle = overlayColor + alpha + ')';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            ctx.restore();
        }
    }
    
    // 线性插值
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    // 获取当前时间缩放
    getTimeScale() {
        return this.timeScale;
    }
    
    // 检查特定效果是否激活
    isEffectActive(effectName) {
        return this.effects[effectName] && this.effects[effectName].active;
    }
    
    // 获取特效统计
    getStats() {
        return {
            timeScale: this.timeScale,
            effects: { ...this.effects },
            particleCount: this.timeParticles.length,
            visualEffectCount: 
                this.visualEffects.ripples.length + 
                this.visualEffects.trails.length + 
                this.visualEffects.chronoParticles.length
        };
    }
    
    // 重置时间特效系统
    reset() {
        this.deactivateAllEffects();
        this.timeScale = 1.0;
        this.targetTimeScale = 1.0;
        this.timeParticles = [];
        this.clearVisualEffects();
        
        // 重置能量
        this.effects.bulletTime.energy = this.effects.bulletTime.maxEnergy;
        
        this.updateTimeUI();
    }
    
    // 清理资源
    cleanup() {
        this.reset();
        
        if (this.timeUI && this.timeUI.parentNode) {
            this.timeUI.parentNode.removeChild(this.timeUI);
        }
    }
}

// 创建全局时间特效管理器实例
const timeEffectsManager = new TimeEffectsManager();
