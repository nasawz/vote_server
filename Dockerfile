FROM node:carbon

RUN mkdir -p /vote_server
COPY ./dist /vote_server/
COPY ./node_modules /vote_server/node_modules
COPY ./package.json /vote_server/package.json

RUN mkdir -p /vote_server/config
VOLUME /vote_server/config

RUN mkdir -p /vote_server/cloud
VOLUME /vote_server/cloud

RUN mkdir -p /vote_server/static
VOLUME /vote_server/static

WORKDIR /vote_server

# RUN npm install && \
#     npm run build

ENV PORT=1337

EXPOSE $PORT

ENTRYPOINT ["npm", "start", "--"]
