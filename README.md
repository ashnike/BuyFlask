
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
Create a Docker secret to authenticate with the private docker repository to pull the image.
```
kubectl create secret docker-registry my-registry-secret   --docker-username=<username>   
--docker-password=<PAT-token-value>   
--docker-email=<email-id>   
--namespace=<namespace-name>

```

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
### Communication from one namespace to other
By default, services are accessible from any namespace using the fully qualified domain name (FQDN).
The DNS name format for services in different namespaces is:
```
<service-name>.<namespace>.svc.cluster.local
```
Add the following MONOGODB_URI env to the flask application , edit the secrets.
```
MONOGODB_URI:mongodb://<user-name>:<user-passowrd>@mongo-service.mongo-namespace.svc.cluster.local:27017/<database-name>
```
### HEALTH metrics and Load Testing
**Installing Health metrics**

Download the metrics-server Deployment Manifest
```
curl -LO https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```
Edit the Manifest to Include --kubelet-insecure-tls
Apply the Modified Manifest
After making the changes, apply the updated manifest to your cluster:
```
kubectl apply -f components.yaml
```

**Testing the HPA**

Generate Load Using ApacheBench
```
sudo apt-get install apache2-utils
```
Use ab to simulate load. Replace <your-service-url> with your application’s service URL.
```
ab -n 50000000 -c 200 http://<your-service-url>/
```

### Images:
Successful Deployment
![deployment](images/deployment-minikube.png)

Before Load
![Before Load](images/Before-Load.png)

During Load
![During Load](images/during-load.png)

After Load
![After Load](images/after-load.png)

### Internal Workings 
**DNS Resolution:**
DNS Records: When a service is created, Kubernetes automatically creates DNS records for it. These records map the service name to the service’s cluster IP address, which is used for communication between pods.

Pod DNS Configuration: Pods use the cluster’s DNS service to resolve service names. By default, Kubernetes configures each pod’s DNS settings to use the cluster DNS service, so pods can resolve service names to their respective IP addresses.

DNS Service: Kubernetes includes a built-in DNS service, usually provided by kube-dns or CoreDNS, which resolves service names to IP addresses within the cluster. This service is deployed as a set of pods within the cluster and manages the DNS records for services.

Service Discovery: Each Kubernetes service is assigned a DNS name in the format of <service-name>.<namespace>.svc.cluster.local. This DNS name can be used by other pods within the same or different namespaces to access the service.

By default, services are accessible across namespaces using FQDNs in the format <service-name>.<namespace>.svc.cluster.local.
This allows the Flask application to connect to the MongoDB service within the mongo-namespace by referencing its FQDN in the MONOGODB_URI environment variable.

Format: <service-name>.<namespace>.svc.cluster.local
<service-name>: The name of the Kubernetes Service.
<namespace>: The namespace in which the service is located.

svc.cluster.local: The default DNS suffix used by Kubernetes for services.


**Resource Requests and Limits:**
Resource Limits define the maximum amount of CPU or memory a container can use. These limits prevent a container from consuming more resources than allowed, which could otherwise impact the performance of other containers on the same node.
These are Kubernetes features that allow specifying minimum and maximum resource requirements (CPU, memory) for pods.
Including them helps manage cluster resource allocation and prevent applications from exceeding their bounds.
- CPU Limit: The maximum CPU resources a container can use. If a container tries to use more CPU than its limit, Kubernetes will throttle it.
- Memory Limit: The maximum amount of memory a container can use. If a container exceeds its memory limit, it will be terminated and potentially restarted by Kubernetes.

**Design Choices:**
- Using a private container registry improves security and control over the Docker image.
- A StatefulSet for MongoDB ensures data persistence across pod restarts.
- Using Secrets for sensitive information like credentials enhances security.
- Including an HPA allows automatic scaling based on application load.
