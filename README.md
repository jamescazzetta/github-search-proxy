# Github Proxy API
A Proxy to GitHubs Users Search using nodejs and Docker.

## How to run the solution:
docker build -t github-search-proxy .
docker run -p 8000:8000 github-search-proxy

## You should be able to access via:
http://localhost:8000/search?q=<search-query>

## Access Swagger Documentation here:
http://localhost:8000/api-docs

Enjoy!
