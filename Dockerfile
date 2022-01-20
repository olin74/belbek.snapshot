FROM node:alpine
RUN apk add --no-cache chromium
EXPOSE 80

workdir /usr/app
copy ./ /usr/app
run yarn
CMD yarn start