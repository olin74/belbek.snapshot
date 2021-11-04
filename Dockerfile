FROM node:alpine
USER nobody
WORKDIR app
EXPOSE 80
RUN npm i
RUN npm build
CMD npm start