FROM golang:latest

LABEL maintainer="Otávio Augusto Gallego <otavioag99@gmail.com>"

WORKDIR /api

COPY . .

RUN go mod download

RUN go build

CMD ["./api"]