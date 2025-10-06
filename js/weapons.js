// 增强武器系统模块 - weapons.js

class AdvancedWeaponSystem {
    constructor() {
        // 武器类型定义
        this.weaponTypes = {
            // 基础武器
            basic: {
                name: '基础激光',
                fireRate: 200,
                damage: 10,
                bulletType: 'player_basic',
                spread: 0,
                projectileCount: 1,
                muzzleFlash: true,
                unlocked: true,
                cost: 0
            },
            
            // 高级武器
            plasma: {
                name: '等离子炮',
                fireRate: 300,
                damage: 18,
                bulletType: 'plasma',
                spread: 0,
                projectileCount: 1,
                muzzleFlash: true,
                unlocked: false,
                cost: 100,
                specialEffect: 'energyCharge'
            },
            
            shotgun: {
                name: '散弹枪',
                fireRate: 500,
                damage: 8,
                bulletType: 'shotgun',
                spread: Math.PI / 6,
                projectileCount: 5,
                muzzleFlash: true,
                unlocked: false,
                cost: 150,
                specialEffect: 'spread'
            },
            
            missile: {
                name: '导弹发射器',
                fireRate: 800,
                damage: 40,
                bulletType: 'missile',
                spread: 0,
                projectileCount: 1,
                muzzleFlash: true,
                unlocked: false,
                cost: 300,
                specialEffect: 'homing'
            },
            
            laser: {
                name: '激光束',
                fireRate: 50,
                damage: 3,
                bulletType: 'laser',
                spread: 0,
                projectileCount: 1,
                continuous: true,
                unlocked: false,
                cost: 200,
                specialEffect: 'piercing'
            },
            
            wave: {
                name: '能量波',
                fireRate: 400,
                damage: 25,
                bulletType: 'wave',
                spread: Math.PI / 4,
                projectileCount: 1,
                unlocked: false,
                cost: 250,
                specialEffect: 'aoe'
            },
            
            railgun: {
                name: '轨道炮',
                fireRate: 1200,
                damage: 80,
                bulletType: 'railgun',
                spread: 0,
                projectileCount: 1,
                chargeTime: 1000,
                unlocked: false,
                cost: 500,
                specialEffect: 'piercing'
            },
            
            flamethrower: {
                name: '火焰喷射器',
                fireRate: 80,
                damage: 5,
                bulletType: 'flame',
                spread: Math.PI / 8,
                projectileCount: 3,
                continuous: true,
                unlocked: false,
                cost: 180,
                specialEffect: 'damage_over_time'
            }
        };
        
        // 当前装备的武器
        this.equippedWeapons = {
            primary: 'basic',
            secondary: null,
            special: null
        };
        
        // 武器升级等级
        this.weaponLevels = {};
        Object.keys(this.weaponTypes).forEach(weapon => {
            this.weaponLevels[weapon] = 1;
        });
        
        // 射击状态
        this.firing = {
            primary: false,
            secondary: false,
            special: false
        };
        
        // 充能武器状态
        this.charging = {
            weapon: null,
            startTime: 0,
            progress: 0
        };
        
        // 特殊效果状态
        this.effects = {
            overcharged: { active: false, duration: 0 },
            rapidFire: { active: false, duration: 0 },
            piercing: { active: false, duration: 0 },
            explosive: { active: false, duration: 0 }
        };
        
        // 弹药系统（某些武器有限弹药）
        this.ammo = {
            missile: { current: 20, max: 20, regenRate: 0.5 },
            railgun: { current: 10, max: 10, regenRate: 0.2 }
        };
        
        // 武器过热系统
        this.heat = {
            current: 0,
            max: 100,
            threshold: 80,
            cooldownRate: 30,
            overheated: false
        };
        
        // 武器组合系统
        this.combos = {
            lastWeaponUsed: null,
            comboTimer: 0,
            comboMultiplier: 1.0
        };
        
        // UI元素
        this.weaponUI = null;
        this.createWeaponUI();
    }
    
    // 创建武器系统UI
    createWeaponUI() {
        this.weaponUI = document.createElement('div');
        this.weaponUI.id = 'advancedWeaponUI';
        this.weaponUI.className = 'advanced-weapon-ui';
        
        // 武器选择器
        this.weaponSelector = document.createElement('div');
        this.weaponSelector.className = 'weapon-selector';
        
        // 主武器显示
        this.primaryWeapon = document.createElement('div');
        this.primaryWeapon.className = 'weapon-display primary';
        this.primaryWeapon.innerHTML = `
            <div class="weapon-name">基础激光</div>
            <div class="weapon-level">LV.1</div>
            <div class="weapon-ammo hidden"></div>
        `;
        
        // 副武器显示
        this.secondaryWeapon = document.createElement('div');
        this.secondaryWeapon.className = 'weapon-display secondary hidden';
        
        // 特殊武器显示
        this.specialWeapon = document.createElement('div');
        this.specialWeapon.className = 'weapon-display special hidden';
        
        // 武器过热条
        this.heatBar = document.createElement('div');
        this.heatBar.className = 'heat-bar';
        this.heatBar.innerHTML = `
            <div class="heat-label">过热</div>
            <div class="heat-progress">
                <div class="heat-fill"></div>
            </div>
        `;
        
        // 充能条
        this.chargeBar = document.createElement('div');
        this.chargeBar.className = 'charge-bar hidden';
        this.chargeBar.innerHTML = `
            <div class="charge-label">充能中...</div>
            <div class="charge-progress">
                <div class="charge-fill"></div>
            </div>
        `;
        
        // 组装UI
        this.weaponSelector.appendChild(this.primaryWeapon);
        this.weaponSelector.appendChild(this.secondaryWeapon);
        this.weaponSelector.appendChild(this.specialWeapon);
        
        this.weaponUI.appendChild(this.weaponSelector);
        this.weaponUI.appendChild(this.heatBar);
        this.weaponUI.appendChild(this.chargeBar);
        
        // 添加到游戏UI
        const gameUI = document.getElementById('gameUI');
        if (gameUI) {
            gameUI.appendChild(this.weaponUI);
        }
    }
    
    // 装备武器
    equipWeapon(weaponType, slot = 'primary') {
        if (!this.weaponTypes[weaponType]) {
            console.warn('未知武器类型:', weaponType);
            return false;
        }
        
        if (!this.weaponTypes[weaponType].unlocked) {
            console.warn('武器未解锁:', weaponType);
            return false;
        }
        
        this.equippedWeapons[slot] = weaponType;
        this.updateWeaponUI();
        
        // 播放装备音效
        audioManager.playSound('powerup', 0.4);
        
        return true;
    }
    
    // 开始射击
    startFire(slot = 'primary') {
        const weaponType = this.equippedWeapons[slot];
        if (!weaponType) return false;
        
        const weapon = this.weaponTypes[weaponType];
        
        // 检查充能武器
        if (weapon.chargeTime && !this.charging.weapon) {
            this.startCharging(weaponType);
            return true;
        }
        
        // 检查弹药
        if (this.ammo[weaponType] && this.ammo[weaponType].current <= 0) {
            return false;
        }
        
        // 检查过热
        if (this.heat.overheated) {
            return false;
        }
        
        this.firing[slot] = true;
        return true;
    }
    
    // 停止射击
    stopFire(slot = 'primary') {
        this.firing[slot] = false;
        
        // 释放充能武器
        if (this.charging.weapon) {
            this.releaseCharge();
        }
    }
    
    // 开始充能
    startCharging(weaponType) {
        this.charging.weapon = weaponType;
        this.charging.startTime = Date.now();
        this.charging.progress = 0;
        
        // 显示充能UI
        this.chargeBar.classList.remove('hidden');
        this.updateChargeUI();
        
        // 播放充能音效
        audioManager.playSound('powerup', 0.3, 0.8);
    }
    
    // 释放充能
    releaseCharge() {
        if (!this.charging.weapon) return;
        
        const weapon = this.weaponTypes[this.charging.weapon];
        const chargeRatio = this.charging.progress;
        
        // 根据充能程度发射
        this.fireWeapon(this.charging.weapon, chargeRatio);
        
        // 重置充能状态
        this.charging.weapon = null;
        this.charging.progress = 0;
        this.chargeBar.classList.add('hidden');
        
        // 播放发射音效
        audioManager.playSound('explosion', 0.5, 1.2);
    }
    
    // 发射武器
    fireWeapon(weaponType, chargeRatio = 1.0) {
        const weapon = this.weaponTypes[weaponType];
        if (!weapon) return false;
        
        // 检查射速限制
        const now = Date.now();
        const fireRateKey = `lastFire_${weaponType}`;
        if (this[fireRateKey] && now - this[fireRateKey] < weapon.fireRate) {
            return false;
        }
        
        // 应用连击加成
        const fireRateBonus = comboSystem ? comboSystem.getFireRateBonus() : 1.0;
        const damageBonus = comboSystem ? comboSystem.getDamageBonus() : 1.0;
        
        // 计算实际属性
        const actualDamage = weapon.damage * chargeRatio * damageBonus;
        const actualFireRate = weapon.fireRate / fireRateBonus;
        
        // 获取发射位置
        const firePosition = this.getFirePosition(weaponType);
        
        // 发射子弹
        this.createProjectiles(weapon, firePosition, actualDamage, chargeRatio);
        
        // 更新状态
        this[fireRateKey] = now;
        this.updateWeaponState(weaponType, chargeRatio);
        
        // 视觉和音效
        this.createMuzzleFlash(firePosition, weapon);
        this.playFireSound(weaponType, chargeRatio);
        
        // 更新武器组合
        this.updateWeaponCombo(weaponType);
        
        return true;
    }
    
    // 创建弹丸
    createProjectiles(weapon, firePosition, damage, chargeRatio) {
        const baseAngle = -Math.PI / 2; // 向上
        
        for (let i = 0; i < weapon.projectileCount; i++) {
            let angle = baseAngle;
            
            // 计算扩散角度
            if (weapon.spread > 0 && weapon.projectileCount > 1) {
                const spreadStep = weapon.spread / (weapon.projectileCount - 1);
                angle += (i * spreadStep) - (weapon.spread / 2);
            } else if (weapon.spread > 0) {
                angle += (Math.random() - 0.5) * weapon.spread;
            }
            
            // 创建弹丸
            this.createSingleProjectile(weapon, firePosition, angle, damage, chargeRatio);
        }
    }
    
    // 创建单个弹丸
    createSingleProjectile(weapon, firePosition, angle, damage, chargeRatio) {
        let bulletType = weapon.bulletType;
        
        // 特殊弹药类型处理
        switch (weapon.specialEffect) {
            case 'homing':
                bulletType = 'player_homing';
                break;
            case 'piercing':
                bulletType = 'player_heavy';
                break;
            case 'explosive':
                bulletType = 'player_explosive';
                break;
        }
        
        // 发射弹丸
        const bullet = bulletManager.fire(firePosition.x, firePosition.y, angle, bulletType, player);
        
        if (bullet) {
            // 应用充能加成
            bullet.damage *= chargeRatio;
            
            // 应用特殊效果
            this.applySpecialEffects(bullet, weapon, chargeRatio);
            
            // 连击系统增强
            if (comboSystem && comboSystem.specialEffects.piercing.active) {
                bullet.pierce = true;
                bullet.maxPierce = 5;
            }
            
            if (comboSystem && comboSystem.specialEffects.multiShot.active) {
                // 额外弹丸
                setTimeout(() => {
                    bulletManager.fire(firePosition.x + Math.random() * 20 - 10, 
                                     firePosition.y, angle, bulletType, player);
                }, 50);
            }
        }
        
        return bullet;
    }
    
    // 应用特殊效果
    applySpecialEffects(bullet, weapon, chargeRatio) {
        switch (weapon.specialEffect) {
            case 'energyCharge':
                bullet.color = this.getChargeColor(chargeRatio);
                bullet.size *= (1 + chargeRatio * 0.5);
                break;
                
            case 'spread':
                // 散弹特效已在创建时处理
                break;
                
            case 'homing':
                bullet.homing = true;
                bullet.homingStrength = 0.15;
                break;
                
            case 'piercing':
                bullet.pierce = true;
                bullet.maxPierce = Math.floor(3 + chargeRatio * 2);
                break;
                
            case 'aoe':
                bullet.explosive = true;
                bullet.explosionRadius = 50 * chargeRatio;
                break;
                
            case 'damage_over_time':
                bullet.burnDamage = weapon.damage * 0.5;
                bullet.burnDuration = 2000;
                break;
        }
    }
    
    // 获取发射位置
    getFirePosition(weaponType) {
        if (!player) return { x: 600, y: 400 };
        
        const weapon = this.weaponTypes[weaponType];
        let offsetX = 0;
        let offsetY = -player.radius;
        
        // 根据武器类型调整发射位置
        switch (weaponType) {
            case 'shotgun':
                offsetY -= 5;
                break;
            case 'missile':
                offsetX = Math.random() > 0.5 ? -15 : 15;
                break;
            case 'flamethrower':
                offsetY -= 10;
                break;
        }
        
        return {
            x: player.x + offsetX,
            y: player.y + offsetY
        };
    }
    
    // 创建枪口闪光
    createMuzzleFlash(firePosition, weapon) {
        if (!weapon.muzzleFlash) return;
        
        // 创建闪光粒子
        for (let i = 0; i < 5; i++) {
            effectsManager.createParticle(firePosition.x, firePosition.y, {
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 2,
                life: 0.2,
                size: 2 + Math.random() * 3,
                color: weapon.specialEffect === 'energyCharge' ? '#00ffff' : '#ffff00',
                glow: true,
                type: 'muzzle_flash'
            });
        }
        
        // 创建冲击波（某些武器）
        if (['missile', 'railgun'].includes(weapon.bulletType)) {
            effectsManager.createLaserImpact(firePosition.x, firePosition.y, -Math.PI / 2);
        }
    }
    
    // 播放射击音效
    playFireSound(weaponType, chargeRatio) {
        let soundName = 'playerShoot';
        let volume = 0.3;
        let pitch = 1.0;
        
        switch (weaponType) {
            case 'plasma':
                soundName = 'laser';
                pitch = 1.2;
                break;
            case 'shotgun':
                soundName = 'explosion';
                volume = 0.4;
                pitch = 0.8;
                break;
            case 'missile':
                soundName = 'explosion';
                volume = 0.5;
                break;
            case 'railgun':
                soundName = 'laser';
                volume = 0.6;
                pitch = 0.6;
                break;
            case 'flamethrower':
                soundName = 'warning';
                volume = 0.2;
                pitch = 1.5;
                break;
        }
        
        // 充能武器音效变化
        if (chargeRatio > 1.0) {
            volume *= chargeRatio;
            pitch *= (1 + (chargeRatio - 1) * 0.5);
        }
        
        audioManager.playSound(soundName, volume, pitch);
    }
    
    // 更新武器状态
    updateWeaponState(weaponType, chargeRatio) {
        // 消耗弹药
        if (this.ammo[weaponType]) {
            this.ammo[weaponType].current = Math.max(0, this.ammo[weaponType].current - 1);
        }
        
        // 增加过热
        const heatGenerated = this.getWeaponHeat(weaponType) * chargeRatio;
        this.heat.current = Math.min(this.heat.max, this.heat.current + heatGenerated);
        
        if (this.heat.current >= this.heat.threshold) {
            this.heat.overheated = true;
        }
    }
    
    // 获取武器产热量
    getWeaponHeat(weaponType) {
        const heatMap = {
            basic: 5,
            plasma: 8,
            shotgun: 12,
            missile: 15,
            laser: 3,
            wave: 10,
            railgun: 25,
            flamethrower: 2
        };
        
        return heatMap[weaponType] || 5;
    }
    
    // 更新武器组合
    updateWeaponCombo(weaponType) {
        const now = Date.now();
        
        if (this.combos.lastWeaponUsed === weaponType && 
            now - this.combos.comboTimer < 2000) {
            this.combos.comboMultiplier = Math.min(2.0, this.combos.comboMultiplier + 0.1);
        } else {
            this.combos.comboMultiplier = 1.0;
        }
        
        this.combos.lastWeaponUsed = weaponType;
        this.combos.comboTimer = now;
    }
    
    // 更新武器系统
    update(deltaTime) {
        // 更新连续射击
        this.updateContinuousFire(deltaTime);
        
        // 更新充能
        this.updateCharging(deltaTime);
        
        // 更新过热
        this.updateHeat(deltaTime);
        
        // 更新弹药恢复
        this.updateAmmoRegeneration(deltaTime);
        
        // 更新特殊效果
        this.updateSpecialEffects(deltaTime);
        
        // 更新UI
        this.updateWeaponUI();
    }
    
    // 更新连续射击
    updateContinuousFire(deltaTime) {
        Object.keys(this.firing).forEach(slot => {
            if (this.firing[slot]) {
                const weaponType = this.equippedWeapons[slot];
                if (weaponType) {
                    const weapon = this.weaponTypes[weaponType];
                    if (weapon.continuous) {
                        this.fireWeapon(weaponType);
                    }
                }
            }
        });
    }
    
    // 更新充能
    updateCharging(deltaTime) {
        if (this.charging.weapon) {
            const weapon = this.weaponTypes[this.charging.weapon];
            const elapsedTime = Date.now() - this.charging.startTime;
            this.charging.progress = Math.min(1.0, elapsedTime / weapon.chargeTime);
            
            this.updateChargeUI();
            
            // 过度充能
            if (this.charging.progress >= 1.0 && elapsedTime > weapon.chargeTime * 1.5) {
                this.charging.progress = 1.5; // 150%充能
            }
        }
    }
    
    // 更新过热
    updateHeat(deltaTime) {
        if (this.heat.current > 0) {
            this.heat.current -= this.heat.cooldownRate * deltaTime / 1000;
            this.heat.current = Math.max(0, this.heat.current);
            
            if (this.heat.overheated && this.heat.current < this.heat.threshold * 0.5) {
                this.heat.overheated = false;
            }
        }
    }
    
    // 更新弹药恢复
    updateAmmoRegeneration(deltaTime) {
        Object.keys(this.ammo).forEach(weaponType => {
            const ammo = this.ammo[weaponType];
            if (ammo.current < ammo.max) {
                ammo.current += ammo.regenRate * deltaTime / 1000;
                ammo.current = Math.min(ammo.max, ammo.current);
            }
        });
    }
    
    // 更新特殊效果
    updateSpecialEffects(deltaTime) {
        Object.keys(this.effects).forEach(effectName => {
            const effect = this.effects[effectName];
            if (effect.active && effect.duration > 0) {
                effect.duration -= deltaTime;
                if (effect.duration <= 0) {
                    effect.active = false;
                }
            }
        });
    }
    
    // 更新武器UI
    updateWeaponUI() {
        // 更新主武器显示
        const primaryWeaponType = this.equippedWeapons.primary;
        if (primaryWeaponType) {
            const weapon = this.weaponTypes[primaryWeaponType];
            const nameElement = this.primaryWeapon.querySelector('.weapon-name');
            const levelElement = this.primaryWeapon.querySelector('.weapon-level');
            const ammoElement = this.primaryWeapon.querySelector('.weapon-ammo');
            
            if (nameElement) nameElement.textContent = weapon.name;
            if (levelElement) levelElement.textContent = `LV.${this.weaponLevels[primaryWeaponType]}`;
            
            // 弹药显示
            if (this.ammo[primaryWeaponType] && ammoElement) {
                const ammo = this.ammo[primaryWeaponType];
                ammoElement.textContent = `${Math.floor(ammo.current)}/${ammo.max}`;
                ammoElement.classList.remove('hidden');
            } else if (ammoElement) {
                ammoElement.classList.add('hidden');
            }
        }
        
        // 更新过热条
        const heatPercent = this.heat.current / this.heat.max;
        const heatFill = this.heatBar.querySelector('.heat-fill');
        if (heatFill) {
            heatFill.style.width = (heatPercent * 100) + '%';
            
            if (this.heat.overheated) {
                heatFill.style.backgroundColor = '#ff4444';
                this.heatBar.classList.add('overheated');
            } else if (heatPercent > 0.8) {
                heatFill.style.backgroundColor = '#ff8800';
                this.heatBar.classList.remove('overheated');
            } else {
                heatFill.style.backgroundColor = '#64b5f6';
                this.heatBar.classList.remove('overheated');
            }
        }
    }
    
    // 更新充能UI
    updateChargeUI() {
        const chargeFill = this.chargeBar.querySelector('.charge-fill');
        if (chargeFill) {
            chargeFill.style.width = (this.charging.progress * 100) + '%';
            
            if (this.charging.progress >= 1.5) {
                chargeFill.style.backgroundColor = '#ff0080';
            } else if (this.charging.progress >= 1.0) {
                chargeFill.style.backgroundColor = '#ffff00';
            } else {
                chargeFill.style.backgroundColor = '#64b5f6';
            }
        }
    }
    
    // 获取充能颜色
    getChargeColor(chargeRatio) {
        if (chargeRatio >= 1.5) return '#ff0080';
        if (chargeRatio >= 1.0) return '#ffff00';
        if (chargeRatio >= 0.5) return '#00ffff';
        return '#64b5f6';
    }
    
    // 解锁武器
    unlockWeapon(weaponType) {
        if (this.weaponTypes[weaponType]) {
            this.weaponTypes[weaponType].unlocked = true;
            
            if (window.uiManager) {
                uiManager.showNotification('武器解锁！', 
                    `${this.weaponTypes[weaponType].name} 已解锁`, 'success');
            }
            
            return true;
        }
        return false;
    }
    
    // 升级武器
    upgradeWeapon(weaponType) {
        if (this.weaponTypes[weaponType] && this.weaponLevels[weaponType] < 5) {
            this.weaponLevels[weaponType]++;
            
            // 提升武器属性
            const weapon = this.weaponTypes[weaponType];
            weapon.damage *= 1.2;
            weapon.fireRate *= 0.9; // 减少射击间隔
            
            this.updateWeaponUI();
            
            return true;
        }
        return false;
    }
    
    // 获取武器统计
    getStats() {
        return {
            equippedWeapons: { ...this.equippedWeapons },
            weaponLevels: { ...this.weaponLevels },
            heat: { ...this.heat },
            ammo: { ...this.ammo },
            charging: { ...this.charging },
            combos: { ...this.combos }
        };
    }
    
    // 重置武器系统
    reset() {
        this.equippedWeapons = {
            primary: 'basic',
            secondary: null,
            special: null
        };
        
        this.firing = {
            primary: false,
            secondary: false,
            special: false
        };
        
        this.charging.weapon = null;
        this.charging.progress = 0;
        
        this.heat.current = 0;
        this.heat.overheated = false;
        
        // 重置弹药
        Object.keys(this.ammo).forEach(weaponType => {
            this.ammo[weaponType].current = this.ammo[weaponType].max;
        });
        
        this.updateWeaponUI();
    }
    
    // 清理资源
    cleanup() {
        if (this.weaponUI && this.weaponUI.parentNode) {
            this.weaponUI.parentNode.removeChild(this.weaponUI);
        }
    }
}

// 创建全局高级武器系统实例
const advancedWeaponSystem = new AdvancedWeaponSystem();
