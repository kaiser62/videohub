FROM nginx:alpine
COPY dist /usr/share/nginx/html
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } location /index.html { add_header Cache-Control "no-cache, must-revalidate"; } location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; } }' > /etc/nginx/conf.d/default.conf
