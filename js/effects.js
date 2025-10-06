// 特效管理模块 - effects.js

class EffectsManager {
    constructor() {
        this.particles = [];
        this.explosions = [];
        this.trails = [];
        this.damageNumbers = [];
        this.screenEffects = [];
        
        // 特效配置
        this.maxParticles = 1000;
        this.maxExplosions = 50;
        this.maxTrails = 200;
        this.maxDamageNumbers = 30;
        
        // 预加载的图像
        this.explosionFrames = [];
        this.loadExplosionFrames();
        
        // 屏幕震动
        this.screenShake = {
            x: 0,
            y: 0,
            intensity: 0,
            duration: 0,
            decay: 0.9
        };
        
        // 背景效果
        this.backgroundStars = [];
        this.initBackgroundStars();
    }
    
    // 加载爆炸动画帧
    loadExplosionFrames() {
        for (let i = 0; i < 8; i++) {
            const img = new Image();
            img.src = `assets/images/explosion_${i}.png`;
            this.explosionFrames.push(img);
        }
    }
    
    // 初始化背景星星
    initBackgroundStars() {
        for (let i = 0; i < 50; i++) {
            this.backgroundStars.push({
                x: Math.random() * 1200,
                y: Math.random() * 800,
                speed: 0.5 + Math.random() * 2,
                brightness: 0.3 + Math.random() * 0.7,
                size: 1 + Math.random() * 2
            });
        }
    }
    
    // 创建粒子
    createParticle(x, y, config = {}) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // 移除最老的粒子
        }
        
        const particle = {
            x: x,
            y: y,
            vx: config.vx || (Math.random() - 0.5) * 4,
            vy: config.vy || (Math.random() - 0.5) * 4,
            life: config.life || 1.0,
            maxLife: config.life || 1.0,
            size: config.size || 2 + Math.random() * 3,
            color: config.color || `hsl(${Math.random() * 60 + 15}, 100%, 50%)`,
            gravity: config.gravity || 0,
            drag: config.drag || 0.98,
            glow: config.glow || false,
            type: config.type || 'default'
        };
        
        this.particles.push(particle);
        return particle;
    }
    
    // 创建爆炸效果
    createExplosion(x, y, size = 1, type = 'normal') {
        if (this.explosions.length >= this.maxExplosions) {
            this.explosions.shift();
        }
        
        const explosion = {
            x: x,
            y: y,
            frame: 0,
            maxFrames: this.explosionFrames.length,
            size: size,
            type: type,
            rotation: Math.random() * Math.PI * 2,
            frameTimer: 0,
            frameDelay: 3
        };
        
        this.explosions.push(explosion);
        
        // 创建爆炸粒子
        const particleCount = Math.floor(15 * size);
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 4;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                size: 1 + Math.random() * 3,
                color: type === 'enemy' ? 
                    `hsl(${Math.random() * 60}, 100%, 60%)` : 
                    `hsl(${Math.random() * 30 + 15}, 100%, 70%)`,
                glow: true,
                gravity: 0.1,
                drag: 0.95
            });
        }
        
        // 屏幕震动
        this.addScreenShake(size * 5, size * 100);
        
        return explosion;
    }
    
    // 创建轨迹效果
    createTrail(x, y, config = {}) {
        if (this.trails.length >= this.maxTrails) {
            this.trails.shift();
        }
        
        const trail = {
            points: [{ x, y, life: 1.0 }],
            maxPoints: config.maxPoints || 10,
            color: config.color || '#64b5f6',
            width: config.width || 2,
            life: config.life || 1.0,
            fadeSpeed: config.fadeSpeed || 0.05
        };
        
        this.trails.push(trail);
        return trail;
    }
    
    // 更新轨迹
    updateTrail(trail, x, y) {
        if (trail && trail.points) {
            trail.points.unshift({ x, y, life: 1.0 });
            
            if (trail.points.length > trail.maxPoints) {
                trail.points.pop();
            }
        }
    }
    
    // 创建伤害数字
    createDamageNumber(x, y, damage, type = 'normal') {
        if (this.damageNumbers.length >= this.maxDamageNumbers) {
            this.damageNumbers.shift();
        }
        
        const colors = {
            normal: '#ff4444',
            critical: '#ffaa00',
            heal: '#44ff44',
            shield: '#4444ff'
        };
        
        const damageNumber = {
            x: x + (Math.random() - 0.5) * 20,
            y: y,
            damage: Math.floor(damage),
            life: 1.0,
            vy: -2,
            color: colors[type] || colors.normal,
            type: type,
            scale: type === 'critical' ? 1.5 : 1.0
        };
        
        this.damageNumbers.push(damageNumber);
        return damageNumber;
    }
    
    // 添加屏幕震动
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }
    
    // 创建引擎尾焰
    createEngineFlame(x, y, direction = 0, intensity = 1) {
        const particleCount = Math.floor(3 * intensity);
        
        for (let i = 0; i < particleCount; i++) {
            const spread = Math.PI / 6; // 30度扩散
            const angle = direction + Math.PI + (Math.random() - 0.5) * spread;
            const speed = 1 + Math.random() * 2;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.2 + Math.random() * 0.3,
                size: 1 + Math.random() * 2,
                color: `hsl(${Math.random() * 30 + 15}, 100%, ${60 + Math.random() * 40}%)`,
                glow: true,
                drag: 0.9,
                type: 'flame'
            });
        }
    }
    
    // 创建护盾效果
    createShieldEffect(x, y, radius) {
        const particleCount = Math.floor(radius / 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = radius + Math.random() * 10;
            
            this.createParticle(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                {
                    vx: Math.cos(angle) * 0.5,
                    vy: Math.sin(angle) * 0.5,
                    life: 0.5,
                    size: 2,
                    color: '#64b5f6',
                    glow: true,
                    type: 'shield'
                }
            );
        }
    }
    
    // 创建道具闪光效果
    createPowerUpGlow(x, y, color = '#ffff00') {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 0.5 + Math.random() * 1;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                size: 1 + Math.random() * 2,
                color: color,
                glow: true,
                drag: 0.98,
                type: 'powerup'
            });
        }
    }
    
    // 创建星尘效果
    createStardust(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            this.createParticle(x, y, {
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 2.0 + Math.random() * 2,
                size: 1,
                color: '#ffffff',
                glow: true,
                drag: 0.99,
                type: 'stardust'
            });
        }
    }
    
    // 创建激光冲击波
    createLaserImpact(x, y, direction) {
        // 冲击粒子
        for (let i = 0; i < 12; i++) {
            const spread = Math.PI / 3;
            const angle = direction + (Math.random() - 0.5) * spread;
            const speed = 3 + Math.random() * 4;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3 + Math.random() * 0.4,
                size: 1 + Math.random() * 2,
                color: '#00ffff',
                glow: true,
                type: 'laser'
            });
        }
        
        // 能量环
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const speed = 2;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.2,
                size: 1,
                color: '#ffffff',
                glow: true,
                type: 'energy'
            });
        }
    }
    
    // 更新所有特效
    update(deltaTime) {
        this.updateParticles(deltaTime);
        this.updateExplosions(deltaTime);
        this.updateTrails(deltaTime);
        this.updateDamageNumbers(deltaTime);
        this.updateScreenShake(deltaTime);
        this.updateBackgroundStars(deltaTime);
    }
    
    // 更新粒子
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新位置
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // 应用重力和阻力
            particle.vy += particle.gravity * deltaTime;
            particle.vx *= particle.drag;
            particle.vy *= particle.drag;
            
            // 更新生命值
            particle.life -= deltaTime / 1000;
            
            // 移除死亡的粒子
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // 更新爆炸
    updateExplosions(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            
            explosion.frameTimer += deltaTime;
            
            if (explosion.frameTimer >= explosion.frameDelay) {
                explosion.frame++;
                explosion.frameTimer = 0;
                
                if (explosion.frame >= explosion.maxFrames) {
                    this.explosions.splice(i, 1);
                }
            }
        }
    }
    
    // 更新轨迹
    updateTrails(deltaTime) {
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            
            // 更新轨迹点的生命值
            for (let j = trail.points.length - 1; j >= 0; j--) {
                const point = trail.points[j];
                point.life -= trail.fadeSpeed * deltaTime;
                
                if (point.life <= 0) {
                    trail.points.splice(j, 1);
                }
            }
            
            // 移除空的轨迹
            if (trail.points.length === 0) {
                this.trails.splice(i, 1);
            }
        }
    }
    
    // 更新伤害数字
    updateDamageNumbers(deltaTime) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const damageNumber = this.damageNumbers[i];
            
            damageNumber.y += damageNumber.vy * deltaTime;
            damageNumber.vy *= 0.98; // 减速
            damageNumber.life -= deltaTime / 1000;
            
            if (damageNumber.life <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }
    
    // 更新屏幕震动
    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            
            this.screenShake.intensity *= this.screenShake.decay;
            
            if (this.screenShake.duration <= 0 || this.screenShake.intensity < 0.1) {
                this.screenShake.x = 0;
                this.screenShake.y = 0;
                this.screenShake.intensity = 0;
                this.screenShake.duration = 0;
            }
        }
    }
    
    // 更新背景星星
    updateBackgroundStars(deltaTime) {
        for (const star of this.backgroundStars) {
            star.y += star.speed * deltaTime;
            
            if (star.y > 800) {
                star.y = -10;
                star.x = Math.random() * 1200;
                star.speed = 0.5 + Math.random() * 2;
                star.brightness = 0.3 + Math.random() * 0.7;
            }
        }
    }
    
    // 渲染所有特效
    render(ctx) {
        ctx.save();
        
        // 应用屏幕震动
        ctx.translate(this.screenShake.x, this.screenShake.y);
        
        this.renderBackgroundStars(ctx);
        this.renderTrails(ctx);
        this.renderParticles(ctx);
        this.renderExplosions(ctx);
        this.renderDamageNumbers(ctx);
        
        ctx.restore();
    }
    
    // 渲染背景星星
    renderBackgroundStars(ctx) {
        ctx.save();
        
        for (const star of this.backgroundStars) {
            ctx.globalAlpha = star.brightness;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 渲染粒子
    renderParticles(ctx) {
        ctx.save();
        
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            if (particle.glow) {
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = particle.size * 2;
            }
            
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    // 渲染爆炸
    renderExplosions(ctx) {
        for (const explosion of this.explosions) {
            if (explosion.frame < this.explosionFrames.length) {
                const img = this.explosionFrames[explosion.frame];
                
                if (img.complete) {
                    ctx.save();
                    ctx.translate(explosion.x, explosion.y);
                    ctx.rotate(explosion.rotation);
                    ctx.scale(explosion.size, explosion.size);
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    ctx.restore();
                }
            }
        }
    }
    
    // 渲染轨迹
    renderTrails(ctx) {
        for (const trail of this.trails) {
            if (trail.points.length < 2) continue;
            
            ctx.save();
            ctx.strokeStyle = trail.color;
            ctx.lineWidth = trail.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(trail.points[0].x, trail.points[0].y);
            
            for (let i = 1; i < trail.points.length; i++) {
                const point = trail.points[i];
                const alpha = point.life;
                
                ctx.globalAlpha = alpha;
                ctx.lineTo(point.x, point.y);
            }
            
            ctx.stroke();
            ctx.restore();
        }
    }
    
    // 渲染伤害数字
    renderDamageNumbers(ctx) {
        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        for (const damageNumber of this.damageNumbers) {
            const alpha = damageNumber.life;
            const scale = damageNumber.scale;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = damageNumber.color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            
            ctx.translate(damageNumber.x, damageNumber.y);
            ctx.scale(scale, scale);
            
            // 描边
            ctx.strokeText(damageNumber.damage.toString(), 0, 0);
            // 填充
            ctx.fillText(damageNumber.damage.toString(), 0, 0);
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    // 清除所有特效
    clear() {
        this.particles.length = 0;
        this.explosions.length = 0;
        this.trails.length = 0;
        this.damageNumbers.length = 0;
        this.screenEffects.length = 0;
        
        this.screenShake.x = 0;
        this.screenShake.y = 0;
        this.screenShake.intensity = 0;
        this.screenShake.duration = 0;
    }
    
    // 获取特效统计信息
    getStats() {
        return {
            particles: this.particles.length,
            explosions: this.explosions.length,
            trails: this.trails.length,
            damageNumbers: this.damageNumbers.length,
            backgroundStars: this.backgroundStars.length
        };
    }
}

// 创建全局特效管理器实例
const effectsManager = new EffectsManager();
