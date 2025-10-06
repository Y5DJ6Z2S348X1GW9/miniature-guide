// 输入管理模块 - input.js

class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            left: false,
            right: false
        };
        
        this.keybindings = {
            // 移动控制
            up: ['KeyW', 'ArrowUp'],
            down: ['KeyS', 'ArrowDown'],
            left: ['KeyA', 'ArrowLeft'],
            right: ['KeyD', 'ArrowRight'],
            
            // 动作控制
            shoot: ['Space'],
            shield: ['ShiftLeft', 'ShiftRight'],
            pause: ['KeyP', 'Escape'],
            
            // 特殊能力
            special1: ['KeyQ'],
            special2: ['KeyE'],
            
            // UI控制
            confirm: ['Enter'],
            cancel: ['Escape']
        };
        
        this.gamepadIndex = -1;
        this.gamepadDeadzone = 0.2;
        
        this.initEventListeners();
        this.checkGamepad();
    }
    
    initEventListeners() {
        // 键盘事件
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // 防止默认行为
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // 鼠标事件
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.left = true;
            if (e.button === 2) this.mouse.right = true;
            e.preventDefault();
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
        });
        
        // 禁用右键菜单
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // 触摸事件（移动端支持）
        window.addEventListener('touchstart', (e) => {
            this.handleTouch(e);
            e.preventDefault();
        });
        
        window.addEventListener('touchmove', (e) => {
            this.handleTouch(e);
            e.preventDefault();
        });
        
        window.addEventListener('touchend', (e) => {
            this.mouse.left = false;
            e.preventDefault();
        });
        
        // 游戏手柄连接事件
        window.addEventListener('gamepadconnected', (e) => {
            console.log('游戏手柄已连接:', e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('游戏手柄已断开连接');
            this.gamepadIndex = -1;
        });
    }
    
    handleTouch(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.mouse.x = touch.clientX;
            this.mouse.y = touch.clientY;
            this.mouse.left = true;
        }
    }
    
    checkGamepad() {
        const gamepads = navigator.getGamepads();
        if (gamepads && gamepads[this.gamepadIndex]) {
            return gamepads[this.gamepadIndex];
        }
        return null;
    }
    
    // 检查按键是否被按下
    isKeyPressed(action) {
        if (!this.keybindings[action]) return false;
        
        return this.keybindings[action].some(key => this.keys[key]);
    }
    
    // 检查按键是否刚被按下（单次触发）
    isKeyJustPressed(action) {
        if (!this.keybindings[action]) return false;
        
        return this.keybindings[action].some(key => {
            if (this.keys[key] && !this.previousKeys[key]) {
                return true;
            }
            return false;
        });
    }
    
    // 获取移动向量
    getMovementVector() {
        let x = 0;
        let y = 0;
        
        // 键盘输入
        if (this.isKeyPressed('left')) x -= 1;
        if (this.isKeyPressed('right')) x += 1;
        if (this.isKeyPressed('up')) y -= 1;
        if (this.isKeyPressed('down')) y += 1;
        
        // 游戏手柄输入
        const gamepad = this.checkGamepad();
        if (gamepad) {
            const leftStickX = gamepad.axes[0];
            const leftStickY = gamepad.axes[1];
            
            if (Math.abs(leftStickX) > this.gamepadDeadzone) {
                x += leftStickX;
            }
            if (Math.abs(leftStickY) > this.gamepadDeadzone) {
                y += leftStickY;
            }
        }
        
        // 标准化向量
        const length = Math.sqrt(x * x + y * y);
        if (length > 1) {
            x /= length;
            y /= length;
        }
        
        return { x, y };
    }
    
    // 获取鼠标相对于画布的位置
    getMousePosition(canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: this.mouse.x - rect.left,
            y: this.mouse.y - rect.top
        };
    }
    
    // 检查射击输入
    isShooting() {
        const keyboardShoot = this.isKeyPressed('shoot');
        const mouseShoot = this.mouse.left;
        
        // 游戏手柄射击
        let gamepadShoot = false;
        const gamepad = this.checkGamepad();
        if (gamepad) {
            gamepadShoot = gamepad.buttons[0] && gamepad.buttons[0].pressed; // A按钮
        }
        
        return keyboardShoot || mouseShoot || gamepadShoot;
    }
    
    // 检查护盾输入
    isShielding() {
        const keyboardShield = this.isKeyPressed('shield');
        
        // 游戏手柄护盾
        let gamepadShield = false;
        const gamepad = this.checkGamepad();
        if (gamepad) {
            gamepadShield = gamepad.buttons[1] && gamepad.buttons[1].pressed; // B按钮
        }
        
        return keyboardShield || gamepadShield;
    }
    
    // 检查暂停输入
    isPausePressed() {
        const keyboardPause = this.isKeyJustPressed('pause');
        
        // 游戏手柄暂停
        let gamepadPause = false;
        const gamepad = this.checkGamepad();
        if (gamepad) {
            const startButton = gamepad.buttons[9];
            gamepadPause = startButton && startButton.pressed && !this.previousGamepadStart;
            this.previousGamepadStart = startButton && startButton.pressed;
        }
        
        return keyboardPause || gamepadPause;
    }
    
    // 更新输入状态（每帧调用）
    update() {
        // 保存上一帧的按键状态，用于检测单次按键
        this.previousKeys = { ...this.keys };
        
        // 更新游戏手柄状态
        const gamepad = this.checkGamepad();
        if (gamepad) {
            this.previousGamepadButtons = this.gamepadButtons || [];
            this.gamepadButtons = gamepad.buttons.map(button => button.pressed);
        }
    }
    
    // 重置所有输入状态
    reset() {
        this.keys = {};
        this.mouse.left = false;
        this.mouse.right = false;
        this.previousKeys = {};
    }
    
    // 设置自定义键位绑定
    setKeybinding(action, keys) {
        if (Array.isArray(keys)) {
            this.keybindings[action] = keys;
        } else {
            this.keybindings[action] = [keys];
        }
    }
    
    // 获取当前键位绑定
    getKeybinding(action) {
        return this.keybindings[action] || [];
    }
    
    // 获取按键的显示名称
    getKeyDisplayName(keyCode) {
        const keyNames = {
            'KeyW': 'W',
            'KeyA': 'A',
            'KeyS': 'S',
            'KeyD': 'D',
            'KeyP': 'P',
            'KeyQ': 'Q',
            'KeyE': 'E',
            'Space': '空格',
            'ShiftLeft': '左Shift',
            'ShiftRight': '右Shift',
            'Enter': '回车',
            'Escape': 'ESC',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→'
        };
        
        return keyNames[keyCode] || keyCode;
    }
    
    // 检查是否有输入设备连接
    hasInputDevices() {
        return {
            keyboard: true, // 键盘总是可用的
            mouse: true,    // 鼠标总是可用的
            gamepad: this.gamepadIndex !== -1,
            touch: 'ontouchstart' in window
        };
    }
    
    // 振动反馈（游戏手柄）
    vibrate(duration = 200, intensity = 0.5) {
        const gamepad = this.checkGamepad();
        if (gamepad && gamepad.vibrationActuator) {
            gamepad.vibrationActuator.playEffect('dual-rumble', {
                duration: duration,
                strongMagnitude: intensity,
                weakMagnitude: intensity * 0.5
            });
        }
    }
}

// 创建全局输入管理器实例
const inputManager = new InputManager();
