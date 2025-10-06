// 音频管理模块 - audio.js

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.soundEffectsVolume = 0.8;
        this.musicVolume = 0.5;
        
        this.sounds = {};
        this.music = null;
        this.isInitialized = false;
        
        // 音效队列，用于避免同时播放太多相同音效
        this.soundQueue = {};
        this.maxSameTimePlayback = 3;
        
        // 通过Web Audio API生成的音效
        this.generatedSounds = {};
        
        this.initAudioContext();
        this.generateSoundEffects();
    }
    
    async initAudioContext() {
        try {
            // 创建Audio Context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建主音量节点
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.masterVolume;
            this.masterGainNode.connect(this.audioContext.destination);
            
            // 创建音效和音乐的增益节点
            this.sfxGainNode = this.audioContext.createGain();
            this.sfxGainNode.gain.value = this.soundEffectsVolume;
            this.sfxGainNode.connect(this.masterGainNode);
            
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.gain.value = this.musicVolume;
            this.musicGainNode.connect(this.masterGainNode);
            
            this.isInitialized = true;
            console.log('音频系统初始化成功');
        } catch (error) {
            console.error('音频系统初始化失败:', error);
        }
    }
    
    // 生成各种音效
    generateSoundEffects() {
        if (!this.audioContext) return;
        
        // 生成激光射击音效
        this.generatedSounds.playerShoot = this.generateLaserSound(0.1, 800, 400);
        this.generatedSounds.enemyShoot = this.generateLaserSound(0.08, 600, 300);
        
        // 生成爆炸音效
        this.generatedSounds.explosion = this.generateExplosionSound(0.5);
        this.generatedSounds.enemyDeath = this.generateExplosionSound(0.3);
        
        // 生成道具音效
        this.generatedSounds.powerup = this.generatePowerUpSound(0.3);
        this.generatedSounds.heal = this.generateHealSound(0.4);
        this.generatedSounds.shield = this.generateShieldSound(0.3);
        
        // 生成UI音效
        this.generatedSounds.buttonClick = this.generateClickSound(0.2);
        this.generatedSounds.buttonHover = this.generateHoverSound(0.1);
        
        // 生成警告音效
        this.generatedSounds.warning = this.generateWarningSound(0.4);
        this.generatedSounds.bossAlert = this.generateBossAlertSound(0.6);
        
        // 生成引擎音效
        this.generatedSounds.engine = this.generateEngineSound(0.2);
    }
    
    // 生成激光音效
    generateLaserSound(duration, startFreq, endFreq) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const frequency = startFreq + (endFreq - startFreq) * (t / duration);
            const amplitude = Math.exp(-t * 8) * 0.5; // 指数衰减
            
            channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude;
        }
        
        return buffer;
    }
    
    // 生成爆炸音效
    generateExplosionSound(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const amplitude = Math.exp(-t * 4) * 0.8;
            
            // 混合多个频率的噪声
            let sample = 0;
            sample += Math.sin(2 * Math.PI * 80 * t) * 0.4;
            sample += Math.sin(2 * Math.PI * 40 * t) * 0.3;
            sample += (Math.random() * 2 - 1) * 0.3; // 白噪声
            
            channelData[i] = sample * amplitude;
        }
        
        return buffer;
    }
    
    // 生成道具获取音效
    generatePowerUpSound(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        const frequencies = [440, 554, 659]; // A, C#, E 和弦
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const amplitude = Math.exp(-t * 3) * 0.3;
            
            let sample = 0;
            frequencies.forEach(freq => {
                sample += Math.sin(2 * Math.PI * freq * t);
            });
            
            sample /= frequencies.length;
            channelData[i] = sample * amplitude;
        }
        
        return buffer;
    }
    
    // 生成治疗音效
    generateHealSound(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const frequency = 500 + Math.sin(t * 20) * 100; // 调制频率
            const amplitude = Math.sin(t * Math.PI / duration) * 0.4; // 钟形包络
            
            channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude;
        }
        
        return buffer;
    }
    
    // 生成护盾音效
    generateShieldSound(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const frequency = 300 + t * 200; // 上升频率
            const amplitude = Math.sin(t * Math.PI / duration) * 0.3;
            
            let sample = Math.sin(2 * Math.PI * frequency * t);
            sample += Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.5; // 谐波
            
            channelData[i] = sample * amplitude;
        }
        
        return buffer;
    }
    
    // 生成点击音效
    generateClickSound(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const amplitude = Math.exp(-t * 20) * 0.5;
            
            channelData[i] = Math.sin(2 * Math.PI * 1000 * t) * amplitude;
        }
        
        return buffer;
    }
    
    // 生成悬停音效
    generateHoverSound(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const amplitude = Math.exp(-t * 15) * 0.3;
            
            channelData[i] = Math.sin(2 * Math.PI * 800 * t) * amplitude;
        }
        
        return buffer;
    }
    
    // 生成警告音效
    generateWarningSound(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const frequency = 400 + Math.sin(t * 20) * 100; // 颤音效果
            const amplitude = 0.6;
            
            channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude;
        }
        
        return buffer;
    }
    
    // 生成Boss警报音效
    generateBossAlertSound(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const frequency = 200 + Math.sin(t * 10) * 50;
            const amplitude = Math.sin(t * 15) * 0.8; // 脉冲效果
            
            channelData[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude;
        }
        
        return buffer;
    }
    
    // 生成引擎音效
    generateEngineSound(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // 低频引擎声
            sample += Math.sin(2 * Math.PI * 60 * t) * 0.4;
            sample += Math.sin(2 * Math.PI * 120 * t) * 0.2;
            sample += (Math.random() * 2 - 1) * 0.1; // 少量噪声
            
            channelData[i] = sample * 0.3;
        }
        
        return buffer;
    }
    
    // 播放音效
    playSound(soundName, volume = 1.0, pitch = 1.0) {
        if (!this.isInitialized || !this.generatedSounds[soundName]) {
            return;
        }
        
        try {
            // 限制同时播放的相同音效数量
            if (!this.soundQueue[soundName]) {
                this.soundQueue[soundName] = [];
            }
            
            if (this.soundQueue[soundName].length >= this.maxSameTimePlayback) {
                return; // 跳过播放
            }
            
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.generatedSounds[soundName];
            source.playbackRate.value = pitch;
            
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            // 记录播放的音效
            this.soundQueue[soundName].push(source);
            
            source.onended = () => {
                // 从队列中移除已结束的音效
                const index = this.soundQueue[soundName].indexOf(source);
                if (index > -1) {
                    this.soundQueue[soundName].splice(index, 1);
                }
            };
            
            source.start();
            
        } catch (error) {
            console.error('播放音效失败:', soundName, error);
        }
    }
    
    // 播放音效（带位置的3D音效）
    playSoundAtPosition(soundName, x, y, canvasWidth, canvasHeight, volume = 1.0) {
        if (!this.isInitialized || !this.generatedSounds[soundName]) {
            return;
        }
        
        // 计算立体声平衡
        const centerX = canvasWidth / 2;
        const pan = Math.max(-1, Math.min(1, (x - centerX) / centerX));
        
        // 计算距离衰减
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y, 2));
        const maxDistance = Math.sqrt(Math.pow(canvasWidth / 2, 2) + Math.pow(canvasHeight, 2));
        const distanceAttenuation = 1 - (distance / maxDistance);
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            const pannerNode = this.audioContext.createStereoPanner();
            
            source.buffer = this.generatedSounds[soundName];
            gainNode.gain.value = volume * distanceAttenuation;
            pannerNode.pan.value = pan;
            
            source.connect(gainNode);
            gainNode.connect(pannerNode);
            pannerNode.connect(this.sfxGainNode);
            
            source.start();
            
        } catch (error) {
            console.error('播放3D音效失败:', soundName, error);
        }
    }
    
    // 设置主音量
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.masterVolume;
        }
    }
    
    // 设置音效音量
    setSoundEffectsVolume(volume) {
        this.soundEffectsVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.value = this.soundEffectsVolume;
        }
    }
    
    // 设置音乐音量
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.musicVolume;
        }
    }
    
    // 获取音量设置
    getVolumes() {
        return {
            master: this.masterVolume,
            soundEffects: this.soundEffectsVolume,
            music: this.musicVolume
        };
    }
    
    // 停止所有音效
    stopAllSounds() {
        Object.keys(this.soundQueue).forEach(soundName => {
            this.soundQueue[soundName].forEach(source => {
                try {
                    source.stop();
                } catch (error) {
                    // 忽略已经停止的音源错误
                }
            });
            this.soundQueue[soundName] = [];
        });
    }
    
    // 恢复Audio Context（用户交互后调用）
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('音频上下文已恢复');
            } catch (error) {
                console.error('恢复音频上下文失败:', error);
            }
        }
    }
    
    // 检查音频系统是否可用
    isAvailable() {
        return this.isInitialized && this.audioContext && this.audioContext.state !== 'closed';
    }
}

// 创建全局音频管理器实例
const audioManager = new AudioManager();

// 在用户首次交互时恢复音频上下文
document.addEventListener('click', () => {
    audioManager.resumeAudioContext();
}, { once: true });

document.addEventListener('keydown', () => {
    audioManager.resumeAudioContext();
}, { once: true });
