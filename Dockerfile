FROM node:carbon

RUN mkdir -p /nasawz-server
COPY ./dist /nasawz-server/
COPY ./node_modules /nasawz-server/node_modules
COPY ./package.json /nasawz-server/package.json

RUN mkdir -p /nasawz-server/config
VOLUME /nasawz-server/config

RUN mkdir -p /nasawz-server/cloud
VOLUME /nasawz-server/cloud

WORKDIR /nasawz-server

# RUN npm install && \
#     npm run build

ENV PORT=1337

EXPOSE $PORT

ENTRYPOINT ["npm", "start", "--"]
