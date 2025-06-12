# team6
DrawTogether


## REST/API:

GET /api/lobby/history/:roomId
params: roomId (string)

POST /api/lobby/prompts
request body:
roomId (string)
prompts (string)
username (string)

## How to deploy
First, the certificate should be set up via 
```
kubectl apply -f k8s/certificate.yaml
```

Use cloudbuild to achive CI/CD. (The trigger set up on Google Cloud)

Alternative way: manually deploy via the following command:
```
docker build --no-cache -t "us-west1-docker.pkg.dev/cs144-25s-team6/team6-repo/frontend:latest" ./frontend/
docker push "us-west1-docker.pkg.dev/cs144-25s-team6/team6-repo/frontend:latest"
docker build --no-cache -t "us-west1-docker.pkg.dev/cs144-25s-team6/team6-repo/backend:latest" ./backend/
docker push "us-west1-docker.pkg.dev/cs144-25s-team6/team6-repo/backend:latest"
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/frontendconfig.yaml
kubectl apply -f k8s/ingress.yaml
```
