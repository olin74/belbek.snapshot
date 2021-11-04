FROM node:alpine
USER nobody
workdir /usr/app
copy ./ /usr/app
EXPOSE 80
RUN npm i
RUN npm build
CMD npm start