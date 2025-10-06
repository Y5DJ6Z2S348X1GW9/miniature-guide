// 增强音频管理器 - enhanced-audio.js

class EnhancedAudioManager {
    constructor() {
        // 音频上下文
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.voiceGain = null;
        
        // 音量设置
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        this.voiceVolume = 0.9;
        
        // 3D音频设置
        this.listener = null;
        this.worldWidth = 1200;
        this.worldHeight = 800;
        this.maxDistance = 800;
        
        // 音频缓存
        this.soundBuffers = new Map();
        this.musicBuffers = new Map();
        this.voiceBuffers = new Map();
        
        // 当前播放的音频
        this.currentMusic = null;
        this.activeSounds = new Map();
        this.soundInstances = [];
        
        // 动态音乐系统
        this.musicLayers = new Map();
        this.currentMusicTheme = 'calm';
        this.musicTransitioning = false;
        this.adaptiveMusic = {
            tension: 0,      // 紧张度 0-1
            action: 0,       // 动作强度 0-1
            danger: 0,       // 危险程度 0-1
            victory: 0       // 胜利感 0-1
        };
        
        // 音频效果处理器
        this.audioEffects = {
            reverb: null,
            delay: null,
            compressor: null,
            distortion: null,
            filter: null
        };
        
        // 合成音效生成器
        this.synthesizer = {
            oscillators: [],
            frequencies: {
                laser: [800, 1200, 400],
                explosion: [80, 120, 60],
                powerup: [440, 880, 1320],
                warning: [300, 600, 300],
                hit: [200, 400, 150]
            }
        };
        
        // 音频文件路径
        this.soundPaths = {
            // 武器音效
            playerShoot: 'sounds/player_shoot.mp3',
            playerShootPlasma: 'sounds/plasma_shot.mp3',
            playerShootShotgun: 'sounds/shotgun_blast.mp3',
            playerShootMissile: 'sounds/missile_launch.mp3',
            playerShootLaser: 'sounds/laser_beam.mp3',
            
            // 敌人音效
            enemyShoot: 'sounds/enemy_shoot.mp3',
            enemyDeath: 'sounds/enemy_death.mp3',
            enemySpawn: 'sounds/enemy_spawn.mp3',
            bossRoar: 'sounds/boss_roar.mp3',
            bossAbility: 'sounds/boss_ability.mp3',
            
            // 爆炸音效
            explosion: 'sounds/explosion.mp3',
            explosionLarge: 'sounds/explosion_large.mp3',
            explosionSmall: 'sounds/explosion_small.mp3',
            
            // 道具音效
            powerup: 'sounds/powerup.mp3',
            powerupRare: 'sounds/powerup_rare.mp3',
            powerupLegendary: 'sounds/powerup_legendary.mp3',
            
            // 玩家音效
            playerHit: 'sounds/player_hit.mp3',
            playerShield: 'sounds/shield_hit.mp3',
            playerLevelUp: 'sounds/level_up.mp3',
            playerDeath: 'sounds/player_death.mp3',
            
            // UI音效
            ui_click: 'sounds/ui_click.mp3',
            ui_hover: 'sounds/ui_hover.mp3',
            ui_error: 'sounds/ui_error.mp3',
            ui_success: 'sounds/ui_success.mp3',
            
            // 特殊效果音效
            warning: 'sounds/warning.mp3',
            shield: 'sounds/shield.mp3',
            laser: 'sounds/laser.mp3',
            timeWarp: 'sounds/time_warp.mp3',
            combo: 'sounds/combo.mp3',
            critical: 'sounds/critical_hit.mp3',
            
            // 环境音效
            ambientSpace: 'sounds/ambient_space.mp3',
            meteorStorm: 'sounds/meteor_storm.mp3',
            energyField: 'sounds/energy_field.mp3',
            blackhole: 'sounds/blackhole.mp3'
        };
        
        // 音乐路径
        this.musicPaths = {
            menu: 'music/menu_theme.mp3',
            
            // 动态游戏音乐层
            game_calm: 'music/game_calm.mp3',
            game_tension: 'music/game_tension.mp3',
            game_action: 'music/game_action.mp3',
            game_danger: 'music/game_danger.mp3',
            
            // Boss音乐
            boss_theme_1: 'music/boss_mechanical.mp3',
            boss_theme_2: 'music/boss_organic.mp3',
            boss_theme_3: 'music/boss_crystal.mp3',
            boss_theme_4: 'music/boss_shadow.mp3',
            
            // 特殊情况音乐
            victory: 'music/victory.mp3',
            gameOver: 'music/game_over.mp3',
            levelUp: 'music/level_up_fanfare.mp3'
        };
        
        // 语音路径
        this.voicePaths = {
            welcomeMessage: 'voice/welcome.mp3',
            levelUpAnnouncement: 'voice/level_up.mp3',
            bossWarning: 'voice/boss_warning.mp3',
            missionComplete: 'voice/mission_complete.mp3',
            lowHealth: 'voice/low_health.mp3',
            comboAchieved: 'voice/combo_achieved.mp3'
        };
        
        // 音频设置
        this.settings = {
            enableMusic: true,
            enableSFX: true,
            enableVoice: true,
            enable3D: true,
            enableReverb: true,
            qualityMode: 'high' // low, medium, high
        };
        
        // 性能优化
        this.maxConcurrentSounds = 32;
        this.soundPoolSize = 16;
        this.soundPool = [];
        
        // 初始化音频系统
        this.init();
    }
    
    // 初始化音频系统
    async init() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建主增益节点
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // 创建分类增益节点
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);
            
            this.voiceGain = this.audioContext.createGain();
            this.voiceGain.gain.value = this.voiceVolume;
            this.voiceGain.connect(this.masterGain);
            
            // 设置3D音频监听器
            if (this.settings.enable3D && this.audioContext.listener) {
                this.listener = this.audioContext.listener;
                this.listener.positionX.value = this.worldWidth / 2;
                this.listener.positionY.value = this.worldHeight / 2;
                this.listener.positionZ.value = 0;
                this.listener.forwardX.value = 0;
                this.listener.forwardY.value = -1;
                this.listener.forwardZ.value = 0;
                this.listener.upX.value = 0;
                this.listener.upY.value = 0;
                this.listener.upZ.value = 1;
            }
            
            // 创建音频效果
            this.createAudioEffects();
            
            // 预加载关键音效
            await this.preloadCriticalSounds();
            
            console.log('增强音频系统初始化成功');
            
        } catch (error) {
            console.warn('音频系统初始化失败:', error);
            this.createFallbackAudio();
        }
    }
    
    // 创建音频效果处理器
    createAudioEffects() {
        if (!this.audioContext) return;
        
        // 混响效果
        this.audioEffects.reverb = this.createReverb();
        
        // 延迟效果
        this.audioEffects.delay = this.audioContext.createDelay(1.0);
        this.audioEffects.delay.delayTime.value = 0.3;
        
        // 压缩器
        this.audioEffects.compressor = this.audioContext.createDynamicsCompressor();
        this.audioEffects.compressor.threshold.value = -24;
        this.audioEffects.compressor.knee.value = 30;
        this.audioEffects.compressor.ratio.value = 12;
        this.audioEffects.compressor.attack.value = 0.003;
        this.audioEffects.compressor.release.value = 0.25;
        
        // 滤波器
        this.audioEffects.filter = this.audioContext.createBiquadFilter();
        this.audioEffects.filter.type = 'lowpass';
        this.audioEffects.filter.frequency.value = 22050;
        
        // 连接效果链
        this.audioEffects.compressor.connect(this.masterGain);
        this.audioEffects.filter.connect(this.audioEffects.compressor);
    }
    
    // 创建混响效果
    createReverb() {
        if (!this.audioContext) return null;
        
        const convolver = this.audioContext.createConvolver();
        const length = this.audioContext.sampleRate * 2; // 2秒混响
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2);
                channelData[i] = (Math.random() * 2 - 1) * decay * 0.5;
            }
        }
        
        convolver.buffer = impulse;
        return convolver;
    }
    
    // 预加载关键音效
    async preloadCriticalSounds() {
        const criticalSounds = [
            'playerShoot', 'explosion', 'powerup', 'warning', 'ui_click'
        ];
        
        const loadPromises = criticalSounds.map(soundName => {
            return this.loadSound(soundName).catch(error => {
                console.warn(`无法加载音效 ${soundName}:`, error);
                return this.generateSyntheticSound(soundName);
            });
        });
        
        await Promise.all(loadPromises);
    }
    
    // 加载音频文件
    async loadSound(soundName, soundPath = null) {
        if (this.soundBuffers.has(soundName)) {
            return this.soundBuffers.get(soundName);
        }
        
        const path = soundPath || this.soundPaths[soundName];
        if (!path) {
            throw new Error(`未找到音效路径: ${soundName}`);
        }
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.soundBuffers.set(soundName, audioBuffer);
            return audioBuffer;
            
        } catch (error) {
            console.warn(`加载音效失败 ${soundName}:`, error);
            // 生成合成音效作为备选
            return this.generateSyntheticSound(soundName);
        }
    }
    
    // 生成合成音效
    generateSyntheticSound(soundName) {
        if (!this.audioContext) return null;
        
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        const frequencies = this.synthesizer.frequencies[soundName] || [440, 880, 1320];
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            frequencies.forEach((freq, index) => {
                const envelope = Math.exp(-t * (index + 1) * 3);
                sample += Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
            });
            
            data[i] = sample;
        }
        
        this.soundBuffers.set(soundName, buffer);
        return buffer;
    }
    
    // 播放音效
    async playSound(soundName, volume = 1.0, pitch = 1.0, loop = false) {
        if (!this.settings.enableSFX || !this.audioContext) return null;
        
        try {
            // 获取音频缓冲区
            let buffer = this.soundBuffers.get(soundName);
            if (!buffer) {
                buffer = await this.loadSound(soundName);
            }
            
            if (!buffer) return null;
            
            // 创建音频源
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.loop = loop;
            source.playbackRate.value = pitch;
            
            // 创建增益节点
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = volume;
            
            // 连接音频图
            source.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            // 播放音效
            source.start();
            
            // 管理音频实例
            const soundId = Date.now() + Math.random();
            const soundInstance = {
                id: soundId,
                source: source,
                gainNode: gainNode,
                startTime: this.audioContext.currentTime
            };
            
            this.soundInstances.push(soundInstance);
            
            // 自动清理
            source.onended = () => {
                this.cleanupSoundInstance(soundId);
            };
            
            return soundInstance;
            
        } catch (error) {
            console.warn(`播放音效失败 ${soundName}:`, error);
            return null;
        }
    }
    
    // 播放3D位置音效
    async playSoundAtPosition(soundName, x, y, worldWidth, worldHeight, volume = 1.0, pitch = 1.0) {
        if (!this.settings.enable3D || !this.listener) {
            return this.playSound(soundName, volume, pitch);
        }
        
        try {
            let buffer = this.soundBuffers.get(soundName);
            if (!buffer) {
                buffer = await this.loadSound(soundName);
            }
            
            if (!buffer) return null;
            
            // 创建3D音频源
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = pitch;
            
            // 创建3D定位器
            const panner = this.audioContext.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 100;
            panner.maxDistance = this.maxDistance;
            panner.rolloffFactor = 1;
            
            // 设置3D位置
            panner.positionX.value = x;
            panner.positionY.value = y;
            panner.positionZ.value = 0;
            
            // 创建增益节点
            const gainNode = this.audioContext.createGain();
            
            // 根据距离调整音量
            const distance = Math.sqrt(
                Math.pow(x - this.worldWidth / 2, 2) + 
                Math.pow(y - this.worldHeight / 2, 2)
            );
            const distanceVolume = Math.max(0.1, 1 - distance / this.maxDistance);
            gainNode.gain.value = volume * distanceVolume;
            
            // 连接音频图
            source.connect(panner);
            panner.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            source.start();
            
            return { source, panner, gainNode };
            
        } catch (error) {
            console.warn(`播放3D音效失败 ${soundName}:`, error);
            return this.playSound(soundName, volume * 0.5, pitch);
        }
    }
    
    // 播放音乐
    async playMusic(musicName, fadeInTime = 1.0, loop = true) {
        if (!this.settings.enableMusic || !this.audioContext) return;
        
        // 停止当前音乐
        if (this.currentMusic) {
            this.stopMusic(fadeInTime);
        }
        
        try {
            // 加载音乐
            let buffer = this.musicBuffers.get(musicName);
            if (!buffer) {
                const path = this.musicPaths[musicName];
                if (path) {
                    const response = await fetch(path);
                    const arrayBuffer = await response.arrayBuffer();
                    buffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.musicBuffers.set(musicName, buffer);
                }
            }
            
            if (!buffer) return;
            
            // 创建音乐源
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.loop = loop;
            
            // 创建增益节点用于淡入淡出
            const fadeGain = this.audioContext.createGain();
            fadeGain.gain.value = 0;
            
            // 连接音频图
            source.connect(fadeGain);
            fadeGain.connect(this.musicGain);
            
            // 开始播放
            source.start();
            
            // 淡入效果
            fadeGain.gain.linearRampToValueAtTime(1.0, this.audioContext.currentTime + fadeInTime);
            
            // 保存当前音乐引用
            this.currentMusic = {
                source: source,
                gainNode: fadeGain,
                name: musicName
            };
            
        } catch (error) {
            console.warn(`播放音乐失败 ${musicName}:`, error);
        }
    }
    
    // 停止音乐
    stopMusic(fadeOutTime = 1.0) {
        if (!this.currentMusic) return;
        
        const music = this.currentMusic;
        const currentTime = this.audioContext.currentTime;
        
        // 淡出效果
        music.gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeOutTime);
        
        // 延迟停止
        setTimeout(() => {
            try {
                music.source.stop();
            } catch (error) {
                // 忽略已经停止的错误
            }
        }, fadeOutTime * 1000);
        
        this.currentMusic = null;
    }
    
    // 更新动态音乐
    updateAdaptiveMusic(gameState) {
        if (!this.settings.enableMusic) return;
        
        // 计算音乐参数
        const enemyCount = gameState.enemyCount || 0;
        const playerHealth = gameState.playerHealth || 100;
        const comboLevel = gameState.comboLevel || 0;
        const bossActive = gameState.bossActive || false;
        
        // 更新自适应音乐参数
        this.adaptiveMusic.tension = Math.min(1.0, enemyCount / 10);
        this.adaptiveMusic.action = Math.min(1.0, comboLevel / 50);
        this.adaptiveMusic.danger = Math.max(0, 1.0 - playerHealth / 100);
        this.adaptiveMusic.victory = gameState.victory ? 1.0 : 0;
        
        // 根据游戏状态选择音乐主题
        let targetTheme = 'calm';
        
        if (bossActive) {
            targetTheme = 'boss';
        } else if (this.adaptiveMusic.danger > 0.7) {
            targetTheme = 'danger';
        } else if (this.adaptiveMusic.action > 0.5) {
            targetTheme = 'action';
        } else if (this.adaptiveMusic.tension > 0.3) {
            targetTheme = 'tension';
        }
        
        // 切换音乐主题
        if (targetTheme !== this.currentMusicTheme && !this.musicTransitioning) {
            this.transitionToMusicTheme(targetTheme);
        }
    }
    
    // 切换音乐主题
    async transitionToMusicTheme(newTheme) {
        this.musicTransitioning = true;
        this.currentMusicTheme = newTheme;
        
        const musicName = `game_${newTheme}`;
        await this.playMusic(musicName, 2.0);
        
        setTimeout(() => {
            this.musicTransitioning = false;
        }, 2000);
    }
    
    // 播放语音
    async playVoice(voiceName, volume = 1.0) {
        if (!this.settings.enableVoice || !this.audioContext) return;
        
        try {
            let buffer = this.voiceBuffers.get(voiceName);
            if (!buffer) {
                const path = this.voicePaths[voiceName];
                if (path) {
                    const response = await fetch(path);
                    const arrayBuffer = await response.arrayBuffer();
                    buffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.voiceBuffers.set(voiceName, buffer);
                }
            }
            
            if (!buffer) return;
            
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.voiceGain);
            
            source.start();
            
        } catch (error) {
            console.warn(`播放语音失败 ${voiceName}:`, error);
        }
    }
    
    // 应用音频效果
    applyEffect(soundInstance, effectName, intensity = 1.0) {
        if (!soundInstance || !this.audioEffects[effectName]) return;
        
        try {
            const effect = this.audioEffects[effectName];
            
            switch (effectName) {
                case 'reverb':
                    const reverbGain = this.audioContext.createGain();
                    reverbGain.gain.value = intensity * 0.3;
                    soundInstance.gainNode.connect(reverbGain);
                    reverbGain.connect(effect);
                    effect.connect(this.sfxGain);
                    break;
                    
                case 'delay':
                    const delayGain = this.audioContext.createGain();
                    delayGain.gain.value = intensity * 0.4;
                    soundInstance.gainNode.connect(delayGain);
                    delayGain.connect(effect);
                    effect.connect(this.sfxGain);
                    break;
                    
                case 'filter':
                    effect.frequency.value = 22050 * (1 - intensity * 0.8);
                    soundInstance.gainNode.connect(effect);
                    break;
            }
        } catch (error) {
            console.warn('应用音频效果失败:', error);
        }
    }
    
    // 设置主音量
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    // 设置音乐音量
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }
    
    // 设置音效音量
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }
    
    // 更新监听器位置（跟随玩家）
    updateListenerPosition(x, y) {
        if (this.listener && this.settings.enable3D) {
            this.listener.positionX.value = x;
            this.listener.positionY.value = y;
        }
    }
    
    // 清理音频实例
    cleanupSoundInstance(soundId) {
        this.soundInstances = this.soundInstances.filter(instance => instance.id !== soundId);
    }
    
    // 停止所有音效
    stopAllSounds() {
        this.soundInstances.forEach(instance => {
            try {
                instance.source.stop();
            } catch (error) {
                // 忽略已经停止的错误
            }
        });
        this.soundInstances = [];
    }
    
    // 暂停音频
    pause() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }
    
    // 恢复音频
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // 创建备用音频系统
    createFallbackAudio() {
        // 使用HTML5 Audio作为备选方案
        this.fallbackAudio = {
            sounds: new Map(),
            currentMusic: null
        };
        
        console.log('使用备用音频系统');
    }
    
    // 获取音频统计信息
    getStats() {
        return {
            audioContextState: this.audioContext ? this.audioContext.state : 'none',
            activeSounds: this.soundInstances.length,
            loadedSounds: this.soundBuffers.size,
            loadedMusic: this.musicBuffers.size,
            currentMusic: this.currentMusic ? this.currentMusic.name : 'none',
            musicTheme: this.currentMusicTheme,
            adaptiveMusic: { ...this.adaptiveMusic }
        };
    }
    
    // 清理资源
    cleanup() {
        this.stopAllSounds();
        this.stopMusic(0.5);
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.soundBuffers.clear();
        this.musicBuffers.clear();
        this.voiceBuffers.clear();
    }
}

// 创建全局增强音频管理器实例
const enhancedAudioManager = new EnhancedAudioManager();

// 不创建audioManager别名避免与audio.js冲突
// 使用 enhancedAudioManager 作为独立的增强音频系统
