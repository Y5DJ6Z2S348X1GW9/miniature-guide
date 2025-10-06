// 碰撞检测模块 - collision.js

class CollisionManager {
    constructor() {
        // 空间分割的网格大小
        this.gridSize = 64;
        this.spatialGrid = new Map();
        
        // 碰撞层级，用于优化检测
        this.collisionLayers = {
            PLAYER: 1,
            ENEMY: 2,
            PLAYER_BULLET: 4,
            ENEMY_BULLET: 8,
            POWERUP: 16,
            PARTICLE: 32
        };
        
        // 碰撞检测统计
        this.stats = {
            checksPerFrame: 0,
            totalObjects: 0,
            collisionsDetected: 0
        };
    }
    
    // 重置空间网格
    clearSpatialGrid() {
        this.spatialGrid.clear();
        this.stats.totalObjects = 0;
    }
    
    // 获取对象所在的网格坐标
    getGridCoords(x, y) {
        return {
            gridX: Math.floor(x / this.gridSize),
            gridY: Math.floor(y / this.gridSize)
        };
    }
    
    // 获取网格键
    getGridKey(gridX, gridY) {
        return `${gridX},${gridY}`;
    }
    
    // 将对象添加到空间网格
    addToSpatialGrid(object) {
        if (!object || typeof object.x !== 'number' || typeof object.y !== 'number') {
            return;
        }
        
        const bounds = this.getObjectBounds(object);
        const startGrid = this.getGridCoords(bounds.left, bounds.top);
        const endGrid = this.getGridCoords(bounds.right, bounds.bottom);
        
        // 对象可能跨越多个网格
        for (let gridX = startGrid.gridX; gridX <= endGrid.gridX; gridX++) {
            for (let gridY = startGrid.gridY; gridY <= endGrid.gridY; gridY++) {
                const key = this.getGridKey(gridX, gridY);
                
                if (!this.spatialGrid.has(key)) {
                    this.spatialGrid.set(key, []);
                }
                
                this.spatialGrid.get(key).push(object);
            }
        }
        
        this.stats.totalObjects++;
    }
    
    // 获取对象的边界框
    getObjectBounds(object) {
        const halfWidth = (object.width || object.radius || 10) / 2;
        const halfHeight = (object.height || object.radius || 10) / 2;
        
        return {
            left: object.x - halfWidth,
            right: object.x + halfWidth,
            top: object.y - halfHeight,
            bottom: object.y + halfHeight
        };
    }
    
    // 获取可能与指定对象碰撞的对象列表
    getPotentialCollisions(object) {
        const bounds = this.getObjectBounds(object);
        const startGrid = this.getGridCoords(bounds.left, bounds.top);
        const endGrid = this.getGridCoords(bounds.right, bounds.bottom);
        
        const potentialCollisions = new Set();
        
        for (let gridX = startGrid.gridX; gridX <= endGrid.gridX; gridX++) {
            for (let gridY = startGrid.gridY; gridY <= endGrid.gridY; gridY++) {
                const key = this.getGridKey(gridX, gridY);
                const gridObjects = this.spatialGrid.get(key);
                
                if (gridObjects) {
                    gridObjects.forEach(obj => {
                        if (obj !== object) {
                            potentialCollisions.add(obj);
                        }
                    });
                }
            }
        }
        
        return Array.from(potentialCollisions);
    }
    
    // 矩形碰撞检测
    checkRectangleCollision(obj1, obj2) {
        const bounds1 = this.getObjectBounds(obj1);
        const bounds2 = this.getObjectBounds(obj2);
        
        return !(bounds1.right < bounds2.left ||
                bounds1.left > bounds2.right ||
                bounds1.bottom < bounds2.top ||
                bounds1.top > bounds2.bottom);
    }
    
    // 圆形碰撞检测
    checkCircleCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const radius1 = obj1.radius || obj1.width / 2 || 10;
        const radius2 = obj2.radius || obj2.width / 2 || 10;
        
        return distance < (radius1 + radius2);
    }
    
    // 混合碰撞检测（矩形+圆形）
    checkMixedCollision(rectObj, circleObj) {
        const rectBounds = this.getObjectBounds(rectObj);
        const circleRadius = circleObj.radius || circleObj.width / 2 || 10;
        
        // 找到矩形上最接近圆心的点
        const closestX = Math.max(rectBounds.left, Math.min(circleObj.x, rectBounds.right));
        const closestY = Math.max(rectBounds.top, Math.min(circleObj.y, rectBounds.bottom));
        
        // 计算距离
        const dx = circleObj.x - closestX;
        const dy = circleObj.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < circleRadius;
    }
    
    // 主碰撞检测方法
    checkCollision(obj1, obj2) {
        if (!obj1 || !obj2) return false;
        
        this.stats.checksPerFrame++;
        
        // 首先进行快速边界框检测
        if (!this.checkRectangleCollision(obj1, obj2)) {
            return false;
        }
        
        // 根据对象形状选择精确检测方法
        const obj1IsCircle = obj1.shape === 'circle' || obj1.radius !== undefined;
        const obj2IsCircle = obj2.shape === 'circle' || obj2.radius !== undefined;
        
        if (obj1IsCircle && obj2IsCircle) {
            return this.checkCircleCollision(obj1, obj2);
        } else if (obj1IsCircle) {
            return this.checkMixedCollision(obj2, obj1);
        } else if (obj2IsCircle) {
            return this.checkMixedCollision(obj1, obj2);
        } else {
            return true; // 已经通过矩形检测
        }
    }
    
    // 检测点是否在对象内
    checkPointInObject(x, y, object) {
        const bounds = this.getObjectBounds(object);
        
        if (object.shape === 'circle' || object.radius !== undefined) {
            const dx = x - object.x;
            const dy = y - object.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const radius = object.radius || object.width / 2 || 10;
            return distance <= radius;
        } else {
            return x >= bounds.left && x <= bounds.right &&
                   y >= bounds.top && y <= bounds.bottom;
        }
    }
    
    // 线段与对象的碰撞检测
    checkLineObjectCollision(x1, y1, x2, y2, object) {
        const bounds = this.getObjectBounds(object);
        
        if (object.shape === 'circle' || object.radius !== undefined) {
            return this.checkLineCircleCollision(x1, y1, x2, y2, object.x, object.y, 
                                               object.radius || object.width / 2 || 10);
        } else {
            return this.checkLineRectangleCollision(x1, y1, x2, y2, bounds);
        }
    }
    
    // 线段与圆形的碰撞检测
    checkLineCircleCollision(x1, y1, x2, y2, cx, cy, radius) {
        // 计算线段到圆心的最短距离
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) {
            // 线段退化为点
            const distance = Math.sqrt((x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy));
            return distance <= radius;
        }
        
        const unitX = dx / length;
        const unitY = dy / length;
        
        // 投影圆心到线段上
        const toCircleX = cx - x1;
        const toCircleY = cy - y1;
        const projection = toCircleX * unitX + toCircleY * unitY;
        
        let closestX, closestY;
        
        if (projection < 0) {
            // 最近点是线段起点
            closestX = x1;
            closestY = y1;
        } else if (projection > length) {
            // 最近点是线段终点
            closestX = x2;
            closestY = y2;
        } else {
            // 最近点在线段上
            closestX = x1 + projection * unitX;
            closestY = y1 + projection * unitY;
        }
        
        const distance = Math.sqrt((cx - closestX) * (cx - closestX) + (cy - closestY) * (cy - closestY));
        return distance <= radius;
    }
    
    // 线段与矩形的碰撞检测
    checkLineRectangleCollision(x1, y1, x2, y2, bounds) {
        // 检查线段端点是否在矩形内
        if ((x1 >= bounds.left && x1 <= bounds.right && y1 >= bounds.top && y1 <= bounds.bottom) ||
            (x2 >= bounds.left && x2 <= bounds.right && y2 >= bounds.top && y2 <= bounds.bottom)) {
            return true;
        }
        
        // 检查线段是否与矩形的边相交
        return this.checkLineLineIntersection(x1, y1, x2, y2, bounds.left, bounds.top, bounds.right, bounds.top) ||
               this.checkLineLineIntersection(x1, y1, x2, y2, bounds.right, bounds.top, bounds.right, bounds.bottom) ||
               this.checkLineLineIntersection(x1, y1, x2, y2, bounds.right, bounds.bottom, bounds.left, bounds.bottom) ||
               this.checkLineLineIntersection(x1, y1, x2, y2, bounds.left, bounds.bottom, bounds.left, bounds.top);
    }
    
    // 线段与线段的相交检测
    checkLineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        
        if (Math.abs(denominator) < 1e-10) {
            return false; // 平行线
        }
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
    
    // 射线投射检测
    raycast(startX, startY, dirX, dirY, maxDistance, layerMask) {
        const endX = startX + dirX * maxDistance;
        const endY = startY + dirY * maxDistance;
        
        const hits = [];
        
        // 遍历射线路径上的网格
        const step = this.gridSize / 2;
        const steps = Math.ceil(maxDistance / step);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;
            
            const gridCoords = this.getGridCoords(x, y);
            const key = this.getGridKey(gridCoords.gridX, gridCoords.gridY);
            const gridObjects = this.spatialGrid.get(key);
            
            if (gridObjects) {
                for (const object of gridObjects) {
                    if (layerMask && !(object.layer & layerMask)) {
                        continue;
                    }
                    
                    if (this.checkLineObjectCollision(startX, startY, endX, endY, object)) {
                        const dx = object.x - startX;
                        const dy = object.y - startY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        hits.push({
                            object: object,
                            distance: distance,
                            point: { x: object.x, y: object.y }
                        });
                    }
                }
            }
        }
        
        // 按距离排序
        hits.sort((a, b) => a.distance - b.distance);
        
        return hits;
    }
    
    // 获取指定区域内的所有对象
    getObjectsInArea(x, y, width, height) {
        const objects = new Set();
        
        const startGrid = this.getGridCoords(x, y);
        const endGrid = this.getGridCoords(x + width, y + height);
        
        for (let gridX = startGrid.gridX; gridX <= endGrid.gridX; gridX++) {
            for (let gridY = startGrid.gridY; gridY <= endGrid.gridY; gridY++) {
                const key = this.getGridKey(gridX, gridY);
                const gridObjects = this.spatialGrid.get(key);
                
                if (gridObjects) {
                    gridObjects.forEach(obj => {
                        const bounds = this.getObjectBounds(obj);
                        
                        // 检查对象是否真的在指定区域内
                        if (!(bounds.right < x || bounds.left > x + width ||
                              bounds.bottom < y || bounds.top > y + height)) {
                            objects.add(obj);
                        }
                    });
                }
            }
        }
        
        return Array.from(objects);
    }
    
    // 获取碰撞检测统计信息
    getStats() {
        return { ...this.stats };
    }
    
    // 重置统计信息
    resetStats() {
        this.stats.checksPerFrame = 0;
        this.stats.collisionsDetected = 0;
    }
    
    // 更新统计信息（每帧调用）
    updateStats() {
        // 统计信息会在下一帧重置
        setTimeout(() => {
            this.stats.checksPerFrame = 0;
        }, 0);
    }
    
    // 可视化调试（绘制网格和边界框）
    debugDraw(ctx, canvasWidth, canvasHeight) {
        if (!ctx) return;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // 绘制网格
        for (let x = 0; x < canvasWidth; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvasHeight; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
        }
        
        // 绘制活跃网格
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 2;
        
        this.spatialGrid.forEach((objects, key) => {
            if (objects.length > 0) {
                const [gridX, gridY] = key.split(',').map(Number);
                const x = gridX * this.gridSize;
                const y = gridY * this.gridSize;
                
                ctx.strokeRect(x, y, this.gridSize, this.gridSize);
                
                // 显示对象数量
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = '12px Arial';
                ctx.fillText(objects.length.toString(), x + 5, y + 15);
            }
        });
        
        ctx.restore();
    }
}

// 创建全局碰撞管理器实例
const collisionManager = new CollisionManager();
