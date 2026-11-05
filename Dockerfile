FROM nginx:stable-alpine

COPY index.html application.html styles.css validation.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]