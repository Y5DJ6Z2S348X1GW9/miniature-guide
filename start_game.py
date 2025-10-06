#!/usr/bin/env python3
"""
游戏启动脚本
启动本地HTTP服务器并打开游戏页面
"""

import http.server
import socketserver
import webbrowser
import threading
import time
import os
import sys

def start_server(port=8000):
    """启动HTTP服务器"""
    try:
        # 确保在正确的目录中
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # 创建HTTP服务器
        handler = http.server.SimpleHTTPRequestHandler
        
        # 设置MIME类型以支持所有文件
        handler.extensions_map.update({
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.html': 'text/html',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg'
        })
        
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"🚀 太空射击游戏服务器启动成功！")
            print(f"📍 服务器地址: http://localhost:{port}")
            print(f"🎮 游戏页面: http://localhost:{port}/index.html")
            print(f"📁 当前目录: {os.getcwd()}")
            print(f"⏰ 启动时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
            print("="*60)
            print("🎯 游戏控制说明:")
            print("   WASD/方向键 - 移动")
            print("   空格键 - 射击")
            print("   X键 - 激活子弹时间")
            print("   C键 - 切换武器")
            print("   P键 - 暂停/继续")
            print("   F键 - 全屏切换")
            print("="*60)
            print("🔧 服务器控制:")
            print("   Ctrl+C - 停止服务器")
            print("="*60)
            
            # 在新线程中打开浏览器
            def open_browser():
                time.sleep(1)  # 等待服务器完全启动
                try:
                    webbrowser.open(f'http://localhost:{port}/index.html')
                    print(f"🌐 已在默认浏览器中打开游戏页面")
                except Exception as e:
                    print(f"⚠️  无法自动打开浏览器: {e}")
                    print(f"请手动打开: http://localhost:{port}/index.html")
            
            browser_thread = threading.Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()
            
            # 启动服务器
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
        sys.exit(0)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ 端口 {port} 已被占用，尝试使用端口 {port + 1}")
            start_server(port + 1)
        else:
            print(f"❌ 启动服务器失败: {e}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        sys.exit(1)

def check_game_files():
    """检查游戏文件完整性"""
    required_files = [
        'index.html',
        'css/main.css',
        'js/main.js',
        'scripts/generate_assets.py'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ 缺少以下必需文件:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        print("\n请确保所有游戏文件都已正确创建！")
        return False
    
    # 检查资源目录
    if not os.path.exists('assets'):
        print("📁 资源目录不存在，正在创建...")
        os.makedirs('assets/images', exist_ok=True)
        
        # 运行资源生成脚本
        try:
            print("🎨 正在生成游戏资源...")
            os.system('python scripts/generate_assets.py')
            print("✅ 游戏资源生成完成！")
        except Exception as e:
            print(f"⚠️  资源生成失败: {e}")
    
    return True

def print_game_info():
    """打印游戏信息"""
    print("🎮" + "="*58 + "🎮")
    print("🚀               超级太空射击游戏 - 增强版               🚀")
    print("🎮" + "="*58 + "🎮")
    print()
    print("✨ 游戏特色:")
    print("   🔥 连击系统 - 最高5倍分数加成")
    print("   ⏰ 时间操控 - 子弹时间、时间冻结、时间加速")
    print("   🔫 8种武器 - 等离子炮、散弹枪、导弹、激光束等")
    print("   👾 高级敌人 - 分裂虫、护盾兵、隐形敌人、蜂群")
    print("   🏆 进展系统 - 等级提升、技能树、装备商店")
    print("   🌪️ 环境危险 - 流星雨、黑洞、虫洞、能量场")
    print("   🐉 史诗Boss - 机械要塞、有机体母舰、水晶守护者")
    print("   🎵 动态音乐 - 根据游戏状态自适应音乐")
    print()
    print("📊 技术特性:")
    print("   🖼️  62个Python生成的游戏资源")
    print("   📝 13个模块化JavaScript文件")
    print("   🎨 6个专业CSS样式文件")
    print("   🔊 增强3D位置音效系统")
    print("   📱 完全响应式设计")
    print()

if __name__ == "__main__":
    # 显示游戏信息
    print_game_info()
    
    # 检查文件完整性
    if not check_game_files():
        input("按回车键退出...")
        sys.exit(1)
    
    # 启动服务器
    try:
        port = 8000
        if len(sys.argv) > 1:
            port = int(sys.argv[1])
        
        start_server(port)
    except ValueError:
        print("❌ 无效的端口号")
        sys.exit(1)
