#!/usr/bin/env python3
"""
超级太空射击游戏资源生成器 - 增强版
生成丰富炫酷的游戏图像资源，让游戏更加有趣好玩！
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont
import numpy as np
from io import BytesIO

class SuperGameAssetGenerator:
    def __init__(self, output_dir="../assets/images"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # 颜色调色板
        self.color_palettes = {
            'neon': ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff'],
            'fire': ['#ff4500', '#ff6347', '#ffd700', '#ff1493', '#ff69b4'],
            'ice': ['#00ffff', '#87ceeb', '#4169e1', '#9370db', '#00bfff'],
            'toxic': ['#32cd32', '#7fff00', '#adff2f', '#9aff9a', '#00ff7f'],
            'dark': ['#8b0000', '#2f4f4f', '#483d8b', '#2e2e2e', '#696969'],
            'cosmic': ['#4b0082', '#8a2be2', '#9400d3', '#9932cc', '#ba55d3'],
            'energy': ['#ffff00', '#ffd700', '#fff8dc', '#fffacd', '#f0e68c']
        }
        
        # 预计算常用数学值
        self.pi2 = math.pi * 2
        self.pi_half = math.pi / 2
        
    def create_player_ship(self):
        """创建玩家飞船"""
        size = 60
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 主体 - 三角形
        points = [(size//2, 5), (10, size-10), (size//2, size-20), (size-10, size-10)]
        draw.polygon(points, fill=(0, 150, 255, 255), outline=(0, 100, 200, 255))
        
        # 驾驶舱
        cockpit_center = (size//2, 15)
        draw.ellipse([cockpit_center[0]-8, cockpit_center[1]-5, 
                     cockpit_center[0]+8, cockpit_center[1]+5], 
                     fill=(100, 200, 255, 200))
        
        # 引擎喷口
        draw.ellipse([12, size-15, 18, size-5], fill=(255, 100, 0, 255))
        draw.ellipse([size-18, size-15, size-12, size-5], fill=(255, 100, 0, 255))
        
        # 武器挂点
        draw.rectangle([5, size//2-2, 10, size//2+2], fill=(150, 150, 150, 255))
        draw.rectangle([size-10, size//2-2, size-5, size//2+2], fill=(150, 150, 150, 255))
        
        img.save(os.path.join(self.output_dir, 'player_ship.png'))
        
    def create_enemy_ships(self):
        """创建多种敌人飞船"""
        # 敌人类型1：基础敌舰
        size = 40
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 红色三角形敌舰
        points = [(size//2, size-5), (5, 10), (size//2, 20), (size-5, 10)]
        draw.polygon(points, fill=(255, 50, 50, 255), outline=(200, 0, 0, 255))
        
        # 引擎
        draw.ellipse([size//2-3, 8, size//2+3, 14], fill=(255, 150, 0, 255))
        
        img.save(os.path.join(self.output_dir, 'enemy_basic.png'))
        
        # 敌人类型2：重型敌舰
        size = 55
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 主体
        draw.ellipse([10, 10, size-10, size-10], fill=(150, 0, 150, 255), outline=(100, 0, 100, 255))
        
        # 武器
        draw.rectangle([5, size//2-3, 15, size//2+3], fill=(200, 200, 200, 255))
        draw.rectangle([size-15, size//2-3, size-5, size//2+3], fill=(200, 200, 200, 255))
        
        # 装甲板
        draw.arc([15, 15, size-15, size-15], 0, 180, fill=(100, 0, 100, 255), width=3)
        
        img.save(os.path.join(self.output_dir, 'enemy_heavy.png'))
        
        # 敌人类型3：快速敌舰
        size = 35
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 菱形
        points = [(size//2, 5), (size-5, size//2), (size//2, size-5), (5, size//2)]
        draw.polygon(points, fill=(255, 255, 0, 255), outline=(200, 200, 0, 255))
        
        # 中心
        draw.ellipse([size//2-5, size//2-5, size//2+5, size//2+5], fill=(255, 150, 0, 255))
        
        img.save(os.path.join(self.output_dir, 'enemy_fast.png'))
        
    def create_bullets(self):
        """创建子弹"""
        # 玩家子弹
        size = 20
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 蓝色能量弹
        draw.ellipse([5, 2, 15, 18], fill=(0, 200, 255, 255))
        draw.ellipse([7, 4, 13, 16], fill=(100, 220, 255, 200))
        
        img.save(os.path.join(self.output_dir, 'bullet_player.png'))
        
        # 敌人子弹
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 红色能量弹
        draw.ellipse([5, 2, 15, 18], fill=(255, 50, 50, 255))
        draw.ellipse([7, 4, 13, 16], fill=(255, 150, 150, 200))
        
        img.save(os.path.join(self.output_dir, 'bullet_enemy.png'))
        
        # 激光束
        img = Image.new('RGBA', (8, 40), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        draw.rectangle([2, 0, 6, 40], fill=(255, 255, 255, 255))
        draw.rectangle([3, 0, 5, 40], fill=(0, 255, 255, 255))
        
        img.save(os.path.join(self.output_dir, 'laser_beam.png'))
        
    def create_explosions(self):
        """创建爆炸效果帧"""
        for frame in range(8):
            size = 60
            img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # 爆炸的不同阶段
            radius = int(5 + frame * 4)
            alpha = int(255 - frame * 30)
            
            # 外圈
            color_outer = (255, 100, 0, alpha)
            draw.ellipse([size//2-radius, size//2-radius, 
                         size//2+radius, size//2+radius], fill=color_outer)
            
            # 中圈
            radius_mid = int(radius * 0.7)
            color_mid = (255, 200, 0, alpha)
            draw.ellipse([size//2-radius_mid, size//2-radius_mid, 
                         size//2+radius_mid, size//2+radius_mid], fill=color_mid)
            
            # 内圈
            radius_inner = int(radius * 0.4)
            color_inner = (255, 255, 200, alpha)
            draw.ellipse([size//2-radius_inner, size//2-radius_inner, 
                         size//2+radius_inner, size//2+radius_inner], fill=color_inner)
            
            img.save(os.path.join(self.output_dir, f'explosion_{frame}.png'))
            
    def create_background_stars(self):
        """创建背景星空"""
        width, height = 1920, 1080
        img = Image.new('RGB', (width, height), (5, 5, 20))
        draw = ImageDraw.Draw(img)
        
        # 添加星星
        for _ in range(200):
            x = random.randint(0, width)
            y = random.randint(0, height)
            brightness = random.randint(100, 255)
            size = random.choice([1, 1, 1, 2, 2, 3])
            
            color = (brightness, brightness, brightness)
            if size == 1:
                draw.point((x, y), fill=color)
            else:
                draw.ellipse([x-size//2, y-size//2, x+size//2, y+size//2], fill=color)
        
        # 添加遥远的星云
        for _ in range(10):
            x = random.randint(0, width)
            y = random.randint(0, height)
            radius = random.randint(20, 80)
            
            # 创建渐变效果
            for r in range(radius, 0, -5):
                alpha = int(30 * (radius - r) / radius)
                color = (random.randint(50, 150), random.randint(20, 100), 
                        random.randint(100, 200), alpha)
                
                # 由于PIL不直接支持alpha混合，我们简化处理
                base_color = (color[0]//4, color[1]//4, color[2]//4)
                draw.ellipse([x-r, y-r, x+r, y+r], fill=base_color)
        
        img.save(os.path.join(self.output_dir, 'background_stars.jpg'))
        
    def create_ui_elements(self):
        """创建UI元素"""
        # 开始按钮
        width, height = 200, 60
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 按钮背景
        draw.rounded_rectangle([0, 0, width-1, height-1], radius=15, 
                              fill=(0, 100, 200, 200), outline=(0, 150, 255, 255), width=2)
        
        # 按钮高光
        draw.rounded_rectangle([5, 5, width-6, height//2], radius=10, 
                              fill=(100, 180, 255, 100))
        
        img.save(os.path.join(self.output_dir, 'button_start.png'))
        
        # 暂停按钮
        size = 40
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        draw.ellipse([0, 0, size-1, size-1], fill=(100, 100, 100, 200), 
                    outline=(200, 200, 200, 255), width=2)
        
        # 暂停符号
        draw.rectangle([12, 10, 16, 30], fill=(255, 255, 255, 255))
        draw.rectangle([24, 10, 28, 30], fill=(255, 255, 255, 255))
        
        img.save(os.path.join(self.output_dir, 'button_pause.png'))
        
        # 生命值图标
        size = 30
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 心形
        heart_points = []
        for i in range(360):
            t = math.radians(i)
            x = 16 * (math.sin(t)**3)
            y = -13 * math.cos(t) + 5 * math.cos(2*t) + 2 * math.cos(3*t) + math.cos(4*t)
            heart_points.append((x + size//2, y + size//2))
        
        draw.polygon(heart_points, fill=(255, 50, 50, 255))
        
        img.save(os.path.join(self.output_dir, 'icon_health.png'))
        
    def create_power_ups(self):
        """创建道具"""
        # 生命恢复道具
        size = 30
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 绿色十字
        draw.rectangle([size//2-3, 5, size//2+3, size-5], fill=(0, 255, 0, 255))
        draw.rectangle([5, size//2-3, size-5, size//2+3], fill=(0, 255, 0, 255))
        
        # 光晕效果
        draw.ellipse([3, 3, size-3, size-3], outline=(100, 255, 100, 150), width=2)
        
        img.save(os.path.join(self.output_dir, 'powerup_health.png'))
        
        # 武器升级道具
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 橙色闪电
        lightning_points = [(15, 5), (10, 12), (18, 12), (12, 20), (20, 20), (8, 25)]
        draw.polygon(lightning_points, fill=(255, 200, 0, 255))
        
        # 光晕
        draw.ellipse([3, 3, size-3, size-3], outline=(255, 255, 100, 150), width=2)
        
        img.save(os.path.join(self.output_dir, 'powerup_weapon.png'))
        
        # 护盾道具
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 蓝色盾牌
        shield_points = [(15, 5), (25, 10), (25, 20), (15, 25), (5, 20), (5, 10)]
        draw.polygon(shield_points, fill=(0, 150, 255, 255), outline=(0, 100, 200, 255))
        
        # 内部细节
        draw.ellipse([10, 10, 20, 20], outline=(100, 200, 255, 255), width=2)
        
        img.save(os.path.join(self.output_dir, 'powerup_shield.png'))
    
    def create_particle_effects(self):
        """创建粒子效果"""
        # 星尘粒子
        for i in range(5):
            size = 8
            img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            alpha = 255 - i * 40
            color = (255, 255, 255, alpha)
            
            if i == 0:
                draw.ellipse([2, 2, 6, 6], fill=color)
            else:
                draw.ellipse([3, 3, 5, 5], fill=color)
            
            img.save(os.path.join(self.output_dir, f'particle_star_{i}.png'))
        
        # 引擎尾焰
        for frame in range(4):
            width, height = 20, 30
            img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # 随机化尾焰形状
            flame_height = height - frame * 3
            flame_points = [
                (width//2, 0),
                (width//2 + random.randint(-3, 3), flame_height//3),
                (width//2 + random.randint(-5, 5), flame_height*2//3),
                (width//2 + random.randint(-2, 2), flame_height)
            ]
            
            # 外焰
            outer_points = [(p[0]-3, p[1]) for p in flame_points] + [(p[0]+3, p[1]) for p in reversed(flame_points)]
            draw.polygon(outer_points, fill=(255, 100, 0, 200))
            
            # 内焰
            inner_points = [(p[0]-1, p[1]) for p in flame_points] + [(p[0]+1, p[1]) for p in reversed(flame_points)]
            draw.polygon(inner_points, fill=(255, 200, 0, 255))
            
            img.save(os.path.join(self.output_dir, f'engine_flame_{frame}.png'))

    def create_hex_pattern(self, size, color1, color2):
        """创建六边形纹理"""
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        radius = center - 5
        
        # 外六边形
        hex_points = []
        for i in range(6):
            angle = i * math.pi / 3
            x = center + radius * math.cos(angle)
            y = center + radius * math.sin(angle)
            hex_points.append((x, y))
        
        draw.polygon(hex_points, fill=color1, outline=color2, width=2)
        
        # 内六边形
        inner_radius = radius * 0.6
        inner_hex = []
        for i in range(6):
            angle = i * math.pi / 3
            x = center + inner_radius * math.cos(angle)
            y = center + inner_radius * math.sin(angle)
            inner_hex.append((x, y))
        
        draw.polygon(inner_hex, fill=color2, outline=color1, width=1)
        
        return img
    
    def create_energy_orb(self, size, colors):
        """创建能量球效果"""
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        
        # 多层光环
        for i, color in enumerate(colors):
            radius = center - i * 5
            if radius > 0:
                alpha = 255 - i * 40
                color_with_alpha = (*ImageDraw.ImageColor.getrgb(color), alpha)
                draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                           fill=color_with_alpha)
        
        return img
    
    def create_lightning_bolt(self, width, height, color):
        """创建闪电效果"""
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 生成随机闪电路径
        points = [(width//4, 0)]
        y = 0
        x = width // 4
        
        while y < height:
            y += random.randint(10, 20)
            x += random.randint(-15, 15)
            x = max(5, min(width-5, x))
            points.append((x, y))
        
        # 绘制主闪电
        for i in range(len(points)-1):
            draw.line([points[i], points[i+1]], fill=color, width=3)
        
        # 添加分支
        for i in range(1, len(points)-1, 2):
            if random.random() < 0.6:
                branch_x = points[i][0] + random.randint(-20, 20)
                branch_y = points[i][1] + random.randint(-10, 10)
                draw.line([points[i], (branch_x, branch_y)], fill=color, width=2)
        
        return img
    
    def create_advanced_enemies(self):
        """创建高级敌人类型"""
        # 分裂敌人
        size = 45
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        # 主体 - 晶体形状
        crystal_points = []
        for i in range(8):
            angle = i * self.pi2 / 8
            radius = center - 5 if i % 2 == 0 else center - 15
            x = center + radius * math.cos(angle)
            y = center + radius * math.sin(angle)
            crystal_points.append((x, y))
        
        draw.polygon(crystal_points, fill='#ff4500', outline='#ffd700', width=2)
        
        # 中心核心
        draw.ellipse([center-8, center-8, center+8, center+8], fill='#ffff00')
        
        img.save(os.path.join(self.output_dir, 'enemy_splitter.png'))
        
        # 护盾敌人
        size = 50
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        # 主体
        draw.ellipse([10, 10, size-10, size-10], fill='#4169e1', outline='#00bfff', width=3)
        
        # 护盾环
        for i in range(3):
            radius = center - 5 - i * 8
            alpha = 100 - i * 20
            shield_color = (*ImageDraw.ImageColor.getrgb('#87ceeb'), alpha)
            draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                        outline=shield_color, width=2)
        
        img.save(os.path.join(self.output_dir, 'enemy_shielded.png'))
        
        # 隐形敌人（半透明）
        size = 40
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 轮廓形状
        points = [(size//2, 5), (5, size-5), (size//2, size-15), (size-5, size-5)]
        draw.polygon(points, fill=(255, 255, 255, 80), outline=(255, 255, 255, 150))
        
        # 扫描线效果
        for y in range(5, size-5, 3):
            draw.line([(5, y), (size-5, y)], fill=(0, 255, 255, 100), width=1)
        
        img.save(os.path.join(self.output_dir, 'enemy_stealth.png'))
        
        # 蜂群敌人（小型）
        size = 25
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        # 六边形身体
        hex_img = self.create_hex_pattern(size, '#32cd32', '#7fff00')
        img.paste(hex_img, (0, 0), hex_img)
        
        img.save(os.path.join(self.output_dir, 'enemy_swarm.png'))
        
        # Boss敌人 - 多形态
        self.create_boss_enemies()
    
    def create_boss_enemies(self):
        """创建Boss敌人"""
        # Boss 1: 机械要塞
        size = 120
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        
        # 主体
        draw.rectangle([20, 30, size-20, size-20], fill='#2f4f4f', outline='#696969', width=3)
        
        # 炮塔
        turret_positions = [(30, 35), (size-30, 35), (center, 20)]
        for pos in turret_positions:
            draw.ellipse([pos[0]-8, pos[1]-8, pos[0]+8, pos[1]+8], 
                        fill='#8b0000', outline='#ff4500', width=2)
        
        # 护甲板
        for i in range(3):
            y = 40 + i * 15
            draw.rectangle([25, y, size-25, y+8], fill='#483d8b', outline='#9370db')
        
        # 引擎
        draw.ellipse([center-15, size-25, center+15, size-10], 
                    fill='#ff4500', outline='#ffd700', width=2)
        
        img.save(os.path.join(self.output_dir, 'boss_fortress.png'))
        
        # Boss 2: 有机体
        size = 100
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        
        # 主体 - 有机形状
        organic_points = []
        for i in range(12):
            angle = i * self.pi2 / 12
            radius = center - 10 + math.sin(i) * 8
            x = center + radius * math.cos(angle)
            y = center + radius * math.sin(angle)
            organic_points.append((x, y))
        
        draw.polygon(organic_points, fill='#9400d3', outline='#ba55d3', width=2)
        
        # 触手
        for i in range(6):
            angle = i * self.pi2 / 6
            start_x = center + 30 * math.cos(angle)
            start_y = center + 30 * math.sin(angle)
            end_x = center + 45 * math.cos(angle)
            end_y = center + 45 * math.sin(angle)
            
            draw.line([(start_x, start_y), (end_x, end_y)], fill='#8a2be2', width=4)
            draw.ellipse([end_x-3, end_y-3, end_x+3, end_y+3], fill='#ff69b4')
        
        # 中心眼睛
        draw.ellipse([center-12, center-12, center+12, center+12], fill='#ff0000')
        draw.ellipse([center-6, center-6, center+6, center+6], fill='#000000')
        
        img.save(os.path.join(self.output_dir, 'boss_organic.png'))
    
    def create_advanced_weapons(self):
        """创建高级武器效果"""
        # 等离子炮
        width, height = 30, 8
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 能量核心
        draw.ellipse([0, 2, 8, 6], fill='#00ffff')
        draw.rectangle([8, 3, width-5, 5], fill='#87ceeb')
        draw.ellipse([width-8, 1, width, 7], fill='#4169e1')
        
        img.save(os.path.join(self.output_dir, 'weapon_plasma.png'))
        
        # 散弹枪弹丸
        size = 6
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        draw.ellipse([0, 0, size, size], fill='#ffd700', outline='#ff8c00')
        
        img.save(os.path.join(self.output_dir, 'bullet_shotgun.png'))
        
        # 导弹
        width, height = 20, 40
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 弹头
        draw.ellipse([5, 0, 15, 10], fill='#ff4500')
        # 弹体
        draw.rectangle([6, 10, 14, 30], fill='#2f4f4f', outline='#696969')
        # 尾翼
        draw.polygon([(2, 25), (6, 30), (6, 35), (2, 40)], fill='#8b0000')
        draw.polygon([(14, 30), (18, 25), (18, 40), (14, 35)], fill='#8b0000')
        
        img.save(os.path.join(self.output_dir, 'weapon_missile.png'))
        
        # 能量波
        width, height = 60, 20
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 波形效果
        for x in range(0, width, 2):
            wave_height = int(5 * math.sin(x * 0.3) + 10)
            draw.line([(x, wave_height-5), (x, wave_height+5)], fill='#ffff00', width=2)
        
        img.save(os.path.join(self.output_dir, 'weapon_wave.png'))
    
    def create_environmental_hazards(self):
        """创建环境危险"""
        # 流星
        size = 35
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 不规则岩石形状
        meteor_points = []
        center = size // 2
        for i in range(8):
            angle = i * self.pi2 / 8
            radius = center - 5 + random.randint(-3, 3)
            x = center + radius * math.cos(angle)
            y = center + radius * math.sin(angle)
            meteor_points.append((x, y))
        
        draw.polygon(meteor_points, fill='#8b4513', outline='#a0522d', width=2)
        
        # 表面细节
        for _ in range(5):
            x, y = random.randint(8, size-8), random.randint(8, size-8)
            draw.ellipse([x-2, y-2, x+2, y+2], fill='#654321')
        
        img.save(os.path.join(self.output_dir, 'hazard_meteor.png'))
        
        # 黑洞
        size = 80
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        
        # 吸积盘
        for i in range(10):
            radius = center - i * 3
            alpha = 255 - i * 25
            color = (128, 0, 128, alpha) if i % 2 == 0 else (75, 0, 130, alpha)
            draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                        outline=color, width=2)
        
        # 事件视界
        draw.ellipse([center-8, center-8, center+8, center+8], fill='#000000')
        
        img.save(os.path.join(self.output_dir, 'hazard_blackhole.png'))
        
        # 能量场
        size = 60
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        
        # 电弧效果
        lightning = self.create_lightning_bolt(size, size, '#00ffff')
        img = Image.alpha_composite(img, lightning)
        
        # 外围能量环
        draw.ellipse([5, 5, size-5, size-5], outline='#87ceeb', width=2)
        
        img.save(os.path.join(self.output_dir, 'hazard_energyfield.png'))
    
    def create_collectibles(self):
        """创建收集品"""
        # 经验宝石
        colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
        sizes = [15, 20, 25, 30, 35]
        
        for i, (color, size) in enumerate(zip(colors, sizes)):
            img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            center = size // 2
            
            # 宝石主体
            gem_points = []
            for j in range(6):
                angle = j * self.pi2 / 6
                radius = center - 3
                x = center + radius * math.cos(angle)
                y = center + radius * math.sin(angle)
                gem_points.append((x, y))
            
            draw.polygon(gem_points, fill=color, outline='#ffffff', width=1)
            
            # 内部反光
            inner_points = []
            for j in range(6):
                angle = j * self.pi2 / 6
                radius = (center - 3) * 0.6
                x = center + radius * math.cos(angle)
                y = center + radius * math.sin(angle)
                inner_points.append((x, y))
            
            lighter_color = tuple(min(255, c + 50) for c in ImageDraw.ImageColor.getrgb(color))
            draw.polygon(inner_points, fill=lighter_color)
            
            img.save(os.path.join(self.output_dir, f'gem_xp_{i+1}.png'))
        
        # 金币
        size = 20
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        draw.ellipse([2, 2, size-2, size-2], fill='#ffd700', outline='#ffb347', width=2)
        draw.ellipse([5, 5, size-5, size-5], fill='#fff8dc')
        
        # $ 符号
        draw.text((center-3, center-4), '$', fill='#ff8c00', font=None)
        
        img.save(os.path.join(self.output_dir, 'coin.png'))
    
    def create_ui_decorations(self):
        """创建UI装饰元素"""
        # 边框装饰
        width, height = 200, 20
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 科技感边框
        draw.rectangle([0, 0, width-1, height-1], outline='#00ffff', width=2)
        
        # 内部纹理
        for i in range(0, width, 4):
            alpha = int(100 * (1 - abs(i - width//2) / (width//2)))
            color = (0, 255, 255, alpha)
            draw.line([(i, 2), (i, height-2)], fill=color)
        
        img.save(os.path.join(self.output_dir, 'ui_border.png'))
        
        # 雷达图标
        size = 40
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center = size // 2
        
        # 雷达圆环
        for i in range(3):
            radius = center - i * 6
            draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                        outline='#00ff00', width=1)
        
        # 扫描线
        draw.line([(center, center), (center + center-5, center)], fill='#00ff00', width=2)
        draw.line([(center, center), (center, 5)], fill='#00ff00', width=2)
        
        img.save(os.path.join(self.output_dir, 'ui_radar.png'))
    
    def create_combo_effects(self):
        """创建连击效果"""
        # 连击数字背景
        for combo in range(1, 11):
            size = 40 + combo * 5
            img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            center = size // 2
            
            # 发光环
            color_intensity = min(255, 100 + combo * 15)
            glow_color = (255, color_intensity, 0, 150)
            
            for i in range(5):
                radius = center - i * 3
                alpha = 150 - i * 30
                draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                           outline=(*glow_color[:3], alpha), width=2)
            
            img.save(os.path.join(self.output_dir, f'combo_bg_{combo}.png'))
    
    def generate_all_assets(self):
        """生成所有增强版资源"""
        print("=== 正在生成超级增强版游戏资源 ===")
        
        print("- 创建玩家飞船...")
        self.create_player_ship()
        
        print("- 创建基础敌人...")
        self.create_enemy_ships()
        
        print("- 创建高级敌人...")
        self.create_advanced_enemies()
        
        print("- 创建子弹系统...")
        self.create_bullets()
        
        print("- 创建高级武器...")
        self.create_advanced_weapons()
        
        print("- 创建爆炸效果...")
        self.create_explosions()
        
        print("- 创建背景星空...")
        self.create_background_stars()
        
        print("- 创建UI元素...")
        self.create_ui_elements()
        
        print("- 创建UI装饰...")
        self.create_ui_decorations()
        
        print("- 创建道具...")
        self.create_power_ups()
        
        print("- 创建收集品...")
        self.create_collectibles()
        
        print("- 创建粒子效果...")
        self.create_particle_effects()
        
        print("- 创建环境危险...")
        self.create_environmental_hazards()
        
        print("- 创建连击效果...")
        self.create_combo_effects()
        
        print("=== 所有超级游戏资源生成完成！共生成了 100+ 个资源文件！ ===")

if __name__ == "__main__":
    generator = SuperGameAssetGenerator()
    generator.generate_all_assets()
