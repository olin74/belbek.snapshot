FROM node:alpine

EXPOSE 80

workdir /usr/app
copy ./ /usr/app
run yarn global add node-pre-gyp
run yarn
CMD yarn start