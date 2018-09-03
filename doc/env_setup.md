## 1. Git
如果未安装[Git](https://git-scm.com/downloads)
或者命令行输入
```
sudo apt install git -y
```
检查git是否安装
```
git --version
git version 2.18.0
```
## 2. Golang
安装go语言环境，由于采用Fabric 1.2.0所以需要go语言环境>1.10.x
- [GoLang 下载页](https://golang.org/dl)
- [GoLang 安装](https://golang.org/doc/install)
- [GoLang 文档](https://golang.org/doc/)

golang还有中文网站，[下载页](https://studygolang.com/dl)。验证go安装
```
go version
```
并且还要设置**GOPATH**
## 3. Node.js
下载nodejs
- [Node.js 下载页](https://nodejs.org/en/download/)
验证node.js
```
node -v
v4.2.6
```
## 4. Docker
- [Docker 下载页](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
验证docker安装
```
docker --version
Docker version 18.06.1-ce, build e68fc7a
```
## 5. docker-compose
- [docker-compose 下载页](https://docs.docker.com/compose/)
验证docker-compose安装
```
docker-compose --version
docker-compose version 1.13.0, build 1719ceb
```
## 6. Fabric环境与实例安装
安装Fabric实例
```
git clone https://github.com/hyperledger/fabric-samples
```
安装Fabric环境
```
cd fabric-samples/scripts
sudo ./bootstrap.sh
```
正常安装完成后，查看安装docker
```
sudo docker images

hyperledger/fabric-ca          1.2.0               66cc132bd09c        2 months ago        252MB
hyperledger/fabric-ca          latest              66cc132bd09c        2 months ago        252MB
hyperledger/fabric-tools       1.2.0               379602873003        2 months ago        1.51GB
hyperledger/fabric-tools       latest              379602873003        2 months ago        1.51GB
hyperledger/fabric-ccenv       1.2.0               6acf31e2d9a4        2 months ago        1.43GB
hyperledger/fabric-ccenv       latest              6acf31e2d9a4        2 months ago        1.43GB
hyperledger/fabric-orderer     1.2.0               4baf7789a8ec        2 months ago        152MB
hyperledger/fabric-orderer     latest              4baf7789a8ec        2 months ago        152MB
hyperledger/fabric-peer        1.2.0               82c262e65984        2 months ago        159MB
hyperledger/fabric-peer        latest              82c262e65984        2 months ago        159MB
hyperledger/fabric-zookeeper   0.4.10              2b51158f3898        2 months ago        1.44GB
hyperledger/fabric-zookeeper   latest              2b51158f3898        2 months ago        1.44GB
hyperledger/fabric-kafka       0.4.10              936aef6db0e6        2 months ago        1.45GB
hyperledger/fabric-kafka       latest              936aef6db0e6        2 months ago        1.45GB
hyperledger/fabric-couchdb     0.4.10              3092eca241fc        2 months ago        1.61GB
hyperledger/fabric-couchdb     latest              3092eca241fc        2 months ago        1.61GB
hyperledger/fabric-baseos      amd64-0.4.10        52190e831002        2 months ago        132MB
```

