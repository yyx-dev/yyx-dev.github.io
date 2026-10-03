from PIL import Image
import numpy as np
import sys
import os
from pathlib import Path

def make_white_transparent_pil(image_path, output_path, threshold=240):
    """
    将图片的白色部分置为透明
    
    Args:
        image_path: 输入图片路径
        output_path: 输出图片路径
        threshold: 白色阈值，0-255，值越大则越严格（只有纯白才会被置为透明）
    """
    try:
        # 打开图片并转换为RGBA模式
        img = Image.open(image_path).convert('RGBA')
        data = np.array(img)
        
        # 提取RGB通道和Alpha通道
        r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
        
        # 创建白色掩码（RGB值都大于threshold）
        white_mask = (r > threshold) & (g > threshold) & (b > threshold)
        
        # 将白色区域设置为透明
        data[white_mask, 3] = 0
        
        # 保存结果
        result = Image.fromarray(data, 'RGBA')
        result.save(output_path, 'PNG')
        print(f"✅ 处理成功！")
        print(f"📁 输入文件: {image_path}")
        print(f"💾 输出文件: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ 处理失败: {e}")
        return False

def process_image(file_path, threshold=240):
    """
    处理单个图片文件
    """
    # 检查文件是否存在
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return False
    
    # 检查是否为图片文件
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif'}
    file_ext = Path(file_path).suffix.lower()
    if file_ext not in image_extensions:
        print(f"⚠️  不支持的文件格式: {file_ext}")
        print(f"支持格式: {', '.join(image_extensions)}")
        return False
    
    # 构建输出文件名：源文件名_transparent.png
    input_path = Path(file_path)
    output_path = input_path.parent / f"{input_path.stem}_transparent.png"
    
    # 如果输出文件已存在，添加数字后缀
    counter = 1
    while output_path.exists():
        output_path = input_path.parent / f"{input_path.stem}_transparent_{counter}.png"
        counter += 1
    
    # 处理图片
    return make_white_transparent_pil(str(input_path), str(output_path), threshold)

def main():
    """
    主函数：处理拖拽进来的文件
    """
    print("=" * 60)
    print("🎨 图片白色背景去除工具 v1.0")
    print("=" * 60)
    print()
    
    # 获取命令行参数
    if len(sys.argv) < 2:
        print("📌 使用方法:")
        print("   1. 直接拖动图片到本脚本文件上")
        print("   2. 或者在命令行中指定图片路径:")
        print(f"      python {sys.argv[0]} image1.jpg image2.png")
        print()
        input("按 Enter 键退出...")
        return
    
    # 处理所有拖入的文件
    success_count = 0
    fail_count = 0
    
    for i, arg in enumerate(sys.argv[1:], 1):
        print(f"\n📸 处理文件 [{i}/{len(sys.argv)-1}]: {arg}")
        print("-" * 40)
        
        if process_image(arg):
            success_count += 1
        else:
            fail_count += 1
    
    # 显示处理结果统计
    print()
    print("=" * 60)
    print(f"✅ 处理完成！")
    print(f"📊 成功: {success_count} 个")
    if fail_count > 0:
        print(f"❌ 失败: {fail_count} 个")
    print("=" * 60)
    
    # 暂停，让用户看到结果
    print()
    input("按 Enter 键退出...")

if __name__ == "__main__":
    main()