FROM node:16

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

# Install app dependencies
RUN npm install
# RUN npm install -g npm@8.6.0

# Bundle app source
COPY . .
