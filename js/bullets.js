// 子弹系统模块 - bullets.js

class BulletManager {
    constructor() {
        this.bullets = [];
        this.maxBullets = 200;
        
        // 子弹类型配置
        this.bulletTypes = {
            player_basic: {
                speed: 8,
                damage: 10,
                size: 4,
                color: '#64b5f6',
                sprite: 'bullet_player.png',
                pierce: false,
                homing: false,
                trail: true
            },
            player_rapid: {
                speed: 10,
                damage: 8,
                size: 3,
                color: '#42a5f5',
                sprite: 'bullet_player.png',
                pierce: false,
                homing: false,
                trail: true
            },
            player_heavy: {
                speed: 6,
                damage: 25,
                size: 6,
                color: '#1976d2',
                sprite: 'bullet_player.png',
                pierce: true,
                homing: false,
                trail: true
            },
            player_laser: {
                speed: 15,
                damage: 15,
                size: 2,
                color: '#00ffff',
                sprite: 'laser_beam.png',
                pierce: true,
                homing: false,
                trail: false,
                continuous: true
            },
            player_homing: {
                speed: 7,
                damage: 12,
                size: 4,
                color: '#ff9800',
                sprite: 'bullet_player.png',
                pierce: false,
                homing: true,
                homingStrength: 0.1,
                trail: true
            },
            enemy_basic: {
                speed: 4,
                damage: 5,
                size: 4,
                color: '#ff4444',
                sprite: 'bullet_enemy.png',
                pierce: false,
                homing: false,
                trail: false
            },
            enemy_fast: {
                speed: 7,
                damage: 3,
                size: 3,
                color: '#ff6666',
                sprite: 'bullet_enemy.png',
                pierce: false,
                homing: false,
                trail: false
            },
            enemy_heavy: {
                speed: 3,
                damage: 15,
                size: 8,
                color: '#cc0000',
                sprite: 'bullet_enemy.png',
                pierce: false,
                homing: false,
                trail: false
            },
            enemy_seeking: {
                speed: 5,
                damage: 8,
                size: 5,
                color: '#ff8800',
                sprite: 'bullet_enemy.png',
                pierce: false,
                homing: true,
                homingStrength: 0.08,
                trail: false
            }
        };
        
        // 预加载子弹精灵
        this.sprites = {};
        this.loadSprites();
        
        // 子弹池，用于性能优化
        this.bulletPool = [];
        this.initializeBulletPool();
    }
    
    // 加载子弹精灵
    loadSprites() {
        const spriteNames = ['bullet_player.png', 'bullet_enemy.png', 'laser_beam.png'];
        
        spriteNames.forEach(spriteName => {
            const img = new Image();
            img.src = `assets/images/${spriteName}`;
            this.sprites[spriteName] = img;
        });
    }
    
    // 初始化子弹对象池
    initializeBulletPool() {
        for (let i = 0; i < this.maxBullets; i++) {
            this.bulletPool.push(this.createBulletObject());
        }
    }
    
    // 创建子弹对象
    createBulletObject() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            type: '',
            damage: 0,
            size: 0,
            color: '',
            sprite: null,
            active: false,
            life: 5000, // 5秒生命周期
            maxLife: 5000,
            owner: null,
            pierce: false,
            pierceCount: 0,
            maxPierce: 3,
            homing: false,
            homingTarget: null,
            homingStrength: 0,
            trail: null,
            rotation: 0,
            layer: 0,
            width: 0,
            height: 0,
            shape: 'circle'
        };
    }
    
    // 从对象池获取子弹
    getBulletFromPool() {
        for (const bullet of this.bulletPool) {
            if (!bullet.active) {
                return bullet;
            }
        }
        
        // 如果池中没有空闲子弹，创建新的
        if (this.bullets.length < this.maxBullets) {
            const newBullet = this.createBulletObject();
            this.bulletPool.push(newBullet);
            return newBullet;
        }
        
        return null; // 达到最大子弹数量
    }
    
    // 发射子弹
    fire(x, y, angle, bulletType, owner = null) {
        const config = this.bulletTypes[bulletType];
        if (!config) {
            console.warn('未知的子弹类型:', bulletType);
            return null;
        }
        
        const bullet = this.getBulletFromPool();
        if (!bullet) {
            return null; // 无法创建更多子弹
        }
        
        // 初始化子弹属性
        bullet.x = x;
        bullet.y = y;
        bullet.vx = Math.cos(angle) * config.speed;
        bullet.vy = Math.sin(angle) * config.speed;
        bullet.type = bulletType;
        bullet.damage = config.damage;
        bullet.size = config.size;
        bullet.color = config.color;
        bullet.sprite = this.sprites[config.sprite];
        bullet.active = true;
        bullet.life = bullet.maxLife;
        bullet.owner = owner;
        bullet.pierce = config.pierce || false;
        bullet.pierceCount = 0;
        bullet.maxPierce = config.maxPierce || 3;
        bullet.homing = config.homing || false;
        bullet.homingTarget = null;
        bullet.homingStrength = config.homingStrength || 0;
        bullet.rotation = angle;
        bullet.width = config.size;
        bullet.height = config.size;
        
        // 设置碰撞层级
        if (bulletType.startsWith('player')) {
            bullet.layer = collisionManager.collisionLayers.PLAYER_BULLET;
        } else {
            bullet.layer = collisionManager.collisionLayers.ENEMY_BULLET;
        }
        
        // 创建轨迹效果
        if (config.trail) {
            bullet.trail = effectsManager.createTrail(x, y, {
                color: config.color,
                maxPoints: 8,
                width: config.size / 2
            });
        }
        
        this.bullets.push(bullet);
        
        // 播放发射音效
        const soundName = bulletType.startsWith('player') ? 'playerShoot' : 'enemyShoot';
        audioManager.playSound(soundName, 0.3, 1.0 + (Math.random() - 0.5) * 0.2);
        
        return bullet;
    }
    
    // 发射多重子弹
    fireSpread(x, y, centerAngle, bulletType, count, spread, owner = null) {
        const bullets = [];
        const angleStep = spread / Math.max(1, count - 1);
        const startAngle = centerAngle - spread / 2;
        
        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            const bullet = this.fire(x, y, angle, bulletType, owner);
            if (bullet) {
                bullets.push(bullet);
            }
        }
        
        return bullets;
    }
    
    // 发射环形子弹
    fireCircle(x, y, bulletType, count, owner = null) {
        const bullets = [];
        const angleStep = (Math.PI * 2) / count;
        
        for (let i = 0; i < count; i++) {
            const angle = angleStep * i;
            const bullet = this.fire(x, y, angle, bulletType, owner);
            if (bullet) {
                bullets.push(bullet);
            }
        }
        
        return bullets;
    }
    
    // 发射激光
    fireLaser(x, y, angle, length, bulletType, owner = null) {
        const config = this.bulletTypes[bulletType];
        if (!config) return null;
        
        // 激光是连续的，创建多个子弹段
        const segments = Math.floor(length / 10);
        const bullets = [];
        
        for (let i = 0; i < segments; i++) {
            const segmentX = x + Math.cos(angle) * i * 10;
            const segmentY = y + Math.sin(angle) * i * 10;
            
            const bullet = this.fire(segmentX, segmentY, angle, bulletType, owner);
            if (bullet) {
                bullet.life = 100; // 激光段生命短
                bullets.push(bullet);
            }
        }
        
        // 创建激光视觉效果
        effectsManager.createLaserImpact(
            x + Math.cos(angle) * length,
            y + Math.sin(angle) * length,
            angle
        );
        
        return bullets;
    }
    
    // 更新所有子弹
    update(deltaTime, targets = []) {
        // 清空碰撞网格中的子弹
        collisionManager.clearSpatialGrid();
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            if (!bullet.active) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            this.updateBullet(bullet, deltaTime, targets);
            
            // 检查子弹是否应该被移除
            if (this.shouldRemoveBullet(bullet)) {
                this.removeBullet(bullet, i);
            } else {
                // 添加到碰撞检测网格
                collisionManager.addToSpatialGrid(bullet);
            }
        }
    }
    
    // 更新单个子弹
    updateBullet(bullet, deltaTime, targets) {
        // 寻的逻辑
        if (bullet.homing && targets.length > 0) {
            this.updateHoming(bullet, targets);
        }
        
        // 更新位置
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;
        
        // 更新旋转
        bullet.rotation = Math.atan2(bullet.vy, bullet.vx);
        
        // 更新生命值
        bullet.life -= deltaTime;
        
        // 更新轨迹
        if (bullet.trail) {
            effectsManager.updateTrail(bullet.trail, bullet.x, bullet.y);
        }
        
        // 创建粒子效果
        if (Math.random() < 0.1) {
            effectsManager.createParticle(bullet.x, bullet.y, {
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 0.3,
                size: 1,
                color: bullet.color,
                glow: true
            });
        }
    }
    
    // 更新寻的逻辑
    updateHoming(bullet, targets) {
        if (!bullet.homingTarget || !this.isValidTarget(bullet.homingTarget)) {
            // 寻找新目标
            bullet.homingTarget = this.findNearestTarget(bullet, targets);
        }
        
        if (bullet.homingTarget) {
            const dx = bullet.homingTarget.x - bullet.x;
            const dy = bullet.homingTarget.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const targetVx = (dx / distance) * bullet.vx;
                const targetVy = (dy / distance) * bullet.vy;
                
                bullet.vx += (targetVx - bullet.vx) * bullet.homingStrength;
                bullet.vy += (targetVy - bullet.vy) * bullet.homingStrength;
                
                // 保持速度
                const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                const config = this.bulletTypes[bullet.type];
                if (speed > 0) {
                    bullet.vx = (bullet.vx / speed) * config.speed;
                    bullet.vy = (bullet.vy / speed) * config.speed;
                }
            }
        }
    }
    
    // 寻找最近的目标
    findNearestTarget(bullet, targets) {
        let nearestTarget = null;
        let nearestDistance = Infinity;
        
        for (const target of targets) {
            if (!this.isValidTarget(target)) continue;
            
            const dx = target.x - bullet.x;
            const dy = target.y - bullet.y;
            const distance = dx * dx + dy * dy; // 使用平方距离避免开方运算
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestTarget = target;
            }
        }
        
        return nearestTarget;
    }
    
    // 检查目标是否有效
    isValidTarget(target) {
        return target && target.active !== false && target.health > 0;
    }
    
    // 检查子弹是否应该被移除
    shouldRemoveBullet(bullet) {
        // 生命值耗尽
        if (bullet.life <= 0) return true;
        
        // 超出屏幕边界
        const margin = 50;
        if (bullet.x < -margin || bullet.x > 1200 + margin ||
            bullet.y < -margin || bullet.y > 800 + margin) {
            return true;
        }
        
        // 穿透次数达到上限
        if (bullet.pierce && bullet.pierceCount >= bullet.maxPierce) {
            return true;
        }
        
        return false;
    }
    
    // 移除子弹
    removeBullet(bullet, index) {
        bullet.active = false;
        bullet.trail = null;
        this.bullets.splice(index, 1);
    }
    
    // 处理子弹碰撞
    onBulletHit(bullet, target) {
        // 创建撞击效果
        effectsManager.createLaserImpact(bullet.x, bullet.y, bullet.rotation);
        
        // 如果不是穿透弹，则移除子弹
        if (!bullet.pierce) {
            bullet.active = false;
        } else {
            bullet.pierceCount++;
        }
        
        // 播放撞击音效
        audioManager.playSoundAtPosition('explosion', bullet.x, bullet.y, 1200, 800, 0.2);
        
        return bullet.damage;
    }
    
    // 渲染所有子弹
    render(ctx) {
        for (const bullet of this.bullets) {
            if (!bullet.active) continue;
            
            this.renderBullet(ctx, bullet);
        }
    }
    
    // 渲染单个子弹
    renderBullet(ctx, bullet) {
        ctx.save();
        
        // 设置透明度（根据生命值）
        const alpha = Math.min(1, bullet.life / 1000);
        ctx.globalAlpha = alpha;
        
        // 移动到子弹位置
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(bullet.rotation);
        
        // 如果有精灵图，使用精灵图渲染
        if (bullet.sprite && bullet.sprite.complete) {
            const width = bullet.size * 2;
            const height = bullet.size;
            ctx.drawImage(bullet.sprite, -width / 2, -height / 2, width, height);
        } else {
            // 否则使用基本形状渲染
            ctx.fillStyle = bullet.color;
            ctx.shadowColor = bullet.color;
            ctx.shadowBlur = bullet.size;
            
            ctx.beginPath();
            ctx.ellipse(0, 0, bullet.size, bullet.size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 获取指定层级的子弹
    getBulletsByLayer(layer) {
        return this.bullets.filter(bullet => bullet.active && bullet.layer === layer);
    }
    
    // 获取指定所有者的子弹
    getBulletsByOwner(owner) {
        return this.bullets.filter(bullet => bullet.active && bullet.owner === owner);
    }
    
    // 清除所有子弹
    clear() {
        for (const bullet of this.bullets) {
            bullet.active = false;
            bullet.trail = null;
        }
        this.bullets.length = 0;
    }
    
    // 清除指定所有者的子弹
    clearByOwner(owner) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (bullet.owner === owner) {
                this.removeBullet(bullet, i);
            }
        }
    }
    
    // 获取统计信息
    getStats() {
        return {
            activeBullets: this.bullets.length,
            poolSize: this.bulletPool.length,
            playerBullets: this.bullets.filter(b => b.type.startsWith('player')).length,
            enemyBullets: this.bullets.filter(b => b.type.startsWith('enemy')).length
        };
    }
    
    // 调试渲染
    debugRender(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 1;
        
        for (const bullet of this.bullets) {
            if (!bullet.active) continue;
            
            const bounds = collisionManager.getObjectBounds(bullet);
            ctx.strokeRect(bounds.left, bounds.top, 
                          bounds.right - bounds.left, 
                          bounds.bottom - bounds.top);
            
            // 显示子弹信息
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText(`${bullet.type}`, bullet.x + 10, bullet.y);
        }
        
        ctx.restore();
    }
}

// 创建全局子弹管理器实例
const bulletManager = new BulletManager();
