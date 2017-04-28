# $ docker run -it --rm --name my-running-script \
# -v "$PWD":/usr/src/app -w /usr/src/app node:4 node your-daemon-or-script.js
# 
# build
#    docker build -t epfldojo/telegram-coreos-update .
# run
#    docker run -p 1337:8080 -d epfldojo/telegram-coreos-update
#    docker run -p 1337:8080 -e BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPKRSTUVWXYZ123456789 epfldojo/telegram-coreos-update
# enter
#    docker exec -it <container id> /bin/bash

FROM node:7.8
MAINTAINER @epfl-dojo

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY index.js /usr/src/app/
RUN npm install

# Bundle app source
# COPY . /usr/src/app

EXPOSE 8080

#CMD ["bash", "-c", "node --inspect index.js & sleep infinity "]
CMD ["node", "index.js"]
