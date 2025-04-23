# github-search-proxy
A Proxy to GitHubs Users Search using nodejs and Docker.

How to run the solution:
docker build -t github-search-proxy .
docker run -p 8000:8000 github-search-proxy

Then you should be able to access via:
http://localhost:8000/search?q=<search-query>

Enjoy!