# vite-press-blog

## 安装教程

sudo dnf update -y
sudo dnf install -y nodejs npm git

git clone https://gitee.com/yyx_dev/vite-press-blog.git
cd vite-press-blog

npm install
npm run docs:dev
npm run docs:build

sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

sudo mkdir -p /var/www/html/vite-press-blog
sudo cp -r .vitepress/dist/* /var/www/html/vite-press-blog
sudo vim /etc/nginx/conf.d/vite-press-blog.conf

server {
    listen 80;

    root /var/www/html/vite-press-blog;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

sudo nginx -t
sudo systemctl restart nginx
