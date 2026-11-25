# Frontend Web - Servidor Nginx para archivos estáticos (HTML/CSS/JS)
FROM nginx:alpine

# Copiar el código fuente estático dentro del directorio de publicación de Nginx
COPY . /usr/share/nginx/html

# Exponer el puerto estándar HTTP
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
