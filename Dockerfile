FROM node:alpine

EXPOSE 80

workdir /usr/app
copy ./ /usr/app

run yarn
run yarn build
CMD yarn start