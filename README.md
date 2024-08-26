
# Two-tier Flask Application


## Flask App with MongoDB on Kubernetes
Welcome to the Flask App with MongoDB on Kubernetes project! This repository contains the code and configurations for deploying a Flask application with MongoDB using Kubernetes. The goal of this project is to demonstrate how to containerize a Flask app, set up a MongoDB database with authentication, and deploy them on a Kubernetes cluster with best practices like persistent storage, resource management, and autoscaling.

### Project Overview
This project includes:
ash@ash-Pinaka:~/Documents/BuyFlask$ tree
```
.
├── app.py
├── docker-compose.yml
├── Dockerfile
├── flaskk8s
│   ├── flask-deploy.yaml
│   ├── flask-secret.yaml
│   └── hpa.yaml
├── mongo-init.js
├── monk8s
│   ├── conf.yaml
│   ├── mongodb-pv.yaml
│   ├── mstate.yaml
│   └── secret.yaml
├── namespace.yaml
├── README.md
└── requirements.txt
```
Flask Application: A simple Python Flask app with two endpoints:
- GET /: Returns a welcome message along with the current date and time.
- GET/POST /data: Allows storing and retrieving data from MongoDB.
MongoDB: A database configured with authentication to securely store data.
Kubernetes Setup: Deployment of the Flask app and MongoDB using Kubernetes, with services, persistent volumes, and autoscaling configured.

### Deployment Steps
Use Github action pipeline for containerzing the flask and pushing it to a private repository.
```
├── .github
    ├── workflows
        ├── release-please.yml
```
When you push to the main branch, ensure that you tag the commit with a version number eg: v1.0.2
```
git tag v1.0  # Create a tag named "v1.0"
git push origin master  # Push the master branch
git push origin --tags  # Push all tags
```
> Note: This tag is required by the docker/metadata-action@v5 ,GitHub Action to extract metadata from Git reference and GitHub events. This action is to tag and label Docker images.

Create a minikube cluster.
```
minikube start
```
First we will create namespaces used to logically divide a cluster into isolated environments.
```
kubectl apply -f namespace.yaml

```
**MongoDB Database Deployment**

Create the Secrets for MongoDB (convert the sensitive information to base64 format):
```
kubectl apply -f monk8s/secret.yaml
```
Create the Persistent Volume (PV) and Persistent Volume Claim (PVC):
```
kubectl apply -f monk8s/mongodb-pv.yaml
```
Apply the MongoDB ConfigMap:
```
kubectl apply -f monk8s/conf.yaml
```
Deploy MongoDB StatefulSet:
```
kubectl apply -f monk8s/mstate.yaml
```
**Flask Application Deployment**

Create the Secrets for Flask:
```
kubectl apply -f flaskk8s/flask-secret.yaml
```
Set Up Autoscaling for Flask:
```
kubectl apply -f flaskk8s/hpa.yaml
```
Deploy the Flask Application:
```
kubectl apply -f flaskk8s/flask-deploy.yaml
```
