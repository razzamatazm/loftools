FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only what the site serves. Everything copied here is public on the internet, and the
# repo also holds loan doc templates and internal notes, so add new files by name.
COPY index.html consumerdebt.html styles.css app.js loan-docs-data.js /usr/share/nginx/html/
COPY install/ /usr/share/nginx/html/install/
COPY userscripts/*.user.js /usr/share/nginx/html/userscripts/

EXPOSE 80
