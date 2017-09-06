#!/bin/bash
set -e

source ~/.bash_profile

install() {
    rm -Rf app/cache/*
    rm -Rf node_modules/
    gosu docker composer install
    gosu docker npm install
    gosu docker gulp
    gosu docker php app/console assets:install
}

tests() {
    echo "There are no tests"
}

run() {
    supervisord
}

permission() {
    chown -Rf docker:docker .
}

case "$1" in
"install")
    echo "Install"
    install
    ;;
"tests")
    echo "Tests"
    tests
    ;;
"run")
    echo "Run"
    run
    ;;
"permission")
    echo "Permission"
    permission
    ;;
*)
    echo "Custom command : $@"
    exec "$@"
    ;;
esac